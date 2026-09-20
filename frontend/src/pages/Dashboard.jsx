import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(u)
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await api.get('/api/reports/dashboard')
      setStats(res.data)
    } catch (err) {
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
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
            <div className="text-right">
              <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
              <p className="text-xs text-red-200">{user?.role === 'admin' ? 'Head Office' : user?.branch_code}</p>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard title="Today LR" value={stats?.today_lr || 0} color="blue" />
          <StatCard title="Today Bills" value={stats?.today_bills || 0} color="green" />
          <StatCard title="Branches" value={stats?.total_branches || 0} color="purple" />
          <StatCard title="Customers" value={stats?.total_customers || 0} color="orange" />
          <StatCard title="Today Revenue" value={`₹${(stats?.today_revenue || 0).toLocaleString('en-IN')}`} color="red" />
          <StatCard title="Pending" value={`₹${(stats?.pending_payments || 0).toLocaleString('en-IN')}`} color="yellow" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard to="/bill/new" title="📄 New Bill" desc="Create new bill/invoice" color="bg-red-600" />
          <ActionCard to="/bills" title="📋 Bill List" desc="View all bills" color="bg-green-600" />
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, color }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  }
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`w-2 h-8 ${colors[color]} rounded mb-2`}></div>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function ActionCard({ to, title, desc, color }) {
  return (
    <Link to={to} className={`${color} text-white rounded-lg shadow p-6 hover:opacity-90 transition block`}>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{desc}</p>
    </Link>
  )
}
