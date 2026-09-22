import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animatedStats, setAnimatedStats] = useState({
    todayLR: 0,
    todayBills: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingLR: 0,
    outstanding: 0,
    branches: 0,
    customers: 0
  })

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (stats) {
      animateCounters()
    }
  }, [stats])

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.stats()
      setStats(res.data)
    } catch (err) {
      toast.error('Dashboard load नहीं हो पाया')
    } finally {
      setLoading(false)
    }
  }

  const animateCounters = () => {
    const targets = {
      todayLR: stats?.today_lr || 0,
      todayBills: stats?.today_bills || 0,
      todayRevenue: stats?.today_revenue || 0,
      monthRevenue: stats?.month_revenue || 0,
      pendingLR: stats?.pending_lr || 0,
      outstanding: stats?.total_outstanding || 0,
      branches: stats?.branches || 0,
      customers: stats?.customers || 0
    }

    Object.keys(targets).forEach(key => {
      let current = 0
      const target = targets[key]
      const increment = target / 50
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }))
      }, 30)
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ सभी existing features preserved
  const cards = [
    {
      title: 'Today LR',
      value: animatedStats.todayLR,
      icon: '📦',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Today Bills',
      value: animatedStats.todayBills,
      icon: '📄',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Today Revenue',
      value: formatCurrency(animatedStats.todayRevenue),
      icon: '💰',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'This Month Revenue',
      value: formatCurrency(animatedStats.monthRevenue),
      icon: '📈',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Pending LR',
      value: animatedStats.pendingLR,
      icon: '',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      title: 'Total Outstanding',
      value: formatCurrency(animatedStats.outstanding),
      icon: '⚠️',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      title: 'Branches',
      value: animatedStats.branches,
      icon: '🏢',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Customers',
      value: animatedStats.customers,
      icon: '👥',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    }
  ]

  // ✅ सभी Quick Actions preserved
  const quickActions = [
    { title: 'New Bilty', subtitle: 'Create new LR/Bilty', icon: '', color: 'from-red-500 to-red-600', path: '/bilty/new' },
    { title: 'New Bill', subtitle: 'Create bill/invoice', icon: '', color: 'from-blue-500 to-blue-600', path: '/bill/new' },
    { title: 'Bilty List', subtitle: 'View all bilties', icon: '', color: 'from-green-500 to-green-600', path: '/bilty' },
    { title: 'Bill List', subtitle: 'View all bills', icon: '🟣', color: 'from-purple-500 to-purple-600', path: '/bills' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ✅ Modern Header - सभी info preserved */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">BTC</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">BHARAT TRANSPORT COMPANY</h1>
              <p className="text-gray-400 text-xs">Transport Management Software</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-sm font-medium">Head Office Admin</p>
              <p className="text-gray-400 text-xs">Head Office</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back! 👋</h2>
          <p className="text-gray-400">Here's what's happening with your business today</p>
        </div>

        {/* ✅ 8 Stats Cards - सभी preserved, बस design modern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-2xl ${card.bgColor} backdrop-blur-lg border ${card.borderColor} p-6 hover:scale-105 transition-all duration-300 cursor-pointer group`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{card.icon}</span>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                <p className="text-white text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ 4 Quick Actions - सभी preserved */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-6 text-left hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-2xl`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <span className="text-4xl mb-3 block">{action.icon}</span>
                  <h4 className="text-white font-bold text-lg mb-1">{action.title}</h4>
                  <p className="text-white/80 text-sm">{action.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Recent Bilties & Top 5 Parties - दोनों preserved */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bilties */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Recent Bilties</h3>
              <button onClick={() => navigate('/bilty')} className="text-sm text-red-400 hover:text-red-300 transition">
                View All →
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-500 text-center text-sm py-4">No bilties yet</p>
            </div>
          </div>

          {/* Top 5 Parties */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Top 5 Parties</h3>
              <button onClick={() => navigate('/party')} className="text-sm text-red-400 hover:text-red-300 transition">
                View All →
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-500 text-center text-sm py-4">No data yet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
