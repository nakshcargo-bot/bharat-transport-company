import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function BranchLogin() {
  const { branchSlug } = useParams()
  const navigate = useNavigate()
  const [branch, setBranch] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedBranches = JSON.parse(localStorage.getItem('btc_branches') || '[]')
    const foundBranch = savedBranches.find(b => b.branch_url_slug === branchSlug)
    
    if (foundBranch) {
      setBranch(foundBranch)
    } else {
      setError('Branch not found!')
    }
    setLoading(false)
  }, [branchSlug])

  const handleLogin = (e) => {
    e.preventDefault()
    
    if (!branch) {
      setError('Branch not found!')
      return
    }

    if (username === branch.incharge_username && password === branch.incharge_password) {
      const branchUser = {
        username: branch.incharge_username,
        role: 'branch_incharge',
        branch_id: branch.id,
        branch_name: branch.name,
        branch_code: branch.branch_url_slug
      }
      
      localStorage.setItem('branch_user', JSON.stringify(branchUser))
      localStorage.setItem('token', 'branch_token_' + branch.id)
      
      alert('✅ Login Successful! Welcome to ' + branch.name)
      navigate('/dashboard')
    } else {
      setError('❌ Invalid username or password!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error && !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">{branch?.name} Login</h1>
          <p className="text-gray-600 text-sm mt-1">Branch Portal Access</p>
        </div>

        {error && branch && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
          >
            🔐 Login to Portal
          </button>
        </form>

        <button
          onClick={() => navigate(`/branch/${branchSlug}`)}
          className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          ← Back to Branch Info
        </button>

        <div className="mt-6 pt-6 border-t text-center text-xs text-gray-500">
          <p>This is a secure branch portal. Only authorized personnel allowed.</p>
        </div>
      </div>
    </div>
  )
}
