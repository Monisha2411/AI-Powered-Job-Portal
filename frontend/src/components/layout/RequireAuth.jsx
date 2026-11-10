import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingState from '../ui/LoadingState'

export default function RequireAuth({ children, roles }) {
  const { user, initialized } = useAuth()
  const location = useLocation()

  const hasStoredToken = Boolean(localStorage.getItem('access_token'))

  if (!initialized || (!user && hasStoredToken)) {
    return <LoadingState message="Checking your session..." />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles?.length) {
    const isAdmin = user.role === 'admin' || user.is_superuser
    const userRole = isAdmin ? 'admin' : user.role
    const hasAccess = roles.includes(userRole)

    if (!hasAccess) {
      const dashboardPath = isAdmin
        ? '/admin'
        : user.role === 'recruiter'
          ? '/recruiter'
          : '/seeker'

      return <Navigate to={dashboardPath} replace />
    }
  }

  return children
}
