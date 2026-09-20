import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'

export default function BillEntry() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [branches, setBranches] = useState([])

  const [form, setForm] = useState({
    bill_date: new Date().toISOString().split('T')[0],
    branch_code: '',
    party_name: '',
    party_gst: '',
    party_address: '',
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    from_name: '',
    to_name: '',
    consignor_name: '',
    consignee_name: '',
    vehicle_no: '',
    trip_subtotal: 0,
    gst_percent: 0,
    gst_amount: 0,
    grand_total: 0,
    advance_received: 0,
    net_balance: 0,
    payment_mode: 'Cash',
    payment_details: '',
    amount_in_words: '',
    remarks: ''
  })

  const [items, setItems] = useState([
    { lr_no: '', invoice_no: '', from_name: '', to_name: '', weight_mt: 0, loading: 0, unloading: 0, other_charges: 0, total: 0 }
  ])

  useEffect(() => {
    loadMasters()
  }, [])

  const loadMasters = async () => {
    try {
      const [c, b] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/branches')
      ])
      setCustomers(c.data)
      setBranches(b.data)
    } catch (err) {
      console.error(err)
    }
  }

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const updateItem = (index, key, value) => {
    const newItems = [...items]
    newItems[index][key] = value
    setItems(newItems)
    calculateTotals(newItems)
  }

  const calculateTotals = (itemList) => {
    const subtotal = itemList.reduce((sum, item) => {
      const rowTotal = Number(item.total) || (Number(item.loading) + Number(item.unloading) + Number(item.other_charges))
      return sum + rowTotal
    }, 0)
    
    const gstAmount = (subtotal * Number(form.gst_percent)) / 100
    const grandTotal = subtotal + gstAmount
    const netBalance = grandTotal - Number(form.advance_received)
    
    setForm(prev => ({
      ...prev,
      trip_subtotal: subtotal,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      net_balance: netBalance
    }))
  }

  const addItem = () => {
    setItems([...items, { lr_no: '', invoice_no: '', from_name: '', to_name: '', weight_mt: 0, loading: 0, unloading: 0, other_charges: 0, total: 0 }])
  }

  const removeItem = (index) => {
    if (items.length === 1) return
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    calculateTotals(newItems)
  }

  const selectCustomer = (customerId) => {
    const customer = customers.find(c => c.id === Number(customerId))
    if (customer) {
      setForm(prev => ({
        ...prev,
        party_name: customer.customer_name,
        party_gst: customer.gst_no || '',
        party_address: customer.address || ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, items }
      const res = await api.post('/api/bills', payload)
      toast.success('Bill created successfully!')
      navigate(`/bill/print/${res.data.bill_no}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create bill')
    } finally {
      setLoading(false)
    }
    
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg">📄 New Bill Entry</h1>
          <button onClick={() => navigate('/dashboard')} className="bg-white text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bill Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Bill Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bill Date *</label>
                <input type="date" value={form.bill_date} onChange={(e) => updateForm('bill_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Branch</label>
                <select value={form.branch_code} onChange={(e) => updateForm('branch_code', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.branch_code}>{b.branch_code} - {b.branch_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice No.</label>
                <input type="text" value={form.invoice_no} onChange={(e) => updateForm('invoice_no', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="INV/2026/001" />
              </div>
            </div>
          </div>

          {/* Party Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Bill To (Party Details)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Select Customer</label>
                <select onChange={(e) => selectCustomer(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Party Name *</label>
                <input type="text" value={form.party_name} onChange={(e) => updateForm('party_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST No.</label>
                <input type="text" value={form.party_gst} onChange={(e) => updateForm('party_gst', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input type="text" value={form.party_address} onChange={(e) => updateForm('party_address', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Shipment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From (Consignor)</label>
                <input type="text" value={form.from_name} onChange={(e) => updateForm('from_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To (Consignee)</label>
                <input type="text" value={form.to_name} onChange={(e) => updateForm('to_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Consignor Name</label>
                <input type="text" value={form.consignor_name} onChange={(e) => updateForm('consignor_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Consignee Name</label>
                <input type="text" value={form.consignee_name} onChange={(e) => updateForm('consignee_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle No.</label>
                <input type="text" value={form.vehicle_no} onChange={(e) => updateForm('vehicle_no', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="MH 14 GD 9824" />
              </div>
            </div>
          </div>

          {/* Bill Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-800">Bill Items (LR Entries)</h2>
              <button type="button" onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                + Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left">LR No.</th>
                    <th className="px-2 py-2 text-left">Invoice No.</th>
                    <th className="px-2 py-2 text-left">From</th>
                    <th className="px-2 py-2 text-left">To</th>
                    <th className="px-2 py-2 text-right">Wt (MT)</th>
                    <th className="px-2 py-2 text-right">Loading</th>
                    <th className="px-2 py-2 text-right">Unloading</th>
                    <th className="px-2 py-2 text-right">Other</th>
                    <th className="px-2 py-2 text-right">Total</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1"><input type="text" value={item.lr_no} onChange={(e) => updateItem(i, 'lr_no', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                      <td className="px-2 py-1"><input type="text" value={item.invoice_no} onChange={(e) => updateItem(i, 'invoice_no', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                      <td className="px-2 py-1"><input type="text" value={item.from_name} onChange={(e) => updateItem(i, 'from_name', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                      <td className="px-2 py-1"><input type="text" value={item.to_name} onChange={(e) => updateItem(i, 'to_name', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                      <td className="px-2 py-1"><input type="number" value={item.weight_mt} onChange={(e) => updateItem(i, 'weight_mt', e.target.value)} className="w-20 px-2 py-1 border rounded text-right" /></td>
                      <td className="px-2 py-1"><input type="number" value={item.loading} onChange={(e) => updateItem(i, 'loading', e.target.value)} className="w-20 px-2 py-1 border rounded text-right" /></td>
                      <td className="px-2 py-1"><input type="number" value={item.unloading} onChange={(e) => updateItem(i, 'unloading', e.target.value)} className="w-20 px-2 py-1 border rounded text-right" /></td>
                      <td className="px-2 py-1"><input type="number" value={item.other_charges} onChange={(e) => updateItem(i, 'other_charges', e.target.value)} className="w-20 px-2 py-1 border rounded text-right" /></td>
                      <td className="px-2 py-1"><input type="number" value={item.total} onChange={(e) => updateItem(i, 'total', e.target.value)} className="w-24 px-2 py-1 border rounded text-right font-bold" /></td>
                      <td className="px-2 py-1">
                        <button type="button" onClick={() => removeItem(i)} className="text-red-600 hover:text-red-800">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amounts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Amount Calculation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-medium">Trip Sub-Total:</label>
                  <span className="font-bold text-lg">₹{Number(form.trip_subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <label className="font-medium">GST (%):</label>
                  <input type="number" value={form.gst_percent} onChange={(e) => { updateForm('gst_percent', e.target.value); calculateTotals(items) }} className="w-24 px-3 py-1 border rounded text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="font-medium">GST Amount:</label>
                  <span className="font-bold">₹{Number(form.gst_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <label className="font-bold text-lg">Grand Total:</label>
                  <span className="font-bold text-lg text-red-700">₹{Number(form.grand_total).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <label className="font-medium">Advance Received:</label>
                  <input type="number" value={form.advance_received} onChange={(e) => { updateForm('advance_received', e.target.value); calculateTotals(items) }} className="w-32 px-3 py-1 border rounded text-right" />
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <label className="font-bold text-lg">Net Balance:</label>
                  <span className="font-bold text-lg text-green-700">₹{Number(form.net_balance).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Mode</label>
                  <select value={form.payment_mode} onChange={(e) => updateForm('payment_mode', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Details</label>
                  <input type="text" value={form.payment_details} onChange={(e) => updateForm('payment_details', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Cheque No / UPI Txn ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount in Words</label>
                  <input type="text" value={form.amount_in_words} onChange={(e) => updateForm('amount_in_words', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea value={form.remarks} onChange={(e) => updateForm('remarks', e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows="2"></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-gray-300 rounded-lg font-medium hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 disabled:opacity-50">
              {loading ? 'Saving...' : '💾 Save & Print Bill'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
  }
