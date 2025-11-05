// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import * as LogoMod from "../assets/Logo.tsx";
import { useAuth, signInWithEmail, signOut } from "../context/AuthContext.jsx";
import AuthModal from "./AuthModal.jsx";
import ProModal from "./ProModal.jsx";
import UnitConverter from "./UnitConverter.jsx";
import { exportFavorites, importFavorites } from "../helpers/favoritesIO";

const Logo = LogoMod.default || LogoMod.Logo || (() => <span className="font-bold">W4D</span>);

export default function Header({ theme, toggleTheme, favorites, setFavorites }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [authOpen, setAuthOpen] = useState(false);
    const [proOpen, setProOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const userEmail = typeof user === "object" && user?.email ? user.email : null;

    const scrollToCalorieTracker = () => {
        // Try multiple times in case component hasn't rendered yet
        let attempts = 0;
        const tryScroll = () => {
            const calorieSection = document.getElementById("calorie-tracker-section");
            if (calorieSection) {
                calorieSection.scrollIntoView({ behavior: "smooth", block: "start" });
            } else if (attempts < 10) {
                attempts++;
                setTimeout(tryScroll, 100);
            }
        };
        tryScroll();
    };
    return (
        <>
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800"
        >
            <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                    onClick={() => {
                        if (window.location.pathname !== '/') {
                            navigate('/');
                        } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
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
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <Logo className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" aria-hidden />
                    </motion.div>
                    <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                        What's <motion.span 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="text-emerald-500 inline-block"
                        >4</motion.span> Dinner?
                    </h1>
                </motion.div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Favorites button (always visible) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (window.location.pathname !== '/') {
                                navigate('/');
                                setTimeout(() => {
                                    const favoritesSection = document.getElementById("favorites-section");
                                    if (favoritesSection) {
                                        favoritesSection.scrollIntoView({ behavior: "smooth" });
                                    }
                                }, 100);
                            } else {
                                const favoritesSection = document.getElementById("favorites-section");
                                if (favoritesSection) {
                                    favoritesSection.scrollIntoView({ behavior: "smooth" });
                                }
                            }
                        }}
                        className="relative px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white whitespace-nowrap inline-flex items-center gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-0 touch-manipulation"
                        title={`View ${favorites.length} saved favorites`}
                    >
                        <span className="text-base sm:text-lg">❤️</span>
                        <span className="hidden xs:inline sm:inline">Favorites</span>
                        <AnimatePresence mode="wait">
                            {favorites.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 text-[10px] sm:text-xs font-bold bg-white/30 rounded-full"
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
                        className="relative px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white whitespace-nowrap inline-flex items-center gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-0 touch-manipulation"
                        title="View calorie tracker"
                    >
                        <span className="text-base sm:text-lg">📊</span>
                        <span className="hidden xs:inline sm:inline">Calories</span>
                    </motion.button>

                    {/* Menu Button */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowMenu(!showMenu)}
                            className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10"
                            title="More options"
                        >
                            <motion.span 
                                animate={showMenu ? { rotate: 90 } : { rotate: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-xl sm:text-2xl"
                            >
                                ☰
                            </motion.span>
                        </motion.button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 sm:w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 max-h-[85vh] overflow-y-auto"
                                    >
                                        {/* Sign In First */}
                                        {userEmail ? (
                                            <>
                                                <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {userEmail}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        signOut();
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                                >
                                                    <span>🚪</span> Sign Out
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setAuthOpen(true);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                            >
                                                <span>🔐</span> Sign In
                                            </button>
                                        )}

                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                                        {/* Go Pro */}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                setProOpen(true);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 flex items-center gap-3 transition-all"
                                        >
                                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Go Pro</span>
                                        </button>

                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                                        {/* Export */}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                exportFavorites(favorites);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span className="font-medium">Export Favorites</span>
                                        </button>

                                        {/* Import */}
                                        <label className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer transition-colors">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            <span className="font-medium">Import Favorites</span>
                                            <input
                                                type="file"
                                                accept="application/json"
                                                className="hidden"
                                                onChange={(e) => {
                                                    setShowMenu(false);
                                                    importFavorites(e.target.files?.[0], (data) => {
                                                        setFavorites(data);
                                                        localStorage.setItem("favorites", JSON.stringify(data));
                                                    });
                                                }}
                                            />
                                        </label>

                                        {/* Meal Planner */}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                navigate("/meal-planner");
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 transition-all"
                                        >
                                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="font-semibold text-purple-600 dark:text-purple-400">Meal Planner</span>
                                        </button>

                                        {/* Family Plan */}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                navigate("/family-plan");
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center gap-3 transition-all"
                                        >
                                            <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span className="font-semibold text-pink-600 dark:text-pink-400">Family Plan</span>
                                        </button>

                                        {/* Analytics */}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                navigate("/analytics");
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-all"
                                        >
                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">Analytics</span>
                                        </button>

                                        {/* Profile */}
                                        {user && (
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    navigate("/profile");
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="font-medium">Profile & Settings</span>
                                            </button>
                                        )}

                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                                        {/* Theme Toggle */}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                toggleTheme();
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 justify-between transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {theme === "dark" ? (
                                                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                                    </svg>
                                                )}
                                                <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                            </div>
                                        </button>

                                        {/* Unit Converter - At the Bottom */}
                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                                        <UnitConverter isInMenu={true} onClose={() => setShowMenu(false)} />
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
