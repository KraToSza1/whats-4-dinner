/**
 * Utility to parse and extract information from grocery items
 */

/**
 * Extract quantity and unit from an ingredient string
 * Returns { amount, unit, ingredientName } or null if parsing fails
 */
export function parseIngredient(ingredientText) {
  if (!ingredientText) return null;

  // Common patterns for quantities
  const patterns = [
    // "2 cups flour", "1.5 tbsp oil"
    /^(\d+(?:\.\d+)?)\s*(cup|cups|tbsp|tsp|oz|g|kg|lb|lbs|pound|pounds|gram|grams|kilogram|kilograms|ml|l|milliliter|milliliters|liter|liters|tablespoon|tablespoons|teaspoon|teaspoons|clove|cloves|slice|slices)\s+(.+)/i,
    // "2 large eggs", "1 medium onion"
    /^(\d+(?:\.\d+)?)\s*(large|medium|small)\s+(.+)/i,
    // "2 eggs" (simple)
    /^(\d+(?:\.\d+)?)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = ingredientText.match(pattern);
    if (match) {
      return {
        amount: parseFloat(match[1]),
        unit: match[2] || '',
        ingredientName: match[3] || '',
      };
    }
  }

  return null;
}

/**
 * Convert units to both grams and ounces
 */
export function getUnitConversions(amount, unit) {
  if (!amount || !unit) return null;

  const unitLower = unit.toLowerCase();

  // Direct weight conversions
  if (unitLower.includes('g') || unitLower.includes('gram')) {
    const oz = amount / 28.35;
    return { grams: amount, oz: Math.round(oz * 10) / 10 };
  }
  if (unitLower.includes('oz') || unitLower.includes('ounce')) {
    const grams = amount * 28.35;
    return { grams: Math.round(grams), oz: amount };
  }
  if (unitLower.includes('lb') || unitLower.includes('pound')) {
    const grams = amount * 454;
    const oz = amount * 16;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }
  if (unitLower.includes('kg') || unitLower.includes('kilogram')) {
    const grams = amount * 1000;
    const oz = amount * 35.274;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }

  // Volume conversions (approximate for common ingredients)
  if (unitLower.includes('ml') || unitLower.includes('milliliter')) {
    const grams = amount; // 1ml ≈ 1g for water-based liquids
    const oz = amount / 28.35;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }
  if (unitLower.includes('l') || unitLower.includes('liter')) {
    const grams = amount * 1000;
    const oz = amount * 33.814;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }
  if (unitLower === 'cup' || unitLower === 'cups') {
    const ml = amount * 240; // 1 cup = 240ml
    const grams = ml; // approximate
    const oz = ml / 28.35;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }
  if (unitLower === 'tbsp' || unitLower === 'tablespoon' || unitLower === 'tablespoons') {
    const ml = amount * 15; // 1 tbsp = 15ml
    const grams = ml;
    const oz = ml / 28.35;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }
  if (unitLower === 'tsp' || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
    const ml = amount * 5; // 1 tsp = 5ml
    const grams = ml;
    const oz = ml / 28.35;
    return { grams: Math.round(grams), oz: Math.round(oz * 10) / 10 };
  }

  return null;
}

/**
 * Get a simple display string for unit conversions
 */
export function getSimpleConversion(ingredientText) {
  const parsed = parseIngredient(ingredientText);
  if (!parsed) return null;

  const conversions = getUnitConversions(parsed.amount, parsed.unit);
  if (!conversions) return null;

  return `${conversions.grams}g / ${conversions.oz}oz`;
}
