/**
 * Recipe Completeness Utilities
 * Determines if a recipe has all required data to be shown to regular users
 * Admins can see all recipes (including incomplete ones) for editing
 */

/**
 * Check if a recipe is "complete" (has all required data)
 * A complete recipe should have:
 * - Title
 * - Description
 * - Image (hero_image_url)
 * - Ingredients (at least one)
 * - Steps (at least one)
 * - Nutrition data (has_complete_nutrition flag)
 * 
 * @param {Object} recipe - Recipe object from Supabase
 * @param {Object} options - Additional options
 * @param {boolean} options.hasIngredients - Whether recipe has ingredients
 * @param {boolean} options.hasSteps - Whether recipe has steps
 * @param {boolean} options.hasNutrition - Whether recipe has nutrition data
 * @returns {Object} - { isComplete: boolean, missingFields: string[], issues: string[] }
 */
export function checkRecipeCompleteness(recipe, options = {}) {
  if (!recipe) {
    return {
      isComplete: false,
      missingFields: ['recipe'],
      issues: ['Recipe object is missing'],
    };
  }

  const missingFields = [];
  const issues = [];

  // Required fields
  if (!recipe.title || recipe.title.trim() === '') {
    missingFields.push('title');
    issues.push('Missing recipe title');
  }

  if (!recipe.description || recipe.description.trim() === '') {
    missingFields.push('description');
    issues.push('Missing recipe description');
  }

  // Check image - must have valid hero_image_url
  const hasImage = !!(recipe.hero_image_url || recipe.image || recipe.heroImageUrl);
  if (!hasImage) {
    missingFields.push('image');
    issues.push('Missing recipe image');
  }

  // Check ingredients (from options or recipe object)
  const hasIngredients = options.hasIngredients ?? (
    (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) ||
    (recipe.ingredients && recipe.ingredients.length > 0)
  );
  
  if (!hasIngredients) {
    missingFields.push('ingredients');
    issues.push('Missing ingredients');
  }

  // Check steps (from options or recipe object)
  const hasSteps = options.hasSteps ?? (
    (recipe.analyzedInstructions && 
     recipe.analyzedInstructions.length > 0 && 
     recipe.analyzedInstructions[0]?.steps?.length > 0) ||
    (recipe.steps && recipe.steps.length > 0) ||
    (recipe.instructions && recipe.instructions.length > 0)
  );
  
  if (!hasSteps) {
    missingFields.push('steps');
    issues.push('Missing cooking steps');
  }

  // Check nutrition - must have has_complete_nutrition flag set to true
  const hasCompleteNutrition = 
    recipe.has_complete_nutrition === true || 
    recipe.hasCompleteNutrition === true ||
    (options.hasNutrition && recipe.nutrition);

  if (!hasCompleteNutrition) {
    missingFields.push('nutrition');
    issues.push('Missing complete nutrition data');
  }

  // Check servings
  if (!recipe.servings || recipe.servings <= 0) {
    missingFields.push('servings');
    issues.push('Missing or invalid servings');
  }

  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    issues,
    score: isComplete ? 100 : Math.max(0, 100 - (missingFields.length * 15)), // Score out of 100
  };
}

/**
 * Check if a recipe row from Supabase is complete
 * This is a lighter check that doesn't require full recipe details
 * 
 * @param {Object} row - Recipe row from Supabase
 * @returns {Object} - { isComplete: boolean, missingFields: string[], issues: string[] }
 */
export function checkRecipeRowCompleteness(row) {
  if (!row) {
    return {
      isComplete: false,
      missingFields: ['recipe'],
      issues: ['Recipe row is missing'],
    };
  }

  const missingFields = [];
  const issues = [];

  // Required fields
  if (!row.title || row.title.trim() === '') {
    missingFields.push('title');
    issues.push('Missing recipe title');
  }

  if (!row.description || row.description.trim() === '') {
    missingFields.push('description');
    issues.push('Missing recipe description');
  }

  // Check image
  if (!row.hero_image_url || row.hero_image_url.trim() === '') {
    missingFields.push('image');
    issues.push('Missing recipe image');
  }

  // Check nutrition flag
  if (row.has_complete_nutrition !== true) {
    missingFields.push('nutrition');
    issues.push('Missing complete nutrition data');
  }

  // Check servings
  if (!row.servings || row.servings <= 0) {
    missingFields.push('servings');
    issues.push('Missing or invalid servings');
  }

  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    issues,
    score: isComplete ? 100 : Math.max(0, 100 - (missingFields.length * 20)),
  };
}

/**
 * Filter recipes based on completeness and admin status
 * 
 * @param {Array} recipes - Array of recipes
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {Function} checkCompleteness - Function to check completeness (default: checkRecipeRowCompleteness)
 * @returns {Array} - Filtered recipes
 */
export function filterRecipesByCompleteness(recipes, isAdmin = false, checkCompleteness = checkRecipeRowCompleteness) {
  if (!Array.isArray(recipes)) {
    return [];
  }

  // Admins see all recipes
  if (isAdmin) {
    return recipes;
  }

  // Regular users only see complete recipes
  return recipes.filter(recipe => {
    const completeness = checkCompleteness(recipe);
    return completeness.isComplete;
  });
}

/**
 * Get recipes that need work (incomplete recipes)
 * 
 * @param {Array} recipes - Array of recipes
 * @param {Function} checkCompleteness - Function to check completeness
 * @returns {Array} - Recipes that need work, sorted by completeness score
 */
export function getRecipesNeedingWork(recipes, checkCompleteness = checkRecipeRowCompleteness) {
  if (!Array.isArray(recipes)) {
    return [];
  }

  return recipes
    .map(recipe => ({
      recipe,
      completeness: checkCompleteness(recipe),
    }))
    .filter(({ completeness }) => !completeness.isComplete)
    .sort((a, b) => a.completeness.score - b.completeness.score) // Lowest score first (most incomplete)
    .map(({ recipe, completeness }) => ({
      ...recipe,
      _completeness: completeness, // Attach completeness info for admin dashboard
    }));
}

