import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentBilties, setRecentBilties] = useState([])
  const [topParties, setTopParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(u)
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)

      // Parallel requests — fast
      const [statsRes, biltiesRes, partiesRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.recentBilties(),
        dashboardAPI.topParties()
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      } else {
        toast.error('Failed to load stats')
      }

      if (biltiesRes.status === 'fulfilled') {
        setRecentBilties(biltiesRes.value.data || [])
      }

      if (partiesRes.status === 'fulfilled') {
        setTopParties(partiesRes.value.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-700 font-bold text-sm">BTC</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">BHARAT TRANSPORT COMPANY</h1>
              <p className="text-xs text-red-200">Transport Management Software</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
              <p className="text-xs text-red-200">
                {user?.role === 'admin' ? 'Head Office' : user?.branch_code}
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-white text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ============================================ */}
        {/* STATS CARDS (8 cards) */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Today LR"
            value={stats?.today_lr || 0}
            color="blue"
            icon="📦"
          />
          <StatCard
            title="Today Bills"
            value={stats?.today_bills || 0}
            color="green"
            icon="📄"
          />
          <StatCard
            title="Today Revenue"
            value={`₹${(stats?.today_revenue || 0).toLocaleString('en-IN')}`}
            color="red"
            icon="💰"
          />
          <StatCard
            title="This Month Revenue"
            value={`₹${(stats?.this_month_revenue || 0).toLocaleString('en-IN')}`}
            color="purple"
            icon="📈"
          />
          <StatCard
            title="Pending LR"
            value={stats?.pending_lr || 0}
            color="orange"
            icon="⏳"
          />
          <StatCard
            title="Total Outstanding"
            value={`₹${(stats?.total_outstanding || 0).toLocaleString('en-IN')}`}
            color="yellow"
            icon="⚠️"
          />
          <StatCard
            title="Branches"
            value={stats?.total_branches || 0}
            color="indigo"
            icon="🏢"
          />
          <StatCard
            title="Customers"
            value={stats?.total_customers || 0}
            color="pink"
            icon="👥"
          />
        </div>

        {/* ============================================ */}
        {/* QUICK ACTIONS */}
        {/* ============================================ */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionCard
              to="/bilty/new"
              title="🚛 New Bilty"
              desc="Create new LR/Bilty"
              color="bg-red-600"
            />
            <ActionCard
              to="/bill/new"
              title="📄 New Bill"
              desc="Create bill/invoice"
              color="bg-blue-600"
            />
            <ActionCard
              to="/bilty"
              title="📋 Bilty List"
              desc="View all bilties"
              color="bg-green-600"
            />
            <ActionCard
              to="/bills"
              title="💰 Bill List"
              desc="View all bills"
              color="bg-purple-600"
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* RECENT BILTIES + TOP PARTIES */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Bilties */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Recent Bilties</h2>
              <Link to="/bilty" className="text-sm text-red-600 hover:underline">
                View All →
              </Link>
            </div>
            <div className="p-4">
              {recentBilties.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No bilties yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBilties.map((b) => (
                    <Link
                      key={b.id}
                      to={`/bilty/print/${b.lr_no}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">
                          {b.lr_no}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {b.consignor_name} → {b.consignee_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.from_name} → {b.to_name}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-sm text-gray-800">
                          ₹{parseFloat(b.grand_total || 0).toLocaleString('en-IN')}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>
                          {b.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Parties */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Top 5 Parties</h2>
              <Link to="/party" className="text-sm text-red-600 hover:underline">
                View All →
              </Link>
            </div>
            <div className="p-4">
              {topParties.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topParties.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {p.party_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.bill_count} bills
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-gray-800">
                        ₹{parseFloat(p.total_amount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function StatCard({ title, value, color, icon }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500'
  }
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-2 h-8 ${colors[color]} rounded`}></div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function ActionCard({ to, title, desc, color }) {
  return (
    <Link
      to={to}
      className={`${color} text-white rounded-lg shadow p-4 hover:opacity-90 transition block`}
    >
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-xs opacity-90">{desc}</p>
    </Link>
  )
}

// ============================================
// STATUS COLOR HELPER
// ============================================
function getStatusColor(status) {
  const colors = {
    Booked: 'bg-blue-100 text-blue-700',
    'In-Transit': 'bg-yellow-100 text-yellow-700',
    Reached: 'bg-purple-100 text-purple-700',
    'Out for Delivery': 'bg-orange-100 text-orange-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    RTO: 'bg-gray-100 text-gray-700'
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}
