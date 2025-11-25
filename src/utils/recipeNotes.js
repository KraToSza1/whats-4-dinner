/**
 * Recipe Notes Utility
 * Personal notes on recipes (per-recipe, per-ingredient, per-step)
 */

const STORAGE_KEY = 'recipe:notes:v1';

/**
 * Get all notes
 */
export function getNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Save notes
 */
export function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Error saving notes:', err);
  }
}

/**
 * Get notes for a recipe
 */
export function getRecipeNotes(recipeId) {
  const notes = getNotes();
  return (
    notes[recipeId] || {
      general: '',
      ingredients: {},
      steps: {},
    }
  );
}

/**
 * Save recipe notes
 */
export function saveRecipeNotes(recipeId, recipeNotes) {
  const notes = getNotes();
  notes[recipeId] = recipeNotes;
  saveNotes(notes);
}

/**
 * Update general notes
 */
export function updateGeneralNotes(recipeId, text) {
  const recipeNotes = getRecipeNotes(recipeId);
  recipeNotes.general = text;
  saveRecipeNotes(recipeId, recipeNotes);
}

/**
 * Update ingredient notes
 */
export function updateIngredientNotes(recipeId, ingredientIndex, text) {
  const recipeNotes = getRecipeNotes(recipeId);
  if (!recipeNotes.ingredients) {
    recipeNotes.ingredients = {};
  }
  recipeNotes.ingredients[ingredientIndex] = text;
  saveRecipeNotes(recipeId, recipeNotes);
}

/**
 * Update step notes
 */
export function updateStepNotes(recipeId, stepIndex, text) {
  const recipeNotes = getRecipeNotes(recipeId);
  if (!recipeNotes.steps) {
    recipeNotes.steps = {};
  }
  recipeNotes.steps[stepIndex] = text;
  saveRecipeNotes(recipeId, recipeNotes);
}

/**
 * Delete recipe notes
 */
export function deleteRecipeNotes(recipeId) {
  const notes = getNotes();
  delete notes[recipeId];
  saveNotes(notes);
}
