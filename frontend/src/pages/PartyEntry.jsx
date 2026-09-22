import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { customerAPI } from '../api'
import toast from 'react-hot-toast'

export default function PartyEntry() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_no: '',
    pan_no: '',
    customer_type: 'Cash',
    credit_limit: 0,
    credit_days: 0,
    opening_balance: 0,
    is_active: true
  })

  useEffect(() => {
    if (isEdit) {
      fetchCustomer()
    } else {
      generateCustomerCode()
    }
  }, [id])

  const generateCustomerCode = async () => {
    try {
      const res = await customerAPI.getAll()
      const last = res.data[res.data.length - 1]
      if (last && last.customer_code) {
        const match = last.customer_code.match(/(\d+)$/)
        if (match) {
          const nextNum = parseInt(match[1]) + 1
          setFormData(prev => ({ ...prev, customer_code: `CUST${String(nextNum).padStart(4, '0')}` }))
        }
      } else {
        setFormData(prev => ({ ...prev, customer_code: 'CUST0001' }))
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, customer_code: 'CUST0001' }))
    }
  }

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const res = await customerAPI.getOne(id)
      const data = res.data
      setFormData({
        customer_code: data.customer_code || '',
        customer_name: data.customer_name || data.name || '',
        mobile: data.mobile || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        gst_no: data.gst_no || '',
        pan_no: data.pan_no || '',
        customer_type: data.customer_type || 'Cash',
        credit_limit: data.credit_limit || 0,
        credit_days: data.credit_days || 0,
        opening_balance: data.opening_balance || 0,
        is_active: data.is_active !== false
      })
    } catch (err) {
      toast.error('Party details load नहीं हो पाईं')
      navigate('/party')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.customer_name || !formData.mobile) {
      toast.error('Party Name और Mobile required हैं')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await customerAPI.update(id, formData)
        toast.success('Party update हो गई!')
      } else {
        await customerAPI.create(formData)
        toast.success('New Party add हो गई!')
      }
      navigate('/party')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save party')
    } finally {
      setLoading(false)
    }
  }

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ]

  if (loading && isEdit) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">{isEdit ? 'Edit Party' : 'Add New Party'}</h1>
          <button onClick={() => navigate('/party')} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">← Back to List</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-6">
          
          {/* Basic Details */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📋 Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Customer Code</label>
                <input type="text" name="customer_code" value={formData.customer_code} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Party Name *</label>
                <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Customer Type</label>
                <select name="customer_type" value={formData.customer_type} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                  <option value="Cash" className="bg-slate-800 text-black">Cash</option>
                  <option value="Credit" className="bg-slate-800 text-black">Credit</option>
                  <option value="To-Pay" className="bg-slate-800 text-black">To-Pay</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📞 Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Mobile *</label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">WhatsApp</label>
                <input type="tel" name="whatsapp" value={formData.whatsapp || formData.mobile} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📍 Address Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-1">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">State</label>
                <select name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                  <option value="" className="bg-slate-800 text-black">Select State</option>
                  {states.map(s => <option key={s} value={s} className="bg-slate-800 text-black">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Pincode</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Financial & Tax Details */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">💼 Financial & Tax Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">GST No</label>
                <input type="text" name="gst_no" value={formData.gst_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white uppercase" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">PAN No</label>
                <input type="text" name="pan_no" value={formData.pan_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white uppercase" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Credit Limit (₹)</label>
                <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Credit Days</label>
                <input type="number" name="credit_days" value={formData.credit_days} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Opening Balance (₹)</label>
                <input type="number" name="opening_balance" value={formData.opening_balance} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                  <span className="text-gray-300 text-sm font-medium">Active Party</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={() => navigate('/party')} className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium disabled:opacity-50">
              {loading ? 'Saving...' : (isEdit ? 'Update Party' : 'Save Party')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
