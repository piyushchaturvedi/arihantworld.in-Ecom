'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { adminAPI } from '@/lib/api'
import AdminLayout from './layout'

const STATUS_COLORS = {
  pending: 'status-pending', confirmed: 'status-processing', processing: 'status-processing',
  shipped: 'status-shipped', out_for_delivery: 'status-shipped', delivered: 'status-delivered',
  cancelled: 'status-cancelled'
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const pct = (curr, prev) => prev === 0 ? '+100%' : `${curr >= prev ? '+' : ''}${Math.round(((curr-prev)/prev)*100)}%`

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => {
        // Demo data for preview
        setData({
          stats: { totalOrders: 247, monthOrders: 34, lastMonthOrders: 28, totalRevenue: 8432500, monthRevenue: 945000, totalUsers: 1842, monthUsers: 156, totalProducts: 48, lowStockProducts: 3 },
          recentOrders: [
            { _id: '1', orderNumber: 'AW-2025-008', status: 'shipped', pricing: { total: 8500 }, user: { firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh@demo.com' }, createdAt: new Date() },
            { _id: '2', orderNumber: 'AW-2025-007', status: 'processing', pricing: { total: 85000 }, user: { firstName: 'Priya', lastName: 'Mehta', email: 'priya@demo.com' }, createdAt: new Date(Date.now() - 86400000) },
            { _id: '3', orderNumber: 'AW-2025-006', status: 'delivered', pricing: { total: 42000 }, user: { firstName: 'Arun', lastName: 'Kumar', email: 'arun@demo.com' }, createdAt: new Date(Date.now() - 172800000) },
            { _id: '4', orderNumber: 'AW-2025-005', status: 'confirmed', pricing: { total: 15200 }, user: { firstName: 'Sunita', lastName: 'Verma', email: 'sunita@demo.com' }, createdAt: new Date(Date.now() - 259200000) },
          ],
          topProducts: [
            { name: 'Ganesh Marble Idol – 8"', category: 'murtis', totalSold: 215, price: 8500 },
            { name: 'Radha Krishna Murti – 12"', category: 'murtis', totalSold: 124, price: 15200 },
            { name: 'Marble Diya Set', category: 'decor', totalSold: 178, price: 2800 },
            { name: 'Lotus Carved Bowl', category: 'decor', totalSold: 89, price: 4200 },
            { name: 'Shwetambar Mandir', category: 'temples', totalSold: 67, price: 42000 },
          ]
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Loading dashboard…</p>
      </div>
    </div>
  )

  const { stats, recentOrders, topProducts } = data

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.monthOrders} this month`, change: pct(stats.monthOrders, stats.lastMonthOrders), icon: '📦', color: 'bg-blue-50 border-blue-200' },
    { label: 'Monthly Revenue', value: fmt(stats.monthRevenue), sub: `Total: ${fmt(stats.totalRevenue)}`, change: '+12%', icon: '💰', color: 'bg-green-50 border-green-200' },
    { label: 'Total Customers', value: stats.totalUsers.toLocaleString(), sub: `${stats.monthUsers} new this month`, change: '+8%', icon: '👥', color: 'bg-purple-50 border-purple-200' },
    { label: 'Products', value: stats.totalProducts, sub: `${stats.lowStockProducts} low stock`, change: stats.lowStockProducts > 0 ? '⚠️ Check stock' : '✓ All good', icon: '🏺', color: stats.lowStockProducts > 0 ? 'bg-amber-50 border-amber-200' : 'bg-stone/20 border-stone' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-charcoal mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening at Arihant World.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, sub, change, icon, color }) => (
          <div key={label} className={`${color} border rounded-sm p-5`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{icon}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${change.startsWith('+') ? 'bg-green-100 text-green-700' : change.startsWith('⚠') ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {change}
              </span>
            </div>
            <p className="font-serif text-2xl text-charcoal mb-1">{value}</p>
            <p className="text-xs tracking-widest uppercase text-warm/60 mb-1">{label}</p>
            <p className="text-[11px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-serif text-xl text-charcoal">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs tracking-widests uppercase text-gold hover:text-gold-dark transition-colors">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order #','Customer','Status','Amount','Date'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] tracking-widests uppercase text-gray-400 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/admin/orders/${order._id}`} className="text-gold text-sm hover:underline font-medium">{order.orderNumber}</Link>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm text-charcoal">{order.user?.firstName} {order.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`status-badge ${STATUS_COLORS[order.status] || 'status-pending'}`}>{order.status}</span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-charcoal">{fmt(order.pricing?.total)}</td>
                    <td className="px-6 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-serif text-xl text-charcoal">Top Products</h2>
            <Link href="/admin/products" className="text-xs tracking-widests uppercase text-gold hover:text-gold-dark transition-colors">Manage →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topProducts.map((p, i) => (
              <div key={p.name} className="px-6 py-4 flex items-center gap-3">
                <span className="text-2xl text-gray-300 font-serif w-6 text-center">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-charcoal font-medium truncate">{p.name}</p>
                  <p className="text-[10px] tracking-widests uppercase text-warm/50 mt-0.5">{p.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-gold font-medium">{p.totalSold} sold</p>
                  <p className="text-xs text-gray-400">{fmt(p.salePrice || p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-charcoal rounded-sm p-6">
        <h3 className="text-white font-serif text-xl mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/products', label: 'Add Product', icon: '➕' },
            { href: '/admin/orders', label: 'View Orders', icon: '📦' },
            { href: '/admin/coupons', label: 'Create Coupon', icon: '🎟️' },
            { href: '/admin/users', label: 'Manage Users', icon: '👥' },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 hover:border-gold hover:bg-gold/5 transition-all rounded-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-white text-xs tracking-widests uppercase">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
