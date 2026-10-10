import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Audit() {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter State
  const [selectedBranch, setSelectedBranch] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const headers = { 'Authorization': `Bearer ${token}` }

      // Fetch Bills and Branches
      const [billsRes, branchesRes] = await Promise.all([
        fetch(`${apiUrl}/api/bills`, { headers }),
        fetch(`${apiUrl}/api/branches`, { headers })
      ])
      
      const billsData = await billsRes.json()
      const branchesData = await branchesRes.json()
      
      // Ensure data is always an array
      setBills(Array.isArray(billsData.data) ? billsData.data : [])
      setBranches(Array.isArray(branchesData.data) ? branchesData.data : [])
    } catch (err) {
      setError('Failed to fetch audit data: ' + err.message)
      console.error(err)
      setBills([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIX: Helper function to get branch name from branch_id
  const getBranchName = (branchId) => {
    if (!branchId) return 'Head Office'
    const branch = branches.find(b => b.id === branchId || b.id === parseInt(branchId))
    return branch ? branch.branch_name : 'Head Office'
  }

  // ✅ FIX: Safe filter with correct column names
  const filteredBills = Array.isArray(bills) ? bills.filter(bill => {
    const billBranchName = getBranchName(bill.branch_id)
    const matchesBranch = selectedBranch === 'ALL' || billBranchName === selectedBranch
    const matchesSearch = searchTerm === '' || 
      (bill.party_name && bill.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.bill_no && bill.bill_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.party_gst && bill.party_gst.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesBranch && matchesSearch
  }) : []

  // Excel (CSV) Export Function for CA
  const exportToExcel = () => {
    if (filteredBills.length === 0) {
      alert("No data to export!")
      return
    }

    // CSV Headers
    const headers = ["Bill No", "Date", "Party Name", "GST Number", "Amount (₹)", "Branch Name", "Status"]
    
    // ✅ FIX: CSV Rows with correct column names
    const rows = filteredBills.map(bill => [
      bill.bill_no || 'N/A',
      bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN') : 'N/A',
      bill.party_name || 'N/A',
      bill.party_gst || 'N/A',  // ✅ Fixed: was gst_number
      parseFloat(bill.grand_total || bill.amount || 0).toFixed(2),  // ✅ Fixed: was amount
      getBranchName(bill.branch_id),  // ✅ Fixed: was branch_name
      bill.status || 'Pending'
    ])

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    // Create download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    const fileName = `CA_Audit_Report_${selectedBranch === 'ALL' ? 'All_Branches' : selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-8 text-center text-gray-600">⏳ Loading Audit Data...</div>
  if (error) return (
    <div className="p-8 text-center text-red-600">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold mb-2">Error Loading Audit Data</h2>
      <p className="mb-4">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        🔄 Retry
      </button>
    </div>
  )

  // ✅ FIX: Calculate Total Amount using grand_total
  const totalAmount = filteredBills.reduce((sum, bill) => sum + parseFloat(bill.grand_total || bill.amount || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Audit & CA Report Module</h1>
          <p className="text-sm text-gray-500">Track all bills, GST details, and branch-wise performance</p>
        </div>
        <button 
          onClick={exportToExcel}
          disabled={filteredBills.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow transition disabled:bg-gray-400"
        >
           Export to Excel (CA Report)
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Branch</label>
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Branches (Consolidated)</option>
            {Array.isArray(branches) && branches.map(branch => (
              <option key={branch.id} value={branch.branch_name}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Search (Party, Bill No, GST)</label>
          <input 
            type="text"
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={() => { setSelectedBranch('ALL'); setSearchTerm(''); }}
            className="w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium text-sm"
          >
            🔄 Reset Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Bill Records <span className="text-sm font-normal text-gray-500">({filteredBills.length} found)</span>
          </h2>
          <div className="text-right">
            <span className="text-xs text-gray-500 uppercase font-bold">Total Amount</span>
            <p className="text-xl font-bold text-green-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Bill No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Party Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">GST Number</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Amount (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Branch</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No bills found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill, index) => (
                  <tr key={bill.id || index} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">
                      {bill.bill_no || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.party_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {bill.party_gst || '-'}  {/* ✅ Fixed: was gst_number */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ₹{parseFloat(bill.grand_total || bill.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}  {/* ✅ Fixed: was amount */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {getBranchName(bill.branch_id)}  {/* ✅ Fixed: was branch_name */}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
