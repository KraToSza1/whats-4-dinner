import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../components/Toast.jsx';
import { isAdmin } from '../utils/admin';
import RecipeEditor from '../components/RecipeEditor';
import AdminNavigation from '../components/AdminNavigation';
import AdminStatsWidget from '../components/AdminStatsWidget';
import UserManagement from '../components/UserManagement';
import RecipeAnalytics from '../components/RecipeAnalytics';
import SystemHealth from '../components/SystemHealth';
import AdminSettings from '../components/AdminSettings';
import FeatureAnalytics from '../components/FeatureAnalytics';
import MissingImagesViewer from '../components/MissingImagesViewer';
import AdminIntegrations from '../components/AdminIntegrations';
import AdminIntegrationChecker from '../components/AdminIntegrationChecker';
import BackToHome from '../components/BackToHome.jsx';
import {
  Plus,
  BookOpen,
  Download,
  Upload,
  Users as UsersIcon,
  Sparkles,
  Command,
  Zap,
  X,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin: isAdminUser } = useAdmin();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const filterParam = searchParams.get('filter');

  // Double-check admin status using direct check
  const userIsAdmin = user ? isAdmin(user) : false;

  const handleTabChange = useCallback(
    (tab, filter = null) => {
      setActiveTab(tab);
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (filter) {
        params.set('filter', filter);
      }
      navigate(`/admin?${params.toString()}`, { replace: true });
    },
    [navigate]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = e => {
      // Ctrl/Cmd + K to show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }

      // Number keys for tabs (1-7)
      if (!e.ctrlKey && !e.metaKey && e.key >= '1' && e.key <= '7') {
        const tabIndex = parseInt(e.key) - 1;
        const tabs = [
          'dashboard',
          'recipes',
          'users',
          'analytics',
          'features',
          'system',
          'settings',
        ];
        if (tabs[tabIndex]) {
          handleTabChange(tabs[tabIndex]);
        }
      }

      // Escape to close shortcuts modal
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showKeyboardShortcuts, handleTabChange]);

  // Sync activeTab with URL params when they change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'dashboard';
    const filterFromUrl = searchParams.get('filter');

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('🔄 [ADMIN DASHBOARD] URL params changed', {
        tabFromUrl,
        filterFromUrl,
        currentActiveTab: activeTab,
        currentFilterParam: filterParam,
      });
    }

    if (tabFromUrl !== activeTab) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('🔄 [ADMIN DASHBOARD] Updating activeTab from URL', {
          oldTab: activeTab,
          newTab: tabFromUrl,
        });
      }
      // Use setTimeout to avoid synchronous setState warning
      setTimeout(() => {
        setActiveTab(tabFromUrl);
      }, 0);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [ADMIN DASHBOARD] Auth check effect', {
        authLoading,
        hasUser: !!user,
        userEmail: user?.email,
        userIsAdmin,
        timestamp: new Date().toISOString(),
      });
    }

    // Wait for auth to load
    if (authLoading) {
      if (import.meta.env.DEV) {
        console.log('⏳ [ADMIN DASHBOARD] Waiting for auth to load...');
      }
      return;
    }

    if (!user) {
      if (import.meta.env.DEV) {
        console.warn('❌ [ADMIN DASHBOARD] No user, redirecting...');
      }
      toast.error('Please sign in to access admin dashboard');
      navigate('/', { replace: true });
      return;
    }

    // STRICT CHECK: Only allow if user email is in admin allowlist
    if (!userIsAdmin) {
      if (import.meta.env.DEV) {
        console.warn('❌ [ADMIN DASHBOARD] User is not admin, redirecting...', {
          userEmail: user?.email,
        });
      }
      toast.error('Access denied. Admin privileges required.');
      navigate('/', { replace: true });
      return;
    }

    if (import.meta.env.DEV) {
      console.log('✅ [ADMIN DASHBOARD] Auth check passed, user is admin');
    }
  }, [user, userIsAdmin, authLoading, navigate, toast]);

  const quickActions = [
    {
      label: 'Create Recipe',
      icon: Plus,
      action: () => {
        setActiveTab('recipes');
        handleTabChange('recipes');
        setTimeout(() => {
          document.getElementById('recipe-editor-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      color: 'from-blue-500 to-cyan-500',
      shortcut: '1',
    },
    {
      label: 'View Users',
      icon: UsersIcon,
      action: () => handleTabChange('users'),
      color: 'from-green-500 to-emerald-500',
      shortcut: '3',
    },
    {
      label: 'View Analytics',
      icon: BookOpen,
      action: () => handleTabChange('analytics'),
      color: 'from-purple-500 to-pink-500',
      shortcut: '4',
    },
    {
      label: 'System Health',
      icon: Zap,
      action: () => handleTabChange('system'),
      color: 'from-orange-500 to-red-500',
      shortcut: '5',
    },
  ];

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', shortcut: '1' },
    { id: 'recipes', name: 'Recipes', shortcut: '2' },
    { id: 'users', name: 'Users', shortcut: '3' },
    { id: 'analytics', name: 'Analytics', shortcut: '4' },
    { id: 'features', name: 'Features', shortcut: '5' },
    { id: 'system', name: 'System', shortcut: '6' },
    { id: 'settings', name: 'Settings', shortcut: '7' },
  ];

  // Show loading state while auth is loading
  if (authLoading) {
    if (import.meta.env.DEV) {
      console.log('⏳ [ADMIN DASHBOARD] Rendering loading state - authLoading:', authLoading);
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400">Loading admin dashboard...</p>
          {import.meta.env.DEV && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Waiting for authentication to complete...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Login check already handled above - this is just for rendering
  if (import.meta.env.DEV) {
    console.log(
      '✅ [ADMIN DASHBOARD] Rendering dashboard - authLoading:',
      authLoading,
      'user:',
      !!user,
      'isAdmin:',
      userIsAdmin
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-4 xs:py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6">
        {/* Enhanced Header - MOBILE FRIENDLY */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 xs:mb-6 sm:mb-8"
        >
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4 mb-4 xs:mb-6">
            <div className="flex items-center gap-3 xs:gap-4 w-full xs:w-auto">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-xl xs:rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-2xl shrink-0"
              >
                <span className="text-3xl xs:text-4xl sm:text-5xl">👑</span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 mt-0.5 xs:mt-1">
                  <span className="hidden xs:inline">Manage and monitor your app • </span>
                  Press{' '}
                  <kbd className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-slate-200 dark:bg-slate-700 rounded text-[10px] xs:text-xs font-mono">
                    Ctrl+K
                  </kbd>{' '}
                  for shortcuts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 xs:gap-3 w-full xs:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowKeyboardShortcuts(true)}
                className="px-3 xs:px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold flex items-center gap-1.5 xs:gap-2 shadow-md text-xs xs:text-sm touch-manipulation min-h-[44px]"
              >
                <Command className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline">Shortcuts</span>
                <span className="xs:hidden">Keys</span>
              </motion.button>
              <BackToHome label="Back" className="text-xs xs:text-sm" />
            </div>
          </div>

          {user && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 xs:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md"
            >
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
                <p className="text-xs xs:text-sm text-blue-800 dark:text-blue-200 break-words">
                  <strong>Logged in as:</strong> <span className="break-all">{user.email}</span>
                  {isAdminUser && (
                    <span className="ml-2 xs:ml-3 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-[10px] xs:text-xs font-bold inline-block mt-1 xs:mt-0">
                      ✅ Admin User
                    </span>
                  )}
                </p>
                <Sparkles className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-500 animate-pulse shrink-0" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Quick Actions - MOBILE FRIENDLY */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 xs:mb-6 sm:mb-8"
          >
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.action}
                    className={`bg-gradient-to-br ${action.color} text-white rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 flex flex-col items-center gap-2 xs:gap-3 shadow-xl hover:shadow-2xl transition-all group touch-manipulation min-h-[100px] xs:min-h-[120px]`}
                  >
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg xs:rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Icon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xs xs:text-sm font-bold text-center leading-tight">
                      {action.label}
                    </span>
                    <kbd className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-white/20 rounded text-[10px] xs:text-xs font-mono">
                      {action.shortcut}
                    </kbd>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <AdminNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <AdminStatsWidget />
                {/* Quick Workflow Guide - MOBILE FRIENDLY */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-pink-900/20 rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 border-2 border-purple-300 dark:border-purple-700 shadow-xl"
                >
                  <div className="flex flex-col xs:flex-row items-start gap-3 xs:gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="w-12 h-12 xs:w-14 xs:h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center shrink-0 shadow-lg"
                    >
                      <span className="text-2xl xs:text-3xl">🚀</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 xs:mb-4 text-slate-900 dark:text-white">
                        ChatGPT Recipe Generation Workflow
                      </h2>
                      <ol className="space-y-2 xs:space-y-3 text-xs xs:text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
                        <li className="p-2 xs:p-2.5 bg-white/50 dark:bg-slate-800/50 rounded-lg leading-relaxed">
                          <strong>Export Reference:</strong> Click "📤 Export Complete Recipe" on a
                          correct recipe → Copy JSON → Send to ChatGPT
                        </li>
                        <li className="p-2 xs:p-2.5 bg-white/50 dark:bg-slate-800/50 rounded-lg leading-relaxed">
                          <strong>Get JSON:</strong> ChatGPT generates complete recipe JSON → Click
                          "📥 Import JSON" → Paste → Save
                        </li>
                        <li className="p-2 xs:p-2.5 bg-white/50 dark:bg-slate-800/50 rounded-lg leading-relaxed">
                          <strong>Get Image:</strong> Ask ChatGPT "Generate image" → Download JPEG
                          (≤100KB) → Upload → Save
                        </li>
                        <li className="p-2 xs:p-2.5 bg-white/50 dark:bg-slate-800/50 rounded-lg leading-relaxed">
                          <strong>Repeat:</strong> Use Batch Mode to keep modal open for faster
                          processing
                        </li>
                      </ol>
                      <div className="mt-3 xs:mt-4 p-3 xs:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] xs:text-xs font-bold text-amber-900 dark:text-amber-200 flex items-start xs:items-center gap-2 leading-relaxed">
                          <span className="text-base xs:text-lg shrink-0">⚠️</span>
                          <span>Image Requirements: JPEG only, ≤100KB, 1024×1024 pixels</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'recipes' && (
              <div className="space-y-6">
                {/* Show Missing Images Viewer if filter is set */}
                {(() => {
                  if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.log('🔍 [ADMIN DASHBOARD] Recipes tab active', {
                      activeTab,
                      filterParam,
                      shouldShowViewer:
                        filterParam === 'missing-images' || filterParam === 'missing-nutrition',
                    });
                  }
                  if (filterParam === 'missing-images' || filterParam === 'missing-nutrition') {
                    return <MissingImagesViewer />;
                  }
                  return (
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 border-2 border-blue-300 dark:border-blue-700 shadow-xl">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 mb-4 xs:mb-5 sm:mb-6">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 flex items-center justify-center shadow-lg shrink-0">
                          <span className="text-xl xs:text-2xl">✏️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl xs:text-2xl font-bold text-slate-900 dark:text-white">
                            Recipe Editor
                          </h2>
                          <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                            Import ChatGPT JSON, upload images, and manage recipes
                          </p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 xs:p-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                        <RecipeEditor />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'users' && <UserManagement />}

            {activeTab === 'analytics' && <RecipeAnalytics />}

            {activeTab === 'features' && <FeatureAnalytics />}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <AdminIntegrationChecker />
                <SystemHealth />
                <AdminIntegrations />
              </div>
            )}

            {activeTab === 'settings' && <AdminSettings />}
          </motion.div>
        </AnimatePresence>

        {/* Keyboard Shortcuts Modal */}
        <AnimatePresence>
          {showKeyboardShortcuts && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowKeyboardShortcuts(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-700 shadow-2xl z-50 max-w-2xl w-[calc(100%-2rem)] xs:w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4 xs:mb-5 sm:mb-6">
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Keyboard Shortcuts
                  </h3>
                  <button
                    onClick={() => setShowKeyboardShortcuts(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close shortcuts"
                  >
                    <X className="w-5 h-5 xs:w-6 xs:h-6" />
                  </button>
                </div>
                <div className="space-y-2 xs:space-y-3">
                  {tabs.map(tab => (
                    <div
                      key={tab.id}
                      className="flex items-center justify-between p-2.5 xs:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {tab.name}
                      </span>
                      <kbd className="px-2 xs:px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px] xs:text-xs sm:text-sm">
                        {tab.shortcut}
                      </kbd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-2.5 xs:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      Show Shortcuts
                    </span>
                    <kbd className="px-2 xs:px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px] xs:text-xs sm:text-sm">
                      Ctrl+K
                    </kbd>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
