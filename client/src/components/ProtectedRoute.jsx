// client/src/components/ProtectedRoute.jsx - NEW FILE

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If no roles specified, allow all authenticated users
  if (!allowedRoles) {
    return children;
  }

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(user.role)) {
    // Redirect to POS for cashiers, dashboard for others
    return <Navigate to={user.role === 'cashier' ? '/pos' : '/'} />;
  }

  return children;
}