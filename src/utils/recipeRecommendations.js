/**
 * Recipe Recommendations Utility
 * "Based on what you like" suggestions
 */

/**
 * Get user preferences from analytics
 */
function getUserPreferences() {
    try {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const ratings = JSON.parse(localStorage.getItem("recipe:ratings") || "{}");
        const history = JSON.parse(localStorage.getItem("recipe:history") || "{}");
        
        // Analyze favorites
        const favoriteRecipes = favorites.map(fav => ({
            id: fav.id,
            title: fav.title,
            cuisines: fav.cuisines || [],
            dishTypes: fav.dishTypes || [],
            diets: fav.diets || [],
            ingredients: fav.extendedIngredients?.map(ing => ing.name) || [],
        }));
        
        // Analyze ratings
        const highlyRated = Object.keys(ratings)
            .filter(id => ratings[id] >= 4)
            .map(id => {
                const fav = favorites.find(f => f.id === id);
                return fav ? {
                    id,
                    title: fav.title,
                    cuisines: fav.cuisines || [],
                    dishTypes: fav.dishTypes || [],
                    diets: fav.diets || [],
                    ingredients: fav.extendedIngredients?.map(ing => ing.name) || [],
                } : null;
            })
            .filter(Boolean);
        
        // Combine favorites and highly rated
        const preferences = [...favoriteRecipes, ...highlyRated];
        
        // Extract common patterns
        const commonCuisines = {};
        const commonDishTypes = {};
        const commonIngredients = {};
        
        preferences.forEach(recipe => {
            recipe.cuisines.forEach(cuisine => {
                commonCuisines[cuisine] = (commonCuisines[cuisine] || 0) + 1;
            });
            recipe.dishTypes.forEach(dishType => {
                commonDishTypes[dishType] = (commonDishTypes[dishType] || 0) + 1;
            });
            recipe.ingredients.forEach(ingredient => {
                commonIngredients[ingredient] = (commonIngredients[ingredient] || 0) + 1;
            });
        });
        
        // Get top preferences
        const topCuisines = Object.keys(commonCuisines)
            .sort((a, b) => commonCuisines[b] - commonCuisines[a])
            .slice(0, 3);
        
        const topDishTypes = Object.keys(commonDishTypes)
            .sort((a, b) => commonDishTypes[b] - commonDishTypes[a])
            .slice(0, 3);
        
        const topIngredients = Object.keys(commonIngredients)
            .sort((a, b) => commonIngredients[b] - commonIngredients[a])
            .slice(0, 5);
        
        return {
            topCuisines,
            topDishTypes,
            topIngredients,
            favoriteCount: favorites.length,
            highlyRatedCount: highlyRated.length,
        };
    } catch (err) {
        console.error("Error getting user preferences:", err);
        return {
            topCuisines: [],
            topDishTypes: [],
            topIngredients: [],
            favoriteCount: 0,
            highlyRatedCount: 0,
        };
    }
}

/**
 * Get recipe recommendations based on user preferences
 */
export async function getRecommendations(limit = 10) {
    const preferences = getUserPreferences();
    
    if (preferences.favoriteCount === 0 && preferences.highlyRatedCount === 0) {
        return [];
    }
    
    try {
        const { searchRecipes } = await import("../api/spoonacular.js");
        
        // Build search query from preferences
        const searchParams = {
            number: limit,
        };
        
        // Add cuisine filter if available
        if (preferences.topCuisines.length > 0) {
            searchParams.cuisine = preferences.topCuisines[0];
        }
        
        // Add dish type filter if available
        if (preferences.topDishTypes.length > 0) {
            searchParams.type = preferences.topDishTypes[0];
        }
        
        // Add ingredients if available
        if (preferences.topIngredients.length > 0) {
            searchParams.includeIngredients = preferences.topIngredients.slice(0, 3).join(",");
        }
        
        const results = await searchRecipes(searchParams);
        
        // Filter out already favorited recipes
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const favoriteIds = favorites.map(f => f.id);
        
        return results.filter(recipe => !favoriteIds.includes(recipe.id)) || [];
    } catch (err) {
        console.error("Error getting recommendations:", err);
        return [];
    }
}

/**
 * Get "Similar Recipes" for a specific recipe
 */
export async function getSimilarRecipes(recipe, limit = 5) {
    if (!recipe) {
        return [];
    }
    
    try {
        const { searchRecipes } = await import("../api/spoonacular.js");
        
        const searchParams = {
            number: limit + 5, // Get more to filter out current recipe
        };
        
        // Use cuisine if available
        if (recipe.cuisines && recipe.cuisines.length > 0) {
            searchParams.cuisine = recipe.cuisines[0];
        }
        
        // Use dish type if available
        if (recipe.dishTypes && recipe.dishTypes.length > 0) {
            searchParams.type = recipe.dishTypes[0];
        }
        
        // Use main ingredients if available
        if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
            const mainIngredients = recipe.extendedIngredients
                .slice(0, 3)
                .map(ing => ing?.name || ing?.original || String(ing))
                .filter(Boolean)
                .join(",");
            if (mainIngredients) {
                searchParams.includeIngredients = mainIngredients;
            }
        }
        
        const results = await searchRecipes(searchParams);
        
        // Filter out current recipe
        return results.filter(r => r.id !== recipe.id).slice(0, limit) || [];
    } catch (err) {
        console.error("Error getting similar recipes:", err);
        return [];
    }
}

/**
 * Get "Complete Your Meal" suggestions
 */
export async function getCompleteMealSuggestions(recipe, limit = 3) {
    if (!recipe) {
        return [];
    }
    
    try {
        const { searchRecipes } = await import("../api/spoonacular.js");
        
        // Determine meal type
        let mealType = "main course";
        if (recipe.dishTypes) {
            if (recipe.dishTypes.includes("dessert")) {
                mealType = "dessert";
            } else if (recipe.dishTypes.includes("side dish")) {
                mealType = "side dish";
            } else if (recipe.dishTypes.includes("appetizer")) {
                mealType = "appetizer";
            }
        }
        
        // If it's a main course, suggest side dishes
        // If it's a side dish, suggest main courses
        const suggestions = [];
        
        if (mealType === "main course") {
            const sides = await searchRecipes({
                type: "side dish",
                number: limit,
            });
            if (Array.isArray(sides) && sides.length > 0) {
                suggestions.push(...sides);
            }
        } else if (mealType === "side dish") {
            const mains = await searchRecipes({
                type: "main course",
                number: limit,
            });
            if (Array.isArray(mains) && mains.length > 0) {
                suggestions.push(...mains);
            }
        }
        
        return suggestions.slice(0, limit) || [];
    } catch (err) {
        console.error("Error getting complete meal suggestions:", err);
        return [];
    }
}

