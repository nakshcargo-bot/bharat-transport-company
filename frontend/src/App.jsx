import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './AuthContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Consignments = lazy(() => import('./pages/Consignments'))
const Bills = lazy(() => import('./pages/Bills'))
const BillEntry = lazy(() => import('./pages/BillEntry'))
const BillList = lazy(() => import('./pages/BillList'))
const BillPrint = lazy(() => import('./pages/BillPrint'))
const Customers = lazy(() => import('./pages/Customers'))
const GatePass = lazy(() => import('./pages/GatePass'))
const GadiChallan = lazy(() => import('./pages/GadiChallan'))
const GadiChallanPrint = lazy(() => import('./pages/GadiChallanPrint'))
const Reports = lazy(() => import('./pages/Reports'))
const TrackBilty = lazy(() => import('./pages/TrackBilty'))
const Login = lazy(() => import('./pages/Login'))
const BiltyPrint = lazy(() => import('./pages/BiltyPrint'))
const MR = lazy(() => import('./pages/MR'))
const MRCreate = lazy(() => import('./pages/MRCreate'))
const MRPrint = lazy(() => import('./pages/MRPrint'))
const Audit = lazy(() => import('./pages/Audit'))
const Branches = lazy(() => import('./pages/Branches'))
const POD = lazy(() => import('./pages/POD'))
const PODUpload = lazy(() => import('./pages/PODUpload'))
const PODView = lazy(() => import('./pages/PODView'))
const Drivers = lazy(() => import('./pages/Drivers'))
const Transit = lazy(() => import('./pages/Transit'))
const Vehicles = lazy(() => import('./pages/Vehicles'))
const Trips = lazy(() => import('./pages/Trips'))
const Rates = lazy(() => import('./pages/Rates'))
const Accounts = lazy(() => import('./pages/Accounts'))
const EwayBill = lazy(() => import('./pages/EwayBill'))
const Claims = lazy(() => import('./pages/Claims'))
const Users = lazy(() => import('./pages/Users'))
const Backup = lazy(() => import('./pages/Backup'))
const BranchPayments = lazy(() => import('./pages/BranchPayments'))
const StockManagement = lazy(() => import('./pages/StockManagement'))
const BranchPortal = lazy(() => import('./pages/BranchPortal'))
const BranchLoginPage = lazy(() => import('./pages/BranchLoginPage'))

const Ledger = lazy(() => import('./pages/Ledger'))
const Outstanding = lazy(() => import('./pages/Outstanding'))
const Commissions = lazy(() => import('./pages/Commissions'))
const Expenses = lazy(() => import('./pages/Expenses'))

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-700 border-t-transparent mb-4"></div>
          <h2 className="text-xl font-bold text-gray-700">Loading...</h2>
        </div>
      </div>
    )
  }

  return currentUser ? children : <Navigate to="/login" replace />
}

function LoadingFallback() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-700 border-t-transparent mb-4"></div>
        <h2 className="text-xl font-bold text-gray-700">Loading Bharat Transport...</h2>
        <p className="text-gray-500 mt-2">Please wait...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes - No Login Required */}
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<TrackBilty />} />
          <Route path="/bilty-print/:id?" element={<BiltyPrint />} />
          <Route path="/mr/print" element={<MRPrint />} />
          <Route path="/mr-print/:id?" element={<MRPrint />} />
          <Route path="/gadi-challan-print/:id?" element={<GadiChallanPrint />} />
          <Route path="/pod-upload" element={<PODUpload />} />
          <Route path="/pod-view" element={<PODView />} />
          
          {/* Branch Portal Routes - Public Access */}
          <Route path="/branch/:branchSlug" element={<BranchPortal />} />
          <Route path="/branch-login/:slug" element={<BranchLoginPage />} />

          {/* Protected Routes - Login Required */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/consignments" element={<PrivateRoute><Consignments /></PrivateRoute>} />
          <Route path="/consignments/new" element={<PrivateRoute><Consignments isNew={true} /></PrivateRoute>} />

          <Route path="/bills" element={<PrivateRoute><BillList /></PrivateRoute>} />
          <Route path="/bill-entry" element={<PrivateRoute><BillEntry /></PrivateRoute>} />
          <Route path="/bill-edit/:id" element={<PrivateRoute><BillEntry /></PrivateRoute>} />
          <Route path="/bill-print" element={<PrivateRoute><BillPrint /></PrivateRoute>} />
          <Route path="/bill-print/:id" element={<PrivateRoute><BillPrint /></PrivateRoute>} />
          <Route path="/bill/new" element={<PrivateRoute><BillEntry /></PrivateRoute>} />
          <Route path="/bill/edit/:id" element={<PrivateRoute><BillEntry /></PrivateRoute>} />
          <Route path="/bill/list" element={<PrivateRoute><BillList /></PrivateRoute>} />

          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/gate-pass" element={<PrivateRoute><GatePass /></PrivateRoute>} />
          <Route path="/gadi-challan" element={<PrivateRoute><GadiChallan /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/mr" element={<PrivateRoute><MR /></PrivateRoute>} />
          <Route path="/mr/create" element={<PrivateRoute><MRCreate /></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><Audit /></PrivateRoute>} />
          <Route path="/branches" element={<PrivateRoute><Branches /></PrivateRoute>} />
          <Route path="/pod" element={<PrivateRoute><POD /></PrivateRoute>} />
          <Route path="/transit" element={<PrivateRoute><Transit /></PrivateRoute>} />
          <Route path="/drivers" element={<PrivateRoute><Drivers /></PrivateRoute>} />
          <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
          <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
          <Route path="/rates" element={<PrivateRoute><Rates /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
          <Route path="/eway" element={<PrivateRoute><EwayBill /></PrivateRoute>} />
          <Route path="/claims" element={<PrivateRoute><Claims /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/backup" element={<PrivateRoute><Backup /></PrivateRoute>} />
          <Route path="/branch-payments" element={<PrivateRoute><BranchPayments /></PrivateRoute>} />
          <Route path="/stock" element={<PrivateRoute><StockManagement /></PrivateRoute>} />

          <Route path="/ledger" element={<PrivateRoute><Ledger /></PrivateRoute>} />
          <Route path="/outstanding" element={<PrivateRoute><Outstanding /></PrivateRoute>} />
          <Route path="/commissions" element={<PrivateRoute><Commissions /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />

          {/* 404 Route */}
          <Route path="*" element={
            <div style={{padding:'50px',textAlign:'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
                <button type="button" onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('#/')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium">Go Back</button>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
