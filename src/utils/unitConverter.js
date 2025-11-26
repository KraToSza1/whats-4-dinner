// Unit conversion utilities shared across the app.

const UNIT_SYSTEMS = {
  metric: { flag: '🌍', name: 'Metric', hint: 'grams & milliliters' },
  us: { flag: '🇺🇸', name: 'US', hint: 'cups & ounces' },
  uk: { flag: '🇬🇧', name: 'UK', hint: 'ml & imperial' },
};

const ROUND = (value, digits = 2) => {
  if (value === null || value === undefined) return null;
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const MASS_ALIASES = {
  g: { type: 'mass', toBase: 1, label: 'g' },
  gram: { type: 'mass', toBase: 1, label: 'g' },
  grams: { type: 'mass', toBase: 1, label: 'g' },
  kg: { type: 'mass', toBase: 1000, label: 'kg' },
  kilogram: { type: 'mass', toBase: 1000, label: 'kg' },
  kilograms: { type: 'mass', toBase: 1000, label: 'kg' },
  oz: { type: 'mass', toBase: 28.3495, label: 'oz' },
  ounce: { type: 'mass', toBase: 28.3495, label: 'oz' },
  ounces: { type: 'mass', toBase: 28.3495, label: 'oz' },
  lb: { type: 'mass', toBase: 453.592, label: 'lb' },
  lbs: { type: 'mass', toBase: 453.592, label: 'lb' },
  pound: { type: 'mass', toBase: 453.592, label: 'lb' },
  pounds: { type: 'mass', toBase: 453.592, label: 'lb' },
};

const VOLUME_ALIASES = {
  ml: { type: 'volume', toBase: 1, label: 'ml' },
  milliliter: { type: 'volume', toBase: 1, label: 'ml' },
  milliliters: { type: 'volume', toBase: 1, label: 'ml' },
  l: { type: 'volume', toBase: 1000, label: 'l' },
  liter: { type: 'volume', toBase: 1000, label: 'l' },
  liters: { type: 'volume', toBase: 1000, label: 'l' },
  cup: { type: 'volume', toBase: 236.588, label: 'cup' },
  cups: { type: 'volume', toBase: 236.588, label: 'cup' },
  tbsp: { type: 'volume', toBase: 14.7868, label: 'tbsp' },
  tablespoon: { type: 'volume', toBase: 14.7868, label: 'tbsp' },
  tablespoons: { type: 'volume', toBase: 14.7868, label: 'tbsp' },
  teaspoon: { type: 'volume', toBase: 4.92892, label: 'tsp' },
  teaspoons: { type: 'volume', toBase: 4.92892, label: 'tsp' },
  tsp: { type: 'volume', toBase: 4.92892, label: 'tsp' },
  floz: { type: 'volume', toBase: 29.5735, label: 'fl oz' },
  'fl oz': { type: 'volume', toBase: 29.5735, label: 'fl oz' },
};

const UNIT_ALIASES = { ...MASS_ALIASES, ...VOLUME_ALIASES };

const SYSTEM_VOLUME = {
  metric: { primary: 'ml', thresholds: { l: 1000 }, cups: 240, tbsp: 15, tsp: 5 },
  uk: { cups: 284, tbsp: 17.758, tsp: 5.919 },
  us: { cups: 236.588, tbsp: 14.7868, tsp: 4.92892 },
};

/**
 * Get current unit system preference from localStorage
 */
export function getUnitSystem() {
  try {
    return localStorage.getItem('unitSystem') || 'metric';
  } catch {
    return 'metric';
  }
}

const normalizeUnit = unit => {
  if (!unit) return null;
  const clean = unit.toString().trim().toLowerCase();
  return UNIT_ALIASES[clean] || null;
};

const convertMass = (grams, system) => {
  if (!Number.isFinite(grams)) return null;
  if (system === 'metric') {
    if (grams >= 1000) return { amount: ROUND(grams / 1000, 2), unit: 'kg' };
    return { amount: ROUND(grams, 1), unit: 'g' };
  }
  const ounces = grams / 28.3495;
  if (ounces >= 16) return { amount: ROUND(ounces / 16, 2), unit: 'lb' };
  return { amount: ROUND(ounces, 2), unit: 'oz' };
};

const convertVolume = (milliliters, system) => {
  if (!Number.isFinite(milliliters)) return null;
  if (system === 'metric') {
    if (milliliters >= 1000) return { amount: ROUND(milliliters / 1000, 2), unit: 'L' };
    return { amount: ROUND(milliliters, 0), unit: 'ml' };
  }
  const defs = SYSTEM_VOLUME[system] || SYSTEM_VOLUME.us;
  const cups = milliliters / defs.cups;
  if (cups >= 1) return { amount: ROUND(cups, 2), unit: 'cups' };
  const tbsp = milliliters / defs.tbsp;
  if (tbsp >= 1) return { amount: ROUND(tbsp, 2), unit: 'tbsp' };
  const tsp = milliliters / defs.tsp;
  return { amount: ROUND(tsp, 2), unit: 'tsp' };
};

/**
 * Convert a structured measurement (amount + unit) into the user's preferred system.
 */
export function convertMeasurement(amount, unit, targetSystem = null) {
  if (amount === null || amount === undefined || !unit) {
    if (import.meta.env.DEV) {
      console.debug('🔄 [UNIT CONVERSION] Skipping conversion - missing data:', { amount, unit });
    }
    return null;
  }

  const details = normalizeUnit(unit);
  if (!details) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ [UNIT CONVERSION] Unknown unit, cannot convert:', { unit, amount });
    }
    return null;
  }

  const system = targetSystem || getUnitSystem();
  const baseValue = amount * details.toBase;

  let result = null;
  if (details.type === 'mass') {
    result = convertMass(baseValue, system);
  } else if (details.type === 'volume') {
    result = convertVolume(baseValue, system);
  }

  if (import.meta.env.DEV && result) {
    console.debug('🔄 [UNIT CONVERSION] Converted measurement:', {
      original: { amount, unit },
      baseValue,
      system,
      converted: result,
      type: details.type,
    });
  }

  return result;
}

