'use client'
import { useState, useEffect, useRef, memo, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { useSettings } from '@/components/providers/SettingsProvider'
import { fmt } from '@/lib/config'
import { productsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// Fade-in on scroll
function useFadeIn() {
  useEffect(() => {
    const els = document.querySelectorAll('.fade-in')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ── Product Image helper ──────────────────────────────────────
function getProductImg(product) {
  const imgs = product.images || []
  const main = imgs.find(i => i.isMain) || imgs[0]
  if (main?.url && main.url !== 'null' && main.url.startsWith('http')) return main.url
  if (main?.url && main.url.startsWith('data:')) return main.url
  return null
}

// ── Dark background product card (Murtis section) ────────────
const ProductCard = memo(function ProductCard({ product }) {
  const { addItem } = useCartStore()
  const { addItem: addWish, isWishlisted, removeItem: removeWish } = useWishlistStore()
  const wishlisted = isWishlisted(product._id)
  const [imgErr, setImgErr] = useState(false)
  const imgSrc = getProductImg(product)
  const price = product.salePrice || product.price
  const discPct = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0

  const href = `/products/${product.slug || product._id}`
  return (
    <div className="product-card group relative">
      <Link href={href} className="block">
        <div className="product-img relative overflow-hidden cursor-pointer">
          {imgSrc && !imgErr
            ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)}/>
            : <span className="text-5xl opacity-15 group-hover:opacity-25 transition-opacity">{product.icon || '🏺'}</span>
          }
          {product.badge && <span className="product-badge">{product.badge}</span>}
          {discPct > 0 && <span className="absolute top-2 right-12 bg-red-500 text-white text-[9px] tracking-widest uppercase px-2 py-0.5 z-10">{discPct}% OFF</span>}
        </div>
        <div className="product-info">
          <div className="product-name hover:text-gold-light transition-colors">{product.name}</div>
          <div className="product-price flex items-center justify-between mt-2">
            <div>
              {product.salePrice && <span className="product-original">{fmt(product.price)}</span>}
              <span>{fmt(price)}</span>
            </div>
          </div>
        </div>
      </Link>
      {/* Wishlist + Add to cart — outside Link to prevent navigation */}
      <div className="absolute top-3 right-3 z-10">
        <button onClick={(e) => { e.stopPropagation(); wishlisted ? removeWish(product._id) : addWish(product); toast(wishlisted ? 'Removed' : 'Added to wishlist') }}
          className="w-8 h-8 border border-white/20 bg-black/20 flex items-center justify-center hover:border-gold transition-all">
          <svg className={`w-4 h-4 ${wishlisted ? 'text-gold fill-gold' : 'text-white'}`} fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
          </svg>
        </button>
      </div>
      <div className="px-4 pb-3">
        <button onClick={(e) => { e.stopPropagation(); addItem({ ...product }, 1); toast.success('Added to cart') }}
          className="w-full text-[10px] tracking-widest uppercase text-white/60 border border-white/20 py-1.5 hover:border-gold hover:text-gold transition-all">
          ADD TO CART
        </button>
      </div>
    </div>
  )
})

// ── Light background furniture/decor card ────────────────────
const FurnitureCard = memo(function FurnitureCard({ product }) {
  const { addItem } = useCartStore()
  const [imgErr, setImgErr] = useState(false)
  const imgSrc = getProductImg(product)
  const href = `/products/${product.slug || product._id}`

  return (
    <div className="furniture-card group relative">
      <Link href={href} className="block">
        <div className="furniture-img overflow-hidden cursor-pointer">
          {imgSrc && !imgErr
            ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)}/>
            : <span className="text-5xl opacity-20">{product.icon || '🏛️'}</span>
          }
        </div>
        <div className="furniture-info">
          <div className="furniture-name group-hover:text-gold transition-colors">{product.name}</div>
          <div className="furniture-price">
            {product.salePrice && <span className="text-warm/30 line-through text-xs mr-2">{fmt(product.price)}</span>}
            {fmt(product.salePrice || product.price)}
          </div>
        </div>
      </Link>
      <div className="px-5 pb-5">
        <button onClick={(e) => { e.stopPropagation(); addItem({ ...product }, 1); toast.success('Added to cart') }}
          className="w-full border border-stone text-warm text-xs tracking-widest uppercase py-2 hover:border-gold hover:text-gold transition-all">
          Add to Cart
        </button>
      </div>
    </div>
  )
})

// ── Collection circle ─────────────────────────────────────────
function CollectionItem({ cat }) {
  return (
    <Link href={`/category/${cat.slug}`} className="collection-item">
      <div className="collection-circle">
        <span className="text-3xl">{cat.icon}</span>
      </div>
      <p className="collection-name mt-2">{cat.label}</p>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════
// HOMEPAGE
// ════════════════════════════════════════════════════════════
export default function HomePage() {
  const settings = useSettings()
  useFadeIn()

  const [murtiTab, setMurtiTab] = useState('all')
  const [openFaq, setOpenFaq] = useState(null)
  const [email, setEmail] = useState('')
  const handleEmailChange = useCallback((e) => setEmail(e.target.value), [])

  // Products from API — targeted homepage endpoint (4 per category, parallel DB queries)
  const [murtis,       setMurtis]       = useState([])
  const [furniture,    setFurniture]    = useState([])
  const [decor,        setDecor]        = useState([])
  const [murtiSubcats, setMurtiSubcats] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    productsAPI.getHomepage()
      .then(({ data }) => {
        if (data.success) {
          setMurtis(data.murtis      || [])
          setFurniture(data.furniture || [])
          setDecor(data.decor         || [])
          setMurtiSubcats(data.murtiSubcats || [])
        }
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }, [])

  // Murti tab filter (client-side on only 4-N records already fetched)
  const murtiFiltered = murtiTab === 'all'
    ? murtis
    : murtis.filter(p =>
        p.material?.toLowerCase().includes(murtiTab.toLowerCase()) ||
        p.subcategory?.toLowerCase().includes(murtiTab.toLowerCase())
      )
  
  const cats = settings.categories || []
  const displayCategories = cats.filter(c => c.slug !== 'custom')

  const SkeletonCard = () => (
    <div className="product-card animate-pulse">
      <div className="product-img bg-white/5"></div>
      <div className="product-info space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4"></div>
        <div className="h-3 bg-white/10 rounded w-1/2"></div>
      </div>
    </div>
  )
  const FurnSkeleton = () => (
    <div className="furniture-card animate-pulse">
      <div className="furniture-img bg-stone/50"></div>
      <div className="furniture-info space-y-2">
        <div className="h-3 bg-stone/60 rounded w-3/4"></div>
        <div className="h-3 bg-stone/60 rounded w-1/2"></div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-bg relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute border border-gold/30" style={{ width:`${120+i*60}px`, height:`${120+i*60}px`, top:'50%', left:'50%', transform:`translate(-50%,-50%) rotate(${i*15}deg)`, opacity: 1-(i*0.1) }}/>
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 lg:pt-32 hero-content">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-gold"></span>
              <span className="text-gold text-xs tracking-[0.4em] uppercase">{settings.heroTagline || 'Since 1985 · Makrana Marble'}</span>
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-white leading-[1.05] mb-6">
              {settings.heroTitle ? (
                <>{settings.heroTitle.split(' in ')[0]}<br/><em className="text-gold-light">{settings.heroTitle.includes(' in ') ? 'in ' + settings.heroTitle.split(' in ')[1] : ''}</em></>
              ) : (
                <>Divine<br/><em className="text-gold-light">Craftsmanship</em><br/>in Marble</>
              )}
            </h1>
            <p className="text-stone/70 text-base leading-relaxed mb-8 max-w-lg">{settings.heroSubtitle}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="px-8 py-4 bg-gold text-white text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-all duration-300">
                {settings.heroCTA1 || 'Explore Collections'}
              </Link>
              <Link href="/about" className="px-8 py-4 border border-white/30 text-white text-xs tracking-[0.25em] uppercase hover:border-gold hover:text-gold transition-all duration-300">
                {settings.heroCTA2 || 'Our Story'}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gold animate-pulse"></div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="fade-in">
              <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-4">Est. {settings.since}</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-charcoal leading-tight mb-6">
                {settings.aboutTitle || 'Where Sacred Art Meets Eternity'}
              </h2>
              <p className="text-warm/80 leading-relaxed mb-4">
                {settings.aboutText || 'At Arihant World, every piece is born from the same white Makrana marble that built the Taj Mahal. Our master Shilpa Shastris — hereditary craftsmen — breathe devotion into every chisel stroke, creating heirlooms that carry the sacred energy of tradition.'}
              </p>
              <p className="text-warm/80 leading-relaxed mb-8">
                {settings.aboutText2 || 'Guided by Vastu principles and the science of sacred geometry, we don\'t merely make objects — we create spaces that elevate consciousness and invite the divine into your home.'}
              </p>
              <div className="flex gap-8 sm:gap-10">
                {(settings.stats || []).map((s, i) => (
                  <div key={i} className={i > 0 ? 'pl-8 sm:pl-10 border-l border-stone' : ''}>
                    <div className="font-serif text-3xl sm:text-4xl text-gold">{s.value}</div>
                    <div className="text-xs tracking-widests uppercase text-warm/60 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fade-in grid grid-cols-2 gap-3 sm:gap-4">
              {/* 4 admin-manageable images — top-left is large */}
              <div className="aspect-square bg-charcoal flex items-center justify-center overflow-hidden relative group">
                {settings.aboutImages?.[0]?.url
                  ? <img src={settings.aboutImages[0].url} alt={settings.aboutImages[0].alt||'Arihant World'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  : <span className="font-serif text-6xl text-gold/20">✦</span>}
                <span className="absolute bottom-3 right-3 text-[10px] tracking-widest uppercase text-gold/40 bg-black/20 px-1.5 py-0.5">01</span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="aspect-square bg-stone flex items-center justify-center overflow-hidden group">
                  {settings.aboutImages?.[1]?.url
                    ? <img src={settings.aboutImages[1].url} alt={settings.aboutImages[1].alt||'Arihant World'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    : <span className="text-4xl text-warm/20">◎</span>}
                </div>
                <div className="aspect-square bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden group">
                  {settings.aboutImages?.[2]?.url
                    ? <img src={settings.aboutImages[2].url} alt={settings.aboutImages[2].alt||'Arihant World'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    : <span className="font-serif text-3xl text-gold/40">AW</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MURTIS ── */}
      <section id="murtis" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#1a1208]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div className="fade-in">
              <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-2">Sacred Collection</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-white">Shop Dream <em className="text-gold-light">Murtis</em></h2>
            </div>
            <Link href="/category/murtis" className="text-gold/80 text-xs tracking-widest uppercase hover:text-gold border border-gold/30 px-4 py-2 hover:bg-gold hover:text-white transition-all">View All Murtis →</Link>
          </div>

          {/* Tabs */}
          {murtis.length > 0 && (
            <div className="flex gap-2 mb-8 flex-wrap">
              {['all', ...murtiSubcats].map(t => (
                <button key={t} onClick={() => setMurtiTab(t)}
                  className={`tab-btn capitalize ${murtiTab === t ? 'active-tab' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {productsLoading
              ? Array.from({length:4}).map((_,i) => <SkeletonCard key={i}/>)
              : (murtiFiltered.length > 0 ? murtiFiltered : murtis).slice(0,4).map(p => <ProductCard key={p._id} product={p}/>)
            }
          </div>

          {!productsLoading && murtis.length === 0 && (
            <div className="text-center py-12 text-stone/40">
              <p className="text-3xl mb-3">🕉️</p>
              <p className="text-sm">No murtis found. <Link href="/admin/products" className="text-gold underline">Add products in Admin</Link></p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/category/murtis" className="inline-block px-10 py-3.5 border border-gold text-gold text-xs tracking-[0.25em] uppercase hover:bg-gold hover:text-white transition-all duration-300">
              View All Murtis
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-cream text-center">
        <div className="max-w-3xl mx-auto fade-in">
          <div className="w-12 h-px bg-gold mx-auto mb-8"></div>
          <p className="font-serif text-xl sm:text-2xl text-charcoal leading-relaxed italic">
            "Every grain of Makrana marble carries the light of the divine — our mission is simply to reveal what is already within."
          </p>
          <p className="text-xs tracking-[0.3em] uppercase text-warm/40 mt-6">— Master Artisan, 3rd Generation</p>
          <div className="w-12 h-px bg-gold mx-auto mt-8"></div>
        </div>
      </section>

      {/* ── FURNITURE ── */}
      <section id="furniture" className="py-16 sm:py-20 px-4 sm:px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 fade-in">
            <div>
              <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-2">Luxury Living</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Shop <em>Furniture</em></h2>
            </div>
            <Link href="/category/furniture" className="text-gold/80 text-xs tracking-widest uppercase hover:text-gold border border-gold/30 px-4 py-2 hover:bg-gold hover:text-white transition-all">View All →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {productsLoading
              ? Array.from({length:4}).map((_,i) => <FurnSkeleton key={i}/>)
              : furniture.slice(0,4).map(p => <FurnitureCard key={p._id} product={p}/>)
            }
          </div>
          {!productsLoading && furniture.length === 0 && (
            <div className="text-center py-10 text-warm/40 text-sm">No furniture products yet.</div>
          )}
          <div className="text-center mt-8">
            <Link href="/category/furniture" className="inline-block px-10 py-3.5 border border-charcoal text-charcoal text-xs tracking-[0.25em] uppercase hover:bg-charcoal hover:text-white transition-all">View All Furniture</Link>
          </div>
        </div>
      </section>

      {/* ── DECOR ── */}
      <section id="decor" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#1a1208]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 fade-in">
            <div>
              <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-2">Sacred Spaces</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-white">Shop <em className="text-gold-light">Home Decor</em></h2>
            </div>
            <Link href="/category/decor" className="text-gold/80 text-xs tracking-widest uppercase hover:text-gold border border-gold/30 px-4 py-2 hover:bg-gold hover:text-white transition-all">View All →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {productsLoading
              ? Array.from({length:4}).map((_,i) => <SkeletonCard key={i}/>)
              : decor.slice(0,4).map(p => <ProductCard key={p._id} product={p}/>)
            }
          </div>
          {!productsLoading && decor.length === 0 && (
            <div className="text-center py-10 text-stone/40 text-sm">No décor products yet.</div>
          )}
          <div className="text-center mt-10">
            <Link href="/category/decor" className="inline-block px-10 py-3.5 border border-gold text-gold text-xs tracking-[0.25em] uppercase hover:bg-gold hover:text-white transition-all">View All Decor</Link>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-tag">Our Craft</span>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">From Quarry to Your Home</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {(settings.process || []).map((step, i) => (
              <div key={i} className="process-step text-center fade-in">
                <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-xl text-gold">{step.num}</span>
                </div>
                <h4 className="font-serif text-lg text-charcoal mb-2">{step.title}</h4>
                <p className="text-warm/70 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLECTIONS GRID ── */}
      <section id="collections" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#1a1208]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 fade-in">
            <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-3">Browse</span>
            <h2 className="font-serif text-4xl sm:text-5xl text-white">Shop By <em className="text-gold-light">Collections</em></h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10">
            {displayCategories.map(cat => <CollectionItem key={cat.slug} cat={cat}/>)}
          </div>
          {/* Newsletter / CTA strip */}
          <div className="bg-gold/10 border border-gold/20 p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8">
            <div className="flex-shrink-0">
              <p className="font-serif text-lg sm:text-xl text-white mb-1">Get Exclusive Offers & New Arrivals</p>
              <p className="text-stone/50 text-sm">Join 50,000+ sacred art lovers</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); toast.success('Subscribed!'); setEmail('') }} className="flex w-full sm:w-auto min-w-0">
              <input type="email" value={email} onChange={handleEmailChange} placeholder="Your email address" required
                className="flex-1 min-w-0 bg-white/5 border border-white/10 px-3 py-3 text-sm text-stone placeholder-stone/30 focus:outline-none focus:border-gold"/>
              <button type="submit" className="bg-gold text-white px-4 sm:px-6 py-3 text-xs tracking-widest uppercase hover:bg-gold-dark transition-colors flex-shrink-0 whitespace-nowrap">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 fade-in">
            <span className="section-tag">Our Community</span>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">The Community Speaks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {(settings.testimonials || []).map((r, i) => (
              <div key={i} className="review-card fade-in">
                <div className="flex gap-1 text-gold mb-3">{'★'.repeat(r.rating || 5)}</div>
                <p className="text-warm/80 leading-relaxed text-sm font-serif italic mb-4">"{r.text}"</p>
                <div className="flex items-center gap-3 border-t border-stone pt-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xs font-serif">{r.name?.[0] || 'A'}</div>
                  <div>
                    <p className="font-medium text-charcoal text-sm">{r.name}</p>
                    <p className="text-warm/50 text-xs">{r.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SACRED GUIDES ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 fade-in">
            <div>
              <span className="section-tag">Knowledge</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Sacred Guides</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title:'How Vastu Principles Affect Marble Idol Placement', tag:'Vastu', mins:5 },
              { title:'How to Care & Maintain Your Marble Murti at Home', tag:'Care', mins:4 },
              { title:'Choosing the Right Marble for Your Home Temple',     tag:'Buying Guide', mins:6 },
            ].map((g, i) => (
              <div key={i} className="bg-white border border-stone hover:border-gold transition-all cursor-pointer group p-6 fade-in">
                <span className="text-[10px] tracking-widests uppercase text-gold mb-3 block">{g.tag} · {g.mins} min read</span>
                <h3 className="font-serif text-lg text-charcoal group-hover:text-gold transition-colors leading-tight">{g.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 bg-cream">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 fade-in">
            <span className="section-tag">Queries</span>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Frequently Asked</h2>
          </div>
          <div className="space-y-3">
            {(settings.faqs || []).map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question w-full text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <div className="faq-icon flex-shrink-0">+</div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-warm/70 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONSULTATION CTA ── */}
      <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 bg-charcoal text-center">
        <div className="max-w-2xl mx-auto fade-in">
          <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-4">Free Service</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-white mb-4">
            Free Virtual<br/><em className="text-gold-light">1-on-1 Consultation</em>
          </h2>
          <p className="text-stone/60 mb-8 leading-relaxed">Talk directly with our master artisans. Get personalized recommendations for your space, budget & spiritual needs — completely free.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={`https://wa.me/${settings.whatsapp || '919876543210'}`} target="_blank" rel="noopener noreferrer"
              className="px-10 py-4 bg-gold text-white text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-all">
              Book on WhatsApp
            </a>
            <a href={`tel:${settings.phone}`}
              className="px-10 py-4 border border-white/30 text-white text-xs tracking-[0.25em] uppercase hover:border-gold hover:text-gold transition-all">
              {settings.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}