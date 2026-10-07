import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Consignments({ isNew }) {
  const navigate = useNavigate()
  const [bilties, setBilties] = useState([])
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(isNew || false)
  const [formData, setFormData] = useState({
    lr_no: '', lr_date: new Date().toISOString().split('T')[0], from_name: '', to_name: '',
    consignor_code: '', consignor_name: '', consignor_address: '', consignor_gst: '', consignor_email: '',
    consignee_code: '', consignee_name: '', consignee_address: '', consignee_gst: '', consignee_email: '',
    material_desc: '', weight: '', packages: '', grand_total: '', status: 'Booked',
    driver_name: '', driver_mobile: '', lorry_no: '', eway_bill_no: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!showForm) {
      fetchBilties()
      fetchParties()
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchParties = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/parties`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setParties(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handlePartyCodeChange = (type, code) => {
    const party = parties.find(p => p.party_code === code)
    if (party) {
      if (type === 'consignor') {
        setFormData(prev => ({
          ...prev,
          consignor_code: code,
          consignor_name: party.party_name,
          consignor_address: party.address,
          consignor_gst: party.gst_no,
          consignor_email: party.email
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          consignee_code: code,
          consignee_name: party.party_name,
          consignee_address: party.address,
          consignee_gst: party.gst_no,
          consignee_email: party.email
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      // Save bilty
      const res = await fetch(`${apiUrl}/api/consignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        const biltyData = await res.json()
        
        // Save/Create Consignor party if code exists
        if (formData.consignor_code) {
          await fetch(`${apiUrl}/api/parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              party_code: formData.consignor_code,
              party_name: formData.consignor_name,
              address: formData.consignor_address,
              gst_no: formData.consignor_gst,
              email: formData.consignor_email,
              phone: ''
            })
          })
        }
        
        // Save/Create Consignee party if code exists
        if (formData.consignee_code) {
          await fetch(`${apiUrl}/api/parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              party_code: formData.consignee_code,
              party_name: formData.consignee_name,
              address: formData.consignee_address,
              gst_no: formData.consignee_gst,
              email: formData.consignee_email,
              phone: ''
            })
          })
        }
        
        alert('✅ Bilty created successfully!')
        setShowForm(false)
        navigate('/consignments')
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-red-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="font-bold text-lg">📝 Create New Bilty</h1>
            <button onClick={() => navigate('/')} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm">← Back</button>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
            
            {/* LR Details */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">LR Number</label>
                <input name="lr_no" value={formData.lr_no} onChange={handleChange} placeholder="Auto-generated" className="w-full border p-2 rounded mt-1 bg-gray-50" />
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

            {/* Consignor Section with Party Code */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold text-blue-900 mb-3">📦 CONSIGNOR (Sender)</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Party Code</label>
                  <select 
                    value={formData.consignor_code} 
                    onChange={(e) => handlePartyCodeChange('consignor', e.target.value)}
                    className="w-full border p-2 rounded mt-1"
                  >
                    <option value="">-- Select Party Code --</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.party_code}>{p.party_code} - {p.party_name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Or enter new code below</p>
                  <input 
                    name="consignor_code" 
                    value={formData.consignor_code} 
                    onChange={handleChange} 
                    placeholder="New Party Code (e.g., P001)" 
                    className="w-full border p-2 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Party Name *</label>
                  <input name="consignor_name" value={formData.consignor_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">GST Number</label>
                  <input name="consignor_gst" value={formData.consignor_gst} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-sm font-bold text-gray-700">Full Address</label>
                  <textarea name="consignor_address" value={formData.consignor_address} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1"></textarea>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <input name="consignor_email" type="email" value={formData.consignor_email} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
            </div>

            {/* Consignee Section with Party Code */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-bold text-red-900 mb-3"> CONSIGNEE (Receiver)</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Party Code</label>
                  <select 
                    value={formData.consignee_code} 
                    onChange={(e) => handlePartyCodeChange('consignee', e.target.value)}
                    className="w-full border p-2 rounded mt-1"
                  >
                    <option value="">-- Select Party Code --</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.party_code}>{p.party_code} - {p.party_name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Or enter new code below</p>
                  <input 
                    name="consignee_code" 
                    value={formData.consignee_code} 
                    onChange={handleChange} 
                    placeholder="New Party Code (e.g., P002)" 
                    className="w-full border p-2 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Party Name *</label>
                  <input name="consignee_name" value={formData.consignee_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">GST Number</label>
                  <input name="consignee_gst" value={formData.consignee_gst} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-sm font-bold text-gray-700">Full Address</label>
                  <textarea name="consignee_address" value={formData.consignee_address} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1"></textarea>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <input name="consignee_email" type="email" value={formData.consignee_email} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>
            </div>

            {/* Material & Amount */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Material Description</label>
                <input name="material_desc" value={formData.material_desc} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Weight (kg)</label>
                <input name="weight" value={formData.weight} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Packages</label>
                <input name="packages" value={formData.packages} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Grand Total (₹) *</label>
                <input name="grand_total" type="number" value={formData.grand_total} onChange={handleChange} className="w-full border p-2 rounded mt-1" required />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Driver Name</label>
                <input name="driver_name" value={formData.driver_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Driver Mobile</label>
                <input name="driver_mobile" value={formData.driver_mobile} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Vehicle No</label>
                <input name="lorry_no" value={formData.lorry_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">E-Way Bill No</label>
                <input name="eway_bill_no" value={formData.eway_bill_no} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-red-700 text-white py-3 rounded-lg font-bold hover:bg-red-800 disabled:bg-gray-400">
              {submitting ? 'Creating...' : '✅ Create Bilty (Party will be auto-saved)'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-lg">📋 Bilty List ({bilties.length})</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="bg-white text-red-700 px-4 py-1 rounded font-bold text-sm">+ New Bilty</button>
            <button onClick={() => navigate('/mr')} className="bg-yellow-500 text-white px-4 py-1 rounded font-bold text-sm">💰 Money Receipts</button>
            <button onClick={() => navigate('/')} className="bg-red-800 text-white px-4 py-1 rounded font-bold text-sm">← Dashboard</button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
        {loading ? <div className="text-center py-20">Loading...</div> : (
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
                    <td className="p-3 font-bold">{parseFloat(b.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'Delivered' ? 'bg-green-100 text-green-700' : b.status === 'In-Transit' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{b.status}</span>
                    </td>
                    <td className="p-3">
                      {b.mr_no ? (
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold mb-1">✅ Paid: {b.mr_no}</div>
                      ) : (
                        <button onClick={() => navigate(`/mr/create?biltyId=${b.id}`)} className="bg-green-600 text-white px-2 py-1 rounded text-xs mb-1 hover:bg-green-700 w-full">💰 Create MR</button>
                      )}
                      <div className="flex gap-1">
                        <button onClick={() => navigate('/bilty-print', { state: { bilty: b } })} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">🖨️ Print</button>
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
