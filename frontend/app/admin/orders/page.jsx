'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { adminAPI, BASE_URL, getAuthToken } from '@/lib/api'
import { AdminLoader } from '@/components/ui/Loader'
import toast from 'react-hot-toast'

const STATUSES = ['all','pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled']
const STATUS_COLORS = {
  pending:'status-pending', confirmed:'status-processing', processing:'status-processing',
  shipped:'status-shipped', out_for_delivery:'status-shipped', delivered:'status-delivered',
  cancelled:'status-cancelled', returned:'status-pending'
}
const STATUS_LABELS = {
  pending:'Pending', confirmed:'Confirmed', processing:'Processing', shipped:'Shipped',
  out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled', returned:'Returned'
}
const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [tracking, setTracking] = useState({ carrier:'', awbNumber:'', trackingUrl:'', estimatedDelivery:'' })

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit:100 }
      if (filter !== 'all') params.status = filter
      if (search) params.search = search
      const { data } = await adminAPI.getOrders(params)
      setOrders(data.orders || [])
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { loadOrders() }, [filter])

  const loadOrderDetail = async (order) => {
    try {
      const { data } = await adminAPI.getOrder(order._id)
      setSelected(data.order)
      setTracking({
        carrier: data.order.tracking?.carrier || '',
        awbNumber: data.order.tracking?.awbNumber || '',
        trackingUrl: data.order.tracking?.trackingUrl || '',
        estimatedDelivery: data.order.tracking?.estimatedDelivery ? data.order.tracking.estimatedDelivery.split('T')[0] : '',
      })
    } catch { setSelected(order) }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || !selected) return
    setUpdating(true)
    try {
      await adminAPI.updateOrderStatus(selected._id, newStatus, statusNote)
      setOrders(prev => prev.map(o => o._id===selected._id ? {...o, status:newStatus} : o))
      setSelected(prev => prev ? {...prev, status:newStatus} : prev)
      toast.success('Order status updated')
      setShowStatusModal(false); setStatusNote('')
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(false) }
  }

  const handleTrackingUpdate = async () => {
    if (!selected) return
    setUpdating(true)
    try {
      await adminAPI.updateOrderStatus(selected._id, selected.status, '', tracking)
      setSelected(prev => prev ? {...prev, tracking} : prev)
      toast.success('Tracking details saved & customer notified')
      setShowTrackingModal(false)
    } catch { toast.error('Failed to save tracking') }
    finally { setUpdating(false) }
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter==='all' || o.status===filter
    const matchSearch = !search || (o.orderNumber?.toLowerCase().includes(search.toLowerCase())) || (`${o.user?.firstName} ${o.user?.lastName}`.toLowerCase().includes(search.toLowerCase())) || (o.user?.email?.toLowerCase().includes(search.toLowerCase()))
    return matchFilter && matchSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} orders found</p>
        </div>
        <button onClick={loadOrders} className="px-4 py-2 border border-stone text-warm text-xs tracking-widest uppercase hover:border-gold transition-all">↻ Refresh</button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-all capitalize ${filter===s?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-5 flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && loadOrders()}
          placeholder="Search by order # or customer name / email…" className="form-input flex-1 text-sm"/>
        <button onClick={loadOrders} className="px-4 py-2 bg-gold text-white text-xs uppercase hover:bg-gold-dark transition-all">Search</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Orders list */}
        <div className="lg:col-span-1 space-y-3 max-h-[75vh] overflow-y-auto">
          {loading ? <AdminLoader text="Loading orders…"/> : filtered.length===0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-sm">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-gray-400 text-sm">No orders found</p>
            </div>
          ) : filtered.map(o => (
            <button key={o._id} onClick={() => loadOrderDetail(o)}
              className={`w-full text-left bg-white border rounded-sm p-4 hover:border-gold transition-all ${selected?._id===o._id?'border-gold bg-gold/3':'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-charcoal text-sm">#{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{o.user?.firstName} {o.user?.lastName}</p>
                </div>
                <span className={`status-badge ${STATUS_COLORS[o.status]||'status-pending'}`}>{STATUS_LABELS[o.status]||o.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
                <p className="text-sm font-medium text-gold">{fmt(o.pricing?.total)}</p>
              </div>
              {o.items?.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] text-gray-400 truncate">
                    {o.items[0]?.name}{o.items.length>1?` +${o.items.length-1} more`:''}
                  </p>
                  {o.items[0]?.variant && (
                    <p className="text-[10px] text-gold/80 truncate">{o.items[0].variant}</p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Order detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white border border-gray-200 rounded-sm flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm">Select an order to view details</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-serif text-xl text-charcoal">Order #{selected.orderNumber}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{new Date(selected.createdAt).toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`status-badge ${STATUS_COLORS[selected.status]||'status-pending'} text-sm px-3 py-1`}>{STATUS_LABELS[selected.status]||selected.status}</span>
                  <button onClick={() => { setNewStatus(selected.status); setShowStatusModal(true) }}
                    className="px-4 py-2 border border-gold text-gold text-xs tracking-widest uppercase hover:bg-gold hover:text-white transition-all">
                    Update Status
                  </button>
                  <button onClick={() => setShowTrackingModal(true)}
                    className="px-4 py-2 border border-stone text-warm text-xs tracking-widest uppercase hover:border-gold hover:text-gold transition-all">
                    📦 Tracking
                  </button>
                  <button onClick={async () => {
                    try {
                      const url = `${BASE_URL}/api/admin/orders/${selected._id}/invoice`
                      const token = getAuthToken()
                      const r = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } })
                      if (!r.ok) { const e = await r.json().catch(()=>{}); toast.error(e?.message || 'Invoice error'); return }
                      const html = await r.text()
                      const w = window.open('','_blank')
                      if (!w) { toast.error('Allow popups for this site'); return }
                      w.document.open(); w.document.write(html); w.document.close()
                      setTimeout(() => { try { w.print() } catch(e){} }, 800)
                    } catch(err) { toast.error('Failed to load invoice') }
                  }} className="px-4 py-2 bg-charcoal text-white text-xs tracking-widest uppercase hover:bg-gold transition-all">
                    📄 Invoice
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Customer + Address + Payment */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="border border-gray-100 rounded-sm p-4">
                    <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">Customer</p>
                    <p className="font-medium text-charcoal text-sm">{selected.user?.firstName} {selected.user?.lastName}</p>
                    <p className="text-gray-500 text-xs mt-1">{selected.user?.email}</p>
                    <p className="text-gray-500 text-xs">{selected.user?.phone || selected.shippingAddress?.phone}</p>
                  </div>
                  <div className="border border-gray-100 rounded-sm p-4">
                    <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-2">Delivery Address</p>
                    <p className="text-sm text-charcoal leading-relaxed">
                      {selected.shippingAddress?.name}<br/>
                      {selected.shippingAddress?.line1}{selected.shippingAddress?.line2 && `, ${selected.shippingAddress.line2}`}<br/>
                      {selected.shippingAddress?.city}, {selected.shippingAddress?.state} – {selected.shippingAddress?.pincode}
                    </p>
                  </div>
                  <div className="border border-gray-100 rounded-sm p-4">
                    <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">Payment</p>
                    <p className="font-medium text-charcoal text-sm capitalize">{selected.payment?.method}</p>
                    <span className={`text-[10px] tracking-widests uppercase px-2 py-0.5 mt-1 inline-block ${selected.payment?.status==='paid'?'bg-green-50 text-green-600':'bg-amber-50 text-amber-600'}`}>{selected.payment?.status}</span>
                    {selected.payment?.paidAt && <p className="text-xs text-gray-400 mt-1">{new Date(selected.payment.paidAt).toLocaleDateString('en-IN')}</p>}
                    {/* COD Advance Section */}
                    {selected.payment?.method === 'cod' && selected.payment?.codAdvanceAmount > 0 && (
                      <div className={`mt-3 p-2 rounded text-xs ${selected.payment.codAdvancePaid ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                        <p className="font-semibold text-amber-800 mb-1">📲 COD Advance</p>
                        <div className="flex justify-between text-amber-700">
                          <span>Advance ({selected.payment.codAdvancePct}%)</span>
                          <span className="font-mono font-bold">₹{selected.payment.codAdvanceAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-warm/60 mt-0.5">
                          <span>Cash on Delivery</span>
                          <span className="font-mono">₹{((selected.pricing?.total || 0) - (selected.payment.codAdvanceAmount || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        {selected.payment.codAdvancePaid
                          ? <p className="text-green-600 font-semibold mt-1">✓ Advance Received</p>
                          : (
                            <button
                              onClick={async () => {
                                try {
                                  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
                                  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
                                  const res = await fetch(`${API}/admin/orders/${selected._id}/cod-advance`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    setSelected(data.order)
                                    setOrders(prev => prev.map(o => o._id === data.order._id ? data.order : o))
                                  }
                                } catch(e) { alert('Failed to update') }
                              }}
                              className="mt-2 w-full py-1.5 bg-amber-500 text-white text-[10px] tracking-widest uppercase hover:bg-amber-600 transition-colors rounded-sm">
                              ✓ Mark Advance Received
                            </button>
                          )
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking info */}
                {(selected.tracking?.carrier || selected.tracking?.awbNumber) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                    <p className="text-[10px] tracking-widests uppercase text-blue-600 mb-2">📦 Shipment Tracking</p>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {selected.tracking.carrier && <div><span className="text-gray-400">Carrier: </span><strong>{selected.tracking.carrier}</strong></div>}
                      {selected.tracking.awbNumber && <div><span className="text-gray-400">AWB: </span><strong className="font-mono">{selected.tracking.awbNumber}</strong></div>}
                      {selected.tracking.estimatedDelivery && <div><span className="text-gray-400">Est. Delivery: </span><strong>{new Date(selected.tracking.estimatedDelivery).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong></div>}
                      {selected.tracking.trackingUrl && <div><a href={selected.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Track Package →</a></div>}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-3">Items ({selected.items?.length})</p>
                  <div className="divide-y divide-gray-50">
                    {selected.items?.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 py-4">
                        {/* Larger product image */}
                        <div className="w-20 h-20 bg-gradient-to-br from-stone to-cream border border-stone flex items-center justify-center flex-shrink-0 overflow-hidden rounded-sm">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                            : <span className="text-3xl opacity-30">🏺</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-charcoal leading-tight">{item.name}</p>
                          {/* Size / variant shown prominently */}
                          {item.variant && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.variant.split('|').map((v, vi) => (
                                <span key={vi} className="inline-flex items-center bg-gold/10 border border-gold/30 text-gold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm">
                                  {v.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Qty: <strong>{item.qty}</strong></p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gold">{fmt(item.price * item.qty)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmt(item.price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-sm p-4 space-y-2 text-sm">
                  <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-3">Order Pricing</p>
                  <div className="flex justify-between text-gray-600"><span>Subtotal (incl. taxes)</span><span>{fmt(selected.pricing?.subtotal)}</span></div>
                  {selected.pricing?.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({selected.pricing?.couponCode})</span><span>−{fmt(selected.pricing.couponDiscount)}</span></div>}
                  <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{selected.pricing?.shipping===0?'FREE':fmt(selected.pricing?.shipping)}</span></div>
                  <div className="flex justify-between font-bold text-charcoal text-base border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span><span className="text-gold">{fmt(selected.pricing?.total)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-4 text-sm">
                    <p className="text-[10px] tracking-widests uppercase text-amber-600 mb-1">Customer Note</p>
                    <p className="text-amber-800">{selected.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-serif text-xl text-charcoal">Update Order Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">New Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-input">
                  {['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'].map(s => (
                    <option key={s} value={s} className="capitalize">{STATUS_LABELS[s]||s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Note (visible to customer)</label>
                <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} className="form-input h-20 resize-none" placeholder="Your marble murti is being carefully packaged…"/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widests uppercase hover:border-gold transition-all">Cancel</button>
                <button onClick={handleStatusUpdate} disabled={updating} className="flex-1 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark disabled:opacity-60 transition-all">
                  {updating ? 'Saving…' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-serif text-xl text-charcoal">📦 Courier & Tracking</h3>
              <button onClick={() => setShowTrackingModal(false)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                After saving, tracking details will be visible to the customer on their order page.
              </div>
              <div>
                <label className="form-label">Courier / Carrier Name *</label>
                <input value={tracking.carrier} onChange={e => setTracking(p=>({...p,carrier:e.target.value}))} className="form-input" placeholder="Blue Dart, DTDC, Delhivery, FedEx…"/>
              </div>
              <div>
                <label className="form-label">AWB / Tracking Number *</label>
                <input value={tracking.awbNumber} onChange={e => setTracking(p=>({...p,awbNumber:e.target.value}))} className="form-input font-mono" placeholder="123456789012"/>
              </div>
              <div>
                <label className="form-label">Tracking URL</label>
                <input value={tracking.trackingUrl} onChange={e => setTracking(p=>({...p,trackingUrl:e.target.value}))} className="form-input" placeholder="https://track.bluedart.com/…"/>
              </div>
              <div>
                <label className="form-label">Estimated Delivery Date</label>
                <input type="date" value={tracking.estimatedDelivery} onChange={e => setTracking(p=>({...p,estimatedDelivery:e.target.value}))} className="form-input"/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTrackingModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widests uppercase hover:border-gold transition-all">Cancel</button>
                <button onClick={handleTrackingUpdate} disabled={updating} className="flex-1 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark disabled:opacity-60 transition-all">
                  {updating ? 'Saving…' : 'Save & Notify Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
