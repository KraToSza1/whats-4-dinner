/**
 * Daily Challenges System
 * Provides daily cooking challenges for users
 */

const CHALLENGES_STORAGE_KEY = 'challenges:completed:v1';
const DAILY_CHALLENGE_KEY = 'challenges:daily:v1';

export const CHALLENGE_TYPES = {
  FAST_COOK: 'fast_cook',
  NEW_CUISINE: 'new_cuisine',
  FEW_INGREDIENTS: 'few_ingredients',
  VEGETARIAN: 'vegetarian',
  MEAL_PREP: 'meal_prep',
  HEALTHY: 'healthy',
  BUDGET: 'budget',
  FAMILY_FRIENDLY: 'family_friendly',
};

export const CHALLENGES = {
  [CHALLENGE_TYPES.FAST_COOK]: {
    id: CHALLENGE_TYPES.FAST_COOK,
    name: 'Speed Cooking',
    emoji: '⚡',
    description: 'Cook a recipe in under 30 minutes',
    xpReward: 50,
    check: recipe => {
      const time = parseInt(recipe.totalTime || recipe.cookTime || 0);
      return time > 0 && time <= 30;
    },
  },
  [CHALLENGE_TYPES.NEW_CUISINE]: {
    id: CHALLENGE_TYPES.NEW_CUISINE,
    name: 'Cuisine Explorer',
    emoji: '🌍',
    description: "Try a cuisine you've never cooked before",
    xpReward: 75,
    check: (recipe, userStats) => {
      const cuisine = recipe.cuisine || recipe.cuisineType || '';
      if (!cuisine) return false;
      const triedCuisines = userStats?.cuisinesTried || [];
      return !triedCuisines.includes(cuisine.toLowerCase());
    },
  },
  [CHALLENGE_TYPES.FEW_INGREDIENTS]: {
    id: CHALLENGE_TYPES.FEW_INGREDIENTS,
    name: 'Minimalist Chef',
    emoji: '🎯',
    description: 'Cook a recipe with 5 ingredients or less',
    xpReward: 60,
    check: recipe => {
      const ingredients = recipe.ingredients || [];
      return ingredients.length <= 5;
    },
  },
  [CHALLENGE_TYPES.VEGETARIAN]: {
    id: CHALLENGE_TYPES.VEGETARIAN,
    name: 'Plant Power',
    emoji: '🥗',
    description: 'Cook a vegetarian recipe',
    xpReward: 40,
    check: recipe => {
      const dietLabels = recipe.dietLabels || [];
      const tags = recipe.tags || [];
      return (
        dietLabels.includes('Vegetarian') ||
        dietLabels.includes('Vegan') ||
        tags.some(tag => tag.toLowerCase().includes('vegetarian')) ||
        tags.some(tag => tag.toLowerCase().includes('vegan'))
      );
    },
  },
  [CHALLENGE_TYPES.MEAL_PREP]: {
    id: CHALLENGE_TYPES.MEAL_PREP,
    name: 'Meal Prep Master',
    emoji: '📦',
    description: 'Add 3+ meals to your meal plan',
    xpReward: 80,
    check: mealPlan => {
      if (!mealPlan) return false;
      let mealCount = 0;
      Object.values(mealPlan).forEach(day => {
        if (day.breakfast) mealCount++;
        if (day.lunch) mealCount++;
        if (day.dinner) mealCount++;
        if (day.morning_snack) mealCount++;
        if (day.afternoon_snack) mealCount++;
        if (day.evening_snack) mealCount++;
      });
      return mealCount >= 3;
    },
  },
  [CHALLENGE_TYPES.HEALTHY]: {
    id: CHALLENGE_TYPES.HEALTHY,
    name: 'Healthy Choice',
    emoji: '💚',
    description: 'Cook a recipe under 400 calories',
    xpReward: 45,
    check: recipe => {
      const calories = recipe.calories || recipe.nutrition?.calories || 0;
      return calories > 0 && calories <= 400;
    },
  },
  [CHALLENGE_TYPES.BUDGET]: {
    id: CHALLENGE_TYPES.BUDGET,
    name: 'Budget Friendly',
    emoji: '💰',
    description: 'Cook a recipe estimated under $5',
    xpReward: 55,
    check: recipe => {
      // Estimate based on ingredient count (rough estimate)
      const ingredients = recipe.ingredients || [];
      const estimatedCost = ingredients.length * 0.75; // Rough estimate
      return estimatedCost <= 5;
    },
  },
  [CHALLENGE_TYPES.FAMILY_FRIENDLY]: {
    id: CHALLENGE_TYPES.FAMILY_FRIENDLY,
    name: 'Family Favorite',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Cook a recipe that serves 4+ people',
    xpReward: 50,
    check: recipe => {
      const servings = recipe.servings || recipe.yield || 0;
      return servings >= 4;
    },
  },
};

