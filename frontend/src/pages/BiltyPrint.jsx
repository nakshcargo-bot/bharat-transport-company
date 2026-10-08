import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function BiltyPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [bilty, setBilty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBiltyData()
  }, [])

  const fetchBiltyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const lrNo = searchParams.get('lr_no')
      if (!lrNo) {
        setError('No LR Number provided')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      const res = await fetch(`${apiUrl}/api/consignments/track?lr_no=${encodeURIComponent(lrNo)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch bilty details')
      }

      const data = await res.json()
      setBilty(data)
    } catch (err) {
      console.error('Error fetching bilty:', err)
      setError(err.message || 'Failed to load bilty details')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          <p className="mt-4 text-gray-600">Loading Bilty Details...</p>
          <button 
            onClick={() => navigate('/consignments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Bilties
          </button>
        </div>
      </div>
    )
  }

  if (error || !bilty) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Bilty</h2>
          <p className="text-gray-600 mb-4">{error || 'Bilty not found'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchBiltyData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">🔄 Retry</button>
            <button onClick={() => navigate('/consignments')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">← Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 mb-4 print:hidden flex justify-between items-center">
          <button onClick={() => navigate('/consignments')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">← Back</button>
          <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">🖨️ Print Bilty</button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">TRANSPORT RECEIPT (BILTY)</h1>
            <p className="text-gray-600 mt-1">LR No: <strong>{bilty.lr_no}</strong></p>
            <p className="text-sm text-gray-500">Date: {bilty.lr_date ? new Date(bilty.lr_date).toLocaleDateString('en-IN') : 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-700 mb-2">Consignor (Sender)</h3>
              <p className="font-semibold">{bilty.consignor_name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{bilty.from_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-2">Consignee (Receiver)</h3>
              <p className="font-semibold">{bilty.consignee_name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{bilty.to_name || 'N/A'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              bilty.status === 'Delivered' ? 'bg-green-100 text-green-700' :
              bilty.status === 'In-Transit' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {bilty.status || 'Booked'}
            </span>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>© 2026 Bharat Transport Company</p>
          </div>
        </div>
      </div>
    </div>
  )
}
