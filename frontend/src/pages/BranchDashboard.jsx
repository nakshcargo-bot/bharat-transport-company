import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function BranchDashboard() {
  const { branchCode } = useParams();
  const navigate = useNavigate();
  const toSlug = (s) => s.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
  const categories = [
    { title: 'BOOKING & BILTY', color: 'bg-blue-500', icon: '📦', modules: ['Dashboard', 'Bilty Entry', 'Consignments', 'Bilty Print', 'Gadi Challan', 'Gate Pass', 'Branch Transfer', 'Vehicle Tracking'] },
    { title: 'BILLING & PAYMENT', color: 'bg-green-500', icon: '💰', modules: ['Bill Entry', 'Bill List', 'Bill Print', 'Money Receipt', 'Payment Entry', 'To-Pay Report', 'Outstanding', 'Challan Payment', 'Profit Loss'] },
    { title: 'POD & STOCK', color: 'bg-orange-500', icon: '📋', modules: ['POD', 'POD List', 'Stock Report', 'Stock Entry', 'Diesel Entry', 'Diesel Report'] },
    { title: 'COMMISSION & REPORT', color: 'bg-purple-500', icon: '📊', modules: ['Commission', 'Commission Report', 'Cash Book', 'Ledger', 'GST', 'TDS', 'Expense', 'Income'] },
    { title: 'MASTERS', color: 'bg-red-500', icon: '⚙️', modules: ['Customer Master', 'Supplier', 'Driver', 'Vehicle', 'Tyre', 'Rate Master', 'City Master', 'Notification', 'Support'] }
  ];
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to {branchCode} Branch</h1>
        <p className="text-sm text-gray-500 mt-1">Select any module to continue - 40 modules available</p>
        <div className="mt-4 flex gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Branch Code: {branchCode}</span>
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">5 Categories</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">40 Modules</span>
        </div>
      </div>
      {categories.map((cat) => (
        <div key={cat.title} className="bg-white rounded-lg shadow overflow-hidden">
          <div className={`${cat.color} text-white px-4 py-3 flex items-center gap-2`}>
            <span className="text-lg">{cat.icon}</span>
            <h2 className="font-bold text-sm tracking-wide">{cat.title} ({cat.modules.length})</h2>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {cat.modules.map((mod) => (
              <button key={mod} onClick={() => navigate(`/branch/${branchCode}/${toSlug(mod)}`)} className="text-left p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm transition group">
                <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600">{mod}</div>
                <div className="text-[11px] text-gray-400 mt-1">/{toSlug(mod)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
