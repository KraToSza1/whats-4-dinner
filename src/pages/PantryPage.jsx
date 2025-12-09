import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PantryChips from '../components/PantryChips.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import RecipeCard from '../components/RecipeCard.jsx';
import { RecipeCardSkeletons } from '../components/LoadingSkeleton.jsx';
import { InlineRecipeLoader } from '../components/FoodLoaders.jsx';
import { ChefHat, Sparkles, TrendingUp, Clock, Users, Zap } from 'lucide-react';
import { useToast } from '../components/Toast.jsx';
import { trackFeatureUsage, FEATURES } from '../utils/featureTracking.js';

/**
 * Enhanced Pantry Page
 *
 * Features:
 * - Beautiful modern UI with gradients and animations
 * - Smart recipe suggestions based on pantry
 * - Quick actions (meal planner, grocery list)
 * - Recipe statistics and insights
 * - Cross-app integration
 */
export default function PantryPage() {
  const [pantry, setPantry] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('filters:pantry') || '[]');
    } catch {
      return [];
    }
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const toast = useToast();

  // Track feature usage
  useEffect(() => {
    trackFeatureUsage(FEATURES.PANTRY, {
      action: 'page_view',
      pantryCount: pantry.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only track on mount

  // Save pantry to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('filters:pantry', JSON.stringify(pantry));
      // Dispatch event for other components to listen
      window.dispatchEvent(
        new CustomEvent('pantryUpdated', {
          detail: { pantry },
        })
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to save pantry to localStorage:', error);
      }
    }
  }, [pantry]);

  // Search for recipes with pantry ingredients
  const handleSearch = async ingredientString => {
    if (!ingredientString || ingredientString.trim() === '') {
      setRecipes([]);
      setSearchTriggered(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchTriggered(true);

    trackFeatureUsage(FEATURES.PANTRY, {
      action: 'search_recipes',
      ingredientCount: pantry.length,
    });

    try {
      const ingredients = ingredientString
        .split(',')
        .map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const results = await searchSupabaseRecipes({
        query: '',
        includeIngredients: ingredients,
        limit: 24,
      });

      // Handle both array and object return formats
      const recipeArray = Array.isArray(results) ? results : results?.data || [];

      setRecipes(recipeArray);

      if (recipeArray && recipeArray.length > 0) {
        toast.success(
          `Found ${recipeArray.length} recipe${recipeArray.length !== 1 ? 's' : ''} with your ingredients!`
        );
      } else {
        toast.info('No recipes found. Try adding more ingredients!');
      }
    } catch (searchError) {
      if (import.meta.env.DEV) {
        console.error('Error searching recipes:', searchError);
      }
      setError('Failed to search recipes. Please try again.');
      setRecipes([]);
      toast.error('Failed to search recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = recipe => {
    const isFavorite = favorites.some(f => f.id === recipe.id);
    if (isFavorite) {
      setFavorites(favorites.filter(f => f.id !== recipe.id));
    } else {
      setFavorites([...favorites, recipe]);
    }
    localStorage.setItem(
      'favorites',
      JSON.stringify(
        isFavorite ? favorites.filter(f => f.id !== recipe.id) : [...favorites, recipe]
      )
    );
  };

  const favoriteIds = new Set(favorites.map(f => f.id));

  // Calculate stats
  const stats = useMemo(() => {
    const avgCookTime =
      recipes.length > 0
        ? Math.round(
            recipes.reduce((sum, r) => sum + (parseInt(r.readyInMinutes) || 0), 0) / recipes.length
          )
        : 0;
    const avgServings =
      recipes.length > 0
        ? Math.round(
            recipes.reduce((sum, r) => sum + (parseInt(r.servings) || 0), 0) / recipes.length
          )
        : 0;

    return {
      recipeCount: recipes.length,
      avgCookTime,
      avgServings,
      pantryCount: pantry.length,
    };
  }, [recipes, pantry]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="page-shell py-6 sm:py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0">
              <BackToHome toHome={false} label="Back" className="mb-0" />
            </div>
            <div className="flex-1 min-w-0 sm:hidden">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                What's in Your Pantry?
              </h1>
            </div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-300 dark:border-amber-700">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30"
                >
                  <ChefHat className="w-8 h-8 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                    What's in Your Pantry?
                  </h1>
                  <p className="text-amber-100 text-sm sm:text-base md:text-lg hidden sm:block">
                    Select ingredients you have on hand and discover amazing recipes
                  </p>
                </div>
              </div>
              {/* Quick Stats */}
              {pantry.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-4 mt-4"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <Sparkles className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-sm">
                      {pantry.length} Ingredient{pantry.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {stats.recipeCount > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                        <TrendingUp className="w-5 h-5 text-white" />
                        <span className="text-white font-semibold text-sm">
                          {stats.recipeCount} Recipe{stats.recipeCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {stats.avgCookTime > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                          <Clock className="w-5 h-5 text-white" />
                          <span className="text-white font-semibold text-sm">
                            ~{stats.avgCookTime} min avg
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pantry Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <PantryChips pantry={pantry} setPantry={setPantry} onSearch={handleSearch} />
        </motion.div>

        {/* Recipe Results */}
        {loading && (
          <div className="mt-6">
            <InlineRecipeLoader />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 shadow-lg"
          >
            <p className="text-center text-sm text-red-600 dark:text-red-400 font-semibold">
              {error}
            </p>
          </motion.div>
        )}

        {recipes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-500" />
                  Recipes with Your Ingredients
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Discover delicious recipes you can make right now!
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-200 dark:border-emerald-800">
                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>

            <div className="grid gap-5 sm:gap-6 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              <AnimatePresence mode="popLayout">
                {recipes.map((recipe, idx) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      index={idx}
                      onFavorite={() => toggleFavorite(recipe)}
                      isFavorite={favoriteIds.has(recipe.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* Empty States */}
        {!loading && !error && recipes.length === 0 && pantry.length > 0 && searchTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center px-4"
          >
            <div className="max-w-md mx-auto p-8 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl">
              <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No recipes found yet
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Try adding more ingredients or different combinations to find recipes!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSearch(pantry.join(', '))}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg"
              >
                Search Again
              </motion.button>
            </div>
          </motion.div>
        )}

        {!loading && !error && recipes.length === 0 && pantry.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center px-4"
          >
            <div className="max-w-md mx-auto p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-200 dark:border-amber-800 shadow-xl">
              <ChefHat className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Start by selecting ingredients
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Choose ingredients from your pantry above, then click "Find Recipes" to discover
                what you can make!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
