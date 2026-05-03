'use client'
import { useState } from 'react'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const EMPTY = { code:'', description:'', type:'percentage', value:'', minOrderValue:'0', maxDiscount:'', usageLimit:'', userLimit:'1', validUntil:'', isActive:true }
const DEMO = [
  { _id:'1', code:'ARIHANT10', description:'10% off on all orders', type:'percentage', value:10, minOrderValue:5000, maxDiscount:5000, usageLimit:1000, usedCount:234, validUntil:new Date('2025-12-31'), isActive:true },
  { _id:'2', code:'WELCOME500', description:'₹500 off first order', type:'fixed', value:500, minOrderValue:3000, usageLimit:null, usedCount:89, validUntil:new Date('2025-12-31'), isActive:true },
  { _id:'3', code:'FESTIVE20', description:'20% off festival special', type:'percentage', value:20, minOrderValue:10000, maxDiscount:10000, usageLimit:200, usedCount:200, validUntil:new Date('2025-10-31'), isActive:false },
  { _id:'4', code:'SAVE10', description:'10% off', type:'percentage', value:10, minOrderValue:1000, usageLimit:500, usedCount:112, validUntil:new Date('2025-12-31'), isActive:true },
]

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState(DEMO)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const openAdd = () => { setEditId(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (c) => {
    setEditId(c._id)
    setForm({ ...c, value: c.value.toString(), minOrderValue: c.minOrderValue.toString(), maxDiscount: c.maxDiscount?.toString() || '', usageLimit: c.usageLimit?.toString() || '', userLimit: c.userLimit?.toString() || '1', validUntil: c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, code: form.code.toUpperCase(), value: Number(form.value), minOrderValue: Number(form.minOrderValue), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null, userLimit: Number(form.userLimit) }
    try {
      if (editId) {
        await adminAPI.getCoupons() // placeholder, would be updateCoupon
        setCoupons(prev => prev.map(c => c._id === editId ? { ...c, ...payload } : c))
        toast.success('Coupon updated')
      } else {
        const { data } = await adminAPI.createCoupon(payload)
        setCoupons(prev => [data.coupon || { ...payload, _id: Date.now().toString(), usedCount: 0 }, ...prev])
        toast.success('Coupon created')
      }
      setShowModal(false)
    } catch { toast.error('Failed to save coupon') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return
    try {
      await adminAPI.deleteCoupon(id)
      setCoupons(prev => prev.filter(c => c._id !== id))
      toast.success('Coupon deleted')
    } catch { toast.error('Failed to delete coupon') }
  }

  const toggleActive = (id, current) => {
    setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c))
    toast.success(`Coupon ${!current ? 'activated' : 'deactivated'}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">{coupons.length} coupons</p>
        </div>
        <button onClick={openAdd} className="btn-gold">+ Create Coupon</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Coupons', value: coupons.length },
          { label:'Active', value: coupons.filter(c => c.isActive).length, color:'text-green-600' },
          { label:'Total Used', value: coupons.reduce((s,c) => s + (c.usedCount||0), 0).toLocaleString() },
          { label:'Expired', value: coupons.filter(c => new Date(c.validUntil) < new Date()).length, color:'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-sm p-4 text-center">
            <p className={`font-serif text-2xl ${color || 'text-gold'}`}>{value}</p>
            <p className="text-[10px] tracking-widests uppercase text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Coupon cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map(c => {
          const expired = new Date(c.validUntil) < new Date()
          const usagePct = c.usageLimit ? Math.round((c.usedCount / c.usageLimit) * 100) : null
          return (
            <div key={c._id} className={`bg-white border rounded-sm p-5 ${!c.isActive || expired ? 'opacity-60' : 'border-gray-200 hover:border-gold'} transition-all`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg font-bold text-charcoal tracking-widest">{c.code}</span>
                    {!c.isActive && <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 uppercase tracking-widests">Disabled</span>}
                    {expired && <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 uppercase tracking-widests">Expired</span>}
                  </div>
                  <p className="text-xs text-gray-500">{c.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-serif text-2xl text-gold">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widests">off</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <span>Min order: ₹{c.minOrderValue.toLocaleString()}</span>
                {c.maxDiscount && <span>Max off: ₹{c.maxDiscount.toLocaleString()}</span>}
                <span>Used: {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</span>
                <span>Expires: {new Date(c.validUntil).toLocaleDateString('en-IN')}</span>
              </div>
              {usagePct !== null && (
                <div className="mb-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${usagePct >= 90 ? 'bg-red-400' : usagePct >= 70 ? 'bg-amber-400' : 'bg-gold'}`} style={{ width: `${Math.min(usagePct, 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{usagePct}% used</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 py-2 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold hover:text-gold transition-colors">Edit</button>
                <button onClick={() => toggleActive(c._id, c.isActive)} className={`py-2 px-3 text-xs border transition-colors ${c.isActive ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                  {c.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(c._id)} className="py-2 px-3 border border-gray-200 text-gray-400 text-xs hover:border-red-300 hover:text-red-500 transition-colors">🗑</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-serif text-xl text-charcoal">{editId ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Coupon Code *</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="form-input font-mono tracking-widest" placeholder="SAVE10"/>
                </div>
                <div>
                  <label className="form-label">Type *</label>
                  <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="form-input">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{form.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *</label>
                  <input required type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="form-input" placeholder={form.type === 'percentage' ? '10' : '500'}/>
                </div>
                <div>
                  <label className="form-label">Min Order (₹)</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: e.target.value})} className="form-input"/>
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label className="form-label">Max Discount (₹)</label>
                    <input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} className="form-input" placeholder="Leave blank for unlimited"/>
                  </div>
                )}
                <div>
                  <label className="form-label">Usage Limit</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} className="form-input" placeholder="Leave blank for unlimited"/>
                </div>
                <div>
                  <label className="form-label">Per-user Limit</label>
                  <input type="number" value={form.userLimit} onChange={e => setForm({...form, userLimit: e.target.value})} className="form-input"/>
                </div>
                <div>
                  <label className="form-label">Valid Until *</label>
                  <input required type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} className="form-input"/>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Description</label>
                  <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-input" placeholder="Brief description of this coupon"/>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 accent-amber-600"/>
                  <label htmlFor="active" className="text-sm text-warm/70">Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widests uppercase hover:border-gold transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
