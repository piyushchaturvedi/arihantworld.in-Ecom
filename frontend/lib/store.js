import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

const ADMIN_SESSION_MINUTES = 30
const SESSION_KEY = 'arihant-session-ts'

// ─── Security helpers ──────────────────────────────────────
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
        // Cookie: 30 min for admin, 30 days for regular users
        const expiryDays = user.role === 'admin' ? (30 / 1440) : 30
        Cookies.set('token', token, { expires: expiryDays, sameSite: 'strict', secure: window.location.protocol === 'https:' })
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

      // Check if admin session expired (call on each admin page)
      checkAdminSession: () => {
        const { user, logout } = get()
        if (!user || user.role !== 'admin') return true // not admin, skip
        if (getSessionAge() > ADMIN_SESSION_MINUTES) {
          logout()
          return false // expired
        }
        refreshSession() // refresh on activity
        return true // valid
      },
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
          const existing = state.items.find(i => (i.productId + (i.variant||'')) === key)
          if (existing) {
            return { items: state.items.map(i => (i.productId + (i.variant||'')) === key ? { ...i, qty: i.qty + qty } : i) }
          }
          return {
            items: [...state.items, {
              productId: product._id, name: product.name,
              price: product.salePrice || product.price,
              originalPrice: product.price,
              image: product.images?.find(i=>i.isMain)?.url || product.images?.[0]?.url || null,
              category: product.category, icon: product.icon || '🏺',
              slug: product.slug, qty, variant,
            }]
          }
        })
      },

      updateQty: (productId, qty) => {
        if (qty < 1) { get().removeItem(productId); return }
        set((s) => ({ items: s.items.map(i => i.productId === productId ? { ...i, qty } : i) }))
      },

      removeItem: (productId) => set((s) => ({ items: s.items.filter(i => i.productId !== productId) })),
      clearCart: () => set({ items: [], coupon: null, couponDiscount: 0 }),
      applyCoupon: (code, discount) => set({ coupon: code, couponDiscount: discount }),
      removeCoupon: () => set({ coupon: null, couponDiscount: 0 }),
    }),
    { name: 'arihant-cart' }
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
