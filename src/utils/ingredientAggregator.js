/**
 * Smart ingredient aggregation utility
 * Combines duplicate ingredients and suggests bulk purchases
 */

/**
 * Parse quantity from ingredient string
 * Returns { amount, unit, ingredient } or null
 */
export function parseIngredientQuantity(ingredientText) {
  if (!ingredientText) return null;

  const text = String(ingredientText).trim();

  // Patterns to match quantities
  const patterns = [
    // "2 cups flour" or "1.5 tbsp oil"
    /^(\d+(?:\.\d+)?)\s*(cup|cups|tbsp|tsp|oz|g|kg|lb|lbs|pound|pounds|gram|grams|kilogram|kilograms|ml|l|milliliter|milliliters|liter|liters|tablespoon|tablespoons|teaspoon|teaspoons|clove|cloves|slice|slices|can|cans|package|packages|bag|bags|bunch|bunches|head|heads|piece|pieces|whole|halves)\s+(.+)/i,
    // "2 large eggs" or "1 medium onion"
    /^(\d+(?:\.\d+)?)\s*(large|medium|small|whole|half|quarter)\s+(.+)/i,
    // "2 tomatoes" (simple number + ingredient)
    /^(\d+(?:\.\d+)?)\s+(.+)/i,
    // Fractions: "1/2 cup" or "1 1/2 cups"
    /^(\d+\s*)?(\d+\/\d+)\s*(cup|cups|tbsp|tsp|oz|g|kg|lb|lbs|pound|pounds|gram|grams|kilogram|kilograms|ml|l|milliliter|milliliters|liter|liters|tablespoon|tablespoons|teaspoon|teaspoons|clove|cloves|slice|slices|can|cans|package|packages|bag|bags|bunch|bunches|head|heads|piece|pieces|whole|halves)?\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = 0;
      let unit = '';
      let ingredient = '';

      if (match[3] && match[3].includes('/')) {
        // Handle fractions
        const whole = match[1] ? parseFloat(match[1]) : 0;
        const fraction = match[2];
        const [num, den] = fraction.split('/').map(Number);
        amount = whole + num / den;
        unit = match[3] || '';
        ingredient = match[4] || '';
      } else {
        amount = parseFloat(match[1]);
        unit = match[2] || '';
        ingredient = match[3] || match[4] || '';
      }

      return {
        amount,
        unit: unit.toLowerCase().trim(),
        ingredient: ingredient.trim(),
        original: text,
      };
    }
  }

  // No quantity found, return ingredient as-is
  return {
    amount: 1,
    unit: '',
    ingredient: text,
    original: text,
  };
}

/**
 * Normalize ingredient name for comparison
 */
function normalizeIngredientName(name) {
  if (!name) return '';

  return String(name)
    .toLowerCase()
    .replace(/\([^\)]*\)/g, '') // Remove parentheses
    .replace(
      /\b(chopped|diced|minced|sliced|grated|shredded|fresh|dried|frozen|canned|whole|halved|quartered)\b/g,
      ''
    ) // Remove prep methods
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two units are compatible for aggregation
 */
function areUnitsCompatible(unit1, unit2) {
  if (!unit1 && !unit2) return true; // Both unitless
  if (!unit1 || !unit2) return false; // One has unit, one doesn't

  const u1 = unit1.toLowerCase();
  const u2 = unit2.toLowerCase();

  // Exact match
  if (u1 === u2) return true;

  // Compatible units
  const compatibleGroups = [
    ['cup', 'cups'],
    ['tbsp', 'tablespoon', 'tablespoons'],
    ['tsp', 'teaspoon', 'teaspoons'],
    ['oz', 'ounce', 'ounces'],
    ['lb', 'lbs', 'pound', 'pounds'],
    ['g', 'gram', 'grams'],
    ['kg', 'kilogram', 'kilograms'],
    ['ml', 'milliliter', 'milliliters'],
    ['l', 'liter', 'liters'],
    ['clove', 'cloves'],
    ['slice', 'slices'],
    ['can', 'cans'],
    ['package', 'packages'],
    ['bag', 'bags'],
    ['bunch', 'bunches'],
    ['head', 'heads'],
    ['piece', 'pieces'],
  ];

  for (const group of compatibleGroups) {
    if (group.includes(u1) && group.includes(u2)) {
      return true;
    }
  }

  return false;
}

