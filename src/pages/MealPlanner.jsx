import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGroceryList } from '../context/GroceryListContext.jsx';
import { getSupabaseRecipeById } from '../api/supabaseRecipes.js';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import { trackRecipeInteraction } from '../utils/analytics.js';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { CompactRecipeLoader } from '../components/FoodLoaders.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { useToast } from '../components/Toast.jsx';
import { hasFeature, canPerformAction } from '../utils/subscription.js';
import {
  Sparkles,
  Heart,
  ShoppingCart,
  X,
  Copy,
  Calendar,
  Plus,
  Settings,
  CheckCircle2,
  Circle,
  RefreshCw,
} from 'lucide-react';
import MealSwap from '../components/MealSwap.jsx';

const KEY = 'meal:plan:v3'; // Updated version with snacks support
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const SNACKS = ['morning_snack', 'afternoon_snack', 'evening_snack'];

// Initialize structure: 7 days x 3 meals + optional snacks
function emptyDay() {
  return {
    breakfast: null,
    lunch: null,
    dinner: null,
    morning_snack: null,
    afternoon_snack: null,
    evening_snack: null,
  };
}

export function readMealPlan() {
  try {
    // Try v3 first
    let parsed = JSON.parse(localStorage.getItem(KEY) || 'null');

    // If v3 doesn't exist, try v2
    if (!parsed) {
      parsed = JSON.parse(localStorage.getItem('meal:plan:v2') || 'null');
    }

    // Handle migration from v1 format (backward compatibility)
    if (Array.isArray(parsed)) {
      // Old format - migrate to new format
      const newPlan = {};
      parsed.forEach((meal, idx) => {
        if (meal) {
          newPlan[DAYS_SHORT[idx]] = { ...emptyDay(), dinner: meal };
        } else {
          newPlan[DAYS_SHORT[idx]] = emptyDay();
        }
      });
      writeMealPlan(newPlan);
      return newPlan;
    }

    // New format (v2 or v3)
    if (parsed && typeof parsed === 'object') {
      // Fill in any missing days and ensure snack fields exist
      const plan = {};
      DAYS_SHORT.forEach(day => {
        const dayData = parsed[day] || {};
        plan[day] = {
          ...emptyDay(),
          ...dayData,
          // Ensure snack fields exist even if not in old data
          morning_snack: dayData.morning_snack || null,
          afternoon_snack: dayData.afternoon_snack || null,
          evening_snack: dayData.evening_snack || null,
        };
      });
      return plan;
    }

    return {};
  } catch {
    return {};
  }
}

export function writeMealPlan(plan) {
  localStorage.setItem(KEY, JSON.stringify(plan));
}

/** Call this from anywhere (e.g., RecipePage) to set a meal or snack */
export function setMealPlanDay(dayIndex, mealType, recipe) {
  const current = readMealPlan();
  const day = DAYS_SHORT[dayIndex];

  if (!current[day]) {
    current[day] = emptyDay();
  }

  // Ensure all snack fields exist
  if (!current[day].morning_snack) current[day].morning_snack = null;
  if (!current[day].afternoon_snack) current[day].afternoon_snack = null;
  if (!current[day].evening_snack) current[day].evening_snack = null;

  current[day][mealType] = recipe
    ? { id: recipe.id, title: recipe.title, image: recipe.image || recipe.hero_image_url }
    : null;

  writeMealPlan(current);
  return current;
}
/* --------------------------------------------------------------------------- */

