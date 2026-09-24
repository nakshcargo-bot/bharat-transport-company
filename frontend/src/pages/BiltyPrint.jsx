import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { biltyAPI } from '../api'

export default function BiltyPrint() {
  const { lr_no } = useParams()
  const [bilty, setBilty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBilty = async () => {
      try {
        const res = await biltyAPI.getAll()
        // LR No से बिल्टी ूंढें
        const found = res.data.find(b => b.lr_no === lr_no)
        setBilty(found)
      } catch (err) {
        console.error('Error fetching bilty:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBilty()
  }, [lr_no])

  if (loading) return <div className="p-10 text-center">Loading Bilty...</div>
  if (!bilty) return <div className="p-10 text-center text-red-500">Bilty Not Found!</div>

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      <div className="max-w-4xl mx-auto border-2 border-black p-6">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-3xl font-bold uppercase">Bharat Transport Company</h1>
          <p className="text-sm">Transporters & Logistics Providers</p>
        </div>

        {/* Top Info */}
        <div className="flex justify-between mb-6 border border-black p-2">
          <div>
            <p className="font-bold">LR No: <span className="font-normal">{bilty.lr_no}</span></p>
            <p className="font-bold">Date: <span className="font-normal">{bilty.lr_date}</span></p>
          </div>
          <div className="text-right">
            <p className="font-bold">From: <span className="font-normal">{bilty.from_name}</span></p>
            <p className="font-bold">To: <span className="font-normal">{bilty.to_name}</span></p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-black p-3">
            <h3 className="font-bold border-b border-black mb-2">Consignor (भेजने वाला)</h3>
            <p className="font-bold text-lg">{bilty.consignor_name}</p>
            <p>{bilty.consignor_address}</p>
            <p>Mobile: {bilty.consignor_mobile}</p>
            {bilty.consignor_gst && <p>GST: {bilty.consignor_gst}</p>}
          </div>
          <div className="border border-black p-3">
            <h3 className="font-bold border-b border-black mb-2">Consignee (लेने वाला)</h3>
            <p className="font-bold text-lg">{bilty.consignee_name}</p>
            <p>{bilty.consignee_address}</p>
            <p>Mobile: {bilty.consignee_mobile}</p>
            {bilty.consignee_gst && <p>GST: {bilty.consignee_gst}</p>}
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
              <th className="border border-black p-2 text-center">Total</th>
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
          <div className="w-1/2 border border-black p-2">
             <div className="flex justify-between mb-1">
               <span>Freight:</span>
               <span>₹ {bilty.freight}</span>
             </div>
             <div className="flex justify-between mb-1">
               <span>Other Charges:</span>
               <span>₹ {bilty.grand_total - bilty.freight}</span>
             </div>
             <div className="flex justify-between font-bold text-lg border-t border-black pt-1">
               <span>Grand Total:</span>
               <span>₹ {bilty.grand_total}</span>
             </div>
             <div className="mt-2 text-sm italic">
               In Words: {bilty.amount_in_words}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex justify-between items-end">
          <div className="text-center">
            <p className="border-t border-black pt-1 w-32">Consignor Sign</p>
          </div>
          <div className="text-center">
            <p className="border-t border-black pt-1 w-32">Transporter Sign</p>
          </div>
          <div className="text-center">
            <p className="border-t border-black pt-1 w-32">Consignee Sign</p>
          </div>
        </div>

      </div>

      {/* Print Button */}
      <div className="text-center mt-6 no-print">
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
        >
          Print Bilty
        </button>
      </div>
    </div>
  )
}
