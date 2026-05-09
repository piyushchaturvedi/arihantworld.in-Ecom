'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/ui/Loader'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { useSettings } from '@/components/providers/SettingsProvider'
import { productsAPI } from '@/lib/api'
import { fmt } from '@/lib/config'
import toast from 'react-hot-toast'

const PER_PAGE = 12

function getProductImg(product) {
  const imgs = product.images || []
  const main = imgs.find(i => i.isMain) || imgs[0]
  if (!main?.url || main.url === 'null' || main.url === null || main.url === '') return null
  if (main.url.startsWith('http') || main.url.startsWith('https') || main.url.startsWith('data:')) return main.url
  if (main.url.startsWith('/')) {
    const base = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL?.replace('/api','')) || 'http://localhost:5000'
    return base + main.url
  }
  return null
}

function ProductCard({ product }) {
  const { addItem } = useCartStore()
  const { addItem: addWish, isWishlisted, removeItem: removeWish } = useWishlistStore()
  const wishlisted = isWishlisted(product._id)
  const [imgErr, setImgErr] = useState(false)
  const imgSrc = getProductImg(product)
  const price = product.salePrice || product.price
  const discPct = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0

  return (
    <div className="bg-white border border-stone hover:border-gold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative">
      <Link href={`/products/${product.slug || product._id}`}>
        <div className="aspect-square bg-gradient-to-br from-stone to-cream flex items-center justify-center relative overflow-hidden">
          {imgSrc && !imgErr
            ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)}/>
            : <span className="text-5xl opacity-20 group-hover:opacity-35 transition-opacity">{product.icon || '🏺'}</span>
          }
          {product.badge && <span className="absolute top-3 left-3 bg-gold text-white text-[10px] tracking-widests uppercase px-2 py-0.5 z-10">{product.badge}</span>}
          {discPct > 0 && <span className="absolute top-3 right-10 bg-red-500 text-white text-[10px] px-2 py-0.5 z-10">{discPct}% OFF</span>}
          <button onClick={e => { e.preventDefault(); wishlisted ? removeWish(product._id) : addWish({...product}); toast(wishlisted ? 'Removed' : 'Added to wishlist') }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-gold hover:text-white transition-all z-10 shadow-sm">
            <svg className={`w-4 h-4 ${wishlisted ? 'text-gold fill-gold' : 'text-warm/50'}`} fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
            </svg>
          </button>
        </div>
        <div className="p-4">
          <span className="text-[10px] tracking-widests uppercase text-gold/80 block mb-1">{product.material}</span>
          <h3 className="font-serif text-charcoal text-base mb-1.5 leading-tight group-hover:text-gold transition-colors line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
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
        <button onClick={() => { addItem({...product}, 1); toast.success(`${product.name} added to cart`) }}
          className="w-full py-2.5 border border-stone text-warm text-xs tracking-widests uppercase hover:bg-charcoal hover:text-white hover:border-charcoal transition-all duration-300">
          ADD TO CART
        </button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-stone animate-pulse">
      <div className="aspect-square bg-stone/40"></div>
      <div className="p-4 space-y-2"><div className="h-2 bg-stone/60 rounded w-1/3"></div><div className="h-4 bg-stone/60 rounded w-3/4"></div><div className="h-3 bg-stone/40 rounded w-1/2 mt-3"></div></div>
      <div className="px-4 pb-4"><div className="h-9 bg-stone/40 rounded-sm"></div></div>
    </div>
  )
}

