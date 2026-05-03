'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuthStore, useCartStore, useWishlistStore } from '@/lib/store'
import { useSettings } from '@/components/providers/SettingsProvider'
import ConsultPopup from '@/components/ui/ConsultPopup'
import GlobalSearch from '@/components/ui/GlobalSearch'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [consultOpen, setConsultOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()
  const cartCount = useCartStore(s => s.items.reduce((t, i) => t + i.qty, 0))
  const { items: wishlist } = useWishlistStore()
  const settings = useSettings()
  const isHome = pathname === '/'

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Always solid charcoal — no transparent on any page
  // const navBg = !scrolled ? 'bg-charcoal/97 backdrop-blur-md shadow-lg' : 'bg-charcoal shadow-lg'
  const navBg = 'bg-charcoal shadow-lg';
  const LogoMark = () => (
    <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      <div className="w-9 h-9 sm:w-10 sm:h-10 border border-gold rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt={settings.name} className="w-full h-full object-contain p-0.5"/>
        ) : (
          <span className="text-gold text-xs sm:text-sm font-serif font-semibold">{settings.logo || 'AW'}</span>
        )}
      </div>
      <div className="hidden xs:block">
        <div className="font-serif text-base sm:text-lg leading-none tracking-wider text-white">{settings.name}</div>
        <div className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-gold">{settings.tagline}</div>
      </div>
    </Link>
  )

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <LogoMark />

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link href="/collections" className="nav-link">Collections</Link>
            <Link href="/products" className="nav-link">Shop All</Link>
            <Link href="/about" className="nav-link">About</Link>
            {isAuthenticated ? (
              <>
                <Link href="/orders" className="nav-link">Orders</Link>
                <Link href="/profile" className="flex items-center gap-1.5 nav-link">
                  <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-white text-[10px] font-serif">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <span>{user?.firstName}</span>
                </Link>
              </>
            ) : (
              <Link href="/auth/login" className="nav-link">Login</Link>
            )}
            <button onClick={() => setConsultOpen(true)}
              className="px-4 py-2 border border-gold text-gold text-xs tracking-widests uppercase hover:bg-gold hover:text-white transition-all duration-300">
              Consult
            </button>

            {/* Search icon */}
            <button onClick={() => setShowSearch(true)} className="flex items-center justify-center w-9 h-9 border border-white/20 hover:border-gold transition-all group" aria-label="Search">
              <svg className="w-4 h-4 text-white group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
            </button>

            {/* Wishlist icon */}
            <Link href="/profile?tab=wishlist" className="relative flex items-center justify-center w-9 h-9 border border-white/20 hover:border-gold transition-all group">
              <svg className="w-4 h-4 text-white group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-white text-[9px] flex items-center justify-center">{wishlist.length}</span>
              )}
            </Link>

            {/* Cart icon */}
            <Link href="/cart" className="relative flex items-center justify-center w-9 h-9 border border-white/20 hover:border-gold transition-all group">
              <svg className="w-4 h-4 text-white group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.874-7.148a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.273M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-white text-[9px] flex items-center justify-center">{cartCount}</span>
              )}
            </Link>
          </div>

          {/* Mobile right icons */}
          <div className="lg:hidden flex items-center gap-2 sm:gap-3">
            <button onClick={() => setShowSearch(true)} className="flex items-center justify-center w-8 h-8" aria-label="Search">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
            </button>
            <Link href="/cart" className="relative flex items-center justify-center w-8 h-8">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.874-7.148a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.273M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
              </svg>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-white text-[9px] flex items-center justify-center">{cartCount}</span>}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="flex flex-col gap-1.5 p-2" aria-label="Menu">
              <span className={`block w-6 h-px bg-white transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-px bg-white transition-all ${mobileOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-4 h-px bg-white transition-all ${mobileOpen ? '-rotate-45 -translate-y-2 w-6' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`lg:hidden bg-charcoal overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen border-t border-white/10' : 'max-h-0'}`}>
          <div className="px-6 py-2 pb-4">
            {[
              {h:'/collections',l:'Collections'},
              {h:'/products',l:'Shop All'},
              {h:'/category/murtis',l:'Murtis'},
              {h:'/category/temples',l:'Temples'},
              {h:'/category/furniture',l:'Furniture'},
              {h:'/category/decor',l:'Décor'},
              {h:'/category/fountains',l:'Fountains'},
              {h:'/about',l:'About'},
            ].map(({h,l}) => (
              <Link key={h} href={h} className="block py-3 text-sm tracking-widests uppercase text-stone border-b border-white/10 hover:text-gold transition-colors">{l}</Link>
            ))}
            <button onClick={() => { setConsultOpen(true); setMobileOpen(false) }}
              className="block w-full text-left py-3 text-sm tracking-widests uppercase text-gold border-b border-white/10">
              Free Consultation
            </button>
            {isAuthenticated ? (
              <>
                <Link href="/orders" className="block py-3 text-sm tracking-widests uppercase text-stone border-b border-white/10 hover:text-gold">My Orders</Link>
                <Link href="/profile" className="block py-3 text-sm tracking-widests uppercase text-stone border-b border-white/10 hover:text-gold">My Profile</Link>
                <Link href="/wallet" className="block py-3 text-sm tracking-widests uppercase text-stone border-b border-white/10 hover:text-gold">My Wallet</Link>
                <button onClick={() => { logout() }} className="block w-full text-left py-3 text-sm tracking-widests uppercase text-red-400">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block py-3 text-sm tracking-widests uppercase text-stone border-b border-white/10 hover:text-gold">Login</Link>
                <Link href="/auth/signup" className="block mt-3 mb-1 text-center py-3 border border-gold text-gold text-sm tracking-widests uppercase hover:bg-gold hover:text-white transition-all">Sign Up Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <ConsultPopup isOpen={consultOpen} onClose={() => setConsultOpen(false)}/>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)}/>}
    </>
  )
}
