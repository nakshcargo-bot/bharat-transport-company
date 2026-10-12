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
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [actionType, setActionType] = useState('IN')

  const defaultStock = [
    { id: 1, name: 'Bilty / LR Books', category: 'print', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 150, used: 0 },
    { id: 2, name: 'Money Receipt (MR) Books', category: 'print', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 120, used: 0 },
    { id: 3, name: 'Gadi Challan Books', category: 'print', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 130, used: 0 },
    { id: 4, name: 'Billing / Invoice Books', category: 'print', currentStock: 500, threshold: 50, unit: 'Books', pricePerUnit: 140, used: 0 },
    { id: 5, name: 'Gate Pass Books', category: 'print', currentStock: 300, threshold: 30, unit: 'Books', pricePerUnit: 100, used: 0 },
    { id: 6, name: 'POD Books', category: 'print', currentStock: 300, threshold: 30, unit: 'Books', pricePerUnit: 100, used: 0 },
    { id: 7, name: 'A4 Paper Reams', category: 'stationery', currentStock: 100, threshold: 20, unit: 'Reams', pricePerUnit: 250, used: 0 },
    { id: 8, name: 'Printer Ink (Black)', category: 'stationery', currentStock: 50, threshold: 10, unit: 'Cartridges', pricePerUnit: 500, used: 0 },
    { id: 9, name: 'Dot Matrix Ribbon', category: 'stationery', currentStock: 40, threshold: 10, unit: 'Ribbons', pricePerUnit: 200, used: 0 },
  ]

  useEffect(() => {
    const savedStock = localStorage.getItem('btc_stock_v3')
    if (savedStock) {
      setStock(JSON.parse(savedStock))
    } else {
      setStock(defaultStock)
      localStorage.setItem('btc_stock_v3', JSON.stringify(defaultStock))
    }

    const savedHistory = localStorage.getItem('btc_stock_history_v3')
    if (savedHistory) setHistory(JSON.parse(savedHistory))
  }, [])

  const saveStock = (newStock) => {
    setStock(newStock)
    localStorage.setItem('btc_stock_v3', JSON.stringify(newStock))
  }

  const saveHistory = (newHistory) => {
    setHistory(newHistory)
    localStorage.setItem('btc_stock_history_v3', JSON.stringify(newHistory))
  }

  const handleStockUpdate = (e) => {
    e.preventDefault()
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) return alert('Valid quantity daalo!')

    const updatedStock = stock.map(item => {
      if (item.id === selectedItem.id) {
        const newStockCount = actionType === 'IN' ? item.currentStock + qty : item.currentStock - qty
        if (actionType === 'OUT' && newStockCount < 0) {
          alert('Stock khatam ho gaya! Itna remove nahi kar sakte.')
          return item
        }
        return { ...item, currentStock: newStockCount }
      }
      return item
    })

    saveStock(updatedStock)

    const historyEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      itemName: selectedItem.name,
      type: actionType,
      qty: qty,
      user: user.username || 'Admin'
    }
    saveHistory([historyEntry, ...history])

    setShowModal(false)
    setQuantity('')
    alert(`✅ ${selectedItem.name} updated!`)
  }

  const printStock = stock.filter(s => s.category === 'print')
  const stationeryStock = stock.filter(s => s.category === 'stationery')
  const lowStockItems = stock.filter(s => s.currentStock <= s.threshold)
  const totalValue = stock.reduce((sum, s) => sum + (s.currentStock * (s.pricePerUnit || 0)), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🖨️ Paper & Print Stock</h1>
            <p className="text-gray-500">Bilty, Bill, MR, Challan aur Stationery ka hisab</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Back</button>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-red-800 text-lg">⚠️ Low Stock Alert!</h3>
            <p className="text-red-700 mt-1">
              Ye items khatam hone wale hain: <strong>{lowStockItems.map(i => i.name).join(', ')}</strong>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-blue-100 text-xs font-medium uppercase">Total Items</div>
            <div className="text-3xl font-bold mt-2">{stock.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-green-100 text-xs font-medium uppercase">Stock Value</div>
            <div className="text-2xl font-bold mt-2">₹{totalValue.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-orange-100 text-xs font-medium uppercase">Low Stock</div>
            <div className="text-3xl font-bold mt-2">{lowStockItems.length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-5 shadow-lg">
            <div className="text-purple-100 text-xs font-medium uppercase">History</div>
            <div className="text-3xl font-bold mt-2">{history.length}</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🖨️ Print Books ({printStock.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printStock.map(item => {
              const isLow = item.currentStock <= item.threshold
              return (
                <div key={item.id} className={`bg-white rounded-xl shadow-lg p-6 border-l-8 ${isLow ? 'border-red-500' : 'border-green-500'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                    {isLow && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">LOW</span>}
                  </div>
                  <div className="text-4xl font-bold text-gray-800 mb-2">{item.currentStock}</div>
                  <div className="text-sm text-gray-500 mb-4">{item.unit} • Threshold: {item.threshold}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedItem(item); setActionType('IN'); setShowModal(true) }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                       Add
                    </button>
                    <button 
                      onClick={() => { setSelectedItem(item); setActionType('OUT'); setShowModal(true) }}
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

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Stationery ({stationeryStock.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stationeryStock.map(item => {
              const isLow = item.currentStock <= item.threshold
              return (
                <div key={item.id} className={`bg-white rounded-xl shadow-lg p-6 border-l-8 ${isLow ? 'border-red-500' : 'border-green-500'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                    {isLow && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">LOW</span>}
                  </div>
                  <div className="text-4xl font-bold text-gray-800 mb-2">{item.currentStock}</div>
                  <div className="text-sm text-gray-500 mb-4">{item.unit} • Threshold: {item.threshold}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedItem(item); setActionType('IN'); setShowModal(true) }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                      ➕ Add
                    </button>
                    <button 
                      onClick={() => { setSelectedItem(item); setActionType('OUT'); setShowModal(true) }}
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

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">📜 History ({history.length})</h2>
          </div>
          {history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p>No stock history yet.</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4 text-center">Type</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-left">By</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b">
                    <td className="p-4 text-sm">{h.date}</td>
                    <td className="p-4 font-medium">{h.itemName}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${h.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {h.type === 'IN' ? 'ADDED' : 'USED'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold">{h.qty}</td>
                    <td className="p-4 text-sm text-gray-500">{h.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">
                {actionType === 'IN' ? '➕ Add Stock' : ' Use Stock'}: {selectedItem?.name}
              </h3>
              <form onSubmit={handleStockUpdate}>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="w-full p-3 border rounded-lg mb-4 text-lg" 
                  placeholder="Quantity (e.g. 100)" 
                  autoFocus 
                  required 
                />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-400 text-white rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
