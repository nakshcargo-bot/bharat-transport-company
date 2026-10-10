import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Backup() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'https://bharat-transport-api.onrender.com'
  const token = localStorage.getItem('token')

  // 💾 DOWNLOAD BACKUP (Save to D: Drive)
  const handleDownload = async () => {
    try {
      setLoading(true)
      setStatus('⏳ Generating backup... Please wait.')
      
      const res = await fetch(`${apiUrl}/api/backup/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Failed to generate backup')
      
      const result = await res.json()
      
      // Create JSON file and trigger browser download
      const dataStr = JSON.stringify(result.data, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      // Filename with date
      const date = new Date().toISOString().split('T')[0]
      link.download = `BharatTransport_Backup_${date}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setStatus('✅ Backup downloaded successfully! Ab is file ko apni D: Drive mein move kar do.')
    } catch (err) {
      setStatus('❌ Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔄 RESTORE BACKUP (From D: Drive)
  const handleRestore = async () => {
    if (!file) {
      alert('Please select a backup file first!')
      return
    }
    
    if (!window.confirm('⚠️ WARNING: This will OVERWRITE your current database with the backup data. Are you sure?')) {
      return
    }

    try {
      setLoading(true)
      setStatus(' Restoring data... This may take a few minutes.')
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result)
          
          const res = await fetch(`${apiUrl}/api/backup/import`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(backupData)
          })
          
          if (!res.ok) throw new Error('Restore failed')
          
          const result = await res.json()
          setStatus('✅ ' + result.message)
          alert('Restore successful! Please refresh the page.')
        } catch (err) {
          setStatus('❌ Error reading file: ' + err.message)
        } finally {
          setLoading(false)
        }
      }
      reader.readAsText(file)
    } catch (err) {
      setStatus('❌ Error: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">💾 Backup & Restore Center</h1>
      <p className="text-gray-600 mb-8">Apne pura database ka backup apne laptop (D: Drive) mein save karein ya wahan se restore karein.</p>

      {status && (
        <div className={`p-4 rounded-lg mb-6 ${status.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' : status.includes('❌') ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Download Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition">
          <div className="text-6xl mb-4 text-center">📥</div>
          <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">Download Backup</h2>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Pura database JSON file mein download hoga. Browser aapse puchega kahan save karna hai. Aap <strong>D: Drive</strong> select kar sakte hain.
          </p>
          <button 
            onClick={handleDownload}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : '📥 Download Full Backup'}
          </button>
        </div>

        {/* Restore Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-100 hover:shadow-xl transition">
          <div className="text-6xl mb-4 text-center">📤</div>
          <h2 className="text-2xl font-bold text-center text-orange-800 mb-2">Restore from Backup</h2>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Apni D: Drive se puri backup JSON file select karo. <strong>Warning:</strong> Yeh current data ko replace kar dega!
          </p>
          
          <div className="mb-4">
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {file && <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>}
          </div>

          <button 
            onClick={handleRestore}
            disabled={loading || !file}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 disabled:bg-orange-300 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Restoring...' : '🔄 Restore Database'}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <h3 className="font-bold text-yellow-800">💡 Pro Tips:</h3>
        <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
          <li>Backup file ka naam automatically date ke sath banega (e.g., <code>BharatTransport_Backup_2026-10-10.json</code>).</li>
          <li>Hamesha restore karne se pehle ek naya backup le lo, taaki agar kuch gadbad ho toh wapas ja sako.</li>
          <li>Restore process mein 1-2 minute lag sakte hain, page band mat karna.</li>
        </ul>
      </div>
    </div>
  )
}
