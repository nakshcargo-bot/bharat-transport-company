import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function GadiChallanPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchChallanData()
  }, [])

  const fetchChallanData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const id = searchParams.get('id')
      if (!id) {
        setError('No challan ID provided')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      const res = await fetch(`${apiUrl}/api/gadi-challan/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch challan details')
      }

      const data = await res.json()
      setChallan(data)
    } catch (err) {
      console.error('Error fetching challan:', err)
      setError(err.message || 'Failed to load challan details')
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
          <p className="mt-4 text-gray-600">Loading Challan Details...</p>
          <button 
            onClick={() => navigate('/gadi-challan')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ← Back to Gadi Challan
          </button>
        </div>
      </div>
    )
  }

  if (error || !challan) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Challan</h2>
          <p className="text-gray-600 mb-4">{error || 'Challan not found'}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={fetchChallanData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Retry
            </button>
            <button 
              onClick={() => navigate('/gadi-challan')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Print Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 print:hidden flex justify-between items-center">
          <button 
            onClick={() => navigate('/gadi-challan')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
          >
            🖨️ Print Challan
          </button>
        </div>

        {/* Challan Print Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">GADI CHALLAN</h1>
            <p className="text-gray-600 mt-1">Transport Document</p>
            <p className="text-sm text-gray-500 mt-2">Challan No: <strong>{challan.challan_no}</strong></p>
            <p className="text-sm text-gray-500">Date: {new Date(challan.issue_date).toLocaleDateString('en-IN')}</p>
          </div>

          {/* Challan Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Vehicle Details</h3>
              <p><strong>Vehicle No:</strong> {challan.vehicle_no || 'N/A'}</p>
              <p><strong>Driver Name:</strong> {challan.driver_name || 'N/A'}</p>
              <p><strong>Driver Mobile:</strong> {challan.driver_mobile || 'N/A'}</p>
              {challan.driver_license && <p><strong>License No:</strong> {challan.driver_license}</p>}
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Owner Details</h3>
              <p><strong>Owner Name:</strong> {challan.owner_name || 'N/A'}</p>
              <p><strong>Owner Mobile:</strong> {challan.owner_mobile || 'N/A'}</p>
              {challan.broker_name && (
                <>
                  <p><strong>Broker:</strong> {challan.broker_name}</p>
                  <p><strong>Broker Mobile:</strong> {challan.broker_mobile || 'N/A'}</p>
                </>
              )}
            </div>
          </div>

          {/* Route Details */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Route Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>From:</strong> {challan.from_place || 'N/A'}</p>
              <p><strong>To:</strong> {challan.to_place || 'N/A'}</p>
            </div>
          </div>

          {/* Consignment Details */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Consignor & Consignee</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-gray-700">Consignor (Sender)</p>
                <p>{challan.consignor_name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Consignee (Receiver)</p>
                <p>{challan.consignee_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Material Details */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Material Details</h3>
            <p><strong>Material:</strong> {challan.material_desc || 'N/A'}</p>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <p><strong>Weight:</strong> {challan.weight || '0'} {challan.weight ? 'Kg' : ''}</p>
              <p><strong>Packages:</strong> {challan.packages || '0'}</p>
              {challan.bilty_date && <p><strong>Bilty Date:</strong> {new Date(challan.bilty_date).toLocaleDateString('en-IN')}</p>}
            </div>
          </div>

          {/* Financial Details */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Financial Details</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2"><strong>Freight Amount:</strong></td>
                  <td className="py-2 text-right">₹{parseFloat(challan.freight_amount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2"><strong>Advance Paid:</strong></td>
                  <td className="py-2 text-right">₹{parseFloat(challan.advance_paid || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2"><strong>Toll Expense:</strong></td>
                  <td className="py-2 text-right">₹{parseFloat(challan.toll_expense || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2"><strong>Diesel Expense:</strong></td>
                  <td className="py-2 text-right">₹{parseFloat(challan.diesel_expense || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2"><strong>Other Expense:</strong></td>
                  <td className="py-2 text-right">₹{parseFloat(challan.other_expense || 0).toLocaleString('en-IN')}</td>
                </tr>
                {challan.tds_deduction > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2"><strong>TDS Deduction:</strong></td>
                    <td className="py-2 text-right">₹{parseFloat(challan.tds_deduction || 0).toLocaleString('en-IN')}</td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold">
                  <td className="py-3"><strong>NET PAYABLE:</strong></td>
                  <td className="py-3 text-right text-lg">₹{parseFloat(challan.net_payable || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 mb-8">Prepared By</p>
                <p className="font-semibold">_______________</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-8">Checked By</p>
                <p className="font-semibold">_______________</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-8">Driver Signature</p>
                <p className="font-semibold">_______________</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 print:mt-8">
            <p>This is a computer generated document</p>
            <p>© 2026 Bharat Transport Company</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
        }
      `}</style>
    </div>
  )
}
