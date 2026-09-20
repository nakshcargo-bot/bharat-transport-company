import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function BillList() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      const res = await api.get('/api/bills')
      setBills(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = bills.filter(b => 
    b.bill_no?.toLowerCase().includes(search.toLowerCase()) ||
    b.party_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg">📋 Bill List</h1>
          <div className="flex gap-2">
            <Link to="/bill/new" className="bg-white text-red-700 px-4 py-2 rounded-lg text-sm font-medium">+ New Bill</Link>
            <button onClick={() => navigate('/dashboard')} className="bg-white/20 px-4 py-2 rounded-lg text-sm">← Back</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <input
          type="text"
          placeholder="Search by Bill No or Party Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 mb-4 border rounded-lg shadow-sm"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Bill No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Party</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Grand Total</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No bills found</td></tr>
              ) : filtered.map(bill => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-red-700">{bill.bill_no}</td>
                  <td className="px-4 py-3 text-sm">{bill.bill_date?.split('T')[0]}</td>
                  <td className="px-4 py-3 text-sm">{bill.party_name}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{Number(bill.grand_total || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">₹{Number(bill.net_balance || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/bill/print/${bill.bill_no}`} className="text-blue-600 hover:underline text-sm">View / Print</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
