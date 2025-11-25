/**
 * Family Calculations Utility
 * Calculates total servings needed based on family members and their portion sizes
 */

const STORAGE_KEY = 'family:members:v1';

// Portion size multipliers (same as in FamilyPlan.jsx)
const PORTION_MULTIPLIERS = {
  baby: 0.25,
  toddler: 0.5,
  child: 0.75,
  teen: 1.25,
  small: 0.75,
  normal: 1.0,
  senior: 0.85,
  large: 1.5,
  xlarge: 2.0,
  adult: 1.0,
};

/**
 * Get all family members from localStorage
 */
export function getFamilyMembers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Calculate total servings needed for a recipe based on family members
 * @param {number} baseServings - Base recipe servings (e.g., recipe serves 4)
 * @returns {number} Total servings needed (rounded up)
 */
export function calculateTotalServingsNeeded(baseServings = 4) {
  const members = getFamilyMembers();

  if (members.length === 0) {
    return baseServings; // Default if no family members
  }

  // Calculate total multiplier from all family members
  const totalMultiplier = members.reduce((sum, member) => {
    const multiplier = PORTION_MULTIPLIERS[member.portionSize] || 1.0;
    return sum + multiplier;
  }, 0);

  // Multiply base servings by total multiplier, then round up to ensure we have enough
  // Example: baseServings=4, totalMultiplier=3.5 → 4 * 3.5 = 14 servings
  return Math.ceil(baseServings * totalMultiplier);
}

/**
 * Get portion multiplier for a specific portion size
 * @param {string} portionSize - Portion size value (e.g., "baby", "normal", "large")
 * @returns {number} Multiplier (e.g., 0.25, 1.0, 1.5)
 */
export function getPortionMultiplier(portionSize) {
  return PORTION_MULTIPLIERS[portionSize] || 1.0;
}

/**
 * Get total servings for a specific meal (e.g., dinner for all family)
 * @param {string} mealType - Optional meal type filter (currently unused but kept for future use)
 * @param {number} baseServings - Base servings per recipe (default 4)
 * @returns {number} Total servings needed
 */
export function getTotalServingsForMeal(mealType = null, baseServings = 4) {
  const members = getFamilyMembers();

  if (members.length === 0) {
    return baseServings; // Default
  }

  // Calculate total multiplier
  const totalMultiplier = members.reduce((sum, member) => {
    const multiplier = PORTION_MULTIPLIERS[member.portionSize] || 1.0;
    return sum + multiplier;
  }, 0);

  // Multiply base servings by total multiplier, then round up
  return Math.ceil(baseServings * totalMultiplier);
}

/**
 * Get family summary for display
 * @returns {object} Summary with total members, servings needed, etc.
 */
export function getFamilySummary() {
  const members = getFamilyMembers();

  return {
    totalMembers: members.length,
    totalServingsNeeded: getTotalServingsForMeal(null, 4), // Default base servings of 4
    members: members.map(m => ({
      name: m.name,
      role: m.role,
      portionSize: m.portionSize,
      multiplier: getPortionMultiplier(m.portionSize),
    })),
  };
}
