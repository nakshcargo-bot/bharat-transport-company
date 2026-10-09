import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function BiltyPrint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [bilty, setBilty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const lrNo = searchParams.get('lr_no')

  useEffect(() => {
    if (!lrNo) { navigate('/consignments'); return }
    fetchBiltyData(lrNo)
  }, [lrNo, navigate])

  const fetchBiltyData = async (lrNo) => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
      const res = await fetch(`${apiUrl}/api/consignments`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const foundBilty = data.data.find(b => b.lr_no === lrNo)
      if (!foundBilty) throw new Error('Bilty not found')
      setBilty(foundBilty)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handlePrint = () => window.print()

  const handleWhatsApp = () => {
    if (!bilty) return
    const msg = `🚛 *BILTY DETAILS*%0A%0A` +
      `📋 LR No: ${bilty.lr_no}%0A` +
      `📅 Date: ${bilty.lr_date || 'N/A'}%0A` +
      `👤 Consignor: ${bilty.consignor_name || 'N/A'}%0A` +
      `📍 From: ${bilty.from_name || 'N/A'}%0A` +
      `👤 Consignee: ${bilty.consignee_name || 'N/A'}%0A` +
      `📍 To: ${bilty.to_name || 'N/A'}%0A` +
      `💰 Freight: ₹${bilty.freight || '0'}%0A` +
      `💵 Grand Total: ₹${bilty.grand_total || '0'}%0A%0A` +
      `— Bharat Transport Company`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleEmail = () => {
    if (!bilty) return
    const subject = `Bilty Details - ${bilty.lr_no}`
    const body = `Dear Sir/Madam,%0D%0A%0D%0APlease find the Bilty details below:%0D%0A%0D%0A` +
      `LR No: ${bilty.lr_no}%0D%0A` +
      `Date: ${bilty.lr_date || 'N/A'}%0D%0A` +
      `Consignor: ${bilty.consignor_name || 'N/A'}%0D%0A` +
      `Consignee: ${bilty.consignee_name || 'N/A'}%0D%0A` +
      `Grand Total: Rs.${bilty.grand_total || '0'}%0D%0A%0D%0A` +
      `— Bharat Transport Company`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div></div>
  if (error || !bilty) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-red-600 mb-4">{error || 'Bilty not found'}</p>
        <button onClick={() => navigate('/consignments')} className="px-4 py-2 bg-blue-600 text-white rounded">← Back</button>
      </div>
    </div>
  )

  const copies = [
    { label: 'CONSIGNOR COPY', theme: 'consignor' },
    { label: 'CONSIGNEE COPY', theme: 'consignee' },
    { label: 'LORRY COPY', theme: 'lorry' },
    { label: 'HO COPY', theme: 'ho' },
  ]

  const themes = {
    consignor: { primary: '#0d47a1', bgAccent: '#e3f2fd' },
    consignee: { primary: '#b71c1c', bgAccent: '#ffebee' },
    lorry: { primary: '#1b5e20', bgAccent: '#e8f5e9' },
    ho: { primary: '#e65100', bgAccent: '#fff3e0' },
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Action Bar */}
      <div className="bg-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
          <button onClick={() => navigate('/consignments')} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">← Back to List</button>
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">🖨️ Print / Save PDF</button>
            <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">📱 WhatsApp</button>
            <button onClick={handleEmail} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">📧 Email</button>
          </div>
        </div>
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-blue-800">
          💡 "Print / Save PDF" dabao → "Save as PDF" select karo → A4 PDF ban jayega!
        </div>
      </div>

      {/* A4 Content - 4 Copies */}
      <div className="max-w-[210mm] mx-auto my-6 bg-white shadow-lg print:shadow-none print:my-0">
        {copies.map((copy, idx) => {
          const theme = themes[copy.theme]
          return (
            <div
              key={idx}
              className="bilty-container"
              style={{
                width: '190mm',
                minHeight: '250mm',
                background: '#fff',
                margin: '10px auto',
                border: '2px solid #000',
                padding: '4mm',
                pageBreakAfter: idx < copies.length - 1 ? 'always' : 'auto',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                boxSizing: 'border-box'
              }}
            >
              {/* Watermark */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%) rotate(-35deg)',
                fontSize: '80px', fontWeight: 900,
                fontFamily: "'Arial Black', Arial, sans-serif",
                color: 'rgba(100,100,100,0.16)',
                letterSpacing: '12px', zIndex: 11,
                pointerEvents: 'none', userSelect: 'none'
              }}>BTC</div>

              {/* Header */}
              <div style={{
                textAlign: 'center', borderBottom: '1.5px solid #000',
                padding: '5px 0', background: theme.bgAccent,
                position: 'relative', zIndex: 2
              }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: theme.primary }}>BHARAT TRANSPORT COMPANY</h1>
                <p style={{ margin: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>Head Office: Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan 331023</p>
                <p style={{ margin: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>GST NO: 08CMRPP0955N1Z5 | PAN NO: CMRPP0955N</p>
              </div>

              {/* Copy Label */}
              <div style={{ textAlign: 'center', margin: '5px 0', position: 'relative', zIndex: 2 }}>
                <div style={{
                  border: '1px solid #000', padding: '2px 20px', fontWeight: 'bold',
                  display: 'inline-block', background: theme.bgAccent, fontSize: '11px'
                }}>Goods Carried At Owner's Risk</div>
                <br />
                <div style={{
                  border: `2px solid ${theme.primary}`, padding: '2px 25px',
                  fontWeight: 'bold', display: 'inline-block', fontSize: '14px',
                  color: theme.primary, minWidth: '200px', background: 'rgba(255,255,255,0.9)'
                }}>{copy.label}</div>
              </div>

              {/* Top Grid - Parties + Route */}
              <div style={{ display: 'flex', borderBottom: '1.5px solid #000', position: 'relative', zIndex: 2 }}>
                {/* Left - Parties */}
                <div style={{ width: '58%', borderRight: '1.5px solid #000', padding: '5px' }}>
                  {/* Consignor */}
                  <div style={{ border: '1px solid #000', padding: '5px', marginBottom: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.9)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '10px', textDecoration: 'underline', display: 'block', marginBottom: '2px', color: theme.primary }}>CONSIGNOR:</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '3px' }}>M/s.</span>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', width: '85%', textTransform: 'uppercase', paddingLeft: '5px' }}>{bilty.consignor_name || 'N/A'}</div>
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>{bilty.consignor_address || ''}</div>
                    <div style={{ borderBottom: '1px dotted #666', padding: '2px', fontSize: '12px', fontWeight: 600 }}>GST: {bilty.consignor_gst || 'N/A'}</div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Inv No: <span style={{ borderBottom: '1px dotted #666', padding: '0 20px' }}>{bilty.invoice_no || ''}</span></div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Date: <span style={{ borderBottom: '1px dotted #666', padding: '0 15px' }}>{bilty.invoice_date || ''}</span></div>
                    </div>
                  </div>
                  {/* Consignee */}
                  <div style={{ border: '1px solid #000', padding: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.9)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '10px', textDecoration: 'underline', display: 'block', marginBottom: '2px', color: theme.primary }}>CONSIGNEE:</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '3px' }}>M/s.</span>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', width: '85%', textTransform: 'uppercase', paddingLeft: '5px' }}>{bilty.consignee_name || 'N/A'}</div>
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>{bilty.consignee_address || ''}</div>
                    <div style={{ borderBottom: '1px dotted #666', padding: '2px', fontSize: '12px', fontWeight: 600 }}>GST: {bilty.consignee_gst || 'N/A'}</div>
                    <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 'bold' }}>P.O. NO: <span style={{ borderBottom: '1px dotted #666', padding: '0 30px' }}>{bilty.po_no || ''}</span></div>
                  </div>
                </div>

                {/* Right - Route */}
                <div style={{ width: '42%', padding: '5px', background: 'rgba(250,250,250,0.7)' }}>
                  <div style={{ border: `1.5px solid ${theme.primary}`, padding: '4px', textAlign: 'center', marginBottom: '5px', background: 'rgba(255,255,255,0.95)' }}>
                    <label style={{ color: theme.primary, fontWeight: 'bold', fontSize: '11px' }}>CONSIGNMENT NO:</label>
                    <div style={{ fontWeight: 'bold', fontSize: '20px', textAlign: 'center' }}>{bilty.lr_no}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '11px', width: '90px' }}>DATE:</label>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{bilty.lr_date ? new Date(bilty.lr_date).toLocaleDateString('en-IN') : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '11px', width: '90px' }}>FROM:</label>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{bilty.from_name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '11px', width: '90px' }}>TO:</label>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{bilty.to_name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '11px', width: '90px' }}>LORRY NO:</label>
                    <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{bilty.lorry_no || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '11px', width: '90px' }}>DRIVER PH:</label>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{bilty.driver_mobile || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', border: `1.5px solid ${theme.primary}`, padding: '4px', background: 'rgba(255,255,255,0.7)' }}>
                    <label style={{ color: theme.primary, fontWeight: 'bold', fontSize: '10px', width: '100px' }}>DELIVERY TYPE:</label>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{bilty.delivery_type || 'DOOR DELIVERY'}</span>
                  </div>
                </div>
              </div>

              {/* Item Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '3px', position: 'relative', zIndex: 2 }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '4px', background: theme.bgAccent, fontSize: '11px' }}>Pkgs</th>
                    <th style={{ border: '1px solid #000', padding: '4px', background: theme.bgAccent, fontSize: '11px' }}>Method</th>
                    <th style={{ border: '1px solid #000', padding: '4px', background: theme.bgAccent, fontSize: '11px' }}>HSN</th>
                    <th style={{ border: '1px solid #000', padding: '4px', background: theme.bgAccent, fontSize: '11px' }}>Act Wt.</th>
                    <th style={{ border: '1px solid #000', padding: '4px', background: theme.bgAccent, fontSize: '11px' }}>Chg Wt.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', background: 'rgba(255,255,255,0.9)' }}>{bilty.no_of_packages || '0'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', background: 'rgba(255,255,255,0.9)' }}>{bilty.method_of_packing || 'N/A'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', background: 'rgba(255,255,255,0.9)' }}>{bilty.hsn_code || 'N/A'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', background: 'rgba(255,255,255,0.9)' }}>{bilty.actual_weight || '0'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', background: 'rgba(255,255,255,0.9)' }}>{bilty.charged_weight || '0'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Middle Container */}
              <div style={{ display: 'flex', borderTop: '1.5px solid #000', marginTop: '5px', position: 'relative', zIndex: 2 }}>
                {/* Left Column */}
                <div style={{ width: '42%', borderRight: '1.5px solid #000', padding: '5px' }}>
                  <div style={{ border: '1px solid #000', padding: '10px 5px 5px 5px', marginBottom: '8px', position: 'relative', background: 'rgba(255,255,255,0.9)' }}>
                    <label style={{ position: 'absolute', top: '-8px', left: '8px', background: '#fff', padding: '0 4px', fontWeight: 'bold', fontSize: '9px', color: theme.primary }}>DESCRIPTION</label>
                    <div style={{ fontSize: '11px', fontWeight: 600, minHeight: '35px' }}>{bilty.description || 'N/A'}</div>
                  </div>
                  <div style={{ border: '1px solid #000', padding: '10px 5px 5px 5px', marginBottom: '8px', position: 'relative', background: 'rgba(255,255,255,0.9)' }}>
                    <label style={{ position: 'absolute', top: '-8px', left: '8px', background: '#fff', padding: '0 4px', fontWeight: 'bold', fontSize: '9px', color: theme.primary }}>E-WAY BILL NO.</label>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{bilty.eway_bill_no || 'N/A'}</div>
                  </div>
                  <div style={{ border: '1px solid #000', marginBottom: '8px', background: 'rgba(255,255,255,0.9)' }}>
                    <div style={{ background: theme.bgAccent, textAlign: 'center', fontSize: '9px', fontWeight: 'bold', padding: '2px', display: 'flex', justifyContent: 'space-around' }}>
                      <span>L</span><span>W</span><span>H</span><span>PACKGE</span>
                    </div>
                    <table style={{ width: '100%', borderTop: '1px solid #000' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px' }}>{bilty.length || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px' }}>{bilty.width || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px' }}>{bilty.height || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>{bilty.cft_cmt || '0'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ border: '1px solid #000', padding: '10px 5px 5px 5px', position: 'relative', marginBottom: '8px', background: 'rgba(255,255,255,0.9)' }}>
                    <label style={{ position: 'absolute', top: '-8px', left: '8px', background: '#fff', padding: '0 4px', fontWeight: 'bold', fontSize: '9px', color: theme.primary }}>VALUATION</label>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Value Rs: <span style={{ fontSize: '14px', fontWeight: 900 }}>{bilty.declared_value || '0'}</span></div>
                  </div>
                  <div style={{ border: `1.5px solid ${theme.primary}`, padding: '8px 5px', marginTop: '5px', background: 'rgba(255,255,255,0.95)' }}>
                    <strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px', textDecoration: 'underline', color: theme.primary }}>BASIS OF BOOKING:</strong>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>Bill M/s: <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{bilty.basis_party || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, marginTop: '8px', borderTop: '1px dashed #666', paddingTop: '8px' }}>
                      <span>{bilty.basis_booking === 'TO PAY' ? '☑' : '☐'} TO PAY</span>
                      <span>{bilty.basis_booking === 'PAID' ? '☑' : '☐'} PAID</span>
                      <span>{bilty.basis_booking === 'TO BB' ? '☑' : '☐'} TO BB</span>
                    </div>
                  </div>
                </div>

                {/* Center Column */}
                <div style={{ width: '28%', borderRight: '1.5px solid #000', padding: '5px' }}>
                  <div style={{ border: '1px solid #000', padding: '10px 5px 5px 5px', marginBottom: '8px', position: 'relative', background: 'rgba(255,255,255,0.9)' }}>
                    <label style={{ position: 'absolute', top: '-8px', left: '8px', background: '#fff', padding: '0 4px', fontWeight: 'bold', fontSize: '9px', color: theme.primary }}>RECEIPT VOUCHER</label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>No: <span style={{ fontWeight: 'bold' }}>{bilty.rv_no || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>Dt: <span style={{ fontWeight: 'bold' }}>{bilty.rv_dt || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>Amt: <span style={{ fontWeight: 'bold' }}>{bilty.rv_am || '0'}</span></div>
                  </div>
                  <div style={{ border: '1px solid #000', padding: '10px 5px 5px 5px', position: 'relative', background: 'rgba(255,255,255,0.9)' }}>
                    <label style={{ position: 'absolute', top: '-8px', left: '8px', background: '#fff', padding: '0 4px', fontWeight: 'bold', fontSize: '9px', color: theme.primary }}>INSURANCE</label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>CO: <span style={{ fontWeight: 'bold' }}>{bilty.insurance_company || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>POL: <span style={{ fontWeight: 'bold' }}>{bilty.policy_no || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>AMT: <span style={{ fontWeight: 'bold' }}>{bilty.insurance_amount || '0'}</span></div>
                  </div>
                </div>

                {/* Right Column - Charges */}
                <div style={{ width: '30%', padding: '5px' }}>
                  {[
                    { label: 'Freight:', value: bilty.freight },
                    { label: 'A.O.C:', value: bilty.aoc_percent },
                    { label: 'Handling:', value: bilty.material_charges },
                    { label: 'Collect:', value: bilty.collection_charges },
                    { label: 'Door Del:', value: bilty.door_delivery },
                    { label: 'Other:', value: bilty.misc_charges },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      <label>{item.label}</label>
                      <span style={{ border: '1px solid #999', padding: '3px 4px', minWidth: '90px', textAlign: 'right', background: '#fff' }}>₹{item.value || '0'}</span>
                    </div>
                  ))}
                  <hr style={{ margin: '5px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', color: theme.primary, fontWeight: 900 }}>
                    <span>TOTAL:</span>
                    <span style={{ border: '2px solid #000', padding: '3px 6px', background: '#ffffcc', minWidth: '90px', textAlign: 'right' }}>₹{bilty.grand_total || '0'}/-</span>
                  </div>
                  <div style={{ border: '1px solid #000', marginTop: '10px', textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.95)' }}>
                    <strong style={{ fontSize: '10px' }}>For BHARAT TRANSPORT COMPANY</strong>
                    <br /><br />
                    <p style={{ borderTop: '1px solid #000', margin: 0, paddingTop: '4px', fontSize: '10px', fontWeight: 'bold' }}>Signature</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '5px', paddingTop: '5px', fontSize: '10px', borderTop: '1px solid #000', position: 'relative', zIndex: 2 }}>
                • Rajgarh (Churu) Jurisdiction. • Owner's risk. • No claim after delivery.
              </div>
            </div>
          )
        })}
      </div>

      {/* Print Styles */}
      <style>{`
        @page { size: A4; margin: 5mm; }
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:my-0 { margin: 0 !important; }
          * { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
