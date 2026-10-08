import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Branches() {
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [branchStats, setBranchStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gst_no: '',
    pan_no: '',
    manager_name: '',
    manager_phone: '',
    is_active: true
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchBranches()
    fetchBranchStats()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/branches`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setBranches(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBranchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/dashboard/branch-stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setBranchStats(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const getBranchStats = (branchId) => {
    return branchStats.find(s => {
      // Match by checking if any stat row corresponds to this branch
      return false
    }) || { total_lr: 0, revenue: 0, pending: 0 }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.branch_code || !formData.branch_name) {
      alert('Branch Code और Branch Name जरूरी है!')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      let res
      if (editingBranch) {
        res = await fetch(`${apiUrl}/api/branches/${editingBranch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch(`${apiUrl}/api/branches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        })
      }

      if (res.ok) {
        alert(editingBranch ? '✅ Branch updated successfully!' : '✅ New branch added successfully!')
        setShowForm(false)
        setEditingBranch(null)
        resetForm()
        fetchBranches()
        fetchBranchStats()
      } else {
        const err = await res.json()
        alert('Error: ' + (err.error || err.message))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setFormData({
      branch_code: branch.branch_code || '',
      branch_name: branch.branch_name || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      phone: branch.phone || '',
      email: branch.email || '',
      gst_no: branch.gst_no || '',
      pan_no: branch.pan_no || '',
      manager_name: branch.manager_name || '',
      manager_phone: branch.manager_phone || '',
      is_active: branch.is_active !== false
    })
    setShowForm(true)
  }

  const handleDelete = async (branch) => {
    if (!confirm(`क्या आप "${branch.branch_name}" branch को deactivate करना चाहते हैं?`)) return
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      await fetch(`${apiUrl}/api/branches/${branch.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      alert('Branch deactivated successfully')
      fetchBranches()
      fetchBranchStats()
    } catch (err) {
      alert('Error deleting branch')
    }
  }

  const resetForm = () => {
    setFormData({
      branch_code: '',
      branch_name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      gst_no: '',
      pan_no: '',
      manager_name: '',
      manager_phone: '',
      is_active: true
    })
  }

  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount || 0).toLocaleString('en-IN')
  }

  const filteredBranches = branches.filter(b => {
    if (!search) return true
    const s = search.toLowerCase()
    return (b.branch_code || '').toLowerCase().includes(s) ||
           (b.branch_name || '').toLowerCase().includes(s) ||
           (b.city || '').toLowerCase().includes(s)
  })

  const totalRevenue = branchStats.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0)
  const totalPending = branchStats.reduce((sum, s) => sum + parseFloat(s.pending || 0), 0)
  const totalLR = branchStats.reduce((sum, s) => sum + parseInt(s.total_lr || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl">🏢 Branch Master</h1>
            <p className="text-xs text-indigo-200">Total Branches: {branches.length} | Revenue: {formatCurrency(totalRevenue)} | Pending: {formatCurrency(totalPending)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setEditingBranch(null); setShowForm(true) }} className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50">+ Add Branch</button>
            <button onClick={() => navigate('/')} className="bg-indigo-800 text-white px-4 py-2 rounded-lg font-bold text-sm">← Dashboard</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {showForm ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">
                {editingBranch ? '✏️ Edit Branch' : ' Add New Branch'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingBranch(null); resetForm() }} className="text-gray-500 hover:text-gray-700 text-xl font-bold"></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Branch Code *</label>
                  <input name="branch_code" value={formData.branch_code} onChange={handleChange} placeholder="e.g., RJH, DEL, MUM" className="w-full border-2 border-indigo-300 p-2 rounded mt-1 font-bold uppercase" required />
                  <p className="text-xs text-gray-500 mt-1">LR numbers इसी code से बनेंगे (e.g., RJH/26/0001)</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Branch Name *</label>
                  <input name="branch_name" value={formData.branch_name} onChange={handleChange} placeholder="e.g., Rajgarh Head Office" className="w-full border p-2 rounded mt-1" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">Full Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full border p-2 rounded mt-1" placeholder="Complete address..."></textarea>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">State</label>
                  <input name="state" value={formData.state} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Pincode</label>
                  <input name="pincode" value={formData.pincode} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">GST Number</label>
                  <input name="gst_no" value={formData.gst_no} onChange={handleChange} className="w-full border p-2 rounded mt-1 uppercase" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">PAN Number</label>
                  <input name="pan_no" value={formData.pan_no} onChange={handleChange} className="w-full border p-2 rounded mt-1 uppercase" />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-bold text-gray-800 mb-3">👤 Branch Manager Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Manager Name</label>
                    <input name="manager_name" value={formData.manager_name} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Manager Phone</label>
                    <input name="manager_phone" value={formData.manager_phone} onChange={handleChange} className="w-full border p-2 rounded mt-1" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-800">
                  {editingBranch ? '💾 Update Branch' : '✅ Add Branch'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingBranch(null); resetForm() }} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <input
                type="text"
                placeholder="🔍 Search branches by code, name, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            {loading ? (
              <div className="text-center py-20 text-xl">Loading branches...</div>
            ) : filteredBranches.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <div className="text-6xl mb-4">🏢</div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">No Branches Yet</h2>
                <p className="text-gray-500 mb-4">अपनी पहली branch add करें</p>
                <button onClick={() => setShowForm(true)} className="bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold">+ Add First Branch</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBranches.map(branch => {
                  const stats = branchStats.find(s => s.branch_code === branch.branch_code) || { total_lr: 0, revenue: 0, pending: 0 }
                  return (
                    <div key={branch.id} className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${branch.is_active !== false ? 'border-indigo-600' : 'border-gray-400 opacity-70'}`}>
                      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-indigo-200 font-bold">BRANCH CODE</div>
                            <div className="text-2xl font-black">{branch.branch_code}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${branch.is_active !== false ? 'bg-green-500' : 'bg-gray-500'}`}>
                            {branch.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{branch.branch_name}</h3>
                        {branch.city && <p className="text-sm text-gray-600 mb-2">📍 {branch.city}{branch.state ? `, ${branch.state}` : ''}</p>}
                        {branch.phone && <p className="text-xs text-gray-500">📞 {branch.phone}</p>}
                        {branch.manager_name && <p className="text-xs text-gray-500">👤 Manager: {branch.manager_name}</p>}
                        
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Total LR</div>
                            <div className="font-bold text-indigo-700">{stats.total_lr || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Revenue</div>
                            <div className="font-bold text-green-700 text-xs">{formatCurrency(stats.revenue)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Pending</div>
                            <div className="font-bold text-orange-700 text-xs">{formatCurrency(stats.pending)}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleEdit(branch)} className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold hover:bg-blue-700">✏️ Edit</button>
                          <button onClick={() => handleDelete(branch)} className="flex-1 bg-red-600 text-white py-2 rounded text-xs font-bold hover:bg-red-700">🗑️ Deactivate</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
