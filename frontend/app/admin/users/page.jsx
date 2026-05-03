'use client'
import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { AdminLoader } from '@/components/ui/Loader'
import toast from 'react-hot-toast'

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`

// ── Outside component to prevent focus loss ───────────────────────────────
function PwdField({ label, field, placeholder, value, onChange, error, onClearError }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        type="password"
        value={value}
        onChange={e => { onChange(field, e.target.value); if (error) onClearError(field) }}
        className={`form-input ${error ? 'border-red-400 bg-red-50' : ''}`}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      {error && <p className="text-red-500 text-xs mt-1">⚠ {error}</p>}
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [pwdTarget, setPwdTarget] = useState(null) // null = own password
  const [pwdForm, setPwdForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [pwdErrors, setPwdErrors] = useState({})
  const [createForm, setCreateForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', role:'user' })

  useEffect(() => { loadUsers() }, [filter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.role = filter
      if (search) params.search = search
      const { data } = await adminAPI.getUsers(params)
      setUsers(data.users || [])
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const { data } = await adminAPI.updateUser(selected._id, {
        role: selected.role,
        isActive: selected.isActive !== false,
        loyaltyPoints: Number(selected.loyaltyPoints || 0),
      })
      setUsers(prev => prev.map(u => u._id === selected._id ? { ...u, ...data.user } : u))
      toast.success('User updated')
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleCreate = async () => {
    if (!createForm.firstName || !createForm.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const { data } = await adminAPI.createUser(createForm)
      setUsers(prev => [data.user, ...prev])
      toast.success('User created')
      setShowCreate(false)
      setCreateForm({ firstName:'', lastName:'', email:'', phone:'', password:'', role:'user' })
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to create user') }
    finally { setSaving(false) }
  }

  const openPwdModal = (user) => {
    setPwdTarget(user) // null = own password
    setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' })
    setPwdErrors({})
    setShowPwdModal(true)
  }

  const validatePwd = () => {
    const e = {}
    if (!pwdTarget && !pwdForm.currentPassword) e.currentPassword = 'Current password required'
    if (!pwdForm.newPassword) e.newPassword = 'New password required'
    else if (pwdForm.newPassword.length < 8) e.newPassword = 'Min 8 characters'
    if (pwdForm.newPassword !== pwdForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handlePasswordChange = async () => {
    const errors = validatePwd()
    if (Object.keys(errors).length > 0) { setPwdErrors(errors); return }
    setSaving(true)
    try {
      if (pwdTarget) {
        // Change another user's password
        await adminAPI.changeUserPassword(pwdTarget._id, pwdForm.newPassword)
        toast.success(`Password changed for ${pwdTarget.firstName}`)
      } else {
        // Change own password
        await adminAPI.changeOwnPassword(pwdForm.currentPassword, pwdForm.newPassword)
        toast.success('Your password updated successfully')
      }
      setShowPwdModal(false)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setSaving(false) }
  }

  const filtered = users.filter(u => !search
    || `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    || u.email?.toLowerCase().includes(search.toLowerCase())
  )



  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} users found</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openPwdModal(null)} className="px-4 py-2 border border-gold text-gold text-xs tracking-widest uppercase hover:bg-gold hover:text-white transition-all">
            🔑 My Password
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-gold text-white text-xs tracking-widest uppercase hover:bg-gold-dark transition-all">
            + Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-5 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {['all','user','admin'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-all capitalize ${filter===f?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && loadUsers()}
            placeholder="Search name or email…" className="form-input w-56 text-sm"/>
          <button onClick={loadUsers} className="px-4 py-2 bg-charcoal text-white text-xs uppercase hover:bg-gold transition-all">GO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Users table */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-sm overflow-hidden">
          {loading ? <AdminLoader text="Loading users…"/> : (
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['User','Email','Role','Tier','Status','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-gray-400 font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${selected?._id===u._id?'bg-gold/5':''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xs font-serif flex-shrink-0">
                          {u.firstName?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-charcoal text-sm">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 ${u.role==='admin'?'bg-purple-100 text-purple-700':'bg-blue-50 text-blue-600'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 ${u.membershipTier==='gold'?'bg-yellow-100 text-yellow-700':u.membershipTier==='silver'?'bg-gray-100 text-gray-600':'bg-amber-50 text-amber-600'}`}>
                        {u.membershipTier || 'bronze'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 ${u.isActive!==false?'bg-green-50 text-green-600':'bg-red-50 text-red-500'}`}>
                        {u.isActive!==false?'✓ Active':'✕ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelected({...u})} className="text-xs px-3 py-1.5 border border-stone text-warm hover:border-gold hover:text-gold transition-all">Manage</button>
                        <button onClick={() => openPwdModal(u)} className="text-xs px-2 py-1.5 border border-stone text-warm hover:border-amber-400 hover:text-amber-600 transition-all" title="Change password">🔑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <div className="bg-charcoal p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gold mx-auto flex items-center justify-center text-white text-2xl font-serif mb-3">
                  {selected.firstName?.[0]?.toUpperCase()}
                </div>
                <p className="font-serif text-lg text-white">{selected.firstName} {selected.lastName}</p>
                <p className="text-stone/50 text-sm">{selected.email}</p>
                {selected.walletBalance > 0 && <p className="text-gold text-sm mt-1">{fmt(selected.walletBalance)} wallet</p>}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="form-label">Role</label>
                  <div className="flex gap-2">
                    {['user','admin'].map(r => (
                      <button key={r} onClick={() => setSelected(p => ({...p, role:r}))}
                        className={`flex-1 py-2 text-xs tracking-widest uppercase border transition-all capitalize ${selected.role===r?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Account Status</label>
                  <div className="flex gap-2">
                    {[true,false].map(v => (
                      <button key={String(v)} onClick={() => setSelected(p => ({...p, isActive:v}))}
                        className={`flex-1 py-2 text-xs tracking-widest uppercase border transition-all ${selected.isActive===v||(v&&selected.isActive===undefined)?v?'bg-green-500 text-white border-green-500':'bg-red-500 text-white border-red-500':v?'border-gray-200 text-gray-500 hover:border-green-400':'border-gray-200 text-gray-500 hover:border-red-400'}`}>
                        {v ? 'Active' : 'Inactive'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Loyalty Points</label>
                  <input type="number" value={selected.loyaltyPoints||0} onChange={e => setSelected(p => ({...p, loyaltyPoints:e.target.value}))} className="form-input"/>
                </div>
                <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-gold text-white text-xs tracking-widest uppercase hover:bg-gold-dark disabled:opacity-60 transition-all">
                  {saving?'Saving…':'Save Changes'}
                </button>
                <button onClick={() => openPwdModal(selected)} className="w-full py-3 border border-amber-300 text-amber-700 text-xs tracking-widest uppercase hover:bg-amber-50 transition-all">
                  🔑 Change User Password
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-sm p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm">Select a user to manage</p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-serif text-xl text-charcoal">Create New User</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">First Name *</label><input value={createForm.firstName} onChange={e => setCreateForm(p=>({...p,firstName:e.target.value}))} className="form-input" placeholder="Rajesh"/></div>
                <div><label className="form-label">Last Name</label><input value={createForm.lastName} onChange={e => setCreateForm(p=>({...p,lastName:e.target.value}))} className="form-input" placeholder="Sharma"/></div>
              </div>
              <div><label className="form-label">Email *</label><input type="email" value={createForm.email} onChange={e => setCreateForm(p=>({...p,email:e.target.value}))} className="form-input" placeholder="user@email.com"/></div>
              <div><label className="form-label">Phone</label><input type="tel" value={createForm.phone} onChange={e => setCreateForm(p=>({...p,phone:e.target.value}))} className="form-input" placeholder="+91 98765 43210"/></div>
              <div><label className="form-label">Password <span className="text-gray-400 font-normal normal-case">(blank = Admin@123456)</span></label><input type="password" value={createForm.password} onChange={e => setCreateForm(p=>({...p,password:e.target.value}))} className="form-input" placeholder="Min 8 chars"/></div>
              <div>
                <label className="form-label">Role</label>
                <div className="flex gap-2">
                  {['user','admin'].map(r => (
                    <button key={r} onClick={() => setCreateForm(p=>({...p,role:r}))}
                      className={`flex-1 py-2 text-xs tracking-widest uppercase border transition-all capitalize ${createForm.role===r?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widest uppercase hover:border-gold transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 py-3 bg-gold text-white text-xs tracking-widest uppercase hover:bg-gold-dark disabled:opacity-60 transition-all">{saving?'Creating…':'Create User'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-serif text-xl text-charcoal">
                  {pwdTarget ? `Change Password` : 'Change My Password'}
                </h3>
                {pwdTarget && <p className="text-sm text-gray-500 mt-0.5">{pwdTarget.firstName} {pwdTarget.lastName} · {pwdTarget.email}</p>}
              </div>
              <button onClick={() => setShowPwdModal(false)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {!pwdTarget && (
                <PwdField label="Current Password *" field="currentPassword" placeholder="Your current password" value={pwdForm.currentPassword} onChange={(f,v)=>setPwdForm(p=>({...p,[f]:v}))} error={pwdErrors.currentPassword} onClearError={(f)=>setPwdErrors(p=>({...p,[f]:''}))} />
              )}
              {pwdTarget && (
                <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                  ⚠ You are changing the password for <strong>{pwdTarget.firstName} {pwdTarget.lastName}</strong>. They will need to use the new password to login.
                </div>
              )}
              <PwdField label="New Password *" field="newPassword" placeholder="Min 8 characters" value={pwdForm.newPassword} onChange={(f,v)=>setPwdForm(p=>({...p,[f]:v}))} error={pwdErrors.newPassword} onClearError={(f)=>setPwdErrors(p=>({...p,[f]:''}))} />
              <PwdField label="Confirm New Password *" field="confirmPassword" placeholder="Repeat new password" value={pwdForm.confirmPassword} onChange={(f,v)=>setPwdForm(p=>({...p,[f]:v}))} error={pwdErrors.confirmPassword} onClearError={(f)=>setPwdErrors(p=>({...p,[f]:''}))} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPwdModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs tracking-widest uppercase hover:border-gold transition-all">Cancel</button>
                <button onClick={handlePasswordChange} disabled={saving} className="flex-1 py-3 bg-amber-500 text-white text-xs tracking-widest uppercase hover:bg-amber-600 disabled:opacity-60 transition-all">
                  {saving ? 'Saving…' : '🔑 Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
