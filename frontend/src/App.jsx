import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BillEntry from './pages/BillEntry'
import BillPrint from './pages/BillPrint'
import BillList from './pages/BillList'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/bill/new" element={<PrivateRoute><BillEntry /></PrivateRoute>} />
        <Route path="/bill/print/:billNo" element={<PrivateRoute><BillPrint /></PrivateRoute>} />
        <Route path="/bills" element={<PrivateRoute><BillList /></PrivateRoute>} />
      </Routes>
    </>
  )
}
