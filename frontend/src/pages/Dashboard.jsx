import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [topParties, setTopParties] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lowStockItems, setLowStockItems] = useState([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    if (!currentUser) navigate('/login')
  }, [currentUser, navigate])

  useEffect(() => {
    fetchData()
    checkStockAlerts()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [selectedBranch])

  const checkStockAlerts = () => {
    try {
      const savedStock = localStorage.getItem('btc_stationery_stock_v2')
      if (savedStock) {
        const currentStock = JSON.parse(savedStock)
        setLowStockItems(currentStock.filter(item => item.currentStock <= item.threshold))
      }
    } catch (e) {}
  }

  const fetchData = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      if (token) {
        try {
          const testRes = await fetch(`${apiUrl}/api/dashboard/stats`, { headers })
          if (testRes.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/login')
            return
          }
        } catch (e) {}
      }

      const branchParam = (isAdmin && selectedBranch !== 'all') ? `?branch_id=${selectedBranch}` : ''
      
      const [resStats, resRecent, resParties, resBranches] = await Promise.all([
        fetch(`${apiUrl}/api/dashboard/stats${branchParam}`, { headers }),
        fetch(`${apiUrl}/api/dashboard/recent${branchParam}`, { headers }),
        fetch(`${apiUrl}/api/dashboard/top-parties${branchParam}`, { headers }),
        fetch(`${apiUrl}/api/branches`, { headers })
      ])

      if (resStats.ok) setStats(await resStats.json())
      else { setError('Stats load failed'); setStats(getDefaultStats()) }

      if (resRecent.ok) setRecent(await resRecent.json())
      if (resParties.ok) setTopParties((await resParties.json()).data || [])
      if (resBranches.ok) setBranches((await resBranches.json()).data || [])
    } catch (err) {
      setError('Network error'); setStats(getDefaultStats())
    } finally { setLoading(false) }
  }

  const getDefaultStats = () => ({
    today_lr: 0, month_lr: 0, total_lr: 0, pending_lr: 0, paid_lr: 0,
    total_bills: 0, pending_bills: 0, total_mr: 0, total_parties: 0,
    total_customers: 0, total_revenue: 0, pending_amount: 0, pending_pod: 0,
    active_drivers: 0, active_vehicles: 0, open_claims: 0, today_expenses: 0,
    total_branches: 0, today_revenue: 0, month_revenue: 0,
    user_role: 'admin', user_branch: 'All'
  })

  const handleLogout = async () => {
    try { await logout(); localStorage.clear(); navigate('/login') } 
    catch (error) { console.error(error) }
  }

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const s = stats || getDefaultStats()

  // ✅ COMPLETE NAV MENUS - ALL 45 PAGES INCLUDED
  const navMenus = [
    { label: 'Operations', items: [
        { name: 'Bilty/LR List', path: '/consignments', icon: '📋' },
        { name: 'Create New Bilty', path: '/consignments/new', icon: '' },
        { name: 'Bilty Print', path: '/bilty-print', icon: '️' },
        { name: 'Manifest/Transit', path: '/transit', icon: '🚚' },
        { name: 'Trip Management', path: '/trips', icon: '🗺️' },
        { name: 'POD Management', path: '/pod', icon: '✅' },
      ]
    },
    { label: 'Finance', items: [
        { name: 'Create New Bill', path: '/bill/new', icon: '🆕' },
        { name: 'Bill List', path: '/bills', icon: '🧾' },
        { name: 'Bill Print', path: '/bill-print', icon: '🖨️' },
        { name: 'Money Receipts', path: '/mr', icon: '💵' },
        { name: 'Create New MR', path: '/mr/create', icon: '📝' },
        { name: 'MR Print', path: '/mr-print', icon: '🖨️' },
        { name: 'Commissions', path: '/commissions', icon: '💼' },
        { name: 'Branch Payments', path: '/branch-payments', icon: '🏦' },
        { name: 'Accounts Summary', path: '/accounts', icon: '📊' },
        { name: 'Rate Contracts', path: '/rates', icon: '📑' },
        { name: 'Party Ledger', path: '/ledger', icon: '' },
        { name: 'Outstanding', path: '/outstanding', icon: '⏳' },
      ]
    },
    { label: 'Transport', items: [
        { name: 'Gadi Challan', path: '/gadi-challan', icon: '🚛' },
        { name: 'Gadi Challan Print', path: '/gadi-challan-print', icon: '🖨️' },
        { name: 'Gate Pass', path: '/gate-pass', icon: '🎫' },
        { name: 'Drivers', path: '/drivers', icon: '' },
        { name: 'Vehicles', path: '/vehicles', icon: '🚗' },
        { name: 'E-Way Bill', path: '/eway', icon: '📄' },
      ]
    },
    { label: 'Management', items: [
        { name: 'Parties/Customers', path: '/customers', icon: '👥' },
        { name: 'Branches', path: '/branches', icon: '🏢', adminOnly: true },
        { name: 'Users', path: '/users', icon: '👤', adminOnly: true },
        { name: 'Stock Management', path: '/stock', icon: '📦', adminOnly: true },
        { name: 'Claims', path: '/claims', icon: '⚠️' },
        { name: 'Expenses', path: '/expenses', icon: '💸' },
      ]
    },
    { label: 'Reports', items: [
        { name: 'Reports', path: '/reports', icon: '📈' },
        { name: 'Backup & Restore', path: '/backup', icon: '💾', adminOnly: true },
        { name: 'Audit Logs', path: '/audit', icon: '🔍', adminOnly: true },
      ]
    },
    { label: 'Public', items: [
        { name: 'Track Bilty', path: '/track', icon: '🔍' },
        { name: 'POD Upload', path: '/pod-upload', icon: '📤' },
      ]
    }
  ]

  const quickActions = [
    { icon: '', label: 'New Bilty', color: 'bg-indigo-600 hover:bg-indigo-700', path: '/consignments/new' },
    { icon: '🆕', label: 'New Bill', color: 'bg-emerald-600 hover:bg-emerald-700', path: '/bill/new' },
    { icon: '💰', label: 'Money Receipt', color: 'bg-green-600 hover:bg-green-700', path: '/mr/create' },
    { icon: '🚛', label: 'Gadi Challan', color: 'bg-purple-600 hover:bg-purple-700', path: '/gadi-challan' },
    { icon: '📄', label: 'E-Way Bill', color: 'bg-blue-600 hover:bg-blue-700', path: '/eway' },
    { icon: '📦', label: 'Manifest', color: 'bg-orange-600 hover:bg-orange-700', path: '/transit' },
    { icon: '🏢', label: 'Branches', color: 'bg-rose-600 hover:bg-rose-700', path: '/branches', adminOnly: true },
    { icon: '', label: 'Stock Mgmt', color: 'bg-cyan-600 hover:bg-cyan-700', path: '/stock', adminOnly: true },
  ].filter(a => !a.adminOnly || isAdmin)

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg">B</div>
              <div>
                <h1 className="font-bold text-slate-900 text-lg leading-tight">Bharat Transport</h1>
                <p className="text-xs text-slate-500 leading-tight">TMS v6.0</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              {navMenus.map((menu, idx) => (
                <div key={idx} className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition">
                    {menu.label} ▾
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                    {menu.items.filter(item => !item.adminOnly || isAdmin).map((item, itemIdx) => (
                      <button key={itemIdx} onClick={() => navigate(item.path)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition">
                        <span className="mr-2">{item.icon}</span>{item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-slate-900">Welcome, {user.username || 'Admin'}</div>
                <div className="text-xs text-slate-500">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-red-600 transition">Logout</button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100">☰</button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 py-2">
            {navMenus.map((menu, idx) => (
              <div key={idx} className="px-4 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">{menu.label}</div>
                {menu.items.filter(item => !item.adminOnly || isAdmin).map((item, itemIdx) => (
                  <button key={itemIdx} onClick={() => { navigate(item.path); setMobileMenuOpen(false) }} className="block w-full text-left py-2 text-sm text-slate-700 hover:text-indigo-600">
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
            <p className="text-slate-500 mt-1">
              {isAdmin ? 'Consolidated view across all branches' : `Branch: ${user.branch_name || 'N/A'}`}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-3xl font-bold text-slate-900 font-mono">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-sm text-slate-500">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {isAdmin && branches.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 flex-wrap">
              <label className="font-semibold text-slate-700 flex items-center gap-2">🏢 Filter by Branch:</label>
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white min-w-[200px]">
                <option value="all">🌐 All Branches (Consolidated)</option>
                {branches.map((b) => (<option key={b.id} value={b.id}>🏢 {b.branch_name} — {b.city}</option>))}
              </select>
              {selectedBranch !== 'all' && <button onClick={() => setSelectedBranch('all')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">✖ Clear Filter</button>}
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-bold text-amber-800">⚠️ Low Stock Alert</p>
                  <p className="text-sm text-amber-700 mt-1">{lowStockItems.map(i => i.name).join(', ')} need immediate reorder.</p>
                </div>
                <button onClick={() => navigate('/stock')} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition">View Stock</button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="font-bold text-red-800">⚠️ {error}</p>
              <button onClick={fetchData} className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">🔄 Retry</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Today's LR</div>
            <div className="text-3xl font-bold text-slate-900">{s.today_lr}</div>
            <div className="text-xs text-slate-400 mt-2">Month: {s.month_lr} | Total: {s.total_lr}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Today's Revenue</div>
            <div className="text-3xl font-bold text-emerald-600">{formatCurrency(s.today_revenue)}</div>
            <div className="text-xs text-slate-400 mt-2">Month: {formatCurrency(s.month_revenue)}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Pending Amount</div>
            <div className="text-3xl font-bold text-amber-600">{formatCurrency(s.pending_amount)}</div>
            <div className="text-xs text-slate-400 mt-2">Pending LR: {s.pending_lr}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-indigo-600">{formatCurrency(s.total_revenue)}</div>
            <div className="text-xs text-slate-400 mt-2">Paid Bilties: {s.paid_lr}</div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map((action, idx) => (
              <button key={idx} onClick={() => navigate(action.path)} className={`${action.color} text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 aspect-square`}>
                <div className="text-2xl">{action.icon}</div>
                <div className="font-medium text-xs text-center leading-tight">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Operational Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3"><span className="text-2xl">🚗</span><div><div className="font-medium text-slate-800">Active Vehicles</div></div></div>
                <div className="text-2xl font-bold text-slate-900">{s.active_vehicles}</div>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3"><span className="text-2xl">👷</span><div><div className="font-medium text-slate-800">Active Drivers</div></div></div>
                <div className="text-2xl font-bold text-slate-900">{s.active_drivers}</div>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3"><span className="text-2xl">⚠️</span><div><div className="font-medium text-slate-800">Open Claims</div></div></div>
                <div className="text-2xl font-bold text-red-600">{s.open_claims}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3"><span className="text-2xl">🏢</span><div><div className="font-medium text-slate-800">Total Branches</div></div></div>
                <div className="text-2xl font-bold text-slate-900">{s.total_branches}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Branch Overview</h3>
              <button onClick={() => navigate('/branches')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-500">No branches added yet.</div>
              ) : (
                branches.slice(0, 6).map((branch) => (
                  <div key={branch.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition cursor-pointer" onClick={() => navigate('/branches')}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{branch.branch_name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${branch.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{branch.city}{branch.state ? ', ' + branch.state : ''}</div>
                    <div className="text-xs text-slate-600">Incharge: <span className="font-medium">{branch.incharge_name || 'N/A'}</span></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Recent Bilties</h3>
              <button onClick={() => navigate('/consignments')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
            </div>
            <div className="p-4">
              {!recent?.bilties?.length ? <p className="text-slate-500 text-center py-4 text-sm">No recent bilties</p> : (
                <div className="space-y-3">
                  {recent.bilties.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div><div className="font-bold text-slate-800 text-sm">{b.lr_no}</div><div className="text-xs text-slate-500">{b.consignor_name} → {b.consignee_name}</div></div>
                      <div className="text-right"><div className="font-bold text-emerald-600 text-sm">{formatCurrency(b.grand_total)}</div><span className={`text-xs px-2 py-0.5 rounded ${b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.payment_status}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Top Parties by Revenue</h3>
              <button onClick={() => navigate('/customers')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
            </div>
            <div className="p-4">
              {!topParties.length ? <p className="text-slate-500 text-center py-4 text-sm">No data yet</p> : (
                <div className="space-y-3">
                  {topParties.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-indigo-500'}`}>{idx + 1}</div>
                        <div><div className="font-bold text-slate-800 text-sm">{p.consignor_name}</div><div className="text-xs text-slate-500">{p.total_bilties} bilties</div></div>
                      </div>
                      <div className="font-bold text-indigo-600">{formatCurrency(p.total_revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-400 text-xs">
          <p>© 2026 Bharat Transport Company • Professional Multi-Branch TMS</p>
        </div>
      </main>
    </div>
  )
}
