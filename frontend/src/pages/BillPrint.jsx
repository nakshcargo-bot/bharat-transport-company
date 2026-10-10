import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function BillPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bill, setBill] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const printRef = useRef()

  useEffect(() => {
    if (!id) { navigate('/bills'); return }
    fetchBillData(id)
  }, [id, navigate])

  const fetchBillData = async (id) => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'

      const res = await fetch(`${apiUrl}/api/bills/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBill(data)
      setItems(data.items || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handlePrint = () => window.print()

  const handleWhatsApp = () => {
    if (!bill) return
    const phone = prompt('Customer ka WhatsApp number daalein (with country code):', '91')
    if (!phone) return
    const message = `Dear ${bill.party_name},\n\nAapka bill ready hai.\nBill No: ${bill.bill_no}\nAmount: ₹${Number(bill.net_balance || bill.balance_due || 0).toLocaleString('en-IN')}\n\n- Bharat Transport Company`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div></div>
  if (error || !bill) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-red-600 mb-4">{error || 'Bill not found'}</p>
        <button onClick={() => navigate('/bills')} className="px-4 py-2 bg-blue-600 text-white rounded">← Back</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="bg-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
          <button onClick={() => navigate('/bills')} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">← Back</button>
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">🖨️ Print / Save PDF</button>
            <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">📱 WhatsApp</button>
          </div>
        </div>
      </div>

      <div className="p-4 flex justify-center print:p-0" ref={printRef}>
        <div className="bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', padding: '8mm' }}>

          <BillCopy bill={bill} items={items} copyType="ORIGINAL COPY (RECIPIENT)" />

          <div style={{ borderTop: '2px dashed #999', margin: '5mm 0', textAlign: 'center' }}>
            <span style={{ background: 'white', padding: '0 10px', fontSize: '10px', color: '#666' }}>✂ - - - - - - - - - - - - - - - - - - - - - - - - -</span>
          </div>

          <BillCopy bill={bill} items={items} copyType="DUPLICATE COPY (OFFICE)" />
        </div>
      </div>

      <style>{`
        @page { size: A4; margin: 5mm; }
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          * { box-shadow: none !important; overflow: visible !important; }
        }
      `}</style>
    </div>
  )
}

function BillCopy({ bill, items, copyType }) {
  // ✅ Consignor/Consignee name: bill se lega, ya items se fallback
  const consignorName = bill.consignor_name || bill.party_name || (items[0]?.consignor_name) || '-'
  const consigneeName = bill.consignee_name || (items[0]?.consignee_name) || '-'
  const fromCity = bill.from_name || (items[0]?.from_name) || '-'
  const toCity = bill.to_name || (items[0]?.to_name) || '-'

  // ✅ Advance/Balance calculation
  const grandTotal = Number(bill.grand_total || 0)
  const advanceReceived = Number(bill.advance_received || 0)
  const balanceDue = Number(bill.balance_due || (grandTotal - advanceReceived) || 0)
  const netBalance = Number(bill.net_balance || balanceDue || 0)
  const tripSubtotal = Number(bill.trip_subtotal || grandTotal || 0)
  const gstPercent = Number(bill.gst_percent || 0)
  const gstAmount = Number(bill.gst_amount || 0)

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '10px', color: '#000' }}>

      <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '2mm', textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>
        {copyType}
      </div>

      <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 800, marginBottom: '5px' }}>
        GSTIN: 08CMRPP0955N1Z5 | PAN: CMRPP0955N
      </div>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#d32f2f', margin: '0' }}>BHARAT TRANSPORT COMPANY</h1>
        <p style={{ margin: '2px 0', fontSize: '11px', fontWeight: 600 }}>Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan - 331023</p>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0d1b3e', paddingBottom: '8px', marginBottom: '12px', borderBottom: '3px solid #000', display: 'flex', justifyContent: 'center', gap: '30px' }}>
          <span>Mobile: +91 9680264231</span>
          <span>Email: bharattransportcompany@gmail.com</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 0.9fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <div style={{ border: '2px solid #0d1b3e', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ background: '#0d1b3e', color: 'white', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>BILL TO (PARTY DETAILS)</div>
            <div style={{ padding: '6px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', wordBreak: 'break-word', whiteSpace: 'normal' }}>{bill.party_name || '-'}</div>
              <div style={{ fontSize: '11px', fontWeight: 700 }}>GST: {bill.party_gst || 'N/A'}</div>
            </div>
          </div>
          <div style={{ border: '2px solid #555', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#555', color: 'white', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>SHIPMENT (CONSIGNOR/CONSIGNEE)</div>
            <div style={{ padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#d32f2f', textTransform: 'uppercase', marginBottom: '2px' }}>FROM (CONSIGNOR):</div>
                <div style={{ fontSize: '12px', fontWeight: 700, wordBreak: 'break-word', whiteSpace: 'normal', marginBottom: '2px' }}>{consignorName}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>{fromCity}</div>
              </div>
              <div style={{ borderLeft: '1.5px solid #eee', paddingLeft: '8px' }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#d32f2f', textTransform: 'uppercase', marginBottom: '2px' }}>TO (CONSIGNEE):</div>
                <div style={{ fontSize: '12px', fontWeight: 700, wordBreak: 'break-word', whiteSpace: 'normal', marginBottom: '2px' }}>{consigneeName}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>{toCity}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ border: '2.5px solid #0d1b3e', background: '#f1f4f9', borderRadius: '6px', padding: '8px' }}>
            <div style={{ marginBottom: '5px' }}>
              <label style={{ fontSize: '9px', fontWeight: 900, color: '#0d1b3e', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ccc', marginBottom: '2px' }}>Invoice No.</label>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#d32f2f', background: '#fff', border: '1.2px solid #000', borderRadius: '4px', padding: '3px 0', textAlign: 'center', wordBreak: 'break-word' }}>{bill.bill_no}</div>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label style={{ fontSize: '9px', fontWeight: 900, color: '#0d1b3e', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ccc', marginBottom: '2px' }}>Date</label>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 900 }}>{formatDate(bill.bill_date)}</div>
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 900, color: '#0d1b3e', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ccc', marginBottom: '2px' }}>Vehicle No.</label>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 900, wordBreak: 'break-word' }}>{bill.vehicle_no || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
        <div style={{ padding: '6px', background: '#f1f4f9', borderRadius: '6px', textAlign: 'center', borderBottom: '3px solid #0d1b3e' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 900, display: 'block' }}>Grand Total</span>
          <strong style={{ fontSize: '16px', color: '#0d1b3e' }}>₹ {grandTotal.toLocaleString('en-IN')}</strong>
        </div>
        <div style={{ padding: '6px', background: '#f1f4f9', borderRadius: '6px', textAlign: 'center', borderBottom: '3px solid #0d1b3e' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 900, display: 'block' }}>Advance Received</span>
          <strong style={{ fontSize: '16px', color: '#0d1b3e' }}>₹ {advanceReceived.toLocaleString('en-IN')}</strong>
        </div>
        <div style={{ padding: '6px', background: '#f1f4f9', borderRadius: '6px', textAlign: 'center', borderBottom: '3px solid #0d1b3e' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 900, display: 'block' }}>Balance Due</span>
          <strong style={{ fontSize: '16px', color: '#0d1b3e' }}>₹ {balanceDue.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={thStyle}>DATE</th>
            <th style={thStyle}>LR NO.</th>
            <th style={thStyle}>INV NO.</th>
            <th style={thStyle}>FROM</th>
            <th style={thStyle}>TO</th>
            <th style={thStyle}>WT(MT)</th>
            <th style={thStyle}>LOADING</th>
            <th style={thStyle}>UNLOADING</th>
            <th style={thStyle}>OTHER</th>
            <th style={thStyle}>FREIGHT</th>
            <th style={thStyle}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item, i) => (
            <tr key={i}>
              <td style={tdStyle}>{formatDate(bill.bill_date)}</td>
              <td style={tdStyle}>{item.lr_no || '-'}</td>
              <td style={tdStyle}>{item.invoice_no || '-'}</td>
              <td style={tdStyle}>{item.from_name || '-'}</td>
              <td style={tdStyle}>{item.to_name || '-'}</td>
              <td style={tdStyle}>{item.weight_mt || '0'}</td>
              <td style={tdStyle}>{item.loading || '0'}</td>
              <td style={tdStyle}>{item.unloading || '0'}</td>
              <td style={tdStyle}>{item.other_charges || '0'}</td>
              <td style={tdStyle}>{item.freight || '0'}</td>
              <td style={{ ...tdStyle, fontWeight: 900 }}>{item.total || '0'}</td>
            </tr>
          )) : (
            <tr>
              <td style={{ ...tdStyle, textAlign: 'center' }} colSpan="11">No items</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: '#f1f4f9', border: '2px solid #0d1b3e', padding: '8px', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 4px', color: '#0d1b3e', fontSize: '12px', borderBottom: '1.5px solid #ccc', textTransform: 'uppercase' }}>BANK ACCOUNT DETAILS</h4>
            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
              Beneficiary: <b>BHARAT TRANSPORT COMPANY</b><br />
              Bank: <b>HDFC BANK</b> | A/c: <b>50200112184634</b><br />
              IFSC: <b>HDFC0002795</b> | Branch: <b>RAJGARH</b>
            </div>
          </div>
          <div style={{ background: '#f1f4f9', border: '2px solid #0d1b3e', padding: '8px', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 4px', color: '#0d1b3e', fontSize: '12px', borderBottom: '1.5px solid #ccc', textTransform: 'uppercase' }}>ADVANCE PAYMENT DETAILS</h4>
            <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
              <div><b>BY CASH:</b> Amt/Date ___________________</div>
              <div><b>BY CHEQUE:</b> Chq No/Bank _______________</div>
              <div><b>UPI / ONLINE:</b> Txn ID/App ______________</div>
            </div>
          </div>
        </div>

        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 700 }}>Trip Sub-Total:</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 700 }}>{tripSubtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 700 }}>GST ({gstPercent}%):</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 700 }}>{gstAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ background: '#0d1b3e', color: '#fff' }}>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900 }}>Grand Total:</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900 }}>{grandTotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: '#d32f2f', fontWeight: 900, borderBottom: '1px solid #eee' }}>Advance Rcvd:</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: '#d32f2f', fontWeight: 900, borderBottom: '1px solid #eee' }}>-{advanceReceived.toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ background: '#e8f5e9' }}>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#2e7d32' }}>NET BALANCE:</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#2e7d32' }}>{netBalance.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '8px', textAlign: 'right', borderTop: '1px dashed #ccc', paddingTop: '5px' }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#d32f2f' }}>Amount in Words:</span>
            <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px', wordBreak: 'break-word' }}>
              {bill.amount_in_words || numberToWords(netBalance)}
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px', display: 'inline-block', minWidth: '200px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900 }}>Authorized Signatory</div>
              <div style={{ fontSize: '9px' }}>FOR BHARAT TRANSPORT COMPANY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const thStyle = { background: '#0d1b3e', color: '#fff', padding: '6px 2px', fontSize: '9px', textTransform: 'uppercase', border: '1px solid #fff', fontWeight: 700 }
const tdStyle = { border: '1px solid #ccc', padding: '4px 2px', fontSize: '10px', textAlign: 'center', wordBreak: 'break-word' }

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${day}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`
}

function numberToWords(num) {
  if (!num || num === 0) return 'ZERO RUPEES ONLY'
  const ones = ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN']
  const tens = ['','','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY']
  function convert(n) {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '')
    if (n < 1000) return ones[Math.floor(n/100)] + ' HUNDRED' + (n%100 ? ' ' + convert(n%100) : '')
    if (n < 100000) return convert(Math.floor(n/1000)) + ' THOUSAND' + (n%1000 ? ' ' + convert(n%1000) : '')
    if (n < 10000000) return convert(Math.floor(n/100000)) + ' LAKH' + (n%100000 ? ' ' + convert(n%100000) : '')
    return convert(Math.floor(n/10000000)) + ' CRORE' + (n%10000000 ? ' ' + convert(n%10000000) : '')
  }
  return convert(Math.floor(num)) + ' RUPEES ONLY'
}
