import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

export default function BranchPortal() {
  const { branchSlug } = useParams()
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedBranches = JSON.parse(localStorage.getItem('btc_branches') || '[]')
    const foundBranch = savedBranches.find(b => b.branch_url_slug === branchSlug)
    
    if (foundBranch) {
      setBranch(foundBranch)
    }
    setLoading(false)
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

  if (!branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Branch Not Found</h1>
          <p className="text-gray-600">This branch does not exist or has been deactivated.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-3xl font-bold text-gray-800">{branch.name}</h1>
          <p className="text-gray-600 mt-2">{branch.city}, {branch.state}</p>
          <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
            ✅ {branch.status}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">📋 Branch Information</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Incharge:</strong> {branch.incharge_name || 'N/A'}</div>
            <div><strong>Username:</strong> {branch.incharge_username || 'N/A'}</div>
            <div><strong>Contact:</strong> {branch.phone || 'N/A'}</div>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = `/#/branch-login/${branchSlug}`}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
        >
          🔐 Login to Branch Portal
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>© 2026 Bharat Transport Company</p>
        </div>
      </div>
    </div>
  )
}
