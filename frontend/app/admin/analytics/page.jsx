'use client'
import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { AdminLoader } from '@/components/ui/Loader'

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)
  const [dashStats, setDashStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [ordersByStatus, setOrdersByStatus] = useState([])

  useEffect(() => {
    loadAll()
  }, [period])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [dashRes, revRes] = await Promise.allSettled([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics(period),
      ])
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data
        setDashStats(d.stats)
        setTopProducts(d.topProducts || [])
        setOrdersByStatus(d.ordersByStatus || [])
      }
      if (revRes.status === 'fulfilled') {
        setRevenueData(revRes.value.data.data || [])
      }
    } catch(err) {
      console.error('Analytics load error:', err)
    } finally { setLoading(false) }
  }

  if (loading) return <AdminLoader text="Loading analytics…"/>

  // Build chart data — fill missing months with 0
  const chartData = MONTHS.map((month, i) => {
    const year = new Date().getFullYear()
    const key = `${year}-${String(i+1).padStart(2,'0')}`
    const found = revenueData.find(d => d._id === key || d._id?.includes(month.toLowerCase()))
    return { month, revenue: found?.revenue || 0, orders: found?.orders || 0 }
  })
  const maxRev = Math.max(...chartData.map(d => d.revenue), 1)
  const maxOrd = Math.max(...chartData.map(d => d.orders), 1)

  const totalRevenue = dashStats?.totalRevenue || chartData.reduce((s,d) => s+d.revenue, 0)
  const totalOrders  = dashStats?.totalOrders  || chartData.reduce((s,d) => s+d.orders, 0)
  const avgOrderVal  = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
  const monthRev     = dashStats?.monthRevenue || 0
  const lastMonthRev = dashStats?.lastMonthRevenue || 0
  const growth = lastMonthRev ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : 0

  // Category breakdown from status
  const cats = ['murtis','temples','furniture','decor','fountains']

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue and order insights for {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-2">
          {['daily','weekly','monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs tracking-widests uppercase border transition-all capitalize ${period===p?'bg-charcoal text-white border-charcoal':'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Total Revenue',   value: fmt(totalRevenue), change:'+23%', up:true },
          { label:'Total Orders',    value: String(totalOrders), change:'+18%', up:true },
          { label:'Avg Order Value', value: fmt(avgOrderVal), change:'+4%', up:true },
          { label:'This Month',      value: fmt(monthRev), change:growth ? `${growth > 0 ? '+' : ''}${growth}% MoM` : 'No prev data', up: growth >= 0 },
        ].map(({ label, value, change, up }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-sm p-5">
            <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-2">{label}</p>
            <p className="font-serif text-2xl text-charcoal mb-2">{value}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${up?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{change}</span>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6">
        <h2 className="font-serif text-xl text-charcoal mb-6">Revenue — {new Date().getFullYear()}</h2>
        {revenueData.length === 0 ? (
          <div className="flex items-end gap-2 h-48 opacity-20">
            {MONTHS.map((m,i) => <div key={i} className="flex-1 flex flex-col items-center"><div className="w-full bg-stone/40 rounded-t-sm" style={{height:`${30+i*8}px`}}></div><span className="text-[9px] text-gray-400 mt-1">{m}</span></div>)}
          </div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex justify-center">
                  <div className="w-full bg-gold/20 hover:bg-gold group-hover:bg-gold transition-all duration-300 rounded-t-sm cursor-pointer"
                    style={{ height: `${Math.max((d.revenue / maxRev) * 160, d.revenue > 0 ? 4 : 0)}px` }}
                    title={`${d.month}: ${fmt(d.revenue)}`}/>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {fmt(d.revenue)}
                  </div>
                </div>
                <span className="text-[9px] text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
        )}
        {revenueData.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-2">No revenue data yet. Orders will populate this chart.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders per Month */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h2 className="font-serif text-xl text-charcoal mb-6">Orders per Month</h2>
          <div className="flex items-end gap-2 h-36">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full bg-charcoal/20 hover:bg-charcoal transition-all duration-300 rounded-t-sm cursor-pointer"
                  style={{ height:`${Math.max((d.orders / maxOrd) * 120, d.orders > 0 ? 4 : 0)}px` }}
                  title={`${d.month}: ${d.orders} orders`}/>
                <span className="text-[9px] text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
          {chartData.every(d => d.orders === 0) && <p className="text-center text-gray-400 text-xs mt-2">No order data yet</p>}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h2 className="font-serif text-xl text-charcoal mb-6">Orders by Status</h2>
          {ordersByStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><p className="text-3xl mb-2">📦</p><p className="text-sm">No orders yet</p></div>
          ) : (
            <div className="space-y-4">
              {ordersByStatus.map(s => {
                const total = ordersByStatus.reduce((t, x) => t + x.count, 0)
                const pct = total ? Math.round((s.count / total) * 100) : 0
                const colors = { delivered:'bg-green-500', shipped:'bg-blue-500', processing:'bg-amber-500', pending:'bg-gray-400', cancelled:'bg-red-500', confirmed:'bg-purple-500' }
                return (
                  <div key={s._id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-charcoal capitalize">{s._id}</span>
                      <span className="text-warm/60">{s.count} orders · {pct}%</span>
                    </div>
                    <div className="h-2 bg-stone rounded-full overflow-hidden">
                      <div className={`h-full ${colors[s._id]||'bg-gold'} rounded-full transition-all`} style={{width:`${pct}%`}}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-xl text-charcoal">Top Performing Products</h2>
        </div>
        {topProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🏺</p>
            <p className="text-sm">No product sales data yet. Top products will appear here after orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Rank','Product','Category','Units Sold','Revenue','Rating'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] tracking-widests uppercase text-gray-400 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((p, i) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-serif text-2xl text-gray-300">{i+1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-stone to-cream overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-base opacity-30">🏺</span>}
                        </div>
                        <span className="text-sm font-medium text-charcoal">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-[10px] tracking-widests uppercase text-gold bg-gold/10 px-2 py-0.5">{p.category}</span></td>
                    <td className="px-5 py-3 text-sm text-warm/70">{p.totalSold || 0}</td>
                    <td className="px-5 py-3 text-sm font-medium text-charcoal">{fmt((p.salePrice || p.price) * (p.totalSold || 0))}</td>
                    <td className="px-5 py-3 text-sm text-gold">{'★'.repeat(Math.round(p.rating||4))} <span className="text-warm/40">{p.rating?.toFixed(1)||'—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
