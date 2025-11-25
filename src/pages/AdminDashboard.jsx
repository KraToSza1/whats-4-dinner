import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../components/Toast.jsx';
import RecipeEditor from '../components/RecipeEditor';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin: isAdminUser, adminModeEnabled } = useAdmin();
  const toast = useToast();

  useEffect(() => {
    // PRODUCTION: Require environment variable
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ADMIN !== 'true') {
      toast.error('Admin access is disabled in production');
      navigate('/');
      return;
    }

    const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
    const isExplicitlyEnabled = import.meta.env.VITE_ENABLE_ADMIN === 'true';

    if (isDevMode || isExplicitlyEnabled) {
      return;
    }

    // Auto-enable admin if on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      import('../utils/admin.js').then(({ forceEnableAdmin }) => {
        forceEnableAdmin();
      });
      return;
    }

    // Check URL parameter (dev only)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' && !import.meta.env.PROD) {
      import('../utils/admin.js').then(({ forceEnableAdmin }) => {
        forceEnableAdmin();
      });
      return;
    }

    if (!adminModeEnabled) {
      toast.error('Admin mode is not enabled. Add ?admin=true to URL or use localhost');
      navigate('/');
      return;
    }
  }, [adminModeEnabled, navigate, toast]);

  // Login check already handled above - this is just for rendering
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-4xl">👑</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage and monitor your app
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              ← Back to App
            </motion.button>
          </div>

          {user && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Logged in as:</strong> {user.email}
                {isAdminUser && <span className="ml-2">✅ Admin User</span>}
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Workflow Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                ChatGPT Recipe Generation Workflow
              </h2>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
                <li>
                  <strong>Export Reference:</strong> Click "📤 Export Complete Recipe" on a correct
                  recipe → Copy JSON → Send to ChatGPT
                </li>
                <li>
                  <strong>Get JSON:</strong> ChatGPT generates complete recipe JSON → Click "📥
                  Import JSON" → Paste → Save
                </li>
                <li>
                  <strong>Get Image:</strong> Ask ChatGPT "Generate image" → Download JPEG (≤100KB)
                  → Upload → Save
                </li>
                <li>
                  <strong>Repeat:</strong> Use Batch Mode to keep modal open for faster processing
                </li>
              </ol>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  ⚠️ Image Requirements: JPEG only, ≤100KB, 1024×1024 pixels
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recipe Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-300 dark:border-blue-700 shadow-xl"
          id="recipe-editor-section"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recipe Editor</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Import ChatGPT JSON, upload images, and manage recipes
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <RecipeEditor />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
