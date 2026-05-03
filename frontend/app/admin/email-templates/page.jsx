'use client'
import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { AdminLoader } from '@/components/ui/Loader'
import toast from 'react-hot-toast'

const TEMPLATE_SLUGS = [
  { slug: 'order_confirmed', name: 'Order Confirmed', desc: 'Sent when payment is successful', vars: ['customerName','orderNumber','total','paymentMethod','address','items','estimatedDelivery'] },
  { slug: 'payment_failed', name: 'Payment Failed', desc: 'Sent when payment fails', vars: ['customerName','orderNumber','failureReason'] },
  { slug: 'forgot_password', name: 'Forgot Password OTP', desc: 'OTP email for password reset', vars: ['customerName','otp'] },
  { slug: 'welcome', name: 'Welcome Email', desc: 'Sent on new registration', vars: ['customerName'] },
  { slug: 'consultation_request', name: 'Consultation Confirmation', desc: 'Sent to customer after consultation form', vars: ['customerName','budget','preferredTime','requirements'] },
  { slug: 'consultation_admin', name: 'Consultation Admin Alert', desc: 'Sent to admin when consultation form submitted', vars: ['customerName','email','phone','city','budget','preferredTime','requirements'] },
]

const EMPTY_FORM = { name:'', slug:'order_confirmed', subject:'', body:'', variables:[], isActive:true }

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    try {
      const { data } = await adminAPI.getEmailTemplates()
      setTemplates(data.templates || [])
    } catch { setTemplates([]) }
    finally { setLoading(false) }
  }

  const openAdd = (slugInfo) => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, name: slugInfo.name, slug: slugInfo.slug, subject: `${slugInfo.name} — Arihant World`, body: getDefaultBody(slugInfo.slug), variables: slugInfo.vars })
    setShowModal(true)
  }

  const openEdit = async (tmpl) => {
    setEditId(tmpl._id)
    setForm({ name: tmpl.name, slug: tmpl.slug, subject: tmpl.subject, body: tmpl.body, variables: tmpl.variables || [], isActive: tmpl.isActive })
    setShowModal(true)
  }

  const getDefaultBody = (slug) => {
    const defaults = {
      order_confirmed: `<h2>Thank you, {{customerName}}! 🙏</h2>\n<p>Your order <strong>#{{orderNumber}}</strong> has been confirmed.</p>\n<p>Total: <strong>{{total}}</strong> | Payment: {{paymentMethod}}</p>\n<p>Delivery Address: {{address}}</p>\n{{items}}\n<p>Estimated Delivery: {{estimatedDelivery}}</p>`,
      payment_failed: `<h2>Payment Issue, {{customerName}}</h2>\n<p>Your payment for Order <strong>#{{orderNumber}}</strong> could not be processed.</p>\n<p>Reason: <strong>{{failureReason}}</strong></p>\n<p>Please try again with a different payment method.</p>`,
      forgot_password: `<h2>Reset Your Password</h2>\n<p>Hello {{customerName}}, your OTP is:</p>\n<div style="text-align:center;padding:20px;background:#f7f2eb;margin:20px 0;">\n<span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#b8973a;">{{otp}}</span>\n</div>\n<p>This OTP is valid for 10 minutes.</p>`,
      welcome: `<h2>Welcome, {{customerName}}! 🙏</h2>\n<p>Thank you for joining Arihant World.</p>\n<p>Use code <strong>WELCOME500</strong> to get ₹500 off your first order!</p>`,
      consultation_request: `<h2>Thank you, {{customerName}}! 🙏</h2>\n<p>We've received your consultation request and will contact you within 24 hours.</p>\n<p>Budget: {{budget}} | Preferred Time: {{preferredTime}}</p>\n<p>Requirements: {{requirements}}</p>`,
      consultation_admin: `<h2>New Consultation Request</h2>\n<p>Name: {{customerName}} | Email: {{email}} | Phone: {{phone}}</p>\n<p>City: {{city}} | Budget: {{budget}} | Time: {{preferredTime}}</p>\n<p>Requirements: {{requirements}}</p>`,
    }
    return defaults[slug] || '<h2>Email Subject</h2>\n<p>Email body here. Use {{variableName}} for dynamic content.</p>'
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        const { data } = await adminAPI.updateEmailTemplate(editId, form)
        setTemplates(prev => prev.map(t => t._id === editId ? data.template : t))
        toast.success('Template updated')
      } else {
        const { data } = await adminAPI.createEmailTemplate(form)
        setTemplates(prev => [data.template, ...prev])
        toast.success('Template created')
      }
      setShowModal(false)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await adminAPI.deleteEmailTemplate(id)
      setTemplates(prev => prev.filter(t => t._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleTest = async () => {
    if (!testEmail) { toast.error('Enter an email address'); return }
    setTesting(true)
    try {
      await adminAPI.sendTestEmail({ to: testEmail, templateSlug: form.slug, variables: { customerName:'Test User', orderNumber:'AW-TEST-001', otp:'123456', total:'₹15,200', paymentMethod:'UPI', address:'Test Address', failureReason:'Test failure', budget:'₹10,000-₹50,000', requirements:'Custom marble murti', preferredTime:'Morning' } })
      toast.success(`Test email sent to ${testEmail}`)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to send test') }
    finally { setTesting(false) }
  }

  const slugsWithTemplates = TEMPLATE_SLUGS.map(s => ({
    ...s,
    existing: templates.find(t => t.slug === s.slug)
  }))

  if (loading) return <AdminLoader text="Loading templates…"/>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Email Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Customize transactional email templates sent to customers</p>
        </div>
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {slugsWithTemplates.map(s => (
          <div key={s.slug} className={`bg-white border rounded-sm overflow-hidden ${s.existing ? 'border-gray-200' : 'border-dashed border-gray-300'}`}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✉️</span>
                    <h3 className="text-sm font-medium text-charcoal">{s.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
                {s.existing && (
                  <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 ${s.existing.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {s.existing.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {s.vars.slice(0, 4).map(v => (
                  <span key={v} className="text-[10px] bg-stone/40 text-warm/70 px-1.5 py-0.5 font-mono">{`{{${v}}}`}</span>
                ))}
                {s.vars.length > 4 && <span className="text-[10px] text-gray-400">+{s.vars.length-4} more</span>}
              </div>
              <div className="flex gap-2">
                {s.existing ? (
                  <>
                    <button onClick={() => openEdit(s.existing)} className="flex-1 py-2 border border-stone text-warm text-xs tracking-widest uppercase hover:border-gold hover:text-gold transition-all">Edit</button>
                    <button onClick={() => handleDelete(s.existing._id)} className="py-2 px-3 border border-gray-200 text-gray-400 text-xs hover:border-red-300 hover:text-red-500 transition-all">🗑</button>
                  </>
                ) : (
                  <button onClick={() => openAdd(s)} className="flex-1 py-2 bg-charcoal text-white text-xs tracking-widest uppercase hover:bg-gold transition-all">+ Create Template</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm w-full max-w-3xl mt-4 mb-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl text-charcoal">{editId ? 'Edit' : 'Create'} Email Template</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Template Name</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input"/>
                </div>
                <div>
                  <label className="form-label">Template Type</label>
                  <select value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="form-input">
                    {TEMPLATE_SLUGS.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Email Subject</label>
                <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="form-input" placeholder="Order Confirmed #{{orderNumber}} — Arihant World"/>
              </div>

              {/* Available variables hint */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Email Body (HTML)</label>
                  <div className="flex gap-2">
                    {TEMPLATE_SLUGS.find(s => s.slug === form.slug)?.vars.map(v => (
                      <button key={v} type="button" onClick={() => setForm({...form, body: form.body + ` {{${v}}}`})}
                        className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 hover:bg-gold/20 transition-colors font-mono">
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea required value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                  className="form-input h-64 resize-y font-mono text-xs" placeholder="HTML email body…"/>
                <p className="text-[10px] text-gray-400 mt-1">Click variable tags above to insert them. Wrap content in HTML tags for formatting.</p>
              </div>

              {/* Preview toggle */}
              <div>
                <button type="button" onClick={() => setPreview(!preview)} className="text-xs text-gold hover:underline">
                  {preview ? '✕ Close Preview' : '👁 Toggle Preview'}
                </button>
                {preview && (
                  <div className="mt-3 border border-stone p-4 bg-cream max-h-64 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: form.body.replace(/\{\{(\w+)\}\}/g, (_, k) => `<span style="color:#b8973a">[${k}]</span>`) }}/>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="sr-only peer"/>
                  <div className="w-10 h-5 bg-stone rounded-full peer peer-checked:bg-gold transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
                <span className="text-sm text-warm/70">Active (will be sent)</span>
              </div>

              {/* Test email */}
              <div className="border-t border-gray-100 pt-4">
                <label className="form-label">Send Test Email</label>
                <div className="flex gap-2">
                  <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" className="form-input flex-1"/>
                  <button type="button" onClick={handleTest} disabled={testing} className="px-4 py-2.5 border border-gold text-gold text-xs tracking-widest uppercase hover:bg-gold hover:text-white transition-all disabled:opacity-60 whitespace-nowrap">
                    {testing ? 'Sending…' : 'Send Test'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widest uppercase hover:border-gold transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
