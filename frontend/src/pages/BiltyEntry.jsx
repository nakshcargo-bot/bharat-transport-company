import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { biltyAPI, customerAPI } from '../api'
import toast from 'react-hot-toast'

// Custom Dropdown Component
function CustomSelect({ label, value, onChange, options, name, required }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label || (label.includes('Select') ? label : `Select ${label}`)

  return (
    <div className="relative" ref={ref}>
      <label className="block text-gray-300 text-sm font-medium mb-1">{label}{required && ' *'}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer flex justify-between items-center hover:bg-white/10 transition"
      >
        <span>{selectedLabel}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange({ target: { name, value: option.value } })
                setIsOpen(false)
              }}
              className={`px-4 py-2 cursor-pointer text-black hover:bg-blue-100 ${
                value === option.value ? 'bg-blue-500 text-white' : 'bg-white'
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Number to Words
const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero Only'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
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
  let result = 'Rupees ' + convert(rupees)
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise'
  return result + ' Only'
}

export default function BiltyEntry() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [branches] = useState([
    { code: 'RAJ', name: 'Rajgarh' },
    { code: 'DEL', name: 'Delhi' },
    { code: 'MUM', name: 'Mumbai' },
    { code: 'JAI', name: 'Jaipur' },
    { code: 'AHM', name: 'Ahmedabad' }
  ])

  const [formData, setFormData] = useState({
    lr_no: '', lr_date: new Date().toISOString().split('T')[0], branch_code: '', from_code: '', from_name: '', to_code: '', to_name: '',
    delivery_type: 'Door Delivery', unloading_party_mobile: '', delivery_godown_address: '', pickup_address: '',
    consignor_name: '', consignor_address: '', consignor_gst: '', consignor_mobile: '', customer_code_consignor: '',
    consignee_name: '', consignee_address: '', consignee_gst: '', consignee_mobile: '', customer_code_consignee: '',
    invoice_no: '', invoice_date: '', po_no: '', po_date: '',
    vehicle_no: '', driver_name: '', driver_mobile: '',
    no_of_packages: 0, method_of_packing: '', hsn_code: '', description: '', actual_weight: 0, charged_weight: 0, rate: 0, distance: 0,
    length: 0, width: 0, height: 0, no_of_pkgs_dimension: 0, total_cft_cmt: 0,
    private_marks: '', mr_no: '', mr_date: '', mr_amount: 0, load_type: 'Part Load',
    freight: 0, aoc_percent: 0, aoc_amount: 0, eov_charges: 0, cover_charges: 0, material_mgmt_ch: 0,
    collection_charges: 0, door_dly_charges: 0, pass_cc_charges: 0, enroute_charges: 0,
    statistical_charges: 0, misc_charges: 0, grand_total: 0,
    eway_bill_no: '', eway_valid_upto: '',
    payment_type: '', payment_amount: 0, declared_value: 0, basis_of_booking: '', billed_at: '', gst_through: '', amount_in_words: '',
    // Insurance fields
    insurance_status: 'Not Insured', insurance_company: '', insurance_policy_no: '', insurance_date: '', insurance_amount: 0,
    created_by: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username || 'Admin' : 'Admin'
  })

  useEffect(() => {
    fetchCustomers()
    generateLRNo()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAll()
      setCustomers(res.data)
    } catch (err) { console.error('Failed to load customers') }
  }

  const generateLRNo = async () => {
    try {
      const res = await biltyAPI.getAll()
      const last = res.data[res.data.length - 1]
      const year = new Date().getFullYear().toString().slice(-2)
      if (last && last.lr_no) {
        const match = last.lr_no.match(/(\d+)$/)
        if (match) {
          const nextNum = parseInt(match[1]) + 1
          setFormData(prev => ({ ...prev, lr_no: `BTC/${year}/${String(nextNum).padStart(4, '0')}` }))
        }
      } else {
        setFormData(prev => ({ ...prev, lr_no: `BTC/${year}/0001` }))
      }
    } catch (err) {
      const year = new Date().getFullYear().toString().slice(-2)
      setFormData(prev => ({ ...prev, lr_no: `BTC/${year}/0001` }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Auto: Freight = Charged Wt × Rate
      if (name === 'charged_weight' || name === 'rate') {
        const w = parseFloat(name === 'charged_weight' ? value : prev.charged_weight) || 0
        const r = parseFloat(name === 'rate' ? value : prev.rate) || 0
        newData.freight = w * r
      }
      
      // Auto: A.O.C. Amount = Freight × AOC% / 100
      if (name === 'aoc_percent' || name === 'freight') {
        const freight = parseFloat(name === 'freight' ? value : prev.freight) || 0
        const aocPercent = parseFloat(name === 'aoc_percent' ? value : prev.aoc_percent) || 0
        newData.aoc_amount = (freight * aocPercent) / 100
      }
      
      // Auto: CFT/CMT = L × W × H × Pkgs
      if (['length', 'width', 'height', 'no_of_pkgs_dimension'].includes(name)) {
        const l = parseFloat(name === 'length' ? value : prev.length) || 0
        const w = parseFloat(name === 'width' ? value : prev.width) || 0
        const h = parseFloat(name === 'height' ? value : prev.height) || 0
        const qty = parseFloat(name === 'no_of_pkgs_dimension' ? value : prev.no_of_pkgs_dimension) || 0
        newData.total_cft_cmt = l * w * h * qty
      }
      
      // Auto: Grand Total = Sum of all charges
      const chargeFields = ['freight', 'aoc_amount', 'eov_charges', 'cover_charges', 'material_mgmt_ch', 
        'collection_charges', 'door_dly_charges', 'pass_cc_charges', 'enroute_charges', 
        'statistical_charges', 'misc_charges']
      
      if (chargeFields.includes(name)) {
        let total = 0
        chargeFields.forEach(f => { 
          const val = f === name ? parseFloat(value) : parseFloat(newData[f] || prev[f]) || 0
          total += val 
        })
        newData.grand_total = total
        newData.amount_in_words = numberToWords(total)
      }
      
      return newData
    })
  }

  const handleCustomerSelect = (type, customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId))
    if (customer) {
      setFormData(prev => ({
        ...prev,
        [`${type}_name`]: customer.customer_name || customer.name,
        [`${type}_address`]: customer.address || '',
        [`${type}_mobile`]: customer.mobile || '',
        [`${type}_gst`]: customer.gst_no || '',
        [`customer_code_${type}`]: customer.customer_code || ''
      }))
    }
  }

  const handleBranchSelect = (type, code) => {
    const branch = branches.find(b => b.code === code)
    if (branch) {
      setFormData(prev => ({ ...prev, [`${type}_code`]: code, [`${type}_name`]: branch.name }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.consignor_name || !formData.consignee_name) {
      toast.error('Consignor और Consignee का नाम required है')
      return
    }
    setLoading(true)
    try {
      await biltyAPI.create(formData)
      toast.success('Bilty successfully created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create bilty')
    } finally {
      setLoading(false)
    }
  }

  const branchOptions = [{ value: '', label: 'Select Branch' }, ...branches.map(b => ({ value: b.code, label: `${b.code} - ${b.name}` }))]
  const deliveryOptions = [
    { value: 'Door Delivery', label: 'Door Delivery' },
    { value: 'Godown Delivery', label: 'Godown Delivery' },
    { value: 'Pickup', label: 'Pickup' },
    { value: 'Self', label: 'Self' }
  ]
  const paymentOptions = [
    { value: '', label: 'Select' },
    { value: 'To Pay', label: 'To Pay' },
    { value: 'Paid', label: 'Paid' },
    { value: 'TBB', label: 'TBB' },
    { value: 'Credit', label: 'Credit' }
  ]
  const gstOptions = [
    { value: '', label: 'Select' },
    { value: 'CONSIGNOR', label: 'CONSIGNOR' },
    { value: 'CONSIGNEE', label: 'CONSIGNEE' },
    { value: 'N.B.T.C.', label: 'N.B.T.C.' }
  ]
  const loadTypeOptions = [
    { value: 'Full Load', label: 'Full Load' },
    { value: 'Part Load', label: 'Part Load' }
  ]
  const insuranceOptions = [
    { value: 'Not Insured', label: 'Not Insured' },
    { value: 'Insured', label: 'Insured' }
  ]

  const consignorOptions = [{ value: '', label: 'Select Party' }, ...customers.map(c => ({ value: c.id, label: c.customer_name || c.name }))]
  const consigneeOptions = [{ value: '', label: 'Select Party' }, ...customers.map(c => ({ value: c.id, label: c.customer_name || c.name }))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Create New Bilty (LR)</h1>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">← Back</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-6">
          
          {/* Section 1: Header */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📋 Section 1: Header Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">LR Number *</label>
                <input type="text" value={formData.lr_no} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">LR Date *</label>
                <input type="date" name="lr_date" value={formData.lr_date} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <CustomSelect label="Branch" name="branch_code" value={formData.branch_code} onChange={handleChange} options={branchOptions} required />
              </div>
              <div>
                <CustomSelect label="From Code" name="from_code" value={formData.from_code} onChange={(e) => handleBranchSelect('from', e.target.value)} options={branchOptions} required />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">From Name *</label>
                <input type="text" name="from_name" value={formData.from_name} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <CustomSelect label="To Code" name="to_code" value={formData.to_code} onChange={(e) => handleBranchSelect('to', e.target.value)} options={branchOptions} required />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">To Name *</label>
                <input type="text" name="to_name" value={formData.to_name} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <CustomSelect label="Delivery Type" name="delivery_type" value={formData.delivery_type} onChange={handleChange} options={deliveryOptions} required />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Unloading Party Mobile</label>
                <input type="text" name="unloading_party_mobile" value={formData.unloading_party_mobile} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-1">Delivery Godown Address</label>
                <input type="text" name="delivery_godown_address" value={formData.delivery_godown_address} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-gray-300 text-sm font-medium mb-1">Pickup Address</label>
                <input type="text" name="pickup_address" value={formData.pickup_address} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 2: Consignor */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4"> Section 2: Consignor (भेजने वाला)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <CustomSelect label="Select Party" name="consignor_select" value="" onChange={(e) => handleCustomerSelect('consignor', e.target.value)} options={consignorOptions} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignor Name *</label>
                <input type="text" name="consignor_name" value={formData.consignor_name} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignor Mobile *</label>
                <input type="text" name="consignor_mobile" value={formData.consignor_mobile} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignor Address *</label>
                <textarea name="consignor_address" value={formData.consignor_address} onChange={handleChange} required rows="2" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignor GST</label>
                <input type="text" name="consignor_gst" value={formData.consignor_gst} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Customer Code</label>
                <input type="text" name="customer_code_consignor" value={formData.customer_code_consignor} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 3: Consignee */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📥 Section 3: Consignee (लेने वाला)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <CustomSelect label="Select Party" name="consignee_select" value="" onChange={(e) => handleCustomerSelect('consignee', e.target.value)} options={consigneeOptions} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignee Name *</label>
                <input type="text" name="consignee_name" value={formData.consignee_name} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignee Mobile *</label>
                <input type="text" name="consignee_mobile" value={formData.consignee_mobile} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignee Address *</label>
                <textarea name="consignee_address" value={formData.consignee_address} onChange={handleChange} required rows="2" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Consignee GST</label>
                <input type="text" name="consignee_gst" value={formData.consignee_gst} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Customer Code</label>
                <input type="text" name="customer_code_consignee" value={formData.customer_code_consignee} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 4: Invoice */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📄 Section 4: Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Invoice No</label>
                <input type="text" name="invoice_no" value={formData.invoice_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Invoice Date</label>
                <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Purchase Order No</label>
                <input type="text" name="po_no" value={formData.po_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">PO Date</label>
                <input type="date" name="po_date" value={formData.po_date} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 5: Vehicle & Driver */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🚚 Section 5: Vehicle & Driver</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Lorry No (Vehicle No)</label>
                <input type="text" name="vehicle_no" value={formData.vehicle_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Driver Name</label>
                <input type="text" name="driver_name" value={formData.driver_name} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Driver Mobile</label>
                <input type="text" name="driver_mobile" value={formData.driver_mobile} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 6: Insurance */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🛡️ Section 6: Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <CustomSelect label="Insurance Status" name="insurance_status" value={formData.insurance_status} onChange={handleChange} options={insuranceOptions} />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Insurance Company</label>
                <input type="text" name="insurance_company" value={formData.insurance_company} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Policy No</label>
                <input type="text" name="insurance_policy_no" value={formData.insurance_policy_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Insurance Date</label>
                <input type="date" name="insurance_date" value={formData.insurance_date} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Insurance Amount (₹)</label>
                <input type="number" name="insurance_amount" value={formData.insurance_amount} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 7: Package */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📦 Section 7: Package Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">No of Packages *</label>
                <input type="number" name="no_of_packages" value={formData.no_of_packages} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Method of Packing</label>
                <input type="text" name="method_of_packing" value={formData.method_of_packing} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">HSN Code</label>
                <input type="text" name="hsn_code" value={formData.hsn_code} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Distance (Kms)</label>
                <input type="number" name="distance" value={formData.distance} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-1">Description (Said to Contain) *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="2" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Actual Weight (Kg) *</label>
                <input type="number" name="actual_weight" value={formData.actual_weight} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Charged Weight (Kg) *</label>
                <input type="number" name="charged_weight" value={formData.charged_weight} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Rate *</label>
                <input type="number" name="rate" value={formData.rate} onChange={handleChange} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 8: Dimensions */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📐 Section 8: Dimensions (if Bulky/ODC)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Length</label>
                <input type="number" name="length" value={formData.length} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Width</label>
                <input type="number" name="width" value={formData.width} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Height</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">No of Pkgs (dimension)</label>
                <input type="number" name="no_of_pkgs_dimension" value={formData.no_of_pkgs_dimension} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Total CFT/CMT (Auto)</label>
                <input type="number" value={formData.total_cft_cmt} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold" />
              </div>
            </div>
          </div>

          {/* Section 9: Private Marks/MR */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🏷️ Section 9: Private Marks / MR</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-1">Private Marks</label>
                <textarea name="private_marks" value={formData.private_marks} onChange={handleChange} rows="2" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">M.R. No</label>
                <input type="text" name="mr_no" value={formData.mr_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">M.R. Date</label>
                <input type="date" name="mr_date" value={formData.mr_date} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">M.R. Amount</label>
                <input type="number" name="mr_amount" value={formData.mr_amount} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <CustomSelect label="Load Type" name="load_type" value={formData.load_type} onChange={handleChange} options={loadTypeOptions} />
              </div>
            </div>
          </div>

          {/* Section 10: Charges */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">💰 Section 10: Charges (Auto + Manual)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">FREIGHT (Auto: Wt × Rate)</label>
                <input type="number" name="freight" value={formData.freight} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">A.O.C. %</label>
                <input type="number" name="aoc_percent" value={formData.aoc_percent} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">A.O.C. Amount (Auto)</label>
                <input type="number" value={formData.aoc_amount} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">EOV Charges</label>
                <input type="number" name="eov_charges" value={formData.eov_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Cover Charges</label>
                <input type="number" name="cover_charges" value={formData.cover_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Material Mgmt Ch</label>
                <input type="number" name="material_mgmt_ch" value={formData.material_mgmt_ch} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Collection Charges</label>
                <input type="number" name="collection_charges" value={formData.collection_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Door Dly Charges</label>
                <input type="number" name="door_dly_charges" value={formData.door_dly_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Pass/CC Attach Ch</label>
                <input type="number" name="pass_cc_charges" value={formData.pass_cc_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Enroute Charges</label>
                <input type="number" name="enroute_charges" value={formData.enroute_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Statistical Charges</label>
                <input type="number" name="statistical_charges" value={formData.statistical_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Misc. Charges</label>
                <input type="number" name="misc_charges" value={formData.misc_charges} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
            <div className="mt-4 text-right">
              <span className="text-gray-300 text-lg">Grand Total: </span>
              <span className="text-3xl font-bold text-green-400">₹{formData.grand_total}</span>
            </div>
          </div>

          {/* Section 11: E-Way Bill */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📋 Section 11: E-Way Bill</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">E-Way Bill No</label>
                <input type="text" name="eway_bill_no" value={formData.eway_bill_no} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Valid Upto</label>
                <input type="date" name="eway_valid_upto" value={formData.eway_valid_upto} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Section 12: Payment */}
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold text-white mb-4"> Section 12: Payment / Booking</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <CustomSelect label="Payment Type" name="payment_type" value={formData.payment_type} onChange={handleChange} options={paymentOptions} />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">To Pay/Paid/TBB Amount</label>
                <input type="number" name="payment_amount" value={formData.payment_amount} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Declared Value of Goods</label>
                <input type="number" name="declared_value" value={formData.declared_value} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Basis of Booking</label>
                <input type="text" name="basis_of_booking" value={formData.basis_of_booking} onChange={handleChange} placeholder="(1) To Pay (2) To Be (3) Paid" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Billed at with M/s</label>
                <input type="text" name="billed_at" value={formData.billed_at} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <CustomSelect label="GST Through" name="gst_through" value={formData.gst_through} onChange={handleChange} options={gstOptions} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-gray-300 text-sm font-medium mb-1">Amount in Words (Auto)</label>
                <input type="text" value={formData.amount_in_words} readOnly className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold italic" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Bilty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