/**
 * Get today's date key
 */
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
}

/**
 * Get daily challenges for today
 */
export function getDailyChallenges() {
  try {
    const todayKey = getTodayKey();
    const stored = JSON.parse(localStorage.getItem(DAILY_CHALLENGE_KEY) || '{}');

    if (stored.date === todayKey && stored.challenges) {
      return stored.challenges;
    }

    // Generate new challenges for today
    const challengeTypes = Object.keys(CHALLENGES);
    const numChallenges = canUseUnlimitedChallenges() ? 3 : 1;

    // Shuffle and pick random challenges
    const shuffled = [...challengeTypes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numChallenges).map(id => ({
      ...CHALLENGES[id],
      completed: false,
    }));

    // Store for today
    localStorage.setItem(
      DAILY_CHALLENGE_KEY,
      JSON.stringify({
        date: todayKey,
        challenges: selected,
      })
    );

    return selected;
  } catch (error) {
    console.error('Error getting daily challenges:', error);
    return [];
  }
}

/**
 * Check if challenge is completed
 */
export function isChallengeCompleted(challengeId, dateKey = null) {
  try {
    const completed = JSON.parse(localStorage.getItem(CHALLENGES_STORAGE_KEY) || '[]');
    const key = dateKey || getTodayKey();
    return completed.includes(`${key}:${challengeId}`);
  } catch {
    return false;
  }
}

/**
 * Complete a challenge
 */
export function completeChallenge(challengeId) {
  try {
    const completed = JSON.parse(localStorage.getItem(CHALLENGES_STORAGE_KEY) || '[]');
    const key = getTodayKey();
    const challengeKey = `${key}:${challengeId}`;

    if (completed.includes(challengeKey)) {
      return false; // Already completed
    }

    completed.push(challengeKey);
    localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(completed));

    // Update challenge status in daily challenges
    const stored = JSON.parse(localStorage.getItem(DAILY_CHALLENGE_KEY) || '{}');
    if (stored.challenges) {
      stored.challenges = stored.challenges.map(ch =>
        ch.id === challengeId ? { ...ch, completed: true } : ch
      );
      localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(stored));
    }

    return true;
  } catch (error) {
    console.error('Error completing challenge:', error);
    return false;
  }
}

/**
 * Get total challenges completed
 */
export function getTotalChallengesCompleted() {
  try {
    const completed = JSON.parse(localStorage.getItem(CHALLENGES_STORAGE_KEY) || '[]');
    return completed.length;
  } catch {
    return 0;
  }
}

/**
 * Check if user can use unlimited challenges (premium feature)
 */
export function canUseUnlimitedChallenges() {
  try {
    const { hasFeature } = require('./subscription');
    return hasFeature('unlimited_challenges');
  } catch {
    return false;
  }
}

/**
 * Get challenge progress for today
 */
export function getTodayChallengeProgress() {
  const challenges = getDailyChallenges();
  const completed = challenges.filter(c => c.completed).length;
  return {
    total: challenges.length,
    completed,
    progress: challenges.length > 0 ? (completed / challenges.length) * 100 : 0,
  };
}