/**
 * Convert nutrient amounts (e.g. grams ↔ ounces, mg ↔ g) based on user preference.
 * NOTE: Nutrition labels should ALWAYS use standard units (g, mg, IU, kcal) regardless of system preference.
 * This function only converts for display purposes when appropriate.
 */
export function convertNutrient(amount, unit = 'g', targetSystem = null) {
  if (amount === null || amount === undefined) return null;
  const system = targetSystem || getUnitSystem();
  const cleanUnit = unit?.toLowerCase?.() || unit;

  // Nutrition labels ALWAYS use standard units - never convert to oz
  // Calories, mg, IU should never be converted
  if (cleanUnit === 'kcal' || cleanUnit === 'cal') {
    return { amount: ROUND(amount, 0), unit: 'kcal' };
  }

  if (cleanUnit === 'mg') {
    // Always show in mg for nutrition labels (more readable)
    // Only convert to g if value is very large (>= 2000 mg = 2g)
    if (amount >= 2000) {
      return { amount: ROUND(amount / 1000, 2), unit: 'g' };
    }
    return { amount: ROUND(amount, 0), unit: 'mg' };
  }

  if (cleanUnit === 'iu') {
    // Vitamin A, D always in IU
    return { amount: ROUND(amount, 0), unit: 'IU' };
  }

  if (cleanUnit === 'g') {
    // If value is less than 2g, show in mg for better readability
    // Otherwise show in g
    if (amount < 2 && amount > 0) {
      return { amount: ROUND(amount * 1000, 0), unit: 'mg' };
    }
    // Nutrition labels ALWAYS use grams - never convert to oz
    // This is standard practice for nutrition labels worldwide
    return { amount: ROUND(amount, 1), unit: 'g' };
  }

  return { amount: ROUND(amount, 2), unit: unit || '' };
}

/**
 * Format nutrient text (e.g. "12 g" / "0.4 oz") while keeping numeric value for charts.
 */
export function formatNutrientAmount(nutrient, targetSystem = null) {
  if (!nutrient || nutrient.amount === null || nutrient.amount === undefined) return null;
  const converted = convertNutrient(nutrient.amount, nutrient.unit, targetSystem);
  if (!converted) return null;
  const text = `${converted.amount}${converted.unit ? ` ${converted.unit}` : ''}`.trim();
  return { ...converted, text };
}

/**
 * Get unit equivalent in metric (e.g., "1 cup" → "240 ml", "1 oz" → "28 g")
 * Always shows metric equivalent so users understand what the unit means
 */
export function getUnitEquivalent(amount, unit, targetSystem = null) {
  if (amount === null || amount === undefined || !unit || unit.toLowerCase() === 'unit') {
    return null;
  }

  const details = normalizeUnit(unit);
  if (!details) return null;

  const baseValue = amount * details.toBase;

  // Always show metric equivalent for clarity
  if (details.type === 'volume') {
    // Show in ml or L
    if (baseValue >= 1000) {
      return { amount: ROUND(baseValue / 1000, 2), unit: 'L', system: 'Metric' };
    }
    return { amount: ROUND(baseValue, 0), unit: 'ml', system: 'Metric' };
  }

  if (details.type === 'mass') {
    // Show in g or kg
    if (baseValue >= 1000) {
      return { amount: ROUND(baseValue / 1000, 2), unit: 'kg', system: 'Metric' };
    }
    return { amount: ROUND(baseValue, 1), unit: 'g', system: 'Metric' };
  }

  return null;
}

