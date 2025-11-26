import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, Sparkles } from 'lucide-react';

/**
 * MiniGamePrompt - Subtle, engaging prompts to encourage users to play mini-games
 * while cooking or waiting
 */
export default function MiniGamePrompt({
  variant = 'floating', // 'floating', 'inline', 'banner'
  context = 'cooking', // 'cooking', 'timer', 'favorite', 'dashboard'
  onOpen,
  onDismiss,
  autoShow = true,
  delay = 3000, // Show after this many milliseconds
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!autoShow || dismissed) return;

    const timer = setTimeout(() => {
      // Check if user has dismissed this context before
      const dismissedKey = `minigame-prompt-dismissed-${context}`;
      const wasDismissed = localStorage.getItem(dismissedKey);
      if (!wasDismissed) {
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [autoShow, delay, context, dismissed]);

  const handleOpen = () => {
    setIsVisible(false);
    if (onOpen) {
      onOpen();
    } else {
      window.dispatchEvent(new CustomEvent('openMiniGames'));
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    // Remember dismissal for this context
    const dismissedKey = `minigame-prompt-dismissed-${context}`;
    localStorage.setItem(dismissedKey, 'true');
    if (onDismiss) onDismiss();
  };

  const messages = {
    cooking: {
      emoji: '🎮',
      title: 'Bored while cooking?',
      message: 'Play fun mini-games while you wait!',
      cta: 'Play Now',
    },
    timer: {
      emoji: '⏱️',
      title: 'Timer running?',
      message: 'Pass the time with fun cooking games!',
      cta: 'Play Games',
    },
    favorite: {
      emoji: '⭐',
      title: 'Recipe saved!',
      message: 'Play mini-games while you cook it!',
      cta: 'Try Games',
    },
    dashboard: {
      emoji: '🎯',
      title: 'Level up faster!',
      message: 'Play mini-games to earn bonus XP!',
      cta: 'Play & Earn',
    },
  };

  const message = messages[context] || messages.cooking;

  if (dismissed || !isVisible) return null;

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 sm:bottom-24 right-4 z-40 max-w-xs"
          >
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-2xl p-4 border-2 border-white/20 backdrop-blur-sm">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              <div className="flex items-center gap-3 pr-6">
                <div className="text-3xl flex-shrink-0">{message.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm mb-0.5">{message.title}</div>
                  <div className="text-white/90 text-xs">{message.message}</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                className="w-full mt-3 px-4 py-2 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm touch-manipulation min-h-[44px]"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{message.cta}</span>
                <Sparkles className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'inline') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800 relative"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 transition-colors z-10 touch-manipulation"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="text-3xl flex-shrink-0">{message.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-900 dark:text-white font-bold text-sm sm:text-base mb-1">
                  {message.title}
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm mb-3">
                  {message.message}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpen}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{message.cta}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl p-3 sm:p-4 shadow-lg border-2 border-white/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl sm:text-3xl flex-shrink-0">{message.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm sm:text-base mb-0.5">
                    {message.title}
                  </div>
                  <div className="text-white/90 text-xs sm:text-sm">{message.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpen}
                  className="px-3 sm:px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                >
                  <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{message.cta}</span>
                  <span className="xs:hidden">Play</span>
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
}
