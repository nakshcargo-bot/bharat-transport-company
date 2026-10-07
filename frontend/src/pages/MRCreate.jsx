import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function MRCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const biltyId = searchParams.get('biltyId')
  const billId = searchParams.get('billId')

  const [bilties, setBilties] = useState([])
  const [bills, setBills] = useState([])
  const [formData, setFormData] = useState({
    mr_no: 'Auto-generated',
    mr_date: new Date().toISOString().split('T')[0],
    party_type: 'Consignor',
    party_name: '',
    bilty_id: biltyId || '',
    bilty_lr_no: '',
    bill_id: billId || '',
    bill_no: '',
    amount: '',
    payment_mode: 'Cash',
    is_advance: false,
    remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (bilties.length > 0 && biltyId) {
      loadBiltyData(biltyId)
    }
    if (bills.length > 0 && billId) {
      loadBillData(billId)
    }
  }, [bilties, bills])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      // Fetch bilties
      const biltyRes = await fetch(`${apiUrl}/api/consignments`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      const biltyData = await biltyRes.json()
      setBilties(biltyData.data || [])

      // Fetch bills
      try {
        const billRes = await fetch(`${apiUrl}/api/bills`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (billRes.ok) {
          const billData = await billRes.json()
          setBills(billData.data || [])
        } else {
          setBills([])
        }
      } catch (e) { 
        console.error('Bills fetch error:', e)
        setBills([]) 
      }
    } catch (err) { 
      console.error(err) 
    }
  }

  const loadBiltyData = (id) => {
    const bilty = bilties.find(b => b.id == id)
    if (bilty) {
      setFormData(prev => ({
        ...prev,
        bilty_id: bilty.id,
        bilty_lr_no: bilty.lr_no,
        party_name: bilty.consignor_name || '',
        amount: bilty.grand_total || ''
      }))
    }
  }

  const loadBillData = (id) => {
    const bill = bills.find(b => b.id == id)
    if (bill) {
      setFormData(prev => ({
        ...prev,
        bill_id: bill.id,
        bill_no: bill.bill_no || bill.id,
        party_name: bill.party_name || bill.consignor_name || '',
        amount: bill.amount || bill.grand_total || ''
      }))
    }
  }

  const handleBiltyChange = (e) => {
    const id = e.target.value
    setFormData(prev => ({ ...prev, bilty_id: id, bill_id: '', bill_no: '' }))
    if (id) {
      setTimeout(() => loadBiltyData(id), 100)
    }
  }

  const handleBillChange = (e) => {
    const id = e.target.value
    setFormData(prev => ({ ...prev, bill_id: id, bilty_id: '', bilty_lr_no: '' }))
    if (id) {
      setTimeout(() => loadBillData(id), 100)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/mr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ MR Created Successfully!\nMR No: ${data.mr_no}`)
        navigate('/mr')
      } else {
        alert('Error: ' + data.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-lg">💰 Create Money Receipt</h1>
          <button onClick={() => navigate(-1)} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm">← Back</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* MR Details */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700">MR Number (Auto)</label>
              <input 
                name="mr_no" 
                value={formData.mr_no} 
                readOnly 
                className="w-full border p-2 rounded mt-1 bg-gray-200 cursor-not-allowed font-bold text-gray-600" 
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">MR Date *</label>
              <input name="mr_date" type="date" value={formData.mr_date} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Party Type *</label>
              <select name="party_type" value={formData.party_type} onChange={handleChange} className="w-full border p-2 rounded mt-1">
                <option>Consignor</option>
                <option>Consignee</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Link to Bilty or Bill */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-3">🔗 Link to Bilty / Bill (Optional)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Select Bilty</label>
                <select name="bilty_id" value={formData.bilty_id} onChange={handleBiltyChange} className="w-full border p-2 rounded mt-1">
                  <option value="">-- Select Bilty --</option>
                  {bilties.map(b => (
                    <option key={b.id} value={b.id}>{b.lr_no} - {b.consignor_name} - ₹{b.grand_total}</option>
                  ))}
                </select>
                {formData.bilty_lr_no && <div className="text-xs text-blue-700 mt-1">✅ Linked: {formData.bilty_lr_no}</div>}
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Select Bill</label>
                <select name="bill_id" value={formData.bill_id} onChange={handleBillChange} className="w-full border p-2 rounded mt-1">
                  <option value="">-- Select Bill --</option>
                  {bills.length === 0 && <option disabled>No bills available</option>}
                  {bills.map(b => (
                    <option key={b.id} value={b.id}>{b.bill_no || `Bill-${b.id}`} - {b.party_name || b.consignor_name || 'Unknown'} - ₹{b.amount || b.grand_total || 0}</option>
                  ))}
                </select>
                {formData.bill_no && <div className="text-xs text-purple-700 mt-1">✅ Linked: {formData.bill_no}</div>}
              </div>
            </div>
          </div>

          {/* Party & Amount */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Party Name *</label>
              <input name="party_name" value={formData.party_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Amount (₹) *</label>
              <input name="amount" type="number" value={formData.amount} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Payment Mode *</label>
              <select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className="w-full border p-2 rounded mt-1">
                <option>Cash</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
                <option>UPI</option>
                <option>DD</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer bg-yellow-50 border-2 border-yellow-300 p-3 rounded-lg w-full">
                <input type="checkbox" name="is_advance" checked={formData.is_advance} onChange={handleChange} className="w-5 h-5" />
                <span className="font-bold text-yellow-900">️ This is Advance Payment</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3" className="w-full border p-2 rounded mt-1" placeholder="Any additional notes..."></textarea>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-red-700 text-white py-3 rounded-lg font-bold hover:bg-red-800 disabled:bg-gray-400">
            {submitting ? 'Creating MR...' : '✅ Create Money Receipt'}
          </button>
        </form>
      </div>
    </div>
  )
}
