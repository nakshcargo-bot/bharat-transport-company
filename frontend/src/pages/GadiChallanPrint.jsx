import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function GadiChallanPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const challanId = searchParams.get('id')
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (challanId) fetchChallanDetails()
  }, [challanId])

  const fetchChallanDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      const res = await fetch(`${apiUrl}/api/gadi-challan`, { headers })
      if (res.ok) {
        const data = await res.json()
        const foundChallan = (data.data || []).find(c => c.id === parseInt(challanId))
        if (foundChallan) {
          setChallan(foundChallan)
        }
      }
    } catch (err) {
      console.error('Error fetching challan details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700"></div>
          <p className="mt-4 text-gray-500">Loading Challan Details...</p>
        </div>
      </div>
    )
  }

  if (!challan) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Challan not found</p>
          <button onClick={() => navigate('/gadi-challan')} className="mt-4 px-6 py-2 bg-lime-700 text-white rounded-lg">Back to Challans</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls - Hidden in Print */}
      <div className="print:hidden bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-center gap-4">
          <button onClick={handlePrint} className="px-6 py-2 bg-lime-700 text-white rounded-lg font-bold hover:bg-lime-800 flex items-center gap-2">
            🖨️ Print Challan
          </button>
          <button onClick={() => navigate(`/gadi-challan?edit=${challan.id}`)} className="px-6 py-2 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800">
            ✏️ Edit Challan
          </button>
          <button onClick={() => navigate('/gadi-challan')} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700">
            ← Back
          </button>
        </div>
      </div>

      {/* Print Content */}
      <div className="max-w-5xl mx-auto p-8 bg-white shadow-lg my-8 print:my-0 print:shadow-none print:p-4">
        {/* Company Header */}
        <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">BHARAT TRANSPORT COMPANY</h1>
          <p className="text-sm text-gray-600 mt-1">Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023</p>
          <p className="text-sm text-gray-600">Email: bharattransportcompany@gmail.com | PAN: CMRPP0955N | GST: 08CMRPP0955N1Z5</p>
        </div>

        {/* Challan Title */}
        <div className="bg-lime-100 border-2 border-lime-600 p-6 mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🚛 GADI CHALLAN / BROKER SETTLEMENT</h2>
          <p className="text-xl font-bold text-lime-700">{challan.challan_no}</p>
          <p className="text-sm text-gray-600 mt-2">Issue Date: {new Date(challan.issue_date).toLocaleDateString('en-IN')}</p>
        </div>

        {/* LR & Vehicle Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-gray-400 p-4">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">📦 LR / Bilty Details</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">LR Number:</td>
                  <td className="py-2 font-bold text-lime-700">{challan.lr_no || '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Bilty Date:</td>
                  <td className="py-2">{challan.bilty_date ? new Date(challan.bilty_date).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Consignor:</td>
                  <td className="py-2 font-semibold">{challan.consignor_name || '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Consignee:</td>
                  <td className="py-2 font-semibold">{challan.consignee_name || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-gray-700">From → To:</td>
                  <td className="py-2">{challan.from_place || '-'} → {challan.to_place || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-2 border-gray-400 p-4">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2"> Vehicle & Driver Details</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Vehicle Number:</td>
                  <td className="py-2 font-bold">{challan.vehicle_no || '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Driver Name:</td>
                  <td className="py-2 font-semibold">{challan.driver_name || '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Driver Mobile:</td>
                  <td className="py-2">{challan.driver_mobile || '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Driver License:</td>
                  <td className="py-2">{challan.driver_license || '-'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Owner Name:</td>
                  <td className="py-2">{challan.owner_name || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-gray-700">Owner Mobile:</td>
                  <td className="py-2">{challan.owner_mobile || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cargo Details */}
        <div className="border-2 border-gray-400 p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">📦 Cargo Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-500 text-sm">Material</div>
              <div className="font-bold text-gray-800">{challan.material_desc || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Packages</div>
              <div className="font-bold text-gray-800">{challan.packages || '-'} Pcs</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Weight</div>
              <div className="font-bold text-gray-800">{challan.weight || '-'} Kg</div>
            </div>
          </div>
        </div>

        {/* Broker Details */}
        {challan.broker_name && (
          <div className="border-2 border-gray-400 p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🤝 Broker / Agent Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-sm">Broker Name</div>
                <div className="font-bold text-gray-800">{challan.broker_name}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Broker Mobile</div>
                <div className="font-bold text-gray-800">{challan.broker_mobile || '-'}</div>
              </div>
              {challan.broker_commission && (
                <div>
                  <div className="text-gray-500 text-sm">Broker Commission</div>
                  <div className="font-bold text-lime-700">{formatCurrency(challan.broker_commission)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Details */}
        <div className="border-2 border-gray-400 p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">💰 Financial Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-lime-50 p-3 rounded">
              <div className="text-gray-600 text-sm">Freight Amount</div>
              <div className="text-xl font-bold text-lime-700">{formatCurrency(challan.freight_amount)}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-gray-600 text-sm">Advance Paid</div>
              <div className="text-xl font-bold text-blue-700">{formatCurrency(challan.advance_paid)}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-gray-600 text-sm">Balance Due</div>
              <div className="text-xl font-bold text-yellow-700">{formatCurrency(challan.balance_due)}</div>
            </div>
            {challan.tds_deduction > 0 && (
              <div className="bg-red-50 p-3 rounded">
                <div className="text-gray-600 text-sm">TDS Deduction</div>
                <div className="text-xl font-bold text-red-700">{formatCurrency(challan.tds_deduction)}</div>
              </div>
            )}
            <div className="bg-purple-50 p-3 rounded col-span-2 md:col-span-1">
              <div className="text-gray-600 text-sm">Net Payable</div>
              <div className="text-2xl font-bold text-purple-700">{formatCurrency(challan.net_payable)}</div>
            </div>
          </div>
        </div>

        {/* Trip Expenses */}
        {(challan.diesel_expense || challan.toll_expense || challan.other_expense) && (
          <div className="border-2 border-gray-400 p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">💸 Trip Expenses</h3>
            <div className="grid grid-cols-3 gap-4">
              {challan.diesel_expense && (
                <div>
                  <div className="text-gray-500 text-sm">Diesel Expense</div>
                  <div className="font-bold text-gray-800">{formatCurrency(challan.diesel_expense)}</div>
                </div>
              )}
              {challan.toll_expense && (
                <div>
                  <div className="text-gray-500 text-sm">Toll Expense</div>
                  <div className="font-bold text-gray-800">{formatCurrency(challan.toll_expense)}</div>
                </div>
              )}
              {challan.other_expense && (
                <div>
                  <div className="text-gray-500 text-sm">Other Expense</div>
                  <div className="font-bold text-gray-800">{formatCurrency(challan.other_expense)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t-2 border-gray-400">
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-16"></div>
            <p className="text-sm font-semibold text-gray-700">Driver Signature</p>
            <p className="text-xs text-gray-500">{challan.driver_name}</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-16"></div>
            <p className="text-sm font-semibold text-gray-700">Broker/Owner Signature</p>
            <p className="text-xs text-gray-500">{challan.owner_name || challan.broker_name || '-'}</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-16"></div>
            <p className="text-sm font-semibold text-gray-700">Authorized Signatory</p>
            <p className="text-xs text-gray-500">Bharat Transport Company</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This challan is computer-generated and valid for settlement purposes.</p>
          <p className="mt-1">Thank you for your cooperation!</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:my-0 { margin-top: 0; margin-bottom: 0; }
          .print\\:shadow-none { box-shadow: none; }
          .print\\:p-4 { padding: 1rem; }
        }
      `}</style>
    </div>
  )
}
