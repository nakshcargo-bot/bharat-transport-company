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
        
        // API response structure को handle करें
        let bilties = []
        
        if (Array.isArray(res)) {
          bilties = res
        } else if (res && Array.isArray(res.data)) {
          bilties = res.data
        } else if (res && res.data && Array.isArray(res.data.data)) {
          bilties = res.data.data
        } else if (res && res.data && typeof res.data === 'object') {
          // अगर res.data object है तो उसमें data property check करें
          if (Array.isArray(res.data.data)) {
            bilties = res.data.data
          }
        }
        
        console.log('Total bilties found:', bilties.length)
        console.log('Searching for LR:', lr_no)
        
        const found = bilties.find(b => b.lr_no === lr_no)
        
        if (found) {
          console.log('Bilty found:', found.lr_no)
          setBilty(found)
        } else {
          setError(`Bilty not found: ${lr_no}`)
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err.message || 'Failed to load bilty')
      } finally {
        setLoading(false)
      }
    }
    
    if (lr_no) {
      fetchBilty()
    } else {
      setError('No LR Number provided')
      setLoading(false)
    }
  }, [lr_no])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-600">Loading Bilty...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">{error}</div>
      </div>
    )
  }
  
  if (!bilty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">Bilty Not Found!</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto border-2 border-black p-4 md:p-6 bg-white">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold uppercase">Bharat Transport Company</h1>
          <p className="text-sm">Transporters & Logistics Providers</p>
        </div>

        {/* Top Info */}
        <div className="flex flex-col md:flex-row justify-between mb-6 border border-black p-3">
          <div className="mb-2 md:mb-0">
            <p className="font-bold">LR No: <span className="font-normal">{bilty.lr_no}</span></p>
            <p className="font-bold">Date: <span className="font-normal">{new Date(bilty.lr_date).toLocaleDateString('en-IN')}</span></p>
          </div>
          <div className="text-right">
            <p className="font-bold">From: <span className="font-normal">{bilty.from_name}</span></p>
            <p className="font-bold">To: <span className="font-normal">{bilty.to_name}</span></p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-black p-3">
            <h3 className="font-bold border-b border-black mb-2">Consignor (भेजने वाला)</h3>
            <p className="font-bold text-lg">{bilty.consignor_name}</p>
            <p className="text-sm">{bilty.consignor_address}</p>
            <p className="text-sm">Mobile: {bilty.consignor_mobile}</p>
            {bilty.consignor_gst && <p className="text-sm">GST: {bilty.consignor_gst}</p>}
          </div>
          <div className="border border-black p-3">
            <h3 className="font-bold border-b border-black mb-2">Consignee (लेने वाला)</h3>
            <p className="font-bold text-lg">{bilty.consignee_name}</p>
            <p className="text-sm">{bilty.consignee_address}</p>
            <p className="text-sm">Mobile: {bilty.consignee_mobile}</p>
            {bilty.consignee_gst && <p className="text-sm">GST: {bilty.consignee_gst}</p>}
          </div>
        </div>

        {/* Goods Table */}
        <table className="w-full border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 text-left">Description</th>
              <th className="border border-black p-2 text-center">Pkgs</th>
              <th className="border border-black p-2 text-center">Weight (Kg)</th>
              <th className="border border-black p-2 text-center">Rate</th>
              <th className="border border-black p-2 text-center">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">{bilty.description}</td>
              <td className="border border-black p-2 text-center">{bilty.no_of_packages}</td>
              <td className="border border-black p-2 text-center">{bilty.charged_weight}</td>
              <td className="border border-black p-2 text-center">{bilty.rate}</td>
              <td className="border border-black p-2 text-center">{bilty.freight}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-full md:w-1/2 border border-black p-3">
            <div className="flex justify-between mb-2">
              <span>Freight:</span>
              <span>₹ {parseFloat(bilty.freight || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>A.O.C. Amount:</span>
              <span>₹ {parseFloat(bilty.aoc_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Other Charges:</span>
              <span>₹ {parseFloat((bilty.grand_total || 0) - (bilty.freight || 0) - (bilty.aoc_amount || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t-2 border-black pt-2 mt-2">
              <span>Grand Total:</span>
              <span>₹ {parseFloat(bilty.grand_total || 0).toFixed(2)}</span>
            </div>
            <div className="mt-3 text-sm italic border-t border-black pt-2">
              <span className="font-bold">In Words:</span> {bilty.amount_in_words || 'N/A'}
            </div>
          </div>
        </div>

        {/* E-Way Bill */}
        {bilty.eway_bill_no && (
          <div className="mb-6 border border-black p-3">
            <p className="font-bold">E-Way Bill No: <span className="font-normal">{bilty.eway_bill_no}</span></p>
            {bilty.eway_valid_upto && (
              <p className="font-bold">Valid Upto: <span className="font-normal">{new Date(bilty.eway_valid_upto).toLocaleDateString('en-IN')}</span></p>
            )}
          </div>
        )}

        {/* Signatures */}
        <div className="mt-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="text-center flex-1">
            <p className="font-bold mb-8">Consignor Signature</p>
            <p className="border-t border-black pt-1">(भेजने वाले के हस्ताक्षर)</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold mb-8">Transporter Signature</p>
            <p className="border-t border-black pt-1">(वाहक के हस्ताक्षर)</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold mb-8">Consignee Signature</p>
            <p className="border-t border-black pt-1">(प्राप्तकर्ता के हस्ताक्षर)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs">
          <p className="font-bold">This is a computer generated document</p>
          <p>Subject to Rajgarh Jurisdiction</p>
        </div>
      </div>

      {/* Print Button */}
      <div className="text-center mt-6 mb-6">
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200"
        >
          🖨️ Print Bilty
        </button>
        <button 
          onClick={() => window.history.back()} 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200 ml-4"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
