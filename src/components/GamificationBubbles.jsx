import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import StreakCounter from './StreakCounter.jsx';
import XPBar from './XPBar.jsx';
import DailyChallenge from './DailyChallenge.jsx';

export default function GamificationBubbles() {
  const [openModal, setOpenModal] = useState(null); // 'streak', 'progress', or 'challenges'

  const bubbles = [
    {
      id: 'streak',
      icon: '🔥',
      label: 'Cooking Streak',
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-300 dark:border-orange-700',
      hoverColor: 'hover:border-orange-400 dark:hover:border-orange-600',
    },
    {
      id: 'progress',
      icon: '✨',
      label: 'Your Progress',
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      hoverColor: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    },
    {
      id: 'challenges',
      icon: '🏆',
      label: 'Daily Challenges',
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-300 dark:border-purple-700',
      hoverColor: 'hover:border-purple-400 dark:hover:border-purple-600',
    },
  ];

  const renderModalContent = () => {
    switch (openModal) {
      case 'streak':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cooking Streak</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Keep the fire burning!</p>
              </div>
            </div>
            <StreakCounter size="default" showLongest={true} />
          </div>
        );
      case 'progress':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Progress</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Level up and earn rewards!</p>
              </div>
            </div>
            <XPBar size="default" showLevel={true} showTitle={true} />
          </div>
        );
      case 'challenges':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Challenges</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Complete challenges to earn XP!</p>
              </div>
            </div>
            <DailyChallenge
              onComplete={_challenge => {
                // Challenge completion handled internally
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Bubble Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 xs:mb-6 sm:mb-8 flex-wrap justify-center">
        {bubbles.map(bubble => (
          <motion.button
            key={bubble.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpenModal(bubble.id)}
            className={`
              group relative
              px-2.5 xs:px-3 sm:px-4
              py-1 xs:py-1.5 sm:py-2
              rounded-full
              bg-white/25 dark:bg-white/20
              backdrop-blur-md
              border-2 ${bubble.borderColor} ${bubble.hoverColor}
              text-white
              font-bold text-xs xs:text-sm
              shadow-lg shadow-white/10
              transition-all duration-300
              flex items-center gap-1.5 sm:gap-2
              min-h-[44px] sm:min-h-0
              touch-manipulation
            `}
          >
            <span className="text-base sm:text-lg">{bubble.icon}</span>
            <span className="hidden sm:inline">{bubble.label}</span>
            <span className="sm:hidden">{bubble.label.split(' ')[0]}</span>
          </motion.button>
        ))}
      </div>

      {/* Modal */}
      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {openModal && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpenModal(null)}
                  className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50"
                />

                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:w-full z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex-1" />
                    <button
                      onClick={() => setOpenModal(null)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 max-h-[calc(100vh-8rem)] sm:max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {renderModalContent()}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

