import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast.jsx';
import { hasFeature } from '../utils/subscription.js';

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
    icon: '⚡',
    description: 'Under 30 min, high health score',
    filters: { maxTime: '30', healthScore: '70' },
  },
  {
    id: 'high-protein',
    name: '💪 High Protein',
    icon: '💪',
    description: 'Perfect for fitness goals',
    filters: { minProtein: '20' },
  },
  {
    id: 'budget-friendly',
    name: '💰 Budget-Friendly',
    icon: '💰',
    description: 'Affordable ingredients',
    filters: { maxCost: '15' },
  },
  {
    id: 'low-carb',
    name: '🥑 Low Carb',
    icon: '🥑',
    description: 'Keto-friendly options',
    filters: { diet: 'keto', maxCarbs: '20' },
  },
  {
    id: 'family-friendly',
    name: '👨‍👩‍👧‍👦 Family-Friendly',
    icon: '👨‍👩‍👧‍👦',
    description: 'Quick, easy, kid-approved',
    filters: { maxTime: '45', difficulty: 'easy' },
  },
  {
    id: 'meal-prep',
    name: '📦 Meal Prep',
    icon: '📦',
    description: 'Batch cooking ready',
    filters: { servings: '6', maxTime: '60' },
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

// Save filter preset
function saveFilterPreset(name, filters) {
  try {
    const presets = JSON.parse(localStorage.getItem('filterPresets') || '[]');
    presets.push({
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('filterPresets', JSON.stringify(presets.slice(-10))); // Keep last 10
  } catch {
    // Ignore localStorage errors
  }
}

// Load saved filter presets
function loadFilterPresets() {
  try {
    return JSON.parse(localStorage.getItem('filterPresets') || '[]');
  } catch {
    return [];
  }
}

export default function Filters({
  diet,
  setDiet,
  _intolerances,
  setIntolerances: _setIntolerances,
  maxTime,
  setMaxTime,
  mealType,
  setMealType,
  maxCalories,
  setMaxCalories,
  healthScore,
  setHealthScore,
  onFiltersChange,
}) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIntolerances, setSelectedIntolerances] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('filters:selectedIntolerances') || '[]');
    } catch {
      return [];
    }
  });
  const [cuisine, setCuisine] = useState(() => {
    try {
      return localStorage.getItem('filters:cuisine') || '';
    } catch {
      return '';
    }
  });
  const [difficulty, setDifficulty] = useState(() => {
    try {
      return localStorage.getItem('filters:difficulty') || '';
    } catch {
      return '';
    }
  });
  const [minProtein, setMinProtein] = useState(() => {
    try {
      return localStorage.getItem('filters:minProtein') || '';
    } catch {
      return '';
    }
  });
  const [maxCarbs, setMaxCarbs] = useState(() => {
    try {
      return localStorage.getItem('filters:maxCarbs') || '';
    } catch {
      return '';
    }
  });
  const [showPresets, setShowPresets] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load user's favorite filters for suggestions
  const favoriteFilters = useMemo(() => getUserFavoriteFilters(), []);
  const savedPresets = useMemo(() => loadFilterPresets(), []);
  const timeBasedMeal = useMemo(() => getTimeBasedMealType(), []);

  // Persist new filters
  useEffect(() => {
    try {
      localStorage.setItem('filters:selectedIntolerances', JSON.stringify(selectedIntolerances));
    } catch {
      // Ignore localStorage errors
    }
  }, [selectedIntolerances]);

  useEffect(() => {
    try {
      localStorage.setItem('filters:cuisine', cuisine);
    } catch {
      // Ignore localStorage errors
    }
  }, [cuisine]);

  useEffect(() => {
    try {
      localStorage.setItem('filters:difficulty', difficulty);
    } catch {
      // Ignore localStorage errors
    }
  }, [difficulty]);

  useEffect(() => {
    try {
      localStorage.setItem('filters:minProtein', minProtein);
    } catch {
      // Ignore localStorage errors
    }
  }, [minProtein]);

  useEffect(() => {
    try {
      localStorage.setItem('filters:maxCarbs', maxCarbs);
    } catch {
      // Ignore localStorage errors
    }
  }, [maxCarbs]);

  // Notify parent of filter changes
  // Use useRef to track previous values and only call onFiltersChange when values actually change
  const prevFiltersRef = useRef('');
  useEffect(() => {
    if (onFiltersChange) {
      const allFilters = {
        diet,
        intolerances: selectedIntolerances.length > 0 ? selectedIntolerances.join(',') : '',
        maxTime,
        mealType,
        maxCalories,
        healthScore,
        cuisine,
        difficulty,
        minProtein,
        maxCarbs,
      };
      // Serialize filters to compare - only call if actually changed
      const filtersKey = JSON.stringify(allFilters);
      if (prevFiltersRef.current !== filtersKey) {
        prevFiltersRef.current = filtersKey;
        onFiltersChange(allFilters);
      }
    }
  }, [
    diet,
    selectedIntolerances,
    maxTime,
    mealType,
    maxCalories,
    healthScore,
    cuisine,
    difficulty,
    minProtein,
    maxCarbs,
  ]);

  const toggleIntolerance = intolerance => {
    setSelectedIntolerances(prev => {
      if (prev.includes(intolerance)) {
        return prev.filter(i => i !== intolerance);
      } else {
        return [...prev, intolerance];
      }
    });
  };

  const applyPreset = preset => {
    if (preset.filters.diet) setDiet(preset.filters.diet);
    if (preset.filters.maxTime) setMaxTime(preset.filters.maxTime);
    if (preset.filters.healthScore) setHealthScore(preset.filters.healthScore);
    if (preset.filters.minProtein) setMinProtein(preset.filters.minProtein);
    if (preset.filters.maxCarbs) setMaxCarbs(preset.filters.maxCarbs);
    if (preset.filters.difficulty) setDifficulty(preset.filters.difficulty);
    if (preset.filters.cuisine) setCuisine(preset.filters.cuisine);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name for your preset');
      return;
    }
    const filters = {
      diet,
      maxTime,
      mealType,
      maxCalories,
      healthScore,
      cuisine,
      difficulty,
      minProtein,
      maxCarbs,
      selectedIntolerances,
    };
    saveFilterPreset(presetName, filters);
    toast.success(`Saved preset: ${presetName}`);
    setPresetName('');
    setShowSavePreset(false);
  };

  const suggestFilters = () => {
    if (favoriteFilters.avgTime > 0) {
      setMaxTime(String(favoriteFilters.avgTime + 15));
    }
    if (favoriteFilters.avgCalories > 0) {
      setMaxCalories(String(favoriteFilters.avgCalories + 100));
    }
    if (favoriteFilters.mealTypes.length > 0 && !mealType) {
      setMealType(favoriteFilters.mealTypes[0]);
    }
    if (timeBasedMeal && !mealType) {
      setMealType(timeBasedMeal);
    }
    toast.success('Applied smart filter suggestions!');
  };

  const reset = () => {
    setDiet('');
    _setIntolerances('');
    setMaxTime('');
    setMealType('');
    setMaxCalories('');
    setHealthScore('');
    setSelectedIntolerances([]);
    setCuisine('');
    setDifficulty('');
    setMinProtein('');
    setMaxCarbs('');
    toast.success('All filters cleared');
  };

  const hasActiveFilters =
    diet ||
    selectedIntolerances.length > 0 ||
    maxTime ||
    mealType ||
    maxCalories ||
    healthScore ||
    cuisine ||
    difficulty ||
    minProtein ||
    maxCarbs;

  const activeFilterCount = [
    diet,
    selectedIntolerances.length,
    maxTime,
    mealType,
    maxCalories,
    healthScore,
    cuisine,
    difficulty,
    minProtein,
    maxCarbs,
  ].filter(Boolean).length;

  const hasFiltersAccess = hasFeature('advanced_filters');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-3 xs:mt-4 sm:mt-5 md:mt-6"
    >
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                Smart Filters
                {!hasFiltersAccess && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                    Premium
                  </span>
                )}
                {hasFiltersAccess && activeFilterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {!hasFiltersAccess
                  ? 'Upgrade to unlock advanced filtering options!'
                  : hasActiveFilters
                    ? `${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`
                    : 'Refine your search'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {favoriteFilters.avgTime > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={suggestFilters}
                className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
              >
                <span>✨</span>
                <span>Smart Suggest</span>
              </motion.button>
            )}
            {hasActiveFilters && (
              <>
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSavePreset(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  💾 Save
                </motion.button>
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={reset}
                  className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Clear All
                </motion.button>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <svg
                className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasFiltersAccess && hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {diet && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>🥗</span>
                <span>{diet}</span>
                <button
                  onClick={() => setDiet('')}
                  className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </motion.div>
            )}
            {selectedIntolerances.map(int => (
              <motion.div
                key={int}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{int}</span>
                <button
                  onClick={() => toggleIntolerance(int)}
                  className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </motion.div>
            ))}
            {maxTime && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>⏱️</span>
                <span>{maxTime}m</span>
                <button
                  onClick={() => setMaxTime('')}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </motion.div>
            )}
            {mealType && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>🍽️</span>
                <span>{mealType}</span>
                <button
                  onClick={() => setMealType('')}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </motion.div>
            )}
            {cuisine && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>🌍</span>
                <span>{cuisine}</span>
                <button
                  onClick={() => setCuisine('')}
                  className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </motion.div>
            )}
            {difficulty && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>{DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.icon || '🎯'}</span>
                <span>{difficulty}</span>
                <button
                  onClick={() => setDifficulty('')}
                  className="hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Quick Presets */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Quick Presets:
            </span>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {showPresets ? 'Hide' : 'Show All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 xs:gap-2 sm:gap-3">
            {FILTER_PRESETS.slice(0, showPresets ? FILTER_PRESETS.length : 3).map(preset => (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-[10px] xs:text-xs sm:text-sm font-semibold border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-sm flex items-center gap-1 xs:gap-2 min-h-[36px] xs:min-h-[40px] sm:min-h-0 touch-manipulation"
              >
                <span className="whitespace-nowrap">{preset.name}</span>
              </motion.button>
            ))}
            {savedPresets.length > 0 && (
              <>
                {savedPresets.slice(0, showPresets ? savedPresets.length : 2).map(preset => (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-xs font-semibold border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm flex items-center gap-2"
                  >
                    <span>💾</span>
                    <span>{preset.name}</span>
                  </motion.button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Main Filters */}
        {hasFeature('advanced_filters') ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            {/* Meal Type */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
            >
              <label className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Meal Type
                  </span>
                  {timeBasedMeal && !mealType && (
                    <motion.button
                      onClick={() => setMealType(timeBasedMeal)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      (Suggest: {timeBasedMeal})
                    </motion.button>
                  )}
                </div>
                <select
                  value={mealType}
                  onChange={e => setMealType(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                >
                  {MEAL_TYPES.map(m => (
                    <option key={m} value={m}>
                      {m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Any Meal'}
                    </option>
                  ))}
                </select>
              </label>
            </motion.div>

            {/* Diet */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
            >
              <label className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥗</span>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Diet
                  </span>
                </div>
                <select
                  value={diet}
                  onChange={e => setDiet(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                >
                  {DIETS.map(d => (
                    <option key={d} value={d}>
                      {d ? d.charAt(0).toUpperCase() + d.slice(1) : 'Any Diet'}
                    </option>
                  ))}
                </select>
              </label>
            </motion.div>

            {/* Cuisine */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
            >
              <label className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌍</span>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Cuisine
                  </span>
                </div>
                {hasFeature('advanced_filters') ? (
                  <select
                    value={cuisine}
                    onChange={e => setCuisine(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                  >
                    {CUISINES.map(c => (
                      <option key={c} value={c}>
                        {c || 'Any Cuisine'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer text-sm"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('openPremiumFeatureModal', {
                          detail: { feature: 'cuisine_filter' },
                        })
                      );
                    }}
                  >
                    Upgrade to unlock cuisine filter
                  </div>
                )}
              </label>
            </motion.div>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">
                  Filters are a Premium Feature
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Upgrade to unlock advanced filtering options including diet, cuisine, difficulty,
                  and more!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                toast.error(
                  '🔍 Advanced Filters are a premium feature! Filter recipes by diet, cuisine, difficulty, time, calories, and more. Upgrade to unlock powerful filtering options!',
                  { duration: 5000 }
                );
                window.dispatchEvent(new CustomEvent('openProModal'));
              }}
              className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Upgrade to Unlock Filters →
            </button>
          </div>
        )}

        {/* Quick Time Presets */}
        {hasFeature('advanced_filters') && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Quick time:
            </span>
            {[15, 30, 45, 60, 90].map(m => (
              <motion.button
                key={m}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setMaxTime(String(m))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                  maxTime === String(m)
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                }`}
              >
                {m}m
              </motion.button>
            ))}
          </div>
        )}

        {/* Intolerances - Multi-select */}
        {hasFeature('advanced_filters') && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              ⚠️ Intolerances (select multiple)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTOLERANCES.map(int => (
                <motion.button
                  key={int}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => toggleIntolerance(int)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedIntolerances.includes(int)
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600'
                  }`}
                >
                  {int}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {hasFeature('advanced_filters') && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">💚</span>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      Advanced Filters
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Max Time */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                      <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⏱️</span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Max Time (min)
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 30"
                          value={maxTime}
                          onChange={e => setMaxTime(e.target.value)}
                          className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                      </label>
                    </motion.div>

                    {/* Max Calories */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                      <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🔥</span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Max Calories
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 500"
                          value={maxCalories}
                          onChange={e => setMaxCalories(e.target.value)}
                          className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                      </label>
                    </motion.div>

                    {/* Min Protein */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                      <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">💪</span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Min Protein (g)
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 20"
                          value={minProtein}
                          onChange={e => setMinProtein(e.target.value)}
                          className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                      </label>
                    </motion.div>

                    {/* Max Carbs */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                      <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍞</span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Max Carbs (g)
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 30"
                          value={maxCarbs}
                          onChange={e => setMaxCarbs(e.target.value)}
                          className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                      </label>
                    </motion.div>

                    {/* Difficulty */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                      <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎯</span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Difficulty
                          </span>
                        </div>
                        {hasFeature('advanced_filters') ? (
                          <select
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                            className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                          >
                            {DIFFICULTY_LEVELS.map(d => (
                              <option key={d.value} value={d.value}>
                                {d.icon} {d.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer text-sm"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent('openPremiumFeatureModal', {
                                  detail: { feature: 'difficulty_filter' },
                                })
                              );
                            }}
                          >
                            Upgrade to unlock difficulty filter
                          </div>
                        )}
                      </label>
                    </motion.div>

                    {/* Health Score */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm sm:col-span-2 lg:col-span-1"
                    >
                      <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏥</span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Min Health Score (0-100)
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 70"
                          value={healthScore}
                          onChange={e => setHealthScore(e.target.value)}
                          className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                      </label>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

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
                      handleSavePreset();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSavePreset}
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
      </div>
    </motion.div>
  );
}
