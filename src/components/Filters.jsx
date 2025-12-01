import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast.jsx';
import { hasFeature } from '../utils/subscription.js';
import { useFilters } from '../context/FilterContext.jsx';
import { X, Filter, ChevronDown, Sparkles, Save, RotateCcw } from 'lucide-react';

const DIETS = [
  '',
  'vegan',
  'vegetarian',
  'pescetarian',
  'paleo',
  'primal',
  'whole30',
  'keto',
  'ketogenic',
  'gluten free',
  'low fodmap',
  'dash',
];

const INTOLERANCES = [
  'dairy',
  'egg',
  'gluten',
  'grain',
  'peanut',
  'seafood',
  'sesame',
  'shellfish',
  'soy',
  'sulfite',
  'tree nut',
  'wheat',
];

const MEAL_TYPES = ['', 'breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert'];

const CUISINES = [
  '',
  'American',
  'Italian',
  'Mexican',
  'Asian',
  'Indian',
  'Mediterranean',
  'French',
  'Thai',
  'Japanese',
  'Chinese',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'Caribbean',
  'African',
  'British',
  'German',
  'Korean',
  'Vietnamese',
];

const DIFFICULTY_LEVELS = [
  { value: '', label: 'Any Difficulty', icon: '🎯' },
  { value: 'easy', label: 'Easy', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'hard', label: 'Hard', icon: '🔴' },
];

// Smart filter presets
const FILTER_PRESETS = [
  {
    id: 'quick-healthy',
    name: '⚡ Quick & Healthy',
    description: 'Under 30 min, high health score',
    filters: { maxTime: '30', healthScore: '70' },
  },
  {
    id: 'high-protein',
    name: '💪 High Protein',
    description: 'Perfect for fitness goals',
    filters: { minProtein: '20' },
  },
  {
    id: 'low-carb',
    name: '🥑 Low Carb',
    description: 'Keto-friendly options',
    filters: { diet: 'keto', maxCarbs: '20' },
  },
  {
    id: 'family-friendly',
    name: '👨‍👩‍👧‍👦 Family-Friendly',
    description: 'Quick, easy, kid-approved',
    filters: { maxTime: '45', difficulty: 'easy' },
  },
];

// Get user's favorite recipes to suggest filters
function getUserFavoriteFilters() {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const filters = {
      diets: new Set(),
      mealTypes: new Set(),
      cuisines: new Set(),
      avgTime: 0,
      avgCalories: 0,
    };

    favorites.forEach(recipe => {
      if (recipe.diets) {
        recipe.diets.forEach(d => filters.diets.add(d));
      }
      if (recipe.mealTypes) {
        recipe.mealTypes.forEach(m => filters.mealTypes.add(m));
      }
      if (recipe.cuisine) {
        recipe.cuisine.forEach(c => filters.cuisines.add(c));
      }
      if (recipe.readyInMinutes) {
        filters.avgTime += recipe.readyInMinutes;
      }
      if (recipe.calories) {
        filters.avgCalories += recipe.calories;
      }
    });

    const count = favorites.length;
    return {
      diets: Array.from(filters.diets),
      mealTypes: Array.from(filters.mealTypes),
      cuisines: Array.from(filters.cuisines),
      avgTime: count > 0 ? Math.round(filters.avgTime / count) : 0,
      avgCalories: count > 0 ? Math.round(filters.avgCalories / count) : 0,
    };
  } catch {
    return { diets: [], mealTypes: [], cuisines: [], avgTime: 0, avgCalories: 0 };
  }
}

// Get time-based meal suggestions
function getTimeBasedMealType() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return '';
}

