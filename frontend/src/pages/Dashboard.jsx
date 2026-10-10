import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [topParties, setTopParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)

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

      if (resStats.ok) setStats(await resStats.json())
      else {
        const err = await resStats.json().catch(() => ({ error: 'Unknown' }))
        setError('Stats: ' + (err.error || 'Unknown'))
        setStats({
          today_lr: 0, month_lr: 0, total_lr: 0, pending_lr: 0, paid_lr: 0,
          total_bills: 0, pending_bills: 0, total_mr: 0, total_parties: 0,
          total_customers: 0, total_revenue: 0, pending_amount: 0, pending_pod: 0,
          active_drivers: 0, active_vehicles: 0, open_claims: 0, today_expenses: 0,
          total_branches: 0, today_revenue: 0, month_revenue: 0,
          user_role: 'admin', user_branch: 'All'
        })
      }

      if (resRecent.ok) setRecent(await resRecent.json())
      if (resParties.ok) {
        const data = await resParties.json()
        setTopParties(data.data || [])
      }
    } catch (err) {
      setError('Network: ' + err.message)
      setStats({
        today_lr: 0, month_lr: 0, total_lr: 0, pending_lr: 0, paid_lr: 0,
        total_bills: 0, pending_bills: 0, total_mr: 0, total_parties: 0,
        total_customers: 0, total_revenue: 0, pending_amount: 0, pending_pod: 0,
        active_drivers: 0, active_vehicles: 0, open_claims: 0, today_expenses: 0,
        total_branches: 0, today_revenue: 0, month_revenue: 0,
        user_role: 'admin', user_branch: 'All'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  // COMPLETE NAVIGATION MENU - ALL MODULES
  const navMenus = [
    {
      label: '📦 Operations',
      items: [
        { name: 'Bilty/LR List', path: '/consignments', icon: '📋' },
        { name: 'Create New Bilty', path: '/consignments/new', icon: '📝' },
        { name: 'Manifest/Transit', path: '/transit', icon: '🚚' },
        { name: 'Trip Management', path: '/trips', icon: '🗺️' },
        { name: 'POD Management', path: '/pod', icon: '✅' },
        { name: 'POD Upload (Public)', path: '/pod-upload', icon: '📤' },
        { name: 'POD View (Public)', path: '/pod-view', icon: '👁️' },
      ]
    },
    {
      label: '💰 Finance',
      items: [
        { name: 'Billing', path: '/bills', icon: '🧾' },
        { name: 'Money Receipts', path: '/mr', icon: '💵' },
        { name: 'Create New MR', path: '/mr/create', icon: '📝' },
        { name: 'Accounts Summary', path: '/accounts', icon: '📊' },
        { name: 'Rate Contracts', path: '/rates', icon: '💹' },
        { name: 'Party Ledger', path: '/ledger', icon: '📒' },
        { name: 'Outstanding', path: '/outstanding', icon: '⏳' },
        { name: 'Branch Payments', path: '/branch-payments', icon: '🏦' }, // ✅ ADDED
      ]
    },
    {
      label: '🚚 Transport',
      items: [
        { name: 'Gadi Challan', path: '/gadi-challan', icon: '🚛' },
        { name: 'Gate Pass', path: '/gate-pass', icon: '🎫' },
        { name: 'Drivers', path: '/drivers', icon: '👷' },
        { name: 'Vehicles', path: '/vehicles', icon: '🚗' },
        { name: 'E-Way Bill', path: '/eway', icon: '📄' },
      ]
    },
    {
      label: '👥 Management',
      items: [
        { name: 'Parties/Customers', path: '/customers', icon: '👥' },
        { name: 'Branches', path: '/branches', icon: '🏢' },
        { name: 'Users', path: '/users', icon: '👤', adminOnly: true },
        { name: 'Claims', path: '/claims', icon: '⚠️' },
        { name: 'Commissions', path: '/commissions', icon: '💼' },
        { name: 'Expenses', path: '/expenses', icon: '💸' },
      ]
    },
    {
      label: '📊 Reports',
      items: [
        { name: 'Reports', path: '/reports', icon: '📈' },
        { name: 'Audit & CA Logs', path: '/audit', icon: '🔍' },
        { name: 'Backup & Restore', path: '/backup', icon: '💾', adminOnly: true },
      ]
    },
    {
      label: '🌐 Public',
      items: [
        { name: 'Track Bilty', path: '/track', icon: '🔍' },
        { name: 'Bilty Print', path: '/bilty-print', icon: '🖨️' },
        { name: 'MR Print', path: '/mr/print', icon: '🖨️' },
        { name: 'Gadi Challan Print', path: '/gadi-challan-print', icon: '🖨️' },
      ]
    }
  ]

  const quickActions = [
    { icon: '📝', label: 'New Bilty', color: 'from-blue-500 to-blue-700', path: '/consignments/new' },
    { icon: '💰', label: 'Money Receipt', color: 'from-green-500 to-green-700', path: '/mr/create' },
    { icon: '🚛', label: 'Gadi Challan', color: 'from-purple-500 to-purple-700', path: '/gadi-challan' },
    { icon: '📄', label: 'E-Way Bill', color: 'from-indigo-500 to-indigo-700', path: '/eway' },
    { icon: '📦', label: 'Manifest', color: 'from-orange-500 to-orange-700', path: '/transit' },
    { icon: '🏦', label: 'Branch Payments', color: 'from-teal-500 to-teal-700', path: '/branch-payments' }, // ✅ ADDED
    { icon: '🏢', label: 'Branches', color: 'from-rose-500 to-rose-700', path: '/branches' },
   { icon: '📊', label: 'Monthly Report', color: 'from-amber-500 to-amber-700', onClick: () => setShowMonthlyReport(true) },
    { icon: '👤', label: 'Users', color: 'from-pink-500 to-pink-700', path: '/users', adminOnly: true }
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

  const s = stats || {
    today_lr: 0, month_lr: 0, total_lr: 0, pending_lr: 0, paid_lr: 0,
    total_bills: 0, pending_bills: 0, total_mr: 0, total_parties: 0,
    total_customers: 0, total_revenue: 0, pending_amount: 0, pending_pod: 0,
    active_drivers: 0, active_vehicles: 0, open_claims: 0, today_expenses: 0,
    total_branches: 0, today_revenue: 0, month_revenue: 0, user_branch: 'All'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white text-red-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">BTC</div>
              <div>
                <h1 className="font-bold text-lg">Bharat Transport</h1>
                <p className="text-xs text-red-200">Professional TMS v6.0</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navMenus.map((menu, idx) => (
                <div key={idx} className="relative group">
                  <button className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm font-medium">
                    {menu.label} ▾
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {menu.items.filter(item => !item.adminOnly || isAdmin).map((item, itemIdx) => (
                        <button
                          key={itemIdx}
                          onClick={() => navigate(item.path)}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 text-sm transition"
                        >
                          <span className="mr-2">{item.icon}</span>
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">Welcome, {user.username || 'Admin'}</div>
                <div className="text-xs text-red-200">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white text-red-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 transition"
              >
                Logout
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden bg-white/20 p-2 rounded-lg"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-red-900 border-t border-red-700 max-h-96 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
              {navMenus.map((menu, idx) => (
                <div key={idx}>
                  <div className="text-sm font-bold text-red-200 mb-1">{menu.label}</div>
                  <div className="space-y-1">
                    {menu.items.filter(item => !item.adminOnly || isAdmin).map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                        className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm"
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome Back, {user.username || 'Admin'}! 👋</h1>
              <p className="text-red-200 mt-1">
                {isAdmin ? 'Your business overview across all branches' : `Branch: ${user.branch_code || 'N/A'} | ${user.branch_name || ''}`}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-2xl font-bold font-mono">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-red-200 text-sm">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Role & Branch Badges */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow ${user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            👤 {user.role === 'admin' ? 'Administrator' : user.role} {isAdmin && '(Full Access)'}
          </span>
          {s.user_branch && <span className="px-4 py-2 rounded-full text-sm font-bold bg-white text-gray-700 shadow">🏢 Branch: {s.user_branch}</span>}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div><p className="font-bold text-red-800">⚠️ {error}</p><p className="text-sm text-red-600">Dashboard showing default values. Click Retry to reload.</p></div>
              <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">🔄 Retry</button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, idx) => (
              <button key={idx} onClick={() => action.onClick ? action.onClick() : navigate(action.path)} className={`bg-gradient-to-br ${action.color} text-white p-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all`}>
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="font-bold text-sm">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-xl">
            <div className="text-blue-100 text-sm font-medium">TODAY'S LR</div>
            <div className="text-4xl font-bold mt-2">{s.today_lr}</div>
            <div className="text-blue-200 text-xs mt-2">Total: {s.total_lr} | Month: {s.month_lr}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-6 shadow-xl">
            <div className="text-green-100 text-sm font-medium">TODAY'S REVENUE</div>
            <div className="text-3xl font-bold mt-2">{formatCurrency(s.today_revenue)}</div>
            <div className="text-green-200 text-xs mt-2">Month: {formatCurrency(s.month_revenue)}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="text-orange-100 text-sm font-medium">PENDING AMOUNT</div>
            <div className="text-3xl font-bold mt-2">{formatCurrency(s.pending_amount)}</div>
            <div className="text-orange-200 text-xs mt-2">Pending LR: {s.pending_lr}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-6 shadow-xl">
            <div className="text-purple-100 text-sm font-medium">TOTAL REVENUE</div>
            <div className="text-3xl font-bold mt-2">{formatCurrency(s.total_revenue)}</div>
            <div className="text-purple-200 text-xs mt-2">Paid Bilties: {s.paid_lr}</div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">BILLS</div><div className="text-2xl font-bold text-gray-800 mt-1">{s.total_bills}</div><div className="text-xs text-red-600 mt-1">Pending: {s.pending_bills}</div></div>
          <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">MONEY RECEIPTS</div><div className="text-2xl font-bold text-gray-800 mt-1">{s.total_mr}</div></div>
          <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">PARTIES</div><div className="text-2xl font-bold text-gray-800 mt-1">{s.total_parties}</div></div>
          <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">PENDING POD</div><div className="text-2xl font-bold text-orange-600 mt-1">{s.pending_pod}</div></div>
          <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">OPEN CLAIMS</div><div className="text-2xl font-bold text-red-600 mt-1">{s.open_claims}</div></div>
          <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-xs font-medium">BRANCHES</div><div className="text-2xl font-bold text-gray-800 mt-1">{s.total_branches}</div></div>
        </div>

           {/* ✅ NEW: Branches Overview Section (Purana kuch nahi hata, sirf yeh add hua hai) */}
   <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
     <div className="flex items-center justify-between mb-4 border-b pb-3">
       <h2 className="text-xl font-bold text-gray-800">🏢 Branches Overview ({s.total_branches || 0} Total)</h2>
       <button onClick={() => navigate('/branches')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
         Manage All Branches →
       </button>
     </div>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {/* Note: Yeh sample data hai, aapka actual data /branches page se link hoga */}
       {[1, 2, 3, 4, 5, 6].map((i) => (
         <div key={i} onClick={() => navigate('/branches')} className="p-4 rounded-xl border-2 border-gray-100 cursor-pointer transition hover:border-blue-400 hover:shadow-md bg-gray-50">
           <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-gray-800">Branch {i}</h3>
             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Active</span>
           </div>
           <div className="grid grid-cols-3 gap-2 text-xs mt-3">
             <div className="bg-white p-2 rounded text-center shadow-sm">
               <div className="text-gray-500">LR</div>
               <div className="font-bold text-blue-700">{Math.floor(Math.random() * 50) + 10}</div>
             </div>
             <div className="bg-white p-2 rounded text-center shadow-sm">
               <div className="text-gray-500">Revenue</div>
               <div className="font-bold text-green-700">₹{(Math.floor(Math.random() * 100) + 50)}k</div>
             </div>
             <div className="bg-white p-2 rounded text-center shadow-sm">
               <div className="text-gray-500">POD</div>
               <div className="font-bold text-orange-700">{Math.floor(Math.random() * 5)}</div>
             </div>
           </div>
         </div>
       ))}
     </div>
   </div>
        {/* Recent Activities */}
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

           {/* ✅ NEW: Monthly Report Modal (Sirf tab dikhega jab button click hoga) */}
   {showMonthlyReport && (
     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
       <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-400">
         <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center sticky top-0">
           <div>
             <h2 className="text-2xl font-bold">📊 Monthly Report</h2>
             <p className="text-amber-100">{new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
           </div>
           <button onClick={() => setShowMonthlyReport(false)} className="text-white hover:text-amber-100 text-3xl font-bold">&times;</button>
         </div>
         <div className="p-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
               <div className="text-xs text-blue-600 uppercase font-bold">Total LR</div>
               <div className="text-2xl font-bold text-blue-800">{s.month_lr || 0}</div>
             </div>
             <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
               <div className="text-xs text-green-600 uppercase font-bold">Total Revenue</div>
               <div className="text-2xl font-bold text-green-800">{formatCurrency(s.month_revenue)}</div>
             </div>
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-center">
               <div className="text-xs text-orange-600 uppercase font-bold">Pending Amount</div>
               <div className="text-2xl font-bold text-orange-800">{formatCurrency(s.pending_amount)}</div>
             </div>
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
               <div className="text-xs text-purple-600 uppercase font-bold">Active Branches</div>
               <div className="text-2xl font-bold text-purple-800">{s.total_branches || 0}</div>
             </div>
           </div>
           
           <div className="mt-6 flex gap-3 justify-end border-t pt-4">
             <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">🖨️ Print Report</button>
             <button onClick={() => { setShowMonthlyReport(false); navigate('/reports'); }} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition">📈 Detailed Reports</button>
             <button onClick={() => setShowMonthlyReport(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition">Close</button>
           </div>
         </div>
       </div>
     </div>
   )}
        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 Bharat Transport Company • Professional Multi-Branch TMS</p>
          <p className="text-xs mt-1">Version 6.0 • Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    </div>
  )
}
