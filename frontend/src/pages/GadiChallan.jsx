import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GadiChallan() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    lr_no: '', vehicle_no: '', driver_name: '', driver_mobile: '', driver_license: '',
    owner_name: '', owner_mobile: '', broker_name: '', broker_mobile: '', broker_commission: '',
    from_place: '', to_place: '', material_desc: '', weight: '', packages: '',
    bilty_date: '', consignor_name: '', consignee_name: '',
    freight_amount: '', advance_paid: '', toll_expense: '', diesel_expense: '',
    other_expense: '', tds_deduction: '', issue_date: new Date().toISOString().split('T')[0]
  })
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingLR, setFetchingLR] = useState(false)

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value})
  }

  // ✅ FIXED: Robust Auto-fetch that handles missing columns gracefully
  const handleLRChange = async (e) => {
    const lr_no = e.target.value
    setFormData(prev => ({ ...prev, lr_no }))
    
    if (lr_no.trim().length > 5) {
      setFetchingLR(true)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
        const response = await fetch(`${apiUrl}/api/consignments/track?lr_no=${encodeURIComponent(lr_no.trim())}`)
        const data = await response.json()
        
        if (response.ok && data.lr_no) {
          setFormData(prev => ({
            ...prev,
            lr_no: data.lr_no,
            bilty_date: data.lr_date || '',
            from_place: data.from_name || data.from_place || '',
            to_place: data.to_name || data.to_place || '',
            consignor_name: data.consignor_name || '',
            consignee_name: data.consignee_name || '',
            // Try multiple possible column names for weight/packages/material
            material_desc: data.material_desc || data.goods || data.commodity || '',
            weight: data.weight || data.gross_weight || data.total_weight || data.actual_weight || '',
            packages: data.packages || data.no_of_packages || data.pkgs || '',
            vehicle_no: data.lorry_no || data.vehicle_no || prev.vehicle_no
          }))
        }
      } catch (err) {
        console.error('LR fetch error:', err)
      } finally {
        setFetchingLR(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const response = await fetch(`${apiUrl}/api/gadi-challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (response.ok) {
        setChallan(data)
      } else {
        alert('Error: ' + (data.error || 'Failed to create challan'))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const freight = parseFloat(formData.freight_amount || 0)
  const advance = parseFloat(formData.advance_paid || 0)
  const tds = parseFloat(formData.tds_deduction || 0)
  const balance = freight - advance
  const netPayable = freight - advance - tds

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-700 text-white p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">BHARAT TRANSPORT COMPANY</h1>
          <button onClick={() => navigate('/')} className="bg-white text-red-700 px-4 py-2 rounded font-bold">← Back to Home</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {!challan ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-red-700">🚛 Gadi Challan (Vehicle Freight Receipt)</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-2 border-red-200 bg-red-50 p-4 rounded">
                <h3 className="font-bold text-gray-700 mb-2"> Bilty/LR Details (Auto-Fill)</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="relative">
                    <input name="lr_no" placeholder="Enter LR Number (e.g., BTC/26/0001)" value={formData.lr_no} onChange={handleLRChange} className="border p-2 rounded w-full" required />
                    {fetchingLR && <span className="absolute right-2 top-2 text-blue-600 text-sm">Fetching...</span>}
                  </div>
                  <input name="bilty_date" placeholder="Bilty Date" value={formData.bilty_date} onChange={handleChange} className="border p-2 rounded bg-gray-100" readOnly />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input name="consignor_name" placeholder="Consignor (Sender)" value={formData.consignor_name} onChange={handleChange} className="border p-2 rounded bg-gray-100" readOnly />
                  <input name="consignee_name" placeholder="Consignee (Receiver)" value={formData.consignee_name} onChange={handleChange} className="border p-2 rounded bg-gray-100" readOnly />
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-bold text-gray-700 mb-2">🛣️ Route & Material</h3>
                <div className="grid md:grid-cols-4 gap-3">
                  <input name="from_place" placeholder="From" value={formData.from_place} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="to_place" placeholder="To" value={formData.to_place} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="material_desc" placeholder="Material" value={formData.material_desc} onChange={handleChange} className="border p-2 rounded" />
                  <input name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} className="border p-2 rounded" />
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-bold text-gray-700 mb-2">🚗 Vehicle Details</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <input name="vehicle_no" placeholder="Vehicle Number" value={formData.vehicle_no} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="issue_date" type="date" value={formData.issue_date} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="packages" placeholder="No. of Packages" value={formData.packages} onChange={handleChange} className="border p-2 rounded" />
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-bold text-gray-700 mb-2">👤 Driver Details</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <input name="driver_name" placeholder="Driver Name" value={formData.driver_name} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="driver_mobile" placeholder="Driver Mobile" value={formData.driver_mobile} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="driver_license" placeholder="License Number" value={formData.driver_license} onChange={handleChange} className="border p-2 rounded" />
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-bold text-gray-700 mb-2">🚗 Vehicle Owner Details</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <input name="owner_name" placeholder="Owner Name" value={formData.owner_name} onChange={handleChange} className="border p-2 rounded" />
                  <input name="owner_mobile" placeholder="Owner Mobile" value={formData.owner_mobile} onChange={handleChange} className="border p-2 rounded" />
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-bold text-gray-700 mb-2">🤝 Broker Details</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <input name="broker_name" placeholder="Broker Name" value={formData.broker_name} onChange={handleChange} className="border p-2 rounded" />
                  <input name="broker_mobile" placeholder="Broker Mobile" value={formData.broker_mobile} onChange={handleChange} className="border p-2 rounded" />
                  <input name="broker_commission" type="number" placeholder="Commission ()" value={formData.broker_commission} onChange={handleChange} className="border p-2 rounded" />
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-bold text-gray-700 mb-2">💰 Payment Details</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <input name="freight_amount" type="number" placeholder="Freight Amount (₹)" value={formData.freight_amount} onChange={handleChange} className="border p-2 rounded" required />
                  <input name="advance_paid" type="number" placeholder="Advance Paid (₹)" value={formData.advance_paid} onChange={handleChange} className="border p-2 rounded" />
                  <input name="tds_deduction" type="number" placeholder="TDS (₹)" value={formData.tds_deduction} onChange={handleChange} className="border p-2 rounded" />
                </div>
                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <input name="toll_expense" type="number" placeholder="Toll (₹)" value={formData.toll_expense} onChange={handleChange} className="border p-2 rounded" />
                  <input name="diesel_expense" type="number" placeholder="Diesel (₹)" value={formData.diesel_expense} onChange={handleChange} className="border p-2 rounded" />
                  <input name="other_expense" type="number" placeholder="Other Expense (₹)" value={formData.other_expense} onChange={handleChange} className="border p-2 rounded" />
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-4">
                <h3 className="font-bold text-gray-700 mb-2">📊 Auto-Calculated Summary</h3>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><strong>Freight:</strong> ₹{freight.toFixed(2)}</div>
                  <div><strong>Advance Paid:</strong> ₹{advance.toFixed(2)}</div>
                  <div><strong>Balance Due:</strong> ₹{balance.toFixed(2)}</div>
                  <div><strong>TDS:</strong> ₹{tds.toFixed(2)}</div>
                  <div className="md:col-span-2"><strong className="text-red-700 text-lg">Net Payable to Driver:</strong> <span className="text-red-700 text-lg font-bold">₹{netPayable.toFixed(2)}</span></div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="bg-red-700 text-white px-6 py-3 rounded font-bold hover:bg-red-800 disabled:bg-gray-400 w-full">
                {loading ? 'Generating...' : '🚛 Generate Gadi Challan'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none">
            <div className="border-2 border-gray-800 p-6 rounded">
              <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
                <h2 className="text-2xl font-bold text-red-700">BHARAT TRANSPORT COMPANY</h2>
                <p className="text-gray-600 font-bold">GADI CHALLAN / VEHICLE FREIGHT RECEIPT</p>
                <p className="text-sm">Challan No: <span className="font-bold text-red-700">{challan.challan_no}</span> | Date: {new Date(challan.issue_date).toLocaleDateString('en-IN')}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="border p-3 rounded bg-blue-50">
                  <h4 className="font-bold bg-blue-100 p-1 mb-2">📋 Bilty Details</h4>
                  <p><strong>LR No:</strong> {challan.lr_no}</p>
                  <p><strong>Bilty Date:</strong> {challan.bilty_date ? new Date(challan.bilty_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                  <p><strong>Consignor:</strong> {challan.consignor_name || 'N/A'}</p>
                  <p><strong>Consignee:</strong> {challan.consignee_name || 'N/A'}</p>
                </div>
                <div className="border p-3 rounded">
                  <h4 className="font-bold bg-gray-100 p-1 mb-2">🚗 Vehicle & Driver</h4>
                  <p><strong>Vehicle No:</strong> {challan.vehicle_no}</p>
                  <p><strong>Driver:</strong> {challan.driver_name}</p>
                  <p><strong>Mobile:</strong> {challan.driver_mobile}</p>
                  <p><strong>License:</strong> {challan.driver_license || 'N/A'}</p>
                  {challan.owner_name && <p><strong>Owner:</strong> {challan.owner_name} ({challan.owner_mobile})</p>}
                </div>
                <div className="border p-3 rounded">
                  <h4 className="font-bold bg-gray-100 p-1 mb-2">🛣️ Route & Material</h4>
                  <p><strong>From:</strong> {challan.from_place} → <strong>To:</strong> {challan.to_place}</p>
                  <p><strong>Material:</strong> {challan.material_desc}</p>
                  <p><strong>Weight:</strong> {challan.weight} kg</p>
                  <p><strong>Packages:</strong> {challan.packages || 'N/A'}</p>
                </div>
                <div className="border p-3 rounded">
                  <h4 className="font-bold bg-gray-100 p-1 mb-2">🤝 Broker</h4>
                  <p><strong>Name:</strong> {challan.broker_name || 'N/A'}</p>
                  <p><strong>Mobile:</strong> {challan.broker_mobile || 'N/A'}</p>
                  <p><strong>Commission:</strong> ₹{parseFloat(challan.broker_commission || 0).toFixed(2)}</p>
                </div>
                <div className="border p-3 rounded bg-yellow-50 md:col-span-2">
                  <h4 className="font-bold bg-yellow-200 p-1 mb-2">💰 Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><strong>Freight:</strong> ₹{parseFloat(challan.freight_amount || 0).toFixed(2)}</p>
                    <p><strong>Advance:</strong> ₹{parseFloat(challan.advance_paid || 0).toFixed(2)}</p>
                    <p><strong>TDS:</strong> ₹{parseFloat(challan.tds_deduction || 0).toFixed(2)}</p>
                    <p><strong>Toll:</strong> ₹{parseFloat(challan.toll_expense || 0).toFixed(2)}</p>
                    <p><strong>Diesel:</strong> ₹{parseFloat(challan.diesel_expense || 0).toFixed(2)}</p>
                    <p><strong>Other:</strong> ₹{parseFloat(challan.other_expense || 0).toFixed(2)}</p>
                    <p className="col-span-2 font-bold text-red-700 text-lg"><strong>Net Payable:</strong> ₹{parseFloat(challan.net_payable || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between text-sm border-t-2 pt-3">
                <div>
                  <p><strong>Issued By:</strong> Admin</p>
                  <p className="text-xs text-gray-500">{new Date(challan.created_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Driver Signature</p>
                  <div className="border-b border-gray-400 w-40 mt-8"></div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="bg-blue-700 text-white px-4 py-2 rounded font-bold hover:bg-blue-800">🖨️ Print Challan</button>
              <button onClick={() => setChallan(null)} className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800">New Challan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
