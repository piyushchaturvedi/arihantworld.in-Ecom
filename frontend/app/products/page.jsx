'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/ui/Loader'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { productsAPI } from '@/lib/api'
import { useSettings } from '@/components/providers/SettingsProvider'
import { SITE_CONFIG, fmt } from '@/lib/config'
import toast from 'react-hot-toast'

const MATERIALS = ['Makrana White Marble', 'Black Marble', 'Pink Marble', 'Green Marble', 'Sandstone']
const PRICE_MAX = 500000
const PER_PAGE = 8

// ─── Helper: get best image src for a product ────────────────
function getProductImage(product) {
  if (!product.images?.length) return null
  const main = product.images.find(i => i.isMain) || product.images[0]
  if (!main?.url || main.url === 'null' || main.url === '') return null
  if (main.url.startsWith('http') || main.url.startsWith('https') || main.url.startsWith('data:')) return main.url
  if (main.url.startsWith('/')) return (process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'http://localhost:5000') + main.url
  return null
}

// ─── Product Image Component ─────────────────────────────────
function ProductImage({ product, className = '', fallbackSize = 'text-5xl' }) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = getProductImage(product)

  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt={product.name}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    )
  }

  // Fallback: emoji or placeholder
  return (
    <span className={`${fallbackSize} opacity-20`}>{product.icon || '🏺'}</span>
  )
}

// ─── Product Card ────────────────────────────────────────────
function ProductCard({ product, view }) {
  const { addItem } = useCartStore()
  const { addItem: addWish, isWishlisted, removeItem: removeWish } = useWishlistStore()
  const wishlisted = isWishlisted(product._id)
  const price = product.salePrice || product.price
  const discPct = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0

  const handleCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({ ...product }, 1)
    toast.success(`${product.name} added to cart`)
  }
  const handleWish = (e) => {
    e.preventDefault()
    e.stopPropagation()
    wishlisted ? removeWish(product._id) : addWish({ ...product })
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  if (view === 'list') return (
    <div className="bg-white border border-stone hover:border-gold transition-all duration-300 group flex gap-4 p-4">
      <Link href={`/products/${product.slug || product._id}`}
        className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-stone to-cream flex items-center justify-center overflow-hidden">
        <ProductImage product={product} fallbackSize="text-4xl" className="group-hover:scale-105 transition-transform duration-300"/>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] tracking-widests uppercase text-gold/80 block mb-1">{product.material}</span>
            <Link href={`/products/${product.slug || product._id}`}>
              <h3 className="font-serif text-charcoal text-lg hover:text-gold transition-colors">{product.name}</h3>
            </Link>
            {product.shortDescription && <p className="text-warm/60 text-xs mt-1 leading-relaxed line-clamp-2">{product.shortDescription}</p>}
          </div>
          <button onClick={handleWish} className="flex-shrink-0 p-1.5 hover:text-gold transition-colors ml-2">
            <svg className={`w-5 h-5 ${wishlisted ? 'text-gold fill-gold' : 'text-warm/30'}`} fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div>
            {product.salePrice && <span className="text-warm/40 text-sm line-through mr-2">{fmt(product.price)}</span>}
            <span className="text-gold font-serif text-lg">{fmt(price)}</span>
            {discPct > 0 && <span className="ml-2 text-xs bg-gold/10 text-gold px-2 py-0.5">{discPct}% OFF</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gold text-xs">{'★'.repeat(Math.round(product.rating || 4))}</span>
            <span className="text-warm/40 text-xs">({product.numReviews || 0})</span>
            <button onClick={handleCart} className="px-5 py-2 bg-charcoal text-white text-xs tracking-widests uppercase hover:bg-gold transition-all">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white border border-stone hover:border-gold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative">
      <Link href={`/products/${product.slug || product._id}`}>
        <div className="aspect-square bg-gradient-to-br from-stone to-cream flex items-center justify-center relative overflow-hidden">
          <ProductImage product={product} className="group-hover:scale-105 transition-transform duration-500"/>
          {product.badge && (
            <span className="absolute top-3 left-3 bg-gold text-white text-[10px] tracking-widests uppercase px-2 py-0.5 z-10">{product.badge}</span>
          )}
          {discPct > 0 && (
            <span className="absolute top-3 right-10 bg-red-500 text-white text-[10px] px-2 py-0.5 z-10">{discPct}% OFF</span>
          )}
          <button onClick={handleWish}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-gold hover:text-white transition-all z-10 shadow-sm">
            <svg className={`w-4 h-4 ${wishlisted ? 'text-gold fill-gold' : 'text-warm/50'}`} fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
            </svg>
          </button>
        </div>
        <div className="p-4">
          <span className="text-[10px] tracking-widests uppercase text-gold/80 block mb-1">{product.material}</span>
          <h3 className="font-serif text-charcoal text-base mb-1.5 leading-tight group-hover:text-gold transition-colors line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-1 mb-3">
            <span className="text-gold text-xs">{'★'.repeat(Math.round(product.rating || 4))}</span>
            <span className="text-warm/40 text-[10px]">({product.numReviews || 0})</span>
          </div>
          <div>
            {product.salePrice && <span className="text-warm/40 text-xs line-through mr-1">{fmt(product.price)}</span>}
            <span className="text-gold font-medium">{fmt(price)}</span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button onClick={handleCart}
          className="w-full py-2.5 border border-stone text-warm text-xs tracking-widests uppercase hover:bg-charcoal hover:text-white hover:border-charcoal transition-all duration-300">
          ADD TO CART
        </button>
      </div>
    </div>
  )
}