export default function MealPlanner() {
  const [plan, setPlan] = useState(() => readMealPlan());
  const { addMany, setOpen } = useGroceryList();
  const [loading, setLoading] = useState(false);
  const [showSnacks, setShowSnacks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('meal:plan:showSnacks') || 'false');
    } catch {
      return false;
    }
  });
  const [includeSnacksInPlan, setIncludeSnacksInPlan] = useState(false);
  const [swapState, setSwapState] = useState(null); // { dayIdx, mealType, recipe }
  const toast = useToast();
  const navigate = useNavigate();

  // ENFORCE MEAL PLANNER LIMIT - Check access on mount
  useEffect(() => {
    const canAccess = canPerformAction('meal_planner');
    if (!canAccess) {
      toast.error('Meal Planner is a premium feature! Upgrade to unlock meal planning.');
      navigate('/');
      window.dispatchEvent(new CustomEvent('openProModal'));
    }
  }, [navigate, toast]);

  // Persist whenever plan changes
  useEffect(() => writeMealPlan(plan), [plan]);

  // Persist snack visibility preference
  useEffect(() => {
    localStorage.setItem('meal:plan:showSnacks', JSON.stringify(showSnacks));
  }, [showSnacks]);

  // Listen for changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === KEY && e.newValue) {
        try {
          setPlan(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check for same-tab changes
    const interval = setInterval(() => {
      try {
        const current = readMealPlan();
        setPlan(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(current)) {
            return current;
          }
          return prev;
        });
      } catch {}
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const setMeal = (dayIdx, mealType, recipe) => {
    setPlan(setMealPlanDay(dayIdx, mealType, recipe));
    // Track interaction
    if (recipe?.id) {
      trackRecipeInteraction(recipe.id, 'add_to_plan', {
        title: recipe.title,
        mealType,
        day: DAYS_SHORT[dayIdx],
      });
    }
  };

  const favorites = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  }, []);

  // Smart meal planning - suggest balanced meals
  const generateSmartPlan = async () => {
    setLoading(true);
    try {
      // Get dietary preferences
      const diet = localStorage.getItem('filters:diet') || '';
      const intolerances = localStorage.getItem('filters:intolerances') || '';
      const pantry = JSON.parse(localStorage.getItem('filters:pantry') || '[]');

      const next = { ...plan };
      let suggestionCount = 0;
      const maxSuggestions = includeSnacksInPlan ? 42 : 21; // 21 meals or 21 meals + 21 snacks

      // Meal type mapping
      const mealTypeMap = {
        breakfast: 'breakfast',
        lunch: 'lunch',
        dinner: 'dinner',
        morning_snack: 'snack',
        afternoon_snack: 'snack',
        evening_snack: 'snack',
      };

      // Process meals first
      for (const day of DAYS_SHORT) {
        if (!next[day]) next[day] = emptyDay();

        // Plan main meals
        for (const mealType of MEALS) {
          if (!next[day][mealType] && suggestionCount < maxSuggestions) {
            try {
              const usePantry = suggestionCount % 3 === 0 && pantry.length > 0;
              const ingredients = usePantry
                ? [...pantry].sort(() => Math.random() - 0.5).slice(0, 3)
                : [];

              const result = await searchSupabaseRecipes({
                query: '',
                includeIngredients: ingredients,
                diet: diet || '',
                mealType: mealTypeMap[mealType] || '',
                maxTime: '',
                limit: 15,
              });

              const recipes = Array.isArray(result) ? result : [];
              if (recipes.length > 0) {
                const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
                next[day][mealType] = {
                  id: randomRecipe.id,
                  title: randomRecipe.title,
                  image: randomRecipe.image || randomRecipe.hero_image_url,
                };
                suggestionCount++;
              }
            } catch (e) {
              console.warn('[SmartPlan] Failed to fetch meal suggestion', e);
            }
          }
        }

        // Plan snacks if enabled
        if (includeSnacksInPlan && showSnacks) {
          for (const snackType of SNACKS) {
            if (!next[day][snackType] && suggestionCount < maxSuggestions) {
              try {
                const result = await searchSupabaseRecipes({
                  query: '',
                  includeIngredients: [],
                  diet: diet || '',
                  mealType: 'snack',
                  maxTime: '30', // Snacks should be quick
                  limit: 10,
                });

                const recipes = Array.isArray(result) ? result : [];
                if (recipes.length > 0) {
                  const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
                  next[day][snackType] = {
                    id: randomRecipe.id,
                    title: randomRecipe.title,
                    image: randomRecipe.image || randomRecipe.hero_image_url,
                  };
                  suggestionCount++;
                }
              } catch (e) {
                console.warn('[SmartPlan] Failed to fetch snack suggestion', e);
              }
            }
          }
        }
      }

      setPlan(next);
      toast.success(
        `Generated ${suggestionCount} meal${suggestionCount !== 1 ? 's' : ''} for your week!`
      );
    } catch (error) {
      console.error('[SmartPlan] Error:', error);
      toast.error('Failed to generate smart plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate nutrition stats
  const nutritionStats = useMemo(() => {
    let filled = 0;
    let total = 0;
    const mealsToCount = showSnacks ? [...MEALS, ...SNACKS] : MEALS;

    DAYS_SHORT.forEach(day => {
      mealsToCount.forEach(meal => {
        total++;
        if (plan[day]?.[meal]) filled++;
      });
    });
    return {
      filled,
      empty: total - filled,
      total,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }, [plan, showSnacks]);

  const fillFromFavorites = () => {
    if (favorites.length === 0) {
      toast.error('No favorites found. Add some recipes to favorites first!');
      return;
    }
    const next = { ...plan };
    let fi = 0;
    const mealsToFill = showSnacks ? [...MEALS, ...SNACKS] : MEALS;

    DAYS_SHORT.forEach(day => {
      if (!next[day]) next[day] = emptyDay();
      mealsToFill.forEach(mealType => {
        if (!next[day][mealType]) {
          const fav = favorites[fi % favorites.length];
          next[day][mealType] = fav
            ? {
                id: fav.id,
                title: fav.title,
                image: fav.image || fav.hero_image_url,
              }
            : null;
          fi++;
        }
      });
    });
    setPlan(next);
    toast.success('Filled plan from favorites!');
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all meals?')) {
      const emptyPlan = {};
      DAYS_SHORT.forEach(day => {
        emptyPlan[day] = emptyDay();
      });
      setPlan(emptyPlan);
      toast.success('Meal plan cleared!');
    }
  };

  const generateGroceryList = async () => {
    // Collect all planned recipes across all days, meals, and snacks
    const allRecipes = [];
    const mealsToInclude = showSnacks ? [...MEALS, ...SNACKS] : MEALS;

    DAYS_SHORT.forEach(day => {
      mealsToInclude.forEach(meal => {
        if (plan[day]?.[meal]) {
          allRecipes.push(plan[day][meal]);
        }
      });
    });

    if (allRecipes.length === 0) {
      toast.error('No meals planned. Add some meals first!');
      return;
    }

    setLoading(true);
    const all = [];
    let loaded = 0;

    for (const r of allRecipes) {
      try {
        const info = await getSupabaseRecipeById(r.id);
        if (info?.extendedIngredients) {
          const items = info.extendedIngredients
            .map(i => i.original || i.originalString || '')
            .filter(Boolean);
          all.push(...items);
        }
        loaded++;
      } catch (e) {
        console.warn('Failed to load ingredients for', r.id, e);
      }
    }

    setLoading(false);

    if (all.length) {
      // Use smart aggregation
      const { aggregateIngredients, formatAggregatedIngredient } = await import(
        '../utils/ingredientAggregator.js'
      );
      const aggregated = aggregateIngredients(all);
      const formatted = aggregated.map(formatAggregatedIngredient);

      addMany(formatted, true); // Keep full quantities with aggregation
      setOpen(true);
      toast.success(`Added ${formatted.length} smart ingredients to grocery list!`);
    } else {
      toast.error('Could not load ingredients. Please try again.');
    }
  };

  // Duplicate a day's meals to another day
  const duplicateDay = (fromDayIdx, toDayIdx) => {
    const fromDay = DAYS_SHORT[fromDayIdx];
    const toDay = DAYS_SHORT[toDayIdx];
    const next = { ...plan };
    if (next[fromDay]) {
      next[toDay] = { ...next[fromDay] };
      setPlan(next);
    }
  };

  // Clear a specific day
  const clearDay = dayIdx => {
    const day = DAYS_SHORT[dayIdx];
    const next = { ...plan };
    next[day] = emptyDay();
    setPlan(next);
  };

  // Calculate daily stats
  const getDailyStats = useMemo(() => {
    const stats = {};
    const mealsToCount = showSnacks ? [...MEALS, ...SNACKS] : MEALS;
    DAYS_SHORT.forEach((day, idx) => {
      const meals = plan[day] || emptyDay();
      const filled = mealsToCount.filter(meal => meals[meal]).length;
      const total = mealsToCount.length;
      stats[day] = {
        filled,
        total,
        percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
      };
    });
    return stats;
  }, [plan, showSnacks]);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
      {/* Header with Stats */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <BackToHome className="mb-4" />
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📅 Smart Meal Planner
          </h1>
        </div>

        {/* Progress Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                  Week Progress
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {nutritionStats.percentage}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {nutritionStats.filled}/{nutritionStats.total}
                </p>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                  meals planned
                </p>
              </div>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nutritionStats.percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              />
            </div>
          </motion.div>

          {/* Quick Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg"
          >
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
              Quick Stats
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  📅 Days with meals:
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {
                    DAYS_SHORT.filter(day => {
                      const meals = plan[day] || emptyDay();
                      return Object.values(meals).some(Boolean);
                    }).length
                  }
                  /7
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  ❤️ From favorites:
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {DAYS_SHORT.reduce((count, day) => {
                    const meals = plan[day] || emptyDay();
                    return (
                      count +
                      Object.values(meals).filter(
                        meal => meal && favorites.some(fav => fav.id === meal.id)
                      ).length
                    );
                  }, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  🔄 Complete days:
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {
                    DAYS_SHORT.filter(day => {
                      const meals = plan[day] || emptyDay();
                      const mealsToCheck = showSnacks ? [...MEALS, ...SNACKS] : MEALS;
                      return mealsToCheck.every(meal => meals[meal]);
                    }).length
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Snack Toggle & Settings */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSnacks(!showSnacks)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all touch-manipulation ${
                showSnacks
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {showSnacks ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="text-xs sm:text-sm font-medium">Show Snacks</span>
            </motion.button>
            {showSnacks && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIncludeSnacksInPlan(!includeSnacksInPlan)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all touch-manipulation text-xs sm:text-sm font-medium ${
                  includeSnacksInPlan
                    ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Include in AI Plan</span>
              </motion.button>
            )}
          </div>
          {showSnacks && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>🍎</span>
              <span>Morning</span>
              <span>•</span>
              <span>🥕</span>
              <span>Afternoon</span>
              <span>•</span>
              <span>🍌</span>
              <span>Evening</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateSmartPlan}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <CompactRecipeLoader />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">AI Plan My Week</span>
                <span className="sm:hidden">AI Plan</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fillFromFavorites}
            disabled={favorites.length === 0}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Fill from Favorites</span>
            <span className="sm:hidden">Favorites</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateGroceryList}
            disabled={nutritionStats.filled === 0 || loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Generate Grocery List</span>
            <span className="sm:hidden">Grocery</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearAll}
            disabled={nutritionStats.filled === 0}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Clear</span>
          </motion.button>
        </div>
      </div>

      {/* Meal Grid - One week card per day */}
      <div className="grid gap-3 sm:gap-4">
        {DAYS_SHORT.map((dayKey, dayIdx) => {
          const dayMeals = plan[dayKey] || emptyDay();
          const mealEmojis = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️' };
          const mealColors = {
            breakfast: 'from-yellow-500 to-orange-500',
            lunch: 'from-green-500 to-emerald-500',
            dinner: 'from-purple-500 to-pink-500',
          };
          const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

          return (
            <motion.div
              key={dayKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.05 }}
              className="rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Day Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 sm:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <h3 className="font-bold text-lg sm:text-xl">{DAYS[dayIdx]}</h3>
                    <span className="text-xs sm:text-sm opacity-90">
                      {getDailyStats[dayKey]?.filled || 0}/
                      {getDailyStats[dayKey]?.total || MEALS.length}{' '}
                      {showSnacks ? 'items' : 'meals'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Quick Actions */}
                    {dayIdx > 0 && getDailyStats[DAYS_SHORT[dayIdx - 1]]?.filled > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => duplicateDay(dayIdx - 1, dayIdx)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs sm:text-sm font-semibold transition-all touch-manipulation"
                        title="Copy previous day"
                      >
                        📋 Copy
                      </motion.button>
                    )}
                    {getDailyStats[dayKey]?.filled > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => clearDay(dayIdx)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs sm:text-sm font-semibold transition-all touch-manipulation"
                        title="Clear this day"
                      >
                        ✕ Clear
                      </motion.button>
                    )}
                  </div>
                </div>
                {/* Day Progress Bar */}
                {getDailyStats[dayKey] && (
                  <div className="mt-2 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getDailyStats[dayKey].percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Meals Grid */}
              <div className="p-3 sm:p-4">
                {/* Main Meals */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  {MEALS.map((mealType, mealIdx) => {
                    const recipe = dayMeals[mealType];
                    return (
                      <div key={mealType} className="relative">
                        {/* Meal Label */}
                        <div
                          className={`flex items-center gap-2 mb-2 text-xs font-bold text-slate-600 dark:text-slate-400`}
                        >
                          <span className="text-lg">{mealEmojis[mealType]}</span>
                          <span>{mealLabels[mealType]}</span>
                        </div>

                        {/* Recipe Card */}
                        {!recipe ? (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/')}
                            className="flex flex-col items-center justify-center h-32 sm:h-40 rounded-lg sm:rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group hover:border-purple-300 dark:hover:border-purple-700 active:border-purple-400 dark:active:border-purple-600 transition-colors cursor-pointer relative touch-manipulation"
                          >
                            <svg
                              className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-purple-500 mb-1 sm:mb-2 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Tap to add
                            </span>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col h-full relative group">
                            {/* Action Buttons - Top Right */}
                            <div className="absolute top-1 right-1 z-10 flex gap-1">
                              {/* Swap Button */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={async e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const fullRecipe = await getSupabaseRecipeById(recipe.id);
                                    setSwapState({
                                      dayIdx,
                                      mealType,
                                      recipe: fullRecipe || recipe,
                                      position: {
                                        top:
                                          e.currentTarget.getBoundingClientRect().top +
                                          window.scrollY,
                                        left:
                                          e.currentTarget.getBoundingClientRect().left +
                                          window.scrollX,
                                      },
                                    });
                                  } catch (err) {
                                    console.error('Failed to load recipe for swap:', err);
                                    setSwapState({
                                      dayIdx,
                                      mealType,
                                      recipe,
                                      position: {
                                        top:
                                          e.currentTarget.getBoundingClientRect().top +
                                          window.scrollY,
                                        left:
                                          e.currentTarget.getBoundingClientRect().left +
                                          window.scrollX,
                                      },
                                    });
                                  }
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/90 dark:bg-purple-600/90 hover:bg-purple-600 dark:hover:bg-purple-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                title="Swap recipe"
                              >
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </motion.button>
                              {/* Remove Button */}
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMeal(dayIdx, mealType, null);
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/90 dark:bg-red-600/90 hover:bg-red-600 dark:hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                title="Remove recipe"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </motion.button>
                            </div>

                            <Link to={`/recipe/${recipe.id}`} className="block group flex-1">
                              <div className="relative overflow-hidden rounded-lg sm:rounded-xl mb-2">
                                <img
                                  src={recipeImg(recipe.hero_image_url || recipe.image, recipe.id)}
                                  data-original-src={recipe.hero_image_url || recipe.image}
                                  alt={recipe.title}
                                  className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={e => {
                                    if (import.meta.env.DEV) {
                                      console.error('[MealPlanner] meal image failed', {
                                        day: DAYS[dayIdx],
                                        mealType,
                                        id: recipe.id,
                                        src: e.currentTarget.src,
                                      });
                                    }
                                    fallbackOnce(e);
                                  }}
                                  onLoad={e => {
                                    if (import.meta.env.DEV) {
                                      console.log('[MealPlanner] meal image loaded', {
                                        day: DAYS[dayIdx],
                                        mealType,
                                        id: recipe.id,
                                        src: e.currentTarget.src,
                                      });
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[2.5rem]">
                                {recipe.title}
                              </p>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Snacks Section (if enabled) */}
                {showSnacks && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Snacks
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({SNACKS.filter(s => dayMeals[s]).length}/{SNACKS.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {SNACKS.map(snackType => {
                        const recipe = dayMeals[snackType];
                        const snackEmojis = {
                          morning_snack: '🍎',
                          afternoon_snack: '🥕',
                          evening_snack: '🍌',
                        };
                        const snackLabels = {
                          morning_snack: 'Morning',
                          afternoon_snack: 'Afternoon',
                          evening_snack: 'Evening',
                        };

                        return (
                          <div key={snackType} className="relative">
                            {/* Snack Label */}
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <span className="text-base">{snackEmojis[snackType]}</span>
                              <span>{snackLabels[snackType]}</span>
                            </div>

                            {/* Snack Card */}
                            {!recipe ? (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/')}
                                className="flex flex-col items-center justify-center h-24 sm:h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group hover:border-purple-300 dark:hover:border-purple-700 active:border-purple-400 dark:active:border-purple-600 transition-colors cursor-pointer touch-manipulation"
                              >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-purple-500 mb-1 transition-colors" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Add snack
                                </span>
                              </motion.div>
                            ) : (
                              <div className="flex flex-col h-full relative group">
                                <div className="absolute top-0.5 right-0.5 z-10 flex gap-1">
                                  {/* Swap Button */}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={async e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const fullRecipe = await getSupabaseRecipeById(recipe.id);
                                        setSwapState({
                                          dayIdx,
                                          mealType: snackType,
                                          recipe: fullRecipe || recipe,
                                          position: {
                                            top:
                                              e.currentTarget.getBoundingClientRect().top +
                                              window.scrollY,
                                            left:
                                              e.currentTarget.getBoundingClientRect().left +
                                              window.scrollX,
                                          },
                                        });
                                      } catch (err) {
                                        setSwapState({
                                          dayIdx,
                                          mealType: snackType,
                                          recipe,
                                          position: {
                                            top:
                                              e.currentTarget.getBoundingClientRect().top +
                                              window.scrollY,
                                            left:
                                              e.currentTarget.getBoundingClientRect().left +
                                              window.scrollX,
                                          },
                                        });
                                      }
                                    }}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500/90 dark:bg-purple-600/90 hover:bg-purple-600 dark:hover:bg-purple-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                    title="Swap snack"
                                  >
                                    <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  </motion.button>
                                  {/* Remove Button */}
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMeal(dayIdx, snackType, null);
                                    }}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500/90 dark:bg-red-600/90 hover:bg-red-600 dark:hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                    title="Remove snack"
                                  >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </motion.button>
                                </div>

                                <Link to={`/recipe/${recipe.id}`} className="block group flex-1">
                                  <div className="relative overflow-hidden rounded-lg mb-1.5">
                                    <img
                                      src={recipeImg(
                                        recipe.hero_image_url || recipe.image,
                                        recipe.id
                                      )}
                                      data-original-src={recipe.hero_image_url || recipe.image}
                                      alt={recipe.title}
                                      className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                      loading="lazy"
                                      onError={e => fallbackOnce(e)}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="text-xs font-semibold line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[2rem]">
                                    {recipe.title}
                                  </p>
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Meal Swap Modal */}
      {swapState && (
        <MealSwap
          currentRecipe={swapState.recipe}
          mealType={swapState.mealType}
          onSelect={newRecipe => {
            setMeal(swapState.dayIdx, swapState.mealType, newRecipe);
            setSwapState(null);
          }}
          onClose={() => setSwapState(null)}
          position={swapState.position}
        />
      )}
    </div>
  );
}
