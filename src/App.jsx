import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AdminDashboard from './pages/admin/AdminDashboard'
import KioskFlow from './pages/kiosk/KioskFlow'
import Login from './pages/Login'
import StudentApp from './pages/student/StudentApp'

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-app"
              element={
                <ProtectedRoute role="student">
                  <StudentApp />
                </ProtectedRoute>
              }
            />
            <Route path="/kiosk/:hostel_id" element={<KioskFlow />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}
