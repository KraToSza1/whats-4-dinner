// src/components/PantryChips.jsx
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'chicken',
  'rice',
  'eggs',
  'tomato',
  'pasta',
  'broccoli',
  'bacon',
  'tofu',
  'onion',
  'cheese',
  'garlic',
  'potato',
  'carrot',
  'bell pepper',
  'mushroom',
  'spinach',
  'lettuce',
  'avocado',
  'cucumber',
  'zucchini',
  'corn',
  'peas',
  'beans',
  'lentils',
  'quinoa',
  'bread',
  'flour',
  'sugar',
  'butter',
  'milk',
  'yogurt',
  'cream',
  'lemon',
  'lime',
  'apple',
  'banana',
  'strawberry',
];

const CATEGORIES = {
  Protein: ['chicken', 'eggs', 'bacon', 'tofu', 'beans', 'lentils'],
  Vegetables: [
    'tomato',
    'broccoli',
    'onion',
    'garlic',
    'potato',
    'carrot',
    'bell pepper',
    'mushroom',
    'spinach',
    'lettuce',
    'avocado',
    'cucumber',
    'zucchini',
    'corn',
    'peas',
  ],
  Grains: ['rice', 'pasta', 'quinoa', 'bread', 'flour'],
  Dairy: ['cheese', 'milk', 'yogurt', 'cream', 'butter'],
  Fruits: ['lemon', 'lime', 'apple', 'banana', 'strawberry'],
  Other: ['sugar'],
};

export default function PantryChips({ pantry, setPantry, onSearch }) {
  const [custom, setCustom] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const inputRef = useRef(null);

  const toggle = item =>
    setPantry(cur => (cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item]));

  const addCustom = () => {
    const val = custom.trim().toLowerCase();
    if (!val) return;
    setPantry(cur => (cur.includes(val) ? cur : [...cur, val]));
    setCustom('');
    inputRef.current?.focus();
  };

  const clearAll = () => {
    if (pantry.length > 0) {
      setPantry([]);
    }
  };

  const getFilteredSuggestions = () => {
    if (activeCategory === 'All') return SUGGESTIONS;
    return CATEGORIES[activeCategory] || [];
  };

  const categories = ['All', ...Object.keys(CATEGORIES)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-4 sm:mt-6"
    >
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-4 sm:p-6 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-xl">🥘</span>
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                What's in your pantry?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Select ingredients you have on hand
              </p>
            </div>
          </div>
          <AnimatePresence>
            {pantry.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-sm"
                title="Clear all ingredients"
              >
                ✕ Clear All
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  activeCategory === cat
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected Count */}
        {pantry.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
          >
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ✓ {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''} selected
            </p>
          </motion.div>
        )}

        {/* Ingredient Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <AnimatePresence mode="popLayout">
            {getFilteredSuggestions().map((s, idx) => {
              const active = pantry.includes(s);
              return (
                <motion.button
                  key={s}
                  layout
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: idx * 0.01 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => toggle(s)}
                  aria-pressed={active}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all text-sm shadow-sm ${
                    active
                      ? 'bg-emerald-500 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-500 shadow-md'
                      : 'bg-white/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  {active && <span className="mr-1.5">✓</span>}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add Custom Ingredient */}
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm flex-shrink-0 hidden sm:flex">
            <span className="text-lg">➕</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Type ingredient and press Enter..."
            className="flex-1 px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm min-h-[44px] sm:min-h-0"
            aria-label="Add a custom ingredient"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={addCustom}
            disabled={!custom.trim()}
            className="px-4 sm:px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            Add
          </motion.button>
        </div>

        {/* Selected Ingredients Preview */}
        {pantry.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-800 shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                ✓ {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''} selected
              </p>
              {onSearch && (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(5, 150, 105, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSearch(pantry.join(', '))}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
                  title="Find recipes with these ingredients"
                >
                  <span className="text-lg">🔍</span>
                  <span className="hidden sm:inline">Find Recipes</span>
                  <span className="sm:hidden">Find</span>
                </motion.button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {pantry.map(item => (
                <motion.span
                  key={item}
                  layout
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-semibold border-2 border-emerald-300 dark:border-emerald-700 shadow-sm"
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                  <button
                    onClick={() => toggle(item)}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold"
                    title="Remove"
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
