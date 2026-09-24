import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { biltyAPI } from '../api'

export default function BiltyPrint() {
  const [searchParams] = useSearchParams()
  const lr_no = searchParams.get('lr_no')
  const [bilty, setBilty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBilty = async () => {
      try {
        const res = await biltyAPI.getAll()
        let bilties = []
        if (Array.isArray(res)) bilties = res
        else if (res && Array.isArray(res.data)) bilties = res.data
        else if (res && res.data && Array.isArray(res.data.data)) bilties = res.data.data
        const found = bilties.find(b => b.lr_no === lr_no)
        if (found) setBilty(found)
        else setError(`Bilty not found: ${lr_no}`)
      } catch (err) {
        setError(err.message || 'Failed to load bilty')
      } finally {
        setLoading(false)
      }
    }
    if (lr_no) fetchBilty()
    else { setError('No LR Number provided'); setLoading(false) }
  }, [lr_no])

  const fmt = (v) => parseFloat(v || 0).toFixed(2)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : ''

  if (loading) return <div className="p-10 text-center text-xl font-bold">Loading Bilty...</div>
  if (error) return <div className="p-10 text-center text-xl font-bold text-red-600">{error}</div>
  if (!bilty) return <div className="p-10 text-center text-xl font-bold text-red-600">Bilty Not Found!</div>

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; margin: 0 !important; }
        }
        .bilty-table { border-collapse: collapse; width: 100%; }
        .bilty-table td, .bilty-table th { border: 1px solid #000; padding: 3px 5px; font-size: 11px; }
        .bilty-table th { background: #f0f0f0; font-weight: bold; }
      `}</style>

      <div className="min-h-screen bg-gray-200 p-4 no-print">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print-container" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
          
          {/* ===== ROW 1: HEADER ===== */}
          <table className="bilty-table" style={{ marginBottom: 0 }}>
            <tbody>
              <tr>
                <td style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle', padding: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>BTC</div>
                  <div style={{ fontSize: '10px' }}>🇮🇳</div>
                </td>
                <td style={{ width: '85%', textAlign: 'center', padding: '8px' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#dc2626', margin: 0, textTransform: 'uppercase' }}>BHARAT TRANSPORT COMPANY</h1>
                  <p style={{ margin: '4px 0', fontSize: '11px' }}>Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023</p>
                  <p style={{ margin: '2px 0', fontSize: '11px' }}>Email: bharattrsnportcompany@gmail.com</p>
                  <p style={{ margin: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>PAN No.: CMRPP0955N &nbsp;&nbsp; GST No.: 08CMRPP0955N1Z5</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 2: SCHEDULE / CONSIGNOR COPY / CAUTION ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '30%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '10px', marginBottom: '4px' }}>SCHEDULE OF DELAY COLLECTION CHARGE</div>
                  <p style={{ fontSize: '10px', margin: 0 }}>Delay collection charge after......... days from today@6/- per day Quintal on charged weight.</p>
                </td>
                <td style={{ width: '30%', textAlign: 'center' }}>
                  <div style={{ background: '#fee2e2', fontWeight: 'bold', padding: '4px', color: '#dc2626', fontSize: '14px' }}>CONSIGNOR COPY</div>
                  <div style={{ fontWeight: 'bold', padding: '4px', borderTop: '1px solid #000' }}>OWNER RISK</div>
                </td>
                <td style={{ width: '40%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '10px', marginBottom: '4px' }}><b>CAUTION:</b> This consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission will be delivered at the destination</div>
                  <div style={{ border: '1px solid #000', padding: '4px', minHeight: '30px', marginTop: '4px' }}>
                    <div style={{ textAlign: 'center', fontSize: '10px' }}>Address of Issuing Office</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 3: NOTICE / INSURANCE / CONSIGNMENT NOTE NO ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '30%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', color: '#dc2626', marginBottom: '4px' }}>NOTICE</div>
                  <p style={{ fontSize: '9px', color: '#dc2626', margin: 0, lineHeight: '1.3' }}>The Consignment covered by this Lorry receipt shall be stored at the destination under the control of the TransportOperator and shall be delivered to or to the order of theConsignee Bank whose name's mentioned in the Lorryreceipt. It will be under no circumstances be delivered toanyone without the written authority from the ConsigneeBank or its order, endorsed on the Consignee Copy or on aseperate letter of Authority.</p>
                </td>
                <td style={{ width: '30%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>INSURANCE</div>
                  <p style={{ fontSize: '10px', margin: '0 0 4px 0' }}>The consignor has stated that he has insured/not insured the consignment.</p>
                  <p style={{ fontSize: '10px', margin: '2px 0' }}><b>Company:</b></p>
                  <p style={{ fontSize: '10px', margin: '2px 0' }}><b>Policy No.</b></p>
                  <p style={{ fontSize: '10px', margin: '2px 0' }}><b>Date:</b></p>
                  <p style={{ fontSize: '10px', margin: '2px 0' }}><b>Amount:</b></p>
                </td>
                <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px', margin: '8px 0' }}>CONSIGNMENT NOTE NO.</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{bilty.lr_no}</div>
                  <p style={{ fontSize: '11px', marginTop: '8px' }}><b>Date:</b> {fmtDate(bilty.lr_date)}</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 4: CONSIGNOR + FROM/TO ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '65%', verticalAlign: 'top' }} rowSpan="2">
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Consignor's Full Name & Address:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>{bilty.consignor_name}</div>
                  <div style={{ fontSize: '11px' }}>{bilty.consignor_address}</div>
                  <div style={{ marginTop: '8px', fontSize: '11px' }}>Invoice No.: <b>{bilty.invoice_no || ''}</b></div>
                  <div style={{ fontSize: '11px' }}>Date: <b>{fmtDate(bilty.invoice_date)}</b></div>
                  <div style={{ fontSize: '11px' }}>GST No.: <b>{bilty.consignor_gst || ''}</b></div>
                  <div style={{ fontSize: '11px' }}>Customer Code: <b>{bilty.customer_code_consignor || ''}</b></div>
                </td>
                <td style={{ width: '35%' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>From Code & Name:</div>
                  <div style={{ fontSize: '11px' }}>{bilty.from_code} - {bilty.from_name}</div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '35%' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>To Code & Name:</div>
                  <div style={{ fontSize: '11px' }}>{bilty.to_code} - {bilty.to_name}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>Delivery Type:</div>
                  <div style={{ fontSize: '11px' }}>{bilty.delivery_type}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Unloading Party Mob. No:</div>
                  <div style={{ fontSize: '11px' }}>{bilty.unloading_party_mobile || ''}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Delivery Godown Address:</div>
                  <div style={{ fontSize: '11px' }}>{bilty.delivery_godown_address || ''}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 5: CONSIGNEE + LORRY ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '65%', verticalAlign: 'top' }} rowSpan="2">
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Consignee/Bank's Full Name & Address:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>{bilty.consignee_name}</div>
                  <div style={{ fontSize: '11px' }}>{bilty.consignee_address}</div>
                  <div style={{ marginTop: '8px', fontSize: '11px' }}>Purchase Order No.: <b>{bilty.po_no || ''}</b></div>
                  <div style={{ fontSize: '11px' }}>Date: <b>{fmtDate(bilty.po_date)}</b></div>
                  <div style={{ fontSize: '11px' }}>GST No.: <b>{bilty.consignee_gst || ''}</b></div>
                  <div style={{ fontSize: '11px' }}>Customer Code: <b>{bilty.customer_code_consignee || ''}</b></div>
                </td>
                <td style={{ width: '35%' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Lorry No.</div>
                  <div style={{ fontSize: '11px' }}>{bilty.lorry_no || bilty.vehicle_no || ''}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Phone No.</div>
                  <div style={{ fontSize: '11px' }}>{bilty.driver_mobile || ''}</div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '35%' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Unloading by Consignee/Pickup Address</div>
                  <div style={{ fontSize: '11px' }}>{bilty.pickup_address || ''}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 6: MAIN TABLE HEADER ===== */}
          <table className="bilty-table">
            <tbody>
              <tr style={{ textAlign: 'center', fontWeight: 'bold', background: '#f0f0f0' }}>
                <td style={{ width: '10%' }}>No. of Packages</td>
                <td style={{ width: '12%' }}>Method of Packing</td>
                <td style={{ width: '8%' }}>HSN Code</td>
                <td style={{ width: '12%' }}>Actual Wt. in Kgs.</td>
                <td style={{ width: '12%' }}>Charged Wt. in Kgs.</td>
                <td style={{ width: '8%' }}>Rate<br/>Fixed</td>
                <td style={{ width: '38%', colSpan: 3 }}>Amount</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{bilty.no_of_packages}</td>
                <td style={{ textAlign: 'center' }}>{bilty.method_of_packing}</td>
                <td style={{ textAlign: 'center' }}>{bilty.hsn_code}</td>
                <td style={{ textAlign: 'center' }}>{bilty.actual_weight}</td>
                <td style={{ textAlign: 'center' }}>{bilty.charged_weight}</td>
                <td style={{ textAlign: 'center' }}>{bilty.rate}</td>
                <td style={{ width: '19%', textAlign: 'center', fontWeight: 'bold' }}>CHARGES</td>
                <td style={{ width: '9.5%', textAlign: 'center', fontWeight: 'bold' }}>Rs.</td>
                <td style={{ width: '9.5%', textAlign: 'center', fontWeight: 'bold' }}>Ps.</td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 7: DESCRIPTION + DISTANCE + CHARGES ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '62%', verticalAlign: 'top' }} rowSpan="2">
                  <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>Description (Said to contain)</div>
                  <div style={{ minHeight: '50px', fontSize: '11px' }}>{bilty.description}</div>
                </td>
                <td style={{ width: '38%', verticalAlign: 'top' }} rowSpan="2">
                  <table className="bilty-table" style={{ margin: 0 }}>
                    <tbody>
                      <tr><td style={{ fontWeight: 'bold' }}>FREIGHT</td><td style={{ textAlign: 'right' }}>{fmt(bilty.freight)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>A.O.C. %</td><td style={{ textAlign: 'right' }}>{bilty.aoc_percent || 0}%</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>EOV CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.eov_charges)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>COVER CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.cover_charges)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>MATERIAL MGMT CH</td><td style={{ textAlign: 'right' }}>{fmt(bilty.material_mgmt_ch || bilty.material_charges || 0)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>COLLECTION CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.collection_charges)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>DOOR DLY CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.door_dly_charges || bilty.door_delivery || 0)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>WITH PASS/CC ATTACH CH.</td><td style={{ textAlign: 'right' }}>{fmt(bilty.pass_cc_charges || bilty.with_pass_cc || 0)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>ENROUTE CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.enroute_charges)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>STATISTICAL CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.statistical_charges)}</td><td></td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>MISC. CHARGES</td><td style={{ textAlign: 'right' }}>{fmt(bilty.misc_charges)}</td><td></td></tr>
                      <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}><td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold' }}>GRAND TOTAL</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{fmt(bilty.grand_total)}</td></tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style={{ width: '38%' }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>Distance</div>
                  <div style={{ textAlign: 'center', fontSize: '11px' }}>{bilty.distance || 0} Kms.</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 8: DIMENSION + PRIVATE MARKS + MR ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '40%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>Dimension Of Consignment (if Bulky/ODC)</div>
                  <table className="bilty-table" style={{ margin: 0 }}>
                    <tbody>
                      <tr style={{ textAlign: 'center', fontWeight: 'bold', background: '#f0f0f0' }}>
                        <td>Length</td><td>Width</td><td>Height</td><td>No. Of Pkgs.</td><td>Total CFT/CMT</td>
                      </tr>
                      <tr style={{ textAlign: 'center' }}>
                        <td>{bilty.length}</td><td>{bilty.width}</td><td>{bilty.height}</td><td>{bilty.no_of_pkgs_dimension}</td><td>{bilty.total_cft_cmt || bilty.cft_cmt}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style={{ width: '22%', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>Private Marks</div>
                  <div style={{ minHeight: '40px', fontSize: '11px' }}>{bilty.private_marks}</div>
                </td>
                <td style={{ width: '38%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '10px', marginBottom: '4px' }}><b>In case of Paid Consignment/Advance Payment Specify</b></div>
                  <div style={{ fontSize: '11px' }}><b>M.R.No.:</b> {bilty.mr_no || ''}</div>
                  <div style={{ fontSize: '11px' }}><b>Date:</b> {fmtDate(bilty.mr_date)}</div>
                  <div style={{ fontSize: '11px' }}><b>Amount:</b> {fmt(bilty.mr_amount)}</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}><b>LOAD TYPE:</b> {bilty.load_type || 'Part Load'}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 9: E-WAY BILL ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '70%' }}>
                  <div style={{ fontSize: '11px' }}><b>E WAY BILL No.:</b> {bilty.eway_bill_no || ''}</div>
                  <div style={{ fontSize: '11px' }}><b>Valid upto:</b> {fmtDate(bilty.eway_valid_upto)}</div>
                </td>
                <td style={{ width: '30%', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 10: PAYMENT DETAILS ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '70%' }}>
                  <div style={{ fontSize: '11px' }}><b>To Pay/Paid/TBB Amount Rs. (in words) TBB:</b> {bilty.amount_in_words || ''}</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}><b>Declared value of goods: Rs.</b> {bilty.declared_value || 0}</div>
                  <div style={{ fontSize: '11px' }}><b>Basis of Booking:</b> (1) To Pay (3) Paid (2) To be</div>
                  <div style={{ fontSize: '11px' }}><b>Billed at with M/s:</b> {bilty.billed_at || ''}</div>
                </td>
                <td style={{ width: '30%' }}></td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 11: GST + SIGNATURE ===== */}
          <table className="bilty-table">
            <tbody>
              <tr>
                <td style={{ width: '65%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px' }}><b>GST Through: CONSIGNOR/CONSIGNEE/ N.B.T.C:</b> <span style={{ color: '#dc2626' }}>{bilty.gst_through || ''}</span></div>
                  <div style={{ marginTop: '12px', fontSize: '10px', color: '#dc2626' }}>
                    <b>• Payment should be made only through A/c Payee Cheque / D.D. in favour of</b>
                  </div>
                </td>
                <td style={{ width: '35%', textAlign: 'center', verticalAlign: 'bottom' }}>
                  <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px', marginBottom: '30px' }}>Bharat Transport Company</div>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '11px' }}>Signature of Booking Official</div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>

        {/* Action Buttons */}
        <div className="max-w-[210mm] mx-auto mt-4 flex gap-4 justify-center no-print">
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg"
          >
            🖨️ Print Bilty
          </button>
          <button 
            onClick={() => window.history.back()} 
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg"
          >
            ← Back
          </button>
        </div>
      </div>
    </>
  )
}
