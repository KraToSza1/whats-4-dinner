/**
 * Offline cache utilities for recipes
 */

const CACHE_PREFIX = 'recipe_cache_';
const CACHE_VERSION = 1;
const MAX_CACHE_SIZE = 50; // Maximum number of recipes to cache

/**
 * Cache a recipe
 */
export const cacheRecipe = recipe => {
  if (!recipe || !recipe.id) return;

  try {
    const key = `${CACHE_PREFIX}${recipe.id}`;
    const data = {
      recipe,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(data));

    // Clean up old cache if needed
    cleanupCache();
  } catch (error) {
    console.error('[OfflineCache] Failed to cache recipe:', error);
  }
};

/**
 * Get a cached recipe
 */
export const getCachedRecipe = recipeId => {
  try {
    const key = `${CACHE_PREFIX}${recipeId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);

    // Check version
    if (data.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    // Check if cache is too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return data.recipe;
  } catch (error) {
    console.error('[OfflineCache] Failed to get cached recipe:', error);
    return null;
  }
};

/**
 * Clean up old cache entries to prevent localStorage from growing too large
 */
export const cleanupCache = () => {
  try {
    const cacheKeys = [];

    // Find all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        cacheKeys.push({
          key,
          timestamp: data.timestamp || 0,
        });
      }
    }

    // Sort by timestamp (oldest first)
    cacheKeys.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries if over limit
    if (cacheKeys.length > MAX_CACHE_SIZE) {
      const toRemove = cacheKeys.slice(0, cacheKeys.length - MAX_CACHE_SIZE);
      toRemove.forEach(({ key }) => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('[OfflineCache] Failed to cleanup cache:', error);
  }
};

/**
 * Clear all cached recipes
 */
export const clearCache = () => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('[OfflineCache] Failed to clear cache:', error);
  }
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
  try {
    let count = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        count++;
        totalSize += localStorage.getItem(key).length;
      }
    }

    return {
      count,
      totalSize,
      maxSize: MAX_CACHE_SIZE,
    };
  } catch (error) {
    console.error('[OfflineCache] Failed to get cache stats:', error);
    return { count: 0, totalSize: 0, maxSize: MAX_CACHE_SIZE };
  }
};
