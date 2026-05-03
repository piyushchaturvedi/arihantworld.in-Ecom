'use client'
import Link from 'next/link'
import { useCartStore, useWishlistStore } from '@/lib/store'
import toast from 'react-hot-toast'

const products = [
  { _id: '1', name: 'Radha Krishna Murti – 12"', category: 'Murtis', price: 18500, salePrice: 15200, icon: '🏺', badge: 'Bestseller' },
  { _id: '2', name: 'Shwetambar Marble Mandir', category: 'Home Temples', price: 42000, salePrice: null, icon: '⛩️', badge: 'Custom' },
  { _id: '3', name: 'Marble Inlay Coffee Table', category: 'Furniture', price: 85000, salePrice: null, icon: '🏛️', badge: 'Exclusive' },
  { _id: '4', name: 'Lotus Carved Bowl', category: 'Decor', price: 4200, salePrice: null, icon: '💐', badge: null },
]

export default function FeaturedProducts() {
  const { addItem } = useCartStore()
  const { addItem: addWishlist, isWishlisted, removeItem: removeWishlist } = useWishlistStore()

  const handleAddToCart = (p) => {
    addItem(p, 1)
    toast.success(`${p.name} added to cart`)
  }

  const handleWishlist = (p) => {
    if (isWishlisted(p._id)) {
      removeWishlist(p._id)
      toast('Removed from wishlist')
    } else {
      addWishlist(p)
      toast.success('Added to wishlist')
    }
  }

  return (
    <section id="featured" className="py-24 px-6 bg-charcoal">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="section-tag">Handpicked</span>
            <h2 className="font-serif text-4xl md:text-5xl text-white">Featured Pieces</h2>
          </div>
          <Link href="/products" className="text-xs tracking-widest uppercase text-gold hover:text-gold-light transition-colors">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <div key={p._id}
              className="bg-white/4 border border-white/6 overflow-hidden hover:border-gold hover:shadow-2xl hover:-translate-y-1 transition-all duration-400 group">
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-gold/8 to-white/4 flex items-center justify-center overflow-hidden">
                <span className="text-5xl opacity-15 group-hover:opacity-20 transition-opacity">{p.icon}</span>
                {p.badge && (
                  <span className="absolute top-3 left-3 bg-gold text-white text-[10px] tracking-[0.15em] uppercase px-2 py-0.5">{p.badge}</span>
                )}
                <button
                  onClick={() => handleWishlist(p)}
                  className="absolute top-3 right-3 w-8 h-8 border border-white/20 hover:border-gold bg-black/20 flex items-center justify-center transition-all">
                  <svg className={`w-4 h-4 transition-colors ${isWishlisted(p._id) ? 'text-gold fill-gold' : 'text-white'}`}
                    fill={isWishlisted(p._id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold/70 mb-1">{p.category}</p>
                <Link href={`/products/${p._id}`}>
                  <h3 className="font-serif text-white/90 text-base mb-3 hover:text-gold transition-colors cursor-pointer leading-tight">{p.name}</h3>
                </Link>
                <div className="flex items-center justify-between">
                  <div>
                    {p.salePrice ? (
                      <span className="text-white/25 text-xs line-through mr-2">₹{p.price.toLocaleString('en-IN')}</span>
                    ) : null}
                    <span className="text-gold text-sm tracking-wide">₹{(p.salePrice || p.price).toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="text-[10px] tracking-widest uppercase text-white border border-white/20 px-3 py-1.5 hover:border-gold hover:text-gold transition-all duration-300">
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
