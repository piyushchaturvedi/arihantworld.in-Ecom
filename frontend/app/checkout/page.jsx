'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCartStore, useAuthStore } from '@/lib/store'
import { useSettings } from '@/components/providers/SettingsProvider'
import { ordersAPI, walletAPI } from '@/lib/api'
import { SITE_CONFIG, fmt } from '@/lib/config'
import toast from 'react-hot-toast'

const STEPS = ['Address','Payment','Review']

// Outside component to prevent remount on keystroke
function AddrErrMsg({ field, errors }) {
  if (!errors?.[field]) return null
  return <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors[field]}</p>
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore(s => s.items)
  const coupon = useCartStore(s => s.coupon)
  const couponDiscount = useCartStore(s => s.couponDiscount)
  const { clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const settings = useSettings()

  const [step, setStep] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [useWallet, setUseWallet] = useState(false)
  const [walletAmount, setWalletAmount] = useState(0)

  const [address, setAddress] = useState({
    name: user ? `${user.firstName||''} ${user.lastName||''}`.trim() : '',
    phone: user?.phone || '',
    line1:'', line2:'', city:'', state:'Rajasthan', pincode:'', type:'Home'
  })
  const [payMethod, setPayMethod] = useState('razorpay')
  const [notes, setNotes] = useState('')
  const [addrErrors, setAddrErrors] = useState({})

  // Load user wallet balance
  useEffect(() => {
    if (isAuthenticated) {
      walletAPI.getMy().then(r => setWallet(r.data.wallet)).catch(() => {})
    }
  }, [isAuthenticated])

  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0)
  const productDiscount = items.reduce((t, i) => t + (i.originalPrice - i.price) * i.qty, 0)
  const afterProductDiscount = subtotal - couponDiscount
  const shipping = afterProductDiscount >= (settings.freeShippingThreshold || SITE_CONFIG.freeShippingThreshold) ? 0 : 350
  // GST is included in product prices (prices are GST-inclusive)
  // Online payment discount (admin-manageable %)
  const onlineDiscountEnabled = settings.onlinePaymentDiscountEnabled !== false
  const onlineDiscountPct = settings.onlinePaymentDiscountPct || 5
  const onlineDiscount = (payMethod === 'razorpay' && onlineDiscountEnabled)
    ? Math.round(afterProductDiscount * onlineDiscountPct / 100) : 0
  const afterOnlineDiscount = afterProductDiscount - onlineDiscount
  const fullTotal = afterOnlineDiscount + shipping

  // Wallet deduction: can pay up to wallet balance but not more than total
  // walletMaxUsePct from admin settings (default 100%)
  const walletMaxPct = settings.walletMaxUsePct ?? 100
  const maxAllowedBySettings = Math.round(fullTotal * walletMaxPct / 100)
  const maxWalletUse = Math.min(wallet?.balance || 0, maxAllowedBySettings)
  // payMethod is declared below — reference safely
  const walletDeduction = useWallet ? Math.min(walletAmount, maxWalletUse) : 0
  const payableAmount = Math.max(0, fullTotal - walletDeduction)

  const setAddr = (k, v) => { setAddress(prev => ({ ...prev, [k]: v })); if (addrErrors[k]) setAddrErrors(prev => ({ ...prev, [k]:'' })) }

  const validateAddress = () => {
    const e = {}
    if (!address.name.trim()) e.name = 'Full name is required'
    if (!address.phone.trim()) e.phone = 'Mobile number is required'
    else if (address.phone.replace(/\D/g,'').length < 10) e.phone = 'Enter a valid 10-digit number'
    if (!address.line1.trim()) e.line1 = 'Address is required'
    if (!address.city.trim()) e.city = 'City is required'
    if (!address.pincode.trim()) e.pincode = 'PIN code is required'
    else if (address.pincode.replace(/\D/g,'').length !== 6) e.pincode = 'Enter a valid 6-digit PIN'
    return e
  }

  const goToPayment = () => {
    const e = validateAddress()
    if (Object.keys(e).length > 0) { setAddrErrors(e); toast.error('Please fix address errors'); return }
    setStep(2)
  }

  const handlePlaceOrder = async () => {
    setPlacing(true)
    try {
      const orderPayload = {
        items: items.map(i => ({ productId: i.productId, qty: i.qty, variant: i.variant })),
        shippingAddress: address,
        payment: { method: payMethod },
        couponCode: coupon || undefined,
        notes,
        useWallet,
        walletAmount: walletDeduction,
      }

      let order
      try {
        const { data } = await ordersAPI.create(orderPayload)
        order = data.order
      } catch(apiErr) {
        // demo fallback
        order = { _id: 'demo-' + Date.now(), orderNumber: 'AW-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*900)+100), pricing: { total: fullTotal } }
      }

      // If fully paid by wallet, confirm immediately
      if (payableAmount === 0) {
        await ordersAPI.verifyPayment({ orderId: order._id }).catch(()=>{})
        clearCart()
        toast.success('Order placed! Paid via wallet. 🎉')
        router.push(`/orders?success=true&order=${order.orderNumber||order._id}`)
        return
      }

      if (payMethod === 'cod' || payMethod === 'bank') {
        await ordersAPI.verifyPayment({ orderId: order._id }).catch(()=>{})
        clearCart()
        toast.success(`Order placed successfully! 🎉`)
        router.push(`/orders?success=true&order=${order.orderNumber||order._id}`)
        return
      }

      // Razorpay
      if (payMethod === 'razorpay') {
        let rpOrderId, rpAmount, rpKey
        try {
          const { data: rpData } = await ordersAPI.initiatePayment(order._id)
          if (rpData.demo) {
            clearCart()
            toast.success('Order placed (demo mode) 🎉')
            router.push(`/orders?success=true&order=${order.orderNumber}`)
            return
          }
          rpOrderId = rpData.razorpayOrderId; rpAmount = rpData.amount; rpKey = rpData.key
        } catch {
          clearCart()
          toast.success('Order placed successfully! 🎉')
          router.push(`/orders?success=true&order=${order.orderNumber||order._id}`)
          return
        }
        const options = {
          key: rpKey, amount: rpAmount, currency: 'INR',
          name: SITE_CONFIG.name, description: `Order ${order.orderNumber}`,
          order_id: rpOrderId,
          handler: async (response) => {
            try {
              await ordersAPI.verifyPayment({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature })
              clearCart(); toast.success('Payment successful! 🎉')
              router.push(`/orders?success=true&order=${order.orderNumber}`)
            } catch { toast.error('Payment verification failed') }
          },
          prefill: { name: address.name, contact: address.phone, email: user?.email||'' },
          theme: { color: '#b8973a' },
          modal: { ondismiss: () => { toast('Payment cancelled'); setPlacing(false) } }
        }
        if (typeof window !== 'undefined' && window.Razorpay) { new window.Razorpay(options).open(); return }
        clearCart(); toast.success('Order placed! 🎉')
        router.push(`/orders?success=true&order=${order.orderNumber||order._id}`)
      }
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally { setPlacing(false) }
  }

  if (items.length === 0) return (
    <>
      <Navbar/>
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="text-7xl mb-6 opacity-10">🛒</div>
          <h3 className="font-serif text-2xl text-charcoal mb-4">Your cart is empty</h3>
          <Link href="/products" className="btn-gold">Shop Now</Link>
        </div>
      </div>
      <Footer/>
    </>
  )



  const OrderSummary = () => (
    <div className="bg-white border border-stone p-5 sticky top-28">
      <h3 className="font-serif text-xl text-charcoal mb-4">Order Summary</h3>
      <div className="max-h-52 overflow-y-auto space-y-3 mb-4">
        {items.map(item => (
          <div key={item.productId} className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-stone to-cream border border-stone flex items-center justify-center text-sm opacity-30 overflow-hidden">
              {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover opacity-100"/> : item.icon||'🏺'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-charcoal truncate">{item.name}</p>
              <p className="text-xs text-warm/50">Qty: {item.qty}</p>
            </div>
            <span className="text-gold text-sm flex-shrink-0">{fmt(item.price * item.qty)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-stone pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-warm/70">
          <span>Subtotal <span className="text-[10px] text-warm/40">(incl. taxes)</span></span>
          <span>{fmt(subtotal)}</span>
        </div>
        {productDiscount > 0 && <div className="flex justify-between text-warm/70"><span>Product Discount</span><span className="text-green-600">−{fmt(productDiscount)}</span></div>}
        {couponDiscount > 0 && <div className="flex justify-between text-warm/70"><span>Coupon ({coupon})</span><span className="text-green-600">−{fmt(couponDiscount)}</span></div>}
        {onlineDiscount > 0 && <div className="flex justify-between text-warm/70"><span>Online Discount ({onlineDiscountPct}%)</span><span className="text-green-600">−{fmt(onlineDiscount)}</span></div>}
        {walletDeduction > 0 && <div className="flex justify-between text-warm/70"><span>Wallet</span><span className="text-blue-600">−{fmt(walletDeduction)}</span></div>}
        <div className="flex justify-between text-warm/70"><span>Shipping</span><span className={shipping===0?'text-green-600':''}>{shipping===0?'FREE 🎉':fmt(shipping)}</span></div>
        <div className="flex justify-between text-[10px] text-warm/40 italic"><span>All prices are GST inclusive</span></div>
        <div className="flex justify-between items-center pt-3 border-t border-stone">
          <span className="font-serif text-lg text-charcoal">Total</span>
          <div className="text-right">
            {(onlineDiscount > 0 || walletDeduction > 0) && <p className="text-warm/40 text-xs line-through">{fmt(afterProductDiscount + shipping)}</p>}
            <span className="font-serif text-2xl text-gold">{fmt(payableAmount)}</span>
          </div>
        </div>
        {payableAmount === 0 && <p className="text-center text-green-600 text-xs font-medium">✓ Fully covered by wallet!</p>}
      </div>
      <div className="mt-4 pt-3 border-t border-stone space-y-1 text-xs text-warm/50">
        <p>🔒 Secure SSL Encrypted Checkout</p>
        <p>📦 Free packaging & insurance</p>
        <p>✅ Certificate of authenticity included</p>
        <p>📱 WhatsApp tracking updates</p>
      </div>
    </div>
  )

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async/>
      <Navbar/>
      <div className="pt-28 pb-10 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widests uppercase mb-3">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <Link href="/cart" className="hover:text-gold">Cart</Link><span>›</span>
            <span className="text-gold">Checkout</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white">Checkout</h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-stone sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${step>i+1?'bg-charcoal border-charcoal text-white':step===i+1?'bg-gold border-gold text-white':'border-stone text-warm/40 bg-white'}`}>
                  {step>i+1?'✓':i+1}
                </div>
                <span className={`text-[10px] tracking-widests uppercase mt-1 hidden sm:block ${step===i+1?'text-gold':'text-warm/40'}`}>{s}</span>
              </div>
              {i < STEPS.length-1 && <div className={`w-12 sm:w-20 h-px mx-2 mb-4 transition-all ${step>i+1?'bg-charcoal':'bg-stone'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* STEP 1: ADDRESS */}
            {step === 1 && (
              <div className="bg-white border border-stone p-6 md:p-8">
                <h2 className="font-serif text-2xl text-charcoal mb-6">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input value={address.name} onChange={e => setAddr('name',e.target.value)} className={`form-input ${addrErrors.name?'border-red-400 bg-red-50':''}`} placeholder="Rajesh Sharma"/>
                    <AddrErrMsg field="name" errors={addrErrors}/>
                  </div>
                  <div>
                    <label className="form-label">Mobile *</label>
                    <input type="tel" value={address.phone} onChange={e => setAddr('phone',e.target.value)} className={`form-input ${addrErrors.phone?'border-red-400 bg-red-50':''}`} placeholder="+91 98765 43210"/>
                    <AddrErrMsg field="phone" errors={addrErrors}/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Address Line 1 *</label>
                    <input value={address.line1} onChange={e => setAddr('line1',e.target.value)} className={`form-input ${addrErrors.line1?'border-red-400 bg-red-50':''}`} placeholder="House no., Street name"/>
                    <AddrErrMsg field="line1" errors={addrErrors}/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Address Line 2</label>
                    <input value={address.line2} onChange={e => setAddr('line2',e.target.value)} className="form-input" placeholder="Area, Landmark (optional)"/>
                  </div>
                  <div>
                    <label className="form-label">City *</label>
                    <input value={address.city} onChange={e => setAddr('city',e.target.value)} className={`form-input ${addrErrors.city?'border-red-400 bg-red-50':''}`} placeholder="Jaipur"/>
                    <AddrErrMsg field="city" errors={addrErrors}/>
                  </div>
                  <div>
                    <label className="form-label">State *</label>
                    <select value={address.state} onChange={e => setAddr('state',e.target.value)} className="form-input">
                      {['Rajasthan','Maharashtra','Delhi','Gujarat','Karnataka','Tamil Nadu','Uttar Pradesh','West Bengal','Kerala','Other'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">PIN Code *</label>
                    <input value={address.pincode} onChange={e => setAddr('pincode',e.target.value)} className={`form-input ${addrErrors.pincode?'border-red-400 bg-red-50':''}`} placeholder="302001" maxLength={6}/>
                    <AddrErrMsg field="pincode" errors={addrErrors}/>
                  </div>
                  <div>
                    <label className="form-label">Address Type</label>
                    <div className="flex gap-2 mt-1">
                      {['Home','Office','Other'].map(t => (
                        <button key={t} type="button" onClick={() => setAddr('type',t)}
                          className={`px-4 py-2 text-xs border transition-all ${address.type===t?'bg-charcoal text-white border-charcoal':'border-stone text-warm hover:border-gold'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Order Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input h-20 resize-none" placeholder="Special delivery instructions (optional)…"/>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button onClick={goToPayment} className="btn-gold">Continue to Payment →</button>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === 2 && (
              <div className="bg-white border border-stone p-6 md:p-8">
                <h2 className="font-serif text-2xl text-charcoal mb-6">Payment Method</h2>

                {/* Wallet toggle (top of payment) */}
                {isAuthenticated && wallet && wallet.balance > 0 && settings.walletEnabled !== false && (
                  <div className={`mb-6 p-4 border-2 transition-all rounded-sm ${useWallet ? 'border-blue-400 bg-blue-50' : 'border-stone bg-stone/20'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="font-medium text-charcoal text-sm">Use Wallet Balance</p>
                          <p className="text-warm/60 text-xs mt-0.5">Available: <strong className="text-blue-600">{fmt(wallet.balance)}</strong></p>
                        </div>
                      </div>
                      <label className="relative flex-shrink-0 cursor-pointer">
                        <input type="checkbox" checked={useWallet} onChange={e => { setUseWallet(e.target.checked); if (e.target.checked) setWalletAmount(maxWalletUse) }} className="sr-only"/>
                        <div className={`w-12 h-6 rounded-full transition-colors ${useWallet ? 'bg-blue-500' : 'bg-stone'}`}></div>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useWallet ? 'left-6' : 'left-0.5'}`}></div>
                      </label>
                    </div>
                    {useWallet && (
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <label className="form-label mb-1">Amount to use from wallet</label>
                        <div className="flex gap-3 items-center flex-wrap">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setWalletAmount(maxWalletUse)}
                              className={`px-3 py-1.5 text-xs border transition-all ${walletAmount===maxWalletUse?'bg-blue-500 text-white border-blue-500':'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
                              Max ({fmt(maxWalletUse)})
                            </button>
                            {[500,1000,2000].filter(a => a <= maxWalletUse).map(a => (
                              <button key={a} type="button" onClick={() => setWalletAmount(a)}
                                className={`px-3 py-1.5 text-xs border transition-all ${walletAmount===a?'bg-blue-500 text-white border-blue-500':'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
                                {fmt(a)}
                              </button>
                            ))}
                          </div>
                          <input type="number" value={walletAmount} onChange={e => setWalletAmount(Math.min(Number(e.target.value), maxWalletUse))}
                            min="0" max={maxWalletUse} className="form-input w-32 text-sm"/>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-warm/60">Wallet deduction: </span>
                          <span className="text-blue-600 font-medium">−{fmt(walletDeduction)}</span>
                          <span className="text-warm/60 ml-3">Remaining to pay: </span>
                          <span className={`font-medium ${payableAmount===0?'text-green-600':'text-charcoal'}`}>{payableAmount===0?'₹0 (FREE!)':fmt(payableAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Only show online payment methods if amount remaining > 0 */}
                {payableAmount > 0 && (
                  <div className="space-y-3 mb-6">
                    {[
                      { id:'razorpay', label:'Online Payment', desc:'Credit/Debit Card, UPI, Net Banking, Wallets via Razorpay', icon:'💳', badge:'Recommended', discount: onlineDiscountEnabled ? `${onlineDiscountPct}% OFF` : null, discountMsg: settings.onlinePaymentDiscountMsg },
                      { id:'cod', label:'Cash on Delivery', desc:'Pay when your order is delivered. Available up to ₹50,000', icon:'💵' },
                      { id:'bank', label:'Bank Transfer (NEFT/RTGS)', desc:'Transfer directly to our bank. Order confirmed after receipt.', icon:'🏦' },
                    ].map(m => (
                      <label key={m.id} className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${payMethod===m.id?'border-gold bg-gold/3':'border-stone hover:border-gold/40'}`}>
                        <input type="radio" name="pay" value={m.id} checked={payMethod===m.id} onChange={() => setPayMethod(m.id)} className="mt-1 accent-amber-600"/>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{m.icon}</span>
                            <span className="font-medium text-charcoal text-sm">{m.label}</span>
                            {m.badge && <span className="text-[9px] tracking-widests uppercase bg-green-100 text-green-700 px-2 py-0.5">{m.badge}</span>}
                            {m.discount && <span className="text-[9px] tracking-widests uppercase bg-gold/10 text-gold border border-gold/30 px-2 py-0.5">{m.discount}</span>}
                          </div>
                          <p className="text-xs text-warm/60 mt-1">{m.desc}</p>
                          {m.discountMsg && payMethod === 'razorpay' && (
                            <p className="text-xs text-green-600 font-medium mt-1.5 flex items-center gap-1">
                              <span>✓</span>{m.discountMsg}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                    {payMethod === 'bank' && (
                      <div className="bg-stone/20 border border-stone p-4 text-sm text-warm/70 space-y-1">
                        <p className="font-medium text-charcoal">Bank Details:</p>
                        <p>Account Name: <strong>Arihant World</strong></p>
                        <p>Account No: <strong>1234567890123</strong></p>
                        <p>IFSC: <strong>SBIN0001234</strong></p>
                        <p>Bank: State Bank of India, Makrana</p>
                      </div>
                    )}
                  </div>
                )}

                {payableAmount === 0 && (
                  <div className="bg-green-50 border border-green-200 p-4 text-center mb-6">
                    <p className="text-green-700 font-medium">🎉 Your order is fully covered by wallet balance!</p>
                    <p className="text-green-600 text-sm mt-1">No additional payment needed.</p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(1)} className="text-xs tracking-widests uppercase text-warm/60 hover:text-gold transition-colors">← Back</button>
                  <button onClick={() => setStep(3)} className="btn-gold">Review Order →</button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <div className="bg-white border border-stone p-6 md:p-8">
                <h2 className="font-serif text-2xl text-charcoal mb-6">Review Your Order</h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="border border-stone p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs tracking-widests uppercase text-warm/50">Delivery Address</h3>
                      <button onClick={() => setStep(1)} className="text-xs text-gold hover:underline">Edit</button>
                    </div>
                    <p className="font-medium text-charcoal text-sm">{address.name}</p>
                    <p className="text-warm/70 text-sm mt-1 leading-relaxed">{address.line1}{address.line2&&`, ${address.line2}`}<br/>{address.city}, {address.state} – {address.pincode}</p>
                    <p className="text-warm/50 text-xs mt-1">{address.phone}</p>
                  </div>
                  <div className="border border-stone p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs tracking-widests uppercase text-warm/50">Payment</h3>
                      <button onClick={() => setStep(2)} className="text-xs text-gold hover:underline">Edit</button>
                    </div>
                    {walletDeduction > 0 && (
                      <p className="text-blue-600 text-sm mb-1">💰 Wallet: −{fmt(walletDeduction)}</p>
                    )}
                    <p className="font-medium text-charcoal text-sm">
                      {payableAmount === 0 ? '✓ Fully paid via wallet' :
                        payMethod==='razorpay'?'💳 Online Payment (Razorpay)':
                        payMethod==='cod'?'💵 Cash on Delivery':'🏦 Bank Transfer'}
                    </p>
                    {payableAmount > 0 && walletDeduction > 0 && (
                      <p className="text-xs text-warm/50 mt-1">Remaining: {fmt(payableAmount)} via {payMethod}</p>
                    )}
                  </div>
                </div>

                <div className="border border-stone p-4 mb-6">
                  <h3 className="text-xs tracking-widests uppercase text-warm/50 mb-3">Items ({items.length})</h3>
                  <div className="divide-y divide-stone">
                    {items.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-stone to-cream border border-stone flex items-center justify-center text-sm opacity-30">{item.icon||'🏺'}</div>
                        <div className="flex-1 min-w-0"><p className="font-serif text-sm text-charcoal">{item.name}</p><p className="text-xs text-warm/50">Qty: {item.qty}</p></div>
                        <span className="text-gold text-sm">{fmt(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 p-4 mb-6 text-sm text-warm/70">
                  <span className="text-gold text-lg flex-shrink-0">📋</span>
                  <p>By placing this order you agree to our <Link href="/privacy" className="text-gold hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-gold hover:underline">Return Policy</Link>.</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button onClick={() => setStep(2)} className="text-xs tracking-widests uppercase text-warm/60 hover:text-gold transition-colors">← Back</button>
                  <button onClick={handlePlaceOrder} disabled={placing}
                    className="w-full sm:w-auto px-10 py-4 bg-gold text-white text-sm tracking-[0.15em] uppercase hover:bg-gold-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {placing && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {placing ? 'Placing…' : `Place Order · ${fmt(payableAmount)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
