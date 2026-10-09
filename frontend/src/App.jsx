import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

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

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function LoadingFallback() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>⏳ Loading...</h2>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<TrackBilty />} />
          <Route path="/bilty-print" element={<BiltyPrint />} />
          <Route path="/mr/print" element={<MRPrint />} />
          <Route path="/gadi-challan-print" element={<PrivateRoute><GadiChallanPrint /></PrivateRoute>} />
          <Route path="/pod-upload" element={<PODUpload />} />
          <Route path="/pod-view" element={<PODView />} />

          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/consignments" element={<PrivateRoute><Consignments /></PrivateRoute>} />
          <Route path="/consignments/new" element={<PrivateRoute><Consignments isNew={true} /></PrivateRoute>} />

          {/* Bills */}
          <Route path="/bills" element={<PrivateRoute><BillList /></PrivateRoute>} />
          <Route path="/bill/new" element={<PrivateRoute><BillEntry /></PrivateRoute>} />
          <Route path="/bill/list" element={<PrivateRoute><BillList /></PrivateRoute>} />
          <Route path="/bill-print/:billNo" element={<PrivateRoute><BillPrint /></PrivateRoute>} />

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

          {/* 404 */}
          <Route path="*" element={
            <div style={{padding:'50px',textAlign:'center'}}>
              <h1>404 - Page Not Found</h1>
              <a href="/">Go Home</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
