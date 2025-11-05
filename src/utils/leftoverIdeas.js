/**
 * Leftover Ideas Utility
 * What to make with leftover ingredients
 */

/**
 * Get leftover ideas based on ingredients
 */
export async function getLeftoverIdeas(ingredients = [], diet = "", intolerances = "") {
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
        
        // Use Spoonacular API to find recipes with these ingredients
        const { searchRecipes } = await import("../api/spoonacular.js");
        
        const ingredientsString = validIngredients.join(",");
        const results = await searchRecipes({
            includeIngredients: ingredientsString,
            number: 10,
            diet: diet || undefined,
            intolerances: intolerances || undefined,
        });
        
        return results || [];
    } catch (err) {
        console.error("Error getting leftover ideas:", err);
        return [];
    }
}

/**
 * Get leftover ideas from a recipe
 */
export async function getLeftoverIdeasFromRecipe(recipe, diet = "", intolerances = "") {
    if (!recipe?.extendedIngredients) {
        return [];
    }
    
    // Extract ingredient names
    const ingredients = recipe.extendedIngredients?.map(ing => ing.name || ing.original || String(ing)) || [];
    
    if (ingredients.length === 0) {
        return [];
    }
    
    return getLeftoverIdeas(ingredients, diet, intolerances);
}

/**
 * Get leftover ideas from pantry
 */
export async function getLeftoverIdeasFromPantry(pantry = [], diet = "", intolerances = "") {
    if (pantry.length === 0) {
        return [];
    }
    
    return getLeftoverIdeas(pantry, diet, intolerances);
}

