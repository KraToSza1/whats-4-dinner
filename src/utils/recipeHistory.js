/**
 * Recipe History Utility
 * Track when recipes were made, success rate, photos, etc.
 */

const STORAGE_KEY = "recipe:history:v1";

/**
 * Get all history
 */
export function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

/**
 * Save history
 */
export function saveHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error("Error saving history:", err);
    }
}

/**
 * Get history for a recipe
 */
export function getRecipeHistory(recipeId) {
    const history = getHistory();
    return history[recipeId] || [];
}

/**
 * Add recipe to history
 */
export function addRecipeToHistory(recipeId, data = {}) {
    const history = getHistory();
    if (!history[recipeId]) {
        history[recipeId] = [];
    }
    
    const entry = {
        date: new Date().toISOString(),
        timestamp: Date.now(),
        rating: data.rating || null,
        notes: data.notes || "",
        photo: data.photo || null,
        servings: data.servings || null,
        success: data.success !== undefined ? data.success : true,
        ...data,
    };
    
    history[recipeId].unshift(entry); // Add to beginning
    // Keep only last 50 entries per recipe
    if (history[recipeId].length > 50) {
        history[recipeId] = history[recipeId].slice(0, 50);
    }
    
    saveHistory(history);
    return entry;
}

/**
 * Get last made date
 */
export function getLastMadeDate(recipeId) {
    const history = getRecipeHistory(recipeId);
    if (history.length > 0) {
        return history[0].date;
    }
    return null;
}

/**
 * Get success rate
 */
export function getSuccessRate(recipeId) {
    const history = getRecipeHistory(recipeId);
    if (history.length === 0) {
        return null;
    }
    
    const successful = history.filter(entry => entry.success !== false).length;
    return {
        total: history.length,
        successful,
        rate: successful / history.length,
    };
}

/**
 * Get average rating
 */
export function getAverageRating(recipeId) {
    const history = getRecipeHistory(recipeId);
    const ratings = history.filter(entry => entry.rating).map(entry => entry.rating);
    if (ratings.length === 0) {
        return null;
    }
    
    const sum = ratings.reduce((a, b) => a + b, 0);
    return {
        average: sum / ratings.length,
        count: ratings.length,
    };
}

/**
 * Get make count
 */
export function getMakeCount(recipeId) {
    const history = getRecipeHistory(recipeId);
    return history.length;
}

/**
 * Get all recently made recipes
 */
export function getRecentlyMadeRecipes(limit = 10) {
    const history = getHistory();
    const allEntries = [];
    
    Object.keys(history).forEach(recipeId => {
        history[recipeId].forEach(entry => {
            allEntries.push({
                recipeId,
                ...entry,
            });
        });
    });
    
    // Sort by date (newest first)
    allEntries.sort((a, b) => b.timestamp - a.timestamp);
    
    return allEntries.slice(0, limit);
}

