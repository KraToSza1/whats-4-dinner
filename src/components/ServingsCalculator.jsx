import React from 'react';
import { motion } from 'framer-motion';

export default function ServingsCalculator({ originalServings, targetServings, onServingsChange }) {
  // Protect against division by zero and invalid values
  const ratio =
    originalServings > 0 &&
    targetServings > 0 &&
    Number.isFinite(originalServings) &&
    Number.isFinite(targetServings)
      ? targetServings / originalServings
      : 1;

  // Common serving sizes for quick selection
  const commonServings = [1, 2, 4, 6, 8, 10, 12];

  const scaleAmount = amount => {
    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount)) return amount;
    if (!Number.isFinite(ratio)) return amount;
    const scaled = amount * ratio;
    // Round to 2 decimal places for clean display, ensure result is valid
    return Number.isFinite(scaled) ? Math.round(scaled * 100) / 100 : amount;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 xs:mb-6 p-3 xs:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg xs:rounded-xl border border-emerald-200 dark:border-emerald-800"
    >
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4 mb-3">
        <div className="flex items-center gap-2 xs:gap-3 flex-1 min-w-0">
          <span className="text-xl xs:text-2xl flex-shrink-0">🍽️</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm xs:text-base">Adjust Servings</h3>
            <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 break-words">
              Original recipe makes: {originalServings}{' '}
              {originalServings === 1 ? 'serving' : 'servings'}
            </p>
            <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-500 mt-0.5 italic">
              Nutrition values will scale automatically
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 xs:gap-2 w-full xs:w-auto justify-center xs:justify-end">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onServingsChange(Math.max(1, targetServings - 1))}
            className="w-10 h-10 xs:w-9 xs:h-9 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-lg xs:text-base touch-manipulation min-h-[44px] xs:min-h-0"
            aria-label="Decrease servings"
          >
            −
          </motion.button>

          <input
            type="number"
            min="1"
            max="50"
            value={targetServings}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= 50) {
                onServingsChange(val);
              }
            }}
            className="w-20 xs:w-16 text-center font-bold text-base xs:text-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-emerald-500 rounded-lg px-2 py-2 xs:py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 touch-manipulation min-h-[44px] xs:min-h-0"
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onServingsChange(Math.min(50, targetServings + 1))}
            className="w-10 h-10 xs:w-9 xs:h-9 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-lg xs:text-base touch-manipulation min-h-[44px] xs:min-h-0"
            aria-label="Increase servings"
          >
            +
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onServingsChange(originalServings)}
            className="px-3 xs:px-3 py-2 xs:py-1 text-xs xs:text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 touch-manipulation min-h-[44px] xs:min-h-0"
            title="Reset to original"
          >
            Reset
          </motion.button>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div className="space-y-2">
        <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 block xs:inline">
          Quick select:
        </span>
        <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
          {/* Half and Double buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onServingsChange(Math.max(1, Math.round(originalServings / 2)))}
            className="px-3 xs:px-2.5 py-2 xs:py-1 text-xs rounded-lg font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-900/50 touch-manipulation min-h-[40px] xs:min-h-0"
            title="Half recipe"
          >
            ½ Recipe
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onServingsChange(Math.round(originalServings * 2))}
            className="px-3 xs:px-2.5 py-2 xs:py-1 text-xs rounded-lg font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50 touch-manipulation min-h-[40px] xs:min-h-0"
            title="Double recipe"
          >
            2× Recipe
          </motion.button>
          {commonServings.map(serving => (
            <motion.button
              key={serving}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onServingsChange(serving)}
              className={`px-3 xs:px-2.5 py-2 xs:py-1 text-xs rounded-lg font-medium transition-colors touch-manipulation min-h-[40px] xs:min-h-0 ${
                targetServings === serving
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
            >
              {serving}
            </motion.button>
          ))}
        </div>
      </div>

      {ratio !== 1 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs xs:text-sm text-emerald-700 dark:text-emerald-300 font-medium break-words"
        >
          📊 All ingredients will be scaled {ratio > 1 ? 'up' : 'down'} by{' '}
          {Math.abs((ratio - 1) * 100).toFixed(0)}%
          {ratio > 1 && <span className="ml-1">(×{ratio.toFixed(2)})</span>}
          {ratio < 1 && (
            <span className="ml-1">(÷{(originalServings / targetServings).toFixed(2)})</span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
