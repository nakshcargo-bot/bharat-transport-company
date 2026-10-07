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

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0)
    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)
    return { rupees, paise }
  }

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

  const freight = parseFloat(bilty.freight || 0)
  const aoc = parseFloat(bilty.aoc_percent || 0)
  const aocAmount = (freight * aoc) / 100
  const eov = parseFloat(bilty.eov_charges || 0)
  const cover = parseFloat(bilty.cover_charges || 0)
  const materialMgmt = parseFloat(bilty.material_mgmt_ch || 0)
  const collection = parseFloat(bilty.collection_charges || 0)
  const doorDly = parseFloat(bilty.door_dly_charges || 0)
  const passAttach = parseFloat(bilty.pass_attach_ch || 0)
  const enroute = parseFloat(bilty.enroute_charges || 0)
  const statistical = parseFloat(bilty.statistical_charges || 0)
  const misc = parseFloat(bilty.misc_charges || 0)
  const grandTotal = freight + aocAmount + eov + cover + materialMgmt + collection + doorDly + passAttach + enroute + statistical + misc

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .bilty-container {
            width: 190mm !important;
            height: 277mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
        .bilty-container {
          width: 190mm;
          min-height: 277mm;
          margin: 10px auto;
          padding: 3mm;
          font-family: 'Arial', sans-serif;
          font-size: 9px;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .bilty-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
        }
        .bilty-table td, .bilty-table th {
          border: 1px solid #000;
          padding: 2px 4px;
          vertical-align: top;
        }
        .header-company {
          color: #c00000;
          font-size: 22px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 1px;
        }
        .header-office {
          font-size: 9px;
          text-align: center;
        }
        .header-pan-gst {
          font-size: 9px;
          text-align: right;
          font-weight: bold;
        }
        .red-text { color: #c00000; font-weight: bold; }
        .red-bold { color: #c00000; font-weight: bold; font-size: 11px; }
        .section-title {
          font-weight: bold;
          font-size: 9px;
          text-align: center;
          text-transform: uppercase;
        }
        .label {
          font-size: 8px;
          font-weight: bold;
          color: #333;
        }
        .value {
          font-size: 9px;
          min-height: 14px;
        }
        .logo-box {
          width: 60px;
          height: 60px;
          border: 1px solid #c00000;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c00000;
          font-weight: bold;
          font-size: 14px;
        }
        .notice-text {
          font-size: 7px;
          color: #c00000;
          line-height: 1.3;
        }
        .charge-row td {
          padding: 1px 4px;
          font-size: 8px;
        }
        .grand-total {
          background: #f0f0f0;
          font-weight: bold;
          font-size: 10px;
        }
        .footer-sign {
          text-align: right;
          padding-top: 20px;
        }
        .payment-note {
          color: #c00000;
          font-size: 8px;
          font-style: italic;
        }
        input, textarea {
          border: none;
          background: transparent;
          width: 100%;
          font-family: inherit;
          font-size: inherit;
          outline: none;
        }
        .editable {
          min-height: 14px;
          border-bottom: 1px dotted #999;
        }
      `}</style>

      <div className="no-print" style={{ padding: '20px', textAlign: 'center', background: '#f0f0f0' }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px', background: '#c00000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          🖨️ Print Bilty
        </button>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', fontSize: '16px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div className="bilty-container" ref={printRef}>
        <table className="bilty-table">
          {/* Row 1: Logo + Company Header */}
          <tr>
            <td rowSpan={2} style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
              <div className="logo-box" style={{ margin: '0 auto' }}>
                <div>
                  <div style={{ fontSize: '10px' }}>🇮🇳</div>
                  <div>BTC</div>
                </div>
              </div>
            </td>
            <td colSpan={6} style={{ textAlign: 'center', padding: '4px' }}>
              <div className="header-company">BHARAT TRANSPORT COMPANY</div>
              <div className="header-office">
                Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023
              </div>
              <div className="header-office">
                Email: bharattrsnportcompany@gmail.com
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={6} className="header-pan-gst">
              PAN No.: CMRPP0955N &nbsp;&nbsp; GST No.: 08CMRPP0955N1Z5
            </td>
          </tr>

          {/* Row 2: Schedule + Consignor Copy + Caution */}
          <tr>
            <td rowSpan={2} style={{ fontSize: '7px', padding: '3px' }}>
              <div className="section-title">SCHEDULE OF DELAY COLLECTION CHARGE</div>
              <div style={{ marginTop: '3px' }}>
                Delay collection charge after.......... days from today@6/- per day Quintal on charged weight.
              </div>
            </td>
            <td colSpan={3} className="red-bold" style={{ textAlign: 'center', fontSize: '12px' }}>
              CONSIGNOR COPY
            </td>
            <td colSpan={3} rowSpan={2} style={{ fontSize: '7px', padding: '3px' }}>
              <div><b>CAUTION:</b> This consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission will be delivered at the destination</div>
              <div style={{ marginTop: '5px' }}>
                <div className="label">Address of Issuing office</div>
                <div className="editable" style={{ minHeight: '30px' }}>{bilty.issuing_office || ''}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="section-title">OWNER RISK</td>
          </tr>

          {/* Row 3: Notice + Insurance + Consignment Note No */}
          <tr>
            <td rowSpan={3} style={{ padding: '3px' }}>
              <div className="red-bold" style={{ textAlign: 'center', marginBottom: '3px' }}>NOTICE</div>
              <div className="notice-text">
                The Consignment covered by this Lorry receipt shall be stored at the destination under the control of the Transport Operator and shall be delivered to or to the order of the Consignee Bank whose name's mentioned in the Lorry receipt. It will be under no circumstances be delivered to anyone without the written authority from the Consignee Bank or its order, endorsed on the Consignee Copy or on a separate letter of Authority.
              </div>
            </td>
            <td rowSpan={3} colSpan={3} style={{ padding: '3px', fontSize: '8px' }}>
              <div className="section-title">INSURANCE</div>
              <div style={{ marginTop: '3px' }}>
                The consignor has stated that he has insured/not insured the consignment.
              </div>
              <div style={{ marginTop: '5px' }}>
                <div><span className="label">Company:</span> <span className="editable">{bilty.insurance_company || ''}</span></div>
                <div><span className="label">Policy No.:</span> <span className="editable">{bilty.policy_no || ''}</span></div>
                <div><span className="label">Date:</span> <span className="editable">{bilty.insurance_date || ''}</span></div>
                <div><span className="label">Amount:</span> <span className="editable">{bilty.insurance_amount || ''}</span></div>
              </div>
            </td>
            <td colSpan={3} style={{ textAlign: 'center', padding: '8px' }}>
              <div className="red-bold" style={{ fontSize: '13px' }}>CONSIGNMENT NOTE NO.</div>
              <div className="editable" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginTop: '5px', minHeight: '20px' }}>
                {bilty.lr_no || ''}
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '3px' }}>
              <div className="label">Date</div>
              <div className="editable" style={{ minHeight: '18px', fontWeight: 'bold' }}>
                {bilty.lr_date ? new Date(bilty.lr_date).toLocaleDateString('en-IN') : ''}
              </div>
            </td>
          </tr>

          {/* Row 4: Consignor + From/To */}
          <tr>
            <td colSpan={4} style={{ padding: '3px' }}>
              <div className="label">Consignor's Full Name & Address:</div>
              <div className="editable" style={{ minHeight: '30px' }}>{bilty.consignor_name || ''}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <div><span className="label">Invoice No.</span> <span className="editable">{bilty.invoice_no || ''}</span></div>
                <div><span className="label">Date</span> <span className="editable">{bilty.invoice_date || ''}</span></div>
                <div><span className="label">GST No.</span> <span className="editable">{bilty.consignor_gst || ''}</span></div>
              </div>
            </td>
            <td colSpan={1} style={{ padding: '3px' }}>
              <div className="label">Customer Code:</div>
              <div className="editable">{bilty.consignor_code || ''}</div>
            </td>
            <td colSpan={2} style={{ padding: '3px' }}>
              <div className="label">From Code & Name:</div>
              <div className="editable" style={{ minHeight: '18px' }}>{bilty.from_name || ''}</div>
              <div className="label" style={{ marginTop: '5px' }}>To Code & Name:</div>
              <div className="editable" style={{ minHeight: '18px' }}>{bilty.to_name || ''}</div>
            </td>
          </tr>

          {/* Row 5: Consignee + Delivery Details */}
          <tr>
            <td colSpan={4} style={{ padding: '3px' }}>
              <div className="label">Consignee/Bank's Full Name & Address:</div>
              <div className="editable" style={{ minHeight: '30px' }}>{bilty.consignee_name || ''}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <div><span className="label">Purchase Order No.</span> <span className="editable">{bilty.po_no || ''}</span></div>
                <div><span className="label">Date</span> <span className="editable">{bilty.po_date || ''}</span></div>
                <div><span className="label">GST No.</span> <span className="editable">{bilty.consignee_gst || ''}</span></div>
              </div>
            </td>
            <td colSpan={1} style={{ padding: '3px' }}>
              <div className="label">Customer Code:</div>
              <div className="editable">{bilty.consignee_code || ''}</div>
            </td>
            <td colSpan={2} style={{ padding: '3px', fontSize: '8px' }}>
              <div><span className="label">Delivery Type:</span> <b>{bilty.delivery_type || 'DOOR DELIVERY'}</b></div>
              <div><span className="label">Unloading Party Mob. No:</span> <span className="editable">{bilty.unloading_mob || ''}</span></div>
              <div><span className="label">Delivery Godown Address:</span></div>
              <div className="editable" style={{ minHeight: '20px' }}>{bilty.delivery_address || ''}</div>
            </td>
          </tr>

          {/* Row 6: Lorry Details */}
          <tr>
            <td colSpan={7} style={{ padding: '3px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div><span className="label">Lorry No.</span> <span className="editable">{bilty.lorry_no || ''}</span></div>
                <div><span className="label">Phone No.</span> <span className="editable">{bilty.driver_phone || ''}</span></div>
                <div><span className="label">Unloading by Consignee/Pickup Address:</span> <span className="editable">{bilty.pickup_address || ''}</span></div>
              </div>
            </td>
          </tr>

          {/* Row 7: Main Charges Table Header */}
          <tr>
            <th rowSpan={2} style={{ fontSize: '8px' }}>No. of Packages</th>
            <th rowSpan={2} style={{ fontSize: '8px' }}>Method of Packing</th>
            <th rowSpan={2} style={{ fontSize: '8px' }}>HSN Code</th>
            <th rowSpan={2} style={{ fontSize: '8px' }}>Actual Wt. in Kgs.</th>
            <th rowSpan={2} style={{ fontSize: '8px' }}>Charged Wt. in Kgs.</th>
            <th rowSpan={2} style={{ fontSize: '8px' }}>Rate<br/>Fixed</th>
            <th style={{ fontSize: '8px' }}>CHARGES</th>
            <th colSpan={2} style={{ fontSize: '8px' }}>Amount</th>
          </tr>
          <tr>
            <th rowSpan={12} style={{ fontSize: '7px', width: '15%' }}>
              <div style={{ marginBottom: '2px' }}>FREIGHT</div>
              <div style={{ marginBottom: '2px' }}>A.O.C. %</div>
              <div style={{ marginBottom: '2px' }}>EOV CHARGES</div>
              <div style={{ marginBottom: '2px' }}>COVER CHARGES</div>
              <div style={{ marginBottom: '2px' }}>MATERIAL MGMT CH</div>
              <div style={{ marginBottom: '2px' }}>COLLECTION CHARGES</div>
              <div style={{ marginBottom: '2px' }}>DOOR DLY CHARGES</div>
              <div style={{ marginBottom: '2px' }}>WITH PASS/CC ATTACH CH.</div>
              <div style={{ marginBottom: '2px' }}>ENROUTE CHARGES</div>
              <div style={{ marginBottom: '2px' }}>STATISTICAL CHARGES</div>
              <div style={{ marginBottom: '2px' }}>MISC. CHARGES</div>
              <div className="grand-total" style={{ padding: '2px' }}>GRAND TOTAL</div>
            </th>
            <th style={{ fontSize: '8px' }}>Rs.</th>
            <th style={{ fontSize: '8px' }}>Ps.</th>
          </tr>

          {/* Row 8: Description + Package Details */}
          <tr>
            <td colSpan={3} style={{ padding: '2px' }}>
              <div className="label">Description (Said to contain)</div>
              <div className="editable" style={{ minHeight: '25px' }}>{bilty.description || ''}</div>
            </td>
            <td rowSpan={4} style={{ padding: '2px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>
              {bilty.no_of_packages || ''}
            </td>
            <td rowSpan={4} style={{ padding: '2px', textAlign: 'center' }}>
              {bilty.method_of_packing || ''}
            </td>
            <td rowSpan={4} style={{ padding: '2px', textAlign: 'center' }}>
              {bilty.hsn_code || ''}
            </td>
            <td rowSpan={4} style={{ padding: '2px', textAlign: 'center' }}>
              {bilty.actual_weight || ''}
            </td>
            <td rowSpan={4} style={{ padding: '2px', textAlign: 'center' }}>
              {bilty.charged_weight || ''}
            </td>
            <td rowSpan={4} style={{ padding: '2px', textAlign: 'center' }}>
              {bilty.rate || ''}
            </td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(freight).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(freight).paise}</td>
          </tr>

          {/* Dimensions Row */}
          <tr>
            <td colSpan={3} style={{ padding: '2px' }}>
              <div className="label" style={{ textAlign: 'center' }}>Dimension Of Consignment (if Bulky/ODC)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px' }}>
                <tr>
                  <th style={{ border: '1px solid #000', fontSize: '7px', padding: '1px' }}>Length</th>
                  <th style={{ border: '1px solid #000', fontSize: '7px', padding: '1px' }}>Width</th>
                  <th style={{ border: '1px solid #000', fontSize: '7px', padding: '1px' }}>Height</th>
                  <th style={{ border: '1px solid #000', fontSize: '7px', padding: '1px' }}>No. Of Pkgs.</th>
                  <th style={{ border: '1px solid #000', fontSize: '7px', padding: '1px' }}>Total CFT/CMT</th>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center' }}>{bilty.length || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center' }}>{bilty.width || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center' }}>{bilty.height || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center' }}>{bilty.dimension_pkgs || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center' }}>{bilty.total_cft || ''}</td>
                </tr>
              </table>
            </td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(aocAmount).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(aocAmount).paise}</td>
          </tr>

          {/* Private Marks + Distance */}
          <tr>
            <td colSpan={3} rowSpan={2} style={{ padding: '2px' }}>
              <div className="label">Private Marks</div>
              <div className="editable" style={{ minHeight: '40px' }}>{bilty.private_marks || ''}</div>
              <div style={{ marginTop: '5px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div><span className="label">Distance</span> <span className="editable">{bilty.distance || ''}</span></div>
                  <div><span className="label">Kms.</span></div>
                </div>
              </div>
            </td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(eov).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(eov).paise}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(cover).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(cover).paise}</td>
          </tr>

          {/* Paid Consignment Details */}
          <tr>
            <td colSpan={3} rowSpan={3} style={{ padding: '2px', fontSize: '8px' }}>
              <div className="label">In case of Paid Consignment/Advance Payment Specify</div>
              <div><span className="label">M.R.No.:</span> <span className="editable">{bilty.mr_no || ''}</span></div>
              <div><span className="label">Date:</span> <span className="editable">{bilty.mr_date || ''}</span></div>
              <div><span className="label">Amount:</span> <span className="editable">{bilty.mr_amount || ''}</span></div>
              <div style={{ marginTop: '5px' }}>
                <span className="label">LOAD TYPE:</span> <b>{bilty.load_type || 'FULL LOAD'}</b>
              </div>
            </td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(materialMgmt).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(materialMgmt).paise}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(collection).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(collection).paise}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(doorDly).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(doorDly).paise}</td>
          </tr>

          {/* E Way Bill */}
          <tr>
            <td colSpan={6} style={{ padding: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><span className="label">E WAY BILL No.:</span> <span className="editable">{bilty.eway_bill_no || ''}</span></div>
                <div><span className="label">Valid upto</span> <span className="editable">{bilty.eway_valid || ''}</span></div>
              </div>
            </td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(passAttach).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(passAttach).paise}</td>
          </tr>

          {/* Remaining Charges */}
          <tr>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(enroute).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(enroute).paise}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(statistical).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(statistical).paise}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(misc).rupees}</td>
            <td style={{ textAlign: 'right', padding: '2px' }}>{formatCurrency(misc).paise}</td>
          </tr>

          {/* Grand Total */}
          <tr className="grand-total">
            <td style={{ textAlign: 'right', padding: '3px', fontSize: '10px' }}>{formatCurrency(grandTotal).rupees}</td>
            <td style={{ textAlign: 'right', padding: '3px', fontSize: '10px' }}>{formatCurrency(grandTotal).paise}</td>
          </tr>

          {/* Amount in Words */}
          <tr>
            <td colSpan={7} style={{ padding: '3px' }}>
              <span className="label">To Pay/Paid/TBB Amount Rs. (in words) TBB: </span>
              <b>{numberToWords(grandTotal)}</b>
            </td>
          </tr>

          {/* Declared Value + Basis */}
          <tr>
            <td colSpan={4} rowSpan={3} style={{ padding: '3px', fontSize: '8px' }}>
              <div><span className="label">Declared value of goods: Rs.</span> <span className="editable">{bilty.declared_value || ''}</span></div>
              <div style={{ marginTop: '5px' }}>
                <span className="label">Basis of Booking: (1) To Pay (3) Paid (2) To be Billed at with M/s</span>
              </div>
              <div className="editable" style={{ minHeight: '18px', marginTop: '3px' }}>{bilty.basis_booking || ''}</div>
            </td>
            <td colSpan={3} rowSpan={3} style={{ padding: '3px' }}>
              <div className="label">GST Through: CONSIGNOR/CONSIGNEE/ NBT.C:</div>
              <div className="editable" style={{ minHeight: '20px' }}>{bilty.gst_through || ''}</div>
            </td>
          </tr>
          <tr></tr>
          <tr></tr>

          {/* Footer: Payment Note + Signature */}
          <tr>
            <td colSpan={5} style={{ padding: '5px', verticalAlign: 'bottom' }}>
              <div className="payment-note">
                • Payment should be made only through A/c Payee Cheque / D.D. /in favour of
              </div>
            </td>
            <td colSpan={2} className="footer-sign" style={{ padding: '5px' }}>
              <div className="red-bold" style={{ fontSize: '12px', marginBottom: '30px' }}>Bharat Transport Company</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '3px', fontSize: '8px' }}>
                Signature of Booking Official
              </div>
            </td>
          </tr>
        </table>
      </div>
    </>
  )
}
