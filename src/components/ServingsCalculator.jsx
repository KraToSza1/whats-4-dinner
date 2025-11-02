import React from "react";
import { motion } from "framer-motion";

export default function ServingsCalculator({ originalServings, targetServings, onServingsChange }) {
    const ratio = targetServings / originalServings;
    
    const scaleAmount = (amount) => {
        if (!amount || typeof amount !== 'number') return amount;
        const scaled = amount * ratio;
        // Round to 2 decimal places for clean display
        return Math.round(scaled * 100) / 100;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🍽️</span>
                    <div>
                        <h3 className="font-bold text-sm sm:text-base">Adjust Servings</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            Original: {originalServings} servings
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onServingsChange(Math.max(1, targetServings - 1))}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        aria-label="Decrease servings"
                    >
                        −
                    </motion.button>
                    
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={targetServings}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= 50) {
                                onServingsChange(val);
                            }
                        }}
                        className="w-16 text-center font-bold text-lg bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onServingsChange(Math.min(50, targetServings + 1))}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        aria-label="Increase servings"
                    >
                        +
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onServingsChange(originalServings)}
                        className="px-3 py-1 text-xs sm:text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                        title="Reset to original"
                    >
                        Reset
                    </motion.button>
                </div>
            </div>

            {ratio !== 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium"
                >
                    📊 All ingredients will be scaled {ratio > 1 ? 'up' : 'down'} by {Math.abs((ratio - 1) * 100).toFixed(0)}%
                    {ratio > 1 && <span className="ml-1">(×{ratio.toFixed(2)})</span>}
                    {ratio < 1 && <span className="ml-1">(÷{originalServings / targetServings})</span>}
                </motion.div>
            )}
        </motion.div>
    );
}