// ─── Skeleton loader card ─────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-stone animate-pulse">
      <div className="aspect-square bg-stone/40"></div>
      <div className="p-4 space-y-2">
        <div className="h-2 bg-stone/60 rounded w-1/3"></div>
        <div className="h-4 bg-stone/60 rounded w-3/4"></div>
        <div className="h-3 bg-stone/40 rounded w-1/2 mt-3"></div>
      </div>
      <div className="px-4 pb-4"><div className="h-9 bg-stone/40 rounded-sm"></div></div>
    </div>
  )
}

// ─── Main Products Content ────────────────────────────────────
function ProductsContent() {
  const searchParams = useSearchParams()
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('featured')
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '')
  const [selectedCats, setSelectedCats] = useState(
    searchParams.get('category') ? [searchParams.get('category')] : []
  )
  const [selectedMats, setSelectedMats] = useState([])
  const [priceRange, setPriceRange] = useState(PRICE_MAX)

  // Infinite scroll state
  // SEO — update document title
  useEffect(() => {
    document.title = `Shop All Marble Products | Arihant World`
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content','Browse our complete collection of handcrafted marble murtis, home temples, furniture & décor. Premium Makrana marble since 1985.')
  }, [])

  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [usingDemo, setUsingDemo] = useState(false)

  const sentinelRef = useRef(null)
  const filtersRef = useRef({ selectedCats, selectedMats, priceRange, appliedSearch, sort })

  // Keep filtersRef current
  useEffect(() => {
    filtersRef.current = { selectedCats, selectedMats, priceRange, appliedSearch, sort }
  }, [selectedCats, selectedMats, priceRange, appliedSearch, sort])

  const settings = useSettings()
  const categoryCount = (settings.categories || SITE_CONFIG.categories)
    .filter(c => c.slug !== 'custom')
    .map(c => ({ ...c, count: 0 }))

  // Build API query params from current filters
  const buildParams = useCallback((pageNum) => {
    const f = filtersRef.current
    const params = { page: pageNum, limit: PER_PAGE, sort: f.sort === 'featured' ? '-isFeatured,-totalSold' : f.sort === 'price-asc' ? 'price' : f.sort === 'price-desc' ? '-price' : f.sort === 'rating' ? '-rating' : '-createdAt' }
    if (f.selectedCats.length === 1) params.category = f.selectedCats[0]
    if (f.selectedMats.length === 1) params.material = f.selectedMats[0]
    if (f.priceRange < PRICE_MAX) params.maxPrice = f.priceRange
    if (f.appliedSearch) params.search = f.appliedSearch
    return params
  }, [])

  // Load page of products (API first, demo fallback)
  const loadProducts = useCallback(async (pageNum, reset = false) => {
    if (pageNum === 1) setInitialLoading(true)
    else setLoadingMore(true)

    try {
      const params = buildParams(pageNum)
      const { data } = await productsAPI.getAll(params)
      const newProducts = data.products || []
      const total = data.total || 0

      setTotalProducts(total)
      setProducts(prev => reset || pageNum === 1 ? newProducts : [...prev, ...newProducts])
      setHasMore(pageNum < (data.pages || 1))
      setUsingDemo(false)
    } catch {
      // API unavailable — use demo data with client-side filtering
      const f = filtersRef.current
      let demo = []
      // API unavailable, show empty state
      const start = (pageNum - 1) * PER_PAGE
      const slice = demo.slice(start, start + PER_PAGE)
      setTotalProducts(demo.length)
      setProducts(prev => reset || pageNum === 1 ? slice : [...prev, ...slice])
      setHasMore(start + PER_PAGE < demo.length)
      setUsingDemo(true)
    } finally {
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  // Reset + reload when filters change
  const resetAndLoad = useCallback(() => {
    setPage(1)
    setProducts([])
    setHasMore(true)
    loadProducts(1, true)
  }, [loadProducts])

  useEffect(() => { resetAndLoad() }, [selectedCats, selectedMats, priceRange, appliedSearch, sort])

  // Infinite scroll: IntersectionObserver watches sentinel div at bottom
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMore && !loadingMore && !initialLoading) {
          const nextPage = page + 1
          setPage(nextPage)
          loadProducts(nextPage)
        }
      },
      { rootMargin: '200px' } // trigger 200px before reaching bottom
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, initialLoading, page, loadProducts])

  const toggleCat = (cat) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }
  const toggleMat = (mat) => {
    setSelectedMats(prev => prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat])
  }
  const clearAll = () => {
    setSelectedCats([]); setSelectedMats([]); setPriceRange(PRICE_MAX)
    setAppliedSearch(''); setSearchInput('')
  }

  const activeFilterCount = selectedCats.length + selectedMats.length + (priceRange < PRICE_MAX ? 1 : 0) + (appliedSearch ? 1 : 0)

  const Sidebar = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-warm/50 mb-3 font-medium">Category</h3>
        <div className="space-y-2.5">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" checked={selectedCats.length === 0} onChange={() => setSelectedCats([])} className="w-4 h-4 accent-amber-600"/>
              <span className="text-sm text-charcoal group-hover:text-gold transition-colors">All Products</span>
            </div>
            <span className="text-xs text-warm/40 tabular-nums">{totalProducts}</span>
          </label>
          {categoryCount.map(c => (
            <label key={c.slug} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <input type="checkbox" checked={selectedCats.includes(c.slug)} onChange={() => toggleCat(c.slug)} className="w-4 h-4 accent-amber-600"/>
                <span className="text-sm text-warm/70 group-hover:text-gold transition-colors capitalize">{c.label}</span>
              </div>
              <span className="text-xs text-warm/40 tabular-nums">{c.count}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-stone"></div>

      {/* Material */}
      <div>
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-warm/50 mb-3 font-medium">Material</h3>
        <div className="space-y-2.5">
          {MATERIALS.map(m => (
            <label key={m} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={selectedMats.includes(m)} onChange={() => toggleMat(m)} className="w-4 h-4 accent-amber-600"/>
              <span className="text-sm text-warm/70 group-hover:text-gold transition-colors">{m}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-stone"></div>

      {/* Price */}
      <div>
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-warm/50 mb-3 font-medium">Price Range</h3>
        <div className="flex justify-between text-xs text-warm/50 mb-2">
          <span>₹5,000</span><span>{fmt(PRICE_MAX)}</span>
        </div>
        <input type="range" min="5000" max={PRICE_MAX} step="5000" value={priceRange}
          onChange={e => setPriceRange(Number(e.target.value))}
          className="w-full h-1 bg-stone rounded appearance-none cursor-pointer accent-amber-600"/>
        <p className="text-xs text-gold mt-2 font-medium">Up to: {fmt(priceRange)}</p>
      </div>

      <div className="h-px bg-stone"></div>

      {/* Search */}
      <div>
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-warm/50 mb-3 font-medium">Search</h3>
        <form onSubmit={e => { e.preventDefault(); setAppliedSearch(searchInput) }} className="flex">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search products…" className="form-input text-sm" style={{ borderRight: 'none' }}/>
          <button type="submit" className="bg-gold text-white px-3 hover:bg-gold-dark transition-colors flex-shrink-0">→</button>
        </form>
        {appliedSearch && (
          <button onClick={() => { setAppliedSearch(''); setSearchInput('') }}
            className="text-[10px] text-red-400 hover:text-red-600 mt-1">✕ Clear "{appliedSearch}"</button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="w-full py-2.5 border border-red-200 text-red-500 text-xs tracking-widests uppercase hover:bg-red-50 transition-all">
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  )

  return (
    <>
      <Navbar />

      {/* Page Header */}
      <div className="pt-28 pb-12 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[20rem] text-gold leading-none">◈</span>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widests uppercase mb-4">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <span className="text-gold">Collections</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-2">Handcrafted Since 1985</span>
              <h1 className="font-serif text-5xl md:text-6xl text-white">Our <em className="text-gold-light">Collections</em></h1>
              <p className="text-stone/60 mt-3 text-sm max-w-md">
                {totalProducts > 0 ? `${totalProducts} masterworks` : 'Masterworks'} in Makrana marble, handcrafted by third-generation artisans.
              </p>
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCats([])}
                className={`px-5 py-2 text-xs tracking-widests uppercase border transition-all ${selectedCats.length === 0 ? 'bg-gold border-gold text-white' : 'border-stone/30 text-stone/60 hover:border-gold hover:text-gold'}`}>
                ALL
              </button>
              {(settings.categories || SITE_CONFIG.categories).filter(c => c.slug !== 'custom').map(c => (
                <button key={c.slug} onClick={() => setSelectedCats([c.slug])}
                  className={`px-5 py-2 text-xs tracking-widests uppercase border transition-all ${selectedCats.includes(c.slug) && selectedCats.length === 1 ? 'bg-gold border-gold text-white' : 'border-stone/30 text-stone/60 hover:border-gold hover:text-gold'}`}>
                  {c.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="bg-gold/10 border-y border-gold/20 py-2.5 overflow-hidden">
        <div className="marquee-track gap-12 text-warm/60 text-[10px] tracking-[0.3em] uppercase">
          {[...Array(2)].map((_, gi) =>
            ['Free Shipping Over ₹25,000', 'Custom Sizing Available', 'Pan India Delivery', 'Export Worldwide'].map((t, i) => (
              <span key={`${gi}-${i}`} className="flex-shrink-0 mr-12">◆ {t}</span>
            ))
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-stone sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
          <button onClick={() => setShowSidebar(!showSidebar)}
            className={`flex items-center gap-2 text-xs tracking-widests uppercase border px-4 py-2 transition-all ${showSidebar ? 'bg-charcoal text-white border-charcoal' : 'border-stone text-warm hover:border-gold hover:text-gold'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
            </svg>
            FILTER {activeFilterCount > 0 && <span className="bg-gold text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{activeFilterCount}</span>}
          </button>

          <span className="text-xs text-warm/50">
            {initialLoading ? 'Loading…' : `${products.length}${hasMore ? '+' : ''} of ${totalProducts} products`}
          </span>

          {/* Active filter tags */}
          {[
            ...selectedCats.map(c => ({ label: c.toUpperCase(), clear: () => toggleCat(c) })),
            ...selectedMats.map(m => ({ label: m, clear: () => toggleMat(m) })),
            ...(priceRange < PRICE_MAX ? [{ label: `Max ${fmt(priceRange)}`, clear: () => setPriceRange(PRICE_MAX) }] : []),
            ...(appliedSearch ? [{ label: `"${appliedSearch}"`, clear: () => { setAppliedSearch(''); setSearchInput('') } }] : []),
          ].map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] tracking-widests uppercase bg-gold/10 text-gold border border-gold/30 px-2.5 py-1.5">
              {f.label}<button onClick={f.clear} className="ml-1 hover:text-red-500 transition-colors">✕</button>
            </span>
          ))}

          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs text-warm/40 hover:text-red-500 transition-colors underline">Clear All</button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-xs tracking-widests uppercase border border-stone text-warm px-3 py-2 focus:outline-none focus:border-gold bg-white">
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
            <button onClick={() => setView('grid')} className={`w-8 h-8 flex items-center justify-center border transition-all ${view === 'grid' ? 'border-gold bg-gold text-white' : 'border-stone text-warm hover:border-gold'}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6"/><rect x="9" y="1" width="6" height="6"/><rect x="1" y="9" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/></svg>
            </button>
            <button onClick={() => setView('list')} className={`w-8 h-8 flex items-center justify-center border transition-all ${view === 'list' ? 'border-gold bg-gold text-white' : 'border-stone text-warm hover:border-gold'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          {showSidebar && (
            <>
              {/* Desktop */}
              <aside className="w-64 flex-shrink-0 hidden md:block">
                <div className="bg-white border border-stone p-5 sticky top-36">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-lg text-charcoal">Refine</h2>
                    <button onClick={() => setShowSidebar(false)} className="text-warm/40 hover:text-red-500 transition-colors text-lg">✕</button>
                  </div>
                  <Sidebar />
                </div>
              </aside>

              {/* Mobile overlay */}
              <div className="md:hidden fixed inset-0 z-50 flex">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}/>
                <div className="relative w-72 bg-white h-full overflow-y-auto p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-lg text-charcoal">Refine</h2>
                    <button onClick={() => setShowSidebar(false)} className="text-warm/40 hover:text-red-500 text-lg">✕</button>
                  </div>
                  <Sidebar />
                </div>
              </div>
            </>
          )}

          {/* Products area */}
          <div className="flex-1 min-w-0">
            {/* Promo banner */}
            <div className="bg-charcoal px-6 py-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-gold text-[10px] tracking-widests uppercase block mb-1">Limited Edition</span>
                <h3 className="font-serif text-2xl text-white">Navratri <em className="text-gold-light">Special Collection</em></h3>
                <p className="text-stone/60 text-sm mt-1">Specially crafted Durga Maa & Lakshmi Murtis for the festive season.</p>
              </div>
              <Link href="/category/murtis" className="px-8 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all whitespace-nowrap">EXPLORE NOW</Link>
            </div>

            {/* Initial loading skeleton */}
            {initialLoading && (
              <div className={view === 'grid' ? `grid grid-cols-2 ${showSidebar ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-5` : 'space-y-4'}>
                {Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Products grid */}
            {!initialLoading && products.length === 0 && (
              <div className="text-center py-24">
                <div className="text-6xl mb-6 opacity-20">🔍</div>
                <h3 className="font-serif text-2xl text-charcoal mb-3">No products found</h3>
                <p className="text-warm/60 mb-6">Try adjusting your filters or search.</p>
                <button onClick={clearAll} className="btn-gold">View All Products</button>
              </div>
            )}

            {!initialLoading && products.length > 0 && (
              <div className={view === 'grid'
                ? `grid grid-cols-2 ${showSidebar ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-5`
                : 'space-y-4'}>
                {products.map(p => <ProductCard key={p._id} product={p} view={view} />)}
              </div>
            )}

            {/* Loading more skeleton rows */}
            {loadingMore && (
              <div className={`mt-5 ${view === 'grid' ? `grid grid-cols-2 ${showSidebar ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-5` : 'space-y-4'}`}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`more-${i}`} />)}
              </div>
            )}

            {/* Sentinel div — IntersectionObserver watches this */}
            {!initialLoading && <div ref={sentinelRef} className="h-1 w-full mt-8" aria-hidden="true" />}

            {/* End message when all loaded */}
            {!initialLoading && !hasMore && products.length > 0 && (
              <div className="text-center py-10 mt-4">
                <div className="inline-flex items-center gap-4 text-warm/40">
                  <span className="w-16 h-px bg-stone"></span>
                  <span className="text-xs tracking-widests uppercase">All {totalProducts} products shown</span>
                  <span className="w-16 h-px bg-stone"></span>
                </div>
                <p className="text-warm/40 text-xs mt-2">Can't find what you're looking for?</p>
                <Link href="/#contact" className="text-gold text-xs hover:underline">Request a custom piece →</Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <ProductsContent />
    </Suspense>
  )
}
