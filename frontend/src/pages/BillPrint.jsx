import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function BillPrint() {
  const { billNo } = useParams()
  const navigate = useNavigate()
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    loadBill()
  }, [billNo])

  const loadBill = async () => {
    try {
      const res = await api.get(`/api/bills/${billNo}`)
      setBill(res.data)
    } catch (err) {
      toast.error('Bill not found')
      navigate('/bills')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePDF = async () => {
    toast.loading('Generating PDF...')
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${bill.bill_no}.pdf`)
      toast.dismiss()
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.dismiss()
      toast.error('PDF failed')
    }
  }

  const handleWhatsApp = () => {
    const phone = prompt('Customer ka WhatsApp number daalein (with country code):', '91')
    if (!phone) return
    const message = `Dear ${bill.party_name},\n\nAapka bill ready hai.\nBill No: ${bill.bill_no}\nAmount: ₹${Number(bill.net_balance).toLocaleString('en-IN')}\n\n- Bharat Transport Company`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!bill) return null

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Toolbar */}
      <div className="no-print bg-white shadow sticky top-0 z-10 p-4 flex flex-wrap gap-3 justify-between items-center">
        <button onClick={() => navigate('/bills')} className="px-4 py-2 bg-gray-200 rounded-lg">← Back</button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">🖨️ Print</button>
          <button onClick={handlePDF} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium">📄 PDF</button>
          <button onClick={handleWhatsApp} className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium">📱 WhatsApp</button>
        </div>
      </div>

      {/* Print Area */}
      <div className="p-4 flex justify-center">
        <div ref={printRef} className="bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '8mm' }}>
          
          {/* ============ ORIGINAL COPY (RECIPIENT) ============ */}
          <BillCopy bill={bill} copyType="ORIGINAL COPY (RECIPIENT)" />
          
          {/* Cut Line */}
          <div style={{ borderTop: '2px dashed #999', margin: '5mm 0', textAlign: 'center' }}>
            <span style={{ background: 'white', padding: '0 10px', fontSize: '10px', color: '#666' }}>✂ - - - - - - - - - - - - - - - - - - - - - - - - -</span>
          </div>

          {/* ============ DUPLICATE COPY (OFFICE) ============ */}
          <BillCopy bill={bill} copyType="DUPLICATE COPY (OFFICE)" />
        </div>
      </div>
    </div>
  )
  
// ============================================
// BILL COPY COMPONENT (Exact aapka format)
// ============================================
function BillCopy({ bill, copyType }) {
  const items = bill.items || []

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#000' }}>
      
      {/* Copy Type Header */}
      <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 'bold', color: '#c00', marginBottom: '2mm' }}>
        {copyType}
      </div>

      {/* Company Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'right' }}>
          GSTIN: 08CMRPP0955N1Z5 | PAN: CMRPP0955N
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#c00', letterSpacing: '1px', margin: '2mm 0' }}>
          BHARAT TRANSPORT COMPANY
        </h1>
        <p style={{ fontSize: '10px', margin: '1mm 0' }}>
          Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan - 331023
        </p>
        <p style={{ fontSize: '10px', margin: '1mm 0' }}>
          Mobile: +91 9680264231 &nbsp;|&nbsp; Email: bharattransportcompany@gmail.com
        </p>
      </div>

      {/* Bill To + Invoice No */}
      <div style={{ display: 'flex', gap: '3mm', marginBottom: '2mm' }}>
        <div style={{ flex: 2, border: '1px solid #000' }}>
          <div style={{ background: '#1a237e', color: 'white', padding: '1mm 2mm', fontSize: '10px', fontWeight: 'bold' }}>
            BILL TO (PARTY DETAILS)
          </div>
          <div style={{ padding: '2mm' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '1mm' }}>{bill.party_name || '-'}</div>
            <div style={{ fontSize: '10px' }}>GST: {bill.party_gst || '-'}</div>
            {bill.party_address && <div style={{ fontSize: '9px', marginTop: '1mm' }}>{bill.party_address}</div>}
          </div>
        </div>

        <div style={{ flex: 1, border: '1px solid #000' }}>
          <div style={{ background: '#1a237e', color: 'white', padding: '1mm 2mm', fontSize: '10px', fontWeight: 'bold' }}>
            INVOICE NO.
          </div>
          <div style={{ padding: '2mm', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#c00', marginBottom: '2mm' }}>{bill.bill_no}</div>
            <div style={{ fontSize: '9px' }}><b>DATE:</b> {formatDate(bill.bill_date)}</div>
            {bill.vehicle_no && <div style={{ fontSize: '9px', marginTop: '1mm' }}><b>VEHICLE NO.:</b> {bill.vehicle_no}</div>}
          </div>
        </div>
      </div>

      {/* Shipment (Consignor / Consignee) */}
      <div style={{ border: '1px solid #000', marginBottom: '2mm' }}>
        <div style={{ background: '#1a237e', color: 'white', padding: '1mm 2mm', fontSize: '10px', fontWeight: 'bold' }}>
          SHIPMENT (CONSIGNOR/CONSIGNEE)
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, padding: '2mm', borderRight: '1px solid #000' }}>
            <div style={{ fontSize: '9px', color: '#c00', fontWeight: 'bold' }}>FROM (CONSIGNOR)</div>
            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{bill.consignor_name || bill.from_name || '-'}</div>
          </div>
          <div style={{ flex: 1, padding: '2mm' }}>
            <div style={{ fontSize: '9px', color: '#c00', fontWeight: 'bold' }}>TO (CONSIGNEE)</div>
            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{bill.consignee_name || bill.to_name || '-'}</div>
          </div>
        </div>
      </div>

      {/* Totals Bar */}
      <div style={{ display: 'flex', gap: '2mm', marginBottom: '2mm' }}>
        <div style={{ flex: 1, border: '1px solid #000', textAlign: 'center', padding: '2mm' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>GRAND TOTAL</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>₹ {Number(bill.grand_total || 0).toLocaleString('en-IN')}</div>
        </div>
        <div style={{ flex: 1, border: '1px solid #000', textAlign: 'center', padding: '2mm' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>ADVANCE RECEIVED</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{Number(bill.advance_received || 0).toLocaleString('en-IN')}</div>
        </div>
        <div style={{ flex: 1, border: '1px solid #000', textAlign: 'center', padding: '2mm' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>BALANCE DUE</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>₹ {Number(bill.balance_due || bill.net_balance || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm', fontSize: '9px' }}>
        <thead>
          <tr style={{ background: '#1a237e', color: 'white' }}>
            <th style={thStyle}>DATE</th>
            <th style={thStyle}>LR NO.</th>
            <th style={thStyle}>INV NO.</th>
            <th style={thStyle}>FROM</th>
            <th style={thStyle}>TO</th>
            <th style={thStyle}>WT(MT)</th>
            <th style={thStyle}>LOADING</th>
            <th style={thStyle}>UNLOADING</th>
            <th style={thStyle}>OTHER</th>
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
              <td style={{ ...tdStyle, textAlign: 'right' }}>{item.weight_mt || 0}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{item.loading || 0}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{item.unloading || 0}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{item.other_charges || 0}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{Number(item.total || 0).toLocaleString('en-IN')}</td>
            </tr>
          )) : (
            <tr>
              <td style={{ ...tdStyle, textAlign: 'center' }} colSpan="10">No items</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bottom Section */}
      <div style={{ display: 'flex', gap: '3mm' }}>
        {/* Left: Bank + Advance */}
        <div style={{ flex: 1 }}>
          <div style={{ border: '1px solid #000', marginBottom: '2mm' }}>
            <div style={{ padding: '2mm' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '1mm', borderBottom: '1px solid #ccc', paddingBottom: '1mm' }}>
                BANK ACCOUNT DETAILS
              </div>
              <div style={{ fontSize: '9px', lineHeight: '1.5' }}>
                <div><b>Beneficiary:</b> BHARAT TRANSPORT COMPANY</div>
                <div><b>Bank:</b> HDFC BANK | A/c: 50200112184634</div>
                <div><b>IFSC:</b> HDFC0002795 | Branch: RAJGARH</div>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #000' }}>
            <div style={{ padding: '2mm' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '1mm', borderBottom: '1px solid #ccc', paddingBottom: '1mm' }}>
                ADVANCE PAYMENT DETAILS
              </div>
              <div style={{ fontSize: '9px', lineHeight: '1.8' }}>
                <div><b>BY CASH:</b> Amt/Date ___________________</div>
                <div><b>BY CHEQUE:</b> Chq No/Bank _______________</div>
                <div><b>UPI / ONLINE:</b> Txn ID/App ______________</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '1.5mm', borderBottom: '1px solid #ccc' }}>Trip Sub-Total:</td>
                <td style={{ padding: '1.5mm', textAlign: 'right', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>
                  {Number(bill.trip_subtotal || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '1.5mm', borderBottom: '1px solid #ccc' }}>GST ({bill.gst_percent || 0}%):</td>
                <td style={{ padding: '1.5mm', textAlign: 'right', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>
                  {Number(bill.gst_amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ background: '#1a237e', color: 'white' }}>
                <td style={{ padding: '1.5mm', fontWeight: 'bold' }}>Grand Total:</td>
                <td style={{ padding: '1.5mm', textAlign: 'right', fontWeight: 'bold' }}>
                  {Number(bill.grand_total || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '1.5mm', color: '#c00', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>Advance Rcvd:</td>
                <td style={{ padding: '1.5mm', textAlign: 'right', color: '#c00', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                  -{Number(bill.advance_received || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ background: '#e8f5e9' }}>
                <td style={{ padding: '1.5mm', fontWeight: 'bold' }}>NET BALANCE:</td>
                <td style={{ padding: '1.5mm', textAlign: 'right', fontWeight: 'bold' }}>
                  {Number(bill.net_balance || bill.balance_due || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'right', fontSize: '8px', color: '#c00', marginTop: '1mm' }}>
            Amount in Words:
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '1mm' }}>
            {bill.amount_in_words || numberToWords(bill.net_balance || 0)}
          </div>

          {/* Signature */}
          <div style={{ marginTop: '15mm', textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '1mm', display: 'inline-block', minWidth: '60mm' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Authorized Signatory</div>
              <div style={{ fontSize: '8px' }}>FOR BHARAT TRANSPORT COMPANY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '1.5mm',
  border: '1px solid #000',
  fontSize: '9px',
  fontWeight: 'bold'
}

const tdStyle = {
  padding: '1.5mm',
  border: '1px solid #000',
  fontSize: '9px'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = d.getDate()
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
}
