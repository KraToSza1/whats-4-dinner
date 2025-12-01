import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PantryChips from '../components/PantryChips.jsx';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import RecipeCard from '../components/RecipeCard.jsx';
import { RecipeCardSkeletons } from '../components/LoadingSkeleton.jsx';
import { InlineRecipeLoader } from '../components/FoodLoaders.jsx';

/**
 * Pantry Page
 *
 * This is a dedicated "page" (also called a "route") in your app.
 *
 * What are Pages/Routes?
 * - Pages are different screens in your app that users can navigate to
 * - Each page has its own URL (like /pantry or /calorie-tracker)
 * - When you click a link or button, React Router changes which page is shown
 * - Think of it like different rooms in a house - each has its own purpose
 *
 * This page lets you:
 * - Manage what ingredients you have in your pantry
 * - Search for recipes using your pantry ingredients
 * - See recipe results based on what you have
 */
export default function PantryPage() {
  const navigate = useNavigate();
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
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Save pantry to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('filters:pantry', JSON.stringify(pantry));
    } catch (error) {
      console.warn('Failed to save pantry to localStorage:', error);
    }
  }, [pantry]);

  // Search for recipes with pantry ingredients
  const handleSearch = async ingredientString => {
    if (!ingredientString || ingredientString.trim() === '') {
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ingredients = ingredientString
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const results = await searchSupabaseRecipes({
        query: '',
        includeIngredients: ingredients,
        limit: 24,
      });

      setRecipes(results || []);
    } catch (searchError) {
      console.error('Error searching recipes:', searchError);
      setError('Failed to search recipes. Please try again.');
      setRecipes([]);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="page-shell py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Go back"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-2">What's in Your Pantry?</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Select ingredients you have on hand and find recipes to make
              </p>
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
          <div className="mt-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-center text-sm text-red-600 dark:text-red-400 font-semibold">
              {error}
            </p>
          </div>
        )}

        {recipes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">Recipes with Your Ingredients</h2>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {recipes.map((recipe, idx) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={idx}
                  onFavorite={() => toggleFavorite(recipe)}
                  isFavorite={favoriteIds.has(recipe.id)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {!loading && !error && recipes.length === 0 && pantry.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-slate-500 dark:text-slate-400 px-4"
          >
            <p className="text-lg font-semibold mb-2">No recipes found yet</p>
            <p className="text-sm">
              Click "Find Recipes" above to search for recipes using your selected ingredients
            </p>
          </motion.div>
        )}

        {!loading && !error && recipes.length === 0 && pantry.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-slate-500 dark:text-slate-400 px-4"
          >
            <p className="text-lg font-semibold mb-2">Start by selecting ingredients</p>
            <p className="text-sm">
              Choose ingredients from your pantry above, then click "Find Recipes" to discover what
              you can make!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
