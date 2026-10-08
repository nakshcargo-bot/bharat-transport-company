import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Audit() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/audit`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      setLogs(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-700',
      'UPDATE': 'bg-blue-100 text-blue-700',
      'DELETE': 'bg-red-100 text-red-700',
      'CANCEL': 'bg-orange-100 text-orange-700',
      'LOGIN': 'bg-purple-100 text-purple-700'
    }
    return colors[action] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl">🔍 Audit Log</h1>
            <p className="text-xs text-gray-300">All system activities tracked</p>
          </div>
          <button onClick={() => navigate('/')} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm">← Dashboard</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? <div className="text-center py-20">Loading...</div> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left text-sm font-bold">Time</th>
                    <th className="p-3 text-left text-sm font-bold">Action</th>
                    <th className="p-3 text-left text-sm font-bold">Module</th>
                    <th className="p-3 text-left text-sm font-bold">Record ID</th>
                    <th className="p-3 text-left text-sm font-bold">Details</th>
                    <th className="p-3 text-left text-sm font-bold">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No audit logs yet</td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-600">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>{log.action}</span>
                      </td>
                      <td className="p-3 text-sm font-bold">{log.module}</td>
                      <td className="p-3 text-sm text-gray-600">{log.record_id}</td>
                      <td className="p-3 text-sm">{log.details}</td>
                      <td className="p-3 text-sm font-bold text-purple-700">{log.performed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
