'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { useSettings } from '@/components/providers/SettingsProvider'
import { productsAPI } from '@/lib/api'
import { fmt } from '@/lib/config'
import toast from 'react-hot-toast'

function getProductImg(p) {
  const imgs = p.images || []
  const main = imgs.find(i => i.isMain) || imgs[0]
  if (main?.url && (main.url.startsWith('http') || main.url.startsWith('data:'))) return main.url
  return null
}

function CollectionProductCard({ p }) {
  const { addItem } = useCartStore()
  const { addItem: addWish, isWishlisted, removeItem: removeWish } = useWishlistStore()
  const [imgErr, setImgErr] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x:50, y:50 })
  const wishlisted = isWishlisted(p._id)
  const imgSrc = getProductImg(p)
  const price = p.salePrice || p.price
  const discPct = p.salePrice ? Math.round(((p.price-p.salePrice)/p.price)*100) : 0

  return (
    <div className="bg-white group border border-stone hover:border-gold hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link href={`/products/${p.slug || p._id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-stone to-cream relative cursor-zoom-in"
          onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); setZoomPos({x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100}) }}
          onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)}>
          {imgSrc && !imgErr
            ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover transition-transform duration-300"
                style={zoomed?{transform:'scale(2)',transformOrigin:`${zoomPos.x}% ${zoomPos.y}%`}:{transform:'scale(1)'}}
                onError={() => setImgErr(true)}/>
            : <span className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">{p.icon||'🏺'}</span>}
          {p.badge && <span className="absolute top-3 left-3 bg-gold text-white text-[10px] tracking-widest uppercase px-2 py-0.5 z-10">{p.badge}</span>}
          {discPct > 0 && <span className="absolute top-3 right-10 bg-red-500 text-white text-[10px] px-2 py-0.5 z-10">{discPct}% OFF</span>}
          <button onClick={e => { e.preventDefault(); wishlisted?removeWish(p._id):addWish(p); toast(wishlisted?'Removed':'Added to wishlist') }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-gold hover:text-white transition-all z-10 shadow-sm">
            <svg className={`w-4 h-4 ${wishlisted?'text-gold fill-gold':'text-warm/50'}`} fill={wishlisted?'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
            </svg>
          </button>
        </div>
        <div className="p-4 pb-2">
          <span className="text-[10px] tracking-widest uppercase text-gold/70">{p.material}</span>
          <h3 className="font-serif text-charcoal text-base mt-0.5 group-hover:text-gold transition-colors line-clamp-2">{p.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-gold text-xs">{'★'.repeat(Math.round(p.rating||4))}</span>
            <span className="text-warm/40 text-[10px]">({p.numReviews||0})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {p.salePrice && <span className="text-warm/40 text-xs line-through">{fmt(p.price)}</span>}
            <span className="text-gold font-medium">{fmt(price)}</span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button onClick={() => { addItem({...p},1); toast.success('Added to cart') }}
          className="w-full py-2 bg-charcoal text-white text-xs tracking-widest uppercase hover:bg-gold transition-all">
          ADD TO CART
        </button>
      </div>
    </div>
  )
}

export default function CollectionsPage() {
  const settings = useSettings()
  const [activeTab, setActiveTab] = useState('all')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const cats = (settings.categories || []).filter(c => c.slug !== 'custom')

  useEffect(() => {
    document.title = 'Collections | Arihant World'
    loadProducts()
  }, [activeTab])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = { limit:12, sort:'-isFeatured,-totalSold' }
      if (activeTab !== 'all') params.category = activeTab
      const { data } = await productsAPI.getAll(params)
      setProducts(data.products || [])
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }

  const Skeleton = () => (
    <div className="bg-white border border-stone animate-pulse">
      <div className="aspect-[4/3] bg-stone/40"></div>
      <div className="p-4 space-y-2">
        <div className="h-2 bg-stone/60 rounded w-1/3"></div>
        <div className="h-4 bg-stone/60 rounded w-3/4"></div>
        <div className="h-9 bg-stone/40 rounded mt-4"></div>
      </div>
    </div>
  )

  return (
    <>
      <Navbar/>
      {/* Hero */}
      <div className="pt-32 pb-16 px-4 sm:px-6 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[20rem] text-gold leading-none select-none">◈</span>
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widest uppercase mb-6 justify-center">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <span className="text-gold">Collections</span>
          </div>
          <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-4">Our Portfolio</span>
          <h1 className="font-serif text-5xl sm:text-6xl text-white mb-6">
            Sacred <em className="text-gold-light">Collections</em>
          </h1>
          <p className="text-stone/60 max-w-2xl mx-auto text-base leading-relaxed">
            Every piece is handcrafted from Grade-A Makrana marble by third-generation artisans. Discover divine beauty crafted to last a lifetime.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-stone sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('all')}
            className={`px-5 py-2 text-xs tracking-widest uppercase border whitespace-nowrap transition-all flex-shrink-0 ${activeTab==='all'?'bg-gold border-gold text-white':'border-stone text-warm hover:border-gold hover:text-gold'}`}>
            All
          </button>
          {cats.map(cat => (
            <button key={cat.slug} onClick={() => setActiveTab(cat.slug)}
              className={`px-4 py-2 text-xs tracking-widest uppercase border whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${activeTab===cat.slug?'bg-gold border-gold text-white':'border-stone text-warm hover:border-gold hover:text-gold'}`}>
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Category circles when showing all */}
        {activeTab === 'all' && cats.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-12">
            {cats.map(cat => (
              <button key={cat.slug} onClick={() => setActiveTab(cat.slug)} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-stone group-hover:border-gold bg-white flex items-center justify-center text-2xl sm:text-3xl transition-all group-hover:scale-110 shadow-sm">
                  {cat.icon}
                </div>
                <span className="text-[10px] tracking-widest uppercase text-warm/60 group-hover:text-gold transition-colors text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({length:8}).map((_,i) => <Skeleton key={i}/>)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4 opacity-20">🏺</div>
            <h3 className="font-serif text-2xl text-charcoal mb-3">No products yet in this collection</h3>
            <Link href="/products" className="btn-gold mt-4 inline-block">Browse All Products</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-sm text-warm/60">{products.length} pieces{activeTab !== 'all' ? ` in ${cats.find(c=>c.slug===activeTab)?.label}`:''}</p>
              <Link href="/products" className="text-xs tracking-widest uppercase text-gold border border-gold/30 px-4 py-2 hover:bg-gold hover:text-white transition-all">Browse All →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => <CollectionProductCard key={p._id} p={p}/>)}
            </div>
            <div className="text-center mt-12">
              <Link href={activeTab!=='all'?`/category/${activeTab}`:'/products'}
                className="inline-block px-12 py-4 border-2 border-charcoal text-charcoal text-xs tracking-[0.25em] uppercase hover:bg-charcoal hover:text-white transition-all">
                View Full {activeTab!=='all'?cats.find(c=>c.slug===activeTab)?.label+' ':'' }Collection →
              </Link>
            </div>
          </>
        )}
      </main>

      {/* Why Arihant */}
      <section className="bg-charcoal py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-4xl sm:text-5xl text-white">The Arihant <em className="text-gold-light">Difference</em></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {icon:'🏛️',title:'Grade-A Makrana',desc:'Same marble as the Taj Mahal, sourced directly from certified quarries'},
              {icon:'🤲',title:'Hand Carved',desc:'Third-generation artisans spending 30-45 days per piece'},
              {icon:'🌍',title:'30+ Countries',desc:'Trusted by 50,000+ homes across India and worldwide'},
              {icon:'✅',title:'Certified',desc:'Certificate of authenticity included with every purchase'},
            ].map((f,i) => (
              <div key={i} className="text-center p-5 border border-white/10 hover:border-gold/40 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h4 className="font-serif text-white text-base mb-2">{f.title}</h4>
                <p className="text-stone/50 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 bg-cream text-center">
        <h2 className="font-serif text-4xl text-charcoal mb-4">Looking for something specific?</h2>
        <p className="text-warm/60 text-sm mb-8 max-w-md mx-auto">Our artisans can craft any design to your exact specifications. Get a free consultation today.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#contact" className="btn-gold">Free Consultation</Link>
          <Link href="/products" className="px-8 py-3 border border-charcoal text-charcoal text-xs tracking-widest uppercase hover:bg-charcoal hover:text-white transition-all">Browse All Products</Link>
        </div>
      </section>
      <Footer/>
    </>
  )
}
