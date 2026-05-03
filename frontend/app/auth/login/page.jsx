'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email:'', password:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (errors[k]) setErrors(prev => ({ ...prev, [k]:'' })); setServerError('') }

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setLoading(true); setServerError('')
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.user, data.token)
      toast.success(`Welcome back, ${data.user.firstName}!`)
      // router.push(data.user.role === 'admin' ? '/admin' : '/')

      if (data.user.role === 'admin') {
        router.replace('/admin')
      } else {
        router.replace('/')
      }
    } catch(err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      setServerError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 border border-gold rounded-full flex items-center justify-center">
            <span className="text-gold text-base font-serif font-semibold">AW</span>
          </div>
          <div className="text-center">
            <div className="font-serif text-xl text-charcoal">Arihant World</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-gold">Premium Stone Arts</div>
          </div>
        </Link>

        <div className="bg-white border border-stone p-8">
          <h1 className="font-serif text-3xl text-charcoal mb-1">Welcome back</h1>
          <p className="text-warm/60 text-sm mb-8">Sign in to your account</p>

          {serverError && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
              <p className="text-red-700 text-sm">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="form-label">Email Address *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="your@email.com" autoComplete="email"
                className={`form-input ${errors.email ? 'border-red-400 bg-red-50 focus:border-red-500' : ''}`}/>
              {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Password *</label>
                <Link href="/auth/forgot-password" className="text-[10px] text-gold hover:underline tracking-widests uppercase">Forgot?</Link>
              </div>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                className={`form-input ${errors.password ? 'border-red-400 bg-red-50 focus:border-red-500' : ''}`}/>
              {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gold text-white text-sm tracking-[0.15em] uppercase hover:bg-gold-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone text-center">
            <p className="text-warm/60 text-sm">Don't have an account? <Link href="/auth/signup" className="text-gold font-medium hover:underline">Create one</Link></p>
          </div>

          {process.env.NEXT_PUBLIC_ENV === 'development' && (
            <div className="mt-4 bg-stone/30 p-3 rounded-sm text-xs text-warm/50 text-center">
              Dev: <span className="font-mono text-charcoal">admin@arihantworld.com</span> / <span className="font-mono text-charcoal">Admin@123456</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
