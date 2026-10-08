import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Operator',
    branch_id: '',
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      const resUsers = await fetch(`${apiUrl}/api/users`, { headers })
      if (resUsers.ok) {
        const data = await resUsers.json()
        setUsers(data.data || [])
      }

      const resBranches = await fetch(`${apiUrl}/api/branches`, { headers })
      if (resBranches.ok) {
        const data = await resBranches.json()
        setBranches(data.data || [])
      }
    } catch (err) {
      console.error('Users fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'

      const url = editId ? `${apiUrl}/api/users/${editId}` : `${apiUrl}/api/users`
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert(editId ? 'User updated successfully!' : 'User created successfully!')
        setShowForm(false)
        setEditId(null)
        setFormData({ username: '', password: '', full_name: '', role: 'Operator', branch_id: '', is_active: true })
        fetchData()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      console.error('User save error:', err)
      alert('Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      role: user.role || 'Operator',
      branch_id: user.branch_id || '',
      is_active: user.is_active !== false
    })
    setEditId(user.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      
      const res = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-700'
      case 'Manager': return 'bg-blue-100 text-blue-700'
      case 'Operator': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
          <p className="mt-4 text-gray-500">Loading Users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="bg-white/20 p-2 rounded-lg hover:bg-white/30">← Back</button>
            <div>
              <h1 className="font-bold text-xl">👥 User Management</h1>
              <p className="text-xs text-indigo-200">Create & Manage Staff Accounts</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditId(null); }}
              className="bg-white text-indigo-700 px-5 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 shadow flex items-center gap-2"
            >
              <span>+</span> Create New User
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {showForm ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              {editId ? '✏️ Edit User' : '➕ Create New User'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input 
                    required 
                    type="text" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    disabled={editId}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" 
                    placeholder="e.g., jaipur_manager" 
                  />
                  {editId && <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editId ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required={!editId}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500" 
                    placeholder={editId ? 'Leave blank to keep current' : 'Enter password'} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    name="full_name" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500" 
                    placeholder="e.g., Rajesh Kumar" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select 
                    required 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange} 
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Admin (Full Access)</option>
                    <option value="Manager">Manager (Branch Access)</option>
                    <option value="Operator">Operator (Limited Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <select 
                    name="branch_id" 
                    value={formData.branch_id} 
                    onChange={handleChange} 
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_code} - {b.branch_name} ({b.city})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Leave blank for Admin (all branches)</p>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      checked={formData.is_active} 
                      onChange={handleChange} 
                      className="w-5 h-5 text-indigo-600 rounded" 
                    />
                    <span className="font-medium text-gray-700">Active Account</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h4 className="font-bold text-blue-800 mb-2">ℹ️ Role Permissions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Admin:</strong> Full access to all branches, can manage users</li>
                  <li>• <strong>Manager:</strong> Can view and manage only their assigned branch</li>
                  <li>• <strong>Operator:</strong> Can create Bilty/MR only for their branch</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditId(null); }} 
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-8 py-2.5 bg-indigo-700 text-white rounded-lg font-bold hover:bg-indigo-800 shadow disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editId ? '🔄 Update User' : '✅ Create User'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">👥 All Users</h2>
              <div className="text-sm text-gray-500">Total: {users.length}</div>
            </div>

            {users.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-3">👥</div>
                <p className="font-medium">No users created yet.</p>
                <p className="text-sm mt-1">Click "Create New User" to add staff accounts.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-bold text-gray-600">Username</th>
                      <th className="p-4 text-left font-bold text-gray-600">Full Name</th>
                      <th className="p-4 text-left font-bold text-gray-600">Role</th>
                      <th className="p-4 text-left font-bold text-gray-600">Branch</th>
                      <th className="p-4 text-center font-bold text-gray-600">Status</th>
                      <th className="p-4 text-center font-bold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t hover:bg-indigo-50/30 transition-colors">
                        <td className="p-4 font-bold text-indigo-700">{u.username}</td>
                        <td className="p-4">{u.full_name || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.branch_name ? (
                            <div>
                              <div className="font-medium">{u.branch_code}</div>
                              <div className="text-xs text-gray-500">{u.city}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">All Branches</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          <button 
                            onClick={() => handleEdit(u)} 
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold hover:bg-yellow-200"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)} 
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
