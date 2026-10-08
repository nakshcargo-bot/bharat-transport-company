import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    today_lr: 0, month_lr: 0, total_lr: 0, pending_lr: 0, paid_lr: 0,
    total_bills: 0, pending_bills: 0, total_mr: 0, total_parties: 0,
    total_revenue: 0, pending_amount: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentBilties, setRecentBilties] = useState([])

  const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin"}')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      const [statsRes, biltiesRes] = await Promise.all([
        fetch(`${apiUrl}/api/dashboard/stats`, { headers }),
        fetch(`${apiUrl}/api/consignments`, { headers })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (biltiesRes.ok) {
        const biltiesData = await biltiesRes.json()
        setRecentBilties((biltiesData.data || []).slice(0, 5))
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount || 0).toLocaleString('en-IN')
  }

  const modules = [
    { id: 'bilty', label: 'Bilty / LR', icon: '📝', color: 'from-blue-600 to-blue-800', route: '/consignments', desc: 'Create & Manage Bilties' },
    { id: 'bill', label: 'Billing', icon: '💰', color: 'from-green-600 to-green-800', route: '/bills', desc: 'Bills & Invoices' },
    { id: 'mr', label: 'Money Receipt', icon: '🧾', color: 'from-purple-600 to-purple-800', route: '/mr', desc: 'Payment Receipts' },
    { id: 'customers', label: 'Parties', icon: '👥', color: 'from-pink-600 to-pink-800', route: '/customers', desc: 'Customer Master' },
    { id: 'gatepass', label: 'Gate Pass', icon: '🎫', color: 'from-indigo-600 to-indigo-800', route: '/gate-pass', desc: 'Gate Pass Issue' },
    { id: 'gadi', label: 'Gadi Challan', icon: '', color: 'from-orange-600 to-orange-800', route: '/gadi-challan', desc: 'Broker Settlement' },
    { id: 'reports', label: 'Reports', icon: '📊', color: 'from-teal-600 to-teal-800', route: '/reports', desc: 'All Reports' },
    { id: 'audit', label: 'Audit Log', icon: '🔍', color: 'from-gray-600 to-gray-800', route: '/audit', desc: 'Activity Tracker' },
    { id: 'track', label: 'Track Bilty', icon: '', color: 'from-cyan-600 to-cyan-800', route: '/track', desc: 'Public Tracking' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white text-red-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow">BTC</div>
            <div>
              <h1 className="font-bold text-xl">Bharat Transport Company</h1>
              <p className="text-xs text-red-200">Professional Transport Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm">Welcome, <b>{user.username}</b></div>
              <div className="text-xs text-red-200">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <button onClick={handleLogout} className="bg-white text-red-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 shadow">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
            <p className="mt-4 text-gray-500">Loading Dashboard...</p>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="mb-6 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-6 text-white shadow-lg">
              <h1 className="text-3xl font-bold">Welcome Back, {user.username}! </h1>
              <p className="text-red-100 mt-1">Here's your business overview for today</p>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 shadow-lg text-white">
                <div className="text-blue-100 text-xs font-medium uppercase">Today's LR</div>
                <div className="text-white text-3xl font-bold mt-1">{stats.today_lr}</div>
                <div className="text-blue-200 text-xs mt-1">Total: {stats.total_lr}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-5 shadow-lg text-white">
                <div className="text-green-100 text-xs font-medium uppercase">Revenue Collected</div>
                <div className="text-white text-2xl font-bold mt-1">{formatCurrency(stats.total_revenue)}</div>
                <div className="text-green-200 text-xs mt-1">Paid Bilties: {stats.paid_lr}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5 shadow-lg text-white">
                <div className="text-orange-100 text-xs font-medium uppercase">Pending Amount</div>
                <div className="text-white text-2xl font-bold mt-1">{formatCurrency(stats.pending_amount)}</div>
                <div className="text-orange-200 text-xs mt-1">Pending LR: {stats.pending_lr}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 shadow-lg text-white">
                <div className="text-purple-100 text-xs font-medium uppercase">Money Receipts</div>
                <div className="text-white text-3xl font-bold mt-1">{stats.total_mr}</div>
                <div className="text-purple-200 text-xs mt-1">Parties: {stats.total_parties}</div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
                <div className="text-gray-500 text-xs font-medium uppercase">This Month LR</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{stats.month_lr}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
                <div className="text-gray-500 text-xs font-medium uppercase">Total Bills</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total_bills}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
                <div className="text-gray-500 text-xs font-medium uppercase">Pending Bills</div>
                <div className="text-2xl font-bold text-red-600 mt-1">{stats.pending_bills}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
                <div className="text-gray-500 text-xs font-medium uppercase">Active Customers</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total_customers || 0}</div>
              </div>
            </div>

            {/* All Modules Grid */}
            <h2 className="text-xl font-bold text-gray-800 mb-4"> All Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {modules.map(m => (
                <div
                  key={m.id}
                  onClick={() => navigate(m.route)}
                  className={`bg-gradient-to-br ${m.color} rounded-2xl p-5 shadow-lg cursor-pointer hover:scale-105 transition-transform text-white relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 text-6xl opacity-20">{m.icon}</div>
                  <div className="relative">
                    <div className="text-3xl mb-2">{m.icon}</div>
                    <div className="font-bold text-lg">{m.label}</div>
                    <div className="text-xs text-white/80 mt-1">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Bilties */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">📋 Recent Bilties</h3>
                <button onClick={() => navigate('/consignments')} className="text-red-700 text-sm font-bold hover:underline">View All →</button>
              </div>
              {recentBilties.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No bilties yet. Create your first bilty!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-xs font-bold text-gray-600">LR No</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-600">Date</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-600">Consignor</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-600">To</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-600">Amount</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBilties.map(b => (
                        <tr key={b.id} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-bold text-red-700">{b.lr_no}</td>
                          <td className="p-3 text-sm">{b.lr_date}</td>
                          <td className="p-3 text-sm">{b.consignor_name}</td>
                          <td className="p-3 text-sm">{b.to_name}</td>
                          <td className="p-3 font-bold">₹{parseFloat(b.grand_total || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            {b.payment_status === 'Paid' ? (
                              <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">✅ PAID</span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">⏳ PENDING</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
