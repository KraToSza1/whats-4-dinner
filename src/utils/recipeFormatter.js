/**
 * Clean and format recipe titles to be more human-readable
 * @param {string} title - Raw recipe title from database
 * @returns {string} - Cleaned and formatted title
 */
export function cleanRecipeTitle(title) {
  if (!title) return 'Untitled Recipe';

  let cleaned = title.trim();

  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Fix common issues:
  // - "recipe" at the end (redundant)
  cleaned = cleaned.replace(/\s+recipe\s*$/i, '');

  // - Multiple spaces between words
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // - Fix common abbreviations
  cleaned = cleaned.replace(/\bw\s+/gi, 'with ');
  cleaned = cleaned.replace(/\bw\/o\b/gi, 'without');
  cleaned = cleaned.replace(/\b&\s+/g, 'and ');

  // - Fix apostrophes
  cleaned = cleaned.replace(/\s+'s\b/g, "'s");
  cleaned = cleaned.replace(/\s+'/g, "'");

  // - Capitalize first letter of each word (title case)
  cleaned = cleaned
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      // Keep common lowercase words lowercase (unless first word)
      const lowercaseWords = [
        'a',
        'an',
        'and',
        'as',
        'at',
        'but',
        'by',
        'for',
        'from',
        'in',
        'of',
        'on',
        'or',
        'the',
        'to',
        'with',
      ];
      if (lowercaseWords.includes(word.toLowerCase()) && cleaned.indexOf(word) > 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // - Always capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.trim();
}

/**
 * Clean and format recipe instructions to be more readable
 * @param {string|Array} instructions - Raw instructions (string or array of steps)
 * @returns {Array<string>} - Array of cleaned instruction steps
 */
export function cleanRecipeInstructions(instructions) {
  if (!instructions) return [];

  let steps = [];

  // If it's already an array, use it
  if (Array.isArray(instructions)) {
    steps = instructions;
  } else if (typeof instructions === 'string') {
    // Parse HTML if present
    const tmp = document.createElement('div');
    tmp.innerHTML = instructions;
    const text = tmp.textContent || tmp.innerText || instructions;

    // Split by periods, numbers, or newlines
    steps = text
      .split(/(?:\d+\.\s+|\.\s+(?=[A-Z])|\n+|(?<=[.!?])\s+(?=[A-Z]))/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // Clean each step
  return steps
    .map((step, index) => {
      let cleaned = step.trim();

      // Remove step numbers if present (e.g., "1. ", "Step 1: ")
      cleaned = cleaned.replace(/^(?:\d+\.\s*|step\s+\d+[:\-]\s*)/i, '');

      // Remove extra spaces
      cleaned = cleaned.replace(/\s+/g, ' ');

      // Capitalize first letter
      if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }

      // Ensure it ends with punctuation
      if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
      }

      return cleaned;
    })
    .filter(step => step.length > 10); // Filter out very short steps (likely parsing errors)
}

/**
 * Format a single instruction step with better readability
 * @param {string} step - Raw instruction step
 * @param {number} stepNumber - Step number (1-based)
 * @returns {string} - Formatted step
 */
export function formatInstructionStep(step, stepNumber) {
  if (!step) return '';

  let formatted = step.trim();

  // Remove existing step numbers
  formatted = formatted.replace(/^(?:\d+\.\s*|step\s+\d+[:\-]\s*)/i, '');

  // Clean up spacing
  formatted = formatted.replace(/\s+/g, ' ');

  // Capitalize first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // Add step number prefix
  return `${stepNumber}. ${formatted}`;
}
