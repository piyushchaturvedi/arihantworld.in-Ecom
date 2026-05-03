'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { productsAPI } from '@/lib/api'
import { useSettings } from '@/components/providers/SettingsProvider'
import { fmt } from '@/lib/config'

function getImg(p) {
  const m = p.images?.find(i=>i.isMain) || p.images?.[0]
  if (m?.url && (m.url.startsWith('http')||m.url.startsWith('data:'))) return m.url
  return null
}

export default function GlobalSearch({ onClose }) {
  const router = useRouter()
  const settings = useSettings()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCat, setSelectedCat] = useState('all')
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  const cats = [{ slug:'all', label:'All', icon:'🔍' }, ...(settings.categories||[]).filter(c=>c.slug!=='custom')]

  useEffect(() => {
    inputRef.current?.focus()
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const search = useCallback(async (q, cat) => {
    if (!q || q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const params = { search: q, limit: 8 }
      if (cat && cat !== 'all') params.category = cat
      const { data } = await productsAPI.getAll(params)
      setResults(data.products || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val, selectedCat), 300)
  }

  const handleCatChange = (slug) => {
    setSelectedCat(slug)
    if (query.length >= 2) search(query, slug)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onClose()
      const url = selectedCat !== 'all' ? `/products?search=${encodeURIComponent(query)}&category=${selectedCat}` : `/products?search=${encodeURIComponent(query)}`
      router.push(url)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>

      {/* Search panel */}
      <div className="relative max-w-3xl w-full mx-auto mt-16 sm:mt-24 px-4" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <form onSubmit={handleSubmit} className="bg-white shadow-2xl">
          <div className="flex items-center border-b border-stone px-4 py-3 gap-3">
            <svg className="w-5 h-5 text-warm/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="Search murtis, temples, furniture…"
              className="flex-1 outline-none text-base text-charcoal placeholder-warm/30 bg-transparent"
              autoComplete="off"
            />
            {loading && <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin flex-shrink-0"/>}
            <button type="button" onClick={onClose} className="text-warm/40 hover:text-red-500 transition-colors text-xl flex-shrink-0">✕</button>
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-stone/50">
            {cats.map(cat => (
              <button key={cat.slug} type="button" onClick={() => handleCatChange(cat.slug)}
                className={`flex items-center gap-1 px-3 py-1 text-[10px] tracking-widest uppercase border whitespace-nowrap transition-all flex-shrink-0 ${selectedCat===cat.slug?'bg-charcoal text-white border-charcoal':'border-stone text-warm/60 hover:border-gold hover:text-gold'}`}>
                <span className="text-xs">{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
        </form>

        {/* Results */}
        {query.length >= 2 && (
          <div className="bg-white shadow-2xl max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-warm/40 text-sm">Searching…</div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-warm/50 text-sm mb-2">No results for "<strong>{query}</strong>"</p>
                <p className="text-warm/30 text-xs">Try different keywords or browse categories below</p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  {cats.filter(c=>c.slug!=='all').map(cat => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={onClose}
                      className="px-3 py-1.5 border border-stone text-warm/60 text-[10px] tracking-widest uppercase hover:border-gold hover:text-gold transition-all">
                      {cat.icon} {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-stone/30 text-xs text-warm/40">{results.length} results for "{query}"</div>
                {results.map(p => {
                  const img = getImg(p)
                  return (
                    <Link key={p._id} href={`/products/${p.slug || p._id}`} onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-stone/30 transition-colors border-b border-stone/20 last:border-0">
                      <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-stone to-cream overflow-hidden flex items-center justify-center">
                        {img ? <img src={img} alt={p.name} className="w-full h-full object-cover"/> : <span className="text-xl opacity-30">{p.icon||'🏺'}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-charcoal text-sm leading-tight truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] tracking-widest uppercase text-gold/70">{p.category}</span>
                          {p.material && <span className="text-[10px] text-warm/40">· {p.material}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {p.salePrice && <p className="text-[10px] text-warm/40 line-through">{fmt(p.price)}</p>}
                        <p className="text-gold text-sm font-medium">{fmt(p.salePrice || p.price)}</p>
                      </div>
                    </Link>
                  )
                })}
                <div className="p-3 border-t border-stone/30 text-center">
                  <button onClick={handleSubmit} className="text-xs tracking-widest uppercase text-gold hover:underline">
                    View all results for "{query}" →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Popular searches when empty */}
        {!query && (
          <div className="bg-white shadow-2xl p-5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-warm/40 mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Radha Krishna','Ganesha','Home Temple','Marble Fountain','Lakshmi Murti','Dining Table'].map(q => (
                <button key={q} onClick={() => { setQuery(q); clearTimeout(timerRef.current); search(q, selectedCat) }}
                  className="px-3 py-1.5 border border-stone text-warm/60 text-xs hover:border-gold hover:text-gold transition-all">
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-warm/40 mt-5 mb-3">Browse Categories</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {cats.filter(c=>c.slug!=='all').map(cat => (
                <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={onClose}
                  className="flex flex-col items-center gap-1.5 p-2 border border-stone hover:border-gold transition-all text-center group">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[9px] tracking-widests uppercase text-warm/60 group-hover:text-gold transition-colors">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
