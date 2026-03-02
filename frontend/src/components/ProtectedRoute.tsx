import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  requireOrgUser?: boolean
}

export function ProtectedRoute({ children, requireSuperAdmin, requireOrgUser }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireSuperAdmin && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  if (requireOrgUser && user.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />
  }

  return <>{children}</>
}
