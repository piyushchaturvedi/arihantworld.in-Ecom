import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

// ─── Session config ────────────────────────────────────────────────────────
const ADMIN_SESSION_MINUTES = 30   // Admin auto-logout: 30 minutes of inactivity
const USER_SESSION_MINUTES  = 30   // Regular user auto-logout: 30 minutes of inactivity
const SESSION_KEY = 'arihant-session-ts'

const getSessionAge = () => {
  if (typeof window === 'undefined') return 0
  const ts = sessionStorage.getItem(SESSION_KEY)
  if (!ts) return Infinity
  return (Date.now() - Number(ts)) / 60000 // minutes
}
const refreshSession = () => {
  if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, String(Date.now()))
}
const clearSession = () => {
  if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_KEY)
}

// ===== AUTH STORE =====
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, token: null, isAuthenticated: false,

      setAuth: (user, token) => {
        // Admin: 30 min cookie | Regular user: 30 min cookie (session-length)
        const expiryDays = (30 / 1440) // 30 minutes for all users
        Cookies.set('token', token, {
          expires: expiryDays,
          sameSite: 'strict',
          secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        })
        Cookies.set('userRole', user.role, { expires: expiryDays, sameSite: 'strict' })
        refreshSession()
        set({ user, token, isAuthenticated: true })
      },

      updateUser: (data) => set((s) => ({ user: { ...s.user, ...data } })),

      logout: () => {
        Cookies.remove('token')
        Cookies.remove('userRole')
        clearSession()
        set({ user: null, token: null, isAuthenticated: false })
      },

      // Call on every page/activity — auto-logout after 30 min inactivity
      checkSession: () => {
        const { user, logout } = get()
        if (!user) return true
        const sessionMinutes = USER_SESSION_MINUTES
        if (getSessionAge() > sessionMinutes) {
          logout()
          return false // expired
        }
        refreshSession() // refresh on activity
        return true // valid
      },

      // Backward compat alias
      checkAdminSession: () => get().checkSession(),
    }),
    {
      name: 'arihant-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated })
    }
  )
)

// ===== CART STORE =====
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], coupon: null, couponDiscount: 0,

      addItem: (product, qty = 1, variant = null) => {
        set((state) => {
          const key = product._id + (variant || '')
          const existing = state.items.find(i => (i.productId + (i.variant || '')) === key)
          if (existing) {
            return { items: state.items.map(i => (i.productId + (i.variant || '')) === key ? { ...i, qty: i.qty + qty } : i) }
          }
          // Only show discount if salePrice is strictly less than price (real discount)
          const sellingPrice  = product.salePrice && product.salePrice < product.price
            ? product.salePrice
            : product.price
          return {
            items: [...state.items, {
              productId: product._id, name: product.name,
              price: sellingPrice,
              originalPrice: product.price,
              image: product.images?.find(i => i.isMain)?.url || product.images?.[0]?.url || null,
              category: product.category, icon: product.icon || '🏺',
              slug: product.slug, qty, variant,
            }]
          }
        })
      },

      updateQty: (productId, qty, variant = null) => {
        if (qty < 1) { get().removeItem(productId, variant); return }
        set((s) => ({
          items: s.items.map(i =>
            i.productId === productId && (i.variant || null) === (variant || null)
              ? { ...i, qty }
              : i
          )
        }))
      },

      removeItem: (productId, variant = null) => set((s) => ({
        items: s.items.filter(i =>
          !(i.productId === productId && (i.variant || null) === (variant || null))
        )
      })),
      clearCart: () => set({ items: [], coupon: null, couponDiscount: 0 }),
      applyCoupon: (code, discount) => set({ coupon: code, couponDiscount: discount }),
      removeCoupon: () => set({ coupon: null, couponDiscount: 0 }),
    }),
    {
      name: 'arihant-cart',
      version: 2, // bump version → clears old cart data with wrong originalPrice
      migrate: (persistedState, version) => {
        // Version 1 → 2: old items may have wrong originalPrice (base product price
        // instead of variant price). Safest fix: clear items so user re-adds with
        // correct prices. Coupon/discount state is also reset.
        if (version < 2) return { items: [], coupon: null, couponDiscount: 0 }
        return persistedState
      },
    }
  )
)

// ===== WISHLIST STORE =====
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        if (!get().items.find(i => i._id === product._id)) {
          set((s) => ({ items: [...s.items, product] }))
        }
      },
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i._id !== id) })),
      isWishlisted: (id) => get().items.some(i => i._id === id),
    }),
    { name: 'arihant-wishlist' }
  )
)

// ===== SETTINGS STORE (background sync) =====
// Syncs site settings from API in background. Pages read from here instead of
// each making their own API call — saves N duplicate network requests.
export const useSettingsStore = create((set, get) => ({
  data: null,
  loaded: false,
  lastFetched: 0,
  STALE_MS: 60 * 1000, // re-fetch after 60 seconds

  // Call this once from SettingsProvider; it auto-refreshes every 60s
  init: async (fetchFn) => {
    const doFetch = async () => {
      try {
        const { data } = await fetchFn()
        if (data?.settings) {
          set({ data: data.settings, loaded: true, lastFetched: Date.now() })
        }
      } catch {
        set((s) => ({ ...s, loaded: true })) // mark loaded even on error
      }
    }

    // Initial fetch
    await doFetch()

    // Background refresh every 60 seconds
    const interval = setInterval(doFetch, 60 * 1000)

    // Return cleanup fn
    return () => clearInterval(interval)
  },

  isStale: () => {
    const { lastFetched, STALE_MS } = get()
    return Date.now() - lastFetched > STALE_MS
  },
}))
