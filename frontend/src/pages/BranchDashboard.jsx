import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function BranchDashboard() {
  const { branchCode } = useParams();
  const navigate = useNavigate();

  const toSlug = (s) => s.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateString = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const stats = [
    { title: "Today's LR", value: "0", sub: "Month: 4 | Total: 10", gradient: "from-[#3f37c9] to-[#6c63ff]" },
    { title: "Today's Revenue", value: "₹0", sub: "Month: ₹10,360", gradient: "from-[#1d4e89] to-[#2bb5a6]" },
    { title: "Pending Amount", value: "₹1,06,529", sub: "Pending LR: 7", gradient: "from-[#4a3f8a] to-[#f0a500]" },
    { title: "Total Revenue", value: "₹10,360", sub: "Paid Bilties: 2", gradient: "from-[#2c3e8a] to-[#6c63ff]" }
  ];

  const quickActions = [
    { label: 'Bilty Entry', slug: 'bilty-entry', color: 'bg-[#2c5cc5]', icon: '📝', desc: 'New Bilty' },
    { label: 'Consignments', slug: 'consignments', color: 'bg-[#1a9e6e]', icon: '📦', desc: 'View LR' },
    { label: 'Bill Entry', slug: 'bill-entry', color: 'bg-[#e67e22]', icon: '💰', desc: 'New Bill' },
    { label: 'Money Receipt', slug: 'money-receipt', color: 'bg-[#34495e]', icon: '🧾', desc: 'MR Entry' },
    { label: 'Gadi Challan', slug: 'gadi-challan', color: 'bg-[#16a085]', icon: '🚛', desc: 'Challan' },
    { label: 'Gate Pass', slug: 'gate-pass', color: 'bg-[#2c5cc5]', icon: '🚪', desc: 'Gate Pass' },
    { label: 'POD', slug: 'pod', color: 'bg-[#d4880f]', icon: '📋', desc: 'POD Entry' },
    { label: 'Stock Report', slug: 'stock-report', color: 'bg-[#2c3e50]', icon: '📊', desc: 'Stock Mgmt' },
    { label: 'Bill List', slug: 'bill-list', color: 'bg-[#8e44ad]', icon: '📑', desc: 'Bill List' },
    { label: 'Outstanding', slug: 'outstanding', color: 'bg-[#c0392b]', icon: '💸', desc: 'To-Pay' },
    { label: 'Branch Transfer', slug: 'branch-transfer', color: 'bg-[#2980b9]', icon: '🔄', desc: 'Transfer' },
    { label: 'Vehicle Tracking', slug: 'vehicle-tracking', color: 'bg-[#27ae60]', icon: '📍', desc: 'Tracking' },
    { label: 'Customer Master', slug: 'customer-master', color: 'bg-[#f39c12]', icon: '👥', desc: 'Customers' },
    { label: 'Driver', slug: 'driver', color: 'bg-[#7f8c8d]', icon: '👨‍✈️', desc: 'Drivers' },
    { label: 'Vehicle', slug: 'vehicle', color: 'bg-[#2c3e50]', icon: '🚚', desc: 'Vehicles' },
    { label: 'Ledger', slug: 'ledger', color: 'bg-[#16a085]', icon: '📒', desc: 'Ledger' },
  ];

  const allModules = {
    'BOOKING & BILTY': ['Bilty Entry', 'Consignments', 'Bilty Print', 'Gadi Challan', 'Gate Pass', 'Branch Transfer', 'Vehicle Tracking'],
    'BILLING & PAYMENT': ['Bill Entry', 'Bill List', 'Bill Print', 'Money Receipt', 'Payment Entry', 'To-Pay Report', 'Outstanding', 'Challan Payment', 'Profit Loss'],
    'POD & STOCK': ['POD', 'POD List', 'Stock Report', 'Stock Entry', 'Diesel Entry', 'Diesel Report'],
    'COMMISSION & REPORT': ['Commission', 'Commission Report', 'Cash Book', 'Ledger', 'GST', 'TDS', 'Expense', 'Income'],
    'MASTERS': ['Customer Master', 'Supplier', 'Driver', 'Vehicle', 'Tyre', 'Rate Master', 'City Master', 'Notification', 'Support']
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] -m-6 p-6">
      {/* Header Like Admin */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#1e293b]">Dashboard Overview</h1>
          <p className="text-[14px] text-[#64748b] mt-1">Branch view - {branchCode} | Consolidated view across {branchCode} branch</p>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-bold text-[#1e293b]">{timeString}</div>
          <div className="text-[13px] text-[#94a3b8]">{dateString}</div>
        </div>
      </div>

      {/* Filter Bar Like Admin */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex items-center gap-3">
        <div className="text-[14px] font-semibold text-[#334155] flex items-center gap-2">
          <span>🏢</span> Filter by Branch:
        </div>
        <div className="bg-[#f1f5f9] border rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#334155]">
          📍 {branchCode} (Current Branch)
        </div>
        <div className="ml-auto flex gap-2">
          <span className="text-[11px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">5 Categories</span>
          <span className="text-[11px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">40 Modules</span>
          <span className="text-[11px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Active: {branchCode}</span>
        </div>
      </div>

      {/* 4 Gradient Cards Like Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-5 text-white shadow-lg relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="text-[13px] opacity-90 font-medium">{stat.title}</div>
              <div className="text-[28px] font-bold mt-2">{stat.value}</div>
              <div className="text-[11px] opacity-80 mt-3">{stat.sub}</div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 text-[70px] -mr-2 -mb-2">•</div>
          </div>
        ))}
      </div>

      {/* Quick Actions Like Admin */}
      <div className="mb-8">
        <h2 className="text-[16px] font-bold text-[#1e293b] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.slug}
              onClick={() => navigate(`/branch/${branchCode}/${action.slug}`)}
              className={`${action.color} rounded-xl p-4 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all text-center min-h-[90px] flex flex-col items-center justify-center gap-2`}
            >
              <div className="text-[22px]">{action.icon}</div>
              <div className="text-[12px] font-semibold leading-tight">{action.desc}<br/>{action.label.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* All 40 Modules Category Wise */}
      <div className="space-y-5">
        {Object.entries(allModules).map(([catTitle, modules]) => (
          <div key={catTitle} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-[#f8fafc] border-b flex justify-between items-center">
              <h3 className="text-[13px] font-bold text-[#475569] tracking-wider">{catTitle} ({modules.length})</h3>
              <span className="text-[11px] text-[#94a3b8]">Click to open</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {modules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => navigate(`/branch/${branchCode}/${toSlug(mod)}`)}
                  className="text-left p-3 border border-[#e2e8f0] rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
                >
                  <div className="text-[13px] font-medium text-[#1e293b] group-hover:text-blue-600">{mod}</div>
                  <div className="text-[10px] text-[#94a3b8] mt-1">/{toSlug(mod)}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
