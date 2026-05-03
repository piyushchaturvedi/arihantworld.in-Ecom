'use client'
import { useState } from 'react'
import { consultationAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ConsultPopup({ isOpen, onClose }) {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', city:'', budget:'', requirements:'', preferredTime:'' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await consultationAPI.submit(form)
      setSubmitted(true)
      toast.success('Consultation request submitted!')
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.')
    } finally { setLoading(false) }
  }

  const handleClose = () => { onClose(); setSubmitted(false); setForm({ firstName:'', lastName:'', email:'', phone:'', city:'', budget:'', requirements:'', preferredTime:'' }) }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose}/>
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-charcoal p-6 md:p-8 relative">
          <button onClick={handleClose} className="absolute top-4 right-4 text-stone/40 hover:text-white transition-colors text-2xl leading-none">✕</button>
          <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-2">Free Service</span>
          <h2 className="font-serif text-3xl text-white leading-tight">
            Free Virtual<br/><em className="text-gold-light">Consultation</em>
          </h2>
          <p className="text-stone/60 text-sm mt-3">
            Talk directly to our master artisans. Get personalized recommendations for your space, budget & spiritual needs.
          </p>
          <div className="flex gap-6 mt-4">
            {[['🎨','Custom designs'],['💬','Expert advice'],['🕐','24h response']].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-stone/50 text-xs">
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="font-serif text-2xl text-charcoal mb-3">Request Submitted!</h3>
            <p className="text-warm/60 text-sm mb-2">Thank you, <strong>{form.firstName}</strong>! Our team will contact you within 24 hours.</p>
            <p className="text-warm/40 text-xs mb-8">A confirmation has been sent to <strong>{form.email}</strong></p>
            <button onClick={handleClose} className="btn-gold">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name *</label>
                <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} className="form-input" placeholder="Rajesh"/>
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="form-input" placeholder="Sharma"/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="form-input" placeholder="your@email.com"/>
              </div>
              <div>
                <label className="form-label">Mobile *</label>
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="form-input" placeholder="+91 98765 43210"/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} className="form-input" placeholder="Mumbai, Delhi, Jaipur…"/>
              </div>
              <div>
                <label className="form-label">Budget Range</label>
                <select value={form.budget} onChange={e => set('budget', e.target.value)} className="form-input">
                  <option value="">Select budget…</option>
                  {['Under ₹10,000','₹10,000 – ₹25,000','₹25,000 – ₹50,000','₹50,000 – ₹1,00,000','₹1,00,000 – ₹5,00,000','Above ₹5,00,000'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Preferred Consultation Time</label>
              <select value={form.preferredTime} onChange={e => set('preferredTime', e.target.value)} className="form-input">
                <option value="">Select time…</option>
                {['Morning (9 AM – 12 PM)','Afternoon (12 PM – 4 PM)','Evening (4 PM – 8 PM)','Weekend','Flexible'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Your Requirements *</label>
              <textarea required value={form.requirements} onChange={e => set('requirements', e.target.value)} className="form-input h-24 resize-none"
                placeholder="Describe what you're looking for — e.g., 18-inch Ganesh murti for home temple, marble dining table for 6, custom home mandir for new house…"/>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="px-6 py-3 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold transition-all">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-gold text-white text-sm tracking-[0.15em] uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                {loading ? 'Submitting…' : 'Submit Consultation Request'}
              </button>
            </div>
            <p className="text-[10px] text-warm/30 text-center">🔒 Your information is private and will only be used to assist you.</p>
          </form>
        )}
      </div>
    </div>
  )
}
