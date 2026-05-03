'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/ui/Loader'
import { ordersAPI, BASE_URL, getAuthToken } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { fmt } from '@/lib/config'
import toast from 'react-hot-toast'

const FILTERS = ['all','delivered','shipped','processing','cancelled','pending']
const STATUS_STYLES = {
  delivered:'status-delivered', shipped:'status-shipped', out_for_delivery:'status-shipped',
  processing:'status-processing', confirmed:'status-processing',
  cancelled:'status-cancelled', pending:'status-pending',
}
const STATUS_LABELS = {
  delivered:'✓ Delivered', shipped:'🚚 In Transit', out_for_delivery:'🚚 Out for Delivery',
  processing:'⏳ Processing', confirmed:'✅ Confirmed',
  cancelled:'✕ Cancelled', pending:'⋯ Pending', returned:'↩ Returned',
}

// Build tracking steps from order.status + order.tracking (from DB)
function buildTrackingSteps(order) {
  const ALL_STEPS = ['pending','confirmed','processing','shipped','out_for_delivery','delivered']
  const STEP_LABELS = {
    pending:'Placed', confirmed:'Confirmed', processing:'Crafting',
    shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered',
  }
  const currentIdx = ALL_STEPS.indexOf(order.status)
  if (currentIdx === -1) return [] // cancelled — no steps shown

  return ALL_STEPS.map((s, i) => {
    const done = i <= currentIdx
    const active = i === currentIdx
    let date = ''
    if (s === 'pending')   date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''
    if (s === 'shipped' && order.tracking?.shippedAt) date = new Date(order.tracking.shippedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})
    if (s === 'delivered' && order.tracking?.deliveredAt) date = new Date(order.tracking.deliveredAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})
    return { label: STEP_LABELS[s], done, active, date }
  })
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(null)

  useEffect(() => {
    if (searchParams.get('success') === 'true') toast.success('🎉 Order placed successfully!')
    const orderNum = searchParams.get('order')
    if (orderNum) setExpanded(orderNum)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([])
      setIsDemo(true)
      setLoading(false)
      return
    }
    loadOrders()
  }, [isAuthenticated, filter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (filter !== 'all') params.status = filter
      const { data } = await ordersAPI.getAll(params)
      setOrders(data.orders || [])
      setIsDemo(false)
    } catch {
      setOrders([])
      setIsDemo(true)
    } finally { setLoading(false) }
  }

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      await ordersAPI.cancel(orderId, 'Customer cancelled')
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status:'cancelled' } : o))
      toast.success('Order cancelled')
    } catch(err) { toast.error(err.response?.data?.message || 'Cannot cancel now') }
  }

  const handleDownloadInvoice = async (order) => {
    setDownloadingInvoice(order._id)
    try {
      // BASE_URL is already http://localhost:5000/api — strip trailing /api to avoid doubling
      const url = `${BASE_URL}/api/orders/${order._id}/invoice`
      const token = getAuthToken()
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.message || 'Invoice unavailable')
      }
      const html = await resp.text()
      const win = window.open('', '_blank')
      if (!win) { toast.error('Please allow popups for this site'); return }
      win.document.open()
      win.document.write(html)
      win.document.close()
      setTimeout(() => { try { win.print() } catch(e) {} }, 800)
    } catch(err) {
      toast.error(err.message || 'Invoice not available for this order')
    } finally { setDownloadingInvoice(null) }
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q
      || (o.orderNumber || '').toLowerCase().includes(q)
      || (o.items?.[0]?.name || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const toggle = (id) => setExpanded(expanded === id ? null : id)

  return (
    <>
      <Navbar/>
      {/* Hero */}
      <div className="pt-28 pb-10 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widests uppercase mb-3 flex-wrap">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <span className="text-gold">My Orders</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="font-serif text-4xl md:text-5xl text-white">My Orders</h1>
            <Link href="/products" className="px-5 py-2.5 border border-gold text-gold text-xs tracking-widests uppercase hover:bg-gold hover:text-white transition-all">Shop More</Link>
          </div>
          {isDemo && (
            <div className="mt-4 bg-gold/20 border border-gold/30 px-4 py-3 text-stone/80 text-sm">
              📌 <Link href="/auth/login" className="text-gold underline">Login</Link> to see your real orders.
            </div>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border-b border-stone sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[10px] tracking-widests uppercase border transition-all capitalize ${filter===f?'bg-charcoal text-white border-charcoal':'border-stone text-warm hover:border-gold hover:text-gold'}`}>
                {f}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order # or product…" className="form-input w-full sm:w-64 text-sm"/>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-[60vh]">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 opacity-20">📦</div>
            <h3 className="font-serif text-2xl text-charcoal mb-3">
              {!isAuthenticated ? 'Please login to view orders' : filter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-warm/60 text-sm mb-8">
              {!isAuthenticated ? 'Login to your account to see your order history.' : 'Start shopping to place your first order.'}
            </p>
            {!isAuthenticated
              ? <Link href="/auth/login" className="btn-gold">Login</Link>
              : <Link href="/products" className="btn-gold">Start Shopping</Link>
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => {
              const isExpanded = expanded === order._id
              const firstItem  = order.items?.[0]
              const firstImgUrl = firstItem?.image || firstItem?.product?.images?.[0]?.url
              const trackingSteps = buildTrackingSteps(order)
              const hasTracking = order.tracking?.carrier || order.tracking?.awbNumber

              return (
                <div key={order._id} className="bg-white border border-stone hover:border-gold/30 hover:shadow-md transition-all duration-300">
                  {/* Order row */}
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                    onClick={() => toggle(order._id)}>
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-stone to-cream border border-stone flex items-center justify-center overflow-hidden">
                        {firstImgUrl
                          ? <img src={firstImgUrl} alt="" className="w-full h-full object-cover"/>
                          : <span className="text-2xl opacity-30">🏺</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs tracking-widests font-medium text-charcoal">#{order.orderNumber}</span>
                          <span className={`status-badge ${STATUS_STYLES[order.status]||'status-pending'}`}>
                            {STATUS_LABELS[order.status]||order.status}
                          </span>
                        </div>
                        <p className="font-serif text-charcoal truncate max-w-xs">
                          {firstItem?.name || firstItem?.product?.name || 'Order Item'}
                          {order.items?.length > 1 && <span className="text-warm/40 text-sm ml-2">+{order.items.length-1} more</span>}
                        </p>
                        <p className="text-xs text-warm/50 mt-1">
                          Placed: {new Date(order.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 ml-auto">
                      <div className="text-right">
                        <p className="font-serif text-xl text-gold">{fmt(order.pricing?.total)}</p>
                        <p className="text-[10px] text-warm/40 uppercase tracking-widests">{order.items?.length||1} item(s)</p>
                      </div>
                      <svg className={`w-4 h-4 text-warm/40 transition-transform duration-300 flex-shrink-0 ${isExpanded?'rotate-180':''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-stone">
                      {/* ── Tracking Steps ── */}
                      {trackingSteps.length > 0 && order.status !== 'cancelled' && (
                        <div className="px-4 sm:px-6 py-5 bg-stone/10 border-b border-stone">
                          <h3 className="text-[10px] tracking-widests uppercase text-warm/60 mb-5">Order Tracking</h3>
                          <div className="flex items-start overflow-x-auto pb-2">
                            {trackingSteps.map((step, idx) => (
                              <div key={idx} className="flex flex-col items-center flex-1 relative min-w-[50px]">
                                {idx < trackingSteps.length-1 && (
                                  <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${step.done?'bg-gold':'bg-stone'}`}/>
                                )}
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] z-10 ${step.done?'bg-gold border-gold text-white':step.active?'bg-charcoal border-charcoal text-white':'bg-white border-stone text-warm/30'}`}>
                                  {step.done?'✓':step.active?'→':'○'}
                                </div>
                                <p className={`text-[9px] text-center tracking-widests uppercase mt-2 leading-tight ${step.done?'text-warm/70':step.active?'text-gold font-medium':'text-warm/30'}`}>{step.label}</p>
                                {step.date && <p className="text-[9px] text-warm/30 text-center">{step.date}</p>}
                              </div>
                            ))}
                          </div>

                          {/* Carrier / AWB info from DB */}
                          {hasTracking && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-sm text-sm space-y-1.5">
                              {order.tracking.carrier && (
                                <p><span className="text-warm/50 text-xs">Carrier: </span><strong className="text-charcoal">{order.tracking.carrier}</strong></p>
                              )}
                              {order.tracking.awbNumber && (
                                <p><span className="text-warm/50 text-xs">AWB / Tracking No: </span><strong className="font-mono text-charcoal">{order.tracking.awbNumber}</strong></p>
                              )}
                              {order.tracking.estimatedDelivery && (
                                <p><span className="text-warm/50 text-xs">Estimated Delivery: </span><strong className="text-charcoal">{new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong></p>
                              )}
                              {order.tracking.trackingUrl && (
                                <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-block text-gold text-xs hover:underline mt-1">Track Package →</a>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Items ── */}
                      <div className="px-4 sm:px-6 py-5 border-b border-stone">
                        <h3 className="text-[10px] tracking-widests uppercase text-warm/60 mb-4">Items Ordered</h3>
                        <div className="space-y-3">
                          {order.items?.map((item, i) => {
                            const imgUrl = item.image || item.product?.images?.[0]?.url
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-stone to-cream border border-stone flex-shrink-0 overflow-hidden flex items-center justify-center">
                                  {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover"/> : <span className="opacity-30 text-base">🏺</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-serif text-sm text-charcoal truncate">{item.name || item.product?.name}</p>
                                  <p className="text-xs text-warm/50">Qty: {item.qty}</p>
                                </div>
                                <p className="text-gold text-sm font-medium flex-shrink-0">{fmt(item.price * item.qty)}</p>
                              </div>
                            )
                          })}
                        </div>
                        {order.shippingAddress && (
                          <div className="mt-4 pt-4 border-t border-stone text-xs text-warm/60 flex items-start gap-1.5">
                            <span className="text-gold mt-0.5">📍</span>
                            <span>
                              {order.shippingAddress.name}, {order.shippingAddress.line1}{order.shippingAddress.line2?`, ${order.shippingAddress.line2}`:''}{' '}
                              {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ── Actions ── */}
                      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-sm text-warm/70">
                          Total: <strong className="text-charcoal font-medium">{fmt(order.pricing?.total)}</strong>
                          {order.payment?.method && <span className="ml-2 capitalize text-warm/50">· {order.payment.method}</span>}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingInvoice === order._id}
                            className="px-4 py-2 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold hover:text-gold transition-colors disabled:opacity-50">
                            {downloadingInvoice === order._id ? '…' : 'Download Invoice'}
                          </button>
                          {order.status === 'delivered' && (
                            <button onClick={() => toast('Review submitted! Thank you')}
                              className="px-4 py-2 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold hover:text-gold transition-colors">
                              Write Review
                            </button>
                          )}
                          {['pending','confirmed','processing'].includes(order.status) && (
                            <button onClick={() => handleCancel(order._id)}
                              className="px-4 py-2 border border-red-200 text-red-500 text-xs tracking-widests uppercase hover:bg-red-50 transition-colors">
                              Cancel Order
                            </button>
                          )}
                          {['delivered','cancelled'].includes(order.status) && (
                            <Link href="/products"
                              className="px-4 py-2 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-colors">
                              Shop Again
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer/>
    </>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loader fullPage/>}>
      <OrdersContent/>
    </Suspense>
  )
}
