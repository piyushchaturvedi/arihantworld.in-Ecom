'use client'
import { useState, useEffect, useRef } from 'react'
import { adminAPI } from '@/lib/api'
import { SITE_CONFIG, fmt } from '@/lib/config'
import { AdminLoader } from '@/components/ui/Loader'
import toast from 'react-hot-toast'

const CATS = ['murtis','temples','furniture','decor','fountains','custom']
const BADGES = [null,'Bestseller','New','Custom','Exclusive','Sale']

const EMPTY_FORM = {
  name:'', category:'murtis', description:'', shortDescription:'',
  material:'Makrana Marble', price:'', salePrice:'', stock:'0',
  badge:null, isFeatured:false, isCustom:false, craftingDays:'7',
  finish:'Polished', sizes:'9",12",18",24",36",Custom', tags:'',
  dimensions:{ height:'', width:'', depth:'', weight:'' },
  numReviews: 0, rating: 0
}

const validate = (form) => {
  const e = {}
  if (!form.name?.trim()) e.name = 'Product name is required'
  if (!form.description?.trim()) e.description = 'Description is required'
  if (!form.price) e.price = 'Price is required'
  else if (Number(form.price) <= 0) e.price = 'Price must be greater than 0'
  if (form.salePrice && Number(form.salePrice) >= Number(form.price)) e.salePrice = 'Sale price must be less than original price'
  if (form.stock !== '' && Number(form.stock) < 0) e.stock = 'Stock cannot be negative'
  return e
}

// Image item: { url, file?, uploading?, error? }
// ── Outside component — prevents remount/focus loss on every keystroke ───────
function ErrMsg({ field, errors }) {
  if (!errors[field]) return null
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <span>⚠</span>{errors[field]}
    </p>
  )
}

