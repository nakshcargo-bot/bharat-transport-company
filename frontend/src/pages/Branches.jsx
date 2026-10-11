import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Branches() {
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '', phone: '', email: '',
    incharge_name: '', incharge_username: '', incharge_password: '', branch_url_slug: '', status: 'Active'
  })

  useEffect(() => {
    const saved = localStorage.getItem('btc_branches')
    if (saved) {
      setBranches(JSON.parse(saved))
    } else {
      const defaults = [
        { id: 1, name: 'Mumbai', city: 'Mumbai', state: 'Maharashtra', incharge_name: 'Rajesh Kumar', incharge_username: 'incharge_mumbai', incharge_password: 'mumbai@123', phone: '9876543210', email: 'mumbai@btc.com', status: 'Active', branch_url_slug: 'mumbai' },
        { id: 2, name: 'Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', incharge_name: 'amit verma', incharge_username: 'amit', incharge_password: 'amit@123', phone: '6375717265', email: 'ahmedabad@btc.com', status: 'Active', branch_url_slug: 'ahmedabad' }
      ]
      setBranches(defaults)
      localStorage.setItem('btc_branches', JSON.stringify(defaults))
    }
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
    let p = ''
    for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length))
    return p
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm({
      ...form,
      name,
      branch_url_slug: slug,
      incharge_username: slug ? `incharge_${slug}` : '',
      incharge_password: generatePassword()
    })
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setForm({
      name: branch.name || '', city: branch.city || '', state: branch.state || '', address: branch.address || '',
      phone: branch.phone || '', email: branch.email || '', incharge_name: branch.incharge_name || '',
      incharge_username: branch.incharge_username || '', incharge_password: branch.incharge_password || generatePassword(),
      branch_url_slug: branch.branch_url_slug || '', status: branch.status || 'Active'
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Debug log
    console.log('Form submitted:', form)
    
    if (!form.name || !form.city || !form.incharge_name) {
      alert('⚠️ Please fill: Branch Name, City, and Incharge Name!')
      return
    }

    const baseUrl = window.location.origin
    const loginUrl = `${baseUrl}/#/branch-login/${form.branch_url_slug}`

    if (editingBranch) {
      const updated = branches.map(b => b.id === editingBranch.id ? { ...b, ...form } : b)
      setBranches(updated)
      localStorage.setItem('btc_branches', JSON.stringify(updated))
      alert('✅ Branch updated!')
    } else {
      const newBranch = { id: Date.now(), ...form, status: 'Active' }
      const updated = [newBranch, ...branches]
      setBranches(updated)
      localStorage.setItem('btc_branches', JSON.stringify(updated))
      
      // GUARANTEED ALERT
      alert(`✅ BRANCH CREATED!\n\nName: ${form.name}\n\nURL: ${loginUrl}\n\nUsername: ${form.incharge_username}\n\nPassword: ${form.incharge_password}`)
    }

    setForm({ name: '', city: '', state: '', address: '', phone: '', email: '', incharge_name: '', incharge_username: '', incharge_password: '', branch_url_slug: '', status: 'Active' })
    setEditingBranch(null)
    setShowForm(false)
  }

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    const updated = branches.filter(b => b.id !== id)
    setBranches(updated)
    localStorage.setItem('btc_branches', JSON.stringify(updated))
  }

  const toggleStatus = (id) => {
    const updated = branches.map(b => b.id === id ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' } : b)
    setBranches(updated)
    localStorage.setItem('btc_branches', JSON.stringify(updated))
  }

  const activeCount = branches.filter(b => b.status === 'Active').length
  const inactiveCount = branches.filter(b => b.status === 'Inactive').length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🏢 Branch Management</h1>
            <p className="text-gray-500 mt-1">
              Total: <span className="font-bold text-blue-600">{branches.length}</span> | 
              Active: <span className="font-bold text-green-600">{activeCount}</span> | 
              Inactive: <span className="font-bold text-red-600">{inactiveCount}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">← Dashboard</button>
            <button onClick={() => { setEditingBranch(null); setForm({ name: '', city: '', state: '', address: '', phone: '', email: '', incharge_name: '', incharge_username: '', incharge_password: '', branch_url_slug: '', status: 'Active' }); setShowForm(!showForm) }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg">
              {showForm ? '✕ Close' : '➕ Add New Branch'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editingBranch ? '✏️ Edit Branch' : '➕ Add New Branch'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                <input type="text" required value={form.name} onChange={handleNameChange} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Delhi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" required value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input type="text" required value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Name *</label>
                <input type="text" required value={form.incharge_name} onChange={(e) => setForm({...form, incharge_name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input type="text" value={form.branch_url_slug} onChange={(e) => setForm({...form, branch_url_slug: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={form.incharge_username} onChange={(e) => setForm({...form, incharge_username: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm font-bold text-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="flex gap-2">
                  <input type="text" value={form.incharge_password} onChange={(e) => setForm({...form, incharge_password: e.target.value})} className="flex-1 p-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm font-bold text-red-600" />
                  <button type="button" onClick={() => setForm({...form, incharge_password: generatePassword()})} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"></button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" rows="2" />
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2">
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">
                  {editingBranch ? '💾 Update' : ' Save Branch'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingBranch(null); }} className="px-8 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">📋 All Branches ({branches.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Incharge</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No branches.</td></tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-blue-50">
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">{branch.name}</div>
                        <div className="text-sm text-gray-500">{branch.city}, {branch.state}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium">{branch.incharge_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{branch.incharge_username}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {branch.phone && <div> {branch.phone}</div>}
                        {branch.email && <div>✉️ {branch.email}</div>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleStatus(branch.id)} className={`px-3 py-1 rounded-full text-xs font-bold ${branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {branch.status === 'Active' ? '✅ Active' : '❌ Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(branch)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">✏️ Edit</button>
                          <button onClick={() => handleDelete(branch.id, branch.name)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">🗑️ Delete</button>
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
