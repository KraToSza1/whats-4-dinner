/**
 * Utility to analyze user preferences and suggest recipes
 */

/**
 * Get all recipe ratings from localStorage
 */
export function getAllRatings() {
    const ratings = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("recipeRating:")) {
                const recipeId = key.replace("recipeRating:", "");
                const data = JSON.parse(localStorage.getItem(key) || "{}");
                if (data.rating && data.rating > 0) {
                    ratings[recipeId] = {
                        rating: data.rating,
                        notes: data.notes || "",
                    };
                }
            }
        }
    } catch (e) {
        console.warn("[PreferenceAnalyzer] Error reading ratings", e);
    }
    return ratings;
}

/**
 * Get average rating for a specific cuisine type based on user's ratings
 */
export function getCuisinePreference(recipeData) {
    const ratings = getAllRatings();
    if (Object.keys(ratings).length === 0) return null;
    
    // Extract cuisine types from rated recipes
    const cuisineScores = {};
    
    // This would need recipe data to get cuisine types
    // For now, return a simple preference score
    const likedCount = Object.values(ratings).filter(r => r.rating >= 4).length;
    const totalCount = Object.keys(ratings).length;
    
    if (totalCount === 0) return null;
    
    return {
        favoritePercent: (likedCount / totalCount) * 100,
        totalRatings: totalCount,
    };
}

/**
 * Get preference summary for the UI
 */
export function getPreferenceSummary() {
    const ratings = getAllRatings();
    const total = Object.keys(ratings).length;
    
    if (total === 0) {
        return {
            message: "Start rating recipes to get personalized suggestions!",
            emoji: "⭐",
        };
    }
    
    const loved = Object.values(ratings).filter(r => r.rating === 5).length;
    const liked = Object.values(ratings).filter(r => r.rating >= 4).length;
    const neutral = Object.values(ratings).filter(r => r.rating === 3).length;
    const disliked = Object.values(ratings).filter(r => r.rating <= 2).length;
    
    const favoritePercent = Math.round((liked / total) * 100);
    
    let message = `You've rated ${total} recipe${total !== 1 ? "s" : ""}! `;
    let emoji = "📊";
    
    if (loved > 0) {
        emoji = "🌟";
        message += `${loved} loved`;
    } else if (liked > 0) {
        emoji = "👍";
        message += `${liked} liked`;
    }
    
    return {
        message,
        emoji,
        total,
        loved,
        liked,
        neutral,
        disliked,
        favoritePercent,
    };
}

/**
 * Suggest recipes based on user preferences
 * This would be enhanced with actual recipe analysis in the future
 */
export function getPersonalizedSuggestions(favorites = []) {
    const ratings = getAllRatings();
    
    if (favorites.length === 0 && Object.keys(ratings).length === 0) {
        return [];
    }
    
    // For now, return favorites as "personalized" suggestions
    return favorites.slice(0, 3);
}

