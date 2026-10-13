import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default function BillEntry() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [selectedInvoices, setSelectedInvoices] = useState([])
  
  // Auto-fill LR search state
  const [lrSearch, setLrSearch] = useState('')

  const [billData, setBillData] = useState({
    invNo: 'BTC/26-27/001',
    billDate: new Date().toISOString().split('T')[0],
    partyName: '',
    partyGst: '',
    fromAddr: '',
    toAddr: '',
    vehNo: '',
    advInput: 0,
    advCash: '',
    advChq: '',
    advUpi: '',
    gstPer: 0,
    remarks: '',
    rows: [{ date: '', lr: '', inv: '', from: '', to: '', wt: '', load: '', unload: '', oth: '', freight: '', total: '0.00' }]
  })

  const COMPANY = {
    name: "BHARAT TRANSPORT COMPANY",
    gst: "08CMRPP0955N1Z5",
    pan: "CMRPP0955N",
    address: "Ward No. 17, Purana Falsa, Pilani Road, Rajgarh, Churu, Rajasthan - 331023",
    phone: "+91 9680264231",
    email: "bharattrsnportcompany@gmail.com",
    bankName: "HDFC BANK",
    accountNo: "50200112184634",
    ifsc: "HDFC0002795",
    branch: "RAJGARH"
  }

  useEffect(() => {
    fetchNextBillNo()
    fetchHistory()
  }, [])

  const fetchNextBillNo = async () => {
    try {
      // Backend se next number lao, ya local storage se
      const res = await api.get('/api/bills/next-serial').catch(() => ({ data: { nextNo: '001' } }))
      const nextNum = (res.data.nextNo || '1').toString().padStart(3, '0')
      setBillData(prev => ({ ...prev, invNo: `BTC/26-27/${nextNum}` }))
    } catch (e) {
      setBillData(prev => ({ ...prev, invNo: 'BTC/26-27/001' }))
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/bills')
      setHistoryList(res.data.data || [])
    } catch (e) {
      setHistoryList(JSON.parse(localStorage.getItem('btc_history') || '[]'))
    }
  }

  // 🔍 AUTO-FILL FROM BILTY
  const handleLrSearch = async (e) => {
    const val = e.target.value
    setLrSearch(val)
    if (val.length >= 3) {
      try {
        setLoading(true)
        const res = await api.get(`/api/consignments?lr_no=${val}`)
        if (res.data && res.data.data && res.data.data.length > 0) {
          const bilty = res.data.data[0]
          setBillData(prev => ({
            ...prev,
            partyName: bilty.consignor_name || prev.partyName,
            partyGst: bilty.consignor_gst || prev.partyGst,
            fromAddr: bilty.from_address || prev.fromAddr,
            toAddr: bilty.to_address || prev.toAddr,
            vehNo: bilty.vehicle_no || prev.vehNo,
            rows: prev.rows.map((row, idx) => idx === 0 ? {
              ...row,
              date: bilty.date ? bilty.date.split('T')[0] : '',
              lr: bilty.lr_no,
              inv: bilty.invoice_no,
              from: bilty.from_name,
              to: bilty.to_name,
              wt: bilty.weight_mt,
              load: '',       // Khali rakha
              unload: '',     // Khali rakha
              oth: '',        // Khali rakha
              freight: '',    // Khali rakha (Tum manually daloge)
              total: '0.00'
            } : row)
          }))
        }
      } catch (err) {
        console.error('Bilty not found')
      } finally {
        setLoading(false)
      }
    }
  }

  const updateRow = (index, field, value) => {
    const newRows = [...billData.rows]
    newRows[index][field] = value
    setBillData({ ...billData, rows: newRows })
    calculate()
  }

  const addRow = () => {
    setBillData(prev => ({
      ...prev,
      rows: [...prev.rows, { date: '', lr: '', inv: '', from: '', to: '', wt: '', load: '', unload: '', oth: '', freight: '', total: '0.00' }]
    }))
  }

  const calculate = () => {
    let sub = 0
    billData.rows.forEach(row => {
      const load = parseFloat(row.load) || 0
      const unload = parseFloat(row.unload) || 0
      const oth = parseFloat(row.oth) || 0
      const freight = parseFloat(row.freight) || 0
      const rowTotal = load + unload + oth + freight
      row.total = rowTotal.toFixed(2)
      sub += rowTotal
    })

    const gstA = (sub * parseFloat(billData.gstPer || 0)) / 100
    const grand = sub + gstA
    const adv = parseFloat(billData.advInput) || 0
    const bal = grand - adv

    setBillData(prev => ({
      ...prev,
      subtotal: sub,
      gstAmt: gstA,
      grandtotal: grand,
      balance: bal,
      amountWords: convertToWords(bal)
    }))
  }

  const convertToWords = (num) => {
    if (num <= 0) return "ZERO RUPEES ONLY"
    let n = Math.floor(num)
    const units = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"]
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"]
    
    function getWords(n) {
      let res = ""
      if (n > 99) { res += units[Math.floor(n / 100)] + " HUNDRED "; n %= 100 }
      if (n > 19) { res += tens[Math.floor(n / 10)] + " "; n %= 10 }
      if (n > 0) { res += units[n] + " " }
      return res
    }
    let str = ""
    if (n >= 10000000) { str += getWords(Math.floor(n / 10000000)) + "CRORE "; n %= 10000000 }
    if (n >= 100000) { str += getWords(Math.floor(n / 100000)) + "LAKH "; n %= 100000 }
    if (n >= 1000) { str += getWords(Math.floor(n / 1000)) + "THOUSAND "; n %= 1000 }
    str += getWords(n)
    return str.trim() + " RUPEES ONLY"
  }

  const saveInvoice = async () => {
    if (!billData.partyName) { alert("Party Name zaroori hai!"); return }
    setLoading(true)
    try {
      const payload = { ...billData, totalAmt: billData.grandtotal }
      await api.post('/api/bills', payload)
      alert("✅ Bill Saved Successfully! Bill List me update ho gaya.")
      fetchHistory()
      newBill()
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.error || err.message))
    }
    setLoading(false)
  }

  const newBill = () => {
    if (window.confirm("Generate New Bill?")) {
      setBillData({
        invNo: billData.invNo, // Serial number maintain rahega
        billDate: new Date().toISOString().split('T')[0],
        partyName: '', partyGst: '', fromAddr: '', toAddr: '', vehNo: '',
        advInput: 0, advCash: '', advChq: '', advUpi: '', gstPer: 0, remarks: '',
        rows: [{ date: '', lr: '', inv: '', from: '', to: '', wt: '', load: '', unload: '', oth: '', freight: '', total: '0.00' }]
      })
      setLrSearch('')
      calculate()
    }
  }

  const validateAndPrint = () => {
    if (!billData.partyName) { alert("Party Name zaroori hai!"); return }
    window.print()
  }

  // 📊 EXCEL EXPORT
  const exportExcel = () => {
    const selectedData = historyList.filter(inv => selectedInvoices.includes(inv.id))
    if (selectedData.length === 0) { alert("Pehle select karo!"); return }
    
    let csv = "Invoice No,Date,Party Name,GST Number,Gadi Number,From,To,Total Trips,SubTotal,GST %,GST Amount,Grand Total,Advance,Balance,Remarks\n"
    selectedData.forEach(inv => {
      csv += `"${inv.invNo}","${inv.billDate || inv.date}","${inv.partyName}","${inv.partyGst || 'N/A'}","${inv.vehNo || 'N/A'}","${(inv.fromAddr || '').replace(/"/g, '""')}","${(inv.toAddr || '').replace(/"/g, '""')}","${(inv.rows || []).length}","${inv.subtotal || ''}","${inv.gstPer || 0}","${inv.gstAmt || ''}","${inv.grandtotal || inv.totalAmt}","${inv.advInput || 0}","${inv.balance || ''}","${(inv.remarks || '').replace(/"/g, '""')}"\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `BTC_CA_Excel_GST_Gadi_${new Date().toLocaleDateString()}.csv`
    a.click()
  }

  // 📱 WHATSAPP SHARE
  const shareToCA = () => {
    const selectedData = historyList.filter(inv => selectedInvoices.includes(inv.id))
    if (selectedData.length === 0) { alert("Pehle select karo!"); return }
    
    let text = `*BHARAT TRANSPORT COMPANY - BILLS FOR CA*\n*Date: ${new Date().toLocaleDateString()}*\n*Total Bills: ${selectedData.length}*\n\n`
    let total = 0
    selectedData.forEach((inv, i) => {
      let amt = parseFloat((inv.grandtotal || inv.totalAmt || '0').toString().replace(/[^0-9.]/g, '')) || 0
      total += amt
      text += `${i + 1}. *Party:* ${inv.partyName}\n *GST No:* ${inv.partyGst || 'N/A'}\n *Gadi No:* ${inv.vehNo || 'N/A'}\n *Inv:* ${inv.invNo} | *Date:* ${inv.billDate || inv.date}\n *Amount:* ₹${amt.toLocaleString('en-IN')}\n\n`
    })
    text += `*GRAND TOTAL: Rs. ${total.toLocaleString('en-IN')}*`
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // 📄 PDF GENERATE
  const generateCAPDF = () => {
    const selectedData = historyList.filter(inv => selectedInvoices.includes(inv.id))
    if (selectedData.length === 0) { alert("Pehle select karo!"); return }
    
    const doc = new jsPDF('p', 'mm', 'a4')
    selectedData.forEach((inv, idx) => {
      if (idx > 0) doc.addPage()
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(211, 47, 47)
      doc.text(COMPANY.name, 105, 12, { align: "center" })
      doc.setFontSize(8); doc.setTextColor(0); doc.setFont("helvetica", "normal")
      doc.text(COMPANY.address, 105, 16, { align: "center" })
      doc.setFontSize(9); doc.setFont("helvetica", "bold")
      doc.text(`Mobile: ${COMPANY.phone} | Email: ${COMPANY.email}`, 105, 20, { align: "center" })
      doc.setDrawColor(0); doc.line(10, 22, 200, 22)
      
      doc.setFontSize(10); doc.text(`Invoice No: ${inv.invNo}`, 10, 28); doc.text(`Date: ${inv.billDate || inv.date}`, 150, 28)
      doc.text(`Vehicle No: ${inv.vehNo || 'N/A'}`, 10, 33); doc.text(`GSTIN: ${COMPANY.gst}`, 150, 33)
      doc.setFontSize(11); doc.text(`BILL TO: ${inv.partyName}`, 10, 40)
      doc.setFontSize(9); doc.text(`GST No: ${inv.partyGst || 'N/A'}`, 10, 44)
      
      const tripBody = (inv.rows || []).map(r => [r.date || '', r.lr || '', r.inv || '', r.from || '', r.to || '', r.wt || '', r.load || '0', r.unload || '0', r.oth || '0', r.freight || '0', r.total || '0'])
      doc.autoTable({ 
        startY: 55, 
        head: [['Date', 'LR No.', 'Inv no.', 'From', 'To', 'Wt(MT)', 'Loading', 'Unloading', 'Other', 'Freight', 'Total']], 
        body: tripBody, 
        theme: 'grid', 
        headStyles: { fillColor: [13, 27, 62], fontSize: 7 }, 
        styles: { fontSize: 7, halign: 'center' } 
      })
      
      let finalY = doc.lastAutoTable.finalY + 5
      doc.setFontSize(9); doc.text(`Sub-Total: ${inv.subtotal}`, 130, finalY); finalY += 5
      doc.text(`GST (${inv.gstPer || 0}%): ${inv.gstAmt}`, 130, finalY); finalY += 5
      doc.setFont("helvetica", "bold"); doc.text(`Grand Total: ${inv.grandtotal}`, 130, finalY); finalY += 5
      doc.setFont("helvetica", "normal"); doc.setTextColor(211, 47, 47); doc.text(`Advance: -${inv.advInput || 0}`, 130, finalY); finalY += 5
      doc.setTextColor(46, 125, 50); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(`NET BALANCE: ${inv.balance}`, 130, finalY)
    })
    doc.save(`BTC_Original_Bills_${new Date().toLocaleDateString()}.pdf`)
  }

  const formatINR = (num) => parseFloat(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-200">
      {/* CSS STYLES (Exact match to your HTML) */}
      <style>{`
        :root { --primary: #0d1b3e; --accent: #d32f2f; --bg-light: #f1f4f9; --success: #2e7d32; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #555; margin: 0; padding: 0; }
        .invoice-wrapper { width: 210mm; min-height: 297mm; background: #fff; margin: 20px auto; padding: 8mm; position: relative; box-shadow: 0 0 30px rgba(0,0,0,0.5); page-break-after: always; }
        .copy-tag { text-align: right; font-size: 14px; font-weight: 900; color: var(--accent); margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px solid #ddd; }
        .top-id-header { text-align: right; font-size: 12px; font-weight: 800; color: #000; margin-bottom: 5px; }
        .header { text-align: center; margin-bottom: 5px; }
        .header h1 { margin: 0; font-size: 28px; color: var(--accent); font-weight: 900; }
        .header p { margin: 2px 0; font-size: 11px; color: #333; font-weight: 600; }
        .contact-row { font-size: 12px; font-weight: bold; color: var(--primary); padding-bottom: 8px; margin-bottom: 12px; border-bottom: 3px solid #000; display: flex; justify-content: center; gap: 30px; }
        .info-grid { display: grid; grid-template-columns: 2.1fr 0.9fr; gap: 10px; margin-bottom: 10px; }
        .party-main-box { border: 2px solid var(--primary); border-radius: 6px; overflow: hidden; margin-bottom: 8px;}
        .box-title { background: var(--primary); color: white; padding: 4px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .box-content { padding: 6px; background: #fff; }
        .info-grid textarea, .info-grid input.party-input { width: 100%; border: none; background: transparent; font-size: 12px; font-weight: 700; resize: none; outline: none; }
        .required-field { border-bottom: 1px dashed #ccc!important; margin-bottom: 5px; }
        .meta-side { display: flex; flex-direction: column; }
        .bill-box { border: 2.5px solid var(--primary); background: var(--bg-light); border-radius: 6px; padding: 8px; }
        .meta-field label { font-size: 9px; font-weight: 900; color: var(--primary); text-transform: uppercase; display: block; border-bottom: 1px solid #ccc; margin-bottom: 2px; }
        .inv-no-big { font-size: 15px!important; font-weight: 900!important; color: var(--accent)!important; background: #fff!important; border: 1.2px solid #000!important; margin: 2px 0; border-radius: 4px; padding: 3px 0!important; width: 100%; text-align: center; }
        .meta-field input { width: 100%; border: none; background: transparent; text-align: center; font-size: 13px; font-weight: 900; color: #000; outline: none; }
        .ship-label { font-size: 9px; font-weight: 900; color: var(--accent); text-transform: uppercase; margin-bottom: 2px; display: block; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
        table th { background: var(--primary)!important; color: #fff; padding: 6px 2px; font-size: 9px; text-transform: uppercase; border: 1px solid #fff; }
        table td { border: 1px solid #ccc; padding: 3px 1px; font-size: 10px; text-align: center; }
        table input { width: 100%; border: none; text-align: center; background: transparent; outline: none; font-weight: 600; font-size: 10px; }
        .col-date { width: 7%; }.col-lr { width: 7%; }.col-inv { width: 12%; }.col-from { width: 9%; }.col-to { width: 9%; }.col-wt { width: 7%; }.col-load { width: 9%; }.col-unload { width: 9%; }.col-oth { width: 9%; }.col-freight { width: 9%; }.col-total { width: 13%; }
        .row-total { background: #fffde7!important; color: var(--primary); font-weight: 900!important; }
        .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
        .card { padding: 6px; background: var(--bg-light); border-radius: 6px; text-align: center; border-bottom: 3px solid var(--primary); }
        .card span { font-size: 8px; text-transform: uppercase; font-weight: 900; display: block; }
        .card strong { font-size: 16px; color: var(--primary); }
        .card input { border: none; background: transparent; text-align: center; font-size: 16px; font-weight: 900; color: var(--accent); width: 80%; outline: none; }
        .bottom-layout { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 15px; }
        .left-info-column { display: flex; flex-direction: column; gap: 10px; }
        .bank-details-box, .payment-modes-box { background: var(--bg-light); border: 2px solid var(--primary); padding: 8px; border-radius: 6px; }
        .bank-details-box h4, .payment-modes-box h4 { margin: 0 0 4px; color: var(--primary); font-size: 12px; border-bottom: 1.5px solid #ccc; text-transform: uppercase; }
        .payment-row { display: flex; align-items: center; margin-bottom: 5px; font-size: 11px; font-weight: 800; }
        .payment-row label { width: 110px; color: var(--primary); }
        .payment-row input { flex: 1; border: none; border-bottom: 1px dashed #999; background: transparent; outline: none; font-weight: 900; font-size: 11px; padding: 2px; }
        .calc-table td { text-align: right; padding: 3px 8px; font-size: 13px; border: none; font-weight: 700; }
        .net-payable-row { background: var(--primary)!important; color: #fff; font-weight: 900; }
        .words-right-container { margin-top: 8px; text-align: right; border-top: 1px dashed #ccc; padding-top: 5px; }
        .words-label { font-size: 9px; font-weight: 900; color: var(--accent); }
        .words-input-field { width: 100%; border: none; font-weight: 900; font-size: 11px; text-align: right; text-transform: uppercase; outline: none; background: transparent; }
        .remarks-section { margin-top: 15px; border-top: 1px solid #eee; padding-top: 8px; }
        .remarks-section label { font-size: 10px; font-weight: 900; color: var(--primary); text-transform: uppercase; }
        .remarks-input { width: 100%; border: none; border-bottom: 1px dashed #bbb; font-size: 12px; font-weight: 600; padding: 5px 0; outline: none; background: transparent; }
        .stamp-sig-container { position: relative; width: 200px; height: 110px; display: flex; align-items: center; justify-content: center; }
        .round-stamp-svg { width: 110px; height: 110px; position: absolute; transform: rotate(-10deg); opacity: 0.9; }
        .sign-label { text-align: center; width: 220px; float: right; margin-top: -10px; }
        .sign-label p { border-top: 2px solid #000; padding-top: 5px; font-weight: 900; font-size: 11px; margin: 0;}
        .no-print { text-align: center; padding: 12px; background: #111; position: sticky; top: 0; z-index: 1000; display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: 900; color: #fff; font-size: 11px; text-transform: uppercase; }
        #historyModal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); overflow: auto; }
        .modal-content { background: #fefefe; margin: 3% auto; padding: 20px; border: 1px solid #888; width: 95%; max-width: 950px; border-radius: 10px; color: #333; }
        .history-controls { display:flex; flex-wrap:wrap; gap:10px; background:#f1f4f9; padding:12px; border-radius:8px; margin-bottom:15px; align-items:center; }
        .history-controls input { padding:6px; border-radius:4px; border:1px solid #ccc; font-weight:bold; }
        .history-item { display: grid; grid-template-columns: 40px 1.2fr 1.8fr 1fr 1fr 1fr 70px; gap: 8px; padding: 10px; border-bottom: 1px solid #ddd; align-items: center; font-size:12px; }
        .history-item:hover { background: #f9f9f9; }
        .history-header { font-weight: 900; background: var(--primary); color: white; padding: 10px; border-radius: 5px; }
        @media print {
          .no-print, #historyModal { display: none!important; } 
          body { background: white; } 
          .invoice-wrapper { margin: 0; box-shadow: none; width: 100%; padding: 5mm; } 
          @page { size: A4; margin: 5mm; } 
        }
      `}</style>

      {/* NO PRINT CONTROLS */}
      <div className="no-print">
        <div style={{color:'white', fontSize:'12px', fontWeight:'bold', marginRight:'10px'}}>BTC MANAGER</div>
        <input 
          type="text" 
          placeholder="🔍 Enter LR No. to Auto-Fill..." 
          value={lrSearch} 
          onChange={handleLrSearch}
          style={{padding:'8px', fontWeight:'bold', borderRadius:'5px', width:'200px'}}
        />
        {loading && <span style={{color:'yellow', fontWeight:'bold'}}>Loading...</span>}
        <button className="btn" style={{background:'#2e7d32'}} onClick={addRow}>+ Row</button>
        <button className="btn" style={{background:'#4caf50'}} onClick={newBill}>New Bill</button>
        <button className="btn" style={{background:'#1976d2'}} onClick={saveInvoice}>Save to List</button>
        <button className="btn" style={{background:'#f57c00'}} onClick={() => setShowHistory(true)}>History + CA</button>
        <button className="btn" style={{background:'var(--accent)'}} onClick={validateAndPrint}>Print</button>
        <button className="btn" style={{background:'#666'}} onClick={() => navigate('/bills')}>Back to List</button>
      </div>

      {/* HISTORY MODAL */}
      {showHistory && (
        <div id="historyModal" style={{display:'block'}}>
          <div className="modal-content">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
              <h2 style={{margin:0}}>HISTORY - CA REPORT</h2>
              <button className="btn" style={{background:'red'}} onClick={() => setShowHistory(false)}>Close X</button>
            </div>
            <div className="history-controls">
              <span id="selectedCount" style={{fontWeight:'900', color:'var(--accent)'}}>{selectedInvoices.length} Selected</span>
              <button className="btn" style={{background:'#2e7d32'}} onClick={generateCAPDF}>ORIGINAL BILL PDF</button>
              <button className="btn" style={{background:'#25D366'}} onClick={shareToCA}>WhatsApp to CA</button>
              <button className="btn" style={{background:'#ff6f00'}} onClick={exportExcel}>Excel (GST+Gadi)</button>
            </div>
            <div className="history-item history-header">
              <div><input type="checkbox" onChange={(e) => {
                if(e.target.checked) setSelectedInvoices(historyList.map(h => h.id))
                else setSelectedInvoices([])
              }} /></div>
              <div>Inv No.</div><div>Party Name</div><div>GST Number</div><div>Date</div><div>Amount</div><div>Action</div>
            </div>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
              {historyList.map(inv => (
                <div key={inv.id} className="history-item">
                  <div><input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={(e) => {
                    if(e.target.checked) setSelectedInvoices([...selectedInvoices, inv.id])
                    else setSelectedInvoices(selectedInvoices.filter(id => id !== inv.id))
                  }} /></div>
                  <div>{inv.invNo}</div>
                  <div>{inv.partyName}</div>
                  <div>{inv.partyGst || 'N/A'}</div>
                  <div>{inv.billDate || inv.date}</div>
                  <div>₹{inv.grandtotal || inv.totalAmt}</div>
                  <div><button className="btn" style={{background:'#0d1b3e', padding:'4px 8px'}} onClick={() => {
                    setBillData(inv)
                    setShowHistory(false)
                  }}>Open</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN INVOICE WRAPPER */}
      <div id="main-container">
        <div className="invoice-wrapper" id="original-page">
          <div className="copy-tag">ORIGINAL COPY (RECIPIENT)</div>
          <div className="top-id-header">GSTIN: {COMPANY.gst} | PAN: {COMPANY.pan}</div>
          
          <div className="header">
            <h1>{COMPANY.name}</h1>
            <p>{COMPANY.address}</p>
            <div className="contact-row">
              <span>Mobile: {COMPANY.phone}</span>
              <span>Email: {COMPANY.email}</span>
            </div>
          </div>

          <div className="info-grid">
            <div className="meta-side">
              <div className="party-main-box">
                <div className="box-title">BILL TO (PARTY DETAILS)</div>
                <div className="box-content">
                  <input type="text" value={billData.partyName} onChange={(e) => setBillData({...billData, partyName: e.target.value})} className="party-input required-field" placeholder="M/s PARTY NAME" />
                  <input type="text" value={billData.partyGst} onChange={(e) => setBillData({...billData, partyGst: e.target.value})} className="party-input" placeholder="GST NO:" />
                </div>
              </div>
              <div className="party-main-box" style={{borderColor: '#555'}}>
                <div className="box-title" style={{background:'#555'}}>SHIPMENT (CONSIGNOR/CONSIGNEE)</div>
                <div className="box-content" style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'10px'}}>
                  <div>
                    <span className="ship-label">FROM (CONSIGNOR):</span>
                    <textarea value={billData.fromAddr} onChange={(e) => setBillData({...billData, fromAddr: e.target.value})} rows="2" placeholder="Full Address..."></textarea>
                  </div>
                  <div style={{borderLeft:'1.5px solid #eee', paddingLeft:'8px'}}>
                    <span className="ship-label">TO (CONSIGNEE):</span>
                    <textarea value={billData.toAddr} onChange={(e) => setBillData({...billData, toAddr: e.target.value})} rows="2" placeholder="Full Address..."></textarea>
                </div>
                </div>
              </div>
            </div>
            <div className="meta-side">
              <div className="bill-box">
                <div className="meta-field">
                  <label>Invoice No.</label>
                  <input type="text" value={billData.invNo} onChange={(e) => setBillData({...billData, invNo: e.target.value})} className="inv-no-big" />
                </div>
                <div className="meta-field">
                  <label>Date</label>
                  <input type="date" value={billData.billDate} onChange={(e) => setBillData({...billData, billDate: e.target.value})} />
                </div>
                <div className="meta-field">
                  <label>Vehicle No.</label>
                  <input type="text" value={billData.vehNo} onChange={(e) => setBillData({...billData, vehNo: e.target.value.toUpperCase()})} placeholder="RJ 18 GA XXXX" />
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard">
            <div className="card"><span>Grand Total</span><strong>₹ {formatINR(billData.grandtotal)}</strong></div>
            <div className="card"><span>Advance Received</span><strong>₹ <input type="number" value={billData.advInput} onChange={(e) => { setBillData({...billData, advInput: e.target.value}); calculate() }} /></strong></div>
            <div className="card"><span>Balance Due</span><strong>₹ {formatINR(billData.balance)}</strong></div>
          </div>

          <table id="tripTable">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th className="col-lr">LR No.</th>
                <th className="col-inv">Inv no.</th>
                <th className="col-from">From</th>
                <th className="col-to">To</th>
                <th className="col-wt">Wt(MT)</th>
                <th className="col-load">Loading</th>
                <th className="col-unload">Unloading</th>
                <th className="col-oth">Other</th>
                <th className="col-freight">Freight</th>
                <th className="col-total">Total</th>
              </tr>
            </thead>
            <tbody id="tripBody">
              {billData.rows.map((row, idx) => (
                <tr key={idx}>
                  <td><input type="text" value={row.date} onChange={(e) => updateRow(idx, 'date', e.target.value)} placeholder="DD/MM" /></td>
                  <td><input type="text" value={row.lr} onChange={(e) => updateRow(idx, 'lr', e.target.value)} /></td>
                  <td><input type="text" value={row.inv} onChange={(e) => updateRow(idx, 'inv', e.target.value)} /></td>
                  <td><input type="text" value={row.from} onChange={(e) => updateRow(idx, 'from', e.target.value)} /></td>
                  <td><input type="text" value={row.to} onChange={(e) => updateRow(idx, 'to', e.target.value)} /></td>
                  <td><input type="text" value={row.wt} onChange={(e) => updateRow(idx, 'wt', e.target.value)} placeholder="0.00" /></td>
                  <td><input type="number" value={row.load} onChange={(e) => updateRow(idx, 'load', e.target.value)} /></td>
                  <td><input type="number" value={row.unload} onChange={(e) => updateRow(idx, 'unload', e.target.value)} /></td>
                  <td><input type="number" value={row.oth} onChange={(e) => updateRow(idx, 'oth', e.target.value)} /></td>
                  <td><input type="number" value={row.freight} onChange={(e) => updateRow(idx, 'freight', e.target.value)} className="row-total" /></td>
                  <td><input type="number" value={row.total} readOnly className="row-total" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bottom-layout">
            <div className="left-info-column">
              <div className="bank-details-box">
                <h4>BANK ACCOUNT DETAILS</h4>
                Beneficiary: <b>{COMPANY.name}</b><br/>
                Bank: <b>{COMPANY.bankName}</b> | A/c: <b>{COMPANY.accountNo}</b><br/>
                IFSC: <b>{COMPANY.ifsc}</b> | Branch: <b>{COMPANY.branch}</b>
              </div>
              <div className="payment-modes-box">
                <h4>ADVANCE PAYMENT DETAILS</h4>
                <div className="payment-row"><label>BY CASH:</label><input type="text" value={billData.advCash} onChange={(e) => setBillData({...billData, advCash: e.target.value})} placeholder="Amt/Date" /></div>
                <div className="payment-row"><label>BY CHEQUE:</label><input type="text" value={billData.advChq} onChange={(e) => setBillData({...billData, advChq: e.target.value})} placeholder="Chq No/Bank" /></div>
                <div className="payment-row"><label>UPI / ONLINE:</label><input type="text" value={billData.advUpi} onChange={(e) => setBillData({...billData, advUpi: e.target.value})} placeholder="Txn ID/App" /></div>
              </div>
            </div>
            <div className="right-box">
              <table className="calc-table" style={{width:'100%'}}>
                <tbody>
                  <tr><td>Trip Sub-Total:</td><td>{formatINR(billData.subtotal)}</td></tr>
                  <tr><td>GST (<input type="number" value={billData.gstPer} onChange={(e) => { setBillData({...billData, gstPer: e.target.value}); calculate() }} style={{width:'30px', borderBottom:'1px solid #000', textAlign:'center'}} />%):</td><td>{formatINR(billData.gstAmt)}</td></tr>
                  <tr className="net-payable-row"><td>Grand Total:</td><td>{formatINR(billData.grandtotal)}</td></tr>
                  <tr style={{color:'var(--accent)'}}><td>Advance Recd:</td><td>-{formatINR(billData.advInput)}</td></tr>
                  <tr style={{borderTop:'2px solid #000', fontWeight:'900', fontSize:'16px', color:'#2e7d32'}}><td>NET BALANCE:</td><td>{formatINR(billData.balance)}</td></tr>
                </tbody>
              </table>
              <div className="words-right-container">
                <span className="words-label">Amount in Words:</span>
                <input type="text" value={billData.amountWords} readOnly className="words-input-field" />
              </div>
            </div>
          </div>

          <div className="remarks-section">
            <label>REMARKS / NOTES:</label>
            <input type="text" value={billData.remarks} onChange={(e) => setBillData({...billData, remarks: e.target.value})} className="remarks-input" placeholder="Enter remarks here..." />
          </div>

          <div className="sign-label">
            <div className="stamp-sig-container">
              <svg viewBox="0 0 100 100" className="round-stamp-svg">
                <defs><path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" /></defs>
                <circle cx="50" cy="50" r="46" fill="none" stroke="#1a237e" strokeWidth="2.5" />
                <text fontFamily="Arial Black" fontSize="7" fontWeight="900" fill="#1a237e" textLength="232">
                  <textPath href="#circlePath">BHARAT TRANSPORT COMPANY • BHARAT TRANSPORT COMPANY</textPath>
                </text>
              </svg>
              {/* "Krishan" signature removed as requested */}
            </div>
            <p>Authorized Signatory</p>
            <strong style={{fontSize:'9px'}}>FOR {COMPANY.name}</strong>
          </div>
          <div style={{clear:'both'}}></div>
        </div>
      </div>
    </div>
  )
}
