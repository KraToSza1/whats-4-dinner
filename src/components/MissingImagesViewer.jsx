import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './Toast.jsx';
import {
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import RecipeEditor from './RecipeEditor';

export default function MissingImagesViewer({ filterType: propFilterType = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Use prop filterType if provided (from route), otherwise get from URL params
  const filterType = propFilterType || searchParams.get('filter') || 'missing-images'; // 'missing-images' or 'missing-nutrition'
  const toast = useToast();

  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('🔍 [MISSING IMAGES VIEWER] Component mounted/updated', {
        filterType,
        searchParams: searchParams.toString(),
      });
    }
    loadRecipes();
  }, [filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecipes = async (showRefresh = false) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('🔄 [MISSING IMAGES VIEWER] Loading recipes', {
        filterType,
        showRefresh,
      });
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let query = supabase.from('recipes').select('id, title, hero_image_url, created_at');

      if (filterType === 'missing-images') {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('📸 [MISSING IMAGES VIEWER] Filtering for missing images');
        }
        query = query.or('hero_image_url.is.null,hero_image_url.eq.');
      } else if (filterType === 'missing-nutrition') {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('🥗 [MISSING IMAGES VIEWER] Filtering for missing nutrition');
        }
        // Get recipes without nutrition data (nutrition is stored in recipes table)
        // Check for recipes where calories is null or 0
        const { data: allRecipes, error } = await supabase
          .from('recipes')
          .select('id, title, hero_image_url, created_at, calories')
          .or('calories.is.null,calories.eq.0');

        if (error) {
          if (import.meta.env.DEV) {
            console.error(
              '❌ [MISSING IMAGES VIEWER] Error loading recipes with missing nutrition:',
              error
            );
          }
          toast.error('Failed to load recipes');
          setRecipes([]);
        } else {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('✅ [MISSING IMAGES VIEWER] Loaded recipes with missing nutrition', {
              count: allRecipes?.length || 0,
              recipes: allRecipes?.slice(0, 3).map(r => ({ id: r.id, title: r.title })),
            });
          }
          setRecipes(allRecipes || []);
        }

        if (showRefresh) setRefreshing(false);
        else setLoading(false);
        return;
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('❌ [MISSING IMAGES VIEWER] Query error:', error);
        }
        throw error;
      }

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('✅ [MISSING IMAGES VIEWER] Loaded recipes', {
          count: data?.length || 0,
          filterType,
          recipes: data?.slice(0, 3).map(r => ({ id: r.id, title: r.title })),
        });
      }
      setRecipes(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ [MISSING IMAGES VIEWER] Error loading recipes:', error);
      }
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debug: Log component render state
  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('🎨 [MISSING IMAGES VIEWER] Component rendered', {
        filterType,
        loading,
        refreshing,
        recipesCount: recipes.length,
        searchQuery,
      });
    }
  }, [filterType, loading, refreshing, recipes.length, searchQuery]);

  // Listen for recipe image updates to refresh the list
  useEffect(() => {
    const handleRecipeImageUpdated = () => {
      // Reload recipes when an image is updated
      loadRecipes();
    };

    window.addEventListener('recipeImageUpdated', handleRecipeImageUpdated);
    return () => {
      window.removeEventListener('recipeImageUpdated', handleRecipeImageUpdated);
    };
  }, []);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRecipe = recipe => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('📝 [MISSING IMAGES VIEWER] Recipe selected', {
        recipeId: recipe.id,
        title: recipe.title,
      });
    }
    setSelectedRecipe(recipe);
  };

  const handleCloseEditor = () => {
    setSelectedRecipe(null);
    loadRecipes(); // Refresh list after editing
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-red-500" />
            {filterType === 'missing-images' ? 'Missing Images' : 'Missing Nutrition'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // If propFilterType is provided, navigate to dedicated page
                // Otherwise, use URL params (for backward compatibility)
                if (propFilterType !== null) {
                  navigate('/admin/missing-images');
                } else {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('filter', 'missing-images');
                  setSearchParams(newParams);
                }
              }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filterType === 'missing-images'
                  ? 'bg-slate-700 dark:bg-slate-600 text-white border-2 border-slate-500 shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Missing Images
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // If propFilterType is provided, navigate to dedicated page
                // Otherwise, use URL params (for backward compatibility)
                if (propFilterType !== null) {
                  navigate('/admin/missing-nutrition');
                } else {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('filter', 'missing-nutrition');
                  setSearchParams(newParams);
                }
              }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filterType === 'missing-nutrition'
                  ? 'bg-slate-700 dark:bg-slate-600 text-white border-2 border-slate-500 shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Missing Nutrition
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadRecipes(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Recipes List */}
      {filteredRecipes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-12 border-2 border-slate-200 dark:border-slate-700 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">All Good! 🎉</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {filterType === 'missing-images'
              ? 'No recipes with missing images found.'
              : 'No recipes with missing nutrition data found.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => handleSelectRecipe(recipe)}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 cursor-pointer hover:border-red-400 dark:hover:border-red-600 transition-all shadow-md hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Created: {new Date(recipe.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 ml-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                {filterType === 'missing-images' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-semibold">No image</span>
                  </div>
                )}
                {filterType === 'missing-nutrition' && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold">No nutrition data</span>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Fix Now
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Recipe Editor Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCloseEditor} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto relative">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between z-10">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Edit Recipe: {selectedRecipe.title}
                  </h3>
                  <button
                    onClick={handleCloseEditor}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
                <div className="p-6">
                  <RecipeEditor
                    recipeId={selectedRecipe.id}
                    onClose={handleCloseEditor}
                    focusOnImage={filterType === 'missing-images'}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
