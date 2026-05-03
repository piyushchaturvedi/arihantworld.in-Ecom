'use client'
import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { AdminLoader } from '@/components/ui/Loader'
import toast from 'react-hot-toast'

const STATUS_COLORS = { new:'bg-blue-50 text-blue-700 border-blue-200', contacted:'bg-amber-50 text-amber-700 border-amber-200', converted:'bg-green-50 text-green-700 border-green-200', closed:'bg-gray-50 text-gray-500 border-gray-200' }

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('new')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getConsultations({ status: filter === 'all' ? undefined : filter, limit: 50 })
      setConsultations(data.consultations || [])
    } catch { setConsultations([]) }
    finally { setLoading(false) }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const { data } = await adminAPI.updateConsultation(selected._id, { status, notes })
      setConsultations(prev => prev.map(c => c._id === selected._id ? data.consultation : c))
      setSelected(data.consultation)
      toast.success('Updated successfully')
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Consultations</h1>
          <p className="text-gray-500 text-sm mt-1">{consultations.length} consultation requests</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','new','contacted','converted','closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-xs tracking-widests uppercase border transition-all capitalize ${filter===s ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'}`}>{s}</button>
        ))}
      </div>

      {loading ? <AdminLoader/> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {consultations.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-sm">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-gray-400 text-sm">No consultations found</p>
              </div>
            ) : consultations.map(c => (
              <button key={c._id} onClick={() => { setSelected(c); setNotes(c.notes || ''); setStatus(c.status) }}
                className={`w-full text-left bg-white border rounded-sm p-4 hover:border-gold transition-all ${selected?._id === c._id ? 'border-gold bg-gold/3' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-charcoal text-sm">{c.firstName} {c.lastName}</p>
                  <span className={`status-badge ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-xs text-gray-400">{c.email}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
                <p className="text-xs text-warm/60 mt-2 line-clamp-2">{c.requirements}</p>
                <p className="text-[10px] text-gray-300 mt-2">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white border border-gray-200 rounded-sm flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-sm">Select a consultation to view details</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-serif text-xl text-charcoal">{selected.firstName} {selected.lastName}</h3>
                  <span className={`status-badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[['Email', selected.email],['Phone', selected.phone],['City', selected.city||'—'],['Budget', selected.budget||'—'],['Preferred Time', selected.preferredTime||'—'],['Submitted', new Date(selected.createdAt).toLocaleDateString('en-IN')]].map(([l,v]) => (
                      <div key={l}>
                        <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-0.5">{l}</p>
                        <p className="text-charcoal font-medium">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-1">Requirements</p>
                    <p className="text-charcoal text-sm leading-relaxed bg-stone/20 p-3 rounded-sm">{selected.requirements}</p>
                  </div>
                  <div>
                    <label className="form-label">Update Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="form-input">
                      {['new','contacted','converted','closed'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Admin Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input h-24 resize-none" placeholder="Internal notes about this consultation…"/>
                  </div>
                  <div className="flex gap-3">
                    <a href={`mailto:${selected.email}`} className="flex-1 py-3 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold hover:text-gold transition-all text-center">
                      Send Email
                    </a>
                    <a href={`tel:${selected.phone}`} className="flex-1 py-3 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold hover:text-gold transition-all text-center">
                      Call
                    </a>
                    <button onClick={handleUpdate} disabled={saving} className="flex-1 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                      {saving ? 'Saving…' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
