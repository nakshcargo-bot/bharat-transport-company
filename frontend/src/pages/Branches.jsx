import { useState, useEffect } from 'react'
import { branchAPI } from '../api'

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    incharge_name: '',
    incharge_username: '',
    incharge_password: '',
    branch_url_slug: ''
  })

  const [showCredentials, setShowCredentials] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await branchAPI.getAll()
      // FIX: Ensure branches is ALWAYS an array
      const branchData = res?.data || res?.branches || []
      setBranches(Array.isArray(branchData) ? branchData : [])
    } catch (err) {
      console.error('Error fetching branches:', err)
      setError(err.message || 'Failed to fetch branches')
      setBranches([]) // FIX: Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate credentials based on branch name
  const handleNameChange = (e) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    setFormData({
      ...formData,
      name: name,
      branch_url_slug: slug,
      incharge_username: slug ? `incharge_${slug}` : '',
      incharge_password: generateSecurePassword()
    })
  }

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.city) {
      alert('Branch Name and City are required!')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await branchAPI.create(formData)
      
      setShowCredentials({
        name: formData.name,
        url: `${window.location.origin}/#/branch/${formData.branch_url_slug}`,
        username: formData.incharge_username,
        password: formData.incharge_password
      })

      setFormData({
        name: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', incharge_name: '', incharge_username: '', incharge_password: '', branch_url_slug: ''
      })
      
      await fetchBranches()
    } catch (err) {
      alert('Failed to create branch: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) return
    try {
      await branchAPI.delete(id)
      await fetchBranches()
    } catch (err) {
      alert('Failed to delete branch: ' + (err.message || 'Unknown error'))
    }
  }

  // FIX: Better loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-gray-600 font-medium">Loading branches...</div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-red-200">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600 font-bold mb-2">Error Loading Branches</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchBranches}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
             Retry
          </button>
        </div>
      </div>
    )
  }

  // FIX: Ensure safe array for mapping
  const safeBranches = Array.isArray(branches) ? branches : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🏢 Branch Management</h1>

      {/* Credentials Success Modal / Alert */}
      {showCredentials && (
        <div className="mb-6 bg-green-50 border-2 border-green-400 rounded-lg p-6 shadow-lg animate-pulse">
          <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
            ✅ Branch Created Successfully! Share these credentials with the Branch Incharge:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <span className="font-semibold text-gray-600">Branch Login URL:</span>
              <p className="text-blue-700 font-mono break-all text-base">{showCredentials.url}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <span className="font-semibold text-gray-600">Username:</span>
              <p className="text-gray-900 font-mono text-base">{showCredentials.username}</p>
            </div>
            <div className="bg-white p-3 rounded border md:col-span-2">
              <span className="font-semibold text-gray-600">Password:</span>
              <p className="text-red-600 font-mono font-bold text-lg">{showCredentials.password}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCredentials(null)}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium shadow"
          >
            Close & Acknowledge
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Branch Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Add New Branch</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch Name *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={handleNameChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Ahmedabad"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">URL Slug (Auto-generated)</label>
              <input 
                type="text" 
                value={formData.branch_url_slug}
                onChange={(e) => setFormData({...formData, branch_url_slug: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-50 text-gray-600 font-mono text-sm"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Incharge Name</label>
              <input 
                type="text" 
                value={formData.incharge_name}
                onChange={(e) => setFormData({...formData, incharge_name: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Incharge Username (Auto)</label>
              <input 
                type="text" 
                value={formData.incharge_username}
                onChange={(e) => setFormData({...formData, incharge_username: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-50 font-mono text-sm"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Auto-Generated Password</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.incharge_password}
                  onChange={(e) => setFormData({...formData, incharge_password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-50 font-mono text-red-600 font-bold"
                  readOnly
                />
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, incharge_password: generateSecurePassword()})}
                  className="mt-1 px-3 py-2 bg-gray-200 rounded border hover:bg-gray-300 text-xs"
                  title="Regenerate Password"
                >
                  
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
                <input 
                  type="text" 
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input 
                  type="text" 
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium transition shadow"
            >
              {isSubmitting ? 'Creating...' : 'Create Branch & Generate Credentials'}
            </button>
          </form>
        </div>

        {/* Branch List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700">Existing Branches</h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{safeBranches.length} Total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incharge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeBranches.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <div>No branches found. Create your first branch!</div>
                    </td>
                  </tr>
                ) : (
                  safeBranches.map((branch, index) => (
                    <tr key={branch.id || branch._id || index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{branch.name || 'Unnamed Branch'}</div>
                        <div className="text-xs text-gray-500">{branch.city || 'N/A'}, {branch.state || ''}</div>
                        {branch.branch_url_slug && (
                          <div className="text-xs text-blue-600 font-mono mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">/{branch.branch_url_slug}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{branch.incharge_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono">{branch.incharge_username || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.phone && <div>📞 {branch.phone}</div>}
                        {branch.email && <div>✉️ {branch.email}</div>}
                        {!branch.phone && !branch.email && <span className="text-gray-400">No contact info</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(branch.id || branch._id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded border border-red-200 transition"
                        >
                          🗑️ Delete
                        </button>
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
