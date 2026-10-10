import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function Branches() {
  const navigate = useNavigate()
  
  // 🔒 ADMIN ONLY CHECK
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [newCredentials, setNewCredentials] = useState({ 
    url: '', 
    username: '', 
    password: '', 
    name: '' 
  })
  
  const [formData, setFormData] = useState({
    name: '', city: '', state: '', address: '', phone: '', email: '', 
    incharge_name: '', incharge_username: '', incharge_password: '', branch_url_slug: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const savedBranches = JSON.parse(localStorage.getItem('btc_branches') || '[]')
      if (savedBranches.length > 0) {
        setBranches(savedBranches)
      } else {
        const sampleData = [
          { 
            id: 1, 
            name: 'Mumbai', 
            city: 'Mumbai', 
            state: 'Maharashtra', 
            incharge_name: 'Rajesh Kumar', 
            incharge_username: 'incharge_mumbai', 
            incharge_password: 'mumbai123',
            phone: '9876543210', 
            email: 'mumbai@btc.com', 
            status: 'Active', 
            branch_url_slug: 'mumbai' 
          },
          { 
            id: 2, 
            name: 'Ahmedabad', 
            city: 'Ahmedabad', 
            state: 'Gujarat', 
            incharge_name: 'amit verma', 
            incharge_username: 'amit', 
            incharge_password: 'amit123',
            phone: '6375717265', 
            email: 'ahmedabad@btc.com', 
            status: 'Active', 
            branch_url_slug: 'ahmedabad' 
          }
        ]
        setBranches(sampleData)
        localStorage.setItem('btc_branches', JSON.stringify(sampleData))
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    if (!editingBranch) {
      setFormData({
        ...formData,
        name: name,
        branch_url_slug: slug,
        incharge_username: slug ? `incharge_${slug}` : '',
        incharge_password: generateSecurePassword()
      })
    } else {
      setFormData({ ...formData, name: name })
    }
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name || '', 
      city: branch.city || '', 
      state: branch.state || '', 
      address: branch.address || '',
      phone: branch.phone || '', 
      email: branch.email || '', 
      incharge_name: branch.incharge_name || '',
      incharge_username: branch.incharge_username || '', 
      incharge_password: branch.incharge_password || generateSecurePassword(),
      branch_url_slug: branch.branch_url_slug || '', 
      status: branch.status || 'Active'
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.city || !formData.incharge_name) {
      alert('Branch Name, City, and Incharge Name are required!')
      return
    }

    try {
      // Generate the branch login URL
      const baseUrl = window.location.origin
      const loginUrl = `${baseUrl}/#/branch-login/${formData.branch_url_slug}`

      if (editingBranch) {
        // UPDATE EXISTING BRANCH
        const updatedBranches = branches.map(b => {
          if (b.id === editingBranch.id) {
            return { ...b, ...formData }
          }
          return b
        })
        setBranches(updatedBranches)
        localStorage.setItem('btc_branches', JSON.stringify(updatedBranches))
        alert('✅ Branch updated successfully!')
      } else {
        // CREATE NEW BRANCH
        const newBranch = { 
          id: Date.now(), 
          ...formData, 
          status: 'Active' 
        }
        const updatedBranches = [newBranch, ...branches]
        setBranches(updatedBranches)
        localStorage.setItem('btc_branches', JSON.stringify(updatedBranches))
        
        // Show credentials modal with URL
        setNewCredentials({
          url: loginUrl,
          username: formData.incharge_username,
          password: formData.incharge_password,
          name: formData.name
        })
        setShowCredentials(true)
      }

      // Reset form
      setFormData({ 
        name: '', 
        city: '', 
        state: '', 
        address: '', 
        phone: '', 
        email: '', 
        incharge_name: '', 
        incharge_username: '', 
        incharge_password: '', 
        branch_url_slug: '', 
        status: 'Active' 
      })
      setEditingBranch(null)
      setShowForm(false)
    } catch (err) {
      alert('Failed to save branch: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to DELETE "${name}" branch? This action CANNOT be undone!`)) return
    try {
      const updatedBranches = branches.filter(b => b.id !== id)
      setBranches(updatedBranches)
      localStorage.setItem('btc_branches', JSON.stringify(updatedBranches))
      alert('️ Branch deleted successfully.')
    } catch (err) {
      alert('Failed to delete branch.')
    }
  }

  const toggleBranchStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    const updatedBranches = branches.map(b => b.id === id ? { ...b, status: newStatus } : b)
    setBranches(updatedBranches)
    localStorage.setItem('btc_branches', JSON.stringify(updatedBranches))
    alert(`Branch ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`)
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ ${label} copied to clipboard! Ab aap ise WhatsApp/Email par paste kar sakte hain.`)
    }).catch(() => {
      alert(`❌ Failed to copy ${label}`)
    })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-600 font-medium">Loading branches...</div></div>
  }

  const activeBranches = branches.filter(b => b.status === 'Active').length
  const inactiveBranches = branches.filter(b => b.status === 'Inactive').length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🏢 Branch Management</h1>
            <p className="text-gray-500 mt-1">
              Total: <span className="font-bold text-blue-600">{branches.length}</span> | 
              Active: <span className="font-bold text-green-600">{activeBranches}</span> | 
              Inactive: <span className="font-bold text-red-600">{inactiveBranches}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2">← Dashboard</button>
            <button onClick={() => { setEditingBranch(null); setFormData({ name: '', city: '', state: '', address: '', phone: '', email: '', incharge_name: '', incharge_username: '', incharge_password: '', branch_url_slug: '', status: 'Active' }); setShowForm(!showForm) }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 shadow-lg">
              {showForm ? '✕ Close Form' : '➕ Add New Branch'}
            </button>
          </div>
        </div>

        {/* ✅ CREDENTIALS MODAL - Yeh tab dikhega jab naya branch banega */}
        {showCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-2 border-blue-500 overflow-hidden">
              <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"> Branch Credentials Generated!</h3>
                <button onClick={() => setShowCredentials(false)} className="text-white hover:text-blue-200 text-2xl">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-xs font-bold text-blue-800 uppercase mb-1 block">Branch Login URL</label>
                  <div className="flex gap-2">
                    <input readOnly value={newCredentials.url} className="flex-1 p-2 bg-white rounded border border-blue-300 text-sm font-mono text-gray-700" />
                    <button onClick={() => copyToClipboard(newCredentials.url, 'URL')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium whitespace-nowrap"> Copy</button>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">Yeh URL branch incharge ko bhejein</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Username (ID)</label>
                    <div className="flex gap-2">
                      <input readOnly value={newCredentials.username} className="flex-1 p-2 bg-white rounded border border-gray-300 text-sm font-mono font-bold text-gray-800" />
                      <button onClick={() => copyToClipboard(newCredentials.username, 'Username')} className="px-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"></button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Password</label>
                    <div className="flex gap-2">
                      <input readOnly value={newCredentials.password} className="flex-1 p-2 bg-white rounded border border-gray-300 text-sm font-mono font-bold text-red-600" />
                      <button onClick={() => copyToClipboard(newCredentials.password, 'Password')} className="px-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs">📋</button>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm text-green-800 font-bold mb-1">✅ Branch "{newCredentials.name}" successfully created!</p>
                  <p className="text-xs text-green-700">Upar diye gaye credentials ko copy karke branch incharge ko WhatsApp/Email par bhejein.</p>
                </div>

                <button 
                  onClick={() => setShowCredentials(false)}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg"
                >
                  ✅ Done, Close this Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">{editingBranch ? '✏️ Edit Branch Details' : ' Add New Branch'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label><input type="text" required value={formData.name} onChange={handleNameChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Mumbai" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">State *</label><input type="text" required value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Branch Incharge Name *</label><input type="text" required value={formData.incharge_name} onChange={(e) => setFormData({...formData, incharge_name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Full Name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Auto-Generated URL Slug</label><input type="text" value={formData.branch_url_slug} onChange={(e) => setFormData({...formData, branch_url_slug: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Auto-Generated Username (ID)</label><input type="text" value={formData.incharge_username} onChange={(e) => setFormData({...formData, incharge_username: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm font-bold text-blue-700" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Generated Password</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.incharge_password} onChange={(e) => setFormData({...formData, incharge_password: e.target.value})} className="flex-1 p-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm font-bold text-red-600" />
                  <button type="button" onClick={() => setFormData({...formData, incharge_password: generateSecurePassword()})} className="px-3 py-2 bg-gray-200 rounded-lg border hover:bg-gray-300 text-sm" title="Regenerate Password">🔄</button>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="2" /></div>
              <div className="md:col-span-2 flex gap-3 mt-2">
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-md">{editingBranch ? ' Update Branch' : '💾 Save & Generate Credentials'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingBranch(null); }} className="px-8 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Branches List Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">📋 All Branches List</h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{branches.length} Total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Branch Details</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Incharge</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No branches found. Click "Add New Branch" to start.</td></tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-blue-50 transition">
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900 text-lg">{branch.name}</div>
                        <div className="text-sm text-gray-500">{branch.city}, {branch.state}</div>
                        {branch.branch_url_slug && <div className="text-xs text-blue-600 font-mono mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">/{branch.branch_url_slug}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{branch.incharge_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono">{branch.incharge_username || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {branch.phone && <div className="flex items-center gap-1">📞 {branch.phone}</div>}
                        {branch.email && <div className="flex items-center gap-1">✉️ {branch.email}</div>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleBranchStatus(branch.id, branch.status)} className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition ${branch.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'}`} title="Click to toggle status">
                          {branch.status === 'Active' ? '✅ Active' : '❌ Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(branch)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition flex items-center gap-1" title="Edit Branch">✏️ Edit</button>
                          <button onClick={() => handleDelete(branch.id, branch.name)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition flex items-center gap-1" title="Delete Branch">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
