import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function StockManagement() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  const [stock, setStock] = useState([])
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [remarks, setRemarks] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const defaultStock = [
    { id: 1, name: 'Bilty / LR Books', category: 'document', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 150, used: 0 },
    { id: 2, name: 'Money Receipt (MR) Books', category: 'document', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 120, used: 0 },
    { id: 3, name: 'Gadi Challan Books', category: 'document', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 130, used: 0 },
    { id: 4, name: 'Billing / Invoice Books', category: 'document', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 140, used: 0 },
    { id: 5, name: 'Gate Pass Books', category: 'document', currentStock: 300, threshold: 30, unit: 'Books', pricePerUnit: 100, used: 0 },
    { id: 6, name: 'POD Books', category: 'document', currentStock: 300, threshold: 30, unit: 'Books', pricePerUnit: 100, used: 0 },
    { id: 7, name: 'A4 Paper Reams', category: 'stationery', currentStock: 100, threshold: 20, unit: 'Reams', pricePerUnit: 250, used: 0 },
    { id: 8, name: 'Printer Ink (Black)', category: 'stationery', currentStock: 50, threshold: 10, unit: 'Cartridges', pricePerUnit: 500, used: 0 },
    { id: 9, name: 'Printer Ink (Color)', category: 'stationery', currentStock: 30, threshold: 5, unit: 'Cartridges', pricePerUnit: 800, used: 0 },
    { id: 10, name: 'Dot Matrix Ribbon', category: 'stationery', currentStock: 40, threshold: 10, unit: 'Ribbons', pricePerUnit: 200, used: 0 },
    { id: 11, name: 'Envelopes (Large)', category: 'stationery', currentStock: 500, threshold: 100, unit: 'Pieces', pricePerUnit: 5, used: 0 },
    { id: 12, name: 'Stapler Pins', category: 'stationery', currentStock: 100, threshold: 20, unit: 'Boxes', pricePerUnit: 30, used: 0 },
    { id: 13, name: 'File Folders', category: 'stationery', currentStock: 200, threshold: 50, unit: 'Pieces', pricePerUnit: 15, used: 0 },
    { id: 14, name: 'Carbon Paper', category: 'stationery', currentStock: 150, threshold: 30, unit: 'Pieces', pricePerUnit: 20, used: 0 },
    { id: 15, name: 'Stamp Pad', category: 'stationery', currentStock: 20, threshold: 5, unit: 'Pieces', pricePerUnit: 50, used: 0 },
  ]

  useEffect(() => {
    const savedStock = localStorage.getItem('btc_stationery_stock_v2')
    if (savedStock) { try { setStock(JSON.parse(savedStock)) } catch (e) { setStock(defaultStock); localStorage.setItem('btc_stationery_stock_v2', JSON.stringify(defaultStock)) } }
    else { setStock(defaultStock); localStorage.setItem('btc_stationery_stock_v2', JSON.stringify(defaultStock)) }
    const savedHistory = localStorage.getItem('btc_stock_history')
    if (savedHistory) { try { setHistory(JSON.parse(savedHistory)) } catch (e) { setHistory([]) } }
  }, [])

  const saveStock = (newStock) => { setStock(newStock); localStorage.setItem('btc_stationery_stock_v2', JSON.stringify(newStock)) }
  const saveHistory = (newHistory) => { setHistory(newHistory); localStorage.setItem('btc_stock_history', JSON.stringify(newHistory)) }

  const addHistoryEntry = (item, type, qty, remarksText) => {
    const entry = { id: Date.now(), date: new Date().toISOString(), itemId: item.id, itemName: item.name, type, quantity: qty, unit: item.unit, remarks: remarksText || '', performedBy: user.username || 'Admin', balanceAfter: type === 'IN' ? item.currentStock + qty : item.currentStock - qty }
    saveHistory([entry, ...history])
  }

  const openAddModal = (item) => { setSelectedItem(item); setQuantity(''); setRemarks(''); setShowAddModal(true) }
  const openRemoveModal = (item) => { setSelectedItem(item); setQuantity(''); setRemarks(''); setShowRemoveModal(true) }

  const handleAddStock = (e) => {
    e.preventDefault()
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) { alert('Please enter a valid quantity!'); return }
    const updatedStock = stock.map(item => item.id === selectedItem.id ? { ...item, currentStock: item.currentStock + qty } : item)
    saveStock(updatedStock)
    addHistoryEntry(selectedItem, 'IN', qty, remarks)
    setShowAddModal(false)
    alert(`✅ Added ${qty} ${selectedItem.unit} of ${selectedItem.name}!`)
  }

  const handleRemoveStock = (e) => {
    e.preventDefault()
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) { alert('Please enter a valid quantity!'); return }
    if (qty > selectedItem.currentStock) { alert(`❌ Cannot remove ${qty}. Only ${selectedItem.currentStock} available!`); return }
    const updatedStock = stock.map(item => item.id === selectedItem.id ? { ...item, currentStock: item.currentStock - qty, used: (item.used || 0) + qty } : item)
    saveStock(updatedStock)
    addHistoryEntry(selectedItem, 'OUT', qty, remarks)
    setShowRemoveModal(false)
    alert(`✅ Removed ${qty} ${selectedItem.unit} of ${selectedItem.name}!`)
  }

  const getStockStatus = (current, threshold) => {
    if (current <= threshold) return { color: 'bg-red-100 text-red-700 border-red-300', text: '🔴 LOW', level: 'low' }
    if (current <= threshold * 2) return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: '🟡 MODERATE', level: 'moderate' }
    return { color: 'bg-green-100 text-green-700 border-green-300', text: '🟢 GOOD', level: 'good' }
  }

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

  const filteredStock = stock.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false
    if (!searchQuery) return true
    return item.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalItems = stock.length
  const lowStockItems = stock.filter(s => s.currentStock <= s.threshold)
  const totalValue = stock.reduce((sum, s) => sum + (s.currentStock * (s.pricePerUnit || 0)), 0)
  const totalUsed = stock.reduce((sum, s) => sum + (s.used || 0), 0)
  const documentItems = stock.filter(s => s.category === 'document')
  const stationeryItems = stock.filter(s => s.category === 'stationery')

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📦 Stock Management</h1>
            <p className="text-gray-500 mt-1">Track all document books, stationery & consumables</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setActiveTab('history')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">📜 History</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">← Dashboard</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-blue-100 text-xs font-medium uppercase">Total Items</div>
            <div className="text-3xl font-bold mt-2">{totalItems}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-green-100 text-xs font-medium uppercase">Stock Value</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-orange-100 text-xs font-medium uppercase">Low Stock</div>
            <div className="text-3xl font-bold mt-2">{lowStockItems.length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-purple-100 text-xs font-medium uppercase">Total Used</div>
            <div className="text-3xl font-bold mt-2">{totalUsed}</div>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-red-800 text-lg">⚠️ Low Stock Alert!</p>
                <p className="text-sm text-red-700 mt-1"><strong>{lowStockItems.map(i => i.name).join(', ')}</strong> — reorder karo!</p>
              </div>
              <button onClick={() => setFilterCategory('all')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"> View All Stock</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 font-bold whitespace-nowrap transition ${activeTab === 'overview' ? 'text-blue-700 border-b-4 border-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}> Overview</button>
            <button onClick={() => setActiveTab('document')} className={`px-6 py-3 font-bold whitespace-nowrap transition ${activeTab === 'document' ? 'text-blue-700 border-b-4 border-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>📄 Document Books ({documentItems.length})</button>
            <button onClick={() => setActiveTab('stationery')} className={`px-6 py-3 font-bold whitespace-nowrap transition ${activeTab === 'stationery' ? 'text-blue-700 border-b-4 border-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>📦 Stationery ({stationeryItems.length})</button>
            <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-bold whitespace-nowrap transition ${activeTab === 'history' ? 'text-blue-700 border-b-4 border-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>📜 History ({history.length})</button>
          </div>
        </div>

        {activeTab !== 'history' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="p-2.5 border border-gray-300 rounded-lg">
                <option value="all">All Categories</option>
                <option value="document"> Document Books</option>
                <option value="stationery">📦 Stationery</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📄 Document Books ({documentItems.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentItems.map(item => {
                  const status = getStockStatus(item.currentStock, item.threshold)
                  return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${status.level === 'low' ? 'border-red-500' : status.level === 'moderate' ? 'border-yellow-500' : 'border-green-500'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1"><h3 className="text-lg font-bold text-gray-800">{item.name}</h3><p className="text-xs text-gray-500">Unit: {item.unit}</p></div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>{status.text}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Stock</div><div className={`text-xl font-bold ${item.currentStock <= item.threshold ? 'text-red-600' : 'text-gray-800'}`}>{item.currentStock}</div></div>
                        <div className="text-center bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Used</div><div className="text-xl font-bold text-blue-600">{item.used || 0}</div></div>
                        <div className="text-center bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Value</div><div className="text-sm font-bold text-green-600">{formatCurrency(item.currentStock * (item.pricePerUnit || 0))}</div></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openAddModal(item)} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm">➕ Add</button>
                        <button onClick={() => openRemoveModal(item)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-sm">➖ Use</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Stationery & Consumables ({stationeryItems.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stationeryItems.map(item => {
                  const status = getStockStatus(item.currentStock, item.threshold)
                  return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${status.level === 'low' ? 'border-red-500' : status.level === 'moderate' ? 'border-yellow-500' : 'border-green-500'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1"><h3 className="text-lg font-bold text-gray-800">{item.name}</h3><p className="text-xs text-gray-500">Unit: {item.unit}</p></div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>{status.text}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Stock</div><div className={`text-xl font-bold ${item.currentStock <= item.threshold ? 'text-red-600' : 'text-gray-800'}`}>{item.currentStock}</div></div>
                        <div className="text-center bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Used</div><div className="text-xl font-bold text-blue-600">{item.used || 0}</div></div>
                        <div className="text-center bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Value</div><div className="text-sm font-bold text-green-600">{formatCurrency(item.currentStock * (item.pricePerUnit || 0))}</div></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openAddModal(item)} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm">➕ Add</button>
                        <button onClick={() => openRemoveModal(item)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-sm">➖ Use</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'document' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStock.filter(s => s.category === 'document').map(item => {
              const status = getStockStatus(item.currentStock, item.threshold)
              return (
                <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${status.level === 'low' ? 'border-red-500' : status.level === 'moderate' ? 'border-yellow-500' : 'border-green-500'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">{item.currentStock} <span className="text-sm text-gray-500">{item.unit}</span></div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openAddModal(item)} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm">➕ Add</button>
                    <button onClick={() => openRemoveModal(item)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-sm">➖ Use</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'stationery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStock.filter(s => s.category === 'stationery').map(item => {
              const status = getStockStatus(item.currentStock, item.threshold)
              return (
                <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${status.level === 'low' ? 'border-red-500' : status.level === 'moderate' ? 'border-yellow-500' : 'border-green-500'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">{item.currentStock} <span className="text-sm text-gray-500">{item.unit}</span></div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openAddModal(item)} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm">➕ Add</button>
                    <button onClick={() => openRemoveModal(item)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-sm">➖ Use</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📜 Stock History ({history.length})</h2>
              {history.length > 0 && <button onClick={() => { if (window.confirm('Clear all history?')) saveHistory([]) }} className="text-sm text-red-600 hover:text-red-800">️ Clear History</button>}
            </div>
            {history.length === 0 ? (
              <div className="p-12 text-center text-gray-500"><div className="text-6xl mb-4">📭</div><p>No stock history yet.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Item</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(entry.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{entry.itemName}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${entry.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{entry.type === 'IN' ? '➕ IN' : '➖ OUT'}</span></td>
                        <td className="px-4 py-3 text-center text-sm font-bold"><span className={entry.type === 'IN' ? 'text-green-700' : 'text-orange-700'}>{entry.type === 'IN' ? '+' : '-'}{entry.quantity} {entry.unit}</span></td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-800">{entry.balanceAfter}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.remarks || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{entry.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showAddModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-green-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">➕ Add Stock</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✖</button>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800 font-bold">{selectedItem.name}</p>
                <p className="text-xs text-green-600 mt-1">Current Stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong></p>
              </div>
              <form onSubmit={handleAddStock}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
                <input type="number" required min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold mb-3" placeholder="e.g., 100" autoFocus />
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg mb-4" placeholder="e.g., Purchased from ABC Stationers" />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">✅ Add Stock</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRemoveModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-orange-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">➖ Use / Remove Stock</h3>
                <button onClick={() => setShowRemoveModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✖</button>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800 font-bold">{selectedItem.name}</p>
                <p className="text-xs text-orange-600 mt-1">Available: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong></p>
              </div>
              <form onSubmit={handleRemoveStock}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Use *</label>
                <input type="number" required min="1" max={selectedItem.currentStock} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold mb-3" placeholder="e.g., 10" autoFocus />
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg mb-4" placeholder="e.g., Used for daily printing" />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">✅ Remove Stock</button>
                  <button type="button" onClick={() => setShowRemoveModal(false)} className="flex-1 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
