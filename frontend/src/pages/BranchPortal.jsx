import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'

export default function BranchPortal() {
  const { branchSlug } = useParams()
  const navigate = useNavigate()
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-bounce">🏢</div>
          <div className="text-2xl font-bold">Loading Branch Portal...</div>
        </div>
      </div>
    )
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Branch Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This branch does not exist or has been deactivated.'}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-3xl font-bold text-gray-800">{branch.branch_name}</h1>
          <p className="text-gray-600 mt-2">
            {branch.city}{branch.state ? ', ' + branch.state : ''}
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
            ✅ Active Branch
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">📋 Branch Information</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Branch Code:</strong> {branch.branch_code || 'N/A'}</div>
            <div><strong>Incharge:</strong> {branch.incharge_name || 'N/A'}</div>
            {branch.phone && <div><strong>Contact:</strong> {branch.phone}</div>}
            {branch.email && <div><strong>Email:</strong> {branch.email}</div>}
          </div>
        </div>

        <button 
          onClick={() => navigate(`/branch-login/${branchSlug}`)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
        >
          🔐 Login to Branch Portal
        </button>

        <div className="mt-6 pt-6 border-t text-center text-xs text-gray-500">
          <p>© 2026 Bharat Transport Company</p>
          <p className="mt-1">Branch Portal v1.0</p>
        </div>
      </div>
    </div>
  )
}
