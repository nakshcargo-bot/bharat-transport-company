import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function StockManagement() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const [stock, setStock] = useState([])
  const [history, setHistory] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [remarks, setRemarks] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Default stock with all categories
  const defaultStock = [
    // 📄 PRINT BOOKS
    { id: 1, name: 'Bilty / LR Books', category: 'print', totalStock: 500, usedStock: 0, pendingStock: 0, threshold: 50, unit: 'Books', pricePerUnit: 150 },
    { id: 2, name: 'Money Receipt (MR) Books', category: 'print', totalStock: 500, usedStock: 0, pendingStock: 0, threshold: 50, unit: 'Books', pricePerUnit: 120 },
    { id: 3, name: 'Gadi Challan Books', category: 'print', totalStock: 500, usedStock: 0, pendingStock: 0, threshold: 50, unit: 'Books', pricePerUnit: 130 },
    { id: 4, name: 'Billing / Invoice Books', category: 'print', totalStock: 500, usedStock: 0, pendingStock: 0, threshold: 50, unit: 'Books', pricePerUnit: 140 },
    { id: 5, name: 'Gate Pass Books', category: 'print', totalStock: 300, usedStock: 0, pendingStock: 0, threshold: 30, unit: 'Books', pricePerUnit: 100 },
    { id: 6, name: 'POD Books', category: 'print', totalStock: 300, usedStock: 0, pendingStock: 0, threshold: 30, unit: 'Books', pricePerUnit: 100 },
    
    // 📦 STATIONERY
    { id: 7, name: 'A4 Paper Reams', category: 'stationery', totalStock: 100, usedStock: 0, pendingStock: 0, threshold: 20, unit: 'Reams', pricePerUnit: 250 },
    { id: 8, name: 'Printer Ink (Black)', category: 'stationery', totalStock: 50, usedStock: 0, pendingStock: 0, threshold: 10, unit: 'Cartridges', pricePerUnit: 500 },
    { id: 9, name: 'Dot Matrix Ribbon', category: 'stationery', totalStock: 40, usedStock: 0, pendingStock: 0, threshold: 10, unit: 'Ribbons', pricePerUnit: 200 },
  ]

  useEffect(() => {
    const savedStock = localStorage.getItem('btc_stock_complete')
    if (savedStock) {
      try {
        setStock(JSON.parse(savedStock))
      } catch (e) {
        setStock(defaultStock)
        localStorage.setItem('btc_stock_complete', JSON.stringify(defaultStock))
      }
    } else {
      setStock(defaultStock)
      localStorage.setItem('btc_stock_complete', JSON.stringify(defaultStock))
    }

    const savedHistory = localStorage.getItem('btc_stock_history_complete')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        setHistory([])
      }
    }
  }, [])

  const saveStock = (newStock) => {
    setStock(newStock)
    localStorage.setItem('btc_stock_complete', JSON.stringify(newStock))
  }

  const saveHistory = (newHistory) => {
    setHistory(newHistory)
    localStorage.setItem('btc_stock_history_complete', JSON.stringify(newHistory))
  }

  const addHistoryEntry = (item, type, qty, remarksText) => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString('en-IN'),
      itemName: item.name,
      type,
      quantity: qty,
      unit: item.unit,
      remarks: remarksText || '',
      performedBy: user.username || 'Admin'
    }
    saveHistory([entry, ...history])
  }

  const handleAddStock = (e) => {
    e.preventDefault()
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      alert('️ Valid quantity daalo!')
      return
    }

    const updatedStock = stock.map(item => {
      if (item.id === selectedItem.id) {
        return { 
          ...item, 
          totalStock: item.totalStock + qty,
          pendingStock: item.pendingStock + qty
        }
      }
      return item
    })

    saveStock(updatedStock)
    addHistoryEntry(selectedItem, 'ADD', qty, remarks)
    setShowAddModal(false)
    setQuantity('')
    setRemarks('')
    alert(`✅ ${qty} ${selectedItem.unit} ${selectedItem.name} add ho gaye!`)
  }

  const handleRemoveStock = (e) => {
    e.preventDefault()
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      alert('⚠️ Valid quantity daalo!')
      return
    }

    const item = selectedItem
    const availableStock = item.totalStock - item.usedStock - item.pendingStock
    
    if (qty > availableStock) {
      alert(`❌ Sirf ${availableStock} ${item.unit} available hain!`)
      return
    }

    const updatedStock = stock.map(item => {
      if (item.id === selectedItem.id) {
        return { 
          ...item, 
          usedStock: item.usedStock + qty,
          pendingStock: item.pendingStock - qty
        }
      }
      return item
    })

    saveStock(updatedStock)
    addHistoryEntry(selectedItem, 'USE', qty, remarks)
    setShowRemoveModal(false)
    setQuantity('')
    setRemarks('')
    alert(`✅ ${qty} ${selectedItem.unit} ${selectedItem.name} use ho gaye!`)
  }

  const getAvailableStock = (item) => {
    return item.totalStock - item.usedStock - item.pendingStock
  }

  const getStockStatus = (item) => {
    const available = getAvailableStock(item)
    if (available <= item.threshold) return { color: 'red', text: 'LOW', bg: 'bg-red-500' }
    if (available <= item.threshold * 2) return { color: 'yellow', text: 'MODERATE', bg: 'bg-yellow-500' }
    return { color: 'green', text: 'GOOD', bg: 'bg-green-500' }
  }

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN')

  // Stats
  const totalItems = stock.length
  const totalValue = stock.reduce((sum, item) => sum + (getAvailableStock(item) * item.pricePerUnit), 0)
  const totalUsed = stock.reduce((sum, item) => sum + item.usedStock, 0)
  const totalPending = stock.reduce((sum, item) => sum + item.pendingStock, 0)
  const lowStockItems = stock.filter(item => getAvailableStock(item) <= item.threshold)

  const printStock = stock.filter(item => item.category === 'print')
  const stationeryStock = stock.filter(item => item.category === 'stationery')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📦 Complete Stock Management</h1>
            <p className="text-gray-500 mt-1">Running, Used, Pending Stock - Sab ek jagah</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            ← Back
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-blue-100 text-xs font-medium uppercase">Total Items</div>
            <div className="text-3xl font-bold mt-2">{totalItems}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-green-100 text-xs font-medium uppercase">Stock Value</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-orange-100 text-xs font-medium uppercase">Used Stock</div>
            <div className="text-3xl font-bold mt-2">{totalUsed}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-purple-100 text-xs font-medium uppercase">Pending</div>
            <div className="text-3xl font-bold mt-2">{totalPending}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-red-100 text-xs font-medium uppercase">Low Stock</div>
            <div className="text-3xl font-bold mt-2">{lowStockItems.length}</div>
          </div>
        </div>

        {/* LOW STOCK ALERT */}
        {lowStockItems.length > 0 && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-red-800 text-lg">⚠️ Low Stock Alert!</h3>
            <p className="text-red-700 mt-1">
              Ye items khatam hone wale hain: <strong>{lowStockItems.map(i => i.name).join(', ')}</strong>
            </p>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-4 mb-6 border-b">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-bold ${activeTab === 'overview' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500'}`}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('print')}
            className={`pb-3 px-4 font-bold ${activeTab === 'print' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500'}`}
          >
            🖨️ Print Books ({printStock.length})
          </button>
          <button 
            onClick={() => setActiveTab('stationery')}
            className={`pb-3 px-4 font-bold ${activeTab === 'stationery' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500'}`}
          >
            📦 Stationery ({stationeryStock.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-bold ${activeTab === 'history' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500'}`}
          >
            📜 History ({history.length})
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Print Books */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">️ Print Books</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {printStock.map(item => {
                  const status = getStockStatus(item)
                  const available = getAvailableStock(item)
                  return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-6 border-l-8 ${status.bg.replace('bg-', 'border-')}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${status.bg}`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Stock:</span>
                          <span className="font-bold text-gray-800">{item.totalStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Used:</span>
                          <span className="font-bold text-orange-600">{item.usedStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pending:</span>
                          <span className="font-bold text-purple-600">{item.pendingStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-bold text-gray-700">Available:</span>
                          <span className={`text-2xl font-bold ${available <= item.threshold ? 'text-red-600' : 'text-green-600'}`}>
                            {available} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedItem(item); setShowAddModal(true) }}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                        >
                          ➕ Add
                        </button>
                        <button 
                          onClick={() => { setSelectedItem(item); setShowRemoveModal(true) }}
                          className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
                        >
                          ➖ Use
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stationery */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4"> Stationery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stationeryStock.map(item => {
                  const status = getStockStatus(item)
                  const available = getAvailableStock(item)
                  return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-6 border-l-8 ${status.bg.replace('bg-', 'border-')}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${status.bg}`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Stock:</span>
                          <span className="font-bold text-gray-800">{item.totalStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Used:</span>
                          <span className="font-bold text-orange-600">{item.usedStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pending:</span>
                          <span className="font-bold text-purple-600">{item.pendingStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-bold text-gray-700">Available:</span>
                          <span className={`text-2xl font-bold ${available <= item.threshold ? 'text-red-600' : 'text-green-600'}`}>
                            {available} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedItem(item); setShowAddModal(true) }}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                        >
                          ➕ Add
                        </button>
                        <button 
                          onClick={() => { setSelectedItem(item); setShowRemoveModal(true) }}
                          className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
                        >
                          ➖ Use
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PRINT TAB */}
        {activeTab === 'print' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printStock.map(item => {
              const status = getStockStatus(item)
              const available = getAvailableStock(item)
              return (
                <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-6 border-l-8 ${status.bg.replace('bg-', 'border-')}`}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">{item.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between"><span>Total:</span><span className="font-bold">{item.totalStock}</span></div>
                    <div className="flex justify-between"><span>Used:</span><span className="font-bold text-orange-600">{item.usedStock}</span></div>
                    <div className="flex justify-between"><span>Pending:</span><span className="font-bold text-purple-600">{item.pendingStock}</span></div>
                    <div className="flex justify-between pt-2 border-t"><span>Available:</span><span className="font-bold text-green-600">{available}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedItem(item); setShowAddModal(true) }} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">➕ Add</button>
                    <button onClick={() => { setSelectedItem(item); setShowRemoveModal(true) }} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold">➖ Use</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* STATIONERY TAB */}
        {activeTab === 'stationery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stationeryStock.map(item => {
              const status = getStockStatus(item)
              const available = getAvailableStock(item)
              return (
                <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-6 border-l-8 ${status.bg.replace('bg-', 'border-')}`}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">{item.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between"><span>Total:</span><span className="font-bold">{item.totalStock}</span></div>
                    <div className="flex justify-between"><span>Used:</span><span className="font-bold text-orange-600">{item.usedStock}</span></div>
                    <div className="flex justify-between"><span>Pending:</span><span className="font-bold text-purple-600">{item.pendingStock}</span></div>
                    <div className="flex justify-between pt-2 border-t"><span>Available:</span><span className="font-bold text-green-600">{available}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedItem(item); setShowAddModal(true) }} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">➕ Add</button>
                    <button onClick={() => { setSelectedItem(item); setShowRemoveModal(true) }} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold">➖ Use</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">📜 Stock History ({history.length})</h2>
            </div>
            {history.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <p>Koi history nahi hai. Add/Use karo entries dekhne ke liye.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Item</th>
                      <th className="p-4 text-center">Type</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-left">Remarks</th>
                      <th className="p-4 text-left">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm">{h.date}</td>
                        <td className="p-4 font-medium">{h.itemName}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${h.type === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {h.type === 'ADD' ? '➕ ADDED' : '➖ USED'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold">{h.quantity} {h.unit}</td>
                        <td className="p-4 text-sm text-gray-600">{h.remarks || '-'}</td>
                        <td className="p-4 text-sm text-gray-500">{h.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADD MODAL */}
        {showAddModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">➕ Add Stock: {selectedItem.name}</h3>
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <p className="text-sm">Current Available: <strong>{getAvailableStock(selectedItem)} {selectedItem.unit}</strong></p>
              </div>
              <form onSubmit={handleAddStock}>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="w-full p-3 border rounded-lg mb-3 text-lg" 
                  placeholder="Quantity (e.g. 100)" 
                  autoFocus 
                  required 
                />
                <input 
                  type="text" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                  className="w-full p-3 border rounded-lg mb-4" 
                  placeholder="Remarks (optional)" 
                />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold">✅ Add Stock</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-400 text-white rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REMOVE MODAL */}
        {showRemoveModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">➖ Use Stock: {selectedItem.name}</h3>
              <div className="bg-orange-50 p-3 rounded-lg mb-4">
                <p className="text-sm">Available: <strong>{getAvailableStock(selectedItem)} {selectedItem.unit}</strong></p>
              </div>
              <form onSubmit={handleRemoveStock}>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="w-full p-3 border rounded-lg mb-3 text-lg" 
                  placeholder="Quantity (e.g. 10)" 
                  autoFocus 
                  required 
                />
                <input 
                  type="text" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                  className="w-full p-3 border rounded-lg mb-4" 
                  placeholder="Remarks (optional)" 
                />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold">✅ Use Stock</button>
                  <button type="button" onClick={() => setShowRemoveModal(false)} className="flex-1 py-3 bg-gray-400 text-white rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
