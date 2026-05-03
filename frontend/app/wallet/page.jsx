'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Loader from '@/components/ui/Loader'
import { useAuthStore } from '@/lib/store'
import { walletAPI } from '@/lib/api'
import { fmt } from '@/lib/config'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TOPUP_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export default function WalletPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [topping, setTopping] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    walletAPI.getMy()
      .then(r => setWallet(r.data.wallet))
      .catch(() => setWallet({ balance: 0, transactions: [] }))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleTopup = async () => {
    const amt = Number(topupAmount || customAmount)
    if (!amt || amt < 100) { toast.error('Minimum top-up amount is ₹100'); return }
    setTopping(true)
    try {
      const { data } = await walletAPI.topup(amt)
      setWallet(data.wallet)
      toast.success(data.message)
      setTopupAmount(''); setCustomAmount('')
    } catch(err) { toast.error(err.response?.data?.message || 'Top-up failed') }
    finally { setTopping(false) }
  }

  if (!isAuthenticated) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="text-6xl mb-6 opacity-20">💰</div>
          <h3 className="font-serif text-2xl text-charcoal mb-4">Login to access your wallet</h3>
          <Link href="/auth/login" className="btn-gold">Login</Link>
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />
      <div className="pt-28 pb-10 bg-charcoal">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widests uppercase mb-4">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <Link href="/profile" className="hover:text-gold">Profile</Link><span>›</span>
            <span className="text-gold">My Wallet</span>
          </div>
          <h1 className="font-serif text-4xl text-white">My Wallet</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {loading ? <Loader/> : (
          <div className="space-y-6">
            {/* Balance card */}
            <div className="bg-charcoal p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <span className="font-serif text-[15rem] text-gold">₹</span>
              </div>
              <p className="text-stone/50 text-xs tracking-widests uppercase mb-2">Available Balance</p>
              <p className="font-serif text-5xl text-gold mb-1">{fmt(wallet?.balance || 0)}</p>
              <p className="text-stone/40 text-sm">{user?.firstName} {user?.lastName}'s Wallet</p>
            </div>

            {/* Top-up section */}
            <div className="bg-white border border-stone p-6">
              <h2 className="font-serif text-xl text-charcoal mb-5">Add Money to Wallet</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
                {TOPUP_AMOUNTS.map(a => (
                  <button key={a} onClick={() => { setTopupAmount(String(a)); setCustomAmount('') }}
                    className={`py-3 text-sm border transition-all ${topupAmount===String(a) ? 'border-gold bg-gold/10 text-gold' : 'border-stone text-warm hover:border-gold hover:text-gold'}`}>
                    {fmt(a)}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mb-4">
                <input type="number" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setTopupAmount('') }}
                  placeholder="Custom amount (min ₹100)" className="form-input flex-1" min="100"/>
                <button onClick={handleTopup} disabled={topping || (!topupAmount && !customAmount)}
                  className="px-8 py-3 bg-gold text-white text-xs tracking-widests uppercase hover:bg-gold-dark transition-all disabled:opacity-60 whitespace-nowrap">
                  {topping ? 'Processing…' : 'Add Money'}
                </button>
              </div>
              <div className="bg-stone/20 border border-stone p-3 text-xs text-warm/60 flex items-start gap-2">
                <span className="text-gold mt-0.5">ℹ️</span>
                <p>In demo mode, money is added directly. In production, payment via UPI/Card/Net Banking through Razorpay. Wallet money can be used at checkout to pay for orders.</p>
              </div>
            </div>

            {/* Transaction history */}
            <div className="bg-white border border-stone overflow-hidden">
              <div className="px-6 py-4 border-b border-stone">
                <h2 className="font-serif text-xl text-charcoal">Transaction History</h2>
              </div>
              {!wallet?.transactions?.length ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3 opacity-20">📋</p>
                  <p className="text-warm/60 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-stone">
                  {[...(wallet?.transactions || [])].reverse().map((tx, i) => (
                    <div key={i} className="flex items-center px-6 py-4 gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${tx.type==='credit' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {tx.type==='credit' ? '+' : '−'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-charcoal text-sm">{tx.description}</p>
                          {tx.expired && <span className="text-[9px] tracking-widest uppercase bg-red-100 text-red-500 px-1.5 py-0.5">Expired</span>}
                          {!tx.expired && tx.expiresAt && new Date(tx.expiresAt) > new Date() && (
                            <span className="text-[9px] tracking-widest uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5">
                              Expires {new Date(tx.expiresAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-warm/50">{new Date(tx.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-medium ${tx.type==='credit' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type==='credit' ? '+' : '−'}{fmt(tx.amount)}
                        </p>
                        <p className="text-xs text-warm/40">Bal: {fmt(tx.balanceAfter)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
