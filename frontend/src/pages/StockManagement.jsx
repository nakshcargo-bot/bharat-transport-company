import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function StockManagement() {
  const navigate = useNavigate()
  
  // 🔒 ADMIN ONLY CHECK
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const [stock, setStock] = useState([])
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [addQuantity, setAddQuantity] = useState('')

  const defaultStock = [
    { id: 1, name: 'Bilty / LR', currentStock: 500, threshold: 50, unit: 'Books' },
    { id: 2, name: 'Money Receipt (MR)', currentStock: 500, threshold: 50, unit: 'Books' },
    { id: 3, name: 'Gadi Challan', currentStock: 500, threshold: 50, unit: 'Books' },
    { id: 4, name: 'Billing / Invoice', currentStock: 500, threshold: 50, unit: 'Books' }
  ]

  useEffect(() => {
    const savedStock = localStorage.getItem('btc_stationery_stock')
    if (savedStock) {
      setStock(JSON.parse(savedStock))
    } else {
      setStock(defaultStock)
      localStorage.setItem('btc_stationery_stock', JSON.stringify(defaultStock))
    }
  }, [])

  const saveStock = (newStock) => {
    setStock(newStock)
    localStorage.setItem('btc_stationery_stock', JSON.stringify(newStock))
  }

  const openUpdateModal = (item) => {
    setSelectedItem(item)
    setAddQuantity('')
    setShowUpdateModal(true)
  }

  const handleUpdateStock = (e) => {
    e.preventDefault()
    if (!addQuantity || parseInt(addQuantity) <= 0) {
      alert('Please enter a valid quantity to add!')
      return
    }
    const updatedStock = stock.map(item => {
      if (item.id === selectedItem.id) {
        return { ...item, currentStock: item.currentStock + parseInt(addQuantity) }
      }
      return item
    })
    saveStock(updatedStock)
    setShowUpdateModal(false)
    alert(`✅ Successfully added ${addQuantity} ${selectedItem.unit} of ${selectedItem.name}!`)
  }

  const getStockStatus = (current, threshold) => {
    if (current <= threshold) return { color: 'bg-red-100 text-red-700 border-red-300', text: '🔴 LOW STOCK' }
    if (current <= threshold * 2) return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: '🟡 Moderate' }
    return { color: 'bg-green-100 text-green-700 border-green-300', text: '🟢 Good' }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📦 Stationery Stock Management</h1>
            <p className="text-gray-500 mt-1">Track and update your physical printing stock</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">← Back to Dashboard</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stock.map(item => {
            const status = getStockStatus(item.currentStock, item.threshold)
            return (
              <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-6 border-l-8 ${status.color.includes('red') ? 'border-red-500' : status.color.includes('yellow') ? 'border-yellow-500' : 'border-green-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">Unit: {item.unit}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>{status.text}</span>
                </div>
                <div className="flex items-end justify-between mt-6">
                  <div>
                    <div className="text-sm text-gray-500">Current Stock</div>
                    <div className={`text-4xl font-bold ${item.currentStock <= item.threshold ? 'text-red-600' : 'text-gray-800'}`}>{item.currentStock}</div>
                    <div className="text-xs text-gray-400 mt-1">Alert Threshold: {item.threshold}</div>
                  </div>
                  <button onClick={() => openUpdateModal(item)} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md transition flex items-center gap-2">➕ Add Stock</button>
                </div>
              </div>
            )
          })}
        </div>

        {showUpdateModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-blue-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">➕ Add New Stock: {selectedItem.name}</h3>
              <p className="text-sm text-gray-600 mb-4">Current Stock: <span className="font-bold">{selectedItem.currentStock}</span> {selectedItem.unit}</p>
              <form onSubmit={handleUpdateStock}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
                <input type="number" required min="1" value={addQuantity} onChange={(e) => setAddQuantity(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-bold mb-4" placeholder="e.g., 100" autoFocus />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">✅ Update Stock</button>
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="flex-1 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
