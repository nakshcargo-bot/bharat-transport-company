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

export default function MRPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.get(`/api/mr/${id}`)
        .then(res => { setData(res.data); setLoading(false) })
        .catch(() => { alert('MR not found'); navigate('/mr') })
    }
  }, [id, navigate])

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!data) return null

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      <div className="no-print mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <button onClick={() => navigate('/mr')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Back</button>
        <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">🖨️ Print MR</button>
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
            <h2 className="text-2xl font-black text-gray-800">MONEY RECEIPT</h2>
            <p className="text-sm font-bold mt-1">MR No: <span className="text-red-700 text-xl">{data.mr_no}</span></p>
            <p className="text-sm">Date: {new Date(data.mr_date).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Original Copy (For Party)</p>
          </div>
        </div>

        {/* DETAILS */}
        <div className="mb-6 text-sm">
          <p className="mb-2"><span className="font-bold">Received with thanks from:</span> <span className="text-lg font-black">{data.party_name}</span></p>
          <p className="mb-2"><span className="font-bold">Party Type:</span> {data.party_type}</p>
          <p className="mb-4"><span className="font-bold">Against Bilty/LR No:</span> {data.bilty_lr_no || 'N/A'} | <span className="font-bold">Bill No:</span> {data.bill_no || 'N/A'}</p>
          
          <div className="bg-gray-100 border-2 border-gray-800 p-4 rounded text-center my-4">
            <p className="text-sm font-bold text-gray-600 uppercase">Amount Received</p>
            <p className="text-4xl font-black text-green-700 my-2">{formatCurrency(data.amount)}</p>
            <p className="text-sm font-bold">Payment Mode: {data.payment_mode} {data.is_advance ? '(Advance)' : ''}</p>
          </div>

          {data.remarks && (
            <div className="mb-4">
              <p className="font-bold">Remarks:</p>
              <p className="border-b border-gray-400 pb-1">{data.remarks}</p>
            </div>
          )}
        </div>

        {/* SIGNATURE */}
        <div className="mt-12 pt-4 border-t-2 border-black flex justify-between items-end">
          <div className="text-sm">
            <p className="font-bold">For {COMPANY.name}</p>
          </div>
          <div className="text-right">
            <div className="font-cursive text-3xl text-blue-900 mb-1" style={{ fontFamily: "'Mrs Saint Delafield', cursive" }}>{COMPANY.signatory}</div>
            <p className="text-xs font-bold border-t-2 border-black inline-block pt-1">Authorized Signatory</p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          This is a computer generated receipt. Subject to Rajgarh (Rajasthan) jurisdiction.
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
