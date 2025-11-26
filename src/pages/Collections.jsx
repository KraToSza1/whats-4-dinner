import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard.jsx';
import BackToHome from '../components/BackToHome.jsx';
import {
  getCollections,
  getRecipesInCollection,
  deleteCollection,
  addCollection,
  removeRecipeFromCollection,
} from '../utils/recipeCollections.js';
import { getSupabaseRecipeById } from '../api/supabaseRecipes.js';
import { InlineRecipeLoader } from '../components/FoodLoaders.jsx';
import { useToast } from '../components/Toast.jsx';
import { Search, Plus, X, FolderPlus, Trash2 } from 'lucide-react';
import { canPerformAction, getPlanDetails, hasFeature } from '../utils/subscription.js';

export default function Collections() {
  const navigate = useNavigate();
  const toast = useToast();
  const hasChecked = useRef(false);

  // ENFORCE COLLECTIONS LIMIT - Check access on mount (only once)
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    if (!hasFeature('collections')) {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('openPremiumFeatureModal', {
            detail: { feature: 'collections' },
          })
        );
      }, 300);
    }
  }, [navigate]);

  const [collections, setCollections] = useState(getCollections());
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setCollections(getCollections());
  }, []);

  const loadCollectionRecipes = async collectionId => {
    setLoading(true);
    setSelectedCollection(collectionId);
    setSearchQuery(''); // Reset search when switching collections
    try {
      const recipeIds = getRecipesInCollection(collectionId);
      if (recipeIds.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      const recipePromises = recipeIds.map(id =>
        getSupabaseRecipeById(id).catch(err => {
          console.error(`Error loading recipe ${id}:`, err);
          return null;
        })
      );
      const loadedRecipes = await Promise.all(recipePromises);
      setRecipes(loadedRecipes.filter(Boolean));
    } catch (err) {
      console.error('Error loading collection recipes:', err);
      setRecipes([]);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(
      recipe =>
        recipe.title?.toLowerCase().includes(query) || recipe.summary?.toLowerCase().includes(query)
    );
  }, [recipes, searchQuery]);

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) {
      toast.error('Please enter a collection name');
      return;
    }

    // ENFORCE COLLECTIONS LIMIT - Check if user can create more collections
    const currentCollections = getCollections().filter(c => c.custom);
    const canCreate = canPerformAction('collection', currentCollections.length);

    if (!canCreate) {
      const planDetails = getPlanDetails();
      toast.error(
        `📁 Collections limit reached! You've created ${currentCollections.length} collection${currentCollections.length === 1 ? '' : 's'}. The Free plan allows ${planDetails.collectionsLimit} collection${planDetails.collectionsLimit === 1 ? '' : 's'}. Upgrade to create unlimited collections and organize all your recipes!`,
        { duration: 5000 }
      );
      window.dispatchEvent(new CustomEvent('openProModal'));
      return;
    }

    const newCollection = addCollection(name);
    setCollections(getCollections());
    setNewCollectionName('');
    setShowCreateModal(false);
    toast.success(`Collection "${name}" created!`);
    // Auto-select the new collection
    loadCollectionRecipes(newCollection.id);
  };

  const handleRemoveRecipe = recipeId => {
    if (selectedCollection && confirm('Remove this recipe from the collection?')) {
      removeRecipeFromCollection(recipeId, selectedCollection);
      setRecipes(recipes.filter(r => r.id !== recipeId));
      toast.success('Recipe removed from collection');
    }
  };

  const handleDeleteCollection = collectionId => {
    if (confirm('Delete this collection? Recipes will be removed from it.')) {
      deleteCollection(collectionId);
      setCollections(getCollections());
      if (selectedCollection === collectionId) {
        setSelectedCollection(null);
        setRecipes([]);
      }
    }
  };

  const handleFavorite = recipe => {
    const isFavorite = favorites.some(fav => fav.id === recipe.id);
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.id !== recipe.id));
      localStorage.setItem(
        'favorites',
        JSON.stringify(favorites.filter(fav => fav.id !== recipe.id))
      );
    } else {
      const newFavorites = [...favorites, recipe];
      setFavorites(newFavorites);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  };

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);
  const totalRecipes = collections.reduce((sum, c) => sum + getRecipesInCollection(c.id).length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <BackToHome />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Recipe Collections
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Organize your recipes into collections • {totalRecipes} total recipes
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 touch-manipulation text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold">Your Collections</h2>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {collections.length}
                </span>
              </div>
              <div className="space-y-1.5 sm:space-y-2 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-hide">
                {collections.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                    <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No collections yet</p>
                    <p className="text-xs mt-1">Create one to get started!</p>
                  </div>
                ) : (
                  collections.map(collection => {
                    const recipeCount = getRecipesInCollection(collection.id).length;
                    const isSelected = selectedCollection === collection.id;
                    return (
                      <motion.button
                        key={collection.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadCollectionRecipes(collection.id)}
                        className={`w-full text-left p-2.5 sm:p-3 rounded-lg border-2 transition-all touch-manipulation ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-lg sm:text-xl flex-shrink-0">
                              {collection.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs sm:text-sm truncate">
                                {collection.name}
                              </div>
                              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
                              </div>
                            </div>
                          </div>
                          {collection.custom && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteCollection(collection.id);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm flex-shrink-0 p-1 touch-manipulation"
                              title="Delete collection"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recipes Grid */}
          <div className="lg:col-span-3">
            {selectedCollection ? (
              <>
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                        <span>{selectedCollectionData?.emoji}</span>
                        <span>{selectedCollectionData?.name}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {filteredRecipes.length} of {recipes.length}{' '}
                        {recipes.length === 1 ? 'recipe' : 'recipes'}
                        {searchQuery && ` matching "${searchQuery}"`}
                      </p>
                    </div>
                    {recipes.length > 0 && (
                      <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search recipes..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 touch-manipulation"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <InlineRecipeLoader />
                    <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm">
                      Loading recipes...
                    </p>
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {searchQuery ? (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg sm:text-xl font-bold mb-2">No recipes found</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          No recipes match "{searchQuery}"
                        </p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl sm:text-6xl mb-4">📁</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">No recipes yet</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          Add recipes to this collection from recipe pages
                        </p>
                        <button
                          onClick={() => navigate('/')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium touch-manipulation"
                        >
                          Browse Recipes
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredRecipes.map((recipe, index) => (
                      <div key={recipe.id} className="relative group">
                        <RecipeCard
                          recipe={recipe}
                          isFavorite={favorites.some(fav => fav.id === recipe.id)}
                          onFavorite={() => handleFavorite(recipe)}
                          index={index}
                        />
                        <button
                          onClick={() => handleRemoveRecipe(recipe.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg touch-manipulation z-10"
                          title="Remove from collection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-5xl sm:text-6xl mb-4">📁</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Select a collection</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Choose a collection from the sidebar to view recipes
                </p>
                {collections.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium touch-manipulation mt-2"
                  >
                    Create Your First Collection
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg sm:text-xl font-bold mb-4">Create New Collection</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Collection Name</label>
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleCreateCollection()}
                      placeholder="e.g., Weeknight Dinners"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 touch-manipulation"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateCollection}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm sm:text-base touch-manipulation"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewCollectionName('');
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium text-sm sm:text-base touch-manipulation"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
