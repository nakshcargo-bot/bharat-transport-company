import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function MRPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mrId = searchParams.get('id')
  const [mr, setMr] = useState(null)
  const [bilty, setBilty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (mrId) fetchMRDetails()
  }, [mrId])

  const fetchMRDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      // Fetch MR details
      const resMR = await fetch(`${apiUrl}/api/mr`, { headers })
      if (resMR.ok) {
        const data = await resMR.json()
        const foundMR = (data.data || []).find(m => m.id === parseInt(mrId))
        if (foundMR) {
          setMr(foundMR)
          // If MR has bilty_id, fetch bilty details
          if (foundMR.bilty_id) {
            const resBilty = await fetch(`${apiUrl}/api/consignments/${foundMR.bilty_id}`, { headers })
            if (resBilty.ok) {
              const biltyData = await resBilty.json()
              setBilty(biltyData)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching MR details:', err)
    } finally {
      setLoading(false)
    }
  }

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    if (num === 0) return 'Zero'
    
    const convert = (n) => {
      if (n < 20) return ones[n]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '')
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
    }
    
    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)
    let words = convert(rupees) + ' Rupees'
    if (paise > 0) words += ' and ' + convert(paise) + ' Paise'
    return words + ' Only'
  }

  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
          <p className="mt-4 text-gray-500">Loading MR Details...</p>
        </div>
      </div>
    )
  }

  if (!mr) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">MR not found</p>
          <button onClick={() => navigate('/mr')} className="mt-4 px-6 py-2 bg-purple-700 text-white rounded-lg">Back to MR List</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls - Hidden in Print */}
      <div className="print:hidden bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-center gap-4">
          <button onClick={handlePrint} className="px-6 py-2 bg-purple-700 text-white rounded-lg font-bold hover:bg-purple-800 flex items-center gap-2">
            🖨️ Print MR
          </button>
          <button onClick={() => navigate('/mr')} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700">
            ← Back
          </button>
        </div>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg my-8 print:my-0 print:shadow-none print:p-4">
        {/* Company Header */}
        <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">BHARAT TRANSPORT COMPANY</h1>
          <p className="text-sm text-gray-600 mt-1">Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023</p>
          <p className="text-sm text-gray-600">Email: bharattransportcompany@gmail.com | PAN: CMRPP0955N | GST: 08CMRPP0955N1Z5</p>
        </div>

        {/* MR Title */}
        <div className="bg-gray-100 border-2 border-gray-800 p-6 mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MONEY RECEIPT</h2>
          <p className="text-xl font-bold text-purple-700">{mr.mr_no}</p>
          <p className="text-sm text-gray-600 mt-2">Date: {new Date(mr.mr_date).toLocaleDateString('en-IN')}</p>
        </div>

        {/* Received From */}
        <div className="border-2 border-gray-400 p-4 mb-6">
          <p className="text-base mb-2">Received with thanks from M/s. <span className="font-bold text-lg">{mr.party_name}</span></p>
          <p className="text-sm">Party Type: <span className="font-semibold">{mr.party_type}</span></p>
          {bilty && (
            <>
              <p className="text-sm mt-1">Consignor: <span className="font-semibold">{bilty.consignor_name || '-'}</span></p>
              <p className="text-sm">Consignee: <span className="font-semibold">{bilty.consignee_name || '-'}</span></p>
            </>
          )}
        </div>

        {/* Bilty Details Table */}
        {bilty && (
          <div className="border-2 border-gray-400 mb-6">
            <div className="bg-purple-100 px-4 py-2 border-b-2 border-gray-400">
              <h3 className="font-bold text-gray-800">📦 Bilty / LR Details</h3>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 w-1/3">LR Number:</td>
                    <td className="py-2 font-bold text-purple-700">{bilty.lr_no}</td>
                    <td className="py-2 font-semibold text-gray-700 w-1/3">LR Date:</td>
                    <td className="py-2">{new Date(bilty.lr_date).toLocaleDateString('en-IN')}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Branch:</td>
                    <td className="py-2">{bilty.branch_code || '-'}</td>
                    <td className="py-2 font-semibold text-gray-700">Status:</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        bilty.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bilty.payment_status || 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Consignor (From):</td>
                    <td className="py-2 font-semibold">{bilty.consignor_name || '-'}</td>
                    <td className="py-2 font-semibold text-gray-700">Consignor GST:</td>
                    <td className="py-2">{bilty.consignor_gst || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Consignee (To):</td>
                    <td className="py-2 font-semibold">{bilty.consignee_name || '-'}</td>
                    <td className="py-2 font-semibold text-gray-700">Consignee GST:</td>
                    <td className="py-2">{bilty.consignee_gst || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Material:</td>
                    <td className="py-2">{bilty.material_desc || '-'}</td>
                    <td className="py-2 font-semibold text-gray-700">HSN Code:</td>
                    <td className="py-2">{bilty.hsn_code || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Packages:</td>
                    <td className="py-2 font-bold">{bilty.packages || '-'} Pcs</td>
                    <td className="py-2 font-semibold text-gray-700">Weight:</td>
                    <td className="py-2 font-bold">{bilty.actual_weight || bilty.charged_weight || '-'} Kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charges Breakdown */}
        {bilty && (
          <div className="border-2 border-gray-400 mb-6">
            <div className="bg-blue-100 px-4 py-2 border-b-2 border-gray-400">
              <h3 className="font-bold text-gray-800">💰 Freight Charges Breakdown</h3>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Basic Freight:</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(bilty.freight)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">AOC / Statutory:</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(bilty.aoc_percent ? (parseFloat(bilty.freight || 0) * parseFloat(bilty.aoc_percent) / 100) : 0)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Material Management:</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(bilty.material_mgmt_ch)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Collection Charges:</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(bilty.collection_charges)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Door Delivery:</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(bilty.door_dly_charges)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700">Miscellaneous:</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(bilty.misc_charges)}</td>
                  </tr>
                  <tr className="bg-purple-100">
                    <td className="py-3 font-bold text-gray-900 text-lg">Grand Total:</td>
                    <td className="py-3 text-right font-bold text-purple-700 text-lg">{formatCurrency(bilty.grand_total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="border-2 border-gray-400 mb-6">
          <div className="bg-green-100 px-4 py-2 border-b-2 border-gray-400">
            <h3 className="font-bold text-gray-800">💵 Payment Details</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700 w-1/3">Payment Mode:</td>
                  <td className="py-2 font-medium">{mr.payment_mode}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Linked Bilty (LR No):</td>
                  <td className="py-2 font-bold text-purple-700">{mr.bilty_lr_no || '-'}</td>
                </tr>
                {mr.is_advance && (
                  <tr className="border-b bg-yellow-50">
                    <td className="py-2 font-semibold text-gray-700">Payment Type:</td>
                    <td className="py-2 font-bold text-yellow-700">Advance Payment</td>
                  </tr>
                )}
                <tr className="border-b">
                  <td className="py-2 font-semibold text-gray-700">Remarks:</td>
                  <td className="py-2">{mr.remarks || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="bg-gray-100 border-2 border-gray-800 p-6 mb-6 text-center">
          <h3 className="text-sm font-bold text-gray-700 mb-2">AMOUNT RECEIVED (IN RUPEES)</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(mr.amount)}</p>
          <p className="text-sm text-gray-600 italic">({numberToWords(parseFloat(mr.amount))})</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-400">
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-16"></div>
            <p className="text-sm font-semibold text-gray-700">Received By</p>
            <p className="text-xs text-gray-500">Bharat Transport Company</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-16"></div>
            <p className="text-sm font-semibold text-gray-700">Paid By</p>
            <p className="text-xs text-gray-500">{mr.party_name}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p className="mt-1">Thank you for your business!</p>
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
