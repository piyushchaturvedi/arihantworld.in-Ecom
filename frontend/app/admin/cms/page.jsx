'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const BLOCK_TYPES = [
  { type:'hero',         label:'Hero Banner',    icon:'🖼️', desc:'Full-width hero with title, subtitle and CTA buttons' },
  { type:'text',         label:'Text Block',     icon:'📝', desc:'Rich text content with heading and paragraphs' },
  { type:'image_text',   label:'Image + Text',   icon:'📸', desc:'Side-by-side image and text layout' },
  { type:'products',     label:'Product Grid',   icon:'🏺', desc:'Display products by category' },
  { type:'testimonials', label:'Testimonials',   icon:'⭐', desc:'Customer reviews section' },
  { type:'faq',          label:'FAQ Section',    icon:'❓', desc:'Accordion FAQ items' },
  { type:'cta',          label:'Call to Action', icon:'📣', desc:'CTA banner with button' },
  { type:'divider',      label:'Divider',        icon:'—',  desc:'Visual separator' },
]

const INITIAL_PAGES = [
  { id:1, title:'Homepage',       slug:'/',         status:'published', lastModified:'17 Apr 2026', editable:false },
  { id:2, title:'About Us',       slug:'/about',    status:'published', lastModified:'10 Apr 2026', editable:true },
  { id:3, title:'Return Policy',  slug:'/returns',  status:'published', lastModified:'1 Jan 2026',  editable:true },
  { id:4, title:'Shipping Policy',slug:'/shipping', status:'published', lastModified:'1 Jan 2026',  editable:true },
  { id:5, title:'Privacy Policy', slug:'/privacy',  status:'published', lastModified:'1 Jan 2026',  editable:true },
  { id:6, title:'Terms of Service',slug:'/terms',   status:'draft',     lastModified:'15 Dec 2025', editable:true },
  { id:7, title:'Contact',        slug:'/contact',  status:'published', lastModified:'5 Mar 2026',  editable:true },
]

