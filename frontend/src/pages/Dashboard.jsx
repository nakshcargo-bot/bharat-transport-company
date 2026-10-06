import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    today_lr: 0,
    today_bills: 0,
    total_customers: 0,
    pending_lr: 0,
    today_revenue: 0,
    month_revenue: 0,
    total_outstanding: 0,
    branches: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      
      // अगर token नहीं है तो login page पर भेजें
      if (!token) {
        navigate('/login')
        return
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      // Dashboard stats fetch करें
      const response = await fetch(`${apiUrl}/api/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        // Token expire हो गया - logout करें
        localStorage.removeItem('token')
        navigate('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()
      
      // Revenue calculate करें (अगर API से नहीं आ रहा)
      let todayRevenue = 0
      let monthRevenue = 0
      let totalOutstanding = 0
      
      // अगर API revenue दे रहा है तो use करें
      if (data.today_revenue !== undefined) todayRevenue = data.today_revenue
      if (data.month_revenue !== undefined) monthRevenue = data.month_revenue
      if (data.total_outstanding !== undefined) totalOutstanding = data.total_outstanding

      setStats({
        today_lr: data.today_lr || 0,
        today_bills: data.today_bills || 0,
        total_customers: data.total_customers || 0,
        pending_lr: data.pending_lr || 0,
        today_revenue: todayRevenue,
        month_revenue: monthRevenue,
        total_outstanding: totalOutstanding,
        branches: data.branches || 1
      })
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Dashboard load नहीं हो पाया')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">Welcome Back! 👋</h1>
            <p className="text-white/70 mt-2">Here's what's happening with your business today</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              navigate('/login')
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-500 text-white p-4 rounded-lg flex items-center gap-2">
            <span>❌</span>
            <span>{error}</span>
            <button 
              onClick={fetchDashboardStats}
              className="ml-auto bg-white text-red-500 px-4 py-1 rounded font-bold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today LR"
          value={stats.today_lr}
          icon=""
          color="from-blue-600 to-blue-800"
          onClick={() => navigate('/consignments')}
        />
        <StatCard
          title="Today Bills"
          value={stats.today_bills}
          icon="📄"
          color="from-green-600 to-green-800"
          onClick={() => navigate('/bills')}
        />
        <StatCard
          title="Today Revenue"
          value={`₹${stats.today_revenue}`}
          icon="💰"
          color="from-yellow-600 to-yellow-800"
        />
        <StatCard
          title="This Month Revenue"
          value={`₹${stats.month_revenue}`}
          icon="📈"
          color="from-purple-600 to-purple-800"
        />
        <StatCard
          title="Pending LR"
          value={stats.pending_lr}
          icon="⏳"
          color="from-orange-600 to-orange-800"
          onClick={() => navigate('/consignments')}
        />
        <StatCard
          title="Total Outstanding"
          value={`₹${stats.total_outstanding}`}
          icon="⚠️"
          color="from-red-600 to-red-800"
        />
        <StatCard
          title="Branches"
          value={stats.branches}
          icon="🏢"
          color="from-indigo-600 to-indigo-800"
        />
        <StatCard
          title="Customers"
          value={stats.total_customers}
          icon="👥"
          color="from-pink-600 to-pink-800"
          onClick={() => navigate('/customers')}
        />
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto mt-10">
        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/consignments/new')}
            className="bg-white/10 backdrop-blur text-white p-4 rounded-xl hover:bg-white/20 transition"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-bold">New Bilty</div>
          </button>
          <button
            onClick={() => navigate('/gate-pass')}
            className="bg-white/10 backdrop-blur text-white p-4 rounded-xl hover:bg-white/20 transition"
          >
            <div className="text-3xl mb-2">🎫</div>
            <div className="font-bold">Gate Pass</div>
          </button>
          <button
            onClick={() => navigate('/gadi-challan')}
            className="bg-white/10 backdrop-blur text-white p-4 rounded-xl hover:bg-white/20 transition"
          >
            <div className="text-3xl mb-2">🚛</div>
            <div className="font-bold">Gadi Challan</div>
          </button>
          <button
            onClick={() => navigate('/customers/new')}
            className="bg-white/10 backdrop-blur text-white p-4 rounded-xl hover:bg-white/20 transition"
          >
            <div className="text-3xl mb-2"></div>
            <div className="font-bold">New Customer</div>
          </button>
        </div>
      </div>
    </div>
  )
}
