import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { checkRecipeRowCompleteness } from '../utils/recipeCompleteness.js';
import { useToast } from './Toast';
import { AlertCircle, CheckCircle, Image, FileText, Utensils, ChefHat, Calendar } from 'lucide-react';

export default function RecipesNeedingWork() {
  const [recipes, setRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]); // Store all recipes for pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recipesPerPage] = useState(20); // Show 20 recipes per page
  const [stats, setStats] = useState({
    total: 0,
    missingImage: 0,
    missingNutrition: 0,
    missingIngredients: 0,
    missingSteps: 0,
    missingDescription: 0,
  });
  const toast = useToast();

  useEffect(() => {
    fetchRecipesNeedingWork();
  }, []);

  // Paginate recipes
  useEffect(() => {
    const startIndex = (currentPage - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    setRecipes(allRecipes.slice(startIndex, endIndex));
  }, [allRecipes, currentPage, recipesPerPage]);

  const totalPages = Math.ceil(allRecipes.length / recipesPerPage);

  const fetchRecipesNeedingWork = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all recipes (admins see all)
      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('id,title,description,hero_image_url,servings,has_complete_nutrition,created_at')
        .order('created_at', { ascending: false })
        .limit(1000); // Get a large batch

      if (fetchError) {
        throw fetchError;
      }

      // Check completeness for each recipe
      const recipesWithCompleteness = (data || []).map(recipe => ({
        ...recipe,
        completeness: checkRecipeRowCompleteness(recipe),
      }));

      // Filter to only incomplete recipes
      const incompleteRecipes = recipesWithCompleteness.filter(
        r => !r.completeness.isComplete
      );

      // Sort by completeness score (lowest first - most incomplete)
      incompleteRecipes.sort((a, b) => a.completeness.score - b.completeness.score);

      setAllRecipes(incompleteRecipes); // Store all recipes
      
      // Calculate stats
      const newStats = {
        total: incompleteRecipes.length,
        missingImage: incompleteRecipes.filter(r => r.completeness.missingFields.includes('image')).length,
        missingNutrition: incompleteRecipes.filter(r => r.completeness.missingFields.includes('nutrition')).length,
        missingIngredients: 0, // Would need to check ingredients table
        missingSteps: 0, // Would need to check steps table
        missingDescription: incompleteRecipes.filter(r => r.completeness.missingFields.includes('description')).length,
      };

      setStats(newStats);
      setCurrentPage(1); // Reset to first page when data loads
    } catch (err) {
      console.error('Error fetching recipes needing work:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIssueBadges = (completeness) => {
    const badges = [];
    if (completeness.missingFields.includes('image')) {
      badges.push({ label: 'Missing Image', icon: Image, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' });
    }
    if (completeness.missingFields.includes('nutrition')) {
      badges.push({ label: 'Missing Nutrition', icon: FileText, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' });
    }
    if (completeness.missingFields.includes('description')) {
      badges.push({ label: 'Missing Description', icon: FileText, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' });
    }
    if (completeness.missingFields.includes('title')) {
      badges.push({ label: 'Missing Title', icon: AlertCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' });
    }
    if (completeness.missingFields.includes('servings')) {
      badges.push({ label: 'Missing Servings', icon: Utensils, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' });
    }
    return badges;
  };

  const handleEditRecipe = (recipeId, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!recipeId) {
      console.error('🔧 [RECIPES NEEDING WORK] No recipe ID provided');
      toast.error('No recipe ID provided');
      return;
    }
    
    console.warn('🔧 [RECIPES NEEDING WORK] Edit button clicked', {
      recipeId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
    
    try {
      // Navigate to admin dashboard with recipe ID - ensure tab is set to recipes
      const url = `/admin?tab=recipes&recipeId=${encodeURIComponent(recipeId)}`;
      console.warn('🔧 [RECIPES NEEDING WORK] Navigating to:', url);
      
      // Use window.location for more reliable navigation
      window.location.href = url;
    } catch (error) {
      console.error('❌ [RECIPES NEEDING WORK] Error navigating to recipe editor:', error);
      toast.error(`Failed to navigate: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-800 dark:text-red-200 font-semibold">Error: {error}</p>
        <button
          onClick={fetchRecipesNeedingWork}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Recipes Needing Work
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Missing Image</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.missingImage}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Missing Nutrition</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.missingNutrition}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Missing Description</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.missingDescription}</p>
          </div>
        </div>
      </motion.div>

      {/* Recipes List */}
      <div className="space-y-4">
        {/* Pagination Info */}
        {allRecipes.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {((currentPage - 1) * recipesPerPage) + 1} to {Math.min(currentPage * recipesPerPage, allRecipes.length)} of {allRecipes.length} recipes
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">
              All recipes are complete! 🎉
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              No recipes need work at this time.
            </p>
          </div>
        ) : (
          recipes.map((recipe, index) => {
            const badges = getIssueBadges(recipe.completeness);
            return (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex-1">
                        {recipe.title || 'Untitled Recipe'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(recipe.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Issue Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {badges.map((badge, idx) => {
                        const Icon = badge.icon;
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${badge.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Completeness Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${recipe.completeness.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {recipe.completeness.score}% complete
                      </span>
                    </div>

                    {/* Missing Fields List */}
                    {recipe.completeness.issues.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {recipe.completeness.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleEditRecipe(recipe.id, e)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shrink-0 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

