import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { verifyAdminPassword, getAdminEmails } from '../utils/admin';
import { useToast } from './Toast.jsx';

const ADMIN_STORAGE_KEY = 'admin:session:v1';

function readAdminSession() {
  // In dev mode, always return true
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    console.log('🔑 [ADMIN] Dev mode - auto-admin session active');
    return true;
  }

  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      const { timestamp, expiresAt } = JSON.parse(stored);
      if (Date.now() < expiresAt) {
        console.log('🔑 [ADMIN] Valid admin session found');
        return true;
      }
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      console.log('🔑 [ADMIN] Admin session expired');
    }
  } catch (e) {
    console.error('🔑 [ADMIN] Error reading session:', e);
  }
  return false;
}

function writeAdminSession() {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  localStorage.setItem(
    ADMIN_STORAGE_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      expiresAt,
    })
  );
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

export default function AdminLogin({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(readAdminSession());

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      setPassword('');
      setError('');
    };
  }, [open]);

  const handleLogin = async e => {
    e?.preventDefault();
    if (!password) {
      setError('Please enter admin password');
      return;
    }

    setLoading(true);
    setError('');

    // Verify password
    if (verifyAdminPassword(password)) {
      writeAdminSession();
      setIsAuthenticated(true);
      toast.success('Admin access granted!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } else {
      setError('Invalid admin password');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    toast.success('Admin session ended');
    onClose();
  };

  if (!open) return null;

  // If already authenticated, show logout option
  if (isAuthenticated) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 border-2 border-purple-500"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-3xl">👑</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Admin Access Active
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You have admin privileges
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Admin session active
                </p>
              </div>

              {user && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">Logged in as:</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {user.email}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  End Admin Session
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 border-2 border-purple-500"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-3xl">👑</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Admin Login
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter admin password to access admin features
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter admin password"
                  autoFocus
                  disabled={loading}
                />
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>

              {user && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">Logged in as:</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {user.email}
                  </p>
                </div>
              )}

              {!user && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    ⚠️ Note: You're not logged in. Admin features work best when authenticated.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !password}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Login'}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold"
                >
                  Cancel
                </motion.button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Default password:{' '}
                  <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">admin123</code>
                </p>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
                  Set{' '}
                  <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">
                    VITE_ADMIN_PASSWORD
                  </code>{' '}
                  to change
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
