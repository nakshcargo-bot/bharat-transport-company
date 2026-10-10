import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

export default function GadiChallanPrint() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchChallan()
  }, [id])

  const fetchChallan = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/gadi-challan/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChallan(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleWhatsApp = () => {
    if (!challan) return
    const msg = `*GADI CHALLAN*%0A%0A` +
      `Challan No: ${challan.challan_no}%0A` +
      `Date: ${new Date(challan.issue_date).toLocaleDateString('en-IN')}%0A` +
      `Vehicle: ${challan.vehicle_no}%0A` +
      `Driver: ${challan.driver_name}%0A` +
      `Route: ${challan.from_place} → ${challan.to_place}%0A` +
      `Freight: ₹${parseFloat(challan.freight_amount || 0).toLocaleString('en-IN')}%0A` +
      `%0A- Bharat Transport`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleEmail = () => {
    if (!challan) return
    const subject = `Gadi Challan - ${challan.challan_no}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}`
  }

  if (loading) return <div className="p-8 text-center">⏳ Loading...</div>
  if (!challan) return <div className="p-8 text-center text-red-600">Challan not found</div>

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      {/* Action Buttons - Print Only */}
      <div className="max-w-5xl mx-auto mb-4 flex gap-2 print:hidden">
        <button onClick={() => navigate('/gadi-challan')} className="px-4 py-2 bg-gray-600 text-white rounded">← Back</button>
        <div className="flex-1"></div>
        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded">🖨️ Print / Save PDF</button>
        <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded">📱 WhatsApp</button>
        <button onClick={handleEmail} className="px-4 py-2 bg-purple-600 text-white rounded">📧 Email</button>
      </div>

      {/* Challan Content */}
      <div className="max-w-5xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:p-4">
        {/* Header */}
        <div className="border-b-4 border-red-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-red-800">BHARAT TRANSPORT</h1>
              <p className="text-gray-600 mt-1">Professional Multi-Branch Transport Management System</p>
              <p className="text-sm text-gray-500 mt-1">GST: 27AAAAA0000A1Z5 | PAN: AAAAA0000A</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800">GADI CHALLAN</h2>
              <p className="text-lg mt-2"><strong>Challan No:</strong> {challan.challan_no}</p>
              <p className="text-lg"><strong>Date:</strong> {new Date(challan.issue_date).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Vehicle & Driver Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">🚛</span> VEHICLE DETAILS
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Vehicle No:</span><span className="font-bold">{challan.vehicle_no}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Vehicle Type:</span><span>{challan.vehicle_type || 'Truck'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Owner Name:</span><span className="font-bold">{challan.owner_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Owner Mobile:</span><span>{challan.owner_mobile}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">RC Expiry:</span><span>{challan.rc_expiry ? new Date(challan.rc_expiry).toLocaleDateString('en-IN') : 'N/A'}</span></div>
            </div>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">👷</span> DRIVER DETAILS
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Driver Name:</span><span className="font-bold">{challan.driver_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">License No:</span><span>{challan.driver_license}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Mobile:</span><span>{challan.driver_mobile}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Address:</span><span>{challan.driver_address || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Aadhar:</span><span>{challan.driver_aadhar || 'N/A'}</span></div>
            </div>
          </div>
        </div>

        {/* Route & Material */}
        <div className="border-2 border-orange-200 rounded-lg p-4 mb-6 bg-orange-50">
          <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">📍</span> ROUTE & MATERIAL DETAILS
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600">FROM</div>
              <div className="font-bold text-lg">{challan.from_place}</div>
              {challan.from_branch && <div className="text-sm text-gray-500">{challan.from_branch}</div>}
            </div>
            <div className="flex items-center justify-center">
              <div className="text-3xl">➡️</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">TO</div>
              <div className="font-bold text-lg">{challan.to_place}</div>
              {challan.to_branch && <div className="text-sm text-gray-500">{challan.to_branch}</div>}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600">Material Description:</div>
                <div className="font-bold">{challan.material_desc}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Weight / Packages:</div>
                <div className="font-bold">{challan.weight} MT / {challan.packages} Pkgs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Consignor & Consignee */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300 rounded p-3">
            <h4 className="font-bold text-sm text-gray-700 mb-2">CONSIGNOR (Booker)</h4>
            <div className="text-sm">
              <div className="font-bold">{challan.consignor_name}</div>
              <div className="text-gray-600">{challan.consignor_address}</div>
              <div className="text-gray-600">GST: {challan.consignor_gst}</div>
            </div>
          </div>
          <div className="border border-gray-300 rounded p-3">
            <h4 className="font-bold text-sm text-gray-700 mb-2">CONSIGNEE (Receiver)</h4>
            <div className="text-sm">
              <div className="font-bold">{challan.consignee_name}</div>
              <div className="text-gray-600">{challan.consignee_address}</div>
              <div className="text-gray-600">GST: {challan.consignee_gst}</div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="border-2 border-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-lg mb-3">💰 FINANCIAL DETAILS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-2">Freight Amount:</td><td className="text-right font-bold">₹{parseFloat(challan.freight_amount || 0).toLocaleString('en-IN')}</td></tr>
                  <tr className="border-b"><td className="py-2">Advance Paid:</td><td className="text-right">₹{parseFloat(challan.advance_paid || 0).toLocaleString('en-IN')}</td></tr>
                  <tr><td className="py-2">Balance Due:</td><td className="text-right font-bold text-red-600">₹{parseFloat(challan.balance_due || 0).toLocaleString('en-IN')}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-2">Toll Expense:</td><td className="text-right">₹{parseFloat(challan.toll_expense || 0).toLocaleString('en-IN')}</td></tr>
                  <tr className="border-b"><td className="py-2">Diesel Expense:</td><td className="text-right">₹{parseFloat(challan.diesel_expense || 0).toLocaleString('en-IN')}</td></tr>
                  <tr className="border-b"><td className="py-2">Other Expense:</td><td className="text-right">₹{parseFloat(challan.other_expense || 0).toLocaleString('en-IN')}</td></tr>
                  <tr className="border-b"><td className="py-2">TDS Deduction:</td><td className="text-right">₹{parseFloat(challan.tds_deduction || 0).toLocaleString('en-IN')}</td></tr>
                  <tr><td className="py-2 font-bold">Net Payable:</td><td className="text-right font-bold text-green-700">₹{parseFloat(challan.net_payable || 0).toLocaleString('en-IN')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Broker Details */}
        {challan.broker_name && (
          <div className="border border-gray-300 rounded p-3 mb-6">
            <h4 className="font-bold text-sm text-gray-700 mb-2">BROKER DETAILS</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-600">Name:</span> {challan.broker_name}</div>
              <div><span className="text-gray-600">Mobile:</span> {challan.broker_mobile}</div>
              <div><span className="text-gray-600">Commission:</span> ₹{parseFloat(challan.broker_commission || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}

        {/* Bilty Reference */}
        {challan.lr_no && (
          <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-6">
            <div className="text-sm">
              <span className="font-bold">Reference LR/Bilty No:</span> {challan.lr_no} | 
              <span className="ml-4 font-bold">Bilty Date:</span> {challan.bilty_date ? new Date(challan.bilty_date).toLocaleDateString('en-IN') : 'N/A'}
            </div>
          </div>
        )}

        {/* Remarks */}
        {challan.remarks && (
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-3 mb-6">
            <div className="text-sm font-bold text-yellow-800">Remarks:</div>
            <div className="text-sm text-yellow-700">{challan.remarks}</div>
          </div>
        )}

        {/* Footer Signatures */}
        <div className="mt-12 pt-6 border-t-2 border-gray-400">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="border-b border-gray-400 h-16 mb-2"></div>
              <div className="text-xs font-bold">Prepared By</div>
              <div className="text-xs text-gray-600">{challan.created_by || 'Admin'}</div>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 h-16 mb-2"></div>
              <div className="text-xs font-bold">Driver Signature</div>
              <div className="text-xs text-gray-600">{challan.driver_name}</div>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 h-16 mb-2"></div>
              <div className="text-xs font-bold">Authorized Signatory</div>
              <div className="text-xs text-gray-600">For Bharat Transport</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
          <p>This is a computer generated challan.</p>
          <p className="mt-1">© 2026 Bharat Transport Company • Generated: {new Date().toLocaleString('en-IN')}</p>
          <p className="mt-2 text-red-600 font-bold">Thank you for your business!</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-4 { padding: 1rem; }
        }
      `}</style>
    </div>
  )
}
