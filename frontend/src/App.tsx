import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { SuperAdminLayout } from './pages/SuperAdminLayout'
import { Organizations } from './pages/Organizations'
import { DashboardLayout } from './pages/DashboardLayout'
import { Companies } from './pages/Companies'
import { CompanyDetail } from './pages/CompanyDetail'
import { ActivityLog } from './pages/ActivityLog'
import { Team } from './pages/Team'
import { SuperAdminCompanies } from './pages/SuperAdminCompanies'
import { SuperAdminActivityLog } from './pages/SuperAdminActivityLog'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute requireSuperAdmin>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Organizations />} />
        <Route path="companies" element={<SuperAdminCompanies />} />
        <Route path="companies/:id" element={<CompanyDetail basePath="/superadmin/companies" />} />
        <Route path="activity" element={<SuperAdminActivityLog />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireOrgUser>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="team" element={<Team />} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { maxWidth: 420 },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fef2f2' } },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  )
}
