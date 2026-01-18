import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RoleBasedRedirect() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // If not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If logged in as admin, redirect to dashboard
  if (user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // For all other users (agents, regular users), redirect to tickets
  return <Navigate to="/tickets" replace />;
}
