import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import RecipeCard from '../components/RecipeCard.jsx';
import { EmptyStateAnimation } from '../components/LottieFoodAnimations.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { Search, Filter, Heart, X, Grid, List, SortAsc, SortDesc, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast.jsx';

export default function Favorites({ favorites, setFavorites, onFavorite }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [localFavorites, setLocalFavorites] = useState(() => {
    // Load favorites from localStorage if not passed as props
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, name, time
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showClearModal, setShowClearModal] = useState(false);

  const displayFavorites = favorites || localFavorites;

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = displayFavorites;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        recipe =>
          recipe.title?.toLowerCase().includes(query) ||
          recipe.summary?.toLowerCase().includes(query) ||
          recipe.cuisine?.some(c => c.toLowerCase().includes(query)) ||
          recipe.mealTypes?.some(m => m.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'time') {
        const aTime = a.readyInMinutes || a.cookMinutes || 0;
        const bTime = b.readyInMinutes || b.cookMinutes || 0;
        comparison = aTime - bTime;
      } else {
        // date (default) - assume newer favorites are added later
        comparison = 0; // Keep original order for date
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [displayFavorites, searchQuery, sortBy, sortOrder]);

  const handleFavorite = recipe => {
    if (onFavorite) {
      onFavorite(recipe);
    } else {
      // Local handling if no prop handler
      const updated = displayFavorites.filter(f => f.id !== recipe.id);
      setLocalFavorites(updated);
      localStorage.setItem('favorites', JSON.stringify(updated));
      if (setFavorites) {
        setFavorites(updated);
      }
      toast.success('Removed from favorites');
    }
  };

  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = () => {
    const empty = [];
    setLocalFavorites(empty);
    localStorage.setItem('favorites', JSON.stringify(empty));
    if (setFavorites) {
      setFavorites(empty);
    }
    toast.success('All favorites cleared');
    setShowClearModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0">
              <BackToHome className="mb-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between w-full gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-2 sm:gap-3 truncate">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-amber-400 text-xl sm:text-2xl md:text-3xl lg:text-4xl flex-shrink-0"
                  >
                    ⭐
                  </motion.span>
                  <span className="text-slate-900 dark:text-white truncate">Saved Favorites</span>
                </h1>
                {displayFavorites.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearAll}
                    className="px-3 sm:px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg transition-colors text-xs sm:text-sm touch-manipulation flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
                    title="Clear all favorites"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </motion.button>
                )}
              </div>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 hidden sm:block mt-2">
                {displayFavorites.length === 0
                  ? 'No favorites yet. Start saving recipes you love!'
                  : `${displayFavorites.length} ${displayFavorites.length === 1 ? 'recipe' : 'recipes'} saved`}
              </p>
            </div>
          </div>

          <div className="sm:hidden mb-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {displayFavorites.length === 0
                ? 'No favorites yet. Start saving recipes you love!'
                : `${displayFavorites.length} ${displayFavorites.length === 1 ? 'recipe' : 'recipes'} saved`}
            </p>
          </div>
        </motion.div>

        {displayFavorites.length > 0 ? (
          <>
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 sm:mb-6 space-y-3 sm:space-y-4"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 touch-manipulation"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort and View Controls */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 touch-manipulation"
                  >
                    <option value="date">Date Added</option>
                    <option value="name">Name</option>
                    <option value="time">Cooking Time</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-manipulation"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <SortDesc className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 ml-auto border border-slate-300 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-900">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded transition-colors touch-manipulation ${
                      viewMode === 'grid'
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded transition-colors touch-manipulation ${
                      viewMode === 'list'
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results Count */}
              {searchQuery && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Found {filteredAndSortedFavorites.length}{' '}
                  {filteredAndSortedFavorites.length === 1 ? 'recipe' : 'recipes'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              )}
            </motion.div>

            {/* Recipe Grid/List */}
            {filteredAndSortedFavorites.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6'
                    : 'space-y-3 sm:space-y-4'
                }
              >
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedFavorites.map((recipe, index) => (
                    <motion.div
                      key={recipe.id || index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      className={viewMode === 'list' ? 'w-full' : ''}
                    >
                      {viewMode === 'list' ? (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <RecipeCard
                            recipe={recipe}
                            onFavorite={() => handleFavorite(recipe)}
                            isFavorite={true}
                            index={index}
                          />
                        </div>
                      ) : (
                        <RecipeCard
                          recipe={recipe}
                          onFavorite={() => handleFavorite(recipe)}
                          isFavorite={true}
                          index={index}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 sm:py-16 bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  No recipes found
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
                  No favorites match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm sm:text-base font-medium touch-manipulation"
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20"
          >
            <EmptyStateAnimation />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-6 mb-2 text-slate-900 dark:text-white">
              No Favorites Yet
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md px-4">
              Start exploring recipes and save your favorites by clicking the heart icon!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md text-sm sm:text-base touch-manipulation flex items-center gap-2"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Browse Recipes</span>
            </motion.button>
          </motion.div>
        )}

        {/* Clear All Confirmation Modal */}
        {typeof window !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {showClearModal && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowClearModal(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-2 border-red-200 dark:border-red-900/50">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Clear All Favorites?
                          </h3>
                          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            Are you sure you want to remove all {displayFavorites.length}{' '}
                            {displayFavorites.length === 1 ? 'favorite recipe' : 'favorite recipes'}? This action
                            cannot be undone.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={confirmClearAll}
                          className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Yes, Clear All</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowClearModal(false)}
                          className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
    </div>
  );
}
