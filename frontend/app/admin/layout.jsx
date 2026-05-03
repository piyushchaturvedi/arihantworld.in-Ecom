'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

const NAV = [
  { href:'/admin',               label:'Dashboard',      icon:'📊' },
  { href:'/admin/orders',        label:'Orders',         icon:'📦' },
  { href:'/admin/products',      label:'Products',       icon:'🏺' },
  { href:'/admin/users',         label:'Users',          icon:'👥' },
  { href:'/admin/wallet',        label:'Wallet',         icon:'💰' },
  { href:'/admin/coupons',       label:'Coupons',        icon:'🎟️' },
  { href:'/admin/email-templates',label:'Email Templates',icon:'✉️' },
  { href:'/admin/consultations', label:'Consultations',  icon:'💬' },
  { href:'/admin/cms',           label:'CMS Pages',      icon:'📄' },
  { href:'/admin/analytics',     label:'Analytics',      icon:'📈' },
  { href:'/admin/settings',      label:'Settings',       icon:'⚙️' },
]

const ADMIN_TIMEOUT_MS = 30 * 60 * 1000 // 10 minutes

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted]       = useState(false)
  const [dateStr, setDateStr]       = useState('')
  const [timeLeft, setTimeLeft]     = useState(ADMIN_TIMEOUT_MS)
  const pathname  = usePathname()
  const router    = useRouter()
  const { user, logout, isAuthenticated, checkAdminSession } = useAuthStore()
  const timerRef  = useRef(null)
  const lastActivity = useRef(Date.now())

  // ── Session timeout logic ──────────────────────────────
  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now()
    setTimeLeft(ADMIN_TIMEOUT_MS)
  }, [])

  const doLogout = useCallback((reason = 'session') => {
    logout()
    const url = reason === 'session' ? '/auth/login?reason=session_expired' : '/auth/login'
    router.replace(url)
  }, [logout, router])

  useEffect(() => {
    setMounted(true)
    setDateStr(new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' }))

    // Check role immediately
    const { user: u, isAuthenticated: auth } = useAuthStore.getState()
    if (!auth || !u) { router.replace('/auth/login'); return }
    if (u.role !== 'admin') { router.replace('/'); return }

    // Countdown timer
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current
      const remaining = ADMIN_TIMEOUT_MS - elapsed
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        doLogout('session')
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)

    // Activity listeners - reset timer on user activity
    const events = ['mousedown','keydown','touchstart','scroll','click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive:true }))

    return () => {
      clearInterval(timerRef.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [])

  // Re-check session on route change
  useEffect(() => {
    const valid = checkAdminSession()
    if (!valid) doLogout('session')
  }, [pathname])

  const handleLogout = () => { doLogout('manual') }

  // Format remaining time
  const mins = Math.floor(timeLeft / 60000)
  const secs = Math.floor((timeLeft % 60000) / 1000)
  const sessionWarning = timeLeft < 120000 // warn when < 2 min

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`${collapsed?'w-16':'w-60'} bg-[#1a1510] flex-shrink-0 flex flex-col fixed h-full z-40 transition-all duration-300 ${mobileOpen?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className={`p-4 border-b border-white/10 flex items-center ${collapsed?'justify-center':'gap-3'} flex-shrink-0`}>
          <div className="w-9 h-9 border border-gold rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gold text-xs font-serif font-bold">AW</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-serif leading-tight">Arihant World</p>
              <p className="text-gold text-[9px] tracking-widest uppercase">Admin Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : ''}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 mb-0.5 text-xs transition-all duration-200 rounded-sm ${collapsed?'justify-center':''} ${active?'bg-gold text-white':'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <span className="text-base flex-shrink-0">{icon}</span>
                {!collapsed && <span className="tracking-widest uppercase truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex-shrink-0">
          {/* Session timer */}
          {!collapsed && (
            <div className={`mb-3 px-2 py-1.5 rounded text-center ${sessionWarning?'bg-red-900/50':'bg-white/5'}`}>
              <p className={`text-[9px] tracking-widest uppercase ${sessionWarning?'text-red-400':'text-white/30'}`}>Session</p>
              <p className={`text-xs font-mono font-medium ${sessionWarning?'text-red-300':'text-white/50'}`}>
                {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </p>
            </div>
          )}
          {!collapsed && user && (
            <div className="mb-3 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-white/30 text-[10px] truncate">{user.email}</p>
            </div>
          )}
          <div className={`flex gap-2 ${collapsed?'flex-col':''}`}>
            <Link href="/" target="_blank" className="flex-1 py-1.5 border border-white/10 text-white/40 text-xs hover:border-gold hover:text-gold transition-all rounded-sm text-center truncate">
              {collapsed ? '🌐' : 'View Site'}
            </Link>
            <button onClick={() => setCollapsed(!collapsed)} className="py-1.5 px-2 border border-white/10 text-white/40 text-xs hover:border-gold hover:text-gold transition-all rounded-sm">
              {collapsed ? '→' : '←'}
            </button>
            <button onClick={handleLogout} className="flex-1 py-1.5 border border-white/10 text-white/40 text-xs hover:border-red-400 hover:text-red-400 transition-all rounded-sm">
              {collapsed ? '✕' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${collapsed?'lg:ml-16':'lg:ml-60'} min-h-screen`}>
        {/* Mobile topbar */}
        <div className="lg:hidden bg-[#1a1510] flex items-center justify-between px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border border-gold rounded-full flex items-center justify-center">
              <span className="text-gold text-[10px] font-serif">AW</span>
            </div>
            <span className="text-white text-sm font-serif">Admin</span>
          </div>
          {sessionWarning && <span className="text-red-400 text-xs font-mono">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}/>
            </svg>
          </button>
        </div>

        {/* Desktop header */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-3 items-center justify-between sticky top-0 z-20">
          <p className="text-sm text-gray-400">{dateStr}</p>
          <div className="flex items-center gap-4">
            {sessionWarning && (
              <span className="text-red-500 text-xs bg-red-50 border border-red-200 px-3 py-1 rounded-sm">
                ⚠ Session expires in {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </span>
            )}
            <Link href="/" target="_blank" className="text-xs text-gray-400 hover:text-gold transition-colors">View Site →</Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xs font-serif">
              {user?.firstName?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Session expired warning */}
        {sessionWarning && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center justify-between">
            <p className="text-red-700 text-sm">⚠ Your session will expire soon. Click anywhere to extend.</p>
            <button onClick={resetTimer} className="text-xs bg-red-600 text-white px-3 py-1 hover:bg-red-700">Extend</button>
          </div>
        )}

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
