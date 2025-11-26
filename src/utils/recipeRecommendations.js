/**
 * Recipe Recommendations Utility
 * "Based on what you like" suggestions
 */

import { FEATURES } from '../config.js';

/**
 * Get user preferences from analytics
 */
function getUserPreferences() {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const ratings = JSON.parse(localStorage.getItem('recipe:ratings') || '{}');
    const history = JSON.parse(localStorage.getItem('recipe:history') || '{}');

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
        return fav
          ? {
              id,
              title: fav.title,
              cuisines: fav.cuisines || [],
              dishTypes: fav.dishTypes || [],
              diets: fav.diets || [],
              ingredients: fav.extendedIngredients?.map(ing => ing.name) || [],
            }
          : null;
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
    console.error('Error getting user preferences:', err);
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
  // Spoonacular removed - use Supabase recipes only
  const preferences = getUserPreferences();

  if (preferences.favoriteCount === 0 && preferences.highlyRatedCount === 0) {
    return [];
  }

  try {
    // Use Supabase recipes instead
    const { searchSupabaseRecipes } = await import('../api/supabaseRecipes.js');

    // Build search query from preferences
    const searchParams = {
      query: '',
      includeIngredients: preferences.topIngredients.slice(0, 3),
      diet: '',
      mealType: preferences.topDishTypes[0] || '',
      maxTime: '',
      limit: limit,
    };

    const results = await searchSupabaseRecipes(searchParams);

    // Filter out already favorited recipes
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteIds = favorites.map(f => f.id);

    // Filter to only include valid UUID recipes
    const { isUuid } = await import('../utils/img.ts');
    const validResults = (results || []).filter(recipe => {
      return recipe?.id && isUuid(recipe.id) && !favoriteIds.includes(recipe.id);
    });

    return validResults || [];
  } catch (err) {
    console.error('Error getting recommendations:', err);
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
    // Use Supabase first (always prefer our own recipes)
    const { searchSupabaseRecipes } = await import('../api/supabaseRecipes.js');

    console.log('🔄 [SIMILAR RECIPES] Searching Supabase for similar recipes:', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      cuisine: recipe.cuisine?.[0] || recipe.cuisines?.[0],
      mealTypes: recipe.mealTypes || recipe.dishTypes,
    });

    // Extract main ingredients for search
    const mainIngredients =
      recipe.extendedIngredients?.length > 0
        ? recipe.extendedIngredients
            .slice(0, 3)
            .map(ing => ing?.name || ing?.original || String(ing))
            .filter(Boolean)
        : [];

    const supabaseResults = await searchSupabaseRecipes({
      query: '',
      includeIngredients: mainIngredients,
      diet: '',
      mealType: recipe.mealTypes?.[0] || recipe.dishTypes?.[0] || '',
      maxTime: '',
      limit: limit + 5, // Get more to filter
    });

    // Filter to only include valid UUID recipes and exclude current recipe
    const { isUuid } = await import('../utils/img.ts');
    const validResults = (supabaseResults || []).filter(r => {
      const hasValidId = r?.id && isUuid(r.id);
      if (!hasValidId && r?.id) {
        console.warn('⚠️ [SIMILAR RECIPES] Rejecting recipe with invalid ID:', {
          id: r.id,
          title: r.title,
          reason: 'Only UUID recipes are allowed',
        });
      }
      return hasValidId && r.id !== recipe.id;
    });

    // Limit results
    const filtered = validResults.slice(0, limit) || [];

    if (filtered.length > 0) {
      console.log('✅ [SIMILAR RECIPES] Found Supabase recipes:', {
        count: filtered.length,
      });
      return filtered;
    }

    // Spoonacular removed - no fallback
    console.log('⚠️ [SIMILAR RECIPES] No recipes found');
    return [];
  } catch (err) {
    console.error('❌ [SIMILAR RECIPES] Error getting similar recipes:', err);
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
    // Use Supabase first (always prefer our own recipes)
    const { searchSupabaseRecipes } = await import('../api/supabaseRecipes.js');

    console.log('🔄 [MEAL SUGGESTIONS] Searching Supabase for meal suggestions:', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      mealTypes: recipe.mealTypes || recipe.dishTypes,
    });

    // Determine meal type
    let targetMealType = '';
    const currentMealTypes = recipe.mealTypes || recipe.dishTypes || [];

    if (currentMealTypes.includes('dessert')) {
      targetMealType = ''; // Don't suggest for desserts
    } else if (currentMealTypes.includes('side dish') || currentMealTypes.includes('side')) {
      targetMealType = 'dinner'; // Suggest main courses
    } else if (
      currentMealTypes.includes('main course') ||
      currentMealTypes.includes('dinner') ||
      currentMealTypes.includes('lunch')
    ) {
      targetMealType = 'dinner'; // Suggest side dishes (filtered by cuisine match)
    }

    if (targetMealType) {
      const supabaseResults = await searchSupabaseRecipes({
        query: '',
        includeIngredients: [],
        diet: '',
        mealType: targetMealType,
        maxTime: '',
        limit: limit + 2, // Get more to filter
      });

      // Filter to only include valid UUID recipes and exclude current recipe
      const { isUuid } = await import('../utils/img.ts');
      const validResults = (supabaseResults || []).filter(r => {
        const hasValidId = r?.id && isUuid(r.id);
        if (!hasValidId && r?.id) {
          console.warn('⚠️ [MEAL SUGGESTIONS] Rejecting recipe with invalid ID:', {
            id: r.id,
            title: r.title,
            reason: 'Only UUID recipes are allowed',
          });
        }
        return hasValidId && r.id !== recipe.id;
      });

      // Limit results
      const filtered = validResults.slice(0, limit) || [];

      if (filtered.length > 0) {
        console.log('✅ [MEAL SUGGESTIONS] Found Supabase recipes:', {
          count: filtered.length,
        });
        return filtered;
      }
    }

    // Spoonacular removed - no fallback
    console.log('⚠️ [MEAL SUGGESTIONS] No recipes found');
    return [];
  } catch (err) {
    console.error('❌ [MEAL SUGGESTIONS] Error getting complete meal suggestions:', err);
    return [];
  }
}
