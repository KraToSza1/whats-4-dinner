/**
 * Calorie Tracker Integration Utilities
 * Integrates calorie tracking with recipes and meal planning
 */

import { trackFeatureUsage, FEATURES } from './featureTracking';

const MEAL_LOG_KEY = 'calorie:meals:v1';

/**
 * Add recipe to calorie tracker when cooked
 */
export function addRecipeToCalorieTracker(recipe, servings = 1, mealType = 'dinner') {
  try {
    if (!recipe) return false;

    const calories = recipe.calories || recipe.nutrition?.calories || 0;
    const protein = recipe.nutrition?.protein || recipe.protein || 0;
    const carbs = recipe.nutrition?.carbs || recipe.carbs || 0;
    const fats = recipe.nutrition?.fats || recipe.fat || 0;
    const fiber = recipe.nutrition?.fiber || recipe.fiber || 0;

    if (calories <= 0) {
      // Recipe doesn't have nutrition data
      return false;
    }

    // Scale by servings
    const scaledCalories = Math.round(calories * servings);
    const scaledProtein = Math.round(protein * servings);
    const scaledCarbs = Math.round(carbs * servings);
    const scaledFats = Math.round(fats * servings);
    const scaledFiber = Math.round(fiber * servings);

    const today = new Date().toISOString().split('T')[0];
    const mealLogs = JSON.parse(localStorage.getItem(MEAL_LOG_KEY) || '{}');
    
    if (!mealLogs[today]) {
      mealLogs[today] = [];
    }

    const mealEntry = {
      id: Date.now().toString(),
      name: recipe.title || 'Recipe',
      calories: scaledCalories,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fats: scaledFats,
      fiber: scaledFiber,
      mealType: mealType,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      servings: servings,
      timestamp: new Date().toISOString(),
      source: 'recipe',
    };

    mealLogs[today].push(mealEntry);
    localStorage.setItem(MEAL_LOG_KEY, JSON.stringify(mealLogs));

    // Track feature usage
    trackFeatureUsage(FEATURES.CALORIE_TRACKER, {
      action: 'add_recipe',
      recipeId: recipe.id,
      calories: scaledCalories,
    });

    return true;
  } catch (error) {
    console.error('Error adding recipe to calorie tracker:', error);
    return false;
  }
}

/**
 * Get today's calorie total from recipes
 */
export function getTodayCaloriesFromRecipes() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mealLogs = JSON.parse(localStorage.getItem(MEAL_LOG_KEY) || '{}');
    const todayMeals = mealLogs[today] || [];
    
    const recipeMeals = todayMeals.filter(meal => meal.source === 'recipe');
    return recipeMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Get recipe suggestions based on calorie goals
 */
export function getCalorieGoalForRecipeSearch() {
  try {
    const profile = JSON.parse(localStorage.getItem('calorie:tracker:v1') || 'null');
    if (!profile) return null;

    const goalCalories = profile.goalCalories || profile.tdee || 2000;
    const todayCalories = getTodayCaloriesFromRecipes();
    const remaining = goalCalories - todayCalories;

    return {
      maxCalories: Math.max(remaining, 200), // At least 200 cal recipes
      remainingCalories: remaining,
      goalCalories,
      todayCalories,
    };
  } catch {
    return null;
  }
}

