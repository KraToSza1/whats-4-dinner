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
 * Uses realistic food cost data based on actual grocery prices and cost of living
 * Values are in USD and will be converted to local currency by the caller
 */
export function getRecommendedBudget(countryCode, familySize = 1) {
  // Realistic weekly food budgets per person in USD (based on actual grocery costs)
  // These represent minimum viable budgets for healthy eating, not bare survival
  const WEEKLY_FOOD_BUDGETS_USD = {
    // North America
    US: 80, // $80/week = ~$320/month per person (realistic US grocery budget)
    CA: 85, // Canada slightly higher
    MX: 35, // Mexico - lower cost but still realistic
    
    // Europe - Higher cost countries
    CH: 120, // Switzerland - very expensive
    NO: 95,  // Norway
    IS: 100, // Iceland
    DK: 90,  // Denmark
    SE: 85,  // Sweden
    IE: 75,  // Ireland
    NL: 70,  // Netherlands
    AT: 70,  // Austria
    BE: 70,  // Belgium
    FI: 70,  // Finland
    FR: 65,  // France
    DE: 65,  // Germany
    IT: 60,  // Italy
    GB: 70,  // UK
    ES: 55,  // Spain
    PT: 50,  // Portugal
    GR: 50,  // Greece
    PL: 45,  // Poland
    CZ: 45,  // Czech Republic
    HU: 40,  // Hungary
    
    // Asia
    SG: 90,  // Singapore - very expensive
    JP: 75,  // Japan
    HK: 85,  // Hong Kong
    KR: 70,  // South Korea
    TW: 60,  // Taiwan
    MY: 40,  // Malaysia
    TH: 35,  // Thailand
    CN: 40,  // China
    PH: 30,  // Philippines
    ID: 30,  // Indonesia
    VN: 30,  // Vietnam
    IN: 25,  // India
    
    // Middle East
    IL: 80,  // Israel
    AE: 70,  // UAE
    SA: 50,  // Saudi Arabia
    TR: 40,  // Turkey
    
    // Americas
    BR: 35,  // Brazil
    AR: 30,  // Argentina
    CL: 50,  // Chile
    
    // Oceania
    AU: 85,  // Australia
    NZ: 80,  // New Zealand
    
    // Africa - Realistic budgets based on actual food costs
    ZA: 50,  // South Africa: R500-R1000/week = ~$27-$54 USD (using $50 as realistic middle)
    EG: 30,  // Egypt
    MA: 35,  // Morocco
    NG: 30,  // Nigeria
    KE: 30,  // Kenya
    
    // Default fallback
    default: 60, // Conservative default
  };
  
  // Get base budget for country
  const baseBudgetPerPerson = WEEKLY_FOOD_BUDGETS_USD[countryCode] || WEEKLY_FOOD_BUDGETS_USD.default;
  
  // Calculate for family size (with slight discount for larger families due to bulk buying)
  let totalBudget;
  if (familySize === 1) {
    totalBudget = baseBudgetPerPerson;
  } else if (familySize === 2) {
    totalBudget = baseBudgetPerPerson * 1.8; // 10% discount per person
  } else if (familySize === 3) {
    totalBudget = baseBudgetPerPerson * 2.6; // 13% discount per person
  } else if (familySize === 4) {
    totalBudget = baseBudgetPerPerson * 3.4; // 15% discount per person
  } else {
    // For larger families, use 3.4 + 0.8 per additional person
    totalBudget = baseBudgetPerPerson * (3.4 + (familySize - 4) * 0.8);
  }
  
  return Math.round(totalBudget * 100) / 100;
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