function ProductTextField({ label, name, type='text', placeholder='', required=false, hint='', value, onChange, error }) {
  return (
    <div>
      <label className={`form-label ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ''}`}>{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={`form-input ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : ''}`}
        autoComplete="off"
      />
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-gray-400 text-[10px] mt-1">{hint}</p>}
    </div>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  // imageItems: [{ preview: string, file?: File, url?: string (final), uploading: bool, uploaded: bool }]
  const [imageItems, setImageItems] = useState([])
  const [imageTab, setImageTab] = useState('upload')
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef()

  useEffect(() => { loadProducts() }, [filter])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (filter !== 'all') params.category = filter
      const { data } = await adminAPI.getProducts(params)
      setProducts(data.products || [])
    } catch {
      setProducts([])
    } finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditProduct(null); setForm(EMPTY_FORM); setErrors({}); setImageItems([]); setShowModal(true)
  }

  const openEdit = (p) => {
    setEditProduct(p); setErrors({})
    setForm({
      ...EMPTY_FORM, ...p,
      price: p.price?.toString() || '',
      salePrice: p.salePrice?.toString() || '',
      stock: p.stock?.toString() || '0',
      craftingDays: p.craftingDays?.toString() || '7',
      finish: Array.isArray(p.finish) ? p.finish.join(', ') : p.finish || '',
      sizes: Array.isArray(p.sizes) ? p.sizes.join(',') : p.sizes || '',
      sizeVariants: (p.sizeVariants || []).map(sv => ({
        size: sv.size || '',
        price: sv.price?.toString() || '',
        salePrice: sv.salePrice?.toString() || '',
        stock: sv.stock?.toString() || '',
      })),
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '',
      dimensions: p.dimensions || EMPTY_FORM.dimensions,
    })
    // Load existing images
    const existing = (p.images || []).filter(i => i.url).map(i => ({ preview: i.url, url: i.url, uploading: false, uploaded: true }))
    setImageItems(existing)
    setShowModal(true)
  }

  // When files are chosen: immediately upload them to server, show progress
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + imageItems.length > 8) { toast.error('Maximum 8 images allowed'); return }
    
    // Add placeholder items with local preview
    const newItems = files.map(file => ({
      preview: URL.createObjectURL(file),
      file,
      url: null,
      uploading: true,
      uploaded: false,
      error: null,
    }))
    setImageItems(prev => [...prev, ...newItems])

    // Upload each file immediately
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const idx = imageItems.length + i // position in imageItems
      try {
        const fd = new FormData()
        fd.append('image', file)
        const { data } = await adminAPI.uploadProductImage(fd)
        setImageItems(prev => prev.map((item, j) => {
          if (item.file === file) return { ...item, url: data.url, uploading: false, uploaded: true }
          return item
        }))
      } catch(err) {
        setImageItems(prev => prev.map(item => {
          if (item.file === file) return { ...item, uploading: false, error: 'Upload failed' }
          return item
        }))
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    e.target.value = ''
  }

  const addImageURL = () => {
    if (!urlInput.trim()) { toast.error('Enter a valid URL'); return }
    if (!urlInput.startsWith('http')) { toast.error('URL must start with http://'); return }
    if (imageItems.length >= 8) { toast.error('Maximum 8 images'); return }
    setImageItems(prev => [...prev, { preview: urlInput.trim(), url: urlInput.trim(), uploading: false, uploaded: true }])
    setUrlInput('')
    toast.success('Image URL added')
  }

  const removeImage = (idx) => {
    setImageItems(prev => {
      const item = prev[idx]
      if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const setMainImage = (idx) => {
    setImageItems(prev => {
      const arr = [...prev]; const [item] = arr.splice(idx, 1); return [item, ...arr]
    })
    toast('Set as main image', { icon: '⭐' })
  }

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' })) }
  const setDim = (k, v) => setForm(prev => ({ ...prev, dimensions: { ...prev.dimensions, [k]: v } }))

  const handleSave = async (e) => {
    e.preventDefault()
    const vErrors = validate(form)
    if (Object.keys(vErrors).length > 0) { setErrors(vErrors); toast.error('Please fix the errors below'); return }

    const stillUploading = imageItems.some(i => i.uploading)
    if (stillUploading) { toast.error('Please wait for images to finish uploading'); return }

    const failedUploads = imageItems.filter(i => i.error)
    if (failedUploads.length > 0) { toast.error(`${failedUploads.length} image(s) failed to upload. Remove them and try again.`); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock),
        craftingDays: Number(form.craftingDays),
        finish: form.finish.split(',').map(s => s.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        sizeVariants: (form.sizeVariants || [])
          .filter(sv => sv.size && sv.price)
          .map(sv => ({
            size: sv.size.trim(),
            price: Number(sv.price),
            salePrice: sv.salePrice ? Number(sv.salePrice) : null,
            stock: sv.stock !== '' ? Number(sv.stock) : null,
          })),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        images: imageItems.filter(i => i.url).map((i, idx) => ({ url: i.url, alt: form.name, isMain: idx === 0 })),
        isInStock: Number(form.stock) > 0,
        isActive: true,
      }

      const isRealId = editProduct?._id && /^[0-9a-fA-F]{24}$/.test(editProduct._id)
      if (editProduct && isRealId) {
        const { data } = await adminAPI.updateProduct(editProduct._id, payload)
        setProducts(prev => prev.map(p => p._id === editProduct._id ? data.product : p))
        toast.success('Product updated!')
      } else if (editProduct) {
        setProducts(prev => prev.map(p => p._id === editProduct._id ? { ...p, ...payload, images: payload.images } : p))
        toast.success('Product updated (demo mode)')
      } else {
        const { data } = await adminAPI.createProduct(payload)
        setProducts(prev => [data.product, ...prev])
        toast.success('Product created!')
      }
      setShowModal(false)
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to save. Check required fields.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return
    try {
      if (/^[0-9a-fA-F]{24}$/.test(id)) await adminAPI.deleteProduct(id)
      setProducts(prev => prev.filter(p => p._id !== id))
      toast.success('Product deactivated')
    } catch { toast.error('Failed') }
  }

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))


  const uploadedCount = imageItems.filter(i => i.uploaded || i.url).length
  const hasUploading = imageItems.some(i => i.uploading)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} products</p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-gold text-white text-xs tracking-widest uppercase hover:bg-gold-dark transition-all">
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-5 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATS].map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-all capitalize ${filter===c?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key==='Enter' && loadProducts()}
            placeholder="Search products…" className="form-input w-52 text-sm"/>
          <button onClick={loadProducts} className="px-4 py-2 bg-charcoal text-white text-xs uppercase hover:bg-gold transition-all">GO</button>
        </div>
      </div>

      {/* Grid */}
      {loading ? <AdminLoader text="Loading products…"/> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const mainImg = p.images?.find(i => i.isMain)?.url || p.images?.[0]?.url
            return (
              <div key={p._id} className="bg-white border border-gray-200 hover:border-gold transition-all rounded-sm overflow-hidden group">
                <div className="aspect-square bg-gradient-to-br from-stone to-cream relative overflow-hidden">
                  {mainImg
                    ? <img src={mainImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">{p.icon||'🏺'}</div>
                  }
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {p.badge && <span className="bg-gold text-white text-[9px] tracking-widest uppercase px-2 py-0.5">{p.badge}</span>}
                    {p.isFeatured && <span className="bg-charcoal text-white text-[9px] tracking-widest uppercase px-2 py-0.5">Featured</span>}
                  </div>
                  {!mainImg && <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-[9px] px-2 py-0.5">No Image</div>}
                </div>
                <div className="p-4">
                  <p className="text-[10px] tracking-widest uppercase text-gold mb-1">{p.category}</p>
                  <h3 className="font-serif text-charcoal text-sm mb-2 leading-tight">{p.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      {p.salePrice && <span className="text-warm/40 text-xs line-through mr-1">{fmt(p.price)}</span>}
                      <span className="text-gold text-sm font-medium">{fmt(p.salePrice || p.price)}</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 ${(p.stock>10)?'bg-green-50 text-green-600':(p.stock>0)?'bg-amber-50 text-amber-600':'bg-red-50 text-red-500'}`}>
                      Stock: {p.stock ?? '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="flex-1 py-2 border border-stone text-warm text-xs tracking-widest uppercase hover:border-gold hover:text-gold transition-colors">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="py-2 px-3 border border-gray-200 text-gray-400 text-xs hover:border-red-300 hover:text-red-500 transition-colors">🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
          {!filtered.length && <div className="col-span-full text-center py-16 text-gray-400"><p className="text-4xl mb-3">🏺</p><p className="text-sm">No products found. <button onClick={openAdd} className="text-gold underline">Add one!</button></p></div>}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm w-full max-w-2xl mt-4 mb-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl text-charcoal">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-2xl leading-none w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5" noValidate>

              {/* ── IMAGES ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Product Images <span className="text-gray-400 font-normal normal-case text-[10px]">(max 8 · first = main)</span></label>
                  {hasUploading && <span className="text-amber-600 text-[10px] flex items-center gap-1"><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Uploading…</span>}
                </div>

                {/* Tab */}
                <div className="flex gap-2 mb-3">
                  {[['upload','📁 Upload Files'],['url','🔗 From URL']].map(([t,l]) => (
                    <button key={t} type="button" onClick={() => setImageTab(t)}
                      className={`px-4 py-2 text-xs tracking-widest uppercase border transition-all ${imageTab===t?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold'}`}>{l}</button>
                  ))}
                </div>

                {imageTab === 'upload' && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stone hover:border-gold transition-colors cursor-pointer bg-cream/40 rounded-sm"
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleFileSelect} className="hidden"/>
                    <span className="text-2xl mb-1.5">📸</span>
                    <span className="text-sm text-warm/60">Click to select images</span>
                    <span className="text-xs text-warm/40 mt-0.5">JPG, PNG, WebP · Max 5MB each · Uploads immediately</span>
                  </label>
                )}

                {imageTab === 'url' && (
                  <div className="flex gap-2">
                    <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg" className="form-input flex-1"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageURL())}/>
                    <button type="button" onClick={addImageURL}
                      className="px-4 py-2.5 bg-charcoal text-white text-xs tracking-widest uppercase hover:bg-gold transition-all whitespace-nowrap">Add</button>
                  </div>
                )}

                {/* Previews */}
                {imageItems.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {imageItems.map((item, idx) => (
                      <div key={idx} className={`relative group border-2 rounded overflow-hidden ${idx===0?'border-gold':'border-gray-200'} ${item.error?'border-red-400':''}`}>
                        <div className="aspect-square bg-stone flex items-center justify-center overflow-hidden">
                          {item.preview
                            ? <img src={item.preview} alt="" className="w-full h-full object-cover"/>
                            : <span className="text-2xl opacity-30">🏺</span>
                          }
                          {/* Uploading overlay */}
                          {item.uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            </div>
                          )}
                          {/* Error overlay */}
                          {item.error && (
                            <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                              <span className="text-white text-lg">✕</span>
                            </div>
                          )}
                        </div>
                        {idx === 0 && !item.uploading && !item.error && (
                          <span className="absolute top-0 left-0 bg-gold text-white text-[8px] px-1 py-0.5 leading-tight">MAIN</span>
                        )}
                        {/* Hover actions */}
                        {!item.uploading && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx !== 0 && !item.error && (
                              <button type="button" onClick={() => setMainImage(idx)} title="Set as main" className="w-6 h-6 bg-gold rounded-full text-white text-xs flex items-center justify-center">⭐</button>
                            )}
                            <button type="button" onClick={() => removeImage(idx)} className="w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">✕</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {imageItems.length < 8 && (
                      <label className="aspect-square border-2 border-dashed border-gray-200 hover:border-gold cursor-pointer flex items-center justify-center text-gray-300 text-2xl rounded transition-colors">
                        <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden"/>+
                      </label>
                    )}
                  </div>
                )}
                {uploadedCount > 0 && !hasUploading && (
                  <p className="text-[10px] text-gray-400 mt-1.5">✓ {uploadedCount} image(s) ready · {imageItems.filter(i=>i.error).length} failed</p>
                )}
              </div>

              {/* ── FIELDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Product Name *</label>
                  <input value={form.name} onChange={e => set('name',e.target.value)} className={`form-input ${errors.name?'border-red-400 bg-red-50':''}`} placeholder="Radha Krishna Murti – 18 inch"/>
                  <ErrMsg field="name" errors={errors}/>
                </div>

                <div>
                  <label className="form-label">Category *</label>
                  <select value={form.category} onChange={e => set('category',e.target.value)} className="form-input">
                    {CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Badge</label>
                  <select value={form.badge||''} onChange={e => set('badge',e.target.value||null)} className="form-input">
                    {BADGES.map(b => <option key={b||'none'} value={b||''}>{b||'None'}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => set('price',e.target.value)} className={`form-input ${errors.price?'border-red-400 bg-red-50':''}`} placeholder="18500" min="0"/>
                  <ErrMsg field="price" errors={errors}/>
                  <p className="text-[10px] text-gray-400 mt-0.5">Original MRP price</p>
                </div>
                <div>
                  <label className="form-label">Sale Price (₹)</label>
                  <input type="number" value={form.salePrice} onChange={e => set('salePrice',e.target.value)} className={`form-input ${errors.salePrice?'border-red-400 bg-red-50':''}`} placeholder="Leave blank = no discount" min="0"/>
                  <ErrMsg field="salePrice" errors={errors}/>
                </div>

                <div>
                  <label className="form-label">Stock Quantity</label>
                  <input type="number" value={form.stock} onChange={e => set('stock',e.target.value)} className={`form-input ${errors.stock?'border-red-400 bg-red-50':''}`} min="0"/>
                  <ErrMsg field="stock" errors={errors}/>
                </div>
                <div>
                  <label className="form-label">Crafting Days</label>
                  <input type="number" value={form.craftingDays} onChange={e => set('craftingDays',e.target.value)} className="form-input" min="1"/>
                  <p className="text-[10px] text-gray-400 mt-0.5">Estimated production time</p>
                </div>

                <div>
                  <label className="form-label">Material</label>
                  <input value={form.material} onChange={e => set('material',e.target.value)} className="form-input" placeholder="Makrana Marble"/>
                </div>
                <div>
                  <label className="form-label">Sizes <span className="text-gray-400 font-normal normal-case text-[10px]">(comma separated — for display)</span></label>
                  <input value={form.sizes} onChange={e => set('sizes',e.target.value)} className="form-input" placeholder='9",12",18",24",36",Custom'/>

                {/* ── Size Variants with Individual Pricing ── */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <label className="form-label mb-0">Size Variants with Individual Pricing</label>
                      <p className="text-[10px] text-gray-400 mt-0.5">Each size can have its own price. When customer selects a size, price updates on the product page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set('sizeVariants', [...(form.sizeVariants || []), { size: '', price: '', salePrice: '', stock: '' }])}
                      className="px-3 py-1.5 text-xs border border-gold text-gold hover:bg-gold hover:text-white transition-all tracking-widest uppercase whitespace-nowrap flex-shrink-0"
                    >
                      + Add Size
                    </button>
                  </div>
                  {(form.sizeVariants || []).length === 0 ? (
                    <div className="border border-dashed border-gray-200 p-4 text-center text-gray-400 text-xs">
                      No size variants yet. Click "+ Add Size" to add sizes with individual pricing.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Header - only on desktop */}
                      <div className="hidden sm:grid grid-cols-5 gap-3 text-[10px] tracking-widest uppercase text-gray-400 px-1">
                        <span>Size</span>
                        <span>Price (₹) *</span>
                        <span>Sale Price (₹)</span>
                        <span>Stock</span>
                        <span></span>
                      </div>
                      {(form.sizeVariants || []).map((sv, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center bg-stone/20 p-3 rounded-sm border border-stone/40">
                          <div>
                            <label className="text-[10px] tracking-widest uppercase text-gray-400 block mb-1 sm:hidden">Size</label>
                            <input
                              value={sv.size}
                              onChange={e => { const arr = [...form.sizeVariants]; arr[i] = { ...arr[i], size: e.target.value }; set('sizeVariants', arr) }}
                              className="form-input w-full"
                              placeholder='e.g. 12"'
                            />
                          </div>
                          <div>
                            <label className="text-[10px] tracking-widest uppercase text-gray-400 block mb-1 sm:hidden">Price (₹) *</label>
                            <input
                              type="number"
                              value={sv.price}
                              onChange={e => { const arr = [...form.sizeVariants]; arr[i] = { ...arr[i], price: e.target.value }; set('sizeVariants', arr) }}
                              className="form-input w-full"
                              placeholder="18500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] tracking-widest uppercase text-gray-400 block mb-1 sm:hidden">Sale Price (₹)</label>
                            <input
                              type="number"
                              value={sv.salePrice}
                              onChange={e => { const arr = [...form.sizeVariants]; arr[i] = { ...arr[i], salePrice: e.target.value }; set('sizeVariants', arr) }}
                              className="form-input w-full"
                              placeholder="Leave blank"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] tracking-widest uppercase text-gray-400 block mb-1 sm:hidden">Stock</label>
                            <input
                              type="number"
                              value={sv.stock}
                              onChange={e => { const arr = [...form.sizeVariants]; arr[i] = { ...arr[i], stock: e.target.value }; set('sizeVariants', arr) }}
                              className="form-input w-full"
                              placeholder="Qty"
                              min="0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => set('sizeVariants', form.sizeVariants.filter((_, j) => j !== i))}
                            className="w-full sm:w-auto text-red-400 hover:text-red-600 border border-red-200 px-3 py-2.5 text-xs hover:bg-red-50 transition-all text-center rounded-sm"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ))}
                      <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 mt-1">
                        ⚡ Price on product page will automatically change when customer selects a size.
                      </p>
                    </div>
                  )}
                </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Finish Options (comma separated)</label>
                  <input value={form.finish} onChange={e => set('finish',e.target.value)} className="form-input" placeholder="Polished, Matte, Antique Beige"/>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => set('tags',e.target.value)} className="form-input" placeholder="murti, marble, handcrafted, ganesha"/>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Short Description</label>
                  <input value={form.shortDescription||''} onChange={e => set('shortDescription',e.target.value)} className="form-input" placeholder="1-line description" maxLength={300}/>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Full Description *</label>
                  <textarea value={form.description||''} onChange={e => set('description',e.target.value)} rows={3}
                    className={`form-input resize-none ${errors.description?'border-red-400 bg-red-50':''}`}
                    placeholder="Detailed product description…"/>
                  <ErrMsg field="description" errors={errors}/>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="form-label mb-2">Dimensions</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['Height','height'],['Width','width'],['Depth','depth'],['Weight','weight']].map(([l,k]) => (
                    <div key={k}>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">{l}</label>
                      <input value={form.dimensions?.[k]||''} onChange={e => setDim(k,e.target.value)} placeholder={k==='weight'?'4.5 kg':'18"'} className="form-input text-sm"/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 flex-wrap pt-1 border-t border-gray-100">
                {[['isFeatured','⭐ Show on Homepage'],['isCustom','🎨 Custom Order']].map(([key,label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form[key]} onChange={e => set(key,e.target.checked)} className="w-4 h-4 accent-amber-600"/>
                    <span className="text-sm text-warm/70">{label}</span>
                  </label>
                ))}
              </div>

              {/* Error summary */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-4">
                  <p className="text-red-700 text-sm font-medium mb-1.5">Please fix these errors:</p>
                  <ul className="space-y-0.5">{Object.entries(errors).map(([k,v]) => <li key={k} className="text-red-600 text-xs flex gap-1.5"><span>•</span>{v}</li>)}</ul>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widest uppercase hover:border-gold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || hasUploading}
                  className="flex-1 py-3 bg-gold text-white text-xs tracking-widest uppercase hover:bg-gold-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {(saving || hasUploading) && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {hasUploading ? 'Uploading Images…' : saving ? 'Saving…' : editProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