/**
 * Suggest bulk purchase based on total quantity
 */
function suggestBulkPurchase(ingredient, totalAmount, unit) {
  const suggestions = {
    tomato: { threshold: 3, suggestion: 'bag of tomatoes' },
    onion: { threshold: 3, suggestion: 'bag of onions' },
    potato: { threshold: 3, suggestion: 'bag of potatoes' },
    apple: { threshold: 4, suggestion: 'bag of apples' },
    orange: { threshold: 4, suggestion: 'bag of oranges' },
    carrot: { threshold: 5, suggestion: 'bag of carrots' },
    garlic: { threshold: 5, suggestion: 'bulb of garlic' },
    'bell pepper': { threshold: 3, suggestion: 'multi-pack of bell peppers' },
    chicken: { threshold: 2, suggestion: 'family pack of chicken' },
    'ground beef': { threshold: 2, suggestion: 'family pack of ground beef' },
  };

  const normalized = normalizeIngredientName(ingredient);

  for (const [key, { threshold, suggestion }] of Object.entries(suggestions)) {
    if (normalized.includes(key) && totalAmount >= threshold) {
      return suggestion;
    }
  }

  return null;
}

/**
 * Aggregate ingredients intelligently
 * Combines duplicates and suggests bulk purchases
 */
export function aggregateIngredients(ingredientList) {
  if (!Array.isArray(ingredientList) || ingredientList.length === 0) {
    return [];
  }

  // Parse all ingredients
  const parsed = ingredientList.map(parseIngredientQuantity);

  // Group by normalized ingredient name
  const grouped = new Map();

  for (const item of parsed) {
    const normalizedName = normalizeIngredientName(item.ingredient);
    const key = `${normalizedName}|${item.unit}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ingredient: item.ingredient,
        unit: item.unit,
        amounts: [],
        originals: [],
      });
    }

    const group = grouped.get(key);
    group.amounts.push(item.amount);
    group.originals.push(item.original);
  }

  // Aggregate and format
  const aggregated = [];

  for (const [key, group] of grouped.entries()) {
    const totalAmount = group.amounts.reduce((sum, amt) => sum + amt, 0);
    const roundedAmount = Math.round(totalAmount * 10) / 10; // Round to 1 decimal

    // Format the aggregated ingredient
    let formatted = '';

    if (group.unit) {
      // Has unit
      const unitPlural =
        roundedAmount !== 1 && group.unit && !group.unit.endsWith('s')
          ? group.unit + 's'
          : group.unit;
      formatted = `${roundedAmount} ${unitPlural} ${group.ingredient}`;
    } else {
      // Unitless (countable items)
      if (roundedAmount === 1) {
        formatted = group.ingredient;
      } else {
        formatted = `${Math.round(roundedAmount)} ${group.ingredient}`;
      }
    }

    // Check for bulk purchase suggestion
    const bulkSuggestion = suggestBulkPurchase(group.ingredient, roundedAmount, group.unit);

    aggregated.push({
      text: formatted,
      original: group.originals,
      totalAmount: roundedAmount,
      unit: group.unit,
      ingredient: group.ingredient,
      bulkSuggestion,
      count: group.amounts.length, // How many recipes needed this
    });
  }

  // Sort by ingredient name
  aggregated.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

  return aggregated;
}

/**
 * Format aggregated ingredient for display
 */
export function formatAggregatedIngredient(item) {
  let display = item.text;

  if (item.bulkSuggestion) {
    display += ` (or ${item.bulkSuggestion})`;
  }

  if (item.count > 1) {
    display += ` [from ${item.count} recipe${item.count !== 1 ? 's' : ''}]`;
  }

  return display;
}
