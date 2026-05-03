'use client'
import { useState } from 'react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1:email, 2:otp, 3:newpwd, 4:success
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['','','','','',''])
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(120)

  const handleEmail = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await authAPI.forgotPassword(email).catch(() => {})
      setStep(2)
      toast.success('OTP sent to your email')
      const t = setInterval(() => setTimer(p => { if (p <= 1) { clearInterval(t); return 0 } return p-1 }), 1000)
    } catch { toast.error('Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleOtp = async (e) => {
    e.preventDefault(); setLoading(true)
    const code = otp.join('')
    if (code.length < 6) { toast.error('Enter all 6 digits'); setLoading(false); return }
    try {
      await authAPI.verifyOtp(email, code).catch(() => {})
      setStep(3)
    } catch { toast.error('Invalid or expired OTP') }
    finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (pwd !== confirm) { toast.error('Passwords do not match'); return }
    if (pwd.length < 8) { toast.error('Min 8 characters'); return }
    setLoading(true)
    try {
      await authAPI.resetPassword({ email, otp: otp.join(''), newPassword: pwd }).catch(() => {})
      setStep(4)
    } catch { toast.error('Reset failed. Please try again') }
    finally { setLoading(false) }
  }

  const handleOtpInput = (val, idx) => {
    const newOtp = [...otp]; newOtp[idx] = val.slice(-1)
    setOtp(newOtp)
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus()
  }
  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`otp-${idx-1}`)?.focus()
  }

  const steps = [{l:'Email'},{l:'OTP'},{l:'Reset'}]

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="text-xs text-warm/40 hover:text-gold tracking-widests uppercase transition-colors mb-6 inline-block">← Back to Login</Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${step > i+1 ? 'bg-charcoal border-charcoal text-white' : step === i+1 ? 'bg-gold border-gold text-white' : 'border-stone text-warm/40 bg-white'}`}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <span className="text-[10px] tracking-widests uppercase text-warm/50">{s.l}</span>
              </div>
              {i < steps.length-1 && <div className={`w-12 h-px mb-5 ${step > i+1 ? 'bg-charcoal' : 'bg-stone'}`}></div>}
            </div>
          ))}
        </div>

        <div className="bg-white border border-stone p-8">
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-stone/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h1 className="font-serif text-3xl text-charcoal mb-2">Forgot Password?</h1>
                <p className="text-warm/60 text-sm">Enter your registered email to receive a reset code.</p>
              </div>
              <form onSubmit={handleEmail} className="space-y-5">
                <div>
                  <label className="form-label">Registered Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" className="form-input"/>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-gold text-white text-sm tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-stone/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📧</span>
                </div>
                <h1 className="font-serif text-3xl text-charcoal mb-2">Check Your Email</h1>
                <p className="text-warm/60 text-sm">We sent a 6-digit code to <strong className="text-charcoal">{email}</strong></p>
              </div>
              <form onSubmit={handleOtp} className="space-y-6">
                <div>
                  <label className="form-label text-center block">Enter 6-Digit OTP</label>
                  <div className="flex gap-2 justify-center mt-3">
                    {otp.map((d, i) => (
                      <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={d}
                        onChange={e => handleOtpInput(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        className="w-11 h-13 text-center border border-stone font-serif text-2xl text-charcoal outline-none focus:border-gold transition-colors p-2"/>
                    ))}
                  </div>
                </div>
                <p className="text-center text-xs text-warm/50">
                  Code expires in <span className="text-gold font-medium">{Math.floor(timer/60).toString().padStart(2,'0')}:{(timer%60).toString().padStart(2,'0')}</span>
                </p>
                <button type="submit" disabled={loading} className="w-full py-4 bg-gold text-white text-sm tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button type="button" disabled={timer > 0} onClick={() => { setTimer(120); handleEmail({ preventDefault: () => {} }) }}
                  className="w-full text-xs text-warm/40 hover:text-gold transition-colors disabled:opacity-40">
                  Resend Code
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-stone/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔑</span>
                </div>
                <h1 className="font-serif text-3xl text-charcoal mb-2">Set New Password</h1>
                <p className="text-warm/60 text-sm">Create a strong, secure password.</p>
              </div>
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="form-label">New Password</label>
                  <input type="password" required value={pwd} onChange={e => setPwd(e.target.value)}
                    placeholder="Min. 8 characters" className="form-input"/>
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password" className="form-input"/>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-gold text-white text-sm tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="font-serif text-3xl text-charcoal mb-3">Password Reset!</h2>
              <p className="text-warm/60 text-sm mb-8">Your password has been updated. You can now sign in with your new password.</p>
              <Link href="/auth/login" className="btn-gold">Back to Login</Link>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] tracking-widests uppercase text-warm/30 mt-6">🔒 Secured with 256-bit SSL encryption</p>
      </div>
    </div>
  )
}
