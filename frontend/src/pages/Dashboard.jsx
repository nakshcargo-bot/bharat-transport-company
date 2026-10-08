import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [topParties, setTopParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      const [resStats, resRecent, resParties] = await Promise.all([
        fetch(`${apiUrl}/api/dashboard/stats`, { headers }),
        fetch(`${apiUrl}/api/dashboard/recent`, { headers }),
        fetch(`${apiUrl}/api/dashboard/top-parties`, { headers })
      ])

      if (resStats.ok) {
        const data = await resStats.json()
        setStats(data)
      } else {
        const err = await resStats.json()
        setError('Stats load failed: ' + (err.error || 'Unknown error'))
      }

      if (resRecent.ok) setRecent(await resRecent.json())
      if (resParties.ok) {
        const data = await resParties.json()
        setTopParties(data.data || [])
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  const quickActions = [
    { icon: '📝', label: 'New Bilty', color: 'from-blue-500 to-blue-700', path: '/consignments/new' },
    { icon: '💰', label: 'Money Receipt', color: 'from-green-500 to-green-700', path: '/mr/create' },
    { icon: '🚛', label: 'Gadi Challan', color: 'from-purple-500 to-purple-700', path: '/gadi-challan' },
    { icon: '📄', label: 'E-Way Bill', color: 'from-indigo-500 to-indigo-700', path: '/eway' },
    { icon: '📦', label: 'Manifest', color: 'from-orange-500 to-orange-700', path: '/transit' },
    { icon: '👥', label: 'Users', color: 'from-pink-500 to-pink-700', path: '/users', adminOnly: true }
  ].filter(a => !a.adminOnly || isAdmin)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-700 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome Back, {user.username || 'Admin'}! 👋</h1>
              <p className="text-red-200 mt-1">
                {isAdmin ? 'Your business overview across all branches' : `Branch: ${user.branch_code || 'N/A'} | ${user.branch_name || ''}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-red-200 text-sm">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow ${user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            👤 {user.role === 'admin' ? 'Administrator' : user.role} {isAdmin && '(Full Access)'}
          </span>
          {stats?.user_branch && <span className="px-4 py-2 rounded-full text-sm font-bold bg-white text-gray-700 shadow">🏢 Branch: {stats.user_branch}</span>}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div><p className="font-bold text-red-800">⚠️ {error}</p><p className="text-sm text-red-600">Please check backend logs or try again.</p></div>
              <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">🔄 Retry</button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, idx) => (
              <button key={idx} onClick={() => navigate(action.path)} className={`bg-gradient-to-br ${action.color} text-white p-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all`}>
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="font-bold text-sm">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-xl">
                <div className="text-blue-100 text-sm font-medium">TODAY'S LR</div>
                <div className="text-4xl font-bold mt-2">{stats.today_lr}</div>
                <div className="text-blue-200 text-xs mt-2">Total: {stats.total_lr} | Month: {stats.month_lr}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-6 shadow-xl">
                <div className="text-green-100 text-sm font-medium">TODAY'S REVENUE</div>
                <div className="text-3xl font-bold mt-2">{formatCurrency(stats.today_revenue)}</div>
                <div className="text-green-200 text-xs mt-2">Month: {formatCurrency(stats.month_revenue)}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-xl">
                <div className="text-orange-100 text-sm font-medium">PENDING AMOUNT</div>
                <div className="text-3xl font-bold mt-2">{formatCurrency(stats.pending_amount)}</div>
                <div className="text-orange-200 text-xs mt-2">Pending LR: {stats.pending_lr}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-6 shadow-xl">
                <div className="text-purple-100 text-sm font-medium">TOTAL REVENUE</div>
                <div className="text-3xl font-bold mt-2">{formatCurrency(stats.total_revenue)}</div>
                <div className="text-purple-200 text-xs mt-2">Paid Bilties: {stats.paid_lr}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">BILLS</div><div className="text-2xl font-bold text-gray-800 mt-1">{stats.total_bills}</div><div className="text-xs text-red-600 mt-1">Pending: {stats.pending_bills}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">MONEY RECEIPTS</div><div className="text-2xl font-bold text-gray-800 mt-1">{stats.total_mr}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">PARTIES</div><div className="text-2xl font-bold text-gray-800 mt-1">{stats.total_parties}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">PENDING POD</div><div className="text-2xl font-bold text-orange-600 mt-1">{stats.pending_pod}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">OPEN CLAIMS</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.open_claims}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">BRANCHES</div><div className="text-2xl font-bold text-gray-800 mt-1">{stats.total_branches}</div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg">📋 Recent Bilties</h3>
                  <button onClick={() => navigate('/consignments')} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">View All →</button>
                </div>
                <div className="p-4">
                  {!recent?.bilties?.length ? <p className="text-gray-500 text-center py-4">No recent bilties</p> : (
                    <div className="space-y-2">
                      {recent.bilties.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                          <div><div className="font-bold text-blue-700 text-sm">{b.lr_no}</div><div className="text-xs text-gray-600">{b.consignor_name} → {b.consignee_name}</div></div>
                          <div className="text-right"><div className="font-bold text-green-700">{formatCurrency(b.grand_total)}</div><span className={`text-xs px-2 py-0.5 rounded ${b.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{b.payment_status}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg">🏆 Top Parties by Revenue</h3>
                  <button onClick={() => navigate('/customers')} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">View All →</button>
                </div>
                <div className="p-4">
                  {!topParties.length ? <p className="text-gray-500 text-center py-4">No data yet</p> : (
                    <div className="space-y-2">
                      {topParties.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-blue-500'}`}>{idx + 1}</div>
                            <div><div className="font-bold text-gray-800 text-sm">{p.consignor_name}</div><div className="text-xs text-gray-500">{p.total_bilties} bilties</div></div>
                          </div>
                          <div className="font-bold text-purple-700">{formatCurrency(p.total_revenue)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg">💰 Recent Money Receipts</h3>
                  <button onClick={() => navigate('/mr')} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">View All →</button>
                </div>
                <div className="p-4">
                  {!recent?.receipts?.length ? <p className="text-gray-500 text-center py-4">No recent receipts</p> : (
                    <div className="space-y-2">
                      {recent.receipts.map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div><div className="font-bold text-green-700 text-sm">{r.mr_no}</div><div className="text-xs text-gray-600">{r.party_name} • {r.payment_mode}</div></div>
                          <div className="font-bold text-green-700">{formatCurrency(r.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg">⚠️ Recent Claims</h3>
                  <button onClick={() => navigate('/claims')} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">View All →</button>
                </div>
                <div className="p-4">
                  {!recent?.claims?.length ? <p className="text-gray-500 text-center py-4">No claims</p> : (
                    <div className="space-y-2">
                      {recent.claims.map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div><div className="font-bold text-red-700 text-sm">{c.lr_no}</div><div className="text-xs text-gray-600">{c.claim_type}</div></div>
                          <div className="text-right"><div className="font-bold text-red-700">{formatCurrency(c.claim_amount)}</div><span className={`text-xs px-2 py-0.5 rounded ${c.status === 'Open' ? 'bg-red-100 text-red-700' : c.status === 'Settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <p className="font-bold text-yellow-800">⚠️ Stats data load nahi ho raha</p>
            <p className="text-sm text-yellow-700 mt-1">Backend API check karo ya page refresh karo.</p>
            <button onClick={fetchData} className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">🔄 Retry Loading Stats</button>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 Bharat Transport Company • Professional Multi-Branch TMS</p>
          <p className="text-xs mt-1">Version 6.0 • Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    </div>
  )
}
