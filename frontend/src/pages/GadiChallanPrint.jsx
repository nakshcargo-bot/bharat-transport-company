import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function GadiChallanPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const id = searchParams.get('id')
useEffect(() => {
  if (!id) { navigate('/gadi-challan'); return }
  fetchChallanData(id)
}, [id, navigate])
  
  const fetchChallanData = async (id) => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/gadi-challan/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      setChallan(await res.json())
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handlePrint = () => window.print()

  const handleWhatsApp = () => {
    if (!challan) return
    const msg = `🚛 *GADI CHALLAN*%0A%0A` +
      `📋 Challan No: ${challan.challan_no}%0A` +
      `📅 Date: ${challan.issue_date ? new Date(challan.issue_date).toLocaleDateString('en-IN') : 'N/A'}%0A` +
      `🚗 Vehicle: ${challan.vehicle_no || 'N/A'}%0A` +
      `👤 Driver: ${challan.driver_name || 'N/A'} (${challan.driver_mobile || 'N/A'})%0A` +
      `📍 From: ${challan.from_place || 'N/A'} → To: ${challan.to_place || 'N/A'}%0A` +
      `💰 Freight: ₹${parseFloat(challan.freight_amount || 0).toLocaleString('en-IN')}%0A` +
      `💵 Advance: ₹${parseFloat(challan.advance_paid || 0).toLocaleString('en-IN')}%0A` +
      `💸 Balance: ₹${parseFloat(challan.balance_due || 0).toLocaleString('en-IN')}%0A%0A` +
      `— Bharat Transport Company`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleEmail = () => {
    if (!challan) return
    const subject = `Gadi Challan - ${challan.challan_no}`
    const body = `Dear ${challan.owner_name || 'Sir'},%0D%0A%0D%0APlease find the Gadi Challan details:%0D%0A%0D%0A` +
      `Challan No: ${challan.challan_no}%0D%0A` +
      `Vehicle: ${challan.vehicle_no || 'N/A'}%0D%0A` +
      `Driver: ${challan.driver_name || 'N/A'}%0D%0A` +
      `Route: ${challan.from_place || 'N/A'} → ${challan.to_place || 'N/A'}%0D%0A` +
      `Freight: Rs.${parseFloat(challan.freight_amount || 0).toLocaleString('en-IN')}%0D%0A` +
      `Advance: Rs.${parseFloat(challan.advance_paid || 0).toLocaleString('en-IN')}%0D%0A` +
      `Balance: Rs.${parseFloat(challan.balance_due || 0).toLocaleString('en-IN')}%0D%0A%0D%0A` +
      `— Bharat Transport Company`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div></div>
  if (error || !challan) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-red-600 mb-4">{error || 'Challan not found'}</p>
        <button onClick={() => navigate('/gadi-challan')} className="px-4 py-2 bg-gray-600 text-white rounded">← Back</button>
      </div>
    </div>
  )

  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN')

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Action Bar */}
      <div className="bg-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
          <button onClick={() => navigate('/gadi-challan')} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">← Back</button>
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">🖨️ Print / Save PDF</button>
            <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"> WhatsApp</button>
            <button onClick={handleEmail} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">📧 Email</button>
          </div>
        </div>
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-blue-800">
          💡 "Print / Save PDF" dabao → "Save as PDF" select karo → A4 PDF ban jayega!
        </div>
      </div>

      {/* A4 Content */}
      <div className="max-w-4xl mx-auto my-6 bg-white shadow-lg print:shadow-none print:my-0">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-red-800">BHARAT TRANSPORT</h1>
            <p className="text-sm text-gray-700">Professional Multi-Branch TMS</p>
            <h2 className="text-2xl font-bold mt-4 text-gray-900 tracking-wider">GADI CHALLAN</h2>
            <div className="mt-2 flex justify-center gap-8 text-sm">
              <div><strong>Challan No:</strong> <span className="text-blue-800">{challan.challan_no}</span></div>
              <div><strong>Date:</strong> {challan.issue_date ? new Date(challan.issue_date).toLocaleDateString('en-IN') : 'N/A'}</div>
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border-2 border-blue-200 rounded p-4 bg-blue-50">
              <h3 className="font-bold text-blue-900 border-b border-blue-300 pb-1 mb-2">🚗 VEHICLE DETAILS</h3>
              <p><strong>Vehicle No:</strong> {challan.vehicle_no || 'N/A'}</p>
              <p><strong>Owner:</strong> {challan.owner_name || 'N/A'}</p>
              <p><strong>Owner Mobile:</strong> {challan.owner_mobile || 'N/A'}</p>
            </div>
            <div className="border-2 border-green-200 rounded p-4 bg-green-50">
              <h3 className="font-bold text-green-900 border-b border-green-300 pb-1 mb-2"> DRIVER DETAILS</h3>
              <p><strong>Name:</strong> {challan.driver_name || 'N/A'}</p>
              <p><strong>Mobile:</strong> {challan.driver_mobile || 'N/A'}</p>
              {challan.driver_license && <p><strong>License:</strong> {challan.driver_license}</p>}
            </div>
          </div>

          {/* Route */}
          <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded">
            <h3 className="font-bold text-orange-900 mb-2">️ ROUTE</h3>
            <div className="flex items-center justify-center gap-4 text-lg">
              <div className="text-center"><div className="font-bold">{challan.from_place || 'N/A'}</div><div className="text-xs text-gray-600">From</div></div>
              <div className="text-3xl">→</div>
              <div className="text-center"><div className="font-bold">{challan.to_place || 'N/A'}</div><div className="text-xs text-gray-600">To</div></div>
            </div>
          </div>

          {/* Consignor/Consignee */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded p-3 bg-gray-50">
              <h4 className="font-bold text-sm text-gray-700 mb-1">📤 Consignor</h4>
              <p className="font-bold">{challan.consignor_name || 'N/A'}</p>
            </div>
            <div className="border rounded p-3 bg-gray-50">
              <h4 className="font-bold text-sm text-gray-700 mb-1">📥 Consignee</h4>
              <p className="font-bold">{challan.consignee_name || 'N/A'}</p>
            </div>
          </div>

          {/* Material */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">📦 MATERIAL DETAILS</h3>
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100 w-1/3">Material</td><td className="p-2">{challan.material_desc || 'N/A'}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Weight</td><td className="p-2">{challan.weight || '0'} Kg</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Packages</td><td className="p-2">{challan.packages || '0'}</td></tr>
                <tr><td className="p-2 font-bold bg-gray-100">Bilty Date</td><td className="p-2">{challan.bilty_date ? new Date(challan.bilty_date).toLocaleDateString('en-IN') : 'N/A'}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Financial */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">💰 FINANCIAL DETAILS</h3>
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Freight Amount</td><td className="p-2 text-right">{fmt(challan.freight_amount)}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Advance Paid</td><td className="p-2 text-right text-green-700">{fmt(challan.advance_paid)}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Toll Expense</td><td className="p-2 text-right">{fmt(challan.toll_expense)}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Diesel Expense</td><td className="p-2 text-right">{fmt(challan.diesel_expense)}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Other Expense</td><td className="p-2 text-right">{fmt(challan.other_expense)}</td></tr>
                {challan.tds_deduction > 0 && <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">TDS Deduction</td><td className="p-2 text-right text-red-700">{fmt(challan.tds_deduction)}</td></tr>}
                <tr className="bg-red-100 font-bold text-lg">
                  <td className="p-3">NET PAYABLE</td>
                  <td className="p-3 text-right text-red-800">{fmt(challan.net_payable)}</td>
                </tr>
                <tr className="bg-yellow-50 font-bold">
                  <td className="p-3">BALANCE DUE</td>
                  <td className="p-3 text-right text-orange-800">{fmt(challan.balance_due)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Broker */}
          {challan.broker_name && (
            <div className="mb-6 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
              <p><strong>Broker:</strong> {challan.broker_name} ({challan.broker_mobile || 'N/A'})</p>
              {challan.broker_commission && <p><strong>Commission:</strong> {challan.broker_commission}</p>}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-4 border-t-2 border-gray-400">
            <div className="text-center"><div className="border-b border-gray-400 h-16"></div><p className="text-xs font-bold mt-1">Prepared By</p></div>
            <div className="text-center"><div className="border-b border-gray-400 h-16"></div><p className="text-xs font-bold mt-1">Checked By</p></div>
            <div className="text-center"><div className="border-b border-gray-400 h-16"></div><p className="text-xs font-bold mt-1">Driver Signature</p></div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p className="font-bold">Bharat Transport Company • Professional Multi-Branch TMS</p>
            <p>Generated: {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:my-0 { margin: 0; }
          .print\\:p-6 { padding: 1.5rem; }
          * { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
