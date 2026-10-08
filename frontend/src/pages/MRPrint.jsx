import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function MRPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mr, setMr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMRData()
  }, [])

  const fetchMRData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const id = searchParams.get('id')
      if (!id) {
        setError('No MR ID provided in URL')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      const res = await fetch(`${apiUrl}/api/mr/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch MR details')
      }

      const data = await res.json()
      setMr(data) // Backend should return the MR object
    } catch (err) {
      console.error('Error fetching MR:', err)
      setError(err.message || 'Failed to load MR details')
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          <p className="mt-4 text-gray-600">Loading Money Receipt...</p>
          <button onClick={() => navigate('/mr')} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            ← Back to MR List
          </button>
        </div>
      </div>
    )
  }

  if (error || !mr) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Receipt</h2>
          <p className="text-gray-600 mb-4">{error || 'Money Receipt not found'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchMRData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">🔄 Retry</button>
            <button onClick={() => navigate('/mr')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">← Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Print Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 print:hidden flex justify-between items-center">
          <button onClick={() => navigate('/mr')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            ← Back
          </button>
          <button onClick={handlePrint} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
            🖨️ Print Receipt
          </button>
        </div>

        {/* Receipt Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none border border-gray-200">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">MONEY RECEIPT</h1>
            <p className="text-gray-600 mt-1">Bharat Transport Company</p>
            <div className="mt-3 flex justify-between text-sm">
              <p><strong>MR No:</strong> <span className="text-lg text-green-700">{mr.mr_no}</span></p>
              <p><strong>Date:</strong> {mr.mr_date ? new Date(mr.mr_date).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>
          </div>

          {/* Party Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2">Received From:</h3>
            <p className="text-lg font-semibold text-gray-900">{mr.party_name || 'N/A'}</p>
            <p className="text-sm text-gray-600">Party Type: {mr.party_type || 'N/A'}</p>
          </div>

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3 border-b border-gray-300 pb-1">Payment Details</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 w-1/3">Payment Mode</td>
                  <td className="py-3 font-semibold">{mr.payment_mode || 'Cash'}</td>
                </tr>
                {mr.bilty_lr_no && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 text-gray-600">Against LR / Bilty No</td>
                    <td className="py-3 font-semibold text-blue-700">{mr.bilty_lr_no}</td>
                  </tr>
                )}
                {mr.bill_no && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 text-gray-600">Against Bill No</td>
                    <td className="py-3 font-semibold text-blue-700">{mr.bill_no}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600">Advance Payment</td>
                  <td className="py-3 font-semibold">{mr.is_advance ? 'Yes' : 'No'}</td>
                </tr>
                <tr className="bg-green-50 font-bold text-lg">
                  <td className="py-4 text-green-800">AMOUNT RECEIVED</td>
                  <td className="py-4 text-right text-green-800">₹{parseFloat(mr.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          {mr.remarks && (
            <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm font-bold text-yellow-800">Remarks:</p>
              <p className="text-sm text-yellow-700">{mr.remarks}</p>
            </div>
          )}

          {/* Footer / Signatures */}
          <div className="mt-12 pt-4 border-t border-gray-300">
            <div className="flex justify-between items-end">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-8">Prepared By</p>
                <p className="font-semibold border-t border-gray-400 pt-1 w-32">{mr.created_by || 'Admin'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-8">Authorized Signatory</p>
                <p className="font-semibold border-t border-gray-400 pt-1 w-40">For Bharat Transport</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400 print:mt-12">
            <p>This is a computer generated receipt and does not require a physical signature.</p>
            <p>© 2026 Bharat Transport Company • Professional Multi-Branch TMS</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:mt-12 { margin-top: 3rem !important; }
        }
      `}</style>
    </div>
  )
}
