import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Consignments({ isNew }) {
  const navigate = useNavigate()
  const [bilties, setBilties] = useState([])
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(isNew || false)
  const [mrError, setMrError] = useState('')

  const [formData, setFormData] = useState({
    lr_no: '', lr_date: new Date().toISOString().split('T')[0], from_name: '', to_name: '',
    consignor_code: '', consignor_name: '', consignor_address: '', consignor_gst: '', invoice_no: '', invoice_date: '',
    consignee_code: '', consignee_name: '', consignee_address: '', consignee_gst: '', po_no: '',
    lorry_no: '', driver_mobile: '', delivery_type: 'DOOR DELIVERY',
    packages: '', method_of_packing: '', hsn_code: '', actual_weight: '', charged_weight: '',
    material_desc: '', eway_bill_no: '',
    length: '', width: '', height: '', total_cft: '',
    declared_value: '', basis_party: '', basis_booking: 'TO PAY',
    rv_no: '', rv_dt: '', rv_am: '',
    insurance_company: '', policy_no: '', insurance_amount: '',
    freight: '', aoc_percent: '', material_mgmt_ch: '', collection_charges: '', door_dly_charges: '', misc_charges: '', grand_total: '',
    status: 'Booked',
    // MR Details (required if PAID)
    mr_party_name: '', mr_amount: '', mr_payment_mode: 'Cash', mr_remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!showForm) {
      fetchBilties()
      fetchParties()
    } else {
      fetchParties()
      fetchNextLRNo()
    }
  }, [showForm])

  const fetchBilties = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/consignments`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setBilties(data.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchParties = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/parties`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setParties(data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchNextLRNo = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/consignments`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      const year = String(new Date().getFullYear()).slice(-2)
      if (data.data && data.data.length > 0) {
        const lastLR = data.data[0].lr_no
        const parts = lastLR.split('/')
        if (parts.length === 3) {
          const nextNum = parseInt(parts[2]) + 1
          setFormData(prev => ({ ...prev, lr_no: `BTC/${year}/${String(nextNum).padStart(4, '0')}` }))
        }
      } else {
        setFormData(prev => ({ ...prev, lr_no: `BTC/${year}/0001` }))
      }
    } catch (err) {
      const year = String(new Date().getFullYear()).slice(-2)
      setFormData(prev => ({ ...prev, lr_no: `BTC/${year}/0001` }))
    }
  }

  // Auto-generate next party code
  const getNextPartyCode = (existingCodes) => {
    let maxNum = 0
    existingCodes.forEach(code => {
      const match = code.match(/^P(\d+)$/i)
      if (match) {
        const num = parseInt(match[1])
        if (num > maxNum) maxNum = num
      }
    })
    return `P${String(maxNum + 1).padStart(3, '0')}`
  }

  const handlePartyCodeChange = (type, code) => {
    const party = parties.find(p => p.party_code === code)
    if (party) {
      if (type === 'consignor') {
        setFormData(prev => ({
          ...prev,
          consignor_code: code,
          consignor_name: party.party_name,
          consignor_address: party.address || '',
          consignor_gst: party.gst_no || '',
          mr_party_name: party.party_name
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          consignee_code: code,
          consignee_name: party.party_name,
          consignee_address: party.address || '',
          consignee_gst: party.gst_no || ''
        }))
      }
    } else if (code) {
      // Manual code entered - keep it
      if (type === 'consignor') {
        setFormData(prev => ({ ...prev, consignor_code: code }))
      } else {
        setFormData(prev => ({ ...prev, consignee_code: code }))
      }
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newData = { ...formData, [name]: type === 'checkbox' ? checked : value }
    setFormData(newData)

    // Auto-calculate grand total
    if (['freight', 'aoc_percent', 'material_mgmt_ch', 'collection_charges', 'door_dly_charges', 'misc_charges'].includes(name)) {
      setTimeout(() => calculateTotal(newData), 0)
    }

    // When PAID is selected, auto-fill MR party name and amount
    if (name === 'basis_booking' && value === 'PAID') {
      setFormData(prev => ({
        ...prev,
        basis_booking: 'PAID',
        mr_party_name: prev.consignor_name || '',
        mr_amount: prev.grand_total || ''
      }))
    }

    // Clear error when MR fields filled
    if (['mr_party_name', 'mr_amount', 'mr_payment_mode'].includes(name)) {
      setMrError('')
    }
  }

  const calculateTotal = (currentData) => {
    const freight = parseFloat(currentData.freight || 0)
    const aoc = parseFloat(currentData.aoc_percent || 0)
    const aocAmt = (freight * aoc) / 100
    const handling = parseFloat(currentData.material_mgmt_ch || 0)
    const collect = parseFloat(currentData.collection_charges || 0)
    const doorDly = parseFloat(currentData.door_dly_charges || 0)
    const other = parseFloat(currentData.misc_charges || 0)
    const total = freight + aocAmt + handling + collect + doorDly + other
    setFormData(prev => ({ ...prev, grand_total: total.toFixed(2) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMrError('')

    // VALIDATION: If PAID is selected, MR details are mandatory
    if (formData.basis_booking === 'PAID') {
      if (!formData.mr_party_name || !formData.mr_amount || !formData.mr_payment_mode) {
        setMrError('⚠️ PAID selected है - MR Party Name, Amount और Payment Mode भरना जरूरी है!')
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        return
      }
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'

      // Auto-generate party codes if not provided
      let finalConsignorCode = formData.consignor_code
      let finalConsigneeCode = formData.consignee_code

      if (formData.consignor_name && !finalConsignorCode) {
        const existingCodes = parties.map(p => p.party_code)
        finalConsignorCode = getNextPartyCode(existingCodes)
        setFormData(prev => ({ ...prev, consignor_code: finalConsignorCode }))
      }
      if (formData.consignee_name && !finalConsigneeCode) {
        const existingCodes = parties.map(p => p.party_code)
        finalConsigneeCode = getNextPartyCode(existingCodes)
        setFormData(prev => ({ ...prev, consignee_code: finalConsigneeCode }))
      }

      const biltyData = { ...formData, consignor_code: finalConsignorCode, consignee_code: finalConsigneeCode }

      // 1. Save Bilty
      const res = await fetch(`${apiUrl}/api/consignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(biltyData)
      })

      if (res.ok) {
        const savedBilty = await res.json()

        // 2. Save Parties
        if (finalConsignorCode && formData.consignor_name) {
          await fetch(`${apiUrl}/api/parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              party_code: finalConsignorCode,
              party_name: formData.consignor_name,
              address: formData.consignor_address,
              gst_no: formData.consignor_gst,
              email: ''
            })
          })
        }
        if (finalConsigneeCode && formData.consignee_name) {
          await fetch(`${apiUrl}/api/parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              party_code: finalConsigneeCode,
              party_name: formData.consignee_name,
              address: formData.consignee_address,
              gst_no: formData.consignee_gst,
              email: ''
            })
          })
        }

        // 3. Create MR if PAID or checkbox checked
        if (formData.basis_booking === 'PAID' || formData.create_mr) {
          const mrAmount = formData.mr_amount || formData.grand_total
          if (mrAmount && parseFloat(mrAmount) > 0) {
            await fetch(`${apiUrl}/api/mr`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                party_type: 'Consignor',
                party_name: formData.mr_party_name || formData.consignor_name,
                bilty_id: savedBilty.id,
                bilty_lr_no: savedBilty.lr_no,
                amount: mrAmount,
                payment_mode: formData.mr_payment_mode || 'Cash',
                is_advance: false,
                remarks: formData.mr_remarks || `Auto MR for Bilty ${savedBilty.lr_no}`
              })
            })
          }
        }

        alert('✅ Bilty saved successfully!' + (formData.basis_booking === 'PAID' ? '\n💰 MR also created (PAID basis)!' : ''))
        setShowForm(false)
        navigate('/consignments')
      } else {
        const err = await res.json()
        alert('Error: ' + (err.error || err.message))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (showForm) {
    const isPaid = formData.basis_booking === 'PAID'

    return (
      <div className="min-h-screen bg-gray-100 pb-20">
        <nav className="bg-red-700 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="font-bold text-lg">📝 Create New Bilty (TCI Style)</h1>
            <button onClick={() => setShowForm(false)} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm">← Back</button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">

            {/* Basic Details */}
            <div className="border-b pb-4">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">🚛 Basic Details</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">LR Number (Auto/Editable)</label>
                  <input name="lr_no" value={formData.lr_no} onChange={handleChange} className="w-full border-2 border-blue-500 p-2 rounded mt-1 font-bold text-blue-800" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">LR Date *</label>
                  <input name="lr_date" type="date" value={formData.lr_date} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">From *</label>
                  <input name="from_name" value={formData.from_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">To *</label>
                  <input name="to_name" value={formData.to_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
                </div>
              </div>
            </div>

            {/* Consignor */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold text-blue-900 mb-3"> CONSIGNOR (Sender)</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Party Code</label>
                  <select value={formData.consignor_code} onChange={(e) => handlePartyCodeChange('consignor', e.target.value)} className="w-full border p-2 rounded mt-1 mb-2">
                    <option value="">-- Select Existing Party --</option>
                    {parties.map(p => (<option key={p.id} value={p.party_code}>{p.party_code} - {p.party_name}</option>))}
                  </select>
                  <input name="consignor_code" value={formData.consignor_code} onChange={handleChange} placeholder="Or type new code (auto: P001, P002...)" className="w-full border p-2 rounded" />
                  <p className="text-xs text-gray-500 mt-1">💡 खाली छोड़ दो तो auto code (P001) बन जाएगा</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Party Name *</label>
                  <input name="consignor_name" value={formData.consignor_name} onChange={handleChange} className="w-full border p-2 rounded mt-1 font-bold" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">GST Number</label>
                  <input name="consignor_gst" value={formData.consignor_gst} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Full Address</label>
                  <textarea name="consignor_address" value={formData.consignor_address} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Inv No.</label>
                    <input name="invoice_no" value={formData.invoice_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Inv Date</label>
                    <input name="invoice_date" type="date" value={formData.invoice_date} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Consignee */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-bold text-red-900 mb-3">🎯 CONSIGNEE (Receiver)</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Party Code</label>
                  <select value={formData.consignee_code} onChange={(e) => handlePartyCodeChange('consignee', e.target.value)} className="w-full border p-2 rounded mt-1 mb-2">
                    <option value="">-- Select Existing Party --</option>
                    {parties.map(p => (<option key={p.id} value={p.party_code}>{p.party_code} - {p.party_name}</option>))}
                  </select>
                  <input name="consignee_code" value={formData.consignee_code} onChange={handleChange} placeholder="Or type new code" className="w-full border p-2 rounded" />
                  <p className="text-xs text-gray-500 mt-1">💡 खाली छोड़ दो तो auto code बनेगा</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Party Name *</label>
                  <input name="consignee_name" value={formData.consignee_name} onChange={handleChange} className="w-full border p-2 rounded mt-1 font-bold" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">GST Number</label>
                  <input name="consignee_gst" value={formData.consignee_gst} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Full Address</label>
                  <textarea name="consignee_address" value={formData.consignee_address} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1"></textarea>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">P.O. No.</label>
                  <input name="po_no" value={formData.po_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
            </div>

            {/* Transport & Goods */}
            <div className="border-b pb-4">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">📦 Goods & Transport Details</h3>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div><label className="text-sm font-bold text-gray-700">Lorry No.</label><input name="lorry_no" value={formData.lorry_no} onChange={handleChange} className="w-full border p-2 rounded mt-1 uppercase" /></div>
                <div><label className="text-sm font-bold text-gray-700">Driver Mobile</label><input name="driver_mobile" value={formData.driver_mobile} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Delivery Type</label>
                  <select name="delivery_type" value={formData.delivery_type} onChange={handleChange} className="w-full border p-2 rounded mt-1">
                    <option>DOOR DELIVERY</option><option>GODOWN DELIVERY</option><option>SELF PICKUP</option>
                  </select>
                </div>
                <div><label className="text-sm font-bold text-gray-700">E-Way Bill No.</label><input name="eway_bill_no" value={formData.eway_bill_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
              </div>
              <div className="grid md:grid-cols-5 gap-4">
                <div><label className="text-sm font-bold text-gray-700">Packages</label><input name="packages" value={formData.packages} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Method</label><input name="method_of_packing" value={formData.method_of_packing} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">HSN Code</label><input name="hsn_code" value={formData.hsn_code} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Actual Wt. (kg)</label><input name="actual_weight" value={formData.actual_weight} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Charged Wt. (kg)</label><input name="charged_weight" value={formData.charged_weight} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-bold text-gray-700">Material Description</label>
                <textarea name="material_desc" value={formData.material_desc} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1"></textarea>
              </div>
            </div>

            {/* Dimensions & Valuation */}
            <div className="grid md:grid-cols-2 gap-6 border-b pb-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-3">📏 Dimensions (L x W x H = CFT)</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div><label className="text-xs font-bold">Length</label><input name="length" value={formData.length} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">Width</label><input name="width" value={formData.width} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">Height</label><input name="height" value={formData.height} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">Total CFT</label><input name="total_cft" value={formData.total_cft} onChange={handleChange} className="w-full border p-2 rounded mt-1 font-bold" /></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-3">💰 Valuation & Booking Basis</h3>
                <div className="mb-2">
                  <label className="text-sm font-bold text-gray-700">Declared Value (Rs.)</label>
                  <input name="declared_value" value={formData.declared_value} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
                <div className="mb-2">
                  <label className="text-sm font-bold text-gray-700">Bill M/s (Basis Party)</label>
                  <input name="basis_party" value={formData.basis_party} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
                <div className="flex gap-4 mt-2 flex-wrap">
                  <label className={`flex items-center gap-1 cursor-pointer px-3 py-2 rounded border-2 ${formData.basis_booking === 'TO PAY' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                    <input type="radio" name="basis_booking" value="TO PAY" checked={formData.basis_booking === 'TO PAY'} onChange={handleChange} />
                    <span className="font-bold text-sm">TO PAY</span>
                  </label>
                  <label className={`flex items-center gap-1 cursor-pointer px-3 py-2 rounded border-2 ${formData.basis_booking === 'PAID' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
                    <input type="radio" name="basis_booking" value="PAID" checked={formData.basis_booking === 'PAID'} onChange={handleChange} />
                    <span className="font-bold text-sm">PAID ⚠️ MR Required</span>
                  </label>
                  <label className={`flex items-center gap-1 cursor-pointer px-3 py-2 rounded border-2 ${formData.basis_booking === 'TO BB' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
                    <input type="radio" name="basis_booking" value="TO BB" checked={formData.basis_booking === 'TO BB'} onChange={handleChange} />
                    <span className="font-bold text-sm">TO BB</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Receipt Voucher & Insurance */}
            <div className="grid md:grid-cols-2 gap-6 border-b pb-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-3">🧾 Receipt Voucher</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs font-bold">RV No.</label><input name="rv_no" value={formData.rv_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">RV Date</label><input name="rv_dt" value={formData.rv_dt} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">RV Amt</label><input name="rv_am" value={formData.rv_am} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-3">🛡️ Insurance</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs font-bold">Company</label><input name="insurance_company" value={formData.insurance_company} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">Policy No.</label><input name="policy_no" value={formData.policy_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                  <div><label className="text-xs font-bold">Amount</label><input name="insurance_amount" value={formData.insurance_amount} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                </div>
              </div>
            </div>

            {/* Charges */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">💵 Charges Breakdown</h3>
              <div className="grid md:grid-cols-6 gap-4">
                <div><label className="text-sm font-bold text-gray-700">Freight</label><input name="freight" type="number" value={formData.freight} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">A.O.C (%)</label><input name="aoc_percent" type="number" value={formData.aoc_percent} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Handling</label><input name="material_mgmt_ch" type="number" value={formData.material_mgmt_ch} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Collection</label><input name="collection_charges" type="number" value={formData.collection_charges} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Door Dly</label><input name="door_dly_charges" type="number" value={formData.door_dly_charges} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-sm font-bold text-gray-700">Other/Misc</label><input name="misc_charges" type="number" value={formData.misc_charges} onChange={handleChange} className="w-full border p-2 rounded mt-1" /></div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="text-lg font-bold text-gray-800">Grand Total (₹):</label>
                <input name="grand_total" type="number" value={formData.grand_total} onChange={handleChange} className="text-2xl font-bold text-green-700 border-2 border-green-500 p-2 rounded w-48" required />
              </div>
            </div>

            {/* MR Details - Mandatory when PAID */}
            {isPaid && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                <h3 className="font-bold text-green-900 mb-3 text-lg">💰 MR Details (PAID Basis - Mandatory)</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">MR Party Name *</label>
                    <input name="mr_party_name" value={formData.mr_party_name} onChange={handleChange} className="w-full border-2 border-green-500 p-2 rounded mt-1 font-bold" required placeholder="Party का नाम" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">MR Amount (₹) *</label>
                    <input name="mr_amount" type="number" value={formData.mr_amount} onChange={handleChange} className="w-full border-2 border-green-500 p-2 rounded mt-1 font-bold text-green-700" required />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Payment Mode *</label>
                    <select name="mr_payment_mode" value={formData.mr_payment_mode} onChange={handleChange} className="w-full border-2 border-green-500 p-2 rounded mt-1" required>
                      <option>Cash</option><option>Cheque</option><option>Bank Transfer</option><option>UPI</option><option>DD</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm font-bold text-gray-700">Remarks</label>
                  <textarea name="mr_remarks" value={formData.mr_remarks} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1" placeholder="MR के लिए कोई note..."></textarea>
                </div>
              </div>
            )}

            {/* Error Message */}
            {mrError && (
              <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-lg font-bold text-center">
                {mrError}
              </div>
            )}

            {/* Submit */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="create_mr" checked={formData.create_mr} onChange={handleChange} className="w-6 h-6 text-red-700 rounded" />
                <div>
                  <span className="font-bold text-lg text-yellow-900">💰 Also create separate MR</span>
                  <p className="text-sm text-yellow-800">PAID basis में यह auto-checked हो जाता है</p>
                </div>
              </label>
              <button type="submit" disabled={submitting} className="bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-red-800 disabled:bg-gray-400 shadow-lg min-w-[200px]">
                {submitting ? 'Saving...' : '✅ Save Bilty'}
              </button>
            </div>

          </form>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-lg"> Bilty List ({bilties.length})</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm">+ New Bilty</button>
            <button onClick={() => navigate('/mr')} className="bg-yellow-500 text-white px-4 py-1 rounded font-bold text-sm">💰 Money Receipts</button>
            <button onClick={() => navigate('/')} className="bg-red-800 text-white px-4 py-1 rounded font-bold text-sm">← Dashboard</button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
        {loading ? <div className="text-center py-20 text-xl font-bold">Loading...</div> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-sm font-bold">LR No</th>
                  <th className="p-3 text-left text-sm font-bold">Date</th>
                  <th className="p-3 text-left text-sm font-bold">From → To</th>
                  <th className="p-3 text-left text-sm font-bold">Consignor</th>
                  <th className="p-3 text-left text-sm font-bold">Amount</th>
                  <th className="p-3 text-left text-sm font-bold">Status</th>
                  <th className="p-3 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bilties.map(b => (
                  <tr key={b.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold text-red-700">{b.lr_no}</td>
                    <td className="p-3 text-sm">{b.lr_date}</td>
                    <td className="p-3 text-sm">{b.from_name} → {b.to_name}</td>
                    <td className="p-3 text-sm">{b.consignor_name}</td>
                    <td className="p-3 font-bold">₹{parseFloat(b.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'Delivered' ? 'bg-green-100 text-green-700' : b.status === 'In-Transit' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{b.status}</span>
                    </td>
                    <td className="p-3">
                      {b.mr_no ? (
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold mb-1 text-center">✅ Paid: {b.mr_no}</div>
                      ) : (
                        <button onClick={() => navigate(`/mr/create?biltyId=${b.id}`)} className="bg-green-600 text-white px-2 py-1 rounded text-xs mb-1 hover:bg-green-700 w-full font-bold">💰 Create MR</button>
                      )}
                      <div className="flex gap-1">
                        <button onClick={() => navigate('/bilty-print', { state: { bilty: b } })} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex-1">🖨️ Print</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
