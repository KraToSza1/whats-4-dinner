/**
 * Regional Pricing Database
 * Provides country-specific ingredient prices and cost of living adjustments
 * Prices are in local currency per standard unit (per lb/kg for proteins, per lb for produce, etc.)
 */

// Cost of Living Index (relative to US = 100)
// Higher = more expensive, Lower = cheaper
const COST_OF_LIVING_INDEX = {
  US: 100, // Base
  // Europe
  CH: 122, // Switzerland - most expensive
  NO: 101,
  IS: 100,
  DK: 99,
  IE: 88,
  NL: 87,
  AT: 86,
  SE: 85,
  BE: 84,
  FI: 83,
  FR: 82,
  DE: 81,
  IT: 80,
  GB: 79,
  ES: 73,
  PT: 65,
  GR: 64,
  PL: 58,
  CZ: 57,
  HU: 55,
  // Asia
  SG: 100, // Singapore - very expensive
  JP: 95,
  HK: 94,
  KR: 88,
  TW: 75,
  MY: 48,
  TH: 45,
  CN: 44,
  PH: 38,
  ID: 37,
  VN: 36,
  IN: 31,
  // Middle East
  IL: 91,
  AE: 85,
  SA: 62,
  TR: 48,
  // Americas
  CA: 95,
  AU: 92,
  NZ: 88,
  BR: 47,
  MX: 42,
  AR: 38,
  CL: 52,
  // Africa
  ZA: 45,
  EG: 35,
  MA: 40,
  NG: 32,
  KE: 34,
};

// Regional price multipliers (relative to US prices)
// Accounts for local market prices, not just exchange rates
const REGIONAL_PRICE_MULTIPLIERS = {
  // High cost countries (prices higher than exchange rate suggests)
  CH: 1.4, // Switzerland
  NO: 1.3,
  IS: 1.3,
  DK: 1.25,
  SG: 1.35,
  JP: 1.2,
  AU: 1.15,
  NZ: 1.1,
  CA: 1.05,
  IE: 1.0,
  GB: 0.95,
  // Medium cost countries
  DE: 0.9,
  FR: 0.88,
  IT: 0.85,
  ES: 0.75,
  KR: 0.85,
  // Lower cost countries (prices lower than exchange rate suggests)
  BR: 0.6,
  MX: 0.55,
  IN: 0.4,
  TH: 0.5,
  PH: 0.45,
  VN: 0.4,
  ID: 0.45,
  // Default
  default: 1.0,
};

// Country-specific ingredient price adjustments
// These override base prices for specific ingredients in specific countries
const COUNTRY_INGREDIENT_ADJUSTMENTS = {
  // India - rice and spices are much cheaper
  IN: {
    rice: 0.2,
    'curry powder': 0.3,
    turmeric: 0.4,
    'coconut milk': 0.5,
    lentils: 0.3,
    chickpeas: 0.3,
  },
  // Thailand - rice, fish, and vegetables are cheaper
  TH: {
    rice: 0.3,
    fish: 2.5,
    'coconut milk': 0.6,
    'fish sauce': 0.8,
    vegetables: 0.6,
  },
  // Brazil - beans and rice are staples (cheaper)
  BR: {
    beans: 0.4,
    rice: 0.3,
    'cassava flour': 0.5,
  },
  // Mexico - beans, corn, and peppers are cheaper
  MX: {
    beans: 0.4,
    corn: 0.3,
    peppers: 0.5,
    'corn tortillas': 0.4,
  },
  // Japan - fish is cheaper, beef is more expensive
  JP: {
    fish: 3.0,
    beef: 6.0,
    rice: 0.8,
    'soy sauce': 0.6,
  },
  // Mediterranean countries - olive oil and vegetables are cheaper
  IT: {
    'olive oil': 2.0,
    tomatoes: 1.0,
    pasta: 0.6,
  },
  ES: {
    'olive oil': 2.0,
    tomatoes: 0.9,
    saffron: 8.0, // Still expensive but more accessible
  },
  GR: {
    'olive oil': 1.8,
    'feta cheese': 2.5,
    vegetables: 0.7,
  },
};

/**
 * Get cost of living index for a country
 */
export function getCostOfLivingIndex(countryCode) {
  return COST_OF_LIVING_INDEX[countryCode] || COST_OF_LIVING_INDEX.default || 100;
}

/**
 * Get regional price multiplier for a country
 */
export function getRegionalPriceMultiplier(countryCode) {
  return REGIONAL_PRICE_MULTIPLIERS[countryCode] || REGIONAL_PRICE_MULTIPLIERS.default || 1.0;
}

/**
 * Get country-specific ingredient price adjustment
 */
export function getCountryIngredientAdjustment(countryCode, ingredientName) {
  const adjustments = COUNTRY_INGREDIENT_ADJUSTMENTS[countryCode];
  if (!adjustments) return null;

  const lowerName = ingredientName.toLowerCase();
  for (const [key, price] of Object.entries(adjustments)) {
    if (lowerName.includes(key.toLowerCase())) {
      return price;
    }
  }
  return null;
}

/**
 * Adjust USD price to regional price based on country
 */
export function adjustPriceForRegion(usdPrice, countryCode) {
  const multiplier = getRegionalPriceMultiplier(countryCode);
  return usdPrice * multiplier;
}

/**
 * Get recommended weekly budget based on country and family size
 */
export function getRecommendedBudget(countryCode, familySize = 1) {
  const colIndex = getCostOfLivingIndex(countryCode);
  const baseBudget = 100; // Base weekly budget for 1 person in US
  const adjustedBudget = (baseBudget * colIndex) / 100;
  return Math.round(adjustedBudget * familySize * 100) / 100;
}

/**
 * Get budget category recommendations by country
 */
export function getBudgetCategoryRecommendations(countryCode) {
  const recommendations = {
    // High cost countries - focus on meal prep and bulk buying
    CH: {
      tip: 'Shop at discount stores and buy in bulk to save money',
      focus: ['mealPrep', 'bulkBuying'],
    },
    NO: {
      tip: 'Consider seasonal produce and local markets',
      focus: ['seasonal', 'localMarkets'],
    },
    // Lower cost countries - can afford more variety
    IN: {
      tip: 'Take advantage of local staples like rice, lentils, and vegetables',
      focus: ['localStaples', 'vegetarian'],
    },
    TH: {
      tip: 'Fresh seafood and local vegetables are great value',
      focus: ['seafood', 'localProduce'],
    },
    // Default
    default: {
      tip: 'Plan meals ahead and buy ingredients in bulk when possible',
      focus: ['mealPlanning', 'bulkBuying'],
    },
  };

  return recommendations[countryCode] || recommendations.default;
}
