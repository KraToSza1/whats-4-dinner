import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Meal Prep Mode - Shows batch cooking instructions and storage tips
 */
export default function MealPrepMode({ recipe, servings, onClose }) {
  const [prepDays, setPrepDays] = useState(3);
  const [storageMethod, setStorageMethod] = useState('refrigerator');

  if (!recipe) return null;

  const totalServings = servings || recipe.servings || 4;
  const servingsPerDay = Math.ceil(totalServings / prepDays);
  const storageDays = storageMethod === 'refrigerator' ? 3 : 7;

  const storageTips = {
    refrigerator: [
      'Store in airtight containers',
      'Keep at 4°C (40°F) or below',
      'Consume within 3 days',
      'Reheat to 74°C (165°F) before eating',
    ],
    freezer: [
      'Cool completely before freezing',
      'Use freezer-safe containers or bags',
      'Label with date and contents',
      'Thaw in refrigerator overnight',
      'Consume within 3 months for best quality',
    ],
  };

  const reheatingTips = [
    'Microwave: 2-3 minutes, stir halfway',
    'Oven: 350°F (175°C) for 15-20 minutes',
    'Stovetop: Medium heat, stir frequently',
    'Always check internal temperature reaches 165°F (74°C)',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 xs:p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-3 xs:p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-0.5 xs:mb-1">
                🍱 Meal Prep Mode
              </h2>
              <p className="text-orange-100 text-xs xs:text-sm truncate">{recipe.title}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation min-h-[44px] xs:min-h-0"
              aria-label="Close"
            >
              <X size={18} className="xs:w-5 xs:h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Meal Prep Calculator */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 border-2 border-orange-200 dark:border-orange-800">
            <h3 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 text-slate-900 dark:text-white">
              Meal Prep Calculator
            </h3>

            <div className="space-y-3 xs:space-y-4">
              <div>
                <label className="block text-xs xs:text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  How many days do you want to prep for?
                </label>
                <div className="flex gap-1.5 xs:gap-2 flex-wrap">
                  {[3, 4, 5, 6, 7].map(days => (
                    <motion.button
                      key={days}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPrepDays(days)}
                      className={`px-3 xs:px-4 py-2 rounded-lg font-medium text-xs xs:text-sm transition-colors touch-manipulation min-h-[44px] xs:min-h-0 ${
                        prepDays === days
                          ? 'bg-orange-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-orange-300 dark:border-orange-700'
                      }`}
                    >
                      {days} days
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 xs:p-4 border border-orange-200 dark:border-orange-800">
                <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 text-xs xs:text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Total Servings:</span>
                    <span className="ml-1 xs:ml-2 font-bold text-slate-900 dark:text-white block xs:inline">
                      {totalServings}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Per Day:</span>
                    <span className="ml-1 xs:ml-2 font-bold text-slate-900 dark:text-white block xs:inline">
                      {servingsPerDay} servings
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Prep Days:</span>
                    <span className="ml-1 xs:ml-2 font-bold text-slate-900 dark:text-white block xs:inline">
                      {prepDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Storage:</span>
                    <span className="ml-1 xs:ml-2 font-bold text-slate-900 dark:text-white capitalize block xs:inline">
                      {storageMethod}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Instructions */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 text-slate-900 dark:text-white">
              📦 Storage Instructions
            </h3>

            <div className="mb-3 xs:mb-4">
              <label className="block text-xs xs:text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Storage Method
              </label>
              <div className="flex gap-1.5 xs:gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStorageMethod('refrigerator')}
                  className={`flex-1 xs:flex-none px-3 xs:px-4 py-2.5 xs:py-2 rounded-lg font-medium text-xs xs:text-sm transition-colors touch-manipulation min-h-[44px] xs:min-h-0 ${
                    storageMethod === 'refrigerator'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-blue-300 dark:border-blue-700'
                  }`}
                >
                  Refrigerator
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStorageMethod('freezer')}
                  className={`flex-1 xs:flex-none px-3 xs:px-4 py-2.5 xs:py-2 rounded-lg font-medium text-xs xs:text-sm transition-colors touch-manipulation min-h-[44px] xs:min-h-0 ${
                    storageMethod === 'freezer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-blue-300 dark:border-blue-700'
                  }`}
                >
                  Freezer
                </motion.button>
              </div>
            </div>

            <ul className="space-y-1.5 xs:space-y-2">
              {storageTips[storageMethod].map((tip, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-1.5 xs:gap-2 text-xs xs:text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="break-words">{tip}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Reheating Instructions */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800">
            <h3 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 text-slate-900 dark:text-white">
              🔥 Reheating Instructions
            </h3>
            <ul className="space-y-1.5 xs:space-y-2">
              {reheatingTips.map((tip, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-1.5 xs:gap-2 text-xs xs:text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="break-words">{tip}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Container Size Suggestions */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 border-2 border-emerald-200 dark:border-emerald-800">
            <h3 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 text-slate-900 dark:text-white">
              📏 Container Size Suggestions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3">
              {[
                { size: 'Small (250ml)', servings: '1 serving' },
                { size: 'Medium (500ml)', servings: '2 servings' },
                { size: 'Large (750ml)', servings: '3 servings' },
                { size: 'Extra Large (1L)', servings: '4+ servings' },
              ].map((container, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-2 xs:p-3 border border-emerald-200 dark:border-emerald-800 text-center"
                >
                  <div className="font-semibold text-xs xs:text-sm text-slate-900 dark:text-white break-words">
                    {container.size}
                  </div>
                  <div className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400 mt-0.5 xs:mt-1">
                    {container.servings}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 xs:p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full px-4 py-3 xs:py-2 rounded-lg xs:rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-sm xs:text-base touch-manipulation min-h-[44px] xs:min-h-0"
          >
            Got it!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
