'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/lib/store'
import { useSettings } from '@/components/providers/SettingsProvider'
import { SITE_CONFIG, fmt } from '@/lib/config'
import toast from 'react-hot-toast'

// Prices shown are GST-inclusive. GST is embedded in the price itself.
// "Subtotal" = sum of all prices (GST included)
// No separate GST line shown to customer

export default function CartPage() {
  const items = useCartStore(s => s.items)
  const coupon = useCartStore(s => s.coupon)
  const couponDiscount = useCartStore(s => s.couponDiscount)
  const { updateQty, removeItem, clearCart, applyCoupon, removeCoupon } = useCartStore()
  const settings = useSettings()
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // All prices are GST-inclusive
  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0)
  const productDiscount = items.reduce((t, i) => t + (i.originalPrice - i.price) * i.qty, 0)
  const afterProductDiscount = subtotal - couponDiscount
  const shipping = afterProductDiscount >= (settings.freeShippingThreshold || SITE_CONFIG.freeShippingThreshold) ? 0 : 350
  const total = afterProductDiscount + shipping
  const freeShippingRemaining = (settings.freeShippingThreshold || SITE_CONFIG.freeShippingThreshold) - afterProductDiscount

  const handleCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const codes = { 'ARIHANT10': Math.round(subtotal * 0.1), 'SAVE10': Math.round(subtotal * 0.1), 'WELCOME500': 500, 'FESTIVE20': Math.min(Math.round(subtotal * 0.2), 10000) }
    const code = couponCode.toUpperCase()
    if (codes[code]) {
      applyCoupon(code, codes[code])
      toast.success(`Coupon ${code} applied! ${fmt(codes[code])} off`)
      setCouponCode('')
    } else {
      toast.error('Invalid coupon. Try ARIHANT10')
    }
    setCouponLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="pt-28 pb-10 bg-charcoal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widest uppercase mb-4">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span><span className="text-gold">Shopping Cart</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white">Your Cart</h1>
        </div>
      </div>

      {items.length > 0 && freeShippingRemaining > 0 && (
        <div className="bg-gold/10 border-b border-gold/20 py-3 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <p className="text-xs tracking-widest uppercase text-warm">🎉 Add <strong className="text-gold">{fmt(freeShippingRemaining)}</strong> more for free shipping!</p>
            <div className="w-full sm:max-w-xs h-1 bg-stone rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold-dark to-gold" style={{ width:`${Math.min((afterProductDiscount/(settings.freeShippingThreshold||SITE_CONFIG.freeShippingThreshold))*100,100)}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-6 opacity-10">🛒</div>
            <h3 className="font-serif text-3xl text-charcoal mb-3">Your cart is empty</h3>
            <p className="text-warm/60 mb-8">Discover our exquisite collection of handcrafted marble art.</p>
            <Link href="/products" className="btn-gold">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-charcoal">Items <span className="text-gold">({items.reduce((t,i)=>t+i.qty,0)})</span></h2>
                <button onClick={() => { clearCart(); toast('Cart cleared') }} className="text-xs tracking-widest uppercase text-warm/40 hover:text-red-500 transition-colors">Clear All</button>
              </div>
              <div className="divide-y divide-stone">
                {items.map(item => (
                  <div key={item.productId} className="flex gap-4 items-start py-6 group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gradient-to-br from-stone to-cream border border-stone flex items-center justify-center text-3xl opacity-30 group-hover:opacity-50 transition-opacity overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-100"/> : item.icon||'🏺'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] tracking-[0.2em] uppercase text-gold block mb-1">{item.category}</span>
                          <h3 className="font-serif text-charcoal text-base leading-tight">{item.name}</h3>
                          {item.variant && <p className="text-xs text-warm/50 mt-1">{item.variant}</p>}
                          <p className="text-[10px] text-warm/40 mt-1">Prices are inclusive of all taxes</p>
                        </div>
                        <button onClick={() => { removeItem(item.productId, item.variant || null); toast('Item removed') }} className="text-warm/30 hover:text-red-500 transition-colors text-lg flex-shrink-0">✕</button>
                      </div>
                      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                        <div className="flex items-center border border-stone">
                          <button onClick={() => updateQty(item.productId, item.qty-1, item.variant || null)} className="w-8 h-8 flex items-center justify-center text-warm hover:text-gold hover:bg-stone/40 transition-colors text-xl">−</button>
                          <span className="w-10 h-8 flex items-center justify-center text-charcoal text-sm border-x border-stone">{item.qty}</span>
                          <button onClick={() => updateQty(item.productId, item.qty+1, item.variant || null)} className="w-8 h-8 flex items-center justify-center text-warm hover:text-gold hover:bg-stone/40 transition-colors text-xl">+</button>
                        </div>
                        <div className="text-right">
                          {item.originalPrice > item.price && <span className="text-warm/40 text-xs line-through mr-2">{fmt(item.originalPrice * item.qty)}</span>}
                          <span className="text-gold font-medium">{fmt(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-8 pt-6 border-t border-stone">
                <h3 className="text-xs tracking-[0.3em] uppercase text-warm/70 mb-4">Apply Coupon Code</h3>
                {coupon ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-3">
                    <span className="text-green-700 text-sm flex-1">✓ <strong>{coupon}</strong> applied — {fmt(couponDiscount)} off</span>
                    <button onClick={() => { removeCoupon(); toast('Coupon removed') }} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex max-w-sm">
                      <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="form-input" style={{borderRight:'none'}} onKeyDown={e => e.key==='Enter' && handleCoupon()}/>
                      <button onClick={handleCoupon} disabled={couponLoading} className="bg-charcoal text-white text-xs tracking-widest uppercase px-5 hover:bg-gold transition-colors flex-shrink-0 disabled:opacity-60">{couponLoading?'…':'Apply'}</button>
                    </div>
                    <p className="text-[10px] text-warm/30 mt-2">Try: ARIHANT10 · WELCOME500 · FESTIVE20</p>
                  </div>
                )}
              </div>
              <div className="mt-6"><Link href="/products" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-warm/60 hover:text-gold transition-colors">← Continue Shopping</Link></div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-stone p-6 sticky top-28">
                <h2 className="font-serif text-2xl text-charcoal mb-6">Order Summary</h2>
                <div className="space-y-3 pb-4 border-b border-stone text-sm">
                  <div className="flex justify-between text-warm/70">
                    <span>Subtotal <span className="text-[10px] text-warm/40">(incl. taxes)</span></span>
                    <span className="font-medium text-charcoal">{fmt(subtotal)}</span>
                  </div>
                  {productDiscount > 0 && <div className="flex justify-between text-warm/70"><span>Product Discount</span><span className="font-medium text-green-600">−{fmt(productDiscount)}</span></div>}
                  {couponDiscount > 0 && <div className="flex justify-between text-warm/70"><span>Coupon ({coupon})</span><span className="font-medium text-green-600">−{fmt(couponDiscount)}</span></div>}
                  <div className="flex justify-between text-warm/70"><span>Shipping</span><span className={`font-medium ${shipping===0?'text-green-600':''}`}>{shipping===0?'FREE 🎉':fmt(shipping)}</span></div>
                  <div className="flex justify-between text-[10px] text-warm/40 italic"><span>All prices are inclusive of GST</span></div>
                </div>
                <div className="flex justify-between items-center py-4 mb-5">
                  <span className="font-serif text-xl text-charcoal">Total</span>
                  <span className="font-serif text-2xl text-gold">{fmt(total)}</span>
                </div>
                <Link href="/checkout" className="block w-full text-center py-4 bg-gold text-white text-sm tracking-[0.2em] uppercase hover:bg-gold-dark transition-all duration-300 mb-3">Proceed to Checkout</Link>
                <Link href="/auth/login" className="block w-full text-center py-3 border border-stone text-warm text-xs tracking-widest uppercase hover:border-gold hover:text-gold transition-all duration-300">Login to Save Cart</Link>
                <div className="mt-5 pt-5 border-t border-stone grid grid-cols-3 gap-2 text-center">
                  {[['🔒','Secure Pay'],['🚚','Free Shipping'],['↩️','Easy Returns']].map(([icon,label])=>(
                    <div key={label}><div className="text-gold text-xl mb-1">{icon}</div><p className="text-[9px] tracking-widests uppercase text-warm/50 leading-tight">{label}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
