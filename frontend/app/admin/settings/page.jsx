'use client'
import { useState, useEffect, useRef } from 'react'
import { adminAPI } from '@/lib/api'
import { AdminLoader } from '@/components/ui/Loader'
import toast from 'react-hot-toast'

const SECTIONS = ['General','SEO','Contact','Social Media','Payments','Shipping','Email','Announcement Bar','Homepage Content']

// ── Moved OUTSIDE to prevent remount on every keystroke ──────────────────────
// Rule: Never define components inside other components in React
function SettingsInput({ label, fieldKey, type='text', placeholder='', value, onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="form-input"
        autoComplete="off"
      />
    </div>
  )
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('General')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef()

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await adminAPI.getSettings()
      setConfig(data.settings)
      if (data.settings?.logoUrl) setLogoPreview(data.settings.logoUrl)
    } catch {
      setConfig({ siteName:'Arihant World', tagline:'Premium Stone Arts', logo:'AW', since:'1985', phone:'+91 98765 43210', whatsapp:'+919876543210', email:'info@arihantworld.com', address:'Makrana, Nagaur District, Rajasthan – 341505', freeShippingThreshold:25000, gstPercent:18, defaultShippingRate:350, announcementBar:'Free Shipping on orders above ₹25,000', announcementActive:true, razorpayMode:'test' })
    }
    finally { setLoading(false) }
  }

  const set = (k, v) => setConfig(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminAPI.updateSettings(config)
      toast.success('Settings saved successfully!')
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to save settings') }
    finally { setSaving(false) }
  }

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }
    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', logoFile)
      const { data } = await adminAPI.uploadLogo(fd)
      set('logoUrl', data.logoUrl)
      toast.success('Logo uploaded successfully!')
      setLogoFile(null)
    } catch(err) { toast.error(err.response?.data?.message || 'Logo upload failed') }
    finally { setUploadingLogo(false) }
  }


  if (loading) return <AdminLoader text="Loading settings…"/>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Global Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your website settings, contact info, integrations & more</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`w-full text-left px-4 py-3 text-xs tracking-widests uppercase border-b border-gray-100 transition-all ${activeSection===s ? 'bg-gold text-white' : 'text-gray-600 hover:text-gold hover:bg-stone/20'}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-sm p-6 space-y-5">

            {activeSection==='General' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">General Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SettingsInput label="Site Name" fieldKey="siteName" type="text" placeholder="" value={config?.['siteName']} onChange={set}/>
                  <SettingsInput label="Tagline" fieldKey="tagline" type="text" placeholder="" value={config?.['tagline']} onChange={set}/>
                  <SettingsInput label="Logo Initials" fieldKey="logo" type="text" placeholder="" value={config?.['logo']} onChange={set}/>
                  <SettingsInput label="Established Since" fieldKey="since" type="text" placeholder="" value={config?.['since']} onChange={set}/>
                </div>

                {/* Logo upload */}
                <div>
                  <label className="form-label">Logo Image (optional)</label>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-stone flex items-center justify-center bg-cream cursor-pointer hover:border-gold transition-colors" onClick={() => logoInputRef.current?.click()}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2"/>
                      ) : (
                        <div className="text-center">
                          <p className="text-2xl text-gold">{config?.logo || 'AW'}</p>
                          <p className="text-[10px] text-warm/40 mt-1">Click to upload</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden"/>
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="px-4 py-2 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold hover:text-gold transition-all mb-2 block">
                        Choose Logo File
                      </button>
                      {logoFile && (
                        <button type="button" onClick={handleLogoUpload} disabled={uploadingLogo}
                          className="px-4 py-2 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60 block">
                          {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                        </button>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">Recommended: 80×80px PNG/SVG with transparent background. Max 2MB.</p>
                      <p className="text-[10px] text-amber-600 mt-1">⚠️ Connect Cloudinary in .env for permanent storage.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection==='SEO' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">SEO & Meta</h2>
                <SettingsInput label="Meta Title" fieldKey="metaTitle" type="text" placeholder="" value={config?.['metaTitle']} onChange={set}/>
                <div>
                  <label className="form-label">Meta Description</label>
                  <textarea value={config?.metaDescription||''} onChange={e => set('metaDescription',e.target.value)} className="form-input h-24 resize-none" maxLength={160}/>
                  <p className="text-xs text-gray-400 mt-1">{config?.metaDescription?.length||0}/160 characters</p>
                </div>
                <SettingsInput label="Keywords (comma separated)" fieldKey="keywords" type="text" placeholder="marble murti, home temple, Makrana marble…" value={config?.['keywords']} onChange={set}/>
                <SettingsInput label="Google Analytics ID" fieldKey="googleAnalyticsId" type="text" placeholder="G-XXXXXXXXXX" value={config?.['googleAnalyticsId']} onChange={set}/>
              </>
            )}

            {activeSection==='Contact' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SettingsInput label="Phone Number" fieldKey="phone" type="text" placeholder="+91 98765 43210" value={config?.['phone']} onChange={set}/>
                  <SettingsInput label="WhatsApp (no + or spaces)" fieldKey="whatsapp" type="text" placeholder="919876543210" value={config?.['whatsapp']} onChange={set}/>
                  <SettingsInput label="Email" fieldKey="email" type="email" placeholder="" value={config?.['email']} onChange={set}/>
                  <SettingsInput label="Consultation Admin Email" fieldKey="consultationAdminEmail" type="text" placeholder="admin@arihantworld.com" value={config?.['consultationAdminEmail']} onChange={set}/>
                </div>
                <div>
                  <label className="form-label">Full Address</label>
                  <textarea value={config?.address||''} onChange={e => set('address',e.target.value)} className="form-input h-20 resize-none"/>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SettingsInput label="City" fieldKey="city" type="text" placeholder="Makrana" value={config?.['city']} onChange={set}/>
                  <SettingsInput label="State" fieldKey="state" type="text" placeholder="Rajasthan" value={config?.['state']} onChange={set}/>
                  <SettingsInput label="PIN" fieldKey="pincode" type="text" placeholder="341505" value={config?.['pincode']} onChange={set}/>
                  <SettingsInput label="GSTIN (for invoices)" fieldKey="gstin" type="text" placeholder="08AWPPS1234A1Z2" value={config?.['gstin']} onChange={set}/>
                  <SettingsInput label="Country" fieldKey="country" type="text" placeholder="" value={config?.['country']} onChange={set}/>
                </div>
              </>
            )}

            {activeSection==='Social Media' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Social Media</h2>
                {[['Facebook','facebook'],['Instagram','instagram'],['YouTube','youtube'],['Twitter / X','twitter'],['Pinterest','pinterest']].map(([label,k]) => (
                  <div key={k}><label className="form-label">{label} URL</label><input type="url" value={config?.[k]||''} onChange={e => set(k,e.target.value)} placeholder={`https://${k}.com/arihantworld`} className="form-input"/></div>
                ))}
              </>
            )}

            {activeSection==='Payments' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Payment Settings</h2>
                <div>
                  <label className="form-label">Razorpay Mode</label>
                  <div className="flex gap-3">
                    {['test','live'].map(m => (
                      <button key={m} type="button" onClick={() => set('razorpayMode',m)}
                        className={`px-5 py-2 text-xs tracking-widests uppercase border transition-all ${config?.razorpayMode===m?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold'}`}>{m.toUpperCase()}</button>
                    ))}
                  </div>
                  {config?.razorpayMode==='live' && <p className="text-xs text-red-500 mt-1">⚠️ Live mode — real payments processed</p>}
                </div>
                <SettingsInput label="Razorpay Key ID" fieldKey="razorpayKeyId" type="text" placeholder="rzp_test_xxxxx" value={config?.['razorpayKeyId']} onChange={set}/>
                <div><label className="form-label">Razorpay Key Secret</label><input type="password" value={config?.razorpayKeySecret||''} onChange={e => set('razorpayKeySecret',e.target.value)} placeholder="••••••••" className="form-input"/></div>
                <div><label className="form-label">GST Percentage (%)</label><input type="number" value={config?.gstPercent||18} onChange={e => set('gstPercent',Number(e.target.value))} min="0" max="28" className="form-input"/></div>
                <div className="border border-gold/20 bg-gold/5 p-4 rounded-sm space-y-3">
                  <p className="text-xs tracking-widests uppercase text-gold font-medium">Online Payment Discount</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${config?.onlinePaymentDiscountEnabled?'bg-gold':'bg-stone'}`} onClick={() => set('onlinePaymentDiscountEnabled',!config?.onlinePaymentDiscountEnabled)}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${config?.onlinePaymentDiscountEnabled?'left-5':'left-0.5'}`}></div>
                    </div>
                    <span className="text-sm text-warm/70">Enable online payment discount</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="form-label">Discount % for Online Payment</label><input type="number" value={config?.onlinePaymentDiscountPct||5} onChange={e => set('onlinePaymentDiscountPct',Number(e.target.value))} min="0" max="50" className="form-input" placeholder="5"/></div>
                    <div><label className="form-label">Discount Message (shown to customer)</label><input value={config?.onlinePaymentDiscountMsg||'🎉 5% instant discount on Online Payment!'} onChange={e => set('onlinePaymentDiscountMsg',e.target.value)} className="form-input" placeholder="🎉 5% instant discount!"/></div>
                  </div>
                </div>

                {/* Pincode Checker Toggle */}
                <div className="border border-green-200 bg-green-50 p-4 rounded-sm space-y-3">
                  <p className="text-xs tracking-widest uppercase text-green-700 font-semibold">🗺️ Product Page — Pincode Delivery Checker</p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Show Pincode Delivery Checker</p>
                      <p className="text-xs text-gray-500 mt-0.5">Toggle to show/hide the delivery pincode checker on all product pages</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set('pincodeCheckerEnabled', config?.pincodeCheckerEnabled === false ? true : false)}
                      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${config?.pincodeCheckerEnabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${config?.pincodeCheckerEnabled !== false ? 'left-6' : 'left-0.5'}`}/>
                    </button>
                  </div>
                  <div className={`text-xs px-3 py-2 rounded ${config?.pincodeCheckerEnabled !== false ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {config?.pincodeCheckerEnabled !== false ? '✓ Pincode checker is visible on product pages' : '✕ Pincode checker is hidden from product pages'}
                  </div>
                </div>
              </>
            )}

            {activeSection==='Shipping' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Shipping Settings</h2>
                <div><label className="form-label">Free Shipping Threshold (₹)</label><input type="number" value={config?.freeShippingThreshold||25000} onChange={e => set('freeShippingThreshold',Number(e.target.value))} className="form-input"/><p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping. Set 0 to always charge.</p></div>
                <div><label className="form-label">Default Shipping Rate (₹)</label><input type="number" value={config?.defaultShippingRate||350} onChange={e => set('defaultShippingRate',Number(e.target.value))} className="form-input"/></div>
                <div><label className="form-label">Domestic Delivery (days)</label>
                  <div className="flex gap-3 items-center">
                    <input type="number" value={config?.domesticDeliveryMin||7} onChange={e => set('domesticDeliveryMin',Number(e.target.value))} className="form-input w-24" placeholder="Min"/>
                    <span className="text-warm/40">to</span>
                    <input type="number" value={config?.domesticDeliveryMax||14} onChange={e => set('domesticDeliveryMax',Number(e.target.value))} className="form-input w-24" placeholder="Max"/>
                    <span className="text-warm/60 text-sm">business days</span>
                  </div>
                </div>
                <div><label className="form-label">International Shipping Rate (₹)</label><input type="number" value={config?.internationalRate||2500} onChange={e => set('internationalRate',Number(e.target.value))} className="form-input"/></div>
                <label className="flex items-center gap-2 cursor-pointer p-4 bg-stone/20 border border-stone">
                  <input type="checkbox" checked={config?.internationalShipping!==false} onChange={e => set('internationalShipping',e.target.checked)} className="w-4 h-4 accent-amber-600"/>
                  <span className="text-sm text-warm/70">Enable international shipping</span>
                </label>
              </>
            )}

            {activeSection==='Email' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Email (SMTP)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SettingsInput label="SMTP Host" fieldKey="emailHost" type="text" placeholder="smtp.gmail.com" value={config?.['emailHost']} onChange={set}/>
                  <SettingsInput label="SMTP Port" fieldKey="emailPort" type="text" placeholder="587" value={config?.['emailPort']} onChange={set}/>
                  <div><label className="form-label">SMTP Username</label><input type="email" value={config?.emailUser||''} onChange={e => set('emailUser',e.target.value)} placeholder="your@gmail.com" className="form-input"/></div>
                  <div><label className="form-label">SMTP Password</label><input type="password" value={config?.emailPass||''} onChange={e => set('emailPass',e.target.value)} placeholder="App password" className="form-input"/></div>
                </div>
                <SettingsInput label="From Email" fieldKey="emailFrom" type="text" placeholder="Arihant World <noreply@arihantworld.com>" value={config?.['emailFrom']} onChange={set}/>
                <div className="bg-stone/20 border border-stone p-4 text-xs text-warm/60">
                  <p className="font-medium mb-2 text-warm">Gmail Setup:</p>
                  <p>1. Enable 2-Factor Authentication on Gmail</p>
                  <p>2. Go to Google Account → Security → App Passwords</p>
                  <p>3. Generate an App Password for "Mail" and paste it above</p>
                </div>
                <button type="button" onClick={() => toast.success('Test email queued! Check admin email.')} className="px-5 py-2.5 border border-gold text-gold text-xs tracking-widests uppercase hover:bg-gold hover:text-white transition-all">Send Test Email</button>
              </>
            )}

            {activeSection==='Announcement Bar' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Announcement Bar</h2>
                <label className="flex items-center gap-3 mb-4">
                  <div className={`relative w-11 h-6 cursor-pointer`} onClick={() => set('announcementActive', !config?.announcementActive)}>
                    <div className={`absolute inset-0 rounded-full transition-colors ${config?.announcementActive ? 'bg-gold' : 'bg-stone'}`}></div>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config?.announcementActive ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`}></div>
                  </div>
                  <span className="text-sm text-warm/70">Show announcement bar on website</span>
                </label>
                <div>
                  <label className="form-label">Announcement Text</label>
                  <input value={config?.announcementBar||''} onChange={e => set('announcementBar',e.target.value)} className="form-input"/>
                  <p className="text-xs text-gray-400 mt-1">Separate multiple announcements with " | " for marquee effect</p>
                </div>
                {config?.announcementActive && (
                  <div className="mt-3 bg-gold px-4 py-2.5 text-white text-xs text-center overflow-hidden">
                    <div className="marquee-track gap-12">{[...Array(2)].map((_,i) => config.announcementBar?.split('|').map((t,j) => <span key={`${i}-${j}`} className="flex-shrink-0 mr-12">◆ {t.trim()}</span>))}</div>
                  </div>
                )}
              </>
            )}


            {activeSection==='Homepage Content' && (
              <>
                <h2 className="font-serif text-xl text-charcoal border-b border-gray-100 pb-3">Homepage Content</h2>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-sm">These fields control the text shown on your homepage. Save to update live immediately.</p>
                <SettingsInput label="Hero Title" fieldKey="heroTitle" type="text" placeholder="Divine Craftsmanship in Marble" value={config?.['heroTitle']} onChange={set}/>
                <div><label className="form-label">Hero Subtitle</label><textarea value={config?.heroSubtitle||''} onChange={e => set('heroSubtitle',e.target.value)} className="form-input h-20 resize-none"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsInput label="Hero Button 1 Text" fieldKey="heroCTA1" type="text" placeholder="Explore Collections" value={config?.['heroCTA1']} onChange={set}/>
                  <SettingsInput label="Hero Button 2 Text" fieldKey="heroCTA2" type="text" placeholder="Our Story" value={config?.['heroCTA2']} onChange={set}/>
                </div>
                <SettingsInput label="Hero Tagline (below headline)" fieldKey="heroTagline" type="text" placeholder="SINCE 1985 · MAKRANA MARBLE" value={config?.['heroTagline']} onChange={set}/>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label mb-0">About Section Images</label>
                    <span className="text-[10px] text-gray-400">3 images displayed in the about section grid on homepage</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0,1,2].map(i => {
                      const labels = ['Large (top-left)', 'Top-right', 'Bottom-right']
                      const imgUrl = config?.aboutImages?.[i]?.url || ''
                      return (
                        <div key={i} className="border border-gray-200 rounded-sm overflow-hidden">
                          {/* Preview */}
                          <div className="aspect-square bg-stone/20 flex items-center justify-center relative overflow-hidden">
                            {imgUrl
                              ? <img src={imgUrl} alt="" className="w-full h-full object-cover"/>
                              : <div className="text-center text-gray-300"><div className="text-3xl mb-1">🖼️</div><p className="text-[10px]">No image</p></div>}
                            {imgUrl && (
                              <button
                                type="button"
                                onClick={() => { const arr=[...((config?.aboutImages)||[{url:'',alt:''},{url:'',alt:''},{url:'',alt:''}])]; arr[i]={url:'',alt:''}; set('aboutImages',arr) }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hover:bg-red-600"
                              >✕</button>
                            )}
                          </div>
                          <div className="p-3 space-y-2">
                            <p className="text-[10px] tracking-widest uppercase text-gray-400">{labels[i]}</p>
                            {/* Upload file */}
                            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-stone cursor-pointer hover:border-gold transition-colors text-xs text-gray-500 hover:text-gold">
                              <input type="file" accept="image/*" className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files[0]
                                  if (!file) return
                                  const fd = new FormData(); fd.append('image', file)
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'http://localhost:5000'}/api/admin/products/upload-image`, {
                                      method:'POST', headers:{ Authorization:`Bearer ${document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('token='))?.split('=')[1]||''}` }, body:fd
                                    })
                                    const data = await res.json()
                                    if (data.url) {
                                      const arr=[...((config?.aboutImages)||[{url:'',alt:''},{url:'',alt:''},{url:'',alt:''}])]
                                      if(!arr[i]) arr[i]={url:'',alt:''}
                                      arr[i].url = data.url
                                      set('aboutImages',arr)
                                    }
                                  } catch(err) { alert('Upload failed') }
                                }}
                              />
                              📁 Upload Image
                            </label>
                            {/* Or paste URL */}
                            <input
                              value={imgUrl}
                              onChange={e => { const arr=[...((config?.aboutImages)||[{url:'',alt:''},{url:'',alt:''},{url:'',alt:''}])]; if(!arr[i]) arr[i]={url:'',alt:''}; arr[i].url=e.target.value; set('aboutImages',arr) }}
                              className="form-input text-xs w-full"
                              placeholder="Or paste image URL"
                            />
                            <input
                              value={config?.aboutImages?.[i]?.alt||''}
                              onChange={e => { const arr=[...((config?.aboutImages)||[{url:'',alt:''},{url:'',alt:''},{url:'',alt:''}])]; if(!arr[i]) arr[i]={url:'',alt:''}; arr[i].alt=e.target.value; set('aboutImages',arr) }}
                              className="form-input text-xs w-full"
                              placeholder="Alt text (for SEO)"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <SettingsInput label="About Section Title" fieldKey="aboutTitle" type="text" placeholder="Where Sacred Art Meets Eternity" value={config?.['aboutTitle']} onChange={set}/>
                <div><label className="form-label">About Text (Paragraph 1)</label><textarea value={config?.aboutText||''} onChange={e => set('aboutText',e.target.value)} className="form-input h-24 resize-none"/></div>
                <div><label className="form-label">About Text (Paragraph 2)</label><textarea value={config?.aboutText2||''} onChange={e => set('aboutText2',e.target.value)} className="form-input h-24 resize-none"/></div>
                <div>
                  <label className="form-label">Stats (3 numbers shown in About section)</label>
                  <div className="space-y-2">
                    {(config?.stats || [{value:'40+',label:'Years of Craft'},{value:'50K+',label:'Happy Homes'},{value:'30+',label:'Countries Served'}]).map((s,i) => (
                      <div key={i} className="grid grid-cols-2 gap-3">
                        <input value={s.value} onChange={e => { const arr=[...(config.stats||[])]; arr[i]={...arr[i],value:e.target.value}; set('stats',arr) }} className="form-input" placeholder="40+"/>
                        <input value={s.label} onChange={e => { const arr=[...(config.stats||[])]; arr[i]={...arr[i],label:e.target.value}; set('stats',arr) }} className="form-input" placeholder="Years of Craft"/>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Testimonials</label>
                  <div className="space-y-3">
                    {(config?.testimonials || []).map((t,i) => (
                      <div key={i} className="border border-gray-200 p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={t.name} onChange={e => { const arr=[...config.testimonials]; arr[i]={...arr[i],name:e.target.value}; set('testimonials',arr) }} className="form-input text-sm" placeholder="Customer Name"/>
                          <input value={t.city} onChange={e => { const arr=[...config.testimonials]; arr[i]={...arr[i],city:e.target.value}; set('testimonials',arr) }} className="form-input text-sm" placeholder="City"/>
                        </div>
                        <textarea value={t.text} onChange={e => { const arr=[...config.testimonials]; arr[i]={...arr[i],text:e.target.value}; set('testimonials',arr) }} className="form-input h-16 resize-none text-sm" placeholder="Review text"/>
                      </div>
                    ))}
                    <button type="button" onClick={() => set('testimonials',[...(config.testimonials||[]),{name:'',city:'',rating:5,text:''}])} className="text-xs text-gold border border-gold/30 px-3 py-1.5 hover:bg-gold/10 transition-all">+ Add Testimonial</button>
                  </div>
                </div>
                <div>
                  <label className="form-label">FAQ Items</label>
                  <div className="space-y-3">
                    {(config?.faqs || []).map((faq,i) => (
                      <div key={i} className="border border-gray-200 p-3 space-y-2">
                        <input value={faq.q} onChange={e => { const arr=[...config.faqs]; arr[i]={...arr[i],q:e.target.value}; set('faqs',arr) }} className="form-input text-sm" placeholder="Question"/>
                        <textarea value={faq.a} onChange={e => { const arr=[...config.faqs]; arr[i]={...arr[i],a:e.target.value}; set('faqs',arr) }} className="form-input h-16 resize-none text-sm" placeholder="Answer"/>
                        <button type="button" onClick={() => set('faqs',config.faqs.filter((_,j)=>j!==i))} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => set('faqs',[...(config.faqs||[]),{q:'',a:''}])} className="text-xs text-gold border border-gold/30 px-3 py-1.5 hover:bg-gold/10 transition-all">+ Add FAQ</button>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-5 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60">
                {saving ? 'Saving…' : 'SAVE SETTINGS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