export default function CategoryPage() {
  const { slug } = useParams()
  const settings = useSettings()
  const [sort, setSort] = useState('featured')
  const [search, setSearch] = useState('')

  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef(null)

  const catInfo = (settings.categories || []).find(c => c.slug === slug) || { label: slug, icon: '🏺', description: '' }

  const sortParam = sort === 'featured' ? '-isFeatured,-totalSold' : sort === 'price-asc' ? 'price' : sort === 'price-desc' ? '-price' : sort === 'rating' ? '-rating' : '-createdAt'

  const loadProducts = useCallback(async (pageNum, reset = false) => {
    if (pageNum === 1) setInitialLoading(true)
    else setLoadingMore(true)
    try {
      const params = { category: slug, page: pageNum, limit: PER_PAGE, sort: sortParam }
      if (search) params.search = search
      const { data } = await productsAPI.getAll(params)
      const newProds = data.products || []
      setTotal(data.total || 0)
      setProducts(prev => reset || pageNum === 1 ? newProds : [...prev, ...newProds])
      setHasMore(pageNum < (data.pages || 1))
    } catch {
      setTotal(0)
      setProducts([])
      setHasMore(false)
    } finally {
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }, [slug, sortParam, search])

  useEffect(() => { setPage(1); setProducts([]); setHasMore(true); loadProducts(1, true) }, [slug, sort, search])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
        const next = page + 1; setPage(next); loadProducts(next)
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, initialLoading, page, loadProducts])

  const otherCats = (settings.categories || []).filter(c => c.slug !== slug && c.slug !== 'custom').slice(0, 4)

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div className="pt-28 pb-14 px-4 sm:px-6 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[18rem] text-gold leading-none">{catInfo.icon}</span>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widests uppercase mb-5 flex-wrap">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <Link href="/products" className="hover:text-gold">Collections</Link><span>›</span>
            <span className="text-gold capitalize">{catInfo.label}</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <div className="text-5xl mb-3">{catInfo.icon}</div>
              <h1 className="font-serif text-5xl sm:text-6xl text-white">
                Shop <em className="text-gold-light">{catInfo.label}</em>
              </h1>
              <p className="text-stone/60 mt-3 text-sm max-w-md">
                {catInfo.description} — {total} pieces available
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/products" className="px-5 py-2 text-xs tracking-widests uppercase border border-stone/30 text-stone/60 hover:border-gold hover:text-gold transition-all">ALL</Link>
              {otherCats.map(c => (
                <Link key={c.slug} href={`/category/${c.slug}`}
                  className="px-5 py-2 text-xs tracking-widests uppercase border border-stone/30 text-stone/60 hover:border-gold hover:text-gold transition-all">
                  {c.label.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter/sort bar */}
      <div className="bg-white border-b border-stone sticky top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <form onSubmit={e => { e.preventDefault() }} className="flex">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${catInfo.label}…`}
                className="border border-stone px-4 py-2 text-xs w-44 sm:w-56 focus:outline-none focus:border-gold transition-colors bg-white"/>
              <button type="submit" className="bg-gold text-white px-3 hover:bg-gold-dark transition-colors text-xs">→</button>
            </form>
            <span className="text-warm/40 text-xs hidden sm:block">
              {initialLoading ? '…' : `${products.length}${hasMore ? '+' : ''} of ${total}`} products
            </span>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-xs tracking-widests uppercase border border-stone text-warm px-3 py-2 focus:outline-none focus:border-gold bg-white ml-auto">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {initialLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({length: PER_PAGE}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        )}

        {!initialLoading && products.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 opacity-20">{catInfo.icon}</div>
            <h3 className="font-serif text-2xl text-charcoal mb-3">No {catInfo.label} found</h3>
            <p className="text-warm/60 text-sm mb-6">{search ? 'Try a different search.' : 'Check back soon or browse other collections.'}</p>
            <Link href="/products" className="btn-gold">View All Products</Link>
          </div>
        )}

        {!initialLoading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map(p => <ProductCard key={p._id} product={p}/>)}
          </div>
        )}

        {loadingMore && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5">
            {Array.from({length:4}).map((_,i) => <SkeletonCard key={`more-${i}`}/>)}
          </div>
        )}

        <div ref={sentinelRef} className="h-1 w-full mt-8" aria-hidden="true"/>

        {!initialLoading && !hasMore && products.length > 0 && (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-4 text-warm/40">
              <span className="w-16 h-px bg-stone"></span>
              <span className="text-xs tracking-widests uppercase">All {total} products shown</span>
              <span className="w-16 h-px bg-stone"></span>
            </div>
          </div>
        )}
      </main>

      {/* CTA */}
      <div className="bg-charcoal py-14 px-4 sm:px-6 text-center">
        <span className="section-tag">Bespoke</span>
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">Don't see what you're looking for?</h2>
        <p className="text-stone/60 text-sm mb-8 max-w-md mx-auto">
          We craft custom {catInfo.label?.toLowerCase()} to your exact specifications. Consult with our master artisans.
        </p>
        <Link href="/#contact" className="btn-gold">Request Custom Order</Link>
      </div>
      <Footer />
    </>
  )
}