function renderBlockPreview(block) {
  const d = block.data || {}
  switch (block.type) {
    case 'hero':
      return (
        <div style={{ background: d.bg || '#2a2520', padding:'40px', textAlign:'center' }}>
          <h1 style={{ fontFamily:'serif', color:'white', fontSize:'2rem', marginBottom:'8px' }}>{d.title || 'Hero Title'}</h1>
          <p style={{ color:'rgba(232,223,208,0.6)', marginBottom:'20px' }}>{d.subtitle || 'Hero subtitle text'}</p>
          {d.cta1 && <a href={d.cta1Link||'#'} style={{ background:'#b8973a', color:'white', padding:'10px 24px', textDecoration:'none', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase' }}>{d.cta1}</a>}
        </div>
      )
    case 'text':
      return (
        <div style={{ padding:'32px', textAlign: d.align || 'left', background:'#f7f2eb' }}>
          {d.heading && <h2 style={{ fontFamily:'serif', color:'#2a2520', fontSize:'1.5rem', marginBottom:'12px' }}>{d.heading}</h2>}
          <p style={{ color:'#5c4a35', lineHeight:'1.8' }}>{d.content || 'Text content goes here…'}</p>
        </div>
      )
    case 'cta':
      return (
        <div style={{ background:'#2a2520', padding:'32px', textAlign:'center' }}>
          <h3 style={{ fontFamily:'serif', color:'white', marginBottom:'8px' }}>{d.title || 'Call to Action'}</h3>
          <p style={{ color:'rgba(232,223,208,0.5)', marginBottom:'16px', fontSize:'14px' }}>{d.desc || 'Description text'}</p>
          <a href={d.btnLink||'#'} style={{ background:'#b8973a', color:'white', padding:'10px 24px', textDecoration:'none', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase' }}>{d.btn || 'Button Text'}</a>
        </div>
      )
    case 'products':
      return (
        <div style={{ padding:'32px', background:'#f7f2eb' }}>
          <h2 style={{ fontFamily:'serif', color:'#2a2520', textAlign:'center', marginBottom:'16px' }}>{d.title || 'Products'}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
            {[...Array(Number(d.limit)||4)].map((_,i) => (
              <div key={i} style={{ background:'white', border:'1px solid #e8dfd0', padding:'12px', textAlign:'center' }}>
                <div style={{ height:'80px', background:'linear-gradient(135deg,#e8dfd0,#f7f2eb)', marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', opacity:0.3 }}>🏺</div>
                <p style={{ fontSize:'12px', color:'#5c4a35' }}>Product {i+1}</p>
                <p style={{ color:'#b8973a', fontSize:'12px' }}>₹X,XXX</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'faq':
      return (
        <div style={{ padding:'32px', background:'white' }}>
          <h2 style={{ fontFamily:'serif', color:'#2a2520', marginBottom:'16px' }}>Frequently Asked Questions</h2>
          {(d.items || '').split('\n').slice(0,3).map((line, i) => {
            const [q, a] = line.split('|')
            return q ? (
              <div key={i} style={{ borderBottom:'1px solid #e8dfd0', padding:'12px 0' }}>
                <p style={{ fontWeight:'bold', color:'#2a2520', fontSize:'14px' }}>{q}</p>
                {a && <p style={{ color:'#5c4a35', fontSize:'13px', marginTop:'4px' }}>{a}</p>}
              </div>
            ) : null
          })}
        </div>
      )
    case 'testimonials':
      return (
        <div style={{ padding:'32px', background:'#2a2520', textAlign:'center' }}>
          <h2 style={{ fontFamily:'serif', color:'white', marginBottom:'20px' }}>What Our Customers Say</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {['Priya M., Mumbai','Arjun K., Bangalore','Sunita R., Delhi'].map(name => (
              <div key={name} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'16px' }}>
                <p style={{ color:'#b8973a', fontSize:'20px', marginBottom:'8px' }}>★★★★★</p>
                <p style={{ color:'rgba(232,223,208,0.7)', fontSize:'12px', fontStyle:'italic' }}>"Beautiful craftsmanship, divine quality!"</p>
                <p style={{ color:'rgba(232,223,208,0.4)', fontSize:'11px', marginTop:'8px' }}>{name}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'image_text':
      return (
        <div style={{ padding:'32px', background:'#f7f2eb', display:'flex', gap:'24px', alignItems:'center' }}>
          <div style={{ width:'200px', height:'160px', background:'linear-gradient(135deg,#e8dfd0,#d4c5b0)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px', opacity:0.3 }}>🏺</div>
          <div>
            <h3 style={{ fontFamily:'serif', color:'#2a2520', fontSize:'1.3rem', marginBottom:'8px' }}>{d.heading || 'Section Heading'}</h3>
            <p style={{ color:'#5c4a35', lineHeight:'1.7', fontSize:'14px' }}>{d.content || 'Describe your products, story or features here…'}</p>
          </div>
        </div>
      )
    case 'divider':
      return <div style={{ padding:'16px 32px', background:'white', display:'flex', alignItems:'center', gap:'16px' }}><div style={{ flex:1, height:'1px', background:'#e8dfd0' }}></div><span style={{ color:'#b8973a', fontSize:'18px' }}>◆</span><div style={{ flex:1, height:'1px', background:'#e8dfd0' }}></div></div>
    default:
      return <div style={{ padding:'16px', background:'#f7f2eb', textAlign:'center', color:'#5c4a35', fontSize:'14px' }}>{block.type} block</div>
  }
}

function BlockEditor({ block, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [open, setOpen] = useState(false)
  const bt = BLOCK_TYPES.find(b => b.type === block.type)

  return (
    <div className="bg-white border border-gray-200 rounded-sm mb-3">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setOpen(!open)}>
        <span className="text-lg">{bt?.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-charcoal">{bt?.label}</p>
          {block.data?.title && <p className="text-xs text-gray-400 truncate">{block.data.title}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={e=>{e.stopPropagation();onMoveUp()}} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gold transition-colors">↑</button>
          <button onClick={e=>{e.stopPropagation();onMoveDown()}} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gold transition-colors">↓</button>
          <button onClick={e=>{e.stopPropagation();onDelete()}} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">✕</button>
          <span className="text-gray-300 ml-1">{open?'▲':'▼'}</span>
        </div>
      </div>
      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {['hero','cta'].includes(block.type) && <>
            <div><label className="form-label">Title</label><input value={block.data?.title||''} onChange={e => onUpdate({...block.data,title:e.target.value})} className="form-input" placeholder="Section title"/></div>
            {block.type==='hero' && <>
              <div><label className="form-label">Subtitle</label><input value={block.data?.subtitle||''} onChange={e => onUpdate({...block.data,subtitle:e.target.value})} className="form-input"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Button Text</label><input value={block.data?.cta1||''} onChange={e => onUpdate({...block.data,cta1:e.target.value})} className="form-input" placeholder="Explore Collections"/></div>
                <div><label className="form-label">Button Link</label><input value={block.data?.cta1Link||''} onChange={e => onUpdate({...block.data,cta1Link:e.target.value})} className="form-input" placeholder="/products"/></div>
              </div>
              <div><label className="form-label">Background Color</label>
                <div className="flex gap-2 mt-1">
                  {['#2a2520','#1e1a16','#b8973a','#f7f2eb'].map(c=>(
                    <button key={c} type="button" onClick={()=>onUpdate({...block.data,bg:c})}
                      className={`w-8 h-8 rounded border-2 ${block.data?.bg===c?'border-gold':'border-transparent'}`} style={{background:c}}/>
                  ))}
                </div>
              </div>
            </>}
            {block.type==='cta' && <>
              <div><label className="form-label">Description</label><input value={block.data?.desc||''} onChange={e=>onUpdate({...block.data,desc:e.target.value})} className="form-input"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Button Text</label><input value={block.data?.btn||''} onChange={e=>onUpdate({...block.data,btn:e.target.value})} className="form-input" placeholder="Book Now"/></div>
                <div><label className="form-label">Button Link</label><input value={block.data?.btnLink||''} onChange={e=>onUpdate({...block.data,btnLink:e.target.value})} className="form-input" placeholder="/#contact"/></div>
              </div>
            </>}
          </>}
          {['text','image_text'].includes(block.type) && <>
            <div><label className="form-label">Heading</label><input value={block.data?.heading||''} onChange={e=>onUpdate({...block.data,heading:e.target.value})} className="form-input"/></div>
            <div><label className="form-label">Content</label><textarea value={block.data?.content||''} onChange={e=>onUpdate({...block.data,content:e.target.value})} className="form-input h-28 resize-none"/></div>
            {block.type==='text' && <div><label className="form-label">Alignment</label>
              <div className="flex gap-2">
                {['left','center','right'].map(a=>(
                  <button key={a} type="button" onClick={()=>onUpdate({...block.data,align:a})}
                    className={`px-4 py-1.5 text-xs border ${block.data?.align===a?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500'}`}>{a}</button>
                ))}
              </div>
            </div>}
          </>}
          {block.type==='products' && <>
            <div><label className="form-label">Section Title</label><input value={block.data?.title||''} onChange={e=>onUpdate({...block.data,title:e.target.value})} className="form-input" placeholder="Shop Our Collections"/></div>
            <div><label className="form-label">Category</label>
              <select value={block.data?.category||'all'} onChange={e=>onUpdate({...block.data,category:e.target.value})} className="form-input">
                <option value="all">All Products</option>
                {['murtis','temples','furniture','decor','fountains'].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Number to Show</label>
              <select value={block.data?.limit||4} onChange={e=>onUpdate({...block.data,limit:Number(e.target.value)})} className="form-input">
                {[4,8,12,16].map(n=><option key={n} value={n}>{n} products</option>)}
              </select>
            </div>
          </>}
          {block.type==='faq' && <div><label className="form-label">FAQ Items (one Q|A per line)</label>
            <textarea className="form-input h-32 resize-none font-mono text-xs"
              placeholder="What marble do you use?|We use Grade-A Makrana marble&#10;Do you ship internationally?|Yes, to 30+ countries"
              value={block.data?.items||''} onChange={e=>onUpdate({...block.data,items:e.target.value})}/>
          </div>}
          {['testimonials','divider'].includes(block.type) && <p className="text-xs text-gray-400 italic">This block uses your site data. No additional settings needed.</p>}
        </div>
      )}
    </div>
  )
}

export default function AdminCMSPage() {
  const [pages, setPages] = useState(INITIAL_PAGES)
  const [editingPage, setEditingPage] = useState(null)
  const [blocks, setBlocks] = useState([
    { id:1, type:'hero',    data:{ title:'Divine Craftsmanship in Marble', subtitle:'Handcrafted murtis, temples & home décor', cta1:'Explore Collections', cta1Link:'/products', bg:'#2a2520' } },
    { id:2, type:'products',data:{ title:'Shop Dream Murtis', category:'murtis', limit:8 } },
    { id:3, type:'testimonials', data:{} },
    { id:4, type:'faq',     data:{} },
  ])
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [pageSEO, setPageSEO] = useState({ title:'', slug:'', status:'published', metaTitle:'', metaDescription:'' })

  const addBlock = (type) => { setBlocks(prev => [...prev, { id:Date.now(), type, data:{} }]); setShowBlockPicker(false); toast.success(`${BLOCK_TYPES.find(b=>b.type===type)?.label} added`) }
  const updateBlock = (id, data) => setBlocks(prev => prev.map(b => b.id===id ? {...b, data} : b))
  const deleteBlock = (id) => { setBlocks(prev => prev.filter(b => b.id!==id)); toast('Block removed') }
  const moveBlock = (id, dir) => {
    setBlocks(prev => {
      const arr = [...prev], idx = arr.findIndex(b => b.id===id)
      if ((dir==='up'&&idx===0)||(dir==='down'&&idx===arr.length-1)) return prev
      const swap = dir==='up' ? idx-1 : idx+1
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr
    })
  }

  const handleOpenEdit = (page) => {
    setEditingPage(page)
    setPageSEO({ title:page.title, slug:page.slug, status:page.status, metaTitle:'', metaDescription:'' })
  }

  const handleSavePage = () => {
    setPages(prev => prev.map(p => p.id===editingPage.id ? {...p, title:pageSEO.title, slug:pageSEO.slug, status:pageSEO.status, lastModified:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} : p))
    toast.success('Page saved successfully!')
    setEditingPage(null)
  }

  const addPage = () => {
    if (!newPageTitle.trim()) return
    const slug = '/' + newPageTitle.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
    setPages(prev => [...prev, { id:Date.now(), title:newPageTitle, slug, status:'draft', lastModified:new Date().toLocaleDateString('en-IN'), editable:true }])
    setNewPageTitle(''); setShowNewPage(false); toast.success('Page created!')
  }

  if (editingPage) return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <button onClick={() => setEditingPage(null)} className="text-xs text-gray-400 hover:text-gold transition-colors mb-1 block">← Back to Pages</button>
          <h1 className="font-serif text-3xl text-charcoal">Editing: {editingPage.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Slug: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{editingPage.slug}</code></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPreview(!showPreview)}
            className={`px-5 py-2.5 border text-xs tracking-widests uppercase transition-all ${showPreview?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'}`}>
            {showPreview?'✕ Close Preview':'👁 Preview'}
          </button>
          <button onClick={handleSavePage} className="px-6 py-2.5 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all">Save Page</button>
        </div>
      </div>

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="mb-6 border-2 border-gold rounded-sm overflow-hidden">
          <div className="bg-charcoal px-4 py-2 flex items-center gap-3">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
            <div className="flex-1 bg-black/30 rounded px-3 py-1 text-stone/50 text-xs font-mono">localhost:3000{pageSEO.slug}</div>
            <span className="text-gold text-xs tracking-widests uppercase">Live Preview</span>
          </div>
          <div className="overflow-y-auto max-h-96 bg-white">
            {blocks.map(block => (
              <div key={block.id}>{renderBlockPreview(block)}</div>
            ))}
            {blocks.length === 0 && (
              <div style={{ padding:'40px', textAlign:'center', color:'#5c4a35', opacity:0.4 }}>Add blocks to preview your page</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-charcoal">Page Blocks ({blocks.length})</h3>
              <button onClick={() => setShowBlockPicker(!showBlockPicker)}
                className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-xs tracking-widests uppercase hover:bg-gold transition-all">
                + Add Block
              </button>
            </div>

            {showBlockPicker && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-sm">
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)}
                    className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 hover:border-gold hover:bg-white transition-all rounded-sm text-center">
                    <span className="text-2xl">{bt.icon}</span>
                    <p className="text-[10px] font-medium text-charcoal tracking-widests uppercase leading-tight">{bt.label}</p>
                  </button>
                ))}
              </div>
            )}

            {blocks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm">No blocks yet. Click "Add Block" to start.</p>
              </div>
            ) : (
              blocks.map((block, i) => (
                <BlockEditor key={block.id} block={block}
                  onUpdate={data => updateBlock(block.id, data)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id,'up')}
                  onMoveDown={() => moveBlock(block.id,'down')}/>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-sm p-5 space-y-4">
            <h3 className="font-serif text-lg text-charcoal border-b border-gray-100 pb-3">Page Settings</h3>
            <div><label className="form-label">Page Title</label><input value={pageSEO.title} onChange={e => setPageSEO(p=>({...p,title:e.target.value}))} className="form-input"/></div>
            <div><label className="form-label">URL Slug</label><input value={pageSEO.slug} onChange={e => setPageSEO(p=>({...p,slug:e.target.value}))} className="form-input font-mono text-xs"/></div>
            <div><label className="form-label">Status</label>
              <select value={pageSEO.status} onChange={e => setPageSEO(p=>({...p,status:e.target.value}))} className="form-input">
                <option value="published">Published</option><option value="draft">Draft</option>
              </select>
            </div>
            <div><label className="form-label">SEO Title</label><input value={pageSEO.metaTitle} onChange={e => setPageSEO(p=>({...p,metaTitle:e.target.value}))} className="form-input" placeholder="Page title for search engines"/></div>
            <div><label className="form-label">SEO Description</label><textarea value={pageSEO.metaDescription} onChange={e => setPageSEO(p=>({...p,metaDescription:e.target.value}))} className="form-input h-20 resize-none" placeholder="Page description…"/></div>
            <button onClick={handleSavePage} className="w-full py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all">Save & Publish</button>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <h4 className="text-xs tracking-widests uppercase text-gray-400 mb-3">Block Order</h4>
            {blocks.map((b,i) => (
              <div key={b.id} className="flex items-center gap-2 py-1 text-xs text-gray-500">
                <span className="w-4 text-gray-300">{i+1}</span>
                <span>{BLOCK_TYPES.find(bt=>bt.type===b.type)?.icon}</span>
                <span>{BLOCK_TYPES.find(bt=>bt.type===b.type)?.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">CMS Pages</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and edit website pages with the visual block editor</p>
        </div>
        <button onClick={() => setShowNewPage(true)} className="px-5 py-2.5 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all">+ New Page</button>
      </div>

      {showNewPage && (
        <div className="bg-white border border-gray-200 rounded-sm p-5 mb-5 flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="form-label">Page Title</label>
            <input value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} className="form-input" placeholder="e.g. Our Story, FAQs, Returns" onKeyDown={e => e.key==='Enter' && addPage()}/>
          </div>
          <button onClick={addPage} className="px-5 py-3 bg-charcoal text-white text-xs tracking-widests uppercase hover:bg-gold transition-all">Create</button>
          <button onClick={() => setShowNewPage(false)} className="px-5 py-3 border border-gray-200 text-gray-500 text-xs hover:border-gold transition-all">Cancel</button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              {['Title','URL','Status','Last Modified','Actions'].map(h => <th key={h} className="text-left px-5 py-3 text-[10px] tracking-widests uppercase text-gray-400 font-normal whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map(page => (
                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-charcoal">{page.title}</td>
                  <td className="px-5 py-4"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-warm">{page.slug}</code></td>
                  <td className="px-5 py-4"><span className={`status-badge ${page.status==='published'?'status-delivered':'status-pending'}`}>{page.status}</span></td>
                  <td className="px-5 py-4 text-xs text-gray-400">{page.lastModified}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {page.editable && <button onClick={() => handleOpenEdit(page)} className="text-xs text-gold border border-gold/30 px-3 py-1 hover:bg-gold hover:text-white transition-all">Edit</button>}
                      <a href={page.slug} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 border border-gray-200 px-3 py-1 hover:border-gold hover:text-gold transition-all">View ↗</a>
                      {page.editable && <button onClick={() => { setPages(prev => prev.filter(p => p.id!==page.id)); toast('Page deleted') }} className="text-xs text-gray-400 border border-gray-200 px-3 py-1 hover:border-red-300 hover:text-red-500 transition-all">Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
