/**
 * Leftover Ideas Utility
 * What to make with leftover ingredients
 */

import { FEATURES } from '../config.js';

/**
 * Get leftover ideas based on ingredients
 */
export async function getLeftoverIdeas(ingredients = [], diet = '', intolerances = '') {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  try {
    // Ensure ingredients is an array
    const ingredientsArray = Array.isArray(ingredients) ? ingredients : [ingredients];
    const validIngredients = ingredientsArray.filter(ing => ing && typeof ing === 'string');

    if (validIngredients.length === 0) {
      return [];
    }

    // Use Supabase first (always prefer our own recipes)
    const { searchSupabaseRecipes } = await import('../api/supabaseRecipes.js');

    console.log('🔄 [LEFTOVER IDEAS] Searching Supabase for recipes with ingredients:', {
      ingredients: validIngredients,
      diet,
    });

    const supabaseResults = await searchSupabaseRecipes({
      query: '',
      includeIngredients: validIngredients,
      diet: diet || '',
      mealType: '',
      maxTime: '',
      limit: 10,
    });

    // Filter to only include valid UUID recipes (reject numeric IDs from old data)
    const { isUuid } = await import('../utils/img.ts');
    const validResults = (supabaseResults || []).filter(recipe => {
      const hasValidId = recipe?.id && isUuid(recipe.id);
      if (!hasValidId && recipe?.id) {
        console.warn('⚠️ [LEFTOVER IDEAS] Rejecting recipe with invalid ID:', {
          id: recipe.id,
          title: recipe.title,
          reason: 'Only UUID recipes are allowed',
        });
      }
      return hasValidId;
    });

    if (validResults.length > 0) {
      console.log('✅ [LEFTOVER IDEAS] Found Supabase recipes:', {
        count: validResults.length,
        filtered: (supabaseResults?.length || 0) - validResults.length,
      });
      return validResults;
    }

    // Spoonacular removed - no fallback
    console.log('⚠️ [LEFTOVER IDEAS] No recipes found');
    return [];
  } catch (err) {
    console.error('❌ [LEFTOVER IDEAS] Error getting leftover ideas:', err);
    return [];
  }
}

/**
 * Get leftover ideas from a recipe
 */
export async function getLeftoverIdeasFromRecipe(recipe, diet = '', intolerances = '') {
  if (!recipe?.extendedIngredients) {
    return [];
  }

  // Extract ingredient names
  const ingredients =
    recipe.extendedIngredients?.map(ing => ing.name || ing.original || String(ing)) || [];

  if (ingredients.length === 0) {
    return [];
  }

  return getLeftoverIdeas(ingredients, diet, intolerances);
}

/**
 * Get leftover ideas from pantry
 */
export async function getLeftoverIdeasFromPantry(pantry = [], diet = '', intolerances = '') {
  if (pantry.length === 0) {
    return [];
  }

  return getLeftoverIdeas(pantry, diet, intolerances);
}
