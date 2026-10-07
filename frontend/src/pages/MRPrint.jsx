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
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .mr-container { width: 180mm !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
        }
        .mr-container {
          width: 180mm;
          min-height: 250mm;
          margin: 10px auto;
          padding: 10mm;
          font-family: Arial, sans-serif;
          font-size: 11px;
          background: white;
          border: 2px solid #000;
        }
        .mr-header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .mr-company-name { color: #000; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px; }
        .mr-company-address { font-size: 11px; margin: 5px 0; }
        .mr-title-box { border: 2px solid #000; padding: 10px; margin: 20px 0; text-align: center; background: #f0f0f0; }
        .mr-title { font-size: 20px; font-weight: bold; letter-spacing: 3px; }
        .mr-no-display { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .mr-date-display { font-size: 12px; }
        .mr-received-from { font-size: 12px; margin: 20px 0; padding: 10px; border: 1px solid #000; }
        .mr-details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .mr-details-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
        .mr-label { font-weight: bold; font-size: 11px; }
        .mr-value { font-size: 12px; }
        .mr-amount-box { border: 2px solid #000; padding: 15px; margin: 20px 0; text-align: center; background: #f9f9f9; }
        .mr-amount-label { font-size: 12px; font-weight: bold; }
        .mr-amount-value { font-size: 28px; font-weight: bold; margin: 10px 0; }
        .mr-amount-words { font-size: 11px; font-style: italic; }
        .mr-advance-badge { background: #ffff00; border: 2px solid #000; padding: 5px 15px; font-weight: bold; display: inline-block; margin: 10px 0; }
        .mr-footer { margin-top: 50px; display: flex; justify-content: space-between; }
        .mr-sign-box { text-align: center; }
        .mr-sign-line { border-top: 1px solid #000; width: 180px; margin-top: 60px; padding-top: 5px; font-size: 11px; }
        .mr-note { font-size: 10px; margin-top: 30px; padding: 10px; border: 1px solid #000; }
      `}</style>

      <div className="no-print" style={{ padding: '15px', textAlign: 'center', background: '#f0f0f0', position: 'sticky', top: 0, zIndex: 1000 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px', background: '#000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          🖨️ Print MR
        </button>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', fontSize: '16px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div className="mr-container" ref={printRef}>
        <div className="mr-header">
          <h1 className="mr-company-name">BHARAT TRANSPORT COMPANY</h1>
          <div className="mr-company-address">Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023</div>
          <div className="mr-company-address">Email: bharattrsnportcompany@gmail.com | PAN: CMRPP0955N | GST: 08CMRPP0955N1Z5</div>
        </div>

        <div className="mr-title-box">
          <div className="mr-title">MONEY RECEIPT</div>
          <div className="mr-no-display">{mr.mr_no || 'MR/26/0001'}</div>
          <div className="mr-date-display">
            <b>Date:</b> {mr.mr_date ? new Date(mr.mr_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
          </div>
          {mr.is_advance === 1 && <div className="mr-advance-badge">⚠️ ADVANCE PAYMENT RECEIPT</div>}
        </div>

        <div className="mr-received-from">
          <div style={{ fontSize: '13px', marginBottom: '10px' }}>
            Received with thanks from M/s. <b style={{ fontSize: '16px' }}>{mr.party_name || '___________________'}</b>
          </div>
          <div style={{ fontSize: '11px' }}>
            Party Type: <b>{mr.party_type || 'Consignor'}</b>
          </div>
        </div>

        <table className="mr-details-table">
          <tr>
            <td style={{ width: '40%' }}><span className="mr-label">Payment Mode:</span></td>
            <td><span className="mr-value">{mr.payment_mode || 'Cash'}</span></td>
          </tr>
          {mr.bilty_lr_no && (
            <tr>
              <td><span className="mr-label">Linked Bilty (LR No):</span></td>
              <td><span className="mr-value" style={{ fontWeight: 'bold' }}>{mr.bilty_lr_no}</span></td>
            </tr>
          )}
          {mr.bill_no && (
            <tr>
              <td><span className="mr-label">Linked Bill No:</span></td>
              <td><span className="mr-value" style={{ fontWeight: 'bold' }}>{mr.bill_no}</span></td>
            </tr>
          )}
          <tr>
            <td><span className="mr-label">Remarks:</span></td>
            <td><span className="mr-value">{mr.remarks || '-'}</span></td>
          </tr>
        </table>

        <div className="mr-amount-box">
          <div className="mr-amount-label">AMOUNT RECEIVED (IN RUPEES)</div>
          <div className="mr-amount-value">₹ {parseFloat(mr.amount || 0).toLocaleString('en-IN')}</div>
          <div className="mr-amount-words">
            ({numberToWords(mr.amount)})
          </div>
        </div>

        <div className="mr-note">
          <b>Note:</b> This is a computer generated Money Receipt. Payment received towards transport charges / advance payment for the above mentioned Bilty/Bill. This receipt is valid only with company seal and authorized signature.
        </div>

        <div className="mr-footer">
          <div className="mr-sign-box">
            <div className="mr-sign-line">Party Signature</div>
          </div>
          <div className="mr-sign-box">
            <div style={{ fontWeight: 'bold', marginBottom: '60px' }}>For BHARAT TRANSPORT COMPANY</div>
            <div className="mr-sign-line">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </>
  )
}
