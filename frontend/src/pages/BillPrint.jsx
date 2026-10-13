import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const COMPANY = {
  name: "BHARAT TRANSPORT COMPANY",
  gst: "08CMRPP0955N1Z5",
  pan: "CMRPP0955N",
  address: "Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan - 331023",
  phone: "+91 9680264231",
  email: "bharattrsnportcompany@gmail.com",
  bankName: "HDFC BANK",
  accountNo: "50200112184634",
  ifsc: "HDFC0002795",
  branch: "RAJGARH",
  signatory: "Krishan"
}

export default function BillPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.get(`/api/bills/${id}`)
        .then(res => { setData(res.data); setLoading(false) })
        .catch(() => { alert('Bill not found'); navigate('/bills') })
    }
  }, [id, navigate])

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!data) return null

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      <div className="no-print mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <button onClick={() => navigate('/bills')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Back</button>
        <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">🖨️ Print Bill</button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-4 border-2 border-gray-800">
        {/* HEADER */}
        <div className="text-center border-b-4 border-black pb-4 mb-4">
          <h1 className="text-3xl font-black text-red-700 uppercase tracking-wide">{COMPANY.name}</h1>
          <p className="text-xs font-bold mt-2">{COMPANY.address}</p>
          <div className="flex justify-center gap-6 text-xs font-bold mt-2">
            <span>📞 {COMPANY.phone}</span>
            <span>✉️ {COMPANY.email}</span>
          </div>
          <div className="flex justify-center gap-6 text-xs font-bold mt-2 text-blue-900">
            <span>GSTIN: {COMPANY.gst}</span>
            <span>PAN: {COMPANY.pan}</span>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6 border-b-2 border-gray-300 pb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">TAX INVOICE</h2>
            <p className="text-sm font-bold mt-1">Bill No: <span className="text-red-700 text-xl">{data.bill_no}</span></p>
            <p className="text-sm">Date: {new Date(data.bill_date).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Original Copy (For Party)</p>
          </div>
        </div>

        {/* PARTY DETAILS */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border-2 border-gray-800 p-3 rounded">
            <p className="font-black text-gray-600 text-xs uppercase mb-2 bg-gray-100 p-1">Billed To (Party)</p>
            <p className="font-bold text-lg">{data.party_name}</p>
            <p>{data.party_address}</p>
            <p className="mt-2"><span className="font-bold">GST No:</span> {data.party_gst || 'N/A'}</p>
          </div>
          <div className="border-2 border-gray-800 p-3 rounded">
            <p className="font-black text-gray-600 text-xs uppercase mb-2 bg-gray-100 p-1">Shipment Details</p>
            <p><span className="font-bold">From:</span> {data.from_name}</p>
            <p><span className="font-bold">To:</span> {data.to_name}</p>
            <p className="mt-2"><span className="font-bold">Vehicle:</span> {data.vehicle_no || 'N/A'}</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full border-collapse border-2 border-black text-sm mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 text-left">LR No.</th>
              <th className="border border-black p-2 text-left">Invoice No.</th>
              <th className="border border-black p-2 text-left">From</th>
              <th className="border border-black p-2 text-left">To</th>
              <th className="border border-black p-2 text-right">Weight (MT)</th>
              <th className="border border-black p-2 text-right">Packages</th>
              <th className="border border-black p-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.items && data.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">{item.lr_no}</td>
                <td className="border border-black p-2">{item.invoice_no}</td>
                <td className="border border-black p-2">{item.from_name}</td>
                <td className="border border-black p-2">{item.to_name}</td>
                <td className="border border-black p-2 text-right">{item.weight_mt}</td>
                <td className="border border-black p-2 text-right">{item.packages}</td>
                <td className="border border-black p-2 text-right font-bold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td colSpan="6" className="border border-black p-2 text-right">Trip Sub-Total:</td>
              <td className="border border-black p-2 text-right">{formatCurrency(data.trip_subtotal)}</td>
            </tr>
            <tr>
              <td colSpan="6" className="border border-black p-2 text-right">GST ({data.gst_percent}%):</td>
              <td className="border border-black p-2 text-right">{formatCurrency(data.gst_amount)}</td>
            </tr>
            <tr className="bg-gray-200 font-black text-lg">
              <td colSpan="6" className="border border-black p-2 text-right">Grand Total:</td>
              <td className="border border-black p-2 text-right text-red-700">{formatCurrency(data.grand_total)}</td>
            </tr>
          </tbody>
        </table>

        {/* PAYMENT & BANK */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-black">
          <div className="text-sm">
            <p className="font-black text-gray-800 mb-2 uppercase border-b border-gray-400 pb-1">Bank Account Details</p>
            <p><span className="font-bold">Beneficiary:</span> {COMPANY.name}</p>
            <p><span className="font-bold">Bank:</span> {COMPANY.bankName}, {COMPANY.branch}</p>
            <p><span className="font-bold">A/c No:</span> {COMPANY.accountNo}</p>
            <p><span className="font-bold">IFSC:</span> {COMPANY.ifsc}</p>
            <p className="mt-2 font-bold text-red-600">Payment Mode: {data.payment_mode || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold mb-8">For {COMPANY.name}</p>
            <div className="font-cursive text-3xl text-blue-900 mb-1" style={{ fontFamily: "'Mrs Saint Delafield', cursive" }}>{COMPANY.signatory}</div>
            <p className="text-xs font-bold border-t-2 border-black inline-block pt-1">Authorized Signatory</p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          This is a computer generated invoice. Subject to Rajgarh (Rajasthan) jurisdiction.
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
