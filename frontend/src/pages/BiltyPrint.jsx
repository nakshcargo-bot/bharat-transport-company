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

  const fmt = (v) => {
    const n = parseFloat(v || 0)
    return n.toFixed(2)
  }
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : ''

  if (loading) return <div style={{padding:'50px',textAlign:'center',fontSize:'20px',fontWeight:'bold'}}>Loading Bilty...</div>
  if (error) return <div style={{padding:'50px',textAlign:'center',fontSize:'20px',fontWeight:'bold',color:'red'}}>{error}</div>
  if (!bilty) return <div style={{padding:'50px',textAlign:'center',fontSize:'20px',fontWeight:'bold',color:'red'}}>Bilty Not Found!</div>

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
        }
        .bilty-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          box-sizing: border-box;
        }
        .b-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .b-table td, .b-table th {
          border: 1px solid #000;
          padding: 2px 4px;
          vertical-align: top;
          word-wrap: break-word;
          overflow: hidden;
        }
        .b-table th {
          background: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }
        .red-text { color: #cc0000; }
        .red-bg { background: #ffe0e0; color: #cc0000; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
        .right { text-align: right; }
        .small { font-size: 9px; }
        .xs { font-size: 8px; }
        .nowrap { white-space: nowrap; }
      `}</style>

      <div className="no-print" style={{minHeight:'100vh',background:'#e5e7eb',padding:'20px'}}>
        <div className="print-page bilty-page" style={{boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>

          {/* ===== ROW 1: HEADER ===== */}
          <table className="b-table">
            <tbody>
              <tr>
                <td style={{width:'12%',textAlign:'center',verticalAlign:'middle',padding:'10px 5px'}}>
                  <div style={{fontSize:'32px',fontWeight:'bold',color:'#cc0000',lineHeight:1}}>BTC</div>
                  <svg width="40" height="50" viewBox="0 0 100 120" style={{marginTop:'5px'}}>
                    <path d="M50 10 L70 30 L80 60 L70 90 L50 110 L30 90 L20 60 L30 30 Z" fill="none" stroke="#cc0000" strokeWidth="2"/>
                    <text x="50" y="65" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#cc0000">BTC</text>
                  </svg>
                </td>
                <td style={{width:'88%',textAlign:'center',padding:'10px 8px'}}>
                  <h1 style={{fontSize:'26px',fontWeight:'bold',color:'#cc0000',margin:'0 0 6px 0',textTransform:'uppercase',letterSpacing:'1px'}}>BHARAT TRANSPORT COMPANY</h1>
                  <p style={{margin:'3px 0',fontSize:'11px'}}>Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan, 331023</p>
                  <p style={{margin:'3px 0',fontSize:'11px'}}>Email : bharattrsnportcompany@gmail.com</p>
                  <p style={{margin:'3px 0',fontSize:'11px',fontWeight:'bold'}}>PAN No.: CMRPP0955N &nbsp;&nbsp; GST No.: 08CMRPP0955N1Z5</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 2: SCHEDULE / CONSIGNOR COPY / CAUTION ===== */}
          <table className="b-table">
            <tbody>
              <tr>
                <td style={{width:'30%',verticalAlign:'top',padding:'5px'}}>
                  <div className="bold center small" style={{marginBottom:'4px'}}>SCHEDULE OF DELAY COLLECTION CHARGE</div>
                  <p className="small" style={{margin:0}}>Delay collection charge after......... days from today@6/- per day Quintal on charged weight.</p>
                </td>
                <td style={{width:'30%',textAlign:'center',padding:'0'}}>
                  <div className="red-bg bold" style={{padding:'6px',fontSize:'13px',borderBottom:'1px solid #000'}}>CONSIGNOR COPY</div>
                  <div className="bold" style={{padding:'6px'}}>OWNER RISK</div>
                </td>
                <td style={{width:'40%',verticalAlign:'top',padding:'5px'}}>
                  <div className="small" style={{marginBottom:'4px'}}><span className="bold">CAUTION :</span>This consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission will be delivered at the destination</div>
                  <div style={{border:'1px solid #000',padding:'5px',minHeight:'30px',marginTop:'4px'}}>
                    <div className="center small">Address of Issuing office</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 3: NOTICE / INSURANCE / CONSIGNMENT NOTE NO ===== */}
          <table className="b-table">
            <tbody>
              <tr>
                <td style={{width:'30%',verticalAlign:'top',padding:'5px'}}>
                  <div className="bold center red-text" style={{marginBottom:'4px',fontSize:'12px'}}>NOTICE</div>
                  <p className="red-text xs" style={{margin:0,lineHeight:'1.4'}}>The Consignment covered by this Lorry receipt shall be stored at the destination under the control of the TransportOperator and shall be delivered to or to the order of theConsignee Bank whose name's mentioned in the Lorryreceipt. It will be under no circumstances be delivered toanyone without the written authority from the ConsigneeBank or its order, endorsed on the Consignee Copy or on aseperate letter of Authority.</p>
                </td>
                <td style={{width:'30%',verticalAlign:'top',padding:'5px'}}>
                  <div className="bold center" style={{marginBottom:'4px'}}>INSURANCE</div>
                  <p className="small" style={{margin:'0 0 4px 0'}}>The consignor has stated that he has insured/not insured the consignment.</p>
                  <p className="small" style={{margin:'2px 0'}}><span className="bold">Company</span></p>
                  <p className="small" style={{margin:'2px 0'}}><span className="bold">Policy No.</span></p>
                  <p className="small" style={{margin:'2px 0'}}><span className="bold">Date</span></p>
                  <p className="small" style={{margin:'2px 0'}}><span className="bold">Amount</span></p>
                </td>
                <td style={{width:'40%',verticalAlign:'top',textAlign:'center',padding:'5px'}}>
                  <div className="red-text bold" style={{fontSize:'15px',margin:'8px 0 5px 0'}}>CONSIGNMENT NOTE NO.</div>
                  <div style={{fontSize:'20px',fontWeight:'bold',margin:'5px 0'}}>{bilty.lr_no}</div>
                  <p className="small" style={{marginTop:'8px'}}><span className="bold">Date</span> {fmtDate(bilty.lr_date)}</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 4 & 5: CONSIGNOR + CONSIGNEE + FROM/TO/DELIVERY ===== */}
          <table className="b-table">
            <tbody>
              <tr>
                <td style={{width:'65%',verticalAlign:'top',padding:'5px'}} rowSpan={2}>
                  <div className="small"><span className="bold">Consignor's Full Name & Address:</span><span style={{float:'right'}}><span className="bold">Customer Code :</span></span></div>
                  <div className="bold" style={{fontSize:'12px',marginTop:'4px'}}>{bilty.consignor_name}</div>
                  <div className="small">{bilty.consignor_address}</div>
                  <div className="small" style={{marginTop:'8px'}}>Invoice No. <span style={{float:'right'}}><span className="bold">GST No.</span></span></div>
                  <div className="small">Date</div>
                </td>
                <td style={{width:'35%',padding:'5px'}}>
                  <div className="small bold">From Code & Name:</div>
                  <div className="small">{bilty.from_code} - {bilty.from_name}</div>
                </td>
              </tr>
              <tr>
                <td style={{width:'35%',padding:'5px'}}>
                  <div className="small bold">To Code & Name:</div>
                  <div className="small">{bilty.to_code} - {bilty.to_name}</div>
                  <div className="small bold" style={{marginTop:'4px'}}>Delivery Type: <span className="bold">{bilty.delivery_type}</span></div>
                  <div className="small bold">Unloading Party Mob. No:</div>
                  <div className="small">{bilty.unloading_party_mobile || ''}</div>
                  <div className="small bold">Delivery Godown Address</div>
                  <div className="small">{bilty.delivery_godown_address || bilty.delivery_godown || ''}</div>
                </td>
              </tr>
              <tr>
                <td style={{width:'65%',verticalAlign:'top',padding:'5px'}} rowSpan={2}>
                  <div className="small"><span className="bold">Consignee/Bank's Full Name & Address:</span><span style={{float:'right'}}><span className="bold">Customer Code :</span></span></div>
                  <div className="bold" style={{fontSize:'12px',marginTop:'4px'}}>{bilty.consignee_name}</div>
                  <div className="small">{bilty.consignee_address}</div>
                  <div className="small" style={{marginTop:'8px'}}>Purchase Order No. <span style={{float:'right'}}><span className="bold">GST No.</span></span></div>
                  <div className="small">Date</div>
                </td>
                <td style={{width:'35%',padding:'5px'}}>
                  <div className="small bold">Lorry No.</div>
                  <div className="small">{bilty.lorry_no || bilty.vehicle_no || ''}</div>
                  <div className="small bold">Phone No.</div>
                  <div className="small">{bilty.driver_mobile || ''}</div>
                  <div className="small bold">Unloading by Consignee/</div>
                  <div className="small bold">Pickup Address</div>
                  <div className="small">{bilty.pickup_address || ''}</div>
                </td>
              </tr>
              <tr>
                <td style={{width:'35%',padding:'5px'}}>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 6: MAIN TABLE HEADER + CHARGES ===== */}
          <table className="b-table">
            <tbody>
              <tr className="bold center small">
                <td style={{width:'10%'}}>No. of Packages</td>
                <td style={{width:'12%'}}>Method of Packing</td>
                <td style={{width:'8%'}}>HSN Code</td>
                <td style={{width:'12%'}}>Actual Wt. in Kgs.</td>
                <td style={{width:'12%'}}>Charged Wt. in Kgs.</td>
                <td style={{width:'8%'}}>Rate<br/>Fixed</td>
                <td style={{width:'20%'}} rowSpan={2} className="nowrap">CHARGES</td>
                <td style={{width:'18%'}} colSpan={2}>Amount</td>
              </tr>
              <tr>
                <td className="center bold" style={{height:'25px'}}>{bilty.no_of_packages}</td>
                <td className="center">{bilty.method_of_packing}</td>
                <td className="center">{bilty.hsn_code}</td>
                <td className="center">{bilty.actual_weight}</td>
                <td className="center">{bilty.charged_weight}</td>
                <td className="center">{bilty.rate}</td>
                <td className="center bold small">Rs.</td>
                <td className="center bold small">Ps.</td>
              </tr>
              <tr>
                <td colSpan={6} className="center bold small">Description (Said to contain)</td>
                <td className="bold small nowrap">FREIGHT</td>
                <td className="right small">{fmt(bilty.freight)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={6} style={{height:'45px',verticalAlign:'top'}}>{bilty.description}</td>
                <td className="bold small nowrap">A.O.C. %</td>
                <td className="right small">{bilty.aoc_percent || 0}%</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={4} rowSpan={2} style={{verticalAlign:'top'}}>
                  <div className="center bold small" style={{borderBottom:'1px solid #000',paddingBottom:'2px',marginBottom:'3px'}}>Dimension Of Consignment (if Bulky/ODC)</div>
                  <table className="b-table" style={{margin:0}}>
                    <tbody>
                      <tr className="bold center small">
                        <td>Length</td><td>Width</td><td>Height</td><td>No. Of Pkgs.</td><td>Total CFT/CMT</td>
                      </tr>
                      <tr className="center small">
                        <td>{bilty.length || ''}</td><td>{bilty.width || ''}</td><td>{bilty.height || ''}</td><td>{bilty.no_of_pkgs_dimension || ''}</td><td>{bilty.total_cft_cmt || bilty.cft_cmt || ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td colSpan={2} className="small nowrap"><span className="bold">Distance</span> <span style={{float:'right'}}><span className="bold">Kms.</span></span></td>
                <td className="bold small nowrap">EOV CHARGES</td>
                <td className="right small">{fmt(bilty.eov_charges)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={2} rowSpan={3} style={{verticalAlign:'top',padding:'3px'}}>
                  <div className="center bold small" style={{borderBottom:'1px solid #000',paddingBottom:'2px',marginBottom:'3px'}}>Private Marks</div>
                  <div className="small" style={{minHeight:'25px'}}>{bilty.private_marks || ''}</div>
                </td>
                <td colSpan={2} rowSpan={3} style={{verticalAlign:'top',padding:'3px'}}>
                  <div className="small"><span className="bold">In case of Paid Consignment/Advance Payment Specify</span></div>
                  <div className="small" style={{marginTop:'4px'}}><span className="bold">M.R.No. :</span> {bilty.mr_no || ''}</div>
                  <div className="small"><span className="bold">Date :</span> {fmtDate(bilty.mr_date)}</div>
                  <div className="small"><span className="bold">Amount :</span></div>
                  <div className="small bold center" style={{marginTop:'4px'}}>LOAD TYPE<br/>{bilty.load_type || 'FULL LOAD'}</div>
                </td>
                <td className="bold small nowrap">COVER CHARGES</td>
                <td className="right small">{fmt(bilty.cover_charges)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="bold small nowrap">MATERIAL MGMT CH</td>
                <td className="right small">{fmt(bilty.material_mgmt_ch || bilty.material_charges || 0)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="bold small nowrap">COLLECTION CHARGES</td>
                <td className="right small">{fmt(bilty.collection_charges)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={6} rowSpan={2} style={{verticalAlign:'bottom',padding:'3px'}}>
                  <div className="small"><span className="bold">E WAY BILL No.:</span> {bilty.eway_bill_no || ''}</div>
                  <div className="small" style={{float:'right'}}><span className="bold">Valid upto</span> {fmtDate(bilty.eway_valid_upto)}</div>
                </td>
                <td className="bold small nowrap">DOOR DLY CHARGES</td>
                <td className="right small">{fmt(bilty.door_dly_charges || bilty.door_delivery || 0)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="bold small nowrap">WITH PASS/CC ATTACH CH.</td>
                <td className="right small">{fmt(bilty.pass_cc_charges || bilty.with_pass_cc || 0)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={7} className="small bold nowrap">To Pay/Paid/TBB Amount Rs. (in words) TBB</td>
                <td className="bold small nowrap">ENROUTE CHARGES</td>
                <td className="right small">{fmt(bilty.enroute_charges)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={7} rowSpan={3} style={{verticalAlign:'top',padding:'3px'}}>
                  <div className="small"><span className="bold">Declared value of goods: Rs.</span> {bilty.declared_value || 0}</div>
                  <div className="small" style={{marginTop:'3px'}}><span className="bold">Basis of Booking: (1) To Pay (3) Paid (2) To be</span></div>
                  <div className="small" style={{marginTop:'3px'}}><span className="bold">Billed at with M/s</span> {bilty.billed_at || ''}</div>
                </td>
                <td className="bold small nowrap">STATISTICAL CHARGES</td>
                <td className="right small">{fmt(bilty.statistical_charges)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="bold small nowrap">MISC. CHARGES</td>
                <td className="right small">{fmt(bilty.misc_charges)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="bold small center nowrap" style={{fontSize:'11px'}}>GRAND TOTAL</td>
                <td className="right bold" style={{fontSize:'12px'}}>{fmt(bilty.grand_total)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          {/* ===== ROW 14: GST + SIGNATURE ===== */}
          <table className="b-table">
            <tbody>
              <tr>
                <td style={{width:'65%',verticalAlign:'top',padding:'8px 5px'}}>
                  <div className="small bold">GST Through : CONSIGNOR/CONSIGNEE/ <span className="bold" style={{fontSize:'12px'}}>N.B.T.C:</span> <span className="red-text">{bilty.gst_through || ''}</span></div>
                  <div className="red-text small" style={{marginTop:'15px',marginLeft:'100px'}}>
                    <b>• Payment should be made only through A/c Payee Cheque / D.D. /in favour of</b>
                  </div>
                </td>
                <td style={{width:'35%',textAlign:'center',verticalAlign:'bottom',padding:'8px 5px'}}>
                  <div className="red-text bold" style={{fontSize:'16px',marginBottom:'30px'}}>Bharat Transport Company</div>
                  <div style={{borderTop:'1px solid #000',paddingTop:'4px',fontSize:'10px'}}>Signature of Booking Official</div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>

        {/* Action Buttons */}
        <div className="no-print" style={{maxWidth:'210mm',margin:'20px auto',display:'flex',gap:'15px',justifyContent:'center'}}>
          <button 
            onClick={() => window.print()} 
            style={{background:'#2563eb',color:'white',fontWeight:'bold',padding:'12px 32px',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer',boxShadow:'0 4px 12px rgba(37,99,235,0.3)'}}
          >
            🖨️ Print Bilty
          </button>
          <button 
            onClick={() => window.history.back()} 
            style={{background:'#4b5563',color:'white',fontWeight:'bold',padding:'12px 32px',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer',boxShadow:'0 4px 12px rgba(75,85,99,0.3)'}}
          >
            ← Back
          </button>
        </div>
      </div>
    </>
  )
}
