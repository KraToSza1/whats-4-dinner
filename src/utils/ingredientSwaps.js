/**
 * Ingredient Swaps Utility
 * User-specific ingredient swaps per recipe (stored in localStorage)
 */

const STORAGE_KEY = 'recipe:ingredientSwaps:v1';

/**
 * Get all swaps
 */
export function getSwaps() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Save swaps
 */
export function saveSwaps(swaps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(swaps));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[IngredientSwaps] Error saving swaps:', err);
    }
  }
}

/**
 * Get swaps for a recipe
 */
export function getRecipeSwaps(recipeId) {
  const swaps = getSwaps();
  return swaps[recipeId] || {};
}

/**
 * Set swap for a specific ingredient in a recipe
 */
export function setIngredientSwap(recipeId, ingredientIndex, swapName) {
  const swaps = getSwaps();
  if (!swaps[recipeId]) {
    swaps[recipeId] = {};
  }
  swaps[recipeId][ingredientIndex] = swapName;
  saveSwaps(swaps);
}

/**
 * Remove swap for a specific ingredient
 */
export function removeIngredientSwap(recipeId, ingredientIndex) {
  const swaps = getSwaps();
  if (swaps[recipeId] && swaps[recipeId][ingredientIndex]) {
    delete swaps[recipeId][ingredientIndex];
    if (Object.keys(swaps[recipeId]).length === 0) {
      delete swaps[recipeId];
    }
    saveSwaps(swaps);
  }
}

/**
 * Clear all swaps for a recipe
 */
export function clearRecipeSwaps(recipeId) {
  const swaps = getSwaps();
  delete swaps[recipeId];
  saveSwaps(swaps);
}

/**
 * Apply swap to ingredient display text
 */
export function applySwapToIngredient(displayText, swapName) {
  if (!swapName || !displayText) return displayText;

  // Extract the amount/unit part (everything before the ingredient name)
  // Pattern: "amount unit ingredient name" or "amount ingredient name"
  const parts = displayText.trim().split(/\s+/);

  // Find where the ingredient name starts (usually after amount/unit)
  // Try to preserve the structure: amount unit ingredient -> amount unit swap
  // Simple approach: replace the last word(s) that match common ingredient patterns

  // More sophisticated: try to replace the ingredient name while keeping amount/unit
  // For now, simple replacement of the ingredient name
  const words = displayText.split(/\s+/);

  // Find ingredient name (usually last 1-3 words, excluding prep notes in parentheses)
  // Simple: replace everything after the amount/unit with the swap name
  const amountUnitMatch = displayText.match(/^([\d.]+(?:\s*[a-z]+)?(?:\s*\([^)]+\))?\s*)/i);

  if (amountUnitMatch) {
    const amountUnit = amountUnitMatch[1].trim();
    return `${amountUnit} ${swapName}`;
  }

  // Fallback: just prepend the swap name
  return swapName;
}
