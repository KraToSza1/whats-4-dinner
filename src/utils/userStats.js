/**
 * User Stats Tracking System
 * Tracks various user statistics for badges and achievements
 */

/**
 * Track recipe view
 */
export function trackRecipeView(recipe) {
  try {
    // Update streak
    const { updateStreak, isStreakUpdatedToday } = require('./streaks');
    if (!isStreakUpdatedToday()) {
      updateStreak();
    }

    // Add XP
    const { addXP, XP_VALUES } = require('./xpSystem');
    const xpResult = addXP(XP_VALUES.VIEW_RECIPE, 'Viewed recipe');

    // Track cuisine
    if (recipe.cuisine || recipe.cuisineType) {
      const cuisine = (recipe.cuisine || recipe.cuisineType).toLowerCase();
      const cuisinesTried = JSON.parse(localStorage.getItem('stats:cuisinesTried:v1') || '[]');
      if (!cuisinesTried.includes(cuisine)) {
        cuisinesTried.push(cuisine);
        localStorage.setItem('stats:cuisinesTried:v1', JSON.stringify(cuisinesTried));
      }
    }

    return xpResult;
  } catch (error) {
    console.error('Error tracking recipe view:', error);
  }
}

/**
 * Track recipe cook
 */
export function trackRecipeCook(recipe) {
  try {
    // Update streak
    const { updateStreak, isStreakUpdatedToday } = require('./streaks');
    if (!isStreakUpdatedToday()) {
      updateStreak();
    }

    // Add XP
    const { addXP, XP_VALUES } = require('./xpSystem');
    const xpResult = addXP(XP_VALUES.COOK_RECIPE, 'Cooked recipe');

    // Track recipes cooked
    const recipesCooked = parseInt(localStorage.getItem('stats:recipesCooked:v1') || '0');
    localStorage.setItem('stats:recipesCooked:v1', (recipesCooked + 1).toString());

    // Track fast recipes
    const time = parseInt(recipe.totalTime || recipe.cookTime || 0);
    if (time > 0 && time <= 30) {
      const fastRecipes = parseInt(localStorage.getItem('stats:fastRecipesCooked:v1') || '0');
      localStorage.setItem('stats:fastRecipesCooked:v1', (fastRecipes + 1).toString());
    }

    // Check badges
    const { checkBadges } = require('./badges');
    const stats = getUserStats();
    const newBadges = checkBadges(stats);

    // Check streak milestones
    const { getCurrentStreak, getStreakMilestone } = require('./streaks');
    const streak = getCurrentStreak();
    const milestone = getStreakMilestone(streak);
    if (milestone) {
      const { unlockBadge } = require('./badges');
      unlockBadge(milestone.badge);
    }

    return { xpResult, newBadges, leveledUp: xpResult.leveledUp };
  } catch (error) {
    console.error('Error tracking recipe cook:', error);
  }
}

/**
 * Track recipe rating
 */
export function trackRecipeRating(recipe, rating) {
  try {
    const { addXP, XP_VALUES } = require('./xpSystem');
    return addXP(XP_VALUES.RATE_RECIPE, `Rated recipe ${rating} stars`);
  } catch (error) {
    console.error('Error tracking recipe rating:', error);
  }
}

/**
 * Track meal prep
 */
export function trackMealPrep(mealCount) {
  try {
    const mealsPrepped = parseInt(localStorage.getItem('stats:mealsPrepped:v1') || '0');
    localStorage.setItem('stats:mealsPrepped:v1', (mealsPrepped + mealCount).toString());

    // Check badges
    const { checkBadges } = require('./badges');
    const stats = getUserStats();
    return checkBadges(stats);
  } catch (error) {
    console.error('Error tracking meal prep:', error);
    return [];
  }
}

/**
 * Get all user stats
 */
export function getUserStats() {
  try {
    const { getCurrentStreak } = require('./streaks');
    const { getCurrentLevel } = require('./xpSystem');
    const { getTotalChallengesCompleted } = require('./challenges');

    return {
      recipesCooked: parseInt(localStorage.getItem('stats:recipesCooked:v1') || '0'),
      currentStreak: getCurrentStreak(),
      level: getCurrentLevel(),
      challengesCompleted: getTotalChallengesCompleted(),
      cuisinesTried: JSON.parse(localStorage.getItem('stats:cuisinesTried:v1') || '[]'),
      fastRecipesCooked: parseInt(localStorage.getItem('stats:fastRecipesCooked:v1') || '0'),
      mealsPrepped: parseInt(localStorage.getItem('stats:mealsPrepped:v1') || '0'),
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      recipesCooked: 0,
      currentStreak: 0,
      level: 1,
      challengesCompleted: 0,
      cuisinesTried: [],
      fastRecipesCooked: 0,
      mealsPrepped: 0,
    };
  }
}
