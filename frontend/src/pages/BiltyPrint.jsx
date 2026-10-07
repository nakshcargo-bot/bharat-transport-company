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

  const freight = Math.round(parseFloat(bilty.freight || 0))
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
          margin: 0;
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
            width: 210mm !important;
            height: 297mm !important;
            padding: 5mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
        .bilty-container {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 5mm;
          font-family: Arial, sans-serif;
          font-size: 10px;
          background: white;
        }
        .main-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
        }
        .main-table td, .main-table th {
          border: 1px solid #000;
          padding: 2px 4px;
          vertical-align: top;
        }
        .header-company {
          color: #d00000;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 1px;
          padding: 5px 0;
        }
        .header-office {
          font-size: 10px;
          text-align: center;
          line-height: 1.4;
        }
        .header-pan-gst {
          font-size: 9px;
          text-align: right;
          font-weight: bold;
          padding: 2px 5px;
        }
        .red-text { color: #d00000; font-weight: bold; }
        .red-bold { color: #d00000; font-weight: bold; font-size: 12px; }
        .section-title {
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          text-transform: uppercase;
        }
        .label {
          font-size: 9px;
          font-weight: bold;
        }
        .value {
          font-size: 10px;
        }
        .logo-box {
          width: 70px;
          height: 70px;
          border: 2px solid #d00000;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d00000;
          font-weight: bold;
          font-size: 16px;
          margin: 5px auto;
        }
        .notice-text {
          font-size: 7px;
          color: #d00000;
          line-height: 1.3;
          text-align: justify;
        }
        .charge-row td {
          padding: 2px 4px;
          font-size: 9px;
        }
        .grand-total {
          background: #f5f5f5;
          font-weight: bold;
          font-size: 11px;
        }
        .footer-sign {
          text-align: right;
          padding-top: 30px;
        }
        .payment-note {
          color: #d00000;
          font-size: 9px;
          font-style: italic;
          line-height: 1.4;
        }
        .editable {
          min-height: 16px;
          border-bottom: 1px dotted #999;
        }
        .amount-col {
          text-align: right;
          width: 80px;
          padding-right: 5px;
        }
      `}</style>

      <div className="no-print" style={{ padding: '20px', textAlign: 'center', background: '#f0f0f0', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px', background: '#d00000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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
            <td rowSpan={2} style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle', padding: '5px' }}>
              <div className="logo-box">
                <div>
                  <div style={{ fontSize: '30px', lineHeight: '1' }}>🇮🇳</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>BTC</div>
                </div>
              </div>
            </td>
            <td colSpan={6} style={{ textAlign: 'center', padding: '8px 5px' }}>
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
              PAN No.: CMRPP0955N &nbsp;&nbsp;&nbsp;GST No.: 08CMRPP0955N1Z5
            </td>
          </tr>

          {/* Row 2: Schedule + Consignor Copy + Caution */}
          <tr>
            <td rowSpan={2} style={{ fontSize: '8px', padding: '4px', verticalAlign: 'top' }}>
              <div className="section-title" style={{ marginBottom: '3px' }}>SCHEDULE OF DELAY COLLECTION CHARGE</div>
              <div>
                Delay collection charge after.......... days from today@6/- per day Quintal on charged weight.
              </div>
            </td>
            <td colSpan={3} className="red-bold" style={{ textAlign: 'center', fontSize: '13px', padding: '6px' }}>
              CONSIGNOR COPY
            </td>
            <td colSpan={3} rowSpan={2} style={{ fontSize: '8px', padding: '4px', verticalAlign: 'top' }}>
              <div><b>CAUTION:</b> This consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission will be delivered at the destination</div>
              <div style={{ marginTop: '8px' }}>
                <div className="label">Address of Issuing office</div>
                <div className="editable" style={{ minHeight: '25px', marginTop: '2px' }}>{bilty.issuing_office || ''}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="section-title" style={{ padding: '4px' }}>OWNER RISK</td>
          </tr>

          {/* Row 3: Notice + Insurance + Consignment Note No */}
          <tr>
            <td rowSpan={2} style={{ padding: '4px', verticalAlign: 'top' }}>
              <div className="red-bold" style={{ textAlign: 'center', marginBottom: '4px', fontSize: '11px' }}>NOTICE</div>
              <div className="notice-text">
                The Consignment covered by this Lorry receipt shall be stored at the destination under the control of the Transport Operator and shall be delivered to or to the order of the Consignee Bank whose name's mentioned in the Lorry receipt. It will be under no circumstances be delivered to anyone without the written authority from the Consignee Bank or its order, endorsed on the Consignee Copy or on a separate letter of Authority.
              </div>
            </td>
            <td rowSpan={2} colSpan={3} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="section-title" style={{ marginBottom: '3px' }}>INSURANCE</div>
              <div style={{ marginBottom: '4px' }}>
                The consignor has stated that he has insured/not insured the consignment.
              </div>
              <div style={{ fontSize: '9px' }}>
                <div><span className="label">Company:</span> <span className="editable">{bilty.insurance_company || ''}</span></div>
                <div><span className="label">Policy No.:</span> <span className="editable">{bilty.policy_no || ''}</span></div>
                <div><span className="label">Date:</span> <span className="editable">{bilty.insurance_date || ''}</span></div>
                <div><span className="label">Amount:</span> <span className="editable">{bilty.insurance_amount || ''}</span></div>
              </div>
            </td>
            <td colSpan={3} style={{ textAlign: 'center', padding: '8px', verticalAlign: 'top' }}>
              <div className="red-bold" style={{ fontSize: '14px', marginBottom: '8px' }}>CONSIGNMENT NOTE NO.</div>
              <div className="editable" style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', minHeight: '25px', marginBottom: '5px' }}>
                {bilty.lr_no || 'BTC/26/0001'}
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '4px' }}>
              <div className="label">Date</div>
              <div className="editable" style={{ minHeight: '20px', fontWeight: 'bold', marginTop: '2px' }}>
                {bilty.lr_date ? new Date(bilty.lr_date).toLocaleDateString('en-IN') : '23/9/2026'}
              </div>
            </td>
          </tr>

          {/* Row 4: Consignor + From/To */}
          <tr>
            <td colSpan={4} style={{ padding: '4px', verticalAlign: 'top' }}>
              <div className="label">Consignor's Full Name & Address:</div>
              <div className="editable" style={{ minHeight: '35px', marginTop: '2px' }}>{bilty.consignor_name || 'Shree Traders'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px' }}>
                <div><span className="label">Invoice No.</span> <span className="editable" style={{ marginLeft: '3px' }}>{bilty.invoice_no || '25'}</span></div>
                <div><span className="label">Date</span> <span className="editable" style={{ marginLeft: '3px' }}>{bilty.invoice_date || ''}</span></div>
                <div><span className="label">GST No.</span> <span className="editable" style={{ marginLeft: '3px' }}>{bilty.consignor_gst || ''}</span></div>
              </div>
            </td>
            <td colSpan={1} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="label">Customer Code:</div>
              <div className="editable" style={{ minHeight: '18px', marginTop: '2px' }}>{bilty.consignor_code || ''}</div>
            </td>
            <td colSpan={1} rowSpan={2} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="label">From Code & Name:</div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.from_name || 'Delhi'}</div>
              <div className="label" style={{ marginTop: '8px' }}>To Code & Name:</div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '2px' }}>{bilty.to_name || 'Delhi'}</div>
            </td>
          </tr>

          {/* Row 5: Consignee + Delivery Details */}
          <tr>
            <td colSpan={4} style={{ padding: '4px', verticalAlign: 'top' }}>
              <div className="label">Consignee/Bank's Full Name & Address:</div>
              <div className="editable" style={{ minHeight: '35px', marginTop: '2px' }}>{bilty.consignee_name || 'Vedant Sales Corporation'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px' }}>
                <div><span className="label">Purchase Order No.</span> <span className="editable" style={{ marginLeft: '3px' }}>{bilty.po_no || ''}</span></div>
                <div><span className="label">Date</span> <span className="editable" style={{ marginLeft: '3px' }}>{bilty.po_date || ''}</span></div>
                <div><span className="label">GST No.</span> <span className="editable" style={{ marginLeft: '3px' }}>{bilty.consignee_gst || '27AVGPG9399R1ZJ'}</span></div>
              </div>
            </td>
            <td colSpan={1} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="label">Customer Code:</div>
              <div className="editable" style={{ minHeight: '18px', marginTop: '2px' }}>{bilty.consignee_code || ''}</div>
            </td>
          </tr>

          {/* Row 6: Delivery + Lorry Details */}
          <tr>
            <td colSpan={3} rowSpan={2} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div><span className="label">Delivery Type:</span> <b>{bilty.delivery_type || 'DOOR DELIVERY'}</b></div>
              <div><span className="label">Unloading Party Mob. No:</span> <span className="editable">{bilty.unloading_mob || ''}</span></div>
              <div><span className="label">Delivery Godown Address:</span></div>
              <div className="editable" style={{ minHeight: '25px', marginTop: '2px' }}>{bilty.delivery_address || ''}</div>
            </td>
            <td colSpan={3} style={{ padding: '4px', fontSize: '9px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div><span className="label">Lorry No.</span> <span className="editable">{bilty.lorry_no || ''}</span></div>
                <div><span className="label">Phone No.</span> <span className="editable">{bilty.driver_phone || ''}</span></div>
              </div>
              <div style={{ marginTop: '5px' }}>
                <span className="label">Unloading by Consignee/Pickup Address:</span> <span className="editable">{bilty.pickup_address || ''}</span>
              </div>
            </td>
          </tr>

          {/* Row 7: Main Table Headers */}
          <tr className="section-title" style={{ fontSize: '9px' }}>
            <th>No. of Packages</th>
            <th>Method of Packing</th>
            <th>HSN Code</th>
            <th>Actual Wt. in Kgs.</th>
            <th>Charged Wt. in Kgs.</th>
            <th>Rate<br/>Fixed</th>
            <th style={{ width: '15%' }}>CHARGES</th>
            <th>Amount<br/>Rs.</th>
          </tr>

          {/* Row 8-18: Charges Table - सिर्फ Rs. column */}
          <tr>
            <td rowSpan={11} colSpan={3} style={{ padding: '4px', verticalAlign: 'top', fontSize: '9px' }}>
              <div className="label" style={{ marginBottom: '3px' }}>Description (Said to contain)</div>
              <div className="editable" style={{ minHeight: '30px', marginBottom: '5px' }}>{bilty.description || '93'}</div>
              
              <div className="label" style={{ marginBottom: '3px', marginTop: '8px' }}>Dimension Of Consignment (if Bulky/ODC)</div>
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

              <div style={{ marginTop: '8px' }}>
                <div className="label">Private Marks</div>
                <div className="editable" style={{ minHeight: '40px', marginTop: '2px' }}>{bilty.private_marks || ''}</div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '9px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div><span className="label">Distance</span> <span className="editable">{bilty.distance || ''}</span></div>
                  <div><span className="label">Kms.</span></div>
                </div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '9px' }}>
                <div><span className="label">E WAY BILL No.:</span> <span className="editable">{bilty.eway_bill_no || ''}</span></div>
                <div style={{ marginTop: '3px' }}><span className="label">Valid upto</span> <span className="editable">{bilty.eway_valid || ''}</span></div>
              </div>
            </td>
            <td rowSpan={11} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div>{bilty.no_of_packages || ''}</div>
            </td>
            <td rowSpan={11} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div>{bilty.method_of_packing || ''}</div>
            </td>
            <td rowSpan={11} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div>{bilty.hsn_code || ''}</div>
            </td>
            <td rowSpan={11} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div>{bilty.actual_weight || ''}</div>
            </td>
            <td rowSpan={11} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div>{bilty.charged_weight || ''}</div>
            </td>
            <td rowSpan={11} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div>{bilty.rate || ''}</div>
            </td>
            <td style={{ padding: '2px', fontSize: '9px' }}>
              <div>FREIGHT</div>
            </td>
            <td className="amount-col">{freight}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>A.O.C. %</td>
            <td className="amount-col">{aocAmount}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>EOV CHARGES</td>
            <td className="amount-col">{eov}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>COVER CHARGES</td>
            <td className="amount-col">{cover}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>MATERIAL MGMT CH</td>
            <td className="amount-col">{materialMgmt}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>COLLECTION CHARGES</td>
            <td className="amount-col">{collection}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>DOOR DLY CHARGES</td>
            <td className="amount-col">{doorDly}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>WITH PASS/CC ATTACH CH.</td>
            <td className="amount-col">{passAttach}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>ENROUTE CHARGES</td>
            <td className="amount-col">{enroute}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>STATISTICAL CHARGES</td>
            <td className="amount-col">{statistical}</td>
          </tr>

          <tr>
            <td style={{ padding: '2px', fontSize: '9px' }}>MISC. CHARGES</td>
            <td className="amount-col">{misc}</td>
          </tr>

          {/* Grand Total Row */}
          <tr className="grand-total">
            <td colSpan={7} style={{ padding: '4px', textAlign: 'right', fontSize: '11px' }}>
              <b>GRAND TOTAL</b>
            </td>
            <td className="amount-col" style={{ fontSize: '11px', fontWeight: 'bold' }}>{grandTotal}</td>
          </tr>

          {/* Amount in Words */}
          <tr>
            <td colSpan={8} style={{ padding: '4px', fontSize: '10px' }}>
              <span className="label">To Pay/Paid/TBB Amount Rs. (in words) TBB: </span>
              <b>{numberToWords(grandTotal)}</b>
            </td>
          </tr>

          {/* Declared Value + Basis + GST */}
          <tr>
            <td colSpan={5} rowSpan={3} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div><span className="label">Declared value of goods: Rs.</span> <span className="editable">{bilty.declared_value || ''}</span></div>
              <div style={{ marginTop: '8px' }}>
                <span className="label">Basis of Booking: (1) To Pay (3) Paid (2) To be Billed at with M/s</span>
              </div>
              <div className="editable" style={{ minHeight: '20px', marginTop: '3px' }}>{bilty.basis_booking || ''}</div>
            </td>
            <td colSpan={3} rowSpan={3} style={{ padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
              <div className="label">GST Through: CONSIGNOR/CONSIGNEE/ NBT.C:</div>
              <div className="editable" style={{ minHeight: '25px', marginTop: '2px' }}>{bilty.gst_through || ''}</div>
            </td>
          </tr>
          <tr></tr>
          <tr></tr>

          {/* Footer: Payment Note + Signature */}
          <tr>
            <td colSpan={6} style={{ padding: '6px', verticalAlign: 'bottom', fontSize: '9px' }}>
              <div className="payment-note">
                • Payment should be made only through A/c Payee Cheque / D.D. /in favour of
              </div>
            </td>
            <td colSpan={2} className="footer-sign" style={{ padding: '6px', verticalAlign: 'bottom' }}>
              <div className="red-bold" style={{ fontSize: '13px', marginBottom: '35px' }}>Bharat Transport Company</div>
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
