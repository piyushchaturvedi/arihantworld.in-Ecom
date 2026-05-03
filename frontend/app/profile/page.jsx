'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/ui/Loader'
import { useAuthStore, useWishlistStore } from '@/lib/store'
import { profileAPI, walletAPI } from '@/lib/api'
import { fmt } from '@/lib/config'
import toast from 'react-hot-toast'

const TABS = [
  { id:'personal',      label:'Personal Info',  icon:'👤' },
  { id:'addresses',     label:'Addresses',       icon:'📍' },
  { id:'wishlist',      label:'Wishlist',         icon:'❤️' },
  { id:'wallet',        label:'My Wallet',        icon:'💰' },
  { id:'security',      label:'Security',         icon:'🔒' },
  { id:'notifications', label:'Notifications',    icon:'🔔' },
]

const EMPTY_ADDR = { type:'Home', name:'', phone:'', line1:'', line2:'', city:'', state:'Rajasthan', pincode:'', isDefault:false }

function ProfileContent() {
  const searchParams = useSearchParams()
  const { user, isAuthenticated, updateUser, logout } = useAuthStore()
  const { items: wishlist, removeItem: removeWish } = useWishlistStore()

  const [tab, setTab] = useState(searchParams.get('tab') || 'personal')
  const [profileData, setProfileData] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '',
    email: user?.email || '', phone: user?.phone || '',
    dob: '', gender: '', anniversary: ''
  })
  const [pwdForm, setPwdForm] = useState({ current:'', newPwd:'', confirm:'' })
  const [addresses, setAddresses] = useState([])
  const [showAddrModal, setShowAddrModal] = useState(false)
  const [editAddrId, setEditAddrId] = useState(null)
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR)
  const [notifications, setNotifications] = useState({
    orderConfirmation:true, shippingUpdates:true, deliveryConfirmation:true,
    emailNewsletter:true, smsOffers:false, whatsappUpdates:true,
    loyaltyPoints:true, priceDrop:true, backInStock:false
  })

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    loadProfile()
  }, [isAuthenticated])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const [profRes, walletRes] = await Promise.allSettled([profileAPI.get(), walletAPI.getMy()])
      if (profRes.status === 'fulfilled') {
        const d = profRes.value.data.user || profRes.value.data
        setProfileData(d)
        setForm({ firstName:d.firstName||'', lastName:d.lastName||'', email:d.email||'', phone:d.phone||'', dob:d.dob?.split('T')[0]||'', gender:d.gender||'', anniversary:d.anniversary?.split('T')[0]||'' })
        setAddresses(d.addresses || [])
        if (d.notifications) setNotifications(d.notifications)
      }
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.wallet)
    } catch { /* use user from store as fallback */ }
    finally { setLoading(false) }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await profileAPI.update(form)
      updateUser(data.user || data)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwdForm.newPwd !== pwdForm.confirm) { toast.error('New passwords do not match'); return }
    if (pwdForm.newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await profileAPI.updatePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd })
      toast.success('Password changed successfully')
      setPwdForm({ current:'', newPwd:'', confirm:'' })
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setSaving(false) }
  }

  const openAddAddr = () => { setEditAddrId(null); setAddrForm(EMPTY_ADDR); setShowAddrModal(true) }
  const openEditAddr = (addr) => { setEditAddrId(addr._id); setAddrForm({ ...addr }); setShowAddrModal(true) }

  const handleSaveAddr = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editAddrId) {
        const { data } = await profileAPI.updateAddress(editAddrId, addrForm)
        setAddresses(prev => prev.map(a => a._id === editAddrId ? (data.address || addrForm) : a))
        toast.success('Address updated')
      } else {
        const { data } = await profileAPI.addAddress(addrForm)
        setAddresses(prev => [...prev, data.address || { ...addrForm, _id: 'local-' + Date.now() }])
        toast.success('Address added')
      }
      setShowAddrModal(false)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to save address') }
    finally { setSaving(false) }
  }

  const handleDeleteAddr = async (id) => {
    if (!confirm('Delete this address?')) return
    try {
      await profileAPI.deleteAddress(id)
      setAddresses(prev => prev.filter(a => a._id !== id))
      toast.success('Address deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleSaveNotifs = async () => {
    setSaving(true)
    try {
      await profileAPI.update({ notifications })
      toast.success('Notification preferences saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const setA = (k, v) => setAddrForm(prev => ({ ...prev, [k]: v }))
  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  if (!isAuthenticated) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="text-6xl mb-6 opacity-20">👤</div>
          <h3 className="font-serif text-2xl text-charcoal mb-4">Please login to view your profile</h3>
          <Link href="/auth/login" className="btn-gold">Login</Link>
        </div>
      </div>
      <Footer />
    </>
  )

  const displayUser = profileData || user

  return (
    <>
      <Navbar />
      <div className="pt-28 pb-10 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-2xl font-serif flex-shrink-0">
              {displayUser?.firstName?.[0] || 'U'}
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-white">{displayUser?.firstName} {displayUser?.lastName}</h1>
              <p className="text-stone/50 text-sm mt-1">{displayUser?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-[10px] tracking-widests uppercase px-3 py-1 ${displayUser?.membershipTier === 'Platinum' ? 'bg-purple-900/50 text-purple-300' : displayUser?.membershipTier === 'Gold' ? 'bg-yellow-900/50 text-yellow-300' : displayUser?.membershipTier === 'Silver' ? 'bg-gray-600 text-gray-200' : 'bg-amber-900/50 text-amber-300'}`}>
                  {displayUser?.membershipTier || 'Bronze'} Member
                </span>
                <span className="text-gold text-xs">✦ {displayUser?.loyaltyPoints || 0} Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? <Loader/> : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar tabs */}
            <aside className="lg:w-56 flex-shrink-0">
              <div className="bg-white border border-stone overflow-hidden">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs tracking-widests uppercase border-b border-stone/50 transition-all ${tab===t.id ? 'bg-charcoal text-white' : 'text-warm hover:text-gold hover:bg-stone/20'}`}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
                <button onClick={() => { logout(); window.location.href='/' }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-xs tracking-widests uppercase text-red-400 hover:bg-red-50 transition-colors">
                  <span>🚪</span><span>Logout</span>
                </button>
              </div>
              <div className="mt-4 bg-white border border-stone p-4 text-center">
                <p className="text-gold font-serif text-2xl">{displayUser?.loyaltyPoints || 0}</p>
                <p className="text-[10px] tracking-widests uppercase text-warm/50">Loyalty Points</p>
                <p className="text-[10px] text-warm/40 mt-1">{fmt((displayUser?.loyaltyPoints || 0) * 10)} redeemable</p>
              </div>
            </aside>

            {/* Tab content */}
            <div className="flex-1 min-w-0">

              {/* ── PERSONAL INFO ── */}
              {tab === 'personal' && (
                <div className="bg-white border border-stone p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl text-charcoal">Personal Information</h2>
                    {!editing && (
                      <button onClick={() => setEditing(true)} className="text-xs tracking-widests uppercase text-gold border border-gold px-4 py-2 hover:bg-gold hover:text-white transition-all">Edit</button>
                    )}
                  </div>
                  {editing ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className="form-label">First Name *</label><input value={form.firstName} onChange={e => setF('firstName',e.target.value)} className="form-input"/></div>
                        <div><label className="form-label">Last Name *</label><input value={form.lastName} onChange={e => setF('lastName',e.target.value)} className="form-input"/></div>
                        <div><label className="form-label">Email *</label><input type="email" value={form.email} onChange={e => setF('email',e.target.value)} className="form-input"/></div>
                        <div><label className="form-label">Phone *</label><input value={form.phone} onChange={e => setF('phone',e.target.value)} className="form-input"/></div>
                        <div><label className="form-label">Date of Birth</label><input type="date" value={form.dob} onChange={e => setF('dob',e.target.value)} className="form-input"/></div>
                        <div><label className="form-label">Gender</label>
                          <select value={form.gender} onChange={e => setF('gender',e.target.value)} className="form-input">
                            <option value="">Select…</option>
                            {['Male','Female','Other','Prefer not to say'].map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setEditing(false)} className="px-6 py-3 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold transition-all">Cancel</button>
                        <button onClick={handleSaveProfile} disabled={saving} className="btn-gold disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-10">
                      {[['First Name', displayUser?.firstName],['Last Name', displayUser?.lastName],['Email', displayUser?.email],['Phone', displayUser?.phone],['Member Since', displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : '—'],['Membership', displayUser?.membershipTier]].map(([l,v]) => (
                        <div key={l}>
                          <p className="text-[10px] tracking-widests uppercase text-warm/40 mb-1">{l}</p>
                          <p className="text-charcoal font-medium">{v || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ADDRESSES ── */}
              {tab === 'addresses' && (
                <div className="bg-white border border-stone p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl text-charcoal">My Addresses</h2>
                    <button onClick={openAddAddr} className="text-xs tracking-widests uppercase text-gold border border-gold px-4 py-2 hover:bg-gold hover:text-white transition-all">+ Add New</button>
                  </div>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3 opacity-20">📍</div>
                      <p className="text-warm/60 text-sm mb-4">No saved addresses yet</p>
                      <button onClick={openAddAddr} className="btn-gold">Add Address</button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <div key={addr._id} className={`border p-4 relative ${addr.isDefault?'border-gold bg-gold/3':'border-stone'}`}>
                          {addr.isDefault && <span className="absolute top-3 right-3 text-[9px] tracking-widests uppercase text-gold bg-gold/10 px-2 py-0.5">Default</span>}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] tracking-widests uppercase text-warm/50 border border-stone px-2 py-0.5">{addr.type}</span>
                          </div>
                          <p className="font-medium text-charcoal text-sm">{addr.name}</p>
                          <p className="text-warm/70 text-sm mt-1 leading-relaxed">{addr.line1}{addr.line2 && `, ${addr.line2}`}<br/>{addr.city}, {addr.state} – {addr.pincode}</p>
                          <p className="text-warm/50 text-xs mt-1">{addr.phone}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => openEditAddr(addr)} className="text-xs text-gold hover:underline">Edit</button>
                            <span className="text-warm/20">|</span>
                            <button onClick={() => handleDeleteAddr(addr._id)} className="text-xs text-red-400 hover:underline">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── WISHLIST ── */}
              {tab === 'wishlist' && (
                <div className="bg-white border border-stone p-6 md:p-8">
                  <h2 className="font-serif text-2xl text-charcoal mb-6">My Wishlist <span className="text-gold text-xl">({wishlist.length})</span></h2>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3 opacity-20">❤️</div>
                      <p className="text-warm/60 text-sm mb-4">Your wishlist is empty</p>
                      <Link href="/products" className="btn-gold">Browse Products</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {wishlist.map(p => (
                        <div key={p._id} className="border border-stone hover:border-gold transition-all group">
                          <Link href={`/products/${p.slug || p._id}`}>
                            <div className="aspect-square bg-gradient-to-br from-stone to-cream flex items-center justify-center text-4xl opacity-25 group-hover:opacity-40 transition-opacity">{p.icon||'🏺'}</div>
                            <div className="p-3">
                              <p className="text-[10px] uppercase tracking-widests text-gold mb-0.5">{p.category}</p>
                              <p className="font-serif text-charcoal text-sm leading-tight group-hover:text-gold transition-colors line-clamp-2">{p.name}</p>
                              <p className="text-gold text-sm mt-1">{fmt(p.salePrice || p.price)}</p>
                            </div>
                          </Link>
                          <div className="px-3 pb-3">
                            <button onClick={() => removeWish(p._id)} className="w-full text-xs tracking-widests uppercase text-red-400 border border-red-200 py-1.5 hover:bg-red-50 transition-all">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── WALLET ── */}
              {tab === 'wallet' && (
                <div className="bg-white border border-stone p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl text-charcoal">My Wallet</h2>
                    <Link href="/wallet" className="text-xs tracking-widests uppercase text-gold border border-gold px-4 py-2 hover:bg-gold hover:text-white transition-all">Manage Wallet</Link>
                  </div>
                  <div className="bg-charcoal p-8 text-center mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <span className="font-serif text-[12rem] text-gold">₹</span>
                    </div>
                    <p className="text-stone/50 text-xs tracking-widests uppercase mb-2">Available Balance</p>
                    <p className="font-serif text-5xl text-gold">{fmt(wallet?.balance || 0)}</p>
                  </div>
                  {wallet?.transactions?.length > 0 ? (
                    <div className="divide-y divide-stone">
                      <h3 className="text-xs tracking-widests uppercase text-warm/50 pb-3">Recent Transactions</h3>
                      {[...(wallet.transactions)].reverse().slice(0, 5).map((tx, i) => (
                        <div key={i} className="flex items-center py-3 gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${tx.type==='credit'?'bg-green-500':'bg-red-500'}`}>{tx.type==='credit'?'+':'−'}</div>
                          <div className="flex-1"><p className="text-sm text-charcoal">{tx.description}</p><p className="text-xs text-warm/40">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</p></div>
                          <p className={`font-medium ${tx.type==='credit'?'text-green-600':'text-red-500'}`}>{tx.type==='credit'?'+':'−'}{fmt(tx.amount)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-warm/40 text-sm">No transactions yet. Add money to your wallet!</p>
                  )}
                  <div className="mt-4">
                    <Link href="/wallet" className="w-full block text-center py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all">Add Money</Link>
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {tab === 'security' && (
                <div className="bg-white border border-stone p-6 md:p-8">
                  <h2 className="font-serif text-2xl text-charcoal mb-6">Security Settings</h2>
                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                    <div><label className="form-label">Current Password *</label><input required type="password" value={pwdForm.current} onChange={e => setPwdForm(p=>({...p,current:e.target.value}))} className="form-input" placeholder="••••••••"/></div>
                    <div><label className="form-label">New Password *</label><input required type="password" value={pwdForm.newPwd} onChange={e => setPwdForm(p=>({...p,newPwd:e.target.value}))} className="form-input" placeholder="Min. 8 characters"/></div>
                    <div><label className="form-label">Confirm New Password *</label><input required type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p=>({...p,confirm:e.target.value}))} className="form-input" placeholder="Repeat new password"/></div>
                    <button type="submit" disabled={saving} className="btn-gold disabled:opacity-60">{saving ? 'Changing…' : 'Change Password'}</button>
                  </form>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {tab === 'notifications' && (
                <div className="bg-white border border-stone p-6 md:p-8">
                  <h2 className="font-serif text-2xl text-charcoal mb-6">Notification Preferences</h2>
                  <div className="space-y-4 max-w-lg">
                    {[
                      ['orderConfirmation','Order Confirmations','Get notified when your order is placed'],
                      ['shippingUpdates','Shipping Updates','Track your order in transit'],
                      ['deliveryConfirmation','Delivery Confirmation','Know when your order arrives'],
                      ['emailNewsletter','Email Newsletter','New collections, artisan stories & offers'],
                      ['smsOffers','SMS Offers','Exclusive deals via SMS'],
                      ['whatsappUpdates','WhatsApp Updates','Order status on WhatsApp'],
                      ['loyaltyPoints','Loyalty Points','Earn & redeem point alerts'],
                      ['priceDrop','Price Drop Alerts','Wishlist item price reductions'],
                      ['backInStock','Back In Stock','Availability alerts for saved items'],
                    ].map(([key, label, desc]) => (
                      <label key={key} className="flex items-center justify-between gap-4 p-4 border border-stone hover:border-gold/40 cursor-pointer transition-all">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{label}</p>
                          <p className="text-xs text-warm/50">{desc}</p>
                        </div>
                        <div className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors cursor-pointer ${notifications[key]?'bg-gold':'bg-stone'}`}
                          onClick={() => setNotifications(prev=>({...prev,[key]:!prev[key]}))}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications[key]?'left-5.5 translate-x-0.5':'left-0.5'}`}></div>
                        </div>
                      </label>
                    ))}
                    <button onClick={handleSaveNotifs} disabled={saving} className="btn-gold w-full disabled:opacity-60">{saving?'Saving…':'Save Preferences'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Address Modal */}
      {showAddrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone">
              <h3 className="font-serif text-xl text-charcoal">{editAddrId ? 'Edit' : 'Add'} Address</h3>
              <button onClick={() => setShowAddrModal(false)} className="text-warm/40 hover:text-red-500 text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveAddr} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Name *</label><input required value={addrForm.name} onChange={e => setA('name',e.target.value)} className="form-input" placeholder="Full name"/></div>
                <div><label className="form-label">Phone *</label><input required value={addrForm.phone} onChange={e => setA('phone',e.target.value)} className="form-input" placeholder="+91…"/></div>
              </div>
              <div><label className="form-label">Address Line 1 *</label><input required value={addrForm.line1} onChange={e => setA('line1',e.target.value)} className="form-input" placeholder="House no., Street"/></div>
              <div><label className="form-label">Address Line 2</label><input value={addrForm.line2} onChange={e => setA('line2',e.target.value)} className="form-input" placeholder="Area, Landmark (optional)"/></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="form-label">City *</label><input required value={addrForm.city} onChange={e => setA('city',e.target.value)} className="form-input"/></div>
                <div><label className="form-label">State *</label><select value={addrForm.state} onChange={e => setA('state',e.target.value)} className="form-input">
                  {['Rajasthan','Maharashtra','Delhi','Gujarat','Karnataka','Tamil Nadu','Uttar Pradesh','West Bengal','Kerala','Other'].map(s=><option key={s}>{s}</option>)}
                </select></div>
                <div><label className="form-label">PIN *</label><input required value={addrForm.pincode} onChange={e => setA('pincode',e.target.value)} className="form-input" maxLength={6}/></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {['Home','Office','Other'].map(t => (
                    <button key={t} type="button" onClick={() => setA('type',t)}
                      className={`px-3 py-1.5 text-xs border transition-all ${addrForm.type===t?'bg-charcoal text-white border-charcoal':'border-stone text-warm hover:border-gold'}`}>{t}</button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={addrForm.isDefault} onChange={e => setA('isDefault',e.target.checked)} className="w-4 h-4 accent-amber-600"/>
                  <span className="text-xs text-warm/70">Set as default</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddrModal(false)} className="flex-1 py-3 border border-stone text-warm text-xs tracking-widests uppercase hover:border-gold transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark disabled:opacity-60">{saving?'Saving…':editAddrId?'Update':'Add Address'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loader fullPage/>}>
      <ProfileContent />
    </Suspense>
  )
}