/**
 * Format ingredient measurements, falling back to original text when needed.
 * Optionally includes unit equivalent in parentheses.
 */
export function formatIngredientQuantity(
  { amount, unit, ingredientName, preparation, fallback, showEquivalent = true },
  targetSystem = null
) {
  if (amount === null || amount === undefined || !unit || unit.toLowerCase() === 'unit') {
    if (import.meta.env.DEV) {
      console.debug('⚠️ [INGREDIENT FORMAT] Missing quantity/unit:', {
        amount,
        unit,
        ingredientName,
        reason: amount === null || amount === undefined ? 'no amount' : "unit is 'unit'",
      });
    }
    return null;
  }

  const converted = convertMeasurement(amount, unit, targetSystem);
  if (!converted) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ [INGREDIENT FORMAT] Conversion failed:', {
        amount,
        unit,
        ingredientName,
        targetSystem: targetSystem || getUnitSystem(),
      });
    }
    return null;
  }

  const parts = [`${converted.amount} ${converted.unit}`.trim()];

  // Add metric equivalent in parentheses to help users understand what the unit means
  // Always show equivalent for non-metric units so users know what "1 cup" or "1 oz" means
  if (showEquivalent) {
    const originalUnitLower = (unit || '').toLowerCase();
    const convertedUnitLower = converted.unit.toLowerCase();
    const isOriginalMetric = [
      'ml',
      'l',
      'g',
      'kg',
      'milliliter',
      'milliliters',
      'liter',
      'liters',
      'gram',
      'grams',
      'kilogram',
      'kilograms',
    ].includes(originalUnitLower);
    const isConvertedMetric = [
      'ml',
      'l',
      'g',
      'kg',
      'milliliter',
      'milliliters',
      'liter',
      'liters',
      'gram',
      'grams',
      'kilogram',
      'kilograms',
    ].includes(convertedUnitLower);

    // Show metric equivalent if:
    // 1. Original unit was not metric (cup, oz, lb, etc.) - always show what it means
    // 2. AND converted unit is also not metric (avoid "240 ml (240 ml)")
    // This helps users understand: "1 cup = 240 ml", "1 oz = 28 g", etc.
    if (!isOriginalMetric && !isConvertedMetric) {
      const equivalent = getUnitEquivalent(amount, unit, targetSystem);
      if (equivalent) {
        const equivText = `${equivalent.amount} ${equivalent.unit}`;
        parts[0] = `${parts[0]} (≈ ${equivText})`;
      }
    }
  }

  if (ingredientName) parts.push(ingredientName);
  if (preparation) parts.push(preparation);

  let text = parts.join(' ').replace(/\s+/g, ' ').trim();
  // Only add fallback if conversion seems incomplete or if explicitly needed
  // Don't add fallback if it contains malformed numbers (like "0.2.50")
  if (fallback && !text.toLowerCase().includes(fallback.toLowerCase())) {
    // Check if fallback looks malformed (has patterns like "0.2.50" or multiple decimals)
    const hasMalformedNumber =
      /0\.\d+\.\d+/.test(fallback) || (fallback.match(/\./g) || []).length > 1;
    if (!hasMalformedNumber) {
      text += ` (${fallback})`;
    }
  }

  if (import.meta.env.DEV) {
    console.debug('✅ [INGREDIENT FORMAT] Formatted ingredient:', {
      input: { amount, unit, ingredientName, preparation },
      converted,
      finalText: text,
      targetSystem: targetSystem || getUnitSystem(),
    });
  }

  return text;
}

/**
 * Convert raw ingredient text (no structured data) as a fallback.
 */
export function convertIngredient(ingredientText, targetSystem = null) {
  if (!ingredientText) return ingredientText;
  const system = targetSystem || getUnitSystem();
  const unitPattern =
    /(\d+(?:\.\d+)?)\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters)/gi;

  return ingredientText.replace(unitPattern, (match, amountStr, unit) => {
    const amount = parseFloat(amountStr);
    if (!Number.isFinite(amount)) return match;

    const converted = convertMeasurement(amount, unit, system);
    if (!converted) return match;
    const pretty =
      converted.amount % 1 === 0
        ? `${converted.amount} ${converted.unit}`
        : `${ROUND(converted.amount, converted.amount >= 10 ? 1 : 2)} ${converted.unit}`;
    return pretty.trim();
  });
}

export { UNIT_SYSTEMS };
