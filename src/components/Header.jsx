// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.tsx';
import { useAuth, signInWithEmail, signOut } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import ProModal from './ProModal.jsx';
import { getPlanName, isFreePlan } from '../utils/subscription.js';
import { useGroceryList } from '../context/GroceryListContext.jsx';
import { useToast } from './Toast.jsx';
import { useAdmin } from '../context/AdminContext';
import { isAdmin } from '../utils/admin';
import { useLanguage } from '../context/LanguageContext.jsx';
import InstallButton from './InstallButton.jsx';

export default function Header({ theme, toggleTheme, favorites, setFavorites }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open: groceryOpen, setOpen: setGroceryOpen, items: groceryItems } = useGroceryList();
  const { adminModeEnabled } = useAdmin();
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [planName, setPlanName] = useState(getPlanName());
  const [isFree, setIsFree] = useState(isFreePlan());
  const userEmail = typeof user === 'object' && user?.email ? user.email : null;

  // Listen for plan changes and refresh plan name
  useEffect(() => {
    const handlePlanChange = () => {
      setPlanName(getPlanName());
      setIsFree(isFreePlan());
    };
    window.addEventListener('subscriptionPlanChanged', handlePlanChange);
    return () => window.removeEventListener('subscriptionPlanChanged', handlePlanChange);
  }, []);
  // STRICT ADMIN CHECK: Only show admin menu if:
  // 1. User is authenticated
  // 2. User email is in admin allowlist (raymondvdw@gmail.com or VITE_SECOND_ADMIN_EMAIL)
  // 3. Admin mode is enabled (for UI visibility)
  const userIsAdmin = user ? isAdmin(user) : false;
  const showAdmin = userIsAdmin && adminModeEnabled;

  useEffect(() => {
    if (showMenu) {
      const handleKeyDown = event => {
        if (event.key === 'Escape') {
          setShowMenu(false);
        }
      };

      // Handle clicks outside the menu
      const handleClickOutside = event => {
        const menuElement = document.querySelector('[data-menu="true"]');
        const hamburgerButton = event.target.closest('[data-hamburger="true"]');

        // Don't close if clicking the hamburger button (it toggles itself)
        if (hamburgerButton) {
          return;
        }

        // Close if clicking outside the menu
        if (menuElement && !menuElement.contains(event.target)) {
          setShowMenu(false);
        }
      };

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Use mousedown instead of click for better responsiveness
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }

    return undefined;
  }, [showMenu]);

  const scrollToCalorieTracker = () => {
    // Try multiple times in case component hasn't rendered yet
    let attempts = 0;
    const tryScroll = () => {
      const calorieSection = document.getElementById('calorie-tracker-section');
      if (calorieSection) {
        calorieSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 100);
      }
    };
    tryScroll();
  };
  return (
    <>
      {/* Install Banner - Shows at top when installable */}
      <InstallButton showBanner={true} />

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800"
        style={{ marginTop: 0 }}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 sm:gap-2 md:gap-3 cursor-pointer flex-shrink-0 min-w-0"
            onClick={() => {
              if (window.location.pathname !== '/') {
                navigate('/');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (window.location.pathname !== '/') {
                  navigate('/');
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="flex-shrink-0"
            >
              <Logo className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-500" aria-hidden />
            </motion.div>
            <h1 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate min-w-0">
              What's{' '}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-emerald-500 inline-block"
              >
                4
              </motion.span>{' '}
              Dinner?
            </h1>
          </motion.div>

          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
            {/* Favorites button (always visible) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigate('/favorites');
              }}
              className="relative px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 md:py-1.5 rounded-md text-[10px] sm:text-xs md:text-sm bg-rose-600 hover:bg-rose-700 text-white whitespace-nowrap inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 min-h-[36px] sm:min-h-[38px] md:min-h-0 touch-manipulation flex-shrink-0"
              title={`View ${favorites.length} saved favorites`}
            >
              <span className="text-sm sm:text-base md:text-lg flex-shrink-0">❤️</span>
              <span className="hidden sm:inline">{t('favorites')}</span>
              <AnimatePresence mode="wait">
                {favorites.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center justify-center min-w-[16px] sm:min-w-[18px] md:min-w-[20px] h-4 sm:h-4.5 md:h-5 px-0.5 sm:px-1 text-[9px] sm:text-[10px] md:text-xs font-bold bg-white/30 rounded-full flex-shrink-0"
                  >
                    {favorites.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Calorie Tracker button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (window.location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    scrollToCalorieTracker();
                  }, 300);
                } else {
                  scrollToCalorieTracker();
                }
              }}
              className="relative px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 md:py-1.5 rounded-md text-[10px] sm:text-xs md:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white whitespace-nowrap inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 min-h-[36px] sm:min-h-[38px] md:min-h-0 touch-manipulation flex-shrink-0"
              title="View calorie tracker"
            >
              <span className="text-sm sm:text-base md:text-lg flex-shrink-0">📊</span>
              <span className="hidden sm:inline">{t('calories')}</span>
            </motion.button>

            {/* Grocery List button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGroceryOpen(!groceryOpen)}
              className="relative px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 md:py-1.5 rounded-md text-[10px] sm:text-xs md:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white whitespace-nowrap inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 min-h-[36px] sm:min-h-[38px] md:min-h-0 touch-manipulation flex-shrink-0"
              title={`Open grocery list (${groceryItems.length} items)`}
            >
              <span className="text-sm sm:text-base md:text-lg flex-shrink-0">🛒</span>
              <span className="hidden sm:inline">{t('groceryList')}</span>
              <AnimatePresence mode="wait">
                {groceryItems.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center justify-center min-w-[16px] sm:min-w-[18px] md:min-w-[20px] h-4 sm:h-4.5 md:h-5 px-0.5 sm:px-1 text-[9px] sm:text-[10px] md:text-xs font-bold bg-white/30 rounded-full flex-shrink-0"
                  >
                    {groceryItems.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Menu Button */}
            <div className="relative flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(!showMenu)}
                data-hamburger="true"
                className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 touch-manipulation flex-shrink-0"
                title="More options"
              >
                <motion.span
                  animate={showMenu ? { rotate: 90 } : { rotate: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg sm:text-xl md:text-2xl"
                >
                  ☰
                </motion.span>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm sm:backdrop-blur-sm"
                      onClick={() => setShowMenu(false)}
                      onMouseDown={() => setShowMenu(false)}
                      onTouchStart={() => setShowMenu(false)}
                      data-backdrop="true"
                      aria-hidden="true"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()}
                      data-menu="true"
                      className="fixed sm:absolute top-16 sm:top-auto right-2 sm:right-0 mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-64 md:w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 max-h-[calc(100vh-5rem)] sm:max-h-[85vh] overflow-y-auto overscroll-contain"
                    >
                      {/* Account Section */}
                      <div className="px-3 py-2">
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 sm:px-3 mb-2">
                          Account
                        </div>

                        {userEmail ? (
                          <>
                            <div className="px-3 sm:px-4 py-2 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
                                Signed in as
                              </div>
                              <div className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 truncate break-all">
                                {userEmail}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setShowMenu(false);
                                navigate('/profile');
                              }}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors mb-1 touch-manipulation"
                            >
                              <svg
                                className="w-5 h-5 text-slate-600 dark:text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="font-medium">Profile & Settings</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowMenu(false);
                                signOut();
                              }}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors touch-manipulation"
                            >
                              <svg
                                className="w-5 h-5 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                Sign Out
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              setAuthOpen(true);
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 touch-manipulation"
                          >
                            <svg
                              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Sign In / Sign Up
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Install App Button */}
                      <div className="px-3 py-2">
                        <InstallButton compact={true} />
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

                      {/* Subscription Section */}
                      <div className="px-3 py-2">
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 sm:px-3 mb-2">
                          Subscription
                        </div>

                        <div className="px-3 sm:px-4 py-2 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                              Current Plan
                            </span>
                            <span
                              className={`text-sm sm:text-base font-bold ${
                                isFree ? 'text-amber-500' : 'text-emerald-500'
                              }`}
                            >
                              {planName}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setProOpen(true);
                          }}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation ${
                            isFree
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 font-semibold'
                              : ''
                          }`}
                        >
                          <svg
                            className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {isFree ? 'Upgrade Plan' : 'Change Plan'}
                          </span>
                        </button>

                        {!isFree && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              navigate('/billing');
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors touch-manipulation"
                          >
                            <svg
                              className="w-5 h-5 text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            <span className="font-medium">Billing & Payments</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

                      {/* Features Section */}
                      <div className="px-3 py-2">
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 sm:px-3 mb-2">
                          Features
                        </div>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/favorites');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-rose-600 dark:text-rose-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="font-medium">Favorites</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/meal-planner');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="font-medium">Meal Planner</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/meal-reminders');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">Meal Reminders</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/budget-tracker');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">Budget Tracker</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/family-plan');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0M7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className="font-medium">Family Plan</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/collections');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span className="font-medium">Collections</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/analytics');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <span className="font-medium">Analytics</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/water-tracker');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all touch-manipulation"
                        >
                          <span className="text-xl">💧</span>
                          <span className="font-medium">Water Tracker</span>
                          <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            FREE
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/dietician-ai');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all touch-manipulation"
                        >
                          <span className="text-xl">🤖</span>
                          <span className="font-medium">AI Dietician</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            console.log('[Header] Dispatching openMiniGames event');
                            window.dispatchEvent(
                              new CustomEvent('openMiniGames', { bubbles: true })
                            );
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-all touch-manipulation"
                        >
                          <span className="text-xl">🎮</span>
                          <span className="font-medium">Mini-Games</span>
                          <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            FREE
                          </span>
                        </button>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

                      {/* Settings Section */}
                      <div className="px-3 py-2">
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 sm:px-3 mb-2">
                          Settings
                        </div>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            toggleTheme();
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 sm:gap-3 justify-between transition-colors mb-1 touch-manipulation"
                        >
                          <div className="flex items-center gap-3">
                            {theme === 'dark' ? (
                              <svg
                                className="w-5 h-5 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                              </svg>
                            )}
                            <span className="font-medium">
                              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/profile');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-slate-600 dark:text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="font-medium">Settings</span>
                        </button>
                      </div>

                      {/* Help & Support Section */}
                      <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                      <div className="px-3 py-2">
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 sm:px-3 mb-2">
                          Help & Support
                        </div>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/help');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-slate-600 dark:text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">Help & FAQ</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/terms');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors mb-1 touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="font-medium">Terms of Service</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate('/privacy');
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors touch-manipulation"
                        >
                          <svg
                            className="w-5 h-5 text-slate-600 dark:text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <span className="font-medium text-xs">Privacy Policy</span>
                        </button>
                      </div>

                      {/* Admin Section - Only show if admin mode is enabled */}
                      {showAdmin && (
                        <>
                          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                          <div className="px-3 py-2">
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 sm:px-3 mb-2">
                              Admin
                            </div>

                            <button
                              onClick={() => {
                                setShowMenu(false);
                                navigate('/admin');
                              }}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-2 sm:gap-3 transition-colors touch-manipulation bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10"
                            >
                              <svg
                                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path
                                  fillRule="evenodd"
                                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                Admin Dashboard
                              </span>
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProModal open={proOpen} onClose={() => setProOpen(false)} />
    </>
  );
}
