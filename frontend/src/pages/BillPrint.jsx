import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  branch: "RAJGARH"
}

export default function BillPrint() {
  const navigate = useNavigate()
  const [biltyNo, setBiltyNo] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    bill_no: '',
    bill_date: new Date().toISOString().split('T')[0],
    party_name: '',
    party_gst: '',
    party_address: '',
    from_name: '',
    to_name: '',
    vehicle_no: '',
    items: [],
    trip_subtotal: 0,
    gst_percent: 0,
    gst_amount: 0,
    grand_total: 0,
    payment_mode: '',
    remarks: ''
  })

  // Auto-fetch bilty data
  useEffect(() => {
    if (biltyNo.length >= 3) {
      fetchBiltyData()
    }
  }, [biltyNo])

  const fetchBiltyData = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/consignments?lr_no=${biltyNo}`)
      if (res.data && res.data.data && res.data.data.length > 0) {
        const bilty = res.data.data[0]
        autoFillFromBilty(bilty)
      }
    } catch (err) {
      console.error('Error fetching bilty:', err)
    }
    setLoading(false)
  }

  const autoFillFromBilty = (bilty) => {
    setFormData({
      ...formData,
      party_name: bilty.consignor_name || '',
      party_gst: bilty.consignor_gst || '',
      party_address: bilty.consignor_address || '',
      from_name: bilty.from_name || '',
      to_name: bilty.to_name || '',
      vehicle_no: bilty.vehicle_no || '',
      items: [{
        lr_no: bilty.lr_no || '',
        invoice_no: bilty.invoice_no || '',
        from_name: bilty.from_name || '',
        to_name: bilty.to_name || '',
        weight_mt: bilty.weight_mt || 0,
        packages: bilty.packages || 0,
        total: bilty.grand_total || 0
      }],
      trip_subtotal: parseFloat(bilty.grand_total) || 0,
      grand_total: parseFloat(bilty.grand_total) || 0
    })
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    const gstAmount = (subtotal * formData.gst_percent) / 100
    const grandTotal = subtotal + gstAmount
    
    setFormData({
      ...formData,
      trip_subtotal: subtotal,
      gst_amount: gstAmount,
      grand_total: grandTotal
    })
  }

  const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      <div className="no-print mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <button onClick={() => navigate('/bills')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Back</button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Bilty/LR No..."
            value={biltyNo}
            onChange={(e) => setBiltyNo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          {loading && <span className="px-4 py-2 text-blue-600">Loading...</span>}
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">🖨️ Print Bill</button>
        </div>
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
            <p className="text-sm font-bold mt-1">
              Bill No: <input
                type="text"
                value={formData.bill_no}
                onChange={(e) => handleInputChange('bill_no', e.target.value)}
                className="text-red-700 text-xl border-b border-gray-400 w-48"
                placeholder="Enter Bill No"
              />
            </p>
            <p className="text-sm">
              Date: <input
                type="date"
                value={formData.bill_date}
                onChange={(e) => handleInputChange('bill_date', e.target.value)}
                className="border-b border-gray-400"
              />
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Original Copy (For Party)</p>
          </div>
        </div>

        {/* PARTY DETAILS */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border-2 border-gray-800 p-3 rounded">
            <p className="font-black text-gray-600 text-xs uppercase mb-2 bg-gray-100 p-1">Billed To (Party)</p>
            <input
              type="text"
              value={formData.party_name}
              onChange={(e) => handleInputChange('party_name', e.target.value)}
              className="font-bold text-lg w-full border-b border-gray-400 mb-2"
              placeholder="Party Name"
            />
            <input
              type="text"
              value={formData.party_address}
              onChange={(e) => handleInputChange('party_address', e.target.value)}
              className="w-full border-b border-gray-400 mb-2"
              placeholder="Party Address"
            />
            <input
              type="text"
              value={formData.party_gst}
              onChange={(e) => handleInputChange('party_gst', e.target.value)}
              className="w-full border-b border-gray-400"
              placeholder="GST No"
            />
          </div>
          <div className="border-2 border-gray-800 p-3 rounded">
            <p className="font-black text-gray-600 text-xs uppercase mb-2 bg-gray-100 p-1">Shipment Details</p>
            <p className="mb-2"><span className="font-bold">From:</span> 
              <input
                type="text"
                value={formData.from_name}
                onChange={(e) => handleInputChange('from_name', e.target.value)}
                className="border-b border-gray-400 ml-2"
              />
            </p>
            <p className="mb-2"><span className="font-bold">To:</span> 
              <input
                type="text"
                value={formData.to_name}
                onChange={(e) => handleInputChange('to_name', e.target.value)}
                className="border-b border-gray-400 ml-2"
              />
            </p>
            <p><span className="font-bold">Vehicle:</span> 
              <input
                type="text"
                value={formData.vehicle_no}
                onChange={(e) => handleInputChange('vehicle_no', e.target.value)}
                className="border-b border-gray-400 ml-2"
              />
            </p>
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
            {formData.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">
                  <input
                    type="text"
                    value={item.lr_no}
                    onChange={(e) => handleItemChange(idx, 'lr_no', e.target.value)}
                    className="w-full text-center bg-transparent"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="text"
                    value={item.invoice_no}
                    onChange={(e) => handleItemChange(idx, 'invoice_no', e.target.value)}
                    className="w-full text-center bg-transparent"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="text"
                    value={item.from_name}
                    onChange={(e) => handleItemChange(idx, 'from_name', e.target.value)}
                    className="w-full text-center bg-transparent"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="text"
                    value={item.to_name}
                    onChange={(e) => handleItemChange(idx, 'to_name', e.target.value)}
                    className="w-full text-center bg-transparent"
                  />
                </td>
                <td className="border border-black p-2 text-right">
                  <input
                    type="number"
                    value={item.weight_mt}
                    onChange={(e) => handleItemChange(idx, 'weight_mt', e.target.value)}
                    className="w-full text-right bg-transparent"
                  />
                </td>
                <td className="border border-black p-2 text-right">
                  <input
                    type="number"
                    value={item.packages}
                    onChange={(e) => handleItemChange(idx, 'packages', e.target.value)}
                    className="w-full text-right bg-transparent"
                  />
                </td>
                <td className="border border-black p-2 text-right font-bold">
                  <input
                    type="number"
                    value={item.total}
                    onChange={(e) => {
                      handleItemChange(idx, 'total', e.target.value)
                      setTimeout(calculateTotals, 100)
                    }}
                    className="w-full text-right bg-transparent font-bold"
                  />
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td colSpan="6" className="border border-black p-2 text-right">Trip Sub-Total:</td>
              <td className="border border-black p-2 text-right">{formatCurrency(formData.trip_subtotal)}</td>
            </tr>
            <tr>
              <td colSpan="6" className="border border-black p-2 text-right">
                GST (
                <input
                  type="number"
                  value={formData.gst_percent}
                  onChange={(e) => {
                    handleInputChange('gst_percent', parseFloat(e.target.value) || 0)
                    setTimeout(calculateTotals, 100)
                  }}
                  className="w-16 text-center border-b border-gray-400"
                />
                %):
              </td>
              <td className="border border-black p-2 text-right">{formatCurrency(formData.gst_amount)}</td>
            </tr>
            <tr className="bg-gray-200 font-black text-lg">
              <td colSpan="6" className="border border-black p-2 text-right">Grand Total:</td>
              <td className="border border-black p-2 text-right text-red-700">{formatCurrency(formData.grand_total)}</td>
            </tr>
          </tbody>
        </table>

        {/* BANK & PAYMENT DETAILS */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-black">
          <div className="text-sm">
            <p className="font-black text-gray-800 mb-2 uppercase border-b border-gray-400 pb-1">Bank Account Details</p>
            <p><span className="font-bold">Beneficiary:</span> {COMPANY.name}</p>
            <p><span className="font-bold">Bank:</span> {COMPANY.bankName}, {COMPANY.branch}</p>
            <p><span className="font-bold">A/c No:</span> {COMPANY.accountNo}</p>
            <p><span className="font-bold">IFSC:</span> {COMPANY.ifsc}</p>
            <p className="mt-2 font-bold text-red-600">
              Payment Mode: 
              <input
                type="text"
                value={formData.payment_mode}
                onChange={(e) => handleInputChange('payment_mode', e.target.value)}
                className="border-b border-gray-400 ml-2"
                placeholder="Cash/Cheque/Online"
              />
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold mb-8">For {COMPANY.name}</p>
            <div className="border-t-2 border-black inline-block pt-1">
              <p className="text-xs font-bold">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* REMARKS */}
        <div className="mt-6">
          <p className="font-bold text-sm mb-2">Remarks:</p>
          <textarea
            value={formData.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            className="w-full border border-gray-400 rounded p-2"
            rows="2"
            placeholder="Enter remarks..."
          />
        </div>

        <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          This is a computer generated invoice. Subject to Rajgarh (Rajasthan) jurisdiction.
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          input { border: none !important; }
        }
      `}</style>
    </div>
  )
}
