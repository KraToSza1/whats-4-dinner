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
  if (FEATURES.disableSpoonacular) {
    return [];
  }

  const preferences = getUserPreferences();

  if (preferences.favoriteCount === 0 && preferences.highlyRatedCount === 0) {
    return [];
  }

  try {
    const { searchRecipes } = await import('../api/spoonacular.js');

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
      searchParams.includeIngredients = preferences.topIngredients.slice(0, 3).join(',');
    }

    const results = await searchRecipes(searchParams);

    // Filter out already favorited recipes
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteIds = favorites.map(f => f.id);

    return results.filter(recipe => !favoriteIds.includes(recipe.id)) || [];
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

    // Fallback to Spoonacular only if enabled
    if (!FEATURES.disableSpoonacular) {
      console.log('🔄 [SIMILAR RECIPES] Falling back to Spoonacular');
      const { searchRecipes } = await import('../api/spoonacular.js');

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
      if (mainIngredients.length > 0) {
        searchParams.includeIngredients = mainIngredients.slice(0, 3).join(',');
      }

      const results = await searchRecipes(searchParams);

      // Filter out current recipe
      return results.filter(r => r.id !== recipe.id).slice(0, limit) || [];
    }

    console.log('⚠️ [SIMILAR RECIPES] No recipes found and Spoonacular disabled');
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

    // Fallback to Spoonacular only if enabled
    if (!FEATURES.disableSpoonacular) {
      console.log('🔄 [MEAL SUGGESTIONS] Falling back to Spoonacular');
      const { searchRecipes } = await import('../api/spoonacular.js');

      // Determine meal type
      let mealType = 'main course';
      if (recipe.dishTypes) {
        if (recipe.dishTypes.includes('dessert')) {
          mealType = 'dessert';
        } else if (recipe.dishTypes.includes('side dish')) {
          mealType = 'side dish';
        } else if (recipe.dishTypes.includes('appetizer')) {
          mealType = 'appetizer';
        }
      }

      // If it's a main course, suggest side dishes
      // If it's a side dish, suggest main courses
      const suggestions = [];

      if (mealType === 'main course') {
        const sides = await searchRecipes({
          type: 'side dish',
          number: limit,
        });
        if (Array.isArray(sides) && sides.length > 0) {
          suggestions.push(...sides);
        }
      } else if (mealType === 'side dish') {
        const mains = await searchRecipes({
          type: 'main course',
          number: limit,
        });
        if (Array.isArray(mains) && mains.length > 0) {
          suggestions.push(...mains);
        }
      }

      return suggestions.slice(0, limit) || [];
    }

    console.log('⚠️ [MEAL SUGGESTIONS] No recipes found and Spoonacular disabled');
    return [];
  } catch (err) {
    console.error('❌ [MEAL SUGGESTIONS] Error getting complete meal suggestions:', err);
    return [];
  }
}
