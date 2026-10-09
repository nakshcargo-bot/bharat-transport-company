import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function BiltyPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [bilty, setBilty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const lrNo = searchParams.get('lr_no')

  useEffect(() => {
    if (!lrNo) {
      navigate('/consignments')
      return
    }
    fetchBiltyData(lrNo)
  }, [lrNo, navigate])

  const fetchBiltyData = async (lrNo) => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'

      const res = await fetch(`${apiUrl}/api/consignments/track?lr_no=${encodeURIComponent(lrNo)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBilty(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleWhatsApp = () => {
    if (!bilty) return
    const msg = `🚛 *BILTY DETAILS*%0A%0A` +
      `📋 LR No: ${bilty.lr_no}%0A` +
      `📅 Date: ${bilty.lr_date || 'N/A'}%0A` +
      ` Consignor: ${bilty.consignor_name || 'N/A'}%0A` +
      `📍 From: ${bilty.from_name || 'N/A'}%0A` +
      `👤 Consignee: ${bilty.consignee_name || 'N/A'}%0A` +
      `📍 To: ${bilty.to_name || 'N/A'}%0A` +
      `📦 Status: ${bilty.status || 'Booked'}%0A%0A` +
      `— Bharat Transport Company`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleEmail = () => {
    if (!bilty) return
    const subject = `Bilty Details - ${bilty.lr_no}`
    const body = `Dear Sir/Madam,%0D%0A%0D%0APlease find the Bilty details below:%0D%0A%0D%0A` +
      `LR No: ${bilty.lr_no}%0D%0A` +
      `Date: ${bilty.lr_date || 'N/A'}%0D%0A` +
      `Consignor: ${bilty.consignor_name || 'N/A'}%0D%0A` +
      `From: ${bilty.from_name || 'N/A'}%0D%0A` +
      `Consignee: ${bilty.consignee_name || 'N/A'}%0D%0A` +
      `To: ${bilty.to_name || 'N/A'}%0D%0A` +
      `Status: ${bilty.status || 'Booked'}%0D%0A%0D%0A` +
      `— Bharat Transport Company`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          <p className="mt-4 text-gray-600">Loading Bilty...</p>
        </div>
      </div>
    )
  }

  if (error || !bilty) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-red-600 mb-4">{error || 'Bilty not found'}</p>
          <button onClick={() => navigate('/consignments')} className="px-4 py-2 bg-blue-600 text-white rounded">← Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Action Bar - Hidden in Print */}
      <div className="bg-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
          <button onClick={() => navigate('/consignments')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
            ← Back to List
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1">
              ️ Print / Save PDF
            </button>
            <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1">
              📱 WhatsApp
            </button>
            <button onClick={handleEmail} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1">
              📧 Email
            </button>
          </div>
        </div>
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-blue-800 print:hidden">
          💡 <strong>Tip:</strong> "Print / Save PDF" button dabao → Destination mein "Save as PDF" select karo → A4 size PDF ban jayega!
        </div>
      </div>

      {/* A4 Print Content */}
      <div className="max-w-4xl mx-auto my-6 bg-white shadow-lg print:shadow-none print:my-0">
        <div className="p-8 print:p-6" id="print-content">
          {/* Header */}
          <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-left">
                <div className="text-xs text-gray-600">GSTIN: _______________</div>
                <div className="text-xs text-gray-600 mt-1">CIN: _______________</div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-red-800">BHARAT TRANSPORT</h1>
                <p className="text-sm text-gray-700">Professional Multi-Branch TMS</p>
                <p className="text-xs text-gray-600 mt-1">📞 +91-XXXXXXXXXX | ✉️ info@bharattransport.com</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Branch: {bilty.branch_code || 'Main'}</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mt-4 text-gray-900 tracking-wider">TRANSPORT RECEIPT (BILTY / LR)</h2>
          </div>

          {/* LR Info Row */}
          <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-3 rounded border">
            <div>
              <div className="text-xs text-gray-600 font-bold">LR NUMBER</div>
              <div className="text-lg font-bold text-blue-800">{bilty.lr_no}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 font-bold">DATE</div>
              <div className="text-lg font-bold">{bilty.lr_date ? new Date(bilty.lr_date).toLocaleDateString('en-IN') : 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 font-bold">STATUS</div>
              <div className="text-lg font-bold text-green-700">{bilty.status || 'Booked'}</div>
            </div>
          </div>

          {/* Consignor & Consignee */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-blue-200 rounded p-4 bg-blue-50">
              <h3 className="font-bold text-blue-900 border-b border-blue-300 pb-1 mb-2">📤 CONSIGNOR (Booker)</h3>
              <p className="font-bold text-lg">{bilty.consignor_name || 'N/A'}</p>
              <p className="text-sm text-gray-700 mt-1">{bilty.from_name || 'N/A'}</p>
              {bilty.consignor_gst && <p className="text-xs text-gray-600 mt-1">GST: {bilty.consignor_gst}</p>}
            </div>
            <div className="border-2 border-green-200 rounded p-4 bg-green-50">
              <h3 className="font-bold text-green-900 border-b border-green-300 pb-1 mb-2">📥 CONSIGNEE (Receiver)</h3>
              <p className="font-bold text-lg">{bilty.consignee_name || 'N/A'}</p>
              <p className="text-sm text-gray-700 mt-1">{bilty.to_name || 'N/A'}</p>
              {bilty.consignee_gst && <p className="text-xs text-gray-600 mt-1">GST: {bilty.consignee_gst}</p>}
            </div>
          </div>

          {/* Goods Details */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">📦 GOODS DETAILS</h3>
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold w-1/3 bg-gray-100">Material Description</td>
                  <td className="p-2">{bilty.description || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold bg-gray-100">No. of Packages</td>
                  <td className="p-2">{bilty.no_of_packages || '0'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold bg-gray-100">Actual Weight</td>
                  <td className="p-2">{bilty.actual_weight || '0'} {bilty.actual_weight ? 'Kg' : ''}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold bg-gray-100">Charged Weight</td>
                  <td className="p-2">{bilty.charged_weight || bilty.actual_weight || '0'} Kg</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold bg-gray-100">Dimensions (L x W x H)</td>
                  <td className="p-2">{bilty.length || '-'} x {bilty.width || '-'} x {bilty.height || '-'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold bg-gray-100">Total CFT</td>
                  <td className="p-2">{bilty.cft_cmt || '0'}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 font-bold bg-gray-100">Declared Value</td>
                  <td className="p-2 font-bold text-green-700">₹{bilty.declared_value || '0'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-gray-100">HSN Code</td>
                  <td className="p-2">{bilty.hsn_code || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Charges */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">💰 CHARGES</h3>
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Freight</td><td className="p-2">₹{bilty.freight || '0'}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">AOC / Statutory</td><td className="p-2">₹{bilty.aoc_percent || '0'}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Material Mgmt Charges</td><td className="p-2">₹{bilty.material_charges || '0'}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Collection Charges</td><td className="p-2">₹{bilty.collection_charges || '0'}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Door Delivery</td><td className="p-2">₹{bilty.door_delivery || '0'}</td></tr>
                <tr className="border-b border-gray-300"><td className="p-2 font-bold bg-gray-100">Miscellaneous</td><td className="p-2">₹{bilty.misc_charges || '0'}</td></tr>
                <tr className="bg-red-100 font-bold text-lg">
                  <td className="p-3">GRAND TOTAL</td>
                  <td className="p-3 text-right text-red-800">₹{bilty.grand_total || '0'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Mode */}
          <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <div className="flex justify-between">
              <div><strong>Payment Mode:</strong> {bilty.basis_booking || 'TO PAY'}</div>
              <div><strong>Delivery Type:</strong> {bilty.delivery_type || 'DOOR DELIVERY'}</div>
            </div>
          </div>

          {/* Terms */}
          <div className="mb-6 text-xs text-gray-700 border-t pt-3">
            <h4 className="font-bold mb-1">Terms & Conditions:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Goods are carried at owner's risk. Insurance is optional.</li>
              <li>Any claim for loss/damage must be made within 7 days of delivery.</li>
              <li>Subject to local jurisdiction only.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-4 border-t-2 border-gray-400">
            <div className="text-center">
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs font-bold mt-1">Consignor Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs font-bold mt-1">Transporter Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs font-bold mt-1">Consignee Signature</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            <p className="font-bold">Bharat Transport Company • Professional Multi-Branch TMS</p>
            <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
            <p className="mt-1">This is a computer generated document and does not require physical signature.</p>
          </div>
        </div>
      </div>

      {/* A4 Print Styles */}
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:my-0 { margin-top: 0; margin-bottom: 0; }
          .print\\:p-6 { padding: 1.5rem; }
          * { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
