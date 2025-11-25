import { Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';

/**
 * Protected Admin Route
 * Completely hides admin in production unless VITE_ENABLE_ADMIN=true
 */
export default function ProtectedAdminRoute() {
  // Check if we're on localhost (dev)
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Check if we're on a Vercel/production domain
  const isProduction =
    typeof window !== 'undefined' &&
    !isLocalhost &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('vercel.com') ||
      (!window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1')));

  // In production, completely block unless explicitly enabled
  if (isProduction && import.meta.env.VITE_ENABLE_ADMIN !== 'true') {
    // Silently redirect - don't show any admin UI
    return <Navigate to="/" replace />;
  }

  // In development/localhost, allow access
  if (isLocalhost) {
    return <AdminDashboard />;
  }

  // If explicitly enabled via env var, allow access
  if (import.meta.env.VITE_ENABLE_ADMIN === 'true') {
    return <AdminDashboard />;
  }

  // Default: block access
  return <Navigate to="/" replace />;
}
