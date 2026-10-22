import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import {
  FileText,
  Receipt,
  Truck,
  Building2,
  Users,
  BarChart3,
  Boxes,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  LogOut,
  MapPin,
  Clock,
  DollarSign,
  PackageCheck,
  FileCheck2,
  FileSpreadsheet,
  Calendar,
  Layers,
  Settings,
  Database
} from 'lucide-react'

function getLocalDateString(date) {
  if (!date || isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseRecordDate(docData) {
  const rawDate = docData.createdAt || docData.date || docData.lrDate || docData.lr_date
  if (!rawDate) return null

  if (typeof rawDate.toDate === 'function') {
    const d = rawDate.toDate()
    return isNaN(d.getTime()) ? null : d
  }
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? null : rawDate
  }
  if (typeof rawDate === 'number') {
    const d = new Date(rawDate)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof rawDate === 'string') {
    const d = new Date(rawDate)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function getRecordTimestamp(docData) {
  const rawDate = docData.createdAt || docData.date || docData.lrDate || docData.lr_date
  if (!rawDate) return 0

  if (typeof rawDate.seconds === 'number') {
    return rawDate.seconds * 1000 + Math.floor((rawDate.nanoseconds || 0) / 1000000)
  }
  const d = parseRecordDate(docData)
  return d ? d.getTime() : 0
}

function normalizePaymentStatus(docData) {
  const rawStatus = (docData.paymentStatus || docData.payment_status || docData.status || '').toString().trim().toLowerCase()
  return rawStatus === 'paid' ? 'Paid' : 'Unpaid'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ todaysLR:0, monthLR:0, totalLR:0, todaysRevenue:0, monthRevenue:0, pendingAmount:0, pendingLR:0, totalRevenue:0, paidBilties:0 })
  const [recentBilties, setRecentBilties] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [branches, setBranches] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.error('Failed to load branches snapshot:', err)
      setBranches([])
    })

    return () => {
      unsubBranches()
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const baseCol = collection(db, 'consignments')
    const q = selectedBranch === 'all'
      ? baseCol
      : query(baseCol, where('branchId', '==', selectedBranch))

    const unsubConsignments = onSnapshot(q, (snapshot) => {
      const now = new Date()
      const todayStr = getLocalDateString(now)
      const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayMonthStr = getLocalDateString(firstDayMonth)

      let todaysLR=0, monthLR=0, totalLR=snapshot.size, todaysRevenue=0, monthRevenue=0, pendingAmount=0, pendingLR=0, totalRevenue=0, paidBilties=0
      let recents = []

      snapshot.forEach(doc => {
        const d = { id: doc.id, ...doc.data() }
        const createdDate = parseRecordDate(d)
        const createdStr = getLocalDateString(createdDate)

        const amount = Number(d.totalAmount || d.grandTotal || d.freight || d.grand_total || 0) || 0
        const paymentStatus = normalizePaymentStatus(d)
        const isPaid = paymentStatus === 'Paid'

        if (createdStr && createdStr === todayStr) {
          todaysLR++
          todaysRevenue += amount
        }
        if (createdStr && firstDayMonthStr && createdStr >= firstDayMonthStr) {
          monthLR++
          monthRevenue += amount
        }
        if (!isPaid) {
          pendingAmount += amount
          pendingLR++
        } else {
          totalRevenue += amount
          paidBilties++
        }
        recents.push({ ...d, normalizedPaymentStatus: paymentStatus })
      })

      recents.sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a))
      setRecentBilties(recents.slice(0, 5))
      setStats({ todaysLR, monthLR, totalLR, todaysRevenue, monthRevenue, pendingAmount, pendingLR, totalRevenue, paidBilties })
      setLoading(false)
    }, (err) => {
      console.error('Failed to load consignments snapshot:', err)
      setLoading(false)
    })

    return () => {
      unsubConsignments()
    }
  }, [selectedBranch])

  const timeString = currentTime.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
  const dateString = currentTime.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })

  // 10 Clear Dashboard Categories for Top Horizontal Navigation Row
  const navCategories = [
    {
      id: 'consignments',
      label: 'Consignments',
      icon: FileText,
      items: [
        { label: 'All Consignments', path: '/consignments' },
        { label: 'New Bilty Entry', path: '/consignments/new' },
        { label: 'Print Bilty', path: '/bilty-print' },
        { label: 'Public Track Bilty', path: '/track' }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & Invoicing',
      icon: Receipt,
      items: [
        { label: 'Bill Register', path: '/bills' },
        { label: 'Create Freight Bill', path: '/bill/new' },
        { label: 'Print Bill', path: '/bill-print' }
      ]
    },
    {
      id: 'payments',
      label: 'Money Receipts',
      icon: DollarSign,
      items: [
        { label: 'Receipts History', path: '/mr' },
        { label: 'Create Money Receipt', path: '/mr/create' },
        { label: 'Print Receipt', path: '/mr/print' }
      ]
    },
    {
      id: 'fleet',
      label: 'Fleet & Trips',
      icon: Truck,
      items: [
        { label: 'Gadi Challans', path: '/gadi-challan' },
        { label: 'Trip Operations', path: '/trips' },
        { label: 'Dispatch Manifests', path: '/transit' },
        { label: 'Gate Pass Manager', path: '/gate-pass' }
      ]
    },
    {
      id: 'pod',
      label: 'POD Management',
      icon: PackageCheck,
      items: [
        { label: 'POD Dashboard', path: '/pod' },
        { label: 'Public POD Upload', path: '/pod-upload' },
        { label: 'Public POD Viewer', path: '/pod-view' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance & Ledger',
      icon: BarChart3,
      items: [
        { label: 'Outstanding Summary', path: '/outstanding' },
        { label: 'Party Ledger', path: '/ledger' },
        { label: 'Office Expenses', path: '/expenses' },
        { label: 'Cash / Bank Summary', path: '/accounts' },
        { label: 'Agent Commissions', path: '/commissions' },
        { label: 'Branch Payment Settlements', path: '/branch-payments' }
      ]
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: Users,
      items: [
        { label: 'Customer Master', path: '/customers' },
        { label: 'Party Master', path: '/party' },
        { label: 'Vehicle Fleet Master', path: '/vehicles' },
        { label: 'Driver Master', path: '/drivers' },
        { label: 'Rate Contracts', path: '/rates' }
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: FileCheck2,
      items: [
        { label: 'E-Way Bill Manager', path: '/eway' },
        { label: 'Claims Manager', path: '/claims' }
      ]
    },
    {
      id: 'branches',
      label: 'Branches & Stock',
      icon: Building2,
      items: [
        { label: 'Branch Network', path: '/branches', adminOnly: true },
        { label: 'Document Stock Mgmt', path: '/stock' }
      ].filter(item => !item.adminOnly || isAdmin)
    },
    {
      id: 'system',
      label: 'System & Reports',
      icon: ShieldCheck,
      items: [
        { label: 'MIS Reports', path: '/reports' },
        { label: 'System Audit Logs', path: '/audit', adminOnly: true },
        { label: 'User Access Control', path: '/users', adminOnly: true },
        { label: 'Database Backup/Restore', path: '/backup', adminOnly: true }
      ].filter(item => !item.adminOnly || isAdmin)
    }
  ]

  const cards = [
    { title:"Today's LR", value:stats.todaysLR, sub:`Month: ${stats.monthLR} | Total: ${stats.totalLR}`, gradient:"from-[#3f37c9] to-[#6c63ff]" },
    { title:"Today's Revenue", value:`₹${stats.todaysRevenue.toLocaleString('en-IN')}`, sub:`Month: ₹${stats.monthRevenue.toLocaleString('en-IN')}`, gradient:"from-[#1d4e89] to-[#2bb5a6]" },
    { title:"Pending Amount", value:`₹${stats.pendingAmount.toLocaleString('en-IN')}`, sub:`Pending LR: ${stats.pendingLR}`, gradient:"from-[#4a3f8a] to-[#f0a500]" },
    { title:"Total Revenue", value:`₹${stats.totalRevenue.toLocaleString('en-IN')}`, sub:`Paid Bilties: ${stats.paidBilties}`, gradient:"from-[#2c3e8a] to-[#6c63ff]" }
  ]

  if (loading) return <div className="p-10 text-center font-bold text-gray-700">Loading LIVE data...</div>

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* 10 TOP CATEGORIES HORIZONTAL NAVIGATION HEADER */}
      <header className="bg-[#0f172a] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 text-slate-950 p-2 rounded-lg font-black text-xl tracking-wider flex items-center gap-2">
              <Truck size={22} />
              <span>BTC</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-100">BHARAT TRANSPORT COMPANY</h1>
              <p className="text-[10px] text-cyan-400 font-medium">TRANSPORT MANAGEMENT SYSTEM v6.0</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <Clock size={14} className="text-cyan-400" />
              <span>{dateString} • <strong className="text-white">{timeString}</strong></span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase">
                  {currentUser.role || 'Operator'}
                </span>
                <span className="text-slate-200 font-medium">{currentUser.username || currentUser.name}</span>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 hover:bg-slate-800 rounded-md text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* TOP HORIZONTAL NAV MENU BAR */}
        <nav className="bg-[#1e293b] border-t border-slate-800 hidden md:block">
          <div className="max-w-[1600px] mx-auto px-2 flex items-center overflow-x-auto no-scrollbar">
            {navCategories.map(cat => {
              const Icon = cat.icon
              const isOpen = activeDropdown === cat.id
              return (
                <div
                  key={cat.id}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(cat.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                      isOpen
                        ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon size={14} className={isOpen ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>{cat.label}</span>
                    <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : 'opacity-60'}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute left-0 top-full bg-slate-900 border border-slate-700 shadow-2xl rounded-b-lg py-1.5 min-w-[210px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      {cat.items.map((sub, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveDropdown(null)
                            navigate(sub.path)
                          }}
                          className="w-full text-left px-4 py-2 text-[12px] text-slate-300 hover:text-white hover:bg-cyan-600/20 hover:border-l-2 hover:border-cyan-400 flex items-center justify-between transition-all"
                        >
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 p-4 max-h-[80vh] overflow-y-auto">
            {navCategories.map(cat => {
              const Icon = cat.icon
              return (
                <div key={cat.id} className="mb-3">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1.5 px-2">
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pl-3">
                    {cat.items.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          navigate(sub.path)
                        }}
                        className="text-left py-1.5 px-2 text.xs text-slate-300 hover:text-white bg-slate-800/50 rounded hover:bg-slate-800"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {currentUser && (
              <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Signed in as <strong className="text-white">{currentUser.username}</strong></span>
                <button onClick={logout} className="text-red-400 font-bold hover:underline">Sign Out</button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="p-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[24px] font-bold text-slate-800">Dashboard Overview</h2>
            <p className="text-[13px] text-[#64748b]">Real-time logistics control and operational analytics</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-3 flex gap-3 items-center">
            <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 size={16} className="text-cyan-600" /> Filter Branch:
            </span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-[13px] min-w-[240px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">🌐 All Branches (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name || b.branchName || b.branch_name || b.code || b.branchCode || b.id}
                </option>
              ))}
            </select>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-bold animate-pulse">
              ● LIVE
            </span>
          </div>
        </div>

        {/* SUMMARY STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {cards.map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.gradient} rounded-xl p-5 text-white shadow-lg relative overflow-hidden`}>
              <div className="text-[13px] opacity-90 font-medium">{c.title}</div>
              <div className="text-[32px] font-bold mt-1 tracking-tight">{c.value}</div>
              <div className="text-[11px] bg-white/20 px-2.5 py-1 rounded-md inline-block mt-3 font-semibold backdrop-blur-sm">
                {c.sub}
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS & RECENT BILTIES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-slate-800 text-[15px] mb-3 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" /> Primary Workflow Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { l:'New Bilty', p:'/consignments/new', c:'bg-[#2c5cc5]', icon: FileText },
                { l:'New Bill', p:'/bill/new', c:'bg-[#1a9e6e]', icon: Receipt },
                { l:'Money Receipt', p:'/mr/create', c:'bg-[#e67e22]', icon: DollarSign },
                { l:'Gadi Challan', p:'/gadi-challan', c:'bg-[#34495e]', icon: Truck },
                { l:'E-Way Bill', p:'/eway', c:'bg-[#16a085]', icon: FileCheck2 },
                { l:'Manifest', p:'/transit', c:'bg-[#2c5cc5]', icon: MapPin },
                { l:'Branches', p:'/branches', c:'bg-[#d4880f]', icon: Building2 },
                { l:'Stock Mgmt', p:'/stock', c:'bg-[#2c3e50]', icon: Boxes }
              ].map(a => {
                const ActionIcon = a.icon
                return (
                  <button
                    key={a.l}
                    onClick={() => navigate(a.p)}
                    className={`${a.c} rounded-xl p-4 text-white text-[13px] font-semibold flex flex-col items-center justify-center gap-2 shadow-md hover:opacity-95 hover:scale-[1.02] transition-all min-h-[95px]`}
                  >
                    <ActionIcon size={20} />
                    <span>{a.l}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-[14px] mb-3 flex items-center gap-2">
              <Clock size={16} className="text-cyan-600" /> Recent 5 Bilties - LIVE
            </h3>
            {recentBilties.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-6 text-center">No recent consignment records found.</p>
            ) : (
              recentBilties.map(r => (
                <div key={r.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 text-[12px] last:border-0">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{r.biltyNo || r.lrNo || r.lr_no || (r.id ? r.id.slice(0,6) : '')}</span>
                    <span className="text-[10px] text-slate-400">{r.consignor_name || r.consignorName || 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{Number(r.totalAmount || r.grandTotal || r.freight || r.grand_total || 0).toLocaleString('en-IN')}</div>
                    <span className={`text-[10px] font-bold ${r.normalizedPaymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {r.normalizedPaymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
