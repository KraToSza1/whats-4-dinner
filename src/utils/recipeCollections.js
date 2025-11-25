/**
 * Recipe Collections Utility
 * Manages recipe collections (organize recipes into custom categories)
 */

const STORAGE_KEY = 'recipe:collections:v1';
const RECIPE_COLLECTIONS_KEY = 'recipe:collections:recipes:v1';

/**
 * Get all collections
 */
export function getCollections() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // Default collections
    return [
      { id: 'quick', name: 'Quick & Easy', emoji: '⚡', color: 'emerald' },
      { id: 'healthy', name: 'Healthy', emoji: '💚', color: 'green' },
      { id: 'comfort', name: 'Comfort Food', emoji: '🍜', color: 'amber' },
      { id: 'date-night', name: 'Date Night', emoji: '🕯️', color: 'violet' },
      { id: 'meal-prep', name: 'Meal Prep', emoji: '📦', color: 'blue' },
      { id: 'holidays', name: 'Holidays', emoji: '🎄', color: 'red' },
      { id: 'desserts', name: 'Desserts', emoji: '🍰', color: 'pink' },
    ];
  } catch {
    return [];
  }
}

/**
 * Save collections
 */
export function saveCollections(collections) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (err) {
    console.error('Error saving collections:', err);
  }
}

/**
 * Add a custom collection
 */
export function addCollection(name, emoji = '📁', color = 'slate') {
  const collections = getCollections();
  const newCollection = {
    id: `custom-${Date.now()}`,
    name,
    emoji,
    color,
    custom: true,
  };
  collections.push(newCollection);
  saveCollections(collections);
  return newCollection;
}

/**
 * Delete a collection
 */
export function deleteCollection(collectionId) {
  const collections = getCollections().filter(c => c.id !== collectionId);
  saveCollections(collections);
  // Also remove recipes from this collection
  const recipeCollections = getRecipeCollections();
  Object.keys(recipeCollections).forEach(recipeId => {
    recipeCollections[recipeId] = recipeCollections[recipeId].filter(id => id !== collectionId);
  });
  saveRecipeCollections(recipeCollections);
}

/**
 * Get recipes in collections
 */
export function getRecipeCollections() {
  try {
    return JSON.parse(localStorage.getItem(RECIPE_COLLECTIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Save recipe collections
 */
export function saveRecipeCollections(recipeCollections) {
  try {
    localStorage.setItem(RECIPE_COLLECTIONS_KEY, JSON.stringify(recipeCollections));
  } catch (err) {
    console.error('Error saving recipe collections:', err);
  }
}

/**
 * Get collections for a recipe
 */
export function getRecipeCollectionsForRecipe(recipeId) {
  const recipeCollections = getRecipeCollections();
  return recipeCollections[recipeId] || [];
}

/**
 * Add recipe to collection
 */
export function addRecipeToCollection(recipeId, collectionId) {
  const recipeCollections = getRecipeCollections();
  if (!recipeCollections[recipeId]) {
    recipeCollections[recipeId] = [];
  }
  if (!recipeCollections[recipeId].includes(collectionId)) {
    recipeCollections[recipeId].push(collectionId);
    saveRecipeCollections(recipeCollections);
  }
}

/**
 * Remove recipe from collection
 */
export function removeRecipeFromCollection(recipeId, collectionId) {
  const recipeCollections = getRecipeCollections();
  if (recipeCollections[recipeId]) {
    recipeCollections[recipeId] = recipeCollections[recipeId].filter(id => id !== collectionId);
    saveRecipeCollections(recipeCollections);
  }
}

/**
 * Toggle recipe in collection
 */
export function toggleRecipeInCollection(recipeId, collectionId) {
  const collections = getRecipeCollectionsForRecipe(recipeId);
  if (collections.includes(collectionId)) {
    removeRecipeFromCollection(recipeId, collectionId);
    return false;
  } else {
    addRecipeToCollection(recipeId, collectionId);
    return true;
  }
}

/**
 * Get all recipes in a collection
 */
export function getRecipesInCollection(collectionId) {
  const recipeCollections = getRecipeCollections();
  const recipeIds = [];
  Object.keys(recipeCollections).forEach(recipeId => {
    if (recipeCollections[recipeId].includes(collectionId)) {
      recipeIds.push(recipeId);
    }
  });
  return recipeIds;
}

/**
 * Get collection stats
 */
export function getCollectionStats(collectionId) {
  const recipes = getRecipesInCollection(collectionId);
  return {
    count: recipes.length,
    recipeIds: recipes,
  };
}
