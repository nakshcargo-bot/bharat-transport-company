import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BiltyPrint() {
  const location = useLocation()
  const navigate = useNavigate()
  const printRef = useRef()
  const bilty = location.state?.bilty || {}

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 500)
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

  const freight = Math.round(parseFloat(bilty.freight || bilty.grand_total || 0))
  const aoc = parseFloat(bilty.aoc_percent || 0)
  const aocAmount = Math.round((freight * aoc) / 100)
  const eov = Math.round(parseFloat(bilty.eov_charges || 0))
  const cover = Math.round(parseFloat(bilty.cover_charges || 0))
  const materialMgmt = Math.round(parseFloat(bilty.material_mgmt_ch || 0))
  const collection = Math.round(parseFloat(bilty.collection_charges || 0))
  const doorDly = Math.round(parseFloat(bilty.door_dly_charges || 0))
  const passAttach = Math.round(parseFloat(bilty.pass_attach_ch || 0))
  const enroute = Math.round(parseFloat(bilty.enroute_charges || 0))
  const statistical = Math.round(parseFloat(bilty.statistical_charges || 0))
  const misc = Math.round(parseFloat(bilty.misc_charges || 0))
  const grandTotal = freight + aocAmount + eov + cover + materialMgmt + collection + doorDly + passAttach + enroute + statistical + misc

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .bilty-container { width: 194mm !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
        }
        .bilty-container {
          width: 194mm;
          margin: 10px auto;
          font-family: Arial, sans-serif;
          font-size: 9px;
          background: white;
          line-height: 1.3;
        }
        .main-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
        }
        .main-table td, .main-table th {
          border: 1px solid #000;
          padding: 3px 4px;
          vertical-align: top;
        }
        .header-company {
          color: #cc0000;
          font-size: 26px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 1px;
          margin: 0;
        }
        .header-office {
          font-size: 10px;
          text-align: center;
          margin: 2px 0;
        }
        .header-pan-gst {
          font-size: 10px;
          text-align: right;
          font-weight: bold;
          margin-top: 5px;
        }
        .red-bold { color: #cc0000; font-weight: bold; }
        .section-title {
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          text-transform: uppercase;
        }
        .label { font-size: 9px; font-weight: bold; }
        .notice-text {
          font-size: 7.5px;
          color: #cc0000;
          line-height: 1.4;
          text-align: justify;
        }
        .logo-box {
          width: 80px;
          height: 80px;
          border: 2px solid #cc0000;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 5px auto;
          position: relative;
        }
        .logo-box svg {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 70px;
          height: 70px;
        }
        .logo-text {
          color: #cc0000;
          font-weight: bold;
          font-size: 20px;
          z-index: 1;
        }
        .grand-total-row {
          background: #f0f0f0;
          font-weight: bold;
        }
        .payment-note {
          color: #cc0000;
          font-size: 9px;
          font-style: italic;
        }
        .editable {
          min-height: 14px;
        }
        .charges-table {
          width: 100%;
          border-collapse: collapse;
        }
        .charges-table td {
          border: 1px solid #000;
          padding: 2px 4px;
          font-size: 9px;
        }
        .amount-cell {
          text-align: right;
          padding-right: 5px;
          min-width: 50px;
        }
      `}</style>

      <div className="no-print" style={{ padding: '15px', textAlign: 'center', background: '#f0f0f0', position: 'sticky', top: 0, zIndex: 1000 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px', background: '#cc0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          🖨️ Print Bilty
        </button>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', fontSize: '16px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div className="bilty-container" ref={printRef}>
        <table className="main-table">
          {/* Row 1: Logo + Company Header */}
          <tr>
            <td rowSpan={2} style={{ width: '13%', textAlign: 'center', verticalAlign: 'middle', padding: '5px' }}>
              <div className="logo-box">
                <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5 L55 15 L60 12 L62 20 L70 18 L68 28 L78 30 L72 38 L82 42 L75 50 L85 55 L78 62 L88 68 L80 75 L88 82 L78 88 L85 95 L75 100 L80 108 L70 110 L72 118 L60 115 L58 120 L50 118 L42 120 L40 115 L28 118 L30 110 L20 108 L25 100 L15 95 L22 88 L12 82 L20 75 L12 68 L22 62 L15 55 L25 50 L18 42 L28 38 L22 30 L32 28 L30 18 L38 20 L40 12 L45 15 Z" fill="none" stroke="#cc0000" strokeWidth="2"/>
                </svg>
                <span className="logo-text">BTC</span>
              </div>
            </td>
            <td colSpan={6} style={{ textAlign: 'center', padding: '8px 5px' }}>
              <h1 className="header-company">BHARAT TRANSPORT COMPANY</h1>
              <div className="header-office">
                Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023
              </div>
              <div className="header-office">
                Email: bharattrsnportcompany@gmail.com
              </div>
              <div className="header-pan-gst">
                PAN No.: <b>CMRPP0955N</b> &nbsp;&nbsp; GST No.: <b>08CMRPP0955N1Z5</b>
              </div>
            </td>
          </tr>

          {/* Row 2: Schedule + Consignor Copy + Caution */}
          <tr>
            <td rowSpan={2} style={{ fontSize: '8px', padding: '4px', verticalAlign: 'top' }}>
              <div className="section-title" style={{ marginBottom: '4px' }}>SCHEDULE OF DELAY COLLECTION CHARGE</div>
              <div style={{ fontSize: '8px' }}>
                Delay collection charge after......... days from today@6/- per day Quintal on charged weight.
              </div>
            </td>
            <td colSpan={3} style={{ textAlign: 'center', padding: '6px' }}>
              <div className="red-bold" style={{ fontSize: '14px' }}>CONSIGNOR COPY</div>
            </td>
            <td colSpan={3} rowSpan={2} style={{ fontSize: '8px', padding: '4px', verticalAlign: 'top' }}>
              <div><b>CAUTION:</b> This consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission will be delivered at the destination</div>
              <div style={{ marginTop: '10px' }}>
                <div className="label">Address of Issuing office</div>
                <div className="editable" style={{ borderBottom: '1px dotted #000', minHeight: '20px', marginTop: '2px' }}>{bilty.issuing_office || ''}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ textAlign: 'center', padding: '4px' }}>
              <div className="section-title">OWNER RISK</div>
            </td>
          </tr>

          {/* Row 3: Notice + Insurance + Consignment Note No */}
          <tr>
            <td rowSpan={2} style={{ padding: '4px', verticalAlign: 'top' }}>
              <div className="red-bold" style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px' }}>NOTICE</div>
              <div className="notice-text">
                The Consignment covered by this Lorry receipt shall be stored at the destination under the control of the Transport Operator and shall be delivered to or to the order of the Consignee Bank whose name's mentioned in the Lorry receipt. It will be under no circumstances be delivered to anyone without the written authority from the Consignee Bank or its order, endorsed on the Consignee Copy or on a separate letter of Authority.
              </div>
            </td>
            <td rowSpan={2} colSpan={3} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="section-title" style={{ marginBottom: '4px' }}>INSURANCE</div>
              <div style={{ marginBottom: '6px', fontSize: '9px' }}>
                The consignor has stated that he has insured/not insured the consignment.
              </div>
              <div style={{ fontSize: '9px' }}>
                <div><b>Company:</b> <span className="editable">{bilty.insurance_company || ''}</span></div>
                <div><b>Policy No.:</b> <span className="editable">{bilty.policy_no || ''}</span></div>
                <div><b>Date:</b> <span className="editable">{bilty.insurance_date || ''}</span></div>
                <div><b>Amount:</b> <span className="editable">{bilty.insurance_amount || ''}</span></div>
              </div>
            </td>
            <td colSpan={3} style={{ textAlign: 'center', padding: '8px', verticalAlign: 'top' }}>
              <div className="red-bold" style={{ fontSize: '15px', marginBottom: '10px' }}>CONSIGNMENT NOTE NO.</div>
              <div className="editable" style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', minHeight: '30px', marginBottom: '5px', borderBottom: '1px dotted #000' }}>
                {bilty.lr_no || 'BTC/26/0008'}
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '4px' }}>
              <div className="label">Date</div>
              <div className="editable" style={{ minHeight: '20px', fontWeight: 'bold', marginTop: '2px', borderBottom: '1px dotted #000' }}>
                {bilty.lr_date ? new Date(bilty.lr_date).toLocaleDateString('en-IN') : '24/9/2026'}
              </div>
            </td>
          </tr>

          {/* Row 4: Consignor + From/To */}
          <tr>
            <td colSpan={4} style={{ padding: '4px', verticalAlign: 'top' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="label">Consignor's Full Name & Address:</div>
                <div className="label">Customer Code:</div>
              </div>
              <div className="editable" style={{ minHeight: '30px', marginTop: '2px' }}>{bilty.consignor_name || 'Electromech Infraprojects Pvt Ltd'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px' }}>
                <div><b>Invoice No.</b> <span className="editable">{bilty.invoice_no || '25'}</span></div>
                <div><b>Date</b> <span className="editable">{bilty.invoice_date || '2026-09-24T00:00:00.000Z'}</span></div>
                <div><b>GST No.</b> <span className="editable">{bilty.consignor_gst || '27AABCE1234A1Z5'}</span></div>
              </div>
            </td>
            <td colSpan={1} rowSpan={2} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="label">From Code & Name:</div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.from_name || 'Delhi'}</div>
              <div className="label" style={{ marginTop: '10px' }}>To Code & Name:</div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.to_name || 'Jaipur'}</div>
            </td>
            <td colSpan={2} rowSpan={2} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div><b>Delivery Type:</b> <b>{bilty.delivery_type || 'DOOR DELIVERY'}</b></div>
              <div><b>Unloading Party Mob. No:</b> <span className="editable">{bilty.unloading_mob || ''}</span></div>
              <div><b>Delivery Godown Address</b></div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.delivery_address || ''}</div>
            </td>
          </tr>

          {/* Row 5: Consignee + Lorry Details */}
          <tr>
            <td colSpan={4} style={{ padding: '4px', verticalAlign: 'top' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="label">Consignee/Bank's Full Name & Address:</div>
                <div className="label">Customer Code:</div>
              </div>
              <div className="editable" style={{ minHeight: '30px', marginTop: '2px' }}>{bilty.consignee_name || 'Vedant Sales Corporation'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px' }}>
                <div><b>Purchase Order No.</b> <span className="editable">{bilty.po_no || ''}</span></div>
                <div><b>Date</b> <span className="editable">{bilty.po_date || ''}</span></div>
                <div><b>GST No.</b> <span className="editable">{bilty.consignee_gst || ''}</span></div>
              </div>
            </td>
            <td colSpan={3} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div><b>Lorry No.</b> <span className="editable">{bilty.lorry_no || ''}</span></div>
              <div><b>Phone No.</b> <span className="editable">{bilty.driver_phone || ''}</span></div>
              <div><b>Unloading by Consignee/Pickup Address</b></div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.pickup_address || ''}</div>
            </td>
          </tr>

          {/* Row 6: Main Table Headers */}
          <tr style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>
            <th>No. of Packages</th>
            <th>Method of Packing</th>
            <th>HSN Code</th>
            <th>Actual Wt. in Kgs.</th>
            <th>Charged Wt. in Kgs.</th>
            <th>Rate<br/>Fixed</th>
            <th rowSpan={2} style={{ width: '18%' }}>CHARGES</th>
            <th colSpan={2}>Amount</th>
          </tr>
          <tr style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>
            <th colSpan={6}></th>
            <th>Rs.</th>
            <th>Ps.</th>
          </tr>

          {/* Row 7-17: Main Data + Charges */}
          <tr>
            <td colSpan={3} rowSpan={2} style={{ padding: '3px', verticalAlign: 'top', fontSize: '9px' }}>
              <div className="label" style={{ textAlign: 'center', marginBottom: '3px' }}>Description (Said to contain)</div>
              <div className="editable" style={{ minHeight: '25px', borderBottom: '1px solid #000' }}>{bilty.material_desc || bilty.description || '93'}</div>
            </td>
            <td rowSpan={11} style={{ padding: '3px', textAlign: 'center', fontSize: '10px' }}>
              {bilty.packages || bilty.no_of_packages || ''}
            </td>
            <td rowSpan={11} style={{ padding: '3px', textAlign: 'center' }}>
              {bilty.method_of_packing || ''}
            </td>
            <td rowSpan={11} style={{ padding: '3px', textAlign: 'center' }}>
              {bilty.hsn_code || ''}
            </td>
            <td rowSpan={11} style={{ padding: '3px', textAlign: 'center' }}>
              {bilty.weight || bilty.actual_weight || ''}
            </td>
            <td rowSpan={11} style={{ padding: '3px', textAlign: 'center' }}>
              {bilty.charged_weight || ''}
            </td>
            <td rowSpan={11} style={{ padding: '3px', textAlign: 'center' }}>
              {bilty.rate || ''}
            </td>
            <td style={{ padding: '3px', fontSize: '9px' }}>FREIGHT</td>
            <td className="amount-cell">{freight}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td colSpan={3} style={{ padding: '3px', verticalAlign: 'top', fontSize: '9px' }}>
              <div className="label" style={{ textAlign: 'center', marginBottom: '3px' }}>Dimension Of Consignment (if Bulky/ODC)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '2px' }}>Length</th>
                  <th style={{ border: '1px solid #000', padding: '2px' }}>Width</th>
                  <th style={{ border: '1px solid #000', padding: '2px' }}>Height</th>
                  <th style={{ border: '1px solid #000', padding: '2px' }}>No. Of Pkgs.</th>
                  <th style={{ border: '1px solid #000', padding: '2px' }}>Total CFT/CMT</th>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{bilty.length || '0.00'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{bilty.width || '0.00'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{bilty.height || '0.00'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{bilty.dimension_pkgs || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{bilty.total_cft || ''}</td>
                </tr>
              </table>
            </td>
            <td style={{ padding: '3px', fontSize: '9px' }}>A.O.C. %</td>
            <td className="amount-cell">{aocAmount}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td colSpan={3} rowSpan={2} style={{ padding: '3px', verticalAlign: 'top', fontSize: '9px' }}>
              <div className="label" style={{ marginBottom: '3px' }}>Private Marks</div>
              <div className="editable" style={{ minHeight: '35px', borderBottom: '1px solid #000' }}>{bilty.private_marks || ''}</div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div><span className="label">Distance</span> <span className="editable">{bilty.distance || ''}</span></div>
                  <div><span className="label">Kms.</span></div>
                </div>
              </div>
            </td>
            <td style={{ padding: '3px', fontSize: '9px' }}>EOV CHARGES</td>
            <td className="amount-cell">{eov}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td rowSpan={6} colSpan={3} style={{ padding: '3px', verticalAlign: 'top', fontSize: '9px' }}>
              <div style={{ fontSize: '9px' }}>
                <div>In case of Paid Consignment/Advance Payment Specify</div>
                <div style={{ marginTop: '5px' }}><b>M.R.No.:</b> <span className="editable">{bilty.mr_no || ''}</span></div>
                <div><b>Date:</b> <span className="editable">{bilty.mr_date || ''}</span></div>
                <div><b>Amount:</b> <span className="editable">{bilty.mr_amount || ''}</span></div>
                <div style={{ marginTop: '8px' }}><b>LOAD TYPE</b></div>
                <div><b>{bilty.load_type || 'FULL LOAD'}</b></div>
              </div>
            </td>
            <td style={{ padding: '3px', fontSize: '9px' }}>COVER CHARGES</td>
            <td className="amount-cell">{cover}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td style={{ padding: '3px', fontSize: '9px' }}>MATERIAL MGMT CH</td>
            <td className="amount-cell">{materialMgmt}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td style={{ padding: '3px', fontSize: '9px' }}>COLLECTION CHARGES</td>
            <td className="amount-cell">{collection}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td style={{ padding: '3px', fontSize: '9px' }}>DOOR DLY CHARGES</td>
            <td className="amount-cell">{doorDly}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td style={{ padding: '3px', fontSize: '9px' }}>WITH PASS/CC ATTACH CH.</td>
            <td className="amount-cell">{passAttach}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td style={{ padding: '3px', fontSize: '9px' }}>ENROUTE CHARGES</td>
            <td className="amount-cell">{enroute}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td colSpan={6} rowSpan={2} style={{ padding: '3px', verticalAlign: 'top', fontSize: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><b>E WAY BILL No.:</b> <span className="editable">{bilty.eway_bill_no || ''}</span></div>
                <div><b>Valid upto</b> <span className="editable">{bilty.eway_valid || ''}</span></div>
              </div>
            </td>
            <td style={{ padding: '3px', fontSize: '9px' }}>STATISTICAL CHARGES</td>
            <td className="amount-cell">{statistical}</td>
            <td className="amount-cell">0</td>
          </tr>

          <tr>
            <td style={{ padding: '3px', fontSize: '9px' }}>MISC. CHARGES</td>
            <td className="amount-cell">{misc}</td>
            <td className="amount-cell">0</td>
          </tr>

          {/* Grand Total Row */}
          <tr className="grand-total-row">
            <td colSpan={7} style={{ padding: '4px', textAlign: 'right', fontSize: '11px' }}>
              <b>GRAND TOTAL</b>
            </td>
            <td className="amount-cell" style={{ fontSize: '11px', fontWeight: 'bold' }}>{grandTotal}</td>
            <td className="amount-cell" style={{ fontSize: '11px', fontWeight: 'bold' }}>0</td>
          </tr>

          {/* Amount in Words */}
          <tr>
            <td colSpan={9} style={{ padding: '4px', fontSize: '10px' }}>
              <b>To Pay/Paid/TBB Amount Rs. (in words) TBB</b>
            </td>
          </tr>

          {/* Declared Value + Basis */}
          <tr>
            <td colSpan={6} rowSpan={3} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div><b>Declared value of goods: Rs.</b> <span className="editable">{bilty.declared_value || ''}</span></div>
              <div style={{ marginTop: '8px' }}>
                <b>Basis of Booking: (1) To Pay (3) Paid (2) To be Billed at with M/s</b>
              </div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '3px' }}>{bilty.basis_booking || ''}</div>
            </td>
            <td colSpan={3} style={{ padding: '4px', fontSize: '9px', textAlign: 'center', fontWeight: 'bold' }}>
              GRAND TOTAL
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '4px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>
              {grandTotal}
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '4px' }}>
              <div className="label">GST Through: CONSIGNOR/CONSIGNEE/ <b>NBT.C:</b></div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.gst_through || ''}</div>
            </td>
          </tr>

          {/* Footer: Payment Note + Signature */}
          <tr>
            <td colSpan={6} style={{ padding: '6px', verticalAlign: 'bottom', fontSize: '9px' }}>
              <div className="payment-note">
                • Payment should be made only through A/c Payee Cheque / D.D. /in favour of
              </div>
            </td>
            <td colSpan={3} style={{ padding: '6px', verticalAlign: 'bottom', textAlign: 'right' }}>
              <div className="red-bold" style={{ fontSize: '14px', marginBottom: '40px' }}>Bharat Transport Company</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '9px', textAlign: 'center' }}>
                Signature of Booking Official
              </div>
            </td>
          </tr>
        </table>
      </div>
    </>
  )
}
