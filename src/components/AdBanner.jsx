import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shouldShowAds, hasAdsDisabled } from '../utils/subscription.js';
import { useNavigate } from 'react-router-dom';

/**
 * Ad Banner Component
 * Displays ads for free users, can be removed with subscription
 */
export default function AdBanner({
  position = 'bottom', // "top", "bottom", "inline"
  size = 'banner', // "banner", "square", "skyscraper"
  className = '',
  onClose,
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Don't show ads if user has paid subscription
  if (!shouldShowAds() || dismissed) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/');
    // Open ProModal - this will be handled by parent component
    window.dispatchEvent(new CustomEvent('openProModal'));
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) onClose();
  };

  // Ad content (simulated - replace with real ad network)
  const adContent = {
    banner: {
      height: 'h-auto sm:h-20 md:h-24 min-h-[80px] sm:min-h-[80px] md:min-h-[96px]',
      content: (
        <div className="flex items-center justify-between w-full h-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-lg flex-shrink-0">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                Upgrade to remove ads
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Get unlimited searches & features
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleUpgrade}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] sm:text-xs md:text-sm font-semibold rounded-md sm:rounded-lg transition-all whitespace-nowrap min-h-[36px] sm:min-h-0 touch-manipulation"
            >
              <span className="hidden sm:inline">Upgrade Now</span>
              <span className="sm:hidden">Upgrade</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1 sm:px-2 text-lg sm:text-xl flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
              title="Dismiss (temporary)"
            >
              ×
            </button>
          </div>
        </div>
      ),
    },
    square: {
      height: 'h-64',
      content: (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="text-4xl mb-3">📢</div>
          <div className="text-center mb-4">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advertisement
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Upgrade to remove ads</div>
          </div>
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Go Ad-Free
          </button>
        </div>
      ),
    },
  };

  const ad = adContent[size] || adContent.banner;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          className={`${ad.height} w-full bg-white dark:bg-slate-800 border-t border-b border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
        >
          {ad.content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline Ad Component
 * Shows smaller ads within content
 */
export function InlineAd({ className = '' }) {
  const navigate = useNavigate();

  if (!shouldShowAds()) {
    return null;
  }

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
              Remove ads & unlock features
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              From $2.99/month
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            navigate('/');
            window.dispatchEvent(new CustomEvent('openProModal'));
          }}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg transition-all whitespace-nowrap flex-shrink-0 min-h-[36px] sm:min-h-0 touch-manipulation"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}
