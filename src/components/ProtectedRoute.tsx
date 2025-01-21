import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../contexts/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  allowedRoles
}: ProtectedRouteProps) {
  const { user, loading, role } = useAuth()

  console.log('ProtectedRoute evaluation:', { 
    path: window.location.pathname,
    loading, 
    userEmail: user?.email, 
    role,
    requireAuth,
    allowedRoles,
    isAuthenticated: !!user,
    checks: {
      shouldRedirectToLogin: requireAuth && !user,
      shouldRedirectHome: !requireAuth && user,
      shouldRedirectDueToRole: allowedRoles && role && !allowedRoles.includes(role)
    }
  })

  if (loading) {
    console.log('ProtectedRoute: Still loading auth state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (requireAuth && !user) {
    console.log('ProtectedRoute: Redirecting to login - No authenticated user')
    return <Navigate to="/login" replace />
  }

  if (!requireAuth && user) {
    console.log('ProtectedRoute: Redirecting from login - User already authenticated')
    if (role === 'customer') {
      return <Navigate to="/my-tickets" replace />
    }
    return <Navigate to="/" replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    console.log('ProtectedRoute: Access denied due to role:', { 
      currentRole: role, 
      allowedRoles,
      path: window.location.pathname
    })
    if (role === 'customer') {
      return <Navigate to="/my-tickets" replace />
    }
    return <Navigate to="/" replace />
  }

  console.log('ProtectedRoute: Access granted, rendering children')
  return <>{children}</>
} 