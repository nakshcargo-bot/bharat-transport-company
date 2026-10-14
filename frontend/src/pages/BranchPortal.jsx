import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { formatDate } from '../utils/dateFormatter'

const API_URL = 'https://bharat-transport-api.onrender.com'

function DataTable({ title, rows, columns, emptyMessage }) {
  return (
    <section className="rounded-xl bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 font-semibold">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className="text-gray-700">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-3">{column.render ? column.render(row) : row[column.key] || '—'}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function BranchPortal() {
  const { branchSlug } = useParams()
  const navigate = useNavigate()
  const [branch, setBranch] = useState(null)
  const [consignments, setConsignments] = useState([])
  const [bills, setBills] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let session

    try {
      session = JSON.parse(localStorage.getItem('branch_session') || 'null')
    } catch {
      localStorage.removeItem('branch_session')
    }

    if (!session?.token || !session.branch || session.branch.url_slug !== branchSlug) {
      localStorage.removeItem('branch_session')
      navigate(`/branch-login/${branchSlug}`, { replace: true })
      return () => controller.abort()
    }

    setBranch(session.branch)
    setLoading(true)
    setError('')
    setConsignments([])
    setBills([])
    setReceipts([])
    const headers = {
      Authorization: `Bearer ${session.token}`,
      'X-Branch-Slug': branchSlug
    }

    async function loadBranchData() {
      try {
        const [consignmentResponse, billResponse, receiptResponse] = await Promise.all([
          axios.get(`${API_URL}/api/consignments`, { headers, signal: controller.signal }),
          axios.get(`${API_URL}/api/bills`, { headers, signal: controller.signal }),
          axios.get(`${API_URL}/api/mr`, { headers, signal: controller.signal })
        ])
        setConsignments(consignmentResponse.data.data || [])
        setBills(billResponse.data.data || [])
        setReceipts(receiptResponse.data.data || [])
      } catch (err) {
        if (controller.signal.aborted) return
        if (err.response?.status === 401) {
          localStorage.removeItem('branch_session')
          navigate(`/branch-login/${branchSlug}`, { replace: true })
          return
        }
        setError(err.response?.data?.error || 'Unable to load branch records.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadBranchData()
    return () => controller.abort()
  }, [branchSlug, navigate])

  function handleLogout() {
    localStorage.removeItem('branch_session')
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading branch portal...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm text-blue-200">Branch Portal</p>
            <h1 className="text-2xl font-bold">{branch?.branch_name}</h1>
            <p className="text-sm text-blue-100">
              {[branch?.city, branch?.state].filter(Boolean).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Bilties', value: consignments.length },
            { label: 'Bills', value: bills.length },
            { label: 'Money Receipts', value: receipts.length }
          ].map((item) => (
            <section key={item.label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">{item.value}</p>
            </section>
          ))}
        </div>

        <DataTable
          title="Recent Bilties"
          rows={consignments.slice(0, 25)}
          columns={[
            { key: 'lr_no', label: 'LR No.' },
            { key: 'lr_date', label: 'Date', render: (row) => formatDate(row.lr_date) },
            { key: 'from_name', label: 'From' },
            { key: 'to_name', label: 'To' },
            { key: 'status', label: 'Status' }
          ]}
          emptyMessage="No bilties found for this branch."
        />
        <DataTable
          title="Recent Bills"
          rows={bills.slice(0, 25)}
          columns={[
            { key: 'bill_no', label: 'Bill No.' },
            { key: 'bill_date', label: 'Date', render: (row) => formatDate(row.bill_date) },
            { key: 'party_name', label: 'Party' },
            { key: 'total_amount', label: 'Amount' },
            { key: 'status', label: 'Status' }
          ]}
          emptyMessage="No bills found for this branch."
        />
        <DataTable
          title="Recent Money Receipts"
          rows={receipts.slice(0, 25)}
          columns={[
            { key: 'mr_no', label: 'MR No.' },
            { key: 'mr_date', label: 'Date', render: (row) => formatDate(row.mr_date) },
            { key: 'party_name', label: 'Party' },
            { key: 'amount', label: 'Amount' },
            { key: 'payment_mode', label: 'Payment Mode' }
          ]}
          emptyMessage="No money receipts found for this branch."
        />
      </div>
    </main>
  )
}
