'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Global loading state manager
let setGlobalLoading = null
export const startPageLoad = () => { if (setGlobalLoading) setGlobalLoading(true) }
export const stopPageLoad  = () => { if (setGlobalLoading) setGlobalLoading(false) }

function TransitionBar() {
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [active,  setActive]  = useState(false)
  const [progress,setProgress]= useState(0)
  const [done,    setDone]    = useState(false)

  // Register global setter
  useEffect(() => {
    setGlobalLoading = (v) => {
      if (v) { setActive(true); setDone(false); setProgress(15) }
      else   { setProgress(100); setDone(true) }
    }
    return () => { setGlobalLoading = null }
  }, [])

  // Animate progress while active
  useEffect(() => {
    if (!active || done) return
    const t1 = setTimeout(() => setProgress(p => Math.max(p, 45)), 150)
    const t2 = setTimeout(() => setProgress(p => Math.max(p, 70)), 500)
    const t3 = setTimeout(() => setProgress(p => Math.max(p, 88)), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [active, done])

  // Finish on route change
  useEffect(() => {
    setProgress(100)
    setDone(true)
    const t = setTimeout(() => { setActive(false); setProgress(0); setDone(false) }, 400)
    return () => clearTimeout(t)
  }, [pathname, searchParams])

  // Intercept ALL link/button clicks for immediate feedback
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return
      if (anchor.target === '_blank') return
      // Internal navigation — show loader immediately
      setActive(true); setDone(false); setProgress(15)
    }
    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  if (!active) return null

  return (
    <>
      {/* Top gold progress bar */}
      <div className="fixed top-0 left-0 w-full z-[200] h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gold shadow-[0_0_10px_rgba(184,151,58,0.9)] transition-all ease-out"
          style={{ width:`${progress}%`, transitionDuration: progress === 100 ? '200ms' : '600ms' }}
        />
      </div>
      {/* Spinner toast — only while loading */}
      {!done && (
        <div className="fixed bottom-5 right-5 z-[200] bg-charcoal/95 text-white px-4 py-2.5 shadow-2xl flex items-center gap-2.5 pointer-events-none"
          style={{ animation:'slideUp 0.15s ease-out' }}>
          <div className="w-4 h-4 border-2 border-white/20 border-t-gold rounded-full animate-spin flex-shrink-0"/>
          <span className="text-[11px] tracking-widest uppercase text-white/70">Loading…</span>
        </div>
      )}
    </>
  )
}

export default function PageTransition() {
  return (
    <Suspense fallback={null}>
      <TransitionBar />
    </Suspense>
  )
}
