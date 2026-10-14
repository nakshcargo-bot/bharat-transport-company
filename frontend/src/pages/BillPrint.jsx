import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const COMPANY = {
  name: 'BHARAT TRANSPORT COMPANY',
  gst: '08CMRPP0955N1Z5',
  pan: 'CMRPP0955N',
  address: 'Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan - 331023',
  phone: '+91 9680264231',
  email: 'bharattrsnportcompany@gmail.com',
  bankName: 'HDFC BANK',
  accountNo: '50200112184634',
  ifsc: 'HDFC0002795',
  branch: 'RAJGARH'
}

const styles = `
  :root { --primary: #0d1b3e; --accent: #d32f2f; --bg-light: #f1f4f9; --success: #2e7d32; }
  .bill-print-page, .bill-print-page * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bill-print-page { min-height: 100vh; background: #555; padding: 1px 0; font-family: 'Segoe UI', Arial, sans-serif; }
  .invoice-wrapper { width: 210mm; min-height: 297mm; background: #fff; margin: 20px auto; padding: 8mm; position: relative; box-shadow: 0 0 30px rgba(0,0,0,0.5); page-break-after: always; }
  .copy-tag { text-align: right; font-size: 14px; font-weight: 900; color: var(--accent); margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px solid #ddd; }
  .top-id-header { text-align: right; font-size: 12px; font-weight: 800; color: #000; margin-bottom: 5px; }
  .bill-header { text-align: center; margin-bottom: 5px; }
  .bill-header h1 { margin: 0; font-size: 28px; color: var(--accent); font-weight: 900; }
  .bill-header p { margin: 2px 0; font-size: 11px; color: #333; font-weight: 600; }
  .contact-row { font-size: 12px; font-weight: bold; color: var(--primary); padding-bottom: 8px; margin-bottom: 12px; border-bottom: 3px solid #000; display: flex; justify-content: center; gap: 30px; }
  .info-grid { display: grid; grid-template-columns: 2.1fr 0.9fr; gap: 10px; margin-bottom: 10px; }
  .party-main-box { border: 2px solid var(--primary); border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
  .box-title { background: var(--primary); color: white; padding: 4px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  .box-content { padding: 6px; background: #fff; }
  .bill-print-page .party-value { width: 100%; border: none; background: transparent; font-size: 12px; font-weight: 700; white-space: pre-wrap; overflow-wrap: anywhere; }
  .bill-print-page .party-value.name { font-size: 14px; }
  .required-field { border-bottom: 1px dashed #ccc !important; margin-bottom: 5px; }
  .meta-side { display: flex; flex-direction: column; }
  .bill-box { border: 2.5px solid var(--primary); background: var(--bg-light); border-radius: 6px; padding: 8px; }
  .meta-field label { font-size: 9px; font-weight: 900; color: var(--primary); text-transform: uppercase; display: block; border-bottom: 1px solid #ccc; margin-bottom: 2px; }
  .inv-no-big { font-size: 15px; font-weight: 900; color: var(--accent); background: #fff; border: 1.2px solid #000; margin: 2px 0; border-radius: 4px; padding: 3px 0; text-align: center; overflow-wrap: anywhere; }
  .meta-value { min-height: 22px; text-align: center; font-size: 13px; font-weight: 900; color: #000; padding: 2px; }
  .ship-label { font-size: 9px; font-weight: 900; color: var(--accent); text-transform: uppercase; margin-bottom: 2px; display: block; }
  .trip-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
  .trip-table th { background: var(--primary) !important; color: #fff; padding: 6px 2px; font-size: 9px; text-transform: uppercase; border: 1px solid #fff; }
  .trip-table td { border: 1px solid #ccc; padding: 3px 1px; font-size: 10px; text-align: center; overflow-wrap: anywhere; }
  .col-date { width: 7%; }.col-lr { width: 7%; }.col-inv { width: 12%; }.col-from { width: 9%; }.col-to { width: 9%; }.col-wt { width: 7%; }.col-load { width: 9%; }.col-unload { width: 9%; }.col-oth { width: 9%; }.col-freight { width: 9%; }.col-total { width: 13%; }
  .row-total { background: #fffde7 !important; color: var(--primary); font-weight: 900 !important; }
  .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
  .card { padding: 6px; background: var(--bg-light); border-radius: 6px; text-align: center; border-bottom: 3px solid var(--primary); }
  .card span { font-size: 8px; text-transform: uppercase; font-weight: 900; display: block; }
  .card strong { font-size: 16px; color: var(--primary); }
  .bottom-layout { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 15px; }
  .left-info-column { display: flex; flex-direction: column; gap: 10px; }
  .bank-details-box, .payment-modes-box { background: var(--bg-light); border: 2px solid var(--primary); padding: 8px; border-radius: 6px; }
  .bank-details-box h4, .payment-modes-box h4 { margin: 0 0 4px; color: var(--primary); font-size: 12px; border-bottom: 1.5px solid #ccc; text-transform: uppercase; }
  .payment-row { display: flex; align-items: center; margin-bottom: 5px; font-size: 11px; font-weight: 800; }
  .payment-row label { width: 110px; color: var(--primary); }
  .calc-table { width: 100%; border-collapse: collapse; }
  .calc-table td { text-align: right; padding: 3px 8px; font-size: 13px; border: none; font-weight: 700; }
  .net-payable-row { background: var(--primary) !important; color: #fff; font-weight: 900; }
  .words-right-container { margin-top: 8px; text-align: right; border-top: 1px dashed #ccc; padding-top: 5px; }
  .words-label { font-size: 9px; font-weight: 900; color: var(--accent); }
  .words-value { font-size: 11px; font-weight: 900; text-transform: uppercase; }
  .remarks-section { margin-top: 15px; border-top: 1px solid #eee; padding-top: 8px; }
  .remarks-section label { font-size: 10px; font-weight: 900; color: var(--primary); text-transform: uppercase; }
  .remarks-value { min-height: 22px; border-bottom: 1px dashed #bbb; font-size: 12px; font-weight: 600; padding: 5px 0; white-space: pre-wrap; }
  .sign-label { text-align: center; width: 220px; float: right; margin-top: -10px; }
  .stamp-sig-container { position: relative; width: 200px; height: 110px; display: flex; align-items: center; justify-content: center; }
  .round-stamp-svg { width: 110px; height: 110px; position: absolute; transform: rotate(-10deg); opacity: 0.9; }
  .sign-label p { border-top: 2px solid #000; padding-top: 5px; font-weight: 900; font-size: 11px; margin: 0; }
  .signature-name { position: relative; z-index: 1; font-family: cursive; font-size: 22px; color: #1a237e; transform: rotate(-8deg); }
  .no-print { text-align: center; padding: 12px; background: #111; position: sticky; top: 0; z-index: 1000; display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; }
  .no-print button, .no-print select { padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: 900; color: #fff; font-size: 11px; text-transform: uppercase; }
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; }
    .bill-print-page { background: white; }
    .invoice-wrapper { margin: 0; box-shadow: none; width: 100%; min-height: 0; padding: 5mm; }
    @page { size: A4; margin: 5mm; }
  }
`

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCharge(value) {
  return value === '' || value === null || value === undefined ? '' : formatMoney(value)
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN')
}

