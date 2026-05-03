'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/ui/Loader'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { productsAPI } from '@/lib/api'
import { fmt } from '@/lib/config'
import { useSettings } from '@/components/providers/SettingsProvider'
import toast from 'react-hot-toast'

const TABS = ['Description', 'Specifications', 'Reviews', 'Shipping & Care']

// Real images from product.images[] or fallback to icon
function getProductImages(product) {
  const real = (product.images || []).filter(i => i.url && i.url !== 'null' && i.url !== '')
  if (real.length > 0) return real.map(i => ({ url: i.url, isReal: true }))
  // No real images — show placeholder
  return [{ url: null, isReal: false }]
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedFinish, setSelectedFinish] = useState('')
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('Description')
  const [activeImg, setActiveImg] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x:50, y:50 })
  const [imgError, setImgError] = useState({})
  const [pincode, setPincode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const settings = useSettings()
  const { addItem } = useCartStore()
  const { addItem: addWish, isWishlisted, removeItem: removeWish } = useWishlistStore()

  useEffect(() => {
    setLoading(true)
    setActiveImg(0)
    setImgError({})

   const loadProduct = async () => {
  let p = null

  try {
    const { data } = await productsAPI.getOne(id)
    p = data.product

    setProduct(p)
    setSelectedSize(p?.sizes?.[2] || p?.sizes?.[0] || '18"')
    setSelectedFinish(Array.isArray(p?.finish) ? p.finish[0] : p?.finish || 'Polished')

    if (p?.category) {
      try {
        const rel = await productsAPI.getAll({ category: p.category, limit: 5 })
        setRelated((rel.data.products || []).filter(rp => rp._id !== p._id).slice(0, 4))
      } catch {
        setRelated([])
      }
    }

  } catch {
    setProduct(null)
    setRelated([])
  }

  setReviews([])
  setLoading(false)
}

    loadProduct()
  }, [id])


  // SEO effect — runs whenever product state updates (correct pattern)
  useEffect(() => {
    if (!product || typeof document === 'undefined') return
    document.title = `${product.name} | Arihant World`
    const existing = document.getElementById('product-ld-json')
    if (existing) existing.remove()
    const script = document.createElement('script')
    script.id = 'product-ld-json'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description || product.shortDescription,
      'image': (product.images||[]).filter(i=>i.url).map(i=>i.url),
      'brand': { '@type':'Brand', 'name':'Arihant World' },
      'material': product.material,
      'offers': {
        '@type': 'Offer',
        'price': product.salePrice || product.price,
        'priceCurrency': 'INR',
        'availability': product.isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'seller': { '@type':'Organization','name':'Arihant World' }
      },
      'aggregateRating': product.numReviews > 0 ? {
        '@type':'AggregateRating',
        'ratingValue': product.rating,
        'reviewCount': product.numReviews
      } : undefined
    })
    document.head.appendChild(script)
    return () => {
      const el = document.getElementById('product-ld-json')
      if (el) el.remove()
    }
  }, [product])

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader />
      </div>
      <Footer />
    </>
  )

  if (!product) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">🔍</div>
          <h3 className="font-serif text-2xl text-charcoal mb-3">Product not found</h3>
          <Link href="/products" className="btn-gold">Browse Products</Link>
        </div>
      </div>
      <Footer />
    </>
  )

  const variantPrice = selectedVariant ? (selectedVariant.salePrice || selectedVariant.price) : null
  const variantOriginalPrice = selectedVariant?.price || null
  const price = variantPrice || product.salePrice || product.price
  const originalPrice = variantOriginalPrice || product.price
  const displaySalePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice
  const discountPct = displaySalePrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const wishlisted = isWishlisted(product._id)
  const productImages = getProductImages(product)
  const currentImg = productImages[activeImg] || productImages[0]

  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6) { return }
    setPincodeLoading(true)
    await new Promise(r => setTimeout(r, 700))
    // In production: call a shipping API (Delhivery, Blue Dart, etc.)
    // For now: calculate based on state zones
    const rajasthanPins = ['30','31','32','33','34','35']
    const northPins = ['10','11','12','20','21','22','23','24','25','26','27','28','29']
    const pre = pincode.slice(0,2)
    let minDays, maxDays, carrier
    if (rajasthanPins.includes(pre)) { minDays=2; maxDays=4; carrier='Blue Dart' }
    else if (northPins.includes(pre)) { minDays=4; maxDays=6; carrier='DTDC' }
    else { minDays=7; maxDays=14; carrier='Delhivery' }
    // Add crafting days if custom order
    if (product?.craftingDays) { minDays += product.craftingDays; maxDays += product.craftingDays }
    const minDate = new Date(); minDate.setDate(minDate.getDate() + minDays)
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + maxDays)
    const fmt2 = d => d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' })
    setDeliveryInfo({ minDays, maxDays, carrier, deliveryRange: `${fmt2(minDate)} – ${fmt2(maxDate)}`, pincode, serviceable: true })
    setPincodeLoading(false)
  }

  const handleAddToCart = () => {
    addItem({ ...product, selectedSize, selectedFinish }, qty)
    toast.success(`${product.name} added to cart!`)
  }

  const handleWishlist = () => {
    wishlisted ? removeWish(product._id) : addWish({ ...product })
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', { icon: wishlisted ? '💔' : '❤️' })
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!reviewText.trim()) return
    setReviews(prev => [{ id:Date.now(), name:'You', city:'', rating:reviewRating, date:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}), verified:false, comment:reviewText }, ...prev])
    setReviewText('')
    toast.success('Review submitted!')
  }

  return (
    <>
      <Navbar />
      <div className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-4">
          <div className="flex items-center gap-2 text-warm/40 text-xs tracking-widests uppercase flex-wrap">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <Link href="/products" className="hover:text-gold">Collections</Link><span>›</span>
            <Link href={`/category/${product.category}`} className="hover:text-gold capitalize">{product.category}</Link><span>›</span>
            <span className="text-gold truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

            {/* ── LEFT: Images ── */}
            <div>
              {/* Main image */}
              <div className="relative bg-gradient-to-br from-stone to-cream border border-stone aspect-square flex items-center justify-center overflow-hidden group">
                {currentImg.url && !imgError[activeImg] ? (
                  <div
                    className="w-full h-full overflow-hidden cursor-zoom-in"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 })
                    }}
                    onMouseEnter={() => setZoomed(true)}
                    onMouseLeave={() => setZoomed(false)}
                  >
                    <img
                      src={currentImg.url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={zoomed ? { transform:'scale(2)', transformOrigin:`${zoomPos.x}% ${zoomPos.y}%` } : { transform:'scale(1)' }}
                      onError={() => setImgError(prev => ({ ...prev, [activeImg]: true }))}
                    />
                  </div>
                ) : (
                  <span className="text-[8rem] opacity-20">{product.icon || '🏺'}</span>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.badge && <span className="bg-gold text-white text-[10px] tracking-widests uppercase px-3 py-1">{product.badge}</span>}
                  {discountPct > 0 && <span className="bg-red-500 text-white text-[10px] px-3 py-1">{discountPct}% OFF</span>}
                </div>

                {/* Share button */}
                <button
                  onClick={() => { navigator.share?.({ title: product.name, url: window.location.href }) || navigator.clipboard?.writeText(window.location.href).then(() => toast('Link copied!')) }}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/80 border border-stone flex items-center justify-center hover:border-gold transition-all z-10">
                  <svg className="w-4 h-4 text-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"/>
                  </svg>
                </button>

                {productImages.length === 1 && !currentImg.url && (
                  <div className="absolute bottom-4 right-4 bg-amber-500/80 text-white text-[10px] px-3 py-1 tracking-widests uppercase">No Image</div>
                )}
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {productImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 border-2 overflow-hidden flex items-center justify-center transition-all ${activeImg === i ? 'border-gold' : 'border-stone hover:border-gold/50'}`}>
                      {img.url && !imgError[i] ? (
                        <img src={img.url} alt="" className="w-full h-full object-cover"
                          onError={() => setImgError(prev => ({ ...prev, [i]: true }))}/>
                      ) : (
                        <span className="text-2xl opacity-30">{product.icon || '🏺'}</span>
                      )}
                      {activeImg === i && <div className="absolute inset-0 ring-2 ring-gold ring-inset pointer-events-none"></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Info ── */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-widests uppercase text-gold">{product.category}</span>
                  <span className="text-warm/20">·</span>
                  <span className="text-[10px] tracking-widests uppercase text-warm/60">{product.material}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gold text-sm">{'★'.repeat(5)}</span>
                  <span className="text-warm/60 text-xs">({reviews.length} reviews)</span>
                </div>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-2">{product.name}</h1>
              <p className="text-warm/60 text-sm mb-4">
                {selectedSize && `${selectedSize}`} · {product.material} · {selectedFinish}
              </p>

              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className="font-serif text-3xl text-gold">{fmt(price)}</span>
                {displaySalePrice && (
                  <>
                    <span className="text-warm/40 text-xl line-through">{fmt(originalPrice)}</span>
                    <span className="bg-green-100 text-green-700 text-xs px-3 py-1 tracking-widests uppercase">{discountPct}% OFF</span>
                  </>
                )}
              </div>

              <p className="text-warm/70 text-sm leading-relaxed mb-6 border-l-2 border-gold/30 pl-4">
                {product.description || product.shortDescription}
              </p>

              {/* Size selector with per-size pricing */}
              {(() => {
                const hasVariants = product.sizeVariants?.length > 0
                const sizes = hasVariants ? product.sizeVariants.map(v=>v.size) : (Array.isArray(product.sizes) ? product.sizes : [])
                if (!sizes.length) return null
                return (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Size / Height</label>
                      {hasVariants && <span className="text-[10px] tracking-widest uppercase text-gold">Price varies by size</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(s => {
                        const variant = hasVariants ? product.sizeVariants.find(v=>v.size===s) : null
                        const isSelected = selectedSize === s
                        return (
                          <button key={s} onClick={() => { setSelectedSize(s); setSelectedVariant(variant||null) }}
                            className={`flex flex-col items-center px-4 py-2 text-xs border transition-all ${isSelected?'bg-charcoal border-charcoal text-white':'border-stone text-warm hover:border-gold hover:text-gold'}`}>
                            <span>{s}</span>
                            {variant && <span className={`text-[10px] mt-0.5 ${isSelected?'text-gold-light':'text-gold'}`}>{variant.salePrice?`₹${variant.salePrice.toLocaleString('en-IN')}`:`₹${variant.price.toLocaleString('en-IN')}`}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Finish selector */}
              {Array.isArray(product.finish) && product.finish.length > 0 && (
                <div className="mb-6">
                  <label className="form-label">Marble Finish</label>
                  <div className="flex flex-wrap gap-2">
                    {product.finish.map(f => (
                      <button key={f} onClick={() => setSelectedFinish(f)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs border transition-all ${selectedFinish === f ? 'border-charcoal bg-charcoal text-white' : 'border-stone text-warm hover:border-gold'}`}>
                        <span className="w-3 h-3 rounded-full border border-current inline-block"
                          style={{ background: f.toLowerCase().includes('black') ? '#222' : f.toLowerCase().includes('beige') ? '#c4a67e' : '#f5f0e8' }}></span>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add to Cart */}
              <div className="flex gap-3 mb-5 flex-wrap">
                <div className="flex items-center border border-stone">
                  <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-10 h-12 flex items-center justify-center text-warm hover:text-gold hover:bg-stone/30 transition-all text-xl">−</button>
                  <span className="w-12 h-12 flex items-center justify-center text-charcoal border-x border-stone font-medium">{qty}</span>
                  <button onClick={() => setQty(q => q+1)} className="w-10 h-12 flex items-center justify-center text-warm hover:text-gold hover:bg-stone/30 transition-all text-xl">+</button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 py-3 bg-charcoal text-white text-sm tracking-widests uppercase hover:bg-gold transition-all duration-300 min-w-[140px]">
                  ADD TO CART
                </button>
                <button onClick={handleWishlist}
                  className={`w-12 h-12 flex items-center justify-center border transition-all ${wishlisted ? 'border-gold bg-gold/10' : 'border-stone hover:border-gold'}`}>
                  <svg className={`w-5 h-5 ${wishlisted ? 'text-gold fill-gold' : 'text-warm/60'}`} fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
                  </svg>
                </button>
              </div>

              <Link href="/#contact" className="block w-full text-center py-3 border border-stone text-warm text-sm tracking-widests uppercase hover:border-gold hover:text-gold transition-all mb-6">
                REQUEST CUSTOM ORDER
              </Link>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                {[['✓','100% Authentic'],['🚚',`Free Delivery ₹25,000+`],['↩️','Easy Returns 7 Days'],['⭐','Expert Artisans']].map(([icon,label]) => (
                  <div key={label} className="flex items-center gap-2 border border-stone px-3 py-2.5">
                    <span className="text-gold">{icon}</span>
                    <span className="text-xs text-warm/70">{label}</span>
                  </div>
                ))}
              </div>

              {/* Pincode Delivery Checker — admin can hide/show */}
              {false && settings.pincodeCheckerEnabled !== false && <div className="mt-4 border border-stone p-4">
                <p className="text-xs tracking-widests uppercase text-warm/60 mb-3">📍 Check Delivery to Your Pincode</p>
                <div className="flex gap-2">
                  <input
                    type="text" maxLength={6} value={pincode}
                    onChange={e => { setPincode(e.target.value.replace(/\D/g,'')); setDeliveryInfo(null) }}
                    onKeyDown={e => e.key==='Enter' && checkDelivery()}
                    placeholder="Enter 6-digit PIN"
                    className="form-input flex-1 text-sm font-mono"
                  />
                  <button onClick={checkDelivery} disabled={pincodeLoading || pincode.length !== 6}
                    className="px-5 py-2.5 bg-charcoal text-white text-xs tracking-widests uppercase hover:bg-gold transition-all disabled:opacity-40">
                    {pincodeLoading ? '…' : 'Check'}
                  </button>
                </div>
                {deliveryInfo && (
                  <div className="mt-3 bg-green-50 border border-green-200 p-3">
                    <p className="text-green-700 text-sm font-medium">✓ Delivery available to {deliveryInfo.pincode}</p>
                    <p className="text-green-600 text-xs mt-1">
                      Estimated delivery: <strong>{deliveryInfo.deliveryRange}</strong>
                      {' '}· via {deliveryInfo.carrier}
                    </p>
                    {product?.craftingDays > 0 && (
                      <p className="text-amber-600 text-xs mt-1">
                        Includes ~{product.craftingDays} days crafting time
                      </p>
                    )}
                  </div>
                )}
              </div>
}
              {product.craftingDays && (
                <div className="mt-4 bg-gold/5 border border-gold/20 px-4 py-3 text-sm text-warm/70">
                  ⏱ Estimated crafting: <strong className="text-charcoal">{product.craftingDays}–{product.craftingDays + 7} days</strong>
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="mb-16">
            <div className="flex border-b border-stone overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-xs tracking-widests uppercase whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-charcoal text-charcoal font-medium' : 'border-transparent text-warm/50 hover:text-gold'}`}>
                  {tab}{tab === 'Reviews' ? ` (${reviews.length})` : ''}
                </button>
              ))}
            </div>

            <div className="py-8">
              {activeTab === 'Description' && (
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal mb-4">About this piece</h3>
                    <div className="text-warm/70 text-sm leading-relaxed space-y-4">
                      <p>{product.description}</p>
                      <p>Each piece is a unique original — slight natural variations in the marble's veining make every piece one-of-a-kind. Comes with a certificate of authenticity.</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal mb-4">Crafting Process</h3>
                    <div className="space-y-4">
                      {(product.process || [
                        { step:'Stone Selection', desc:'Premium Makrana marble blocks hand-selected from certified quarries.' },
                        { step:'Hand Carving', desc:'Artisans spend 30–45 days hand-carving using traditional chisels and modern precision tools.' },
                        { step:'Finishing & Polish', desc:'A seven-stage polishing process brings out the marble\'s natural luminescence.' },
                      ]).map((s, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-6 h-6 rounded-full border border-gold flex items-center justify-center text-gold text-xs font-serif flex-shrink-0 mt-0.5">{i+1}</div>
                          <div>
                            <p className="text-xs tracking-widests uppercase text-gold mb-1">{s.step}</p>
                            <p className="text-warm/70 text-sm leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Specifications' && (
                <div className="max-w-lg">
                  <h3 className="font-serif text-2xl text-charcoal mb-6">Product Specifications</h3>
                  <div className="divide-y divide-stone">
                    {[
                      ['Material', product.material || 'Makrana White Marble'],
                      ['Height', selectedSize || (product.dimensions?.height) || '—'],
                      ['Weight', product.dimensions?.weight || '—'],
                      ['Width', product.dimensions?.width || '—'],
                      ['Depth', product.dimensions?.depth || '—'],
                      ['Finish', selectedFinish || '—'],
                      ['Origin', 'Makrana, Rajasthan, India'],
                      ['Crafting Time', product.craftingDays ? `${product.craftingDays}–${product.craftingDays+7} days` : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex py-3 text-sm">
                        <span className="w-40 text-warm/50 flex-shrink-0">{k}</span>
                        <span className="text-charcoal font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Reviews' && (
                <div>
                  <div className="flex flex-col md:flex-row gap-10 mb-10">
                    <div className="text-center md:w-48 flex-shrink-0">
                      <p className="font-serif text-6xl text-gold">{product.rating || 4.8}</p>
                      <div className="flex justify-center text-gold text-xl my-2">{'★'.repeat(5)}</div>
                      <p className="text-warm/50 text-sm">{reviews.length} reviews</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-xl text-charcoal mb-4">Write a Review</h4>
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="form-label">Rating</label>
                          <div className="flex gap-2 mt-1">
                            {[1,2,3,4,5].map(r => (
                              <button key={r} type="button" onClick={() => setReviewRating(r)}
                                className={`text-2xl transition-colors ${r <= reviewRating ? 'text-gold' : 'text-stone'}`}>★</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="form-label">Your Review</label>
                          <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                            className="form-input h-24 resize-none" placeholder="Share your experience…" required/>
                        </div>
                        <button type="submit" className="btn-gold">Submit Review</button>
                      </form>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-white border border-stone p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-charcoal text-sm">{r.name}</p>
                              {r.city && <span className="text-warm/40 text-xs">{r.city}</span>}
                            </div>
                            <div className="flex text-gold text-sm mt-0.5">{'★'.repeat(r.rating)}</div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-warm/40">{r.date}</p>
                            {r.verified && <p className="text-[10px] text-green-600 mt-0.5">✓ Verified Purchase</p>}
                          </div>
                        </div>
                        <p className="text-warm/70 text-sm leading-relaxed font-serif italic">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Shipping & Care' && (
                <div className="grid md:grid-cols-2 gap-12 max-w-3xl">
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal mb-4">Shipping</h3>
                    <div className="space-y-3 text-sm text-warm/70">
                      <p>✈ <strong className="text-charcoal">Pan India:</strong> 7–14 business days</p>
                      <p>🌍 <strong className="text-charcoal">International:</strong> 15–25 business days</p>
                      <p>🚚 <strong className="text-charcoal">Free shipping</strong> on orders above ₹25,000</p>
                      <p>📦 Custom wooden crating with foam padding</p>
                      <p>🔍 Full insurance coverage during transit</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal mb-4">Care Instructions</h3>
                    <div className="space-y-3 text-sm text-warm/70">
                      <p>🧼 Clean gently with a soft, damp cloth</p>
                      <p>🚫 Avoid acidic cleaners or harsh chemicals</p>
                      <p>☀️ Keep away from prolonged direct sunlight</p>
                      <p>💧 For puja: use only clean, pure water</p>
                      <p>🪄 Apply coconut oil annually to maintain luster</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <div>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="section-tag">You May Also Like</span>
                  <h2 className="font-serif text-3xl md:text-4xl text-charcoal">Related <em>Pieces</em></h2>
                </div>
                <Link href={`/category/${product.category}`} className="text-xs tracking-widests uppercase text-gold hover:text-gold-dark transition-colors">VIEW ALL →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {related.map(p => {
                  const relImg = (p.images || []).find(i => i.url && i.url !== 'null')?.url
                  return (
                    <div key={p._id} className="furniture-card hover:shadow-lg group">
                      <Link href={`/products/${p.slug || p._id}`}>
                        <div className="furniture-img overflow-hidden">
                          {relImg
                            ? <img src={relImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                            : <span className="text-4xl opacity-20 group-hover:opacity-35 transition-opacity">{p.icon || '🏺'}</span>
                          }
                        </div>
                        <div className="furniture-info">
                          <span className="text-[10px] tracking-widests uppercase text-gold block mb-1">{p.material}</span>
                          <div className="furniture-name">{p.name}</div>
                          <div className="furniture-price">
                            {p.salePrice && <span className="text-warm/30 line-through text-xs mr-1">{fmt(p.price)}</span>}
                            {fmt(p.salePrice || p.price)}
                          </div>
                        </div>
                      </Link>
                      <div className="px-5 pb-4">
                        <button onClick={() => { addItem({...p}, 1); toast.success('Added to cart') }}
                          className="w-full border border-stone text-warm text-xs tracking-widests uppercase py-2 hover:border-gold hover:text-gold transition-all">
                          ADD TO CART
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  )
}
