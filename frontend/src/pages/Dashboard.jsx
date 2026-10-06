import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    today_lr: 0, today_bills: 0, total_customers: 0, pending_lr: 0,
    month_revenue: 0, pending_payments: 0, pod_pending: 0, broker_pending: 0
  })
  const [recentBilties, setRecentBilties] = useState([])
  const [pendingBills, setPendingBills] = useState([])
  const [brokerReport, setBrokerReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin"}')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      if (!token) { navigate('/login'); return }

      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      // Fetch all data in parallel
      const [statsRes, consignmentsRes] = await Promise.all([
        fetch(`${apiUrl}/api/dashboard/stats`, { headers }),
        fetch(`${apiUrl}/api/consignments`, { headers })
      ])

      if (statsRes.status === 401) { localStorage.removeItem('token'); navigate('/login'); return }

      const statsData = await statsRes.json()
      const consignmentsData = await consignmentsRes.json()
      const allBilties = consignmentsData.data || []

      // Calculate advanced stats
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = today.substring(0, 7)

      const todayBilties = allBilties.filter(b => b.lr_date === today)
      const monthBilties = allBilties.filter(b => b.lr_date && b.lr_date.startsWith(thisMonth))
      const pendingLRs = allBilties.filter(b => b.status === 'Booked' || b.status === 'In-Transit')
      const podPending = allBilties.filter(b => b.status === 'In-Transit')
      const delivered = allBilties.filter(b => b.status === 'Delivered')

      const monthRevenue = monthBilties.reduce((sum, b) => sum + parseFloat(b.grand_total || 0), 0)
      const pendingPayments = pendingLRs.reduce((sum, b) => sum + parseFloat(b.grand_total || 0), 0)

      // Broker-wise report
      const brokerMap = {}
      allBilties.forEach(b => {
        const broker = b.broker_name || 'Direct'
        if (!brokerMap[broker]) brokerMap[broker] = { count: 0, total: 0, pending: 0 }
        brokerMap[broker].count++
        brokerMap[broker].total += parseFloat(b.grand_total || 0)
        if (b.status !== 'Delivered') brokerMap[broker].pending += parseFloat(b.grand_total || 0)
      })
      const brokerList = Object.entries(brokerMap).map(([name, data]) => ({ name, ...data }))

      setStats({
        today_lr: statsData.today_lr || todayBilties.length,
        today_bills: statsData.today_bills || 0,
        total_customers: statsData.total_customers || 0,
        pending_lr: statsData.pending_lr || pendingLRs.length,
        month_revenue: monthRevenue,
        pending_payments: pendingPayments,
        pod_pending: podPending.length,
        total_bilties: allBilties.length
      })

      setRecentBilties(allBilties.slice(0, 5))
      setPendingBills(pendingLRs.slice(0, 5))
      setBrokerReport(brokerList.slice(0, 5))
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Dashboard load नहीं हो पाया')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, onClick, subtitle }) => (
    <div onClick={onClick} className={`bg-gradient-to-br ${color} rounded-2xl p-5 shadow-lg cursor-pointer hover:scale-105 transition-transform relative overflow-hidden`}>
      <div className="absolute top-0 right-0 text-6xl opacity-10">{icon}</div>
      <div className="relative">
        <p className="text-white/80 text-xs font-medium uppercase">{title}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white text-red-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">BTC</div>
            <div>
              <h1 className="font-bold text-lg">Bharat Transport Company</h1>
              <p className="text-xs text-red-200">Transport Management Software</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm"> {user.username}</span>
            <button onClick={handleLogout} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm hover:bg-red-50">Logout</button>
          </div>
        </div>
      </nav>

      {/* Sub Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: ' Overview', route: '/' },
            { id: 'bilties', label: '📝 Bilties', route: '/consignments' },
            { id: 'bills', label: '💰 Bills', route: '/bills' },
            { id: 'customers', label: '👥 Customers', route: '/customers' },
            { id: 'gatepass', label: '🎫 Gate Pass', route: '/gate-pass' },
            { id: 'gadi', label: '🚛 Gadi Challan', route: '/gadi-challan' },
            { id: 'reports', label: '📈 Reports', route: '/reports' },
            { id: 'track', label: '🔍 Track', route: '/track' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap hover:bg-red-50 hover:text-red-700 border-b-2 border-transparent hover:border-red-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back, {user.username}! 👋</h1>
          <p className="text-gray-500">Here's what's happening with your business today</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span>❌ {error}</span>
            <button onClick={fetchAllData} className="bg-red-700 text-white px-4 py-1 rounded">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
            <p className="mt-4 text-gray-500">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Today LR" value={stats.today_lr} icon="📝" color="from-blue-600 to-blue-800" onClick={() => navigate('/consignments/new')} />
              <StatCard title="Today Bills" value={stats.today_bills} icon="" color="from-green-600 to-green-800" onClick={() => navigate('/bills')} />
              <StatCard title="Month Revenue" value={`₹${stats.month_revenue.toLocaleString('en-IN')}`} icon="" color="from-purple-600 to-purple-800" subtitle="This Month" />
              <StatCard title="Total Bilties" value={stats.total_bilties} icon="📋" color="from-indigo-600 to-indigo-800" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Pending LR" value={stats.pending_lr} icon="" color="from-orange-500 to-orange-700" subtitle="Booked/In-Transit" />
              <StatCard title="Pending Payment" value={`₹${stats.pending_payments.toLocaleString('en-IN')}`} icon="💸" color="from-red-600 to-red-800" subtitle="Outstanding" />
              <StatCard title="POD Pending" value={stats.pod_pending} icon="📦" color="from-yellow-500 to-yellow-700" subtitle="In-Transit" />
              <StatCard title="Customers" value={stats.total_customers} icon="👥" color="from-pink-600 to-pink-800" onClick={() => navigate('/customers')} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => navigate('/consignments/new')} className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 p-4 rounded-lg text-center transition">
                  <div className="text-3xl mb-1"></div>
                  <div className="font-bold text-blue-700">New Bilty</div>
                </button>
                <button onClick={() => navigate('/gate-pass')} className="bg-green-50 hover:bg-green-100 border-2 border-green-200 p-4 rounded-lg text-center transition">
                  <div className="text-3xl mb-1">🎫</div>
                  <div className="font-bold text-green-700">Gate Pass</div>
                </button>
                <button onClick={() => navigate('/gadi-challan')} className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 p-4 rounded-lg text-center transition">
                  <div className="text-3xl mb-1">🚛</div>
                  <div className="font-bold text-purple-700">Gadi Challan</div>
                </button>
                <button onClick={() => navigate('/reports')} className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 p-4 rounded-lg text-center transition">
                  <div className="text-3xl mb-1">📊</div>
                  <div className="font-bold text-orange-700">Reports</div>
                </button>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Recent Bilties */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">📋 Recent Bilties</h3>
                  <button onClick={() => navigate('/consignments')} className="text-red-700 text-sm font-bold">View All →</button>
                </div>
                {recentBilties.length === 0 ? (
                  <p className="text-gray-400 text-sm">No bilties yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentBilties.map(b => (
                      <div key={b.id} className="border-l-4 border-red-500 bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-bold text-red-700">{b.lr_no}</span>
                          <span className={`text-xs px-2 py-1 rounded ${b.status === 'Delivered' ? 'bg-green-100 text-green-700' : b.status === 'In-Transit' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{b.status}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{b.from_name} → {b.to_name}</div>
                        <div className="text-xs text-gray-500">₹{parseFloat(b.grand_total || 0).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Payments */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">💸 Pending Payments</h3>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">{pendingBills.length}</span>
                </div>
                {pendingBills.length === 0 ? (
                  <p className="text-gray-400 text-sm">All clear! 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {pendingBills.map(b => (
                      <div key={b.id} className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-800">{b.lr_no}</span>
                          <span className="text-orange-700 font-bold">₹{parseFloat(b.grand_total || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-600">{b.consignor_name}</div>
                        <div className="text-xs text-gray-500">{b.lr_date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Broker-wise Report */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">🤝 Broker Report</h3>
                  <button onClick={() => navigate('/reports')} className="text-red-700 text-sm font-bold">Details →</button>
                </div>
                {brokerReport.length === 0 ? (
                  <p className="text-gray-400 text-sm">No data</p>
                ) : (
                  <div className="space-y-2">
                    {brokerReport.map((b, i) => (
                      <div key={i} className="border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-800">{b.name}</span>
                          <span className="text-gray-600">{b.count} LR</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">{b.total.toLocaleString('en-IN')}</span>
                          <span className="text-red-600">Pending: ₹{b.pending.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
