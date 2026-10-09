import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function MRPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mr, setMr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mrNo = searchParams.get('mr_no')

  useEffect(() => {
    if (!mrNo) { navigate('/mr'); return }
    fetchMRData(mrNo)
  }, [mrNo, navigate])

  const fetchMRData = async (mrNo) => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/mr`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const foundMR = data.data.find(m => m.mr_no === mrNo)
      if (!foundMR) throw new Error('MR not found')
      setMr(foundMR)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handlePrint = () => window.print()

  const handleWhatsApp = () => {
    if (!mr) return
    const msg = `*MONEY RECEIPT*%0A%0A` +
      `MR No: ${mr.mr_no}%0A` +
      `Date: ${mr.mr_date || 'N/A'}%0A` +
      `Party: ${mr.party_name || 'N/A'}%0A` +
      `Amount: Rs.${parseFloat(mr.amount || 0).toLocaleString('en-IN')}%0A` +
      `Mode: ${mr.payment_mode || 'Cash'}%0A` +
      `${mr.bilty_lr_no ? `LR No: ${mr.bilty_lr_no}%0A` : ''}` +
      `%0A- Bharat Transport Company`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleEmail = () => {
    if (!mr) return
    const subject = `Money Receipt - ${mr.mr_no}`
    const body = `Dear ${mr.party_name},%0D%0A%0D%0AThank you for your payment.%0D%0A%0D%0A` +
      `MR No: ${mr.mr_no}%0D%0A` +
      `Date: ${mr.mr_date || 'N/A'}%0D%0A` +
      `Amount: Rs.${parseFloat(mr.amount || 0).toLocaleString('en-IN')}%0D%0A` +
      `Mode: ${mr.payment_mode || 'Cash'}%0D%0A%0D%0A` +
      `- Bharat Transport Company`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div></div>
  if (error || !mr) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-red-600 mb-4">{error || 'MR not found'}</p>
        <button onClick={() => navigate('/mr')} className="px-4 py-2 bg-gray-600 text-white rounded">← Back</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="bg-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
          <button onClick={() => navigate('/mr')} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">← Back</button>
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">🖨️ Print / Save PDF</button>
            <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">📱 WhatsApp</button>
            <button onClick={handleEmail} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">📧 Email</button>
          </div>
        </div>
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-blue-800">
          💡 "Print / Save PDF" dabao → "Save as PDF" select karo → A4 PDF ban jayega!
        </div>
      </div>

      <div className="max-w-3xl mx-auto my-6 bg-white shadow-lg print:shadow-none print:my-0">
        <div className="p-8 print:p-6">
          <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-red-800">BHARAT TRANSPORT</h1>
            <p className="text-sm text-gray-700">Professional Multi-Branch TMS</p>
            <h2 className="text-2xl font-bold mt-4 text-gray-900 tracking-wider">MONEY RECEIPT</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded border">
            <div><div className="text-xs text-gray-600 font-bold">MR NUMBER</div><div className="text-xl font-bold text-green-800">{mr.mr_no}</div></div>
            <div><div className="text-xs text-gray-600 font-bold">DATE</div><div className="text-xl font-bold">{mr.mr_date ? new Date(mr.mr_date).toLocaleDateString('en-IN') : 'N/A'}</div></div>
          </div>

          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded">
            <h3 className="font-bold text-green-900 mb-2">💰 RECEIVED FROM</h3>
            <p className="text-xl font-bold">{mr.party_name || 'N/A'}</p>
            <p className="text-sm text-gray-700">Party Type: {mr.party_type || 'N/A'}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">PAYMENT DETAILS</h3>
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr className="border-b border-gray-300"><td className="p-3 font-bold bg-gray-100 w-1/2">Payment Mode</td><td className="p-3 font-semibold">{mr.payment_mode || 'Cash'}</td></tr>
                {mr.bilty_lr_no && <tr className="border-b border-gray-300"><td className="p-3 font-bold bg-gray-100">Against LR / Bilty No</td><td className="p-3 font-semibold text-blue-700">{mr.bilty_lr_no}</td></tr>}
                {mr.bill_no && <tr className="border-b border-gray-300"><td className="p-3 font-bold bg-gray-100">Against Bill No</td><td className="p-3 font-semibold text-blue-700">{mr.bill_no}</td></tr>}
                <tr className="border-b border-gray-300"><td className="p-3 font-bold bg-gray-100">Advance Payment</td><td className="p-3 font-semibold">{mr.is_advance ? 'Yes' : 'No'}</td></tr>
                <tr className="bg-green-100 font-bold text-xl">
                  <td className="p-4 text-green-900">AMOUNT RECEIVED</td>
                  <td className="p-4 text-right text-green-900">₹{parseFloat(mr.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {mr.remarks && (
            <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm font-bold text-yellow-800">Remarks:</p>
              <p className="text-sm text-yellow-700">{mr.remarks}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t-2 border-gray-400">
            <div className="text-center">
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs font-bold mt-1">Prepared By: {mr.created_by || 'Admin'}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs font-bold mt-1">Authorized Signatory</p>
              <p className="text-xs text-gray-600">For Bharat Transport</p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>This is a computer generated receipt.</p>
            <p className="mt-1">© 2026 Bharat Transport Company • Generated: {new Date().toLocaleString('en-IN')}</p>
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
