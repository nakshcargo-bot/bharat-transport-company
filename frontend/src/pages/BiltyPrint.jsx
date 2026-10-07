import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BiltyPrint() {
  const location = useLocation()
  const navigate = useNavigate()
  const printRef = useRef()
  const bilty = location.state?.bilty || {}

  const [visibleCopies, setVisibleCopies] = useState({
    CONSIGNOR_COPY: true,
    CONSIGNEE_COPY: true,
    LORRY_COPY: true,
    HO_COPY: true
  })

  useEffect(() => {
    const timer = setTimeout(() => { window.print() }, 800)
    return () => clearTimeout(timer)
  }, [])

  const toggleCopy = (copyId) => {
    setVisibleCopies(prev => ({ ...prev, [copyId]: !prev[copyId] }))
  }

  const copies = [
    { label: "CONSIGNOR COPY", id: "CONSIGNOR_COPY", theme: "consignor-theme" },
    { label: "CONSIGNEE COPY", id: "CONSIGNEE_COPY", theme: "consignee-theme" },
    { label: "LORRY COPY", id: "LORRY_COPY", theme: "lorry-theme" },
    { label: "HO COPY", id: "HO_COPY", theme: "ho-theme" }
  ]

  // ✅ FIX: Date formatter - ISO string ko readable format me convert kare
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    } catch (e) {
      return dateStr
    }
  }

  // ✅ FIX: Number formatter
  const formatNum = (val) => {
    if (val === undefined || val === null || val === '') return ''
    const num = parseFloat(val)
    if (isNaN(num)) return val
    return num.toLocaleString('en-IN')
  }

  // ✅ FIX: EXACT values from database - no calculation, no modification
  const freight = bilty.freight || 0
  const aocPercent = bilty.aoc_percent || 0
  const aocAmount = bilty.aoc_amount || ((parseFloat(bilty.freight || 0) * parseFloat(bilty.aoc_percent || 0)) / 100)
  const handling = bilty.material_mgmt_ch || bilty.handling_charges || 0
  const collect = bilty.collection_charges || 0
  const doorDly = bilty.door_dly_charges || 0
  const other = bilty.misc_charges || bilty.other_charges || 0
  const grandTotal = bilty.grand_total || (parseFloat(freight || 0) + parseFloat(aocAmount || 0) + parseFloat(handling || 0) + parseFloat(collect || 0) + parseFloat(doorDly || 0) + parseFloat(other || 0))

  const displayTotal = formatNum(grandTotal) + (grandTotal ? "/-" : "")

  const isPaid = bilty.basis_booking === 'PAID' || bilty.payment_status === 'Paid'
  const mrNo = bilty.mr_no || ''

  // ✅ FIX: Pkgs - check all possible field names
  const pkgs = bilty.packages || bilty.no_of_packages || bilty.pkgs || bilty.no_of_pkgs || ''
  const method = bilty.method_of_packing || bilty.packing_method || bilty.packing || ''
  const hsn = bilty.hsn_code || bilty.hsn || ''
  const actualWt = bilty.actual_weight || bilty.weight || bilty.act_wt || ''
  const chargedWt = bilty.charged_weight || bilty.chg_wt || ''

  // ✅ FIX: Description - check all possible field names
  const description = bilty.material_desc || bilty.description || bilty.material_description || bilty.goods_desc || ''

  // ✅ FIX: Receipt Voucher
  const rvNo = bilty.rv_no || bilty.receipt_voucher_no || bilty.rv_number || ''
  const rvDt = bilty.rv_dt || bilty.rv_date || bilty.receipt_voucher_date || ''
  const rvAmt = bilty.rv_am || bilty.rv_amount || bilty.receipt_voucher_amount || ''

  // ✅ FIX: Insurance
  const insuranceCo = bilty.insurance_company || bilty.insurance_co || bilty.insurer || ''
  const policyNo = bilty.policy_no || bilty.insurance_policy || ''
  const insuranceAmt = bilty.insurance_amount || bilty.insurance_amt || ''

  const autoResize = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => {
    document.querySelectorAll('.auto-expand').forEach(el => autoResize(el))
  }, [bilty])

  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f0f0; padding: 0; margin: 0; }
        :root { --primary-color: #000; --bg-accent: #f8f9ff; }
        .consignor-theme { --primary-color: #0d47a1; --bg-accent: #e3f2fd; }
        .consignee-theme { --primary-color: #b71c1c; --bg-accent: #ffebee; }
        .lorry-theme { --primary-color: #1b5e20; --bg-accent: #e8f5e9; }
        .ho-theme { --primary-color: #e65100; --bg-accent: #fff3e0; }

        .print-controls {
          background: #fff; padding: 15px; text-align: center; border-bottom: 2px solid #333;
          position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .option-group { display: inline-block; margin: 0 10px; font-weight: bold; font-size: 13px; cursor: pointer; }
        .btn-action { padding: 8px 15px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; color: white; }
        .btn-print { background-color: #333; }
        .btn-view { background-color: #0d47a1; }

        .bilty-container { 
          width: 190mm; min-height: 250mm; background: #fff; 
          margin: 10px auto; border: 2px solid #000; padding: 4mm; position: relative;
          page-break-after: always; box-shadow: 0 0 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        /* ✅ FIX: Multiple small repeating watermarks across entire paper */
        .watermark-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          opacity: 0.04;
        }
        .watermark-text {
          position: absolute;
          font-size: 14px;
          font-weight: 900;
          color: #000;
          white-space: nowrap;
          transform: rotate(-35deg);
          letter-spacing: 1px;
        }
        
        .header { text-align: center; border-bottom: 1.5px solid #000; padding: 5px 0; background-color: var(--bg-accent); position: relative; z-index: 1; }
        .header h1 { margin: 0; font-size: 24px; color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px; word-wrap: break-word; }
        .header p { margin: 2px 0; font-size: 11px; font-weight: bold; word-wrap: break-word; }
        
        .top-labels { text-align: center; margin: 5px 0; position: relative; z-index: 1; }
        .risk-label { border: 1px solid #000; padding: 2px 20px; font-weight: bold; display: inline-block; text-transform: uppercase; background: var(--bg-accent) !important; font-size: 11px; color: var(--primary-color); }
        .copy-label { border: 2px solid var(--primary-color); padding: 2px 25px; font-weight: bold; display: inline-block; text-transform: uppercase; font-size: 14px; color: var(--primary-color); min-width: 200px; background: rgba(255,255,255,0.8); margin-left: 10px; }
        
        .top-grid { display: flex; border-bottom: 1.5px solid #000; position: relative; z-index: 1; }
        .left-party { width: 58%; border-right: 1.5px solid #000; padding: 5px; }
        .right-route { width: 42%; padding: 5px; background: rgba(250,250,250,0.4); }
        
        .party-box { border: 1px solid #000; padding: 5px; margin-bottom: 5px; border-radius: 3px; background: rgba(255,255,255,0.6); overflow: hidden; }
        .party-title { font-weight: bold; font-size: 10px; text-decoration: underline; display: block; margin-bottom: 2px; color: var(--primary-color); }
        
        .readonly-input { 
          border: none; border-bottom: 1px dotted #666; padding: 2px; 
          outline: none; font-size: 12px; background: transparent; 
          font-family: inherit; width: 100%; font-weight: 600; color: #000;
        }
        .name-input { 
          font-size: 14px; font-weight: bold; width: 100% !important; 
          text-transform: uppercase; white-space: normal; word-wrap: break-word; 
          overflow-wrap: break-word; min-height: 18px;
        }
        .address-textarea { 
          font-size: 11px; width: 100%; margin-top: 2px; 
          resize: none; overflow: hidden; min-height: 16px; line-height: 1.3; 
          border: none; background: transparent; white-space: pre-wrap; 
          word-wrap: break-word; overflow-wrap: break-word;
        }
        
        .consignment-box { border: 1.5px solid var(--primary-color); padding: 4px; background: rgba(255,255,255,0.7); text-align: center; margin-bottom: 5px; }
        .field-group { display: flex; align-items: center; margin-bottom: 3px; }
        .field-group label { font-weight: bold; font-size: 11px; width: 90px; flex-shrink: 0; }
        .field-group input { flex: 1; min-width: 0; }
        
        .item-table { width: 100%; border-collapse: collapse; margin-top: 3px; position: relative; z-index: 1; table-layout: fixed; }
        .item-table th, .item-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 11px; background: rgba(255,255,255,0.3); word-wrap: break-word; overflow-wrap: break-word; }
        th { background: var(--bg-accent) !important; color: var(--primary-color); }
        
        .middle-container { display: flex; border-top: 1.5px solid #000; margin-top: 5px; position: relative; z-index: 1; }
        .middle-col-left { width: 42%; border-right: 1.5px solid #000; padding: 5px; }
        .middle-col-center { width: 28%; border-right: 1.5px solid #000; padding: 5px; }
        .middle-col-right { width: 30%; padding: 5px; background: rgba(252,252,252,0.4); }
        
        .box-style { border: 1px solid #000; padding: 10px 5px 5px 5px; margin-bottom: 8px; position: relative; background: rgba(255,255,255,0.6); }
        .box-style label { position: absolute; top: -8px; left: 8px; background: rgba(255,255,255,1); padding: 0 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; color: var(--primary-color); }
        .box-style textarea, .box-style input { width: 100%; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; }
        
        .booking-basis-container { border: 1.5px solid var(--primary-color); padding: 8px 5px; margin-top: 5px; background: rgba(255,255,255,0.7); }
        .booking-basis-container strong { font-size: 11px; display: block; margin-bottom: 8px; text-decoration: underline; color: var(--primary-color); }
        .basis-row-new { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-top: 8px; border-top: 1px dashed #666; padding-top: 8px; color: var(--primary-color); }
        
        .charge-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; font-weight: bold; }
        .charge-row span { min-width: 70px; text-align: right; font-weight: bold; border-bottom: 1px solid #999; font-size: 12px; padding: 0 4px; }
        
        .stamp-box-right { border: 1px solid #000; margin-top: 10px; text-align: center; padding: 8px; background: rgba(255,255,255,0.7); }
        .footer-terms { margin-top: 5px; padding-top: 5px; font-size: 10px; line-height: 1.2; border-top: 1px solid #000; position: relative; z-index: 1; word-wrap: break-word; }

        .paid-badge {
          border: 2px solid #16a34a;
          background: #f0fdf4;
          padding: 8px 12px;
          margin: 8px 0;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          position: relative;
          z-index: 1;
        }
        .paid-badge strong { color: #16a34a; font-size: 14px; }
        
        @media print {
          body { background: #fff; }
          .print-controls, .btn-action { display: none !important; }
          .bilty-container { margin: 0; border: 2px solid #000; width: 100%; box-shadow: none; min-height: auto; page-break-after: always; padding: 3mm; }
          .hidden-print { display: none !important; }
        }
      `}</style>

      <div className="print-controls">
        <div style={{marginBottom: '10px'}}>
          {copies.map(copy => (
            <label key={copy.id} className="option-group">
              <input type="checkbox" checked={visibleCopies[copy.id]} onChange={() => toggleCopy(copy.id)} /> {copy.label.replace('_COPY', '')}
            </label>
          ))}
        </div>
        <button className="btn-action btn-print" onClick={() => window.print()}>🖨️ PRINT</button>
        <button className="btn-action btn-view" onClick={() => navigate(-1)}>← BACK</button>
      </div>

      <div ref={printRef}>
        {copies.map(copy => (
          <div key={copy.id} className={`bilty-container ${copy.theme} ${!visibleCopies[copy.id] ? 'hidden-print' : ''}`}>
            
            {/* ✅ FIX: Multiple small repeating watermarks */}
            <div className="watermark-layer">
              {Array.from({ length: 80 }).map((_, i) => {
                const row = Math.floor(i / 8)
                const col = i % 8
                return (
                  <div
                    key={i}
                    className="watermark-text"
                    style={{
                      top: `${row * 12 + 5}%`,
                      left: `${col * 12 + 2}%`,
                    }}
                  >
                    BHARAT TRANSPORT COMPANY
                  </div>
                )
              })}
            </div>

            <div className="header">
              <h1>BHARAT TRANSPORT COMPANY</h1>
              <p>Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan 331023</p>
              <p>GST NO: 08CMRPP0955N1Z5 | PAN NO: CMRPP0955N</p>
            </div>
            <div className="top-labels">
              <div className="risk-label">Goods Carried At Owner's Risk</div>
              <div className="copy-label">{copy.label}</div>
            </div>

            {isPaid && mrNo && (
              <div className="paid-badge">
                <div>
                  <strong>✅ PAID BILTY</strong><br/>
                  <span style={{fontSize: '11px'}}>Payment Received</span>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '10px'}}>MR No:</div>
                  <div style={{fontWeight: 'bold', fontSize: '14px', color: '#16a34a'}}>{mrNo}</div>
                  <div style={{fontSize: '10px'}}>Amount: ₹{formatNum(bilty.grand_total)}</div>
                </div>
              </div>
            )}

            <div className="top-grid">
              <div className="left-party">
                <div className="party-box">
                  <span className="party-title">CONSIGNOR:</span>
                  <span className="ms-text">M/s.</span> 
                  <input type="text" className="readonly-input name-input auto-expand" value={bilty.consignor_name || ''} readOnly />
                  <textarea className="address-textarea auto-expand" value={bilty.consignor_address || ''} readOnly rows="1"></textarea>
                  <input type="text" className="readonly-input" value={bilty.consignor_gst || ''} placeholder="GST No" style={{marginTop:'2px', fontSize:'10px'}} readOnly />
                  <div style={{display: 'flex', gap: '15px', marginTop: '4px', flexWrap: 'wrap'}}>
                    <div style={{display: 'flex', alignItems: 'center', flexGrow: 1}}>
                      <span style={{fontSize: '10px', fontWeight: 'bold'}}>Inv No:</span> 
                      <input type="text" className="readonly-input" value={bilty.invoice_no || ''} style={{marginLeft: '5px'}} readOnly />
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', width: '100px'}}>
                      <span style={{fontSize: '10px', fontWeight: 'bold'}}>Date:</span> 
                      <input type="text" className="readonly-input" value={formatDate(bilty.invoice_date)} style={{marginLeft: '5px'}} readOnly />
                    </div>
                  </div>
                </div>
                <div className="party-box">
                  <span className="party-title">CONSIGNEE:</span>
                  <span className="ms-text">M/s.</span> 
                  <input type="text" className="readonly-input name-input auto-expand" value={bilty.consignee_name || ''} readOnly />
                  <textarea className="address-textarea auto-expand" value={bilty.consignee_address || ''} readOnly rows="1"></textarea>
                  <input type="text" className="readonly-input" value={bilty.consignee_gst || ''} placeholder="GST No" style={{marginTop:'2px', fontSize:'10px'}} readOnly />
                  <div style={{marginTop: '4px'}}>
                    <span style={{fontSize: '10px', fontWeight: 'bold'}}>P.O. NO:</span> 
                    <input type="text" className="readonly-input" value={bilty.po_no || ''} style={{width: '120px'}} readOnly />
                  </div>
                </div>
              </div>
              <div className="right-route">
                <div className="consignment-box">
                  <label style={{color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '11px'}}>CONSIGNMENT NO:</label><br />
                  <input type="text" className="readonly-input" value={bilty.lr_no || '0001'} style={{fontWeight: 'bold', fontSize: '20px', border:'none', textAlign:'center', width: '100%'}} readOnly />
                </div>
                <div className="field-group"><label>DATE:</label><input type="text" className="readonly-input" value={formatDate(bilty.lr_date)} style={{width: '120px'}} readOnly /></div>
                <div className="field-group"><label>FROM:</label><input type="text" className="readonly-input" value={bilty.from_name || ''} readOnly /></div>
                <div className="field-group"><label>TO:</label><input type="text" className="readonly-input" value={bilty.to_name || ''} readOnly /></div>
                <div className="field-group"><label>LORRY NO:</label><input type="text" className="readonly-input" value={bilty.lorry_no || ''} style={{fontWeight: 'bold', textTransform:'uppercase', color:'var(--primary-color)'}} readOnly /></div>
                <div className="field-group"><label>DRIVER PH:</label><input type="text" className="readonly-input" value={bilty.driver_mobile || bilty.driver_phone || ''} readOnly /></div>
                <div className="field-group" style={{marginTop: '5px', border: '1.5px solid var(--primary-color)', padding: '4px', background: 'rgba(255,255,255,0.7)'}}>
                  <label style={{color: 'var(--primary-color)', width: '100px', fontWeight:'bold', fontSize:'10px'}}>DELIVERY TYPE:</label>
                  <input type="text" className="readonly-input" value={bilty.delivery_type || 'GODOWN / DOOR'} style={{fontWeight: 'bold', fontSize:'11px'}} readOnly />
                </div>
              </div>
            </div>

            <table className="item-table">
              <thead>
                <tr>
                  <th style={{width: '10%'}}>Pkgs</th>
                  <th style={{width: '20%'}}>Method</th>
                  <th style={{width: '15%'}}>HSN</th>
                  <th style={{width: '25%'}}>Act Wt.</th>
                  <th style={{width: '30%'}}>Chg Wt.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" className="readonly-input" value={pkgs} style={{textAlign:'center', fontWeight: 'bold'}} readOnly /></td>
                  <td><input type="text" className="readonly-input" value={method} style={{textAlign:'center'}} readOnly /></td>
                  <td><input type="text" className="readonly-input" value={hsn} style={{textAlign:'center'}} readOnly /></td>
                  <td><input type="text" className="readonly-input" value={actualWt} style={{textAlign:'center'}} readOnly /></td>
                  <td><input type="text" className="readonly-input" value={chargedWt} style={{textAlign:'center'}} readOnly /></td>
                </tr>
              </tbody>
            </table>

            <div className="middle-container">
              <div className="middle-col-left">
                <div className="box-style">
                  <label>DESCRIPTION</label>
                  <textarea className="readonly-input auto-expand" value={description} style={{minHeight:'35px'}} readOnly rows="2"></textarea>
                </div>
                <div className="box-style">
                  <label>E-WAY BILL NO.</label>
                  <input type="text" className="readonly-input auto-expand" value={bilty.eway_bill_no || ''} style={{fontWeight: 'bold'}} readOnly />
                </div>
                <div style={{border: '1px solid #000', marginBottom:'8px'}}>
                  <div style={{background: 'var(--bg-accent)', textAlign: 'center', fontSize: '9px', fontWeight: 'bold', padding: '2px'}}>DIMENSIONS (L x W x H = CFT)</div>
                  <table style={{width: '100%'}}>
                    <tbody>
                      <tr>
                        <td style={{border: '1px solid #000', padding: '2px'}}><input type="text" className="readonly-input" value={bilty.length || '0.00'} style={{textAlign:'center', fontSize:'10px'}} readOnly /></td>
                        <td style={{border: '1px solid #000', padding: '2px'}}><input type="text" className="readonly-input" value={bilty.width || '0.00'} style={{textAlign:'center', fontSize:'10px'}} readOnly /></td>
                        <td style={{border: '1px solid #000', padding: '2px'}}><input type="text" className="readonly-input" value={bilty.height || '0.00'} style={{textAlign:'center', fontSize:'10px'}} readOnly /></td>
                        <td style={{border: '1px solid #000', padding: '2px'}}><input type="text" className="readonly-input" value={bilty.total_cft || ''} style={{textAlign:'center', fontWeight:'bold', fontSize:'10px'}} readOnly /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="box-style">
                  <label>VALUATION</label>
                  <div style={{fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center'}}>
                    Value Rs: 
                    <input type="text" className="readonly-input" value={bilty.declared_value || ''} style={{width: '60%', fontSize: '14px', fontWeight: '900', marginLeft: '5px', borderBottom: '1px solid #000'}} readOnly />
                  </div>
                </div>
                <div className="booking-basis-container">
                  <strong>BASIS OF BOOKING:</strong>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap'}}>
                    <span style={{fontSize: '10px', fontWeight: 'bold'}}>Bill M/s:</span>
                    <input type="text" className="readonly-input auto-expand" value={bilty.basis_party || bilty.consignor_name || ''} placeholder="Party Name..." style={{flexGrow: 1, borderBottom: '1px solid #000', minWidth: '100px'}} readOnly />
                  </div>
                  <div className="basis-row-new">
                    <label className="basis-item" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <input type="radio" name={`basis_${copy.id}`} checked={(bilty.basis_booking || 'TO PAY') === 'TO PAY'} readOnly /> TO PAY
                    </label>
                    <label className="basis-item" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <input type="radio" name={`basis_${copy.id}`} checked={bilty.basis_booking === 'PAID'} readOnly /> PAID
                    </label>
                    <label className="basis-item" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <input type="radio" name={`basis_${copy.id}`} checked={bilty.basis_booking === 'TO BB'} readOnly /> TO BB
                    </label>
                  </div>
                </div>
              </div>

              <div className="middle-col-center">
                <div className="box-style">
                  <label>RECEIPT VOUCHER</label>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}> 
                    No: <input type="text" className="readonly-input auto-expand" value={rvNo} style={{width:'60%', borderBottom:'1px solid #000', fontWeight: 'bold'}} readOnly /> 
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}> 
                    Dt: <input type="text" className="readonly-input" value={formatDate(rvDt)} style={{width:'60%', borderBottom:'1px solid #000'}} readOnly /> 
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}> 
                    Amt: <input type="text" className="readonly-input" value={rvAmt || displayTotal} style={{width:'60%', borderBottom:'1px solid #000'}} readOnly /> 
                  </div>
                </div>
                <div className="box-style">
                  <label>INSURANCE</label>
                  <p style={{fontSize:'8px', fontWeight:'bold', color:'#555', marginBottom:'4px'}}>INSURED / NOT INSURED BY CONSIGNOR.</p>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}> 
                    CO: <input type="text" className="readonly-input auto-expand" value={insuranceCo} style={{width:'60%', borderBottom:'1px solid #000'}} readOnly /> 
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}> 
                    POL: <input type="text" className="readonly-input auto-expand" value={policyNo} style={{width:'60%', borderBottom:'1px solid #000'}} readOnly /> 
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}> 
                    AMT: <input type="text" className="readonly-input" value={insuranceAmt} style={{width:'60%', borderBottom:'1px solid #000'}} readOnly /> 
                  </div>
                </div>
              </div>

              <div className="middle-col-right">
                {/* ✅ FIX: Show EXACT values from database - no calculation */}
                <div className="charge-row"><label>Freight:</label> <span>{freight ? formatNum(freight) : '-'}</span></div>
                <div className="charge-row"><label>A.O.C ({aocPercent}%):</label> <span>{aocAmount ? formatNum(aocAmount) : '-'}</span></div>
                <div className="charge-row"><label>Handling:</label> <span>{handling ? formatNum(handling) : '-'}</span></div>
                <div className="charge-row"><label>Collect:</label> <span>{collect ? formatNum(collect) : '-'}</span></div>
                <div className="charge-row"><label>Door Del:</label> <span>{doorDly ? formatNum(doorDly) : '-'}</span></div>
                <div className="charge-row"><label>Other:</label> <span>{other ? formatNum(other) : '-'}</span></div>
                <hr style={{border: '1px solid #000', margin: '4px 0'}} />
                <div className="charge-row" style={{fontSize: '15px', color: 'var(--primary-color)', fontWeight: '900', borderTop: '2px solid #000', paddingTop: '4px'}}>
                  <span>TOTAL:</span> <span style={{minWidth: '70px', textAlign: 'right'}}>{displayTotal}</span>
                </div>
                <div className="stamp-box-right">
                  <strong style={{fontSize: '10px', color:'var(--primary-color)'}}>For BHARAT TRANSPORT COMPANY</strong><br /><br />
                  <p style={{borderTop: '1px solid #000', margin:0, paddingTop: '4px', fontSize: '10px', fontWeight:'bold'}}>Signature</p>
                </div>
              </div>
            </div>

            <div className="footer-terms">
              • Rajgarh (Churu) Jurisdiction. • Owner's risk. • No claim after delivery. • Subject to local jurisdiction only.
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
