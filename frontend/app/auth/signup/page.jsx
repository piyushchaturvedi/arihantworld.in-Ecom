'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

// Outside to prevent focus loss on every keystroke
function SignupField({ label, name, type='text', placeholder='', autoComplete='', value, onChange, error, onClearError }) {
  return (
    <div>
      <label className="form-label">{label} *</label>
      <input
        type={type}
        value={value}
        onChange={e => { onChange(name, e.target.value); if (error) onClearError(name) }}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`form-input ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirmPassword:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setServerError('') }
  const clearErr = (k) => setErrors(prev => ({ ...prev, [k]:'' }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (form.phone.replace(/\D/g,'').length < 10) e.phone = 'Enter a valid 10-digit phone number'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[0-9])/.test(form.password)) e.password = 'Password must include at least one number'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setLoading(true); setServerError('')
    try {
      const { data } = await authAPI.signup({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password })
      setAuth(data.user, data.token)
      toast.success(`Welcome to Arihant World, ${data.user.firstName}! 🙏`)
      router.push('/')
    } catch(err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }



  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 border border-gold rounded-full flex items-center justify-center">
            <span className="text-gold text-base font-serif font-semibold">AW</span>
          </div>
          <div>
            <div className="font-serif text-xl text-charcoal">Arihant World</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-gold">Premium Stone Arts</div>
          </div>
        </Link>

        <div className="bg-white border border-stone p-8">
          <h1 className="font-serif text-3xl text-charcoal mb-1">Create Account</h1>
          <p className="text-warm/60 text-sm mb-8">Join Arihant World for exclusive access</p>

          {serverError && (
            <div className="mb-5 bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
              <p className="text-red-700 text-sm">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <SignupField label="First Name" name="firstName" type="text" placeholder="Rajesh" autoComplete="given-name" value={form.firstName} onChange={set} error={errors.firstName} onClearError={clearErr}/>
              <SignupField label="Last Name" name="lastName" type="text" placeholder="Sharma" autoComplete="family-name" value={form.lastName} onChange={set} error={errors.lastName} onClearError={clearErr}/>
            </div>
            <SignupField label="Email" name="email" type="email" placeholder="your@email.com" autoComplete="email" value={form.email} onChange={set} error={errors.email} onClearError={clearErr}/>
            <SignupField label="Phone" name="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel" value={form.phone} onChange={set} error={errors.phone} onClearError={clearErr}/>
            <SignupField label="Password" name="password" type="password" placeholder="Min. 8 characters with a number" autoComplete="new-password" value={form.password} onChange={set} error={errors.password} onClearError={clearErr}/>
            <SignupField label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password" value={form.confirmPassword} onChange={set} error={errors.confirmPassword} onClearError={clearErr}/>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gold text-white text-sm tracking-[0.15em] uppercase hover:bg-gold-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone text-center">
            <p className="text-warm/60 text-sm">Already have an account? <Link href="/auth/login" className="text-gold font-medium hover:underline">Sign in</Link></p>
          </div>
        </div>

        <p className="text-center text-[10px] tracking-widests uppercase text-warm/30 mt-4">
          🔒 Your data is safe. We never share your information.
        </p>
      </div>
    </div>
  )
}