function getPaymentDetails(value) {
  if (!value || typeof value !== 'string') return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function BillDocument({ bill, copy }) {
  const payment = getPaymentDetails(bill.payment_details)
  const rows = bill.items || []
  const subtotal = Number(bill.trip_subtotal || 0)
  const gstAmount = Number(bill.gst_amount || 0)
  const grandTotal = Number(bill.grand_total || 0)
  const advance = Number(bill.advance_received || 0)
  const balance = Number(bill.net_balance ?? bill.balance_due ?? grandTotal - advance)
  const pathId = `stamp-circle-${copy.toLowerCase()}`

  return (
    <div className="invoice-wrapper">
      <div className="copy-tag">{copy} COPY (RECIPIENT)</div>
      <div className="top-id-header">GSTIN: {COMPANY.gst} | PAN: {COMPANY.pan}</div>
      <div className="bill-header">
        <h1>{COMPANY.name}</h1>
        <p>{COMPANY.address}</p>
        <div className="contact-row">
          <span>Mobile: {COMPANY.phone}</span>
          <span>Email: {COMPANY.email}</span>
        </div>
      </div>

      <div className="info-grid">
        <div className="meta-side">
          <div className="party-main-box">
            <div className="box-title">BILL TO (PARTY DETAILS)</div>
            <div className="box-content">
              <div className="party-value name required-field">{bill.party_name || ''}</div>
              <div className="party-value">GST NO: {bill.party_gst || ''}</div>
            </div>
          </div>
          <div className="party-main-box" style={{ borderColor: '#555' }}>
            <div className="box-title" style={{ background: '#555' }}>SHIPMENT (CONSIGNOR/CONSIGNEE)</div>
            <div className="box-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span className="ship-label">FROM (CONSIGNOR):</span>
                <div className="party-value">{bill.from_name || ''}</div>
              </div>
              <div style={{ borderLeft: '1.5px solid #eee', paddingLeft: '8px' }}>
                <span className="ship-label">TO (CONSIGNEE):</span>
                <div className="party-value">{bill.to_name || ''}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="meta-side">
          <div className="bill-box">
            <div className="meta-field">
              <label>Invoice No.</label>
              <div className="inv-no-big">{bill.bill_no || ''}</div>
            </div>
            <div className="meta-field">
              <label>Date</label>
              <div className="meta-value">{formatDate(bill.bill_date)}</div>
            </div>
            <div className="meta-field">
              <label>Vehicle No.</label>
              <div className="meta-value">{bill.vehicle_no || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard">
        <div className="card"><span>Grand Total</span><strong>₹ {formatMoney(grandTotal)}</strong></div>
        <div className="card"><span>Advance Received</span><strong>₹ {formatMoney(advance)}</strong></div>
        <div className="card"><span>Balance Due</span><strong>₹ {formatMoney(balance)}</strong></div>
      </div>

      <table className="trip-table">
        <thead>
          <tr>
            <th className="col-date">Date</th><th className="col-lr">LR No.</th><th className="col-inv">Inv no.</th>
            <th className="col-from">From</th><th className="col-to">To</th><th className="col-wt">Wt(MT)</th>
            <th className="col-load">Loading</th><th className="col-unload">Unloading</th><th className="col-oth">Other</th>
            <th className="col-freight">Freight</th><th className="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              <td>{row.trip_date || row.date || ''}</td><td>{row.lr_no || ''}</td><td>{row.invoice_no || ''}</td>
              <td>{row.from_name || ''}</td><td>{row.to_name || ''}</td><td>{row.weight_mt || ''}</td>
              <td>{formatCharge(row.loading)}</td><td>{formatCharge(row.unloading)}</td><td>{formatCharge(row.other_charges)}</td>
              <td>{formatCharge(row.freight)}</td><td className="row-total">{formatMoney(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bottom-layout">
        <div className="left-info-column">
          <div className="bank-details-box">
            <h4>BANK ACCOUNT DETAILS</h4>
            Beneficiary: <b>{COMPANY.name}</b><br />
            Bank: <b>{COMPANY.bankName}</b> | A/c: <b>{COMPANY.accountNo}</b><br />
            IFSC: <b>{COMPANY.ifsc}</b> | Branch: <b>{COMPANY.branch}</b>
          </div>
          <div className="payment-modes-box">
            <h4>ADVANCE PAYMENT DETAILS</h4>
            <div className="payment-row"><label>BY CASH:</label><span>{payment.cash || ''}</span></div>
            <div className="payment-row"><label>BY CHEQUE:</label><span>{payment.cheque || ''}</span></div>
            <div className="payment-row"><label>UPI / ONLINE:</label><span>{payment.online || ''}</span></div>
          </div>
        </div>
        <div className="right-box">
          <table className="calc-table">
            <tbody>
              <tr><td>Trip Sub-Total:</td><td>{formatMoney(subtotal)}</td></tr>
              <tr><td>GST ({Number(bill.gst_percent || 0)}%):</td><td>{formatMoney(gstAmount)}</td></tr>
              <tr className="net-payable-row"><td>Grand Total:</td><td>{formatMoney(grandTotal)}</td></tr>
              <tr style={{ color: 'var(--accent)' }}><td>Advance Recd:</td><td>-{formatMoney(advance)}</td></tr>
              <tr style={{ borderTop: '2px solid #000', fontWeight: 900, fontSize: '16px', color: '#2e7d32' }}><td>NET BALANCE:</td><td>{formatMoney(balance)}</td></tr>
            </tbody>
          </table>
          <div className="words-right-container">
            <span className="words-label">Amount in Words:</span>
            <div className="words-value">{bill.amount_in_words || ''}</div>
          </div>
        </div>
      </div>

      <div className="remarks-section">
        <label>REMARKS / NOTES:</label>
        <div className="remarks-value">{bill.remarks || ''}</div>
      </div>

      <div className="sign-label">
        <div className="stamp-sig-container">
          <svg viewBox="0 0 100 100" className="round-stamp-svg" aria-label="Bharat Transport Company stamp">
            <defs><path id={pathId} d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" /></defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="#1a237e" strokeWidth="2.5" />
            <text fontFamily="Arial Black" fontSize="7" fontWeight="900" fill="#1a237e" textLength="232">
              <textPath href={`#${pathId}`}>BHARAT TRANSPORT COMPANY • BHARAT TRANSPORT COMPANY</textPath>
            </text>
          </svg>
          <span className="signature-name">Krishan</span>
        </div>
        <p>Authorized Signatory</p>
        <strong style={{ fontSize: '9px' }}>FOR {COMPANY.name}</strong>
      </div>
      <div style={{ clear: 'both' }} />
    </div>
  )
}

export default function BillPrint() {
  const { id: routeId } = useParams()
  const hashId = window.location.hash.split('/bill-print/')[1]?.split(/[?#]/)[0]
  const id = routeId || hashId
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [printOption, setPrintOption] = useState('original')

  useEffect(() => {
    let active = true
    setLoading(true)
    setData(null)
    setError('')

    const loadBills = async () => {
      try {
        if (id) {
          const response = await api.get(`/api/bills/${encodeURIComponent(id)}`)
          if (active) setData(response.data)
        } else {
          const response = await api.get('/api/bills')
          if (active) setBills(response.data?.data || response.data || [])
        }
      } catch (loadError) {
        if (active) setError(loadError.response?.data?.error || 'Unable to load bills.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBills()
    return () => { active = false }
  }, [id])

  if (loading) return <div role="status" className="p-8 text-center">Loading bill...</div>
  if (error) {
    return <div className="p-8 text-center"><p role="alert" className="mb-4 text-red-700">{error}</p><button onClick={() => navigate('/bills')}>Back to bills</button></div>
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <main className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Select a Bill to Print</h1>
            <button onClick={() => navigate('/bills')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Back</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100"><tr><th className="p-3">Bill No.</th><th className="p-3">Date</th><th className="p-3">Party</th><th className="p-3 text-right">Total</th><th className="p-3">Action</th></tr></thead>
              <tbody>
                {bills.length === 0 ? <tr><td colSpan="5" className="p-6 text-center text-gray-500">No bills found.</td></tr> : bills.map(bill => (
                  <tr key={bill.id} onClick={() => navigate(`/bill-print/${bill.id}`)} className="border-t hover:bg-gray-50 cursor-pointer">
                    <td className="p-3 font-semibold">{bill.bill_no || 'N/A'}</td>
                    <td className="p-3">{formatDate(bill.bill_date) || '—'}</td>
                    <td className="p-3">{bill.party_name || 'N/A'}</td>
                    <td className="p-3 text-right">₹{formatMoney(bill.grand_total)}</td>
                    <td className="p-3"><Link to={`/bill-print/${bill.id}`} onClick={event => event.stopPropagation()} className="text-blue-700 underline">Print</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center">Bill data is unavailable.</div>

  const copies = printOption === 'both'
    ? ['ORIGINAL', 'DUPLICATE']
    : [printOption === 'duplicate' ? 'DUPLICATE' : 'ORIGINAL']

  return (
    <div className="bill-print-page">
      <style>{styles}</style>
      <div className="no-print">
        <button type="button" onClick={() => navigate('/bills')} style={{ background: '#666' }}>Back to List</button>
        <label htmlFor="bill-copy-option" style={{ color: 'white', fontWeight: 900, fontSize: 11 }}>PRINT COPY</label>
        <select id="bill-copy-option" value={printOption} onChange={event => setPrintOption(event.target.value)} style={{ background: '#333' }}>
          <option value="original">Original</option>
          <option value="duplicate">Duplicate</option>
          <option value="both">Both</option>
        </select>
        <button type="button" onClick={() => window.print()} style={{ background: '#d32f2f' }}>Print</button>
      </div>
      {copies.map(copy => <BillDocument key={copy} bill={data} copy={copy} />)}
    </div>
  )
}
