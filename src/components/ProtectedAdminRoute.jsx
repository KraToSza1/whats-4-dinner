import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/admin';
import AdminDashboard from '../pages/AdminDashboard';

/**
 * Protected Admin Route
 * SECURE: Only allows access if user is authenticated AND is an admin
 * Completely blocks non-admin users from accessing admin dashboard
 *
 * @param {React.ReactNode} children - Optional children to render instead of AdminDashboard
 */
export default function ProtectedAdminRoute({ children = null }) {
  const { user, loading } = useAuth();

  // Wait for auth to load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    if (import.meta.env.DEV) {
      console.log('🔑 [PROTECTED ADMIN] ❌ No user, redirecting to home');
    }
    return <Navigate to="/" replace />;
  }

  // STRICT CHECK: Only allow if user email is in admin allowlist
  const userIsAdmin = isAdmin(user);
  if (!userIsAdmin) {
    if (import.meta.env.DEV) {
      console.log('🔑 [PROTECTED ADMIN] ❌ User is not an admin:', user.email);
      console.log('🔑 [PROTECTED ADMIN] Redirecting to home');
    }
    // Silently redirect - don't show any error to non-admin users
    return <Navigate to="/" replace />;
  }

  if (import.meta.env.DEV) {
    console.log('🔑 [PROTECTED ADMIN] ✅ User is admin, allowing access:', user.email);
  }

  // If children provided, render them, otherwise render AdminDashboard
  return children || <AdminDashboard />;
}
