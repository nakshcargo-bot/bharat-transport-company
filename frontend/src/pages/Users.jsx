import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

export default function Users() {
  const navigate = useNavigate()
  
  // 🔒 ADMIN ONLY CHECK: Agar user admin nahi hai, toh dashboard par bhej do
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', username: 'admin', role: 'admin', branch: 'All', status: 'Active' },
    { id: 2, name: 'Rajesh Kumar', username: 'incharge_mumbai', role: 'branch_user', branch: 'Mumbai', status: 'Active' },
    { id: 3, name: 'Vikram Patel', username: 'incharge_ahmedabad', role: 'branch_user', branch: 'Ahmedabad', status: 'Active' }
  ])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">👥 User Management</h1>
            <p className="text-gray-500 mt-1">Manage system users and branch incharges</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">All Users</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">➕ Add New User</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Branch</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'admin' ? 'Administrator' : 'Branch User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
