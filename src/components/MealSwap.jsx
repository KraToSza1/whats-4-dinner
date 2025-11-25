import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { CompactRecipeLoader } from './FoodLoaders.jsx';
import { useToast } from './Toast.jsx';
import { X, Search, Sparkles, ChefHat } from 'lucide-react';

export default function MealSwap({
  currentRecipe,
  mealType,
  onSelect,
  onClose,
  position = { top: 0, left: 0 },
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (currentRecipe) {
      loadSuggestions();
    }
  }, [currentRecipe]);

  const loadSuggestions = async () => {
    if (!currentRecipe) return;

    setLoading(true);
    try {
      // Get dietary preferences
      const diet = localStorage.getItem('filters:diet') || '';
      const pantry = JSON.parse(localStorage.getItem('filters:pantry') || '[]');

      // Extract main ingredients from current recipe
      const mainIngredients =
        currentRecipe.extendedIngredients?.length > 0
          ? currentRecipe.extendedIngredients
              .slice(0, 3)
              .map(ing => ing?.name || ing?.original || String(ing))
              .filter(Boolean)
          : [];

      // Search for similar recipes
      const results = await searchSupabaseRecipes({
        query: searchQuery || '',
        includeIngredients: searchQuery ? [] : mainIngredients,
        diet: diet || '',
        mealType: mealType || '',
        maxTime: '',
        limit: 12,
      });

      // Filter out current recipe
      const filtered = (results || []).filter(r => r.id !== currentRecipe.id);
      setSuggestions(filtered.slice(0, 8));
    } catch (error) {
      console.error('[MealSwap] Error loading suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSuggestions();
  };

  const handleSelect = recipe => {
    onSelect({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || recipe.hero_image_url,
    });
    toast.success(`Swapped to ${recipe.title}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 dark:bg-black/70"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
          style={{
            top: position.top || '50%',
            left: position.left || '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl">Swap Recipe</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Find alternatives for {currentRecipe?.title}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </motion.button>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for alternatives..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors touch-manipulation"
              >
                Search
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 sm:p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CompactRecipeLoader />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Finding alternatives...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ChefHat className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No alternatives found</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Try searching for something else
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {suggestions.map((recipe, idx) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                  >
                    <Link
                      to={`/recipe/${recipe.id}`}
                      className="block"
                      onClick={e => {
                        e.preventDefault();
                        handleSelect(recipe);
                      }}
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={recipeImg(recipe.hero_image_url || recipe.image, recipe.id)}
                          alt={recipe.title}
                          className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          onError={e => fallbackOnce(e)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {recipe.title}
                        </h4>
                        {recipe.readyInMinutes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {recipe.readyInMinutes} min
                          </p>
                        )}
                      </div>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(recipe)}
                      className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                      title="Select this recipe"
                    >
                      <ChefHat className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
