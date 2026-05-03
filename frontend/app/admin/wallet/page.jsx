'use client'
import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`

export default function AdminWalletPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creditForm, setCreditForm] = useState({ amount:'', description:'', expiresInDays:'' })
  const [debitForm, setDebitForm]  = useState({ amount:'', description:'' })
  const [showCredit, setShowCredit] = useState(false)
  const [showDebit,  setShowDebit]  = useState(false)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers({ limit:100 })
      setUsers((data.users||[]).filter(u => u.role !== 'admin'))
    } catch { setUsers([]) }
  }

  const selectUser = async (user) => {
    setSelected(user); setLoading(true); setWallet(null)
    try {
      const { data } = await adminAPI.getUserWallet(user._id)
      setWallet(data.wallet)
    } catch { setWallet({ balance:0, transactions:[] }) }
    finally { setLoading(false) }
  }

  const handleCredit = async () => {
    if (!creditForm.amount || Number(creditForm.amount) <= 0) { toast.error('Enter valid amount'); return }
    if (!creditForm.description.trim()) { toast.error('Description required'); return }
    setSaving(true)
    try {
      const payload = {
        amount: Number(creditForm.amount),
        description: creditForm.description,
        ...(creditForm.expiresInDays ? { expiresInDays: Number(creditForm.expiresInDays) } : {})
      }
      const { data } = await adminAPI.creditWallet(selected._id, payload)
      setWallet(data.wallet)
      toast.success(`${fmt(payload.amount)} credited to ${selected.firstName}'s wallet`)
      setCreditForm({ amount:'', description:'', expiresInDays:'' })
      setShowCredit(false)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDebit = async () => {
    if (!debitForm.amount || Number(debitForm.amount) <= 0) { toast.error('Enter valid amount'); return }
    if (!debitForm.description.trim()) { toast.error('Description required'); return }
    setSaving(true)
    try {
      const { data } = await adminAPI.debitWallet(selected._id, {
        amount: Number(debitForm.amount),
        description: debitForm.description,
      })
      setWallet(data.wallet)
      toast.success(`${fmt(Number(debitForm.amount))} debited`)
      setDebitForm({ amount:'', description:'' })
      setShowDebit(false)
    } catch(err) { toast.error(err.response?.data?.message || 'Insufficient balance or error') }
    finally { setSaving(false) }
  }

  const filteredUsers = users.filter(u =>
    !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const now = new Date()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-charcoal">Wallet Management</h1>
        <p className="text-gray-500 text-sm mt-1">Credit or debit wallet balance for any user</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User list */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="p-4 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="form-input w-full text-sm"/>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
            {filteredUsers.map(u => (
              <button key={u._id} onClick={() => selectUser(u)}
                className={`w-full text-left px-4 py-3 hover:bg-gold/5 transition-colors flex items-center gap-3 ${selected?._id===u._id?'bg-gold/10 border-r-2 border-gold':''}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-sm font-serif flex-shrink-0">
                  {u.firstName?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-charcoal text-sm truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet detail */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="bg-white border border-gray-200 rounded-sm p-16 text-center text-gray-400">
              <p className="text-3xl mb-2">💰</p><p className="text-sm">Select a user to manage their wallet</p>
            </div>
          ) : loading ? (
            <div className="bg-white border border-gray-200 rounded-sm p-16 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-3"/>
              <p className="text-sm">Loading wallet…</p>
            </div>
          ) : (
            <>
              {/* Balance card */}
              <div className="bg-charcoal rounded-sm p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-stone/50 mb-1">Wallet Balance</p>
                    <p className="font-serif text-4xl text-gold">{fmt(wallet?.balance || 0)}</p>
                    <p className="text-stone/60 text-sm mt-1">{selected.firstName} {selected.lastName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowCredit(true); setShowDebit(false) }}
                      className="px-4 py-2 bg-green-500 text-white text-xs tracking-widest uppercase hover:bg-green-600 transition-all">+ Credit</button>
                    <button onClick={() => { setShowDebit(true); setShowCredit(false) }}
                      className="px-4 py-2 bg-red-500 text-white text-xs tracking-widest uppercase hover:bg-red-600 transition-all">− Debit</button>
                  </div>
                </div>
              </div>

              {/* Credit form */}
              {showCredit && (
                <div className="bg-green-50 border border-green-200 rounded-sm p-5 space-y-3">
                  <p className="text-sm font-medium text-green-800">Credit Wallet</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Amount (₹) *</label>
                      <input type="number" value={creditForm.amount} onChange={e => setCreditForm(p=>({...p,amount:e.target.value}))} className="form-input" placeholder="500" min="1"/>
                    </div>
                    <div>
                      <label className="form-label">Expires In (days) <span className="text-gray-400 font-normal">optional</span></label>
                      <input type="number" value={creditForm.expiresInDays} onChange={e => setCreditForm(p=>({...p,expiresInDays:e.target.value}))} className="form-input" placeholder="30 days (blank = no expiry)" min="1"/>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Description *</label>
                    <input value={creditForm.description} onChange={e => setCreditForm(p=>({...p,description:e.target.value}))} className="form-input" placeholder="Cashback, refund, welcome bonus…"/>
                  </div>
                  {creditForm.expiresInDays && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2">
                      ⏱ This credit will expire on {new Date(Date.now() + Number(creditForm.expiresInDays)*86400000).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowCredit(false)} className="px-4 py-2 border border-gray-200 text-gray-500 text-xs uppercase hover:border-gold transition-all">Cancel</button>
                    <button onClick={handleCredit} disabled={saving} className="px-6 py-2 bg-green-500 text-white text-xs uppercase hover:bg-green-600 disabled:opacity-60 transition-all">{saving?'Crediting…':'Confirm Credit'}</button>
                  </div>
                </div>
              )}

              {/* Debit form */}
              {showDebit && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-5 space-y-3">
                  <p className="text-sm font-medium text-red-800">Debit Wallet</p>
                  <div>
                    <label className="form-label">Amount (₹) *</label>
                    <input type="number" value={debitForm.amount} onChange={e => setDebitForm(p=>({...p,amount:e.target.value}))} className="form-input" placeholder="500" min="1" max={wallet?.balance}/>
                    <p className="text-xs text-gray-400 mt-1">Available: {fmt(wallet?.balance || 0)}</p>
                  </div>
                  <div>
                    <label className="form-label">Description *</label>
                    <input value={debitForm.description} onChange={e => setDebitForm(p=>({...p,description:e.target.value}))} className="form-input" placeholder="Adjustment, penalty…"/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDebit(false)} className="px-4 py-2 border border-gray-200 text-gray-500 text-xs uppercase hover:border-gold transition-all">Cancel</button>
                    <button onClick={handleDebit} disabled={saving} className="px-6 py-2 bg-red-500 text-white text-xs uppercase hover:bg-red-600 disabled:opacity-60 transition-all">{saving?'Debiting…':'Confirm Debit'}</button>
                  </div>
                </div>
              )}

              {/* Transaction history */}
              <div className="bg-white border border-gray-200 rounded-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-serif text-lg text-charcoal">Transaction History</h3>
                </div>
                {(!wallet?.transactions?.length) ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No transactions yet</div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                    {[...wallet.transactions].reverse().map((tx, i) => {
                      const isExpired = tx.expired
                      const expiresAt = tx.expiresAt ? new Date(tx.expiresAt) : null
                      const expiringSoon = expiresAt && !isExpired && expiresAt > now && (expiresAt - now) < 7*86400000
                      return (
                        <div key={i} className="flex items-start gap-3 px-5 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${tx.type==='credit'?'bg-green-500':'bg-red-500'}`}>
                            {tx.type==='credit'?'+':'−'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-charcoal text-sm">{tx.description}</p>
                              {isExpired && <span className="text-[9px] tracking-widest uppercase bg-red-100 text-red-500 px-1.5 py-0.5">Expired</span>}
                              {expiringSoon && <span className="text-[9px] tracking-widest uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5">Expires soon</span>}
                              {expiresAt && !isExpired && !expiringSoon && expiresAt > now && (
                                <span className="text-[9px] tracking-widest uppercase bg-blue-50 text-blue-500 px-1.5 py-0.5">
                                  Exp: {expiresAt.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                              {tx.createdBy && ` · By: ${tx.createdBy}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-medium text-sm ${tx.type==='credit'?'text-green-600':'text-red-500'}`}>
                              {tx.type==='credit'?'+':'−'}{fmt(tx.amount)}
                            </p>
                            <p className="text-xs text-gray-400">Bal: {fmt(tx.balanceAfter)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
