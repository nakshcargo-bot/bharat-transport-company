import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Branches() {
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCredentials, setShowCredentials] = useState(null)
  const [form, setForm] = useState({
    branch_name: '', city: '', state: '', address: '', phone: '', email: '', incharge_name: ''
  })

  const loadBranches = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/branches')
      setBranches(res.data.data || [])
    } catch (err) {
      console.error('Load branches error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { loadBranches() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.branch_name || !form.city || !form.incharge_name) {
      alert('⚠️ Please fill: Branch Name, City, and Incharge Name!')
      return
    }
    try {
      const res = await api.post('/api/branches/create-with-login', form)
      if (res.data.success) {
        setShowCredentials(res.data.branch)
        setForm({ branch_name: '', city: '', state: '', address: '', phone: '', email: '', incharge_name: '' })
        setShowForm(false)
        loadBranches()
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('✅ Copied: ' + text)
  }

  const activeCount = branches.filter(b => b.is_active).length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🏢 Branch Management</h1>
            <p className="text-gray-500 mt-1">
              Total: <span className="font-bold text-blue-600">{branches.length}</span> | 
              Active: <span className="font-bold text-green-600">{activeCount}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">← Dashboard</button>
            <button
              onClick={() => { setShowForm(!showForm); setForm({ branch_name: '', city: '', state: '', address: '', phone: '', email: '', incharge_name: '' }) }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg"
            >
              {showForm ? '✖ Close' : '➕ Add New Branch'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Add New Branch (Auto Login Credentials)</h2>
            <p className="text-sm text-gray-600 mb-4">
              ℹ️ System automatically generate karega: URL, Username, aur Password
            </p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                <input type="text" required value={form.branch_name} onChange={(e) => setForm({...form, branch_name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Mumbai Branch" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" required value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Maharashtra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Name *</label>
                <input type="text" required value={form.incharge_name} onChange={(e) => setForm({...form, incharge_name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., mumbai@btc.com" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg" rows="2" placeholder="Full address" />
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2">
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">💾 Create Branch & Generate Credentials</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading branches...</p>
          </div>
        ) : (
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Login URL</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No branches yet. Click "Add New Branch" to create one.</td></tr>
                  ) : (
                    branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-blue-50">
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">{branch.branch_name}</div>
                          <div className="text-sm text-gray-500">{branch.city}{branch.state ? ', ' + branch.state : ''}</div>
                          <div className="text-xs text-gray-400 font-mono">Code: {branch.branch_code}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium">{branch.incharge_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 font-mono">{branch.incharge_username || 'N/A'}</div>
                          {branch.phone && <div className="text-xs text-gray-500">📞 {branch.phone}</div>}
                        </td>
                        <td className="px-4 py-4">
                          {branch.url_slug ? (
                            <button onClick={() => copyToClipboard(`https://bharat-transport-v2.pages.dev/#/branch-login/${branch.url_slug}`)} className="text-xs text-blue-600 hover:text-blue-800 underline font-mono">
                              /branch-login/{branch.url_slug}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {branch.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => setShowCredentials(branch)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">
                            🔑 View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">🔑 Branch Credentials</h2>
              <button onClick={() => setShowCredentials(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✖</button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-blue-800 mb-3">{showCredentials.branch_name}</h3>
              <p className="text-xs text-blue-600 mb-3">{showCredentials.city}{showCredentials.state ? ', ' + showCredentials.state : ''}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Portal URL</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" readOnly value={`https://bharat-transport-v2.pages.dev/#/branch-login/${showCredentials.url_slug}`} className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm font-mono" />
                    <button onClick={() => copyToClipboard(`https://bharat-transport-v2.pages.dev/#/branch-login/${showCredentials.url_slug}`)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Copy</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Username</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" readOnly value={showCredentials.incharge_username || ''} className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm font-mono font-bold text-blue-700" />
                    <button onClick={() => copyToClipboard(showCredentials.incharge_username || '')} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Copy</button>
                  </div>
                </div>
                {showCredentials.incharge_password && (
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase">Password</label>
                    <div className="flex gap-2 mt-1">
                      <input type="text" readOnly value={showCredentials.incharge_password} className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm font-mono font-bold text-red-600" />
                      <button onClick={() => copyToClipboard(showCredentials.incharge_password)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Copy</button>
                    </div>
                    <p className="text-xs text-red-600 mt-1">⚠️ Ye password sirf ek baar dikhega. Abhi copy karo!</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-3">
              <strong>📝 Instructions:</strong> Ye credentials branch incharge ko de do. Wo apne URL pe login karke apna kaam kar sakta hai.
            </div>
            <button onClick={() => setShowCredentials(null)} className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
