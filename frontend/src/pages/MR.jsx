import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MR() {
  const navigate = useNavigate()
  const [mrs, setMrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMRs()
  }, [])

  const fetchMRs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/mr`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setMrs(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMRs = mrs.filter(mr => {
    if (filter === 'all') return true
    if (filter === 'advance') return mr.is_advance === 1
    if (filter === 'bilty') return mr.bilty_id
    if (filter === 'bill') return mr.bill_id
    return true
  })

  const handleDelete = async (id) => {
    if (!confirm('क्या आप इस MR को delete करना चाहते हैं?')) return
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      await fetch(`${apiUrl}/api/mr/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchMRs()
      alert('MR deleted successfully')
    } catch (err) {
      alert('Error deleting MR')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-lg">💰 Money Receipts ({mrs.length})</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/mr/create')} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm">+ New MR</button>
            <button onClick={() => navigate('/')} className="bg-red-800 text-white px-4 py-1 rounded font-bold text-sm">← Dashboard</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow p-3 mb-4 flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All MRs' },
            { id: 'advance', label: 'Advance Payments' },
            { id: 'bilty', label: 'Bilty Payments' },
            { id: 'bill', label: 'Bill Payments' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded text-sm font-bold transition ${filter === f.id ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-20">Loading...</div> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-sm font-bold">MR No</th>
                  <th className="p-3 text-left text-sm font-bold">Date</th>
                  <th className="p-3 text-left text-sm font-bold">Party Name</th>
                  <th className="p-3 text-left text-sm font-bold">Type</th>
                  <th className="p-3 text-left text-sm font-bold">Linked To</th>
                  <th className="p-3 text-left text-sm font-bold">Amount</th>
                  <th className="p-3 text-left text-sm font-bold">Mode</th>
                  <th className="p-3 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMRs.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">No MRs found</td></tr>
                ) : filteredMRs.map(mr => (
                  <tr key={mr.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold text-red-700">{mr.mr_no}</td>
                    <td className="p-3 text-sm">{mr.mr_date}</td>
                    <td className="p-3 text-sm font-medium">{mr.party_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${mr.is_advance === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {mr.is_advance === 1 ? 'Advance' : 'Payment'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {mr.bilty_lr_no && <div className="text-blue-700 font-bold">Bilty: {mr.bilty_lr_no}</div>}
                      {mr.bill_no && <div className="text-purple-700 font-bold">Bill: {mr.bill_no}</div>}
                      {!mr.bilty_lr_no && !mr.bill_no && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-3 font-bold">₹{parseFloat(mr.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-sm">{mr.payment_mode}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => navigate('/mr/print', { state: { mr } })} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">🖨️</button>
                        <button onClick={() => handleDelete(mr.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
