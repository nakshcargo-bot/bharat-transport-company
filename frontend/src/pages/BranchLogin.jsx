import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'

export default function BranchLogin() {
  const { branchSlug } = useParams()
  const navigate = useNavigate()
  const [branch, setBranch] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadBranch = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_URL}/api/branch/info/${branchSlug}`)
        if (res.data.success) {
          setBranch(res.data.branch)
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Branch not found!')
      }
      setLoading(false)
    }
    loadBranch()
  }, [branchSlug])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await axios.post(`${API_URL}/api/branch/login`, {
        username,
        password
      })

      if (res.data.success && res.data.token) {
        // Save token and user info
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('branch_user', JSON.stringify(res.data.user))

        alert(`✅ Login Successful!\n\nWelcome to ${res.data.user.branch_name} Branch`)
        navigate('/dashboard', { replace: true })
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password!')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
          <div className="text-xl">Loading Branch...</div>
        </div>
      </div>
    )
  }

  if (error && !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Branch Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <div className="text-5xl mb-2">🏢</div>
          <h1 className="text-2xl font-bold text-gray-800">{branch?.branch_name}</h1>
          <p className="text-gray-600 text-sm mt-1">
            {branch?.city}{branch?.state ? ', ' + branch.state : ''}
          </p>
          <div className="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            Branch Staff Access Only
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter branch username"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg disabled:bg-blue-400"
          >
            {submitting ? '🔐 Logging in...' : '🔐 Login to Branch Portal'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-center text-xs text-gray-500">
          <p>This is a restricted branch portal.</p>
          <p className="mt-1">Only authorized branch staff allowed.</p>
          <p className="mt-2">© 2026 Bharat Transport Company</p>
        </div>
      </div>
    </div>
  )
}
