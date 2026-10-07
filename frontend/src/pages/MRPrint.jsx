import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function MRPrint() {
  const location = useLocation()
  const navigate = useNavigate()
  const printRef = useRef()
  const mr = location.state?.mr || {}

  useEffect(() => {
    const timer = setTimeout(() => { window.print() }, 500)
    return () => clearTimeout(timer)
  }, [])

  const numberToWords = (num) => {
    const n = Math.floor(parseFloat(num || 0))
    if (n === 0) return 'Zero'
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const convert = (n) => {
      if (n < 20) return ones[n]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '')
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
    }
    return convert(n) + ' Only'
  }

  return (
    <>
      <style>{`
        @page { size: A5 portrait; margin: 10mm; }
        @media print {
          body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .mr-container { width: 148mm !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
        }
        .mr-container {
          width: 148mm;
          min-height: 210mm;
          margin: 10px auto;
          padding: 8mm;
          font-family: Arial, sans-serif;
          font-size: 11px;
          background: white;
          border: 2px solid #cc0000;
        }
        .mr-header { text-align: center; border-bottom: 3px double #cc0000; padding-bottom: 10px; margin-bottom: 15px; }
        .mr-title { color: #cc0000; font-size: 22px; font-weight: bold; margin: 0; }
        .mr-subtitle { font-size: 10px; color: #666; margin: 3px 0; }
        .mr-no-box { border: 2px solid #cc0000; padding: 8px; margin: 10px 0; background: #fff5f5; text-align: center; }
        .mr-no-label { color: #cc0000; font-weight: bold; font-size: 10px; }
        .mr-no-value { font-size: 18px; font-weight: bold; color: #cc0000; }
        .mr-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .mr-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
        .mr-label { font-weight: bold; font-size: 10px; color: #333; }
        .mr-value { font-size: 12px; }
        .mr-amount-box { background: #fff5f5; border: 2px solid #cc0000; padding: 10px; margin: 15px 0; text-align: center; }
        .mr-amount-label { font-size: 11px; color: #666; }
        .mr-amount-value { font-size: 24px; font-weight: bold; color: #cc0000; }
        .mr-advance-badge { background: #fef3c7; border: 2px solid #f59e0b; color: #92400e; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 5px 0; }
        .mr-footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .mr-sign-box { text-align: center; }
        .mr-sign-line { border-top: 1px solid #000; width: 150px; margin-top: 50px; padding-top: 5px; font-size: 10px; }
      `}</style>

      <div className="no-print" style={{ padding: '15px', textAlign: 'center', background: '#f0f0f0', position: 'sticky', top: 0, zIndex: 1000 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px', background: '#cc0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          🖨️ Print MR
        </button>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', fontSize: '16px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div className="mr-container" ref={printRef}>
        <div className="mr-header">
          <h1 className="mr-title">BHARAT TRANSPORT COMPANY</h1>
          <div className="mr-subtitle">Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023</div>
          <div className="mr-subtitle">Email: bharattrsnportcompany@gmail.com | PAN: CMRPP0955N | GST: 08CMRPP0955N1Z5</div>
        </div>

        <div className="mr-no-box">
          <div className="mr-no-label">MONEY RECEIPT NO.</div>
          <div className="mr-no-value">{mr.mr_no || 'MR/26/0001'}</div>
          <div style={{ marginTop: '5px', fontSize: '11px' }}>
            <b>Date:</b> {mr.mr_date ? new Date(mr.mr_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
          </div>
          {mr.is_advance === 1 && <div className="mr-advance-badge">⚠️ ADVANCE PAYMENT</div>}
        </div>

        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          Received with thanks from <b style={{ fontSize: '14px' }}>{mr.party_name || '___________________'}</b>
          <br/>(Party Type: {mr.party_type || 'Consignor'})
        </div>

        <table className="mr-table">
          <tr>
            <td style={{ width: '40%' }}><span className="mr-label">Payment Mode:</span></td>
            <td><span className="mr-value">{mr.payment_mode || 'Cash'}</span></td>
          </tr>
          {mr.bilty_lr_no && (
            <tr>
              <td><span className="mr-label">Linked Bilty (LR No):</span></td>
              <td><span className="mr-value" style={{ color: '#cc0000', fontWeight: 'bold' }}>{mr.bilty_lr_no}</span></td>
            </tr>
          )}
          {mr.bill_no && (
            <tr>
              <td><span className="mr-label">Linked Bill No:</span></td>
              <td><span className="mr-value" style={{ color: '#6b21a8', fontWeight: 'bold' }}>{mr.bill_no}</span></td>
            </tr>
          )}
          <tr>
            <td><span className="mr-label">Remarks:</span></td>
            <td><span className="mr-value">{mr.remarks || '-'}</span></td>
          </tr>
        </table>

        <div className="mr-amount-box">
          <div className="mr-amount-label">Amount Received (Rupees)</div>
          <div className="mr-amount-value">₹ {parseFloat(mr.amount || 0).toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '11px', marginTop: '5px', fontStyle: 'italic' }}>
            ({numberToWords(mr.amount)})
          </div>
        </div>

        <div style={{ fontSize: '11px', marginTop: '20px', padding: '10px', background: '#f9f9f9', borderLeft: '4px solid #cc0000' }}>
          <b>Note:</b> This is a computer generated Money Receipt. Payment received towards transport charges / advance payment for the above mentioned Bilty/Bill.
        </div>

        <div className="mr-footer">
          <div className="mr-sign-box">
            <div className="mr-sign-line">Party Signature</div>
          </div>
          <div className="mr-sign-box">
            <div style={{ color: '#cc0000', fontWeight: 'bold', marginBottom: '50px' }}>For Bharat Transport Company</div>
            <div className="mr-sign-line">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </>
  )
}
