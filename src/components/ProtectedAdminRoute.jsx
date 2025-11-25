import { Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';

/**
 * Protected Admin Route
 * Completely hides admin in production unless VITE_ENABLE_ADMIN=true
 */
export default function ProtectedAdminRoute() {
  // In production, completely block unless explicitly enabled
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ADMIN !== 'true') {
    // Silently redirect - don't show any admin UI
    return <Navigate to="/" replace />;
  }

  // In development, allow access
  return <AdminDashboard />;
}