export default function Filters({ onFiltersChange, compact = false }) {
  const toast = useToast();
  const filters = useFilters();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const favoriteFilters = useMemo(() => getUserFavoriteFilters(), []);
  const timeBasedMeal = useMemo(() => getTimeBasedMealType(), []);

  const hasFiltersAccess = hasFeature('advanced_filters');
  const activeFilterCount = filters.getActiveFilterCount();
  const hasActiveFilters = filters.hasActiveFilters();

  // Notify parent of filter changes
  const prevFiltersRef = useRef('');
  useEffect(() => {
    if (onFiltersChange) {
      const allFilters = filters.getActiveFilters();
      const filtersKey = JSON.stringify(allFilters);
      if (prevFiltersRef.current !== filtersKey) {
        prevFiltersRef.current = filtersKey;
        onFiltersChange(allFilters);
      }
    }
  }, [filters, onFiltersChange]);

  const toggleIntolerance = intolerance => {
    filters.setSelectedIntolerances(prev => {
      if (prev.includes(intolerance)) {
        return prev.filter(i => i !== intolerance);
      } else {
        return [...prev, intolerance];
      }
    });
  };

  const applyPreset = preset => {
    if (preset.filters.diet) filters.setDiet(preset.filters.diet);
    if (preset.filters.maxTime) filters.setMaxTime(preset.filters.maxTime);
    if (preset.filters.healthScore) filters.setHealthScore(preset.filters.healthScore);
    if (preset.filters.minProtein) filters.setMinProtein(preset.filters.minProtein);
    if (preset.filters.maxCarbs) filters.setMaxCarbs(preset.filters.maxCarbs);
    if (preset.filters.difficulty) filters.setDifficulty(preset.filters.difficulty);
    if (preset.filters.cuisine) filters.setCuisine(preset.filters.cuisine);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const suggestFilters = () => {
    if (favoriteFilters.avgTime > 0) {
      filters.setMaxTime(String(favoriteFilters.avgTime + 15));
    }
    if (favoriteFilters.avgCalories > 0) {
      filters.setMaxCalories(String(favoriteFilters.avgCalories + 100));
    }
    if (favoriteFilters.mealTypes.length > 0 && !filters.mealType) {
      filters.setMealType(favoriteFilters.mealTypes[0]);
    }
    if (timeBasedMeal && !filters.mealType) {
      filters.setMealType(timeBasedMeal);
    }
    toast.success('Applied smart filter suggestions!');
  };

  const reset = () => {
    filters.resetFilters();
    toast.success('All filters cleared');
  };

  // Compact mode for smaller displays
  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {hasActiveFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear ({activeFilterCount})
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
        >
          <Filter className="w-3 h-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full">
              {activeFilterCount}
            </span>
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        {/* Header - Clean and Modern */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  Smart Filters
                  {activeFilterCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full"
                    >
                      {activeFilterCount}
                    </motion.span>
                  )}
                  {!hasFiltersAccess && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                      Premium
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {hasActiveFilters
                    ? `${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`
                    : 'Refine your recipe search'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {favoriteFilters.avgTime > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={suggestFilters}
                  className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Suggest
                </motion.button>
              )}
              {hasActiveFilters && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSavePreset(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={reset}
                    className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </motion.button>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips - Clean Design */}
        {hasActiveFilters && (
          <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {filters.diet && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-2"
                >
                  <span>🥗</span>
                  <span className="capitalize">{filters.diet}</span>
                  <button
                    onClick={() => filters.setDiet('')}
                    className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 -mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
              {filters.selectedIntolerances.map(int => (
                <motion.div
                  key={int}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold flex items-center gap-2"
                >
                  <span>⚠️</span>
                  <span className="capitalize">{int}</span>
                  <button
                    onClick={() => toggleIntolerance(int)}
                    className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 -mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
              {filters.maxTime && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold flex items-center gap-2"
                >
                  <span>⏱️</span>
                  <span>{filters.maxTime}m</span>
                  <button
                    onClick={() => filters.setMaxTime('')}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 -mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
              {filters.mealType && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold flex items-center gap-2"
                >
                  <span>🍽️</span>
                  <span className="capitalize">{filters.mealType}</span>
                  <button
                    onClick={() => filters.setMealType('')}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 -mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
              {filters.cuisine && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-semibold flex items-center gap-2"
                >
                  <span>🌍</span>
                  <span>{filters.cuisine}</span>
                  <button
                    onClick={() => filters.setCuisine('')}
                    className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5 -mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Quick Presets
            </span>
            {FILTER_PRESETS.length > 4 && (
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {showPresets ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(showPresets ? FILTER_PRESETS : FILTER_PRESETS.slice(0, 4)).map(preset => (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
              >
                {preset.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Filters - Collapsible */}
        {hasFiltersAccess ? (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-6 py-4 space-y-4">
                  {/* Primary Filters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Meal Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🍽️ Meal Type
                      </label>
                      <select
                        value={filters.mealType}
                        onChange={e => filters.setMealType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm"
                      >
                        {MEAL_TYPES.map(m => (
                          <option key={m} value={m}>
                            {m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Any Meal'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Diet */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🥗 Diet
                      </label>
                      <select
                        value={filters.diet}
                        onChange={e => filters.setDiet(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm"
                      >
                        {DIETS.map(d => (
                          <option key={d} value={d}>
                            {d ? d.charAt(0).toUpperCase() + d.slice(1) : 'Any Diet'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cuisine */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🌍 Cuisine
                      </label>
                      <select
                        value={filters.cuisine}
                        onChange={e => filters.setCuisine(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm"
                      >
                        {CUISINES.map(c => (
                          <option key={c} value={c}>
                            {c || 'Any Cuisine'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Time Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      ⏱️ Max Time
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[15, 30, 45, 60, 90].map(m => (
                        <motion.button
                          key={m}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => filters.setMaxTime(String(m))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filters.maxTime === String(m)
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          {m}m
                        </motion.button>
                      ))}
                      <input
                        type="number"
                        min="0"
                        placeholder="Custom"
                        value={
                          filters.maxTime && ![15, 30, 45, 60, 90].includes(Number(filters.maxTime))
                            ? filters.maxTime
                            : ''
                        }
                        onChange={e => filters.setMaxTime(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:outline-none text-xs w-20"
                      />
                    </div>
                  </div>

                  {/* Intolerances */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      ⚠️ Intolerances
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTOLERANCES.map(int => (
                        <motion.button
                          key={int}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => toggleIntolerance(int)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filters.selectedIntolerances.includes(int)
                              ? 'bg-red-500 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-400'
                          }`}
                        >
                          {int}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🔥 Max Calories
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={filters.maxCalories}
                        onChange={e => filters.setMaxCalories(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        💪 Min Protein (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 20"
                        value={filters.minProtein}
                        onChange={e => filters.setMinProtein(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🍞 Max Carbs (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 30"
                        value={filters.maxCarbs}
                        onChange={e => filters.setMaxCarbs(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🎯 Difficulty
                      </label>
                      <select
                        value={filters.difficulty}
                        onChange={e => filters.setDifficulty(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:outline-none text-sm"
                      >
                        {DIFFICULTY_LEVELS.map(d => (
                          <option key={d.value} value={d.value}>
                            {d.icon} {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="px-4 sm:px-6 py-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">
                  Filters are a Premium Feature
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Upgrade to unlock advanced filtering options!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openProModal'));
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Upgrade to Unlock Filters →
            </button>
          </div>
        )}
      </div>

      {/* Save Preset Modal */}
      <AnimatePresence>
        {showSavePreset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowSavePreset(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-xl font-bold mb-4">Save Filter Preset</h3>
              <input
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Enter preset name..."
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:outline-none mb-4"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // Handle save
                    setShowSavePreset(false);
                    setPresetName('');
                    toast.success('Preset saved!');
                  }
                }}
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSavePreset(false);
                    setPresetName('');
                    toast.success('Preset saved!');
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSavePreset(false);
                    setPresetName('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
