/**
 * Achievement Badges System
 * Tracks and awards badges for various achievements
 */

const BADGES_STORAGE_KEY = 'badges:unlocked:v1';

export const BADGES = {
  FIRST_RECIPE: {
    id: 'first_recipe',
    name: 'First Timer',
    emoji: '🥇',
    description: 'Cooked your first recipe',
    rarity: 'common',
    check: stats => stats.recipesCooked >= 1,
  },
  RECIPES_10: {
    id: 'recipes_10',
    name: 'Getting Started',
    emoji: '🍳',
    description: 'Cooked 10 recipes',
    rarity: 'common',
    check: stats => stats.recipesCooked >= 10,
  },
  RECIPES_50: {
    id: 'recipes_50',
    name: 'Cooking Enthusiast',
    emoji: '👨‍🍳',
    description: 'Cooked 50 recipes',
    rarity: 'rare',
    check: stats => stats.recipesCooked >= 50,
  },
  RECIPES_100: {
    id: 'recipes_100',
    name: 'Master Chef',
    emoji: '👑',
    description: 'Cooked 100 recipes',
    rarity: 'legendary',
    check: stats => stats.recipesCooked >= 100,
  },
  STREAK_3: {
    id: 'streak_3',
    name: 'Getting Hot',
    emoji: '🔥',
    description: '3-day cooking streak',
    rarity: 'common',
    check: stats => stats.currentStreak >= 3,
  },
  STREAK_7: {
    id: 'streak_7',
    name: 'On Fire',
    emoji: '🔥',
    description: '7-day cooking streak',
    rarity: 'rare',
    check: stats => stats.currentStreak >= 7,
  },
  STREAK_14: {
    id: 'streak_14',
    name: 'Two Week Warrior',
    emoji: '⚡',
    description: '14-day cooking streak',
    rarity: 'rare',
    check: stats => stats.currentStreak >= 14,
  },
  STREAK_30: {
    id: 'streak_30',
    name: 'Unstoppable',
    emoji: '⚡',
    description: '30-day cooking streak',
    rarity: 'epic',
    check: stats => stats.currentStreak >= 30,
  },
  STREAK_60: {
    id: 'streak_60',
    name: 'Legendary',
    emoji: '👑',
    description: '60-day cooking streak',
    rarity: 'legendary',
    check: stats => stats.currentStreak >= 60,
  },
  STREAK_100: {
    id: 'streak_100',
    name: 'Master of Consistency',
    emoji: '🏆',
    description: '100-day cooking streak',
    rarity: 'legendary',
    check: stats => stats.currentStreak >= 100,
  },
  CUISINES_5: {
    id: 'cuisines_5',
    name: 'Cuisine Explorer',
    emoji: '🌍',
    description: 'Tried 5 different cuisines',
    rarity: 'common',
    check: stats => stats.cuisinesTried >= 5,
  },
  CUISINES_10: {
    id: 'cuisines_10',
    name: 'World Traveler',
    emoji: '🌎',
    description: 'Tried 10 different cuisines',
    rarity: 'rare',
    check: stats => stats.cuisinesTried >= 10,
  },
  FAST_COOK_10: {
    id: 'fast_cook_10',
    name: 'Speed Demon',
    emoji: '⚡',
    description: 'Cooked 10 recipes under 30 minutes',
    rarity: 'rare',
    check: stats => stats.fastRecipesCooked >= 10,
  },
  MEAL_PREP_10: {
    id: 'meal_prep_10',
    name: 'Meal Prep Starter',
    emoji: '📦',
    description: 'Prepped 10 meals',
    rarity: 'common',
    check: stats => stats.mealsPrepped >= 10,
  },
  MEAL_PREP_50: {
    id: 'meal_prep_50',
    name: 'Meal Prep Master',
    emoji: '📦',
    description: 'Prepped 50 meals',
    rarity: 'epic',
    check: stats => stats.mealsPrepped >= 50,
  },
  LEVEL_10: {
    id: 'level_10',
    name: 'Rising Star',
    emoji: '⭐',
    description: 'Reached level 10',
    rarity: 'rare',
    check: stats => stats.level >= 10,
  },
  LEVEL_25: {
    id: 'level_25',
    name: 'Experienced Chef',
    emoji: '🌟',
    description: 'Reached level 25',
    rarity: 'epic',
    check: stats => stats.level >= 25,
  },
  LEVEL_50: {
    id: 'level_50',
    name: 'Culinary Master',
    emoji: '💫',
    description: 'Reached level 50',
    rarity: 'legendary',
    check: stats => stats.level >= 50,
  },
  CHALLENGES_10: {
    id: 'challenges_10',
    name: 'Challenge Seeker',
    emoji: '🎯',
    description: 'Completed 10 challenges',
    rarity: 'rare',
    check: stats => stats.challengesCompleted >= 10,
  },
  CHALLENGES_50: {
    id: 'challenges_50',
    name: 'Challenge Master',
    emoji: '🏅',
    description: 'Completed 50 challenges',
    rarity: 'epic',
    check: stats => stats.challengesCompleted >= 50,
  },
};

/**
 * Get all unlocked badges
 */
export function getUnlockedBadges() {
  try {
    return JSON.parse(localStorage.getItem(BADGES_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Check if badge is unlocked
 */
export function isBadgeUnlocked(badgeId) {
  const unlocked = getUnlockedBadges();
  return unlocked.includes(badgeId);
}

/**
 * Unlock a badge
 */
export function unlockBadge(badgeId) {
  try {
    const unlocked = getUnlockedBadges();
    if (!unlocked.includes(badgeId)) {
      unlocked.push(badgeId);
      localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(unlocked));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unlocking badge:', error);
    return false;
  }
}

/**
 * Check and unlock badges based on current stats
 */
export function checkBadges(stats) {
  const newBadges = [];

  Object.values(BADGES).forEach(badge => {
    if (!isBadgeUnlocked(badge.id) && badge.check(stats)) {
      if (unlockBadge(badge.id)) {
        newBadges.push(badge);
      }
    }
  });

  return newBadges;
}

/**
 * Get badge by ID
 */
export function getBadge(badgeId) {
  return Object.values(BADGES).find(b => b.id === badgeId);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity) {
  return Object.values(BADGES).filter(b => b.rarity === rarity);
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity) {
  const colors = {
    common: 'text-slate-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  };
  return colors[rarity] || colors.common;
}

/**
 * Get rarity background gradient
 */
export function getRarityGradient(rarity) {
  const gradients = {
    common: 'from-slate-500 to-slate-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-yellow-400 via-orange-500 to-yellow-600',
  };
  return gradients[rarity] || gradients.common;
}
