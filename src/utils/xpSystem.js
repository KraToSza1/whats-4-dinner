/**
 * XP & Leveling System
 * Tracks user experience points and levels
 */

const XP_STORAGE_KEY = 'user:xp:v1';
const XP_HISTORY_KEY = 'user:xp:history:v1';

export const XP_VALUES = {
  VIEW_RECIPE: 5,
  COOK_RECIPE: 25,
  RATE_RECIPE: 10,
  COMPLETE_CHALLENGE: 50,
  SHARE_RECIPE: 15,
  STREAK_BONUS_7: 100,
  STREAK_BONUS_30: 250,
  LEVEL_UP_BONUS: 50,
};

/**
 * Get current XP
 */
export function getCurrentXP() {
  try {
    return parseInt(localStorage.getItem(XP_STORAGE_KEY) || '0');
  } catch {
    return 0;
  }
}

/**
 * Calculate level from XP
 * Formula: level = floor(sqrt(xp / 100)) + 1
 */
export function calculateLevel(xp) {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Get XP required for a specific level
 */
export function getXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentXP) {
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = currentLevel + 1;
  return getXPForLevel(nextLevel);
}

/**
 * Get progress to next level (0-100)
 */
export function getLevelProgress(currentXP) {
  const currentLevel = calculateLevel(currentXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;

  return Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);
}

/**
 * Add XP and return level up status
 */
export function addXP(amount, reason = '') {
  try {
    const currentXP = getCurrentXP();
    const oldLevel = calculateLevel(currentXP);

    // Apply multiplier if premium
    const multiplier = canUseXPMultiplier() ? 1.5 : 1;
    const finalAmount = Math.floor(amount * multiplier);

    const newXP = currentXP + finalAmount;
    const newLevel = calculateLevel(newXP);

    localStorage.setItem(XP_STORAGE_KEY, newXP.toString());

    // Track XP history
    const history = JSON.parse(localStorage.getItem(XP_HISTORY_KEY) || '[]');
    history.push({
      amount: finalAmount,
      reason,
      timestamp: new Date().toISOString(),
      level: newLevel,
    });
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
    localStorage.setItem(XP_HISTORY_KEY, JSON.stringify(history));

    const leveledUp = newLevel > oldLevel;

    return {
      newXP,
      oldLevel,
      newLevel,
      leveledUp,
      amountAdded: finalAmount,
      multiplier: multiplier > 1 ? multiplier : null,
    };
  } catch (error) {
    console.error('Error adding XP:', error);
    return {
      newXP: getCurrentXP(),
      oldLevel: calculateLevel(getCurrentXP()),
      newLevel: calculateLevel(getCurrentXP()),
      leveledUp: false,
      amountAdded: 0,
    };
  }
}

/**
 * Get current level
 */
export function getCurrentLevel() {
  return calculateLevel(getCurrentXP());
}

/**
 * Get level title/name
 */
export function getLevelTitle(level) {
  const titles = {
    1: 'Beginner Cook',
    5: 'Home Chef',
    10: 'Rising Star',
    15: 'Experienced Cook',
    20: 'Skilled Chef',
    25: 'Expert Chef',
    30: 'Master Chef',
    40: 'Culinary Artist',
    50: 'Culinary Master',
    60: 'Grand Master',
    75: 'Legendary Chef',
    100: 'Culinary God',
  };

  // Find the highest title the user has achieved
  const achievedTitles = Object.keys(titles)
    .map(Number)
    .filter(l => level >= l)
    .sort((a, b) => b - a);

  return titles[achievedTitles[0]] || 'Beginner Cook';
}

/**
 * Get level color based on level
 */
export function getLevelColor(level) {
  if (level < 5) return 'text-slate-400';
  if (level < 10) return 'text-green-400';
  if (level < 20) return 'text-blue-400';
  if (level < 30) return 'text-purple-400';
  if (level < 50) return 'text-pink-400';
  return 'text-yellow-400';
}

/**
 * Get level badge emoji
 */
export function getLevelBadge(level) {
  if (level < 5) return '🌱';
  if (level < 10) return '⭐';
  if (level < 20) return '🌟';
  if (level < 30) return '💫';
  if (level < 50) return '👑';
  return '🏆';
}

/**
 * Check if user can use XP multiplier (premium feature)
 */
export function canUseXPMultiplier() {
  try {
    const { hasFeature } = require('./subscription');
    return hasFeature('xp_multiplier');
  } catch {
    return false;
  }
}

/**
 * Get XP history
 */
export function getXPHistory(limit = 20) {
  try {
    const history = JSON.parse(localStorage.getItem(XP_HISTORY_KEY) || '[]');
    return history.slice(-limit).reverse();
  } catch {
    return [];
  }
}

/**
 * Get total XP earned today
 */
export function getTodayXP() {
  try {
    const history = getXPHistory(1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return history
      .filter(entry => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      })
      .reduce((sum, entry) => sum + entry.amount, 0);
  } catch {
    return 0;
  }
}

/**
 * Get level milestones for display
 */
export function getLevelMilestones() {
  return [5, 10, 20, 30, 50];
}
