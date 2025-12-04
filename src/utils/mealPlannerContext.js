/**
 * Meal Planner Context Utility
 * Gathers ALL user context for smart meal planning:
 * - Calorie tracker goals and targets
 * - Medical conditions (user + family)
 * - Family members and their needs
 * - Dietary preferences
 * - Pantry ingredients
 * - Favorites
 */

import {
  getActiveMedicalConditions,
  checkRecipeForMedicalConditions,
} from './medicalConditions.js';

const CALORIE_TRACKER_KEY = 'calorie:tracker:v1';
const FAMILY_MEMBERS_KEY = 'family:members:v1';
const MEDICAL_CONDITIONS_KEY = 'medical:conditions:v1';

/**
 * Get calorie tracker profile and goals
 */
export function getCalorieTrackerContext() {
  try {
    const profile = JSON.parse(localStorage.getItem(CALORIE_TRACKER_KEY) || 'null');
    if (!profile) {
      return {
        hasTracker: false,
        hasGoals: false,
      };
    }

    // Calculate daily calorie target
    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const age = profile.age || 30;
    const gender = profile.gender || 'male';
    const activityLevel = profile.activityLevel || 'moderate';

    // Calculate BMR
    const bmr =
      gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    // Calculate TDEE
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));

    // Calculate goal calories
    const goal = profile.goal || 'maintain';
    const rate = profile.rate || 0.5; // kg per week
    const weeklyDeficit = rate * 7700;
    const dailyDeficit = weeklyDeficit / 7;

    let dailyCalories = tdee;
    switch (goal) {
      case 'lose':
        dailyCalories = Math.max(1200, Math.round(tdee - dailyDeficit));
        break;
      case 'cut':
        dailyCalories = Math.max(1200, Math.round(tdee - dailyDeficit * 1.5));
        break;
      case 'maintain':
        dailyCalories = Math.round(tdee);
        break;
      case 'gain':
        dailyCalories = Math.round(tdee + dailyDeficit);
        break;
      case 'bulk':
        dailyCalories = Math.round(tdee + dailyDeficit * 1.2);
        break;
      case 'recomp':
        dailyCalories = Math.round(tdee - dailyDeficit * 0.3);
        break;
      case 'athletic':
        dailyCalories = Math.round(tdee + dailyDeficit * 0.5);
        break;
      case 'health':
        dailyCalories = Math.round(tdee);
        break;
    }

    // Calculate macro targets (if available)
    const proteinTarget = profile.proteinTarget || null;
    const carbsTarget = profile.carbsTarget || null;
    const fatsTarget = profile.fatsTarget || null;

    // Estimate macros if not set (standard distribution)
    const estimatedProtein = proteinTarget || Math.round((dailyCalories * 0.25) / 4); // 25% calories from protein
    const estimatedCarbs = carbsTarget || Math.round((dailyCalories * 0.45) / 4); // 45% calories from carbs
    const estimatedFats = fatsTarget || Math.round((dailyCalories * 0.3) / 9); // 30% calories from fats

    return {
      hasTracker: true,
      hasGoals: true,
      profile,
      dailyCalories,
      dailyProtein: estimatedProtein,
      dailyCarbs: estimatedCarbs,
      dailyFats: estimatedFats,
      goal,
      activityLevel,
      weight,
      height,
      age,
      gender,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[MealPlannerContext] Error reading calorie tracker:', error);
    }
    return {
      hasTracker: false,
      hasGoals: false,
    };
  }
}

/**
 * Get family members and their medical conditions/allergies
 */
export function getFamilyContext() {
  try {
    const members = JSON.parse(localStorage.getItem(FAMILY_MEMBERS_KEY) || '[]');
    if (!members || members.length === 0) {
      return {
        hasFamily: false,
        members: [],
        allAllergies: [],
        allMedicalConditions: [],
        allDietaryRestrictions: [],
        childrenCount: 0,
        hasChildren: false,
      };
    }

    // Collect all allergies, medical conditions, and dietary restrictions
    const allAllergies = new Set();
    const allMedicalConditions = new Set();
    const allDietaryRestrictions = new Set();
    let childrenCount = 0;

    members.forEach(member => {
      // Count children
      const role = (member.role || '').toLowerCase();
      if (
        role === 'child' ||
        role === 'baby' ||
        role === 'toddler' ||
        role === 'teenager' ||
        role === 'teen'
      ) {
        childrenCount++;
      }

      // Collect allergies
      if (member.allergies && Array.isArray(member.allergies)) {
        member.allergies.forEach(allergy => allAllergies.add(allergy.toLowerCase()));
      }

      // Collect medical conditions
      if (member.medicalConditions && Array.isArray(member.medicalConditions)) {
        member.medicalConditions.forEach(condition =>
          allMedicalConditions.add(condition.toLowerCase())
        );
      }

      // Collect dietary restrictions
      if (member.dietaryRestrictions && Array.isArray(member.dietaryRestrictions)) {
        member.dietaryRestrictions.forEach(restriction =>
          allDietaryRestrictions.add(restriction.toLowerCase())
        );
      }
    });

    return {
      hasFamily: true,
      members,
      allAllergies: Array.from(allAllergies),
      allMedicalConditions: Array.from(allMedicalConditions),
      allDietaryRestrictions: Array.from(allDietaryRestrictions),
      childrenCount,
      hasChildren: childrenCount > 0,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[MealPlannerContext] Error reading family data:', error);
    }
    return {
      hasFamily: false,
      members: [],
      allAllergies: [],
      allMedicalConditions: [],
      allDietaryRestrictions: [],
      childrenCount: 0,
      hasChildren: false,
    };
  }
}

/**
 * Get user's medical conditions
 */
export function getUserMedicalContext() {
  try {
    const medicalData = getActiveMedicalConditions();
    if (!medicalData || !medicalData.activeConditions || medicalData.activeConditions.length === 0) {
      return {
        hasMedicalConditions: false,
        conditions: [],
        foodsToAvoid: [],
        requiredNutrients: [],
      };
    }

    // Collect all foods to avoid
    const foodsToAvoid = new Set();
    medicalData.activeConditions.forEach(condition => {
      if (condition.restrictions?.avoidIngredients) {
        condition.restrictions.avoidIngredients.forEach(food =>
          foodsToAvoid.add(food.toLowerCase())
        );
      }
    });

    // Add custom foods to avoid
    if (medicalData.foodsToAvoid && Array.isArray(medicalData.foodsToAvoid)) {
      medicalData.foodsToAvoid.forEach(food => foodsToAvoid.add(food.toLowerCase()));
    }

    return {
      hasMedicalConditions: true,
      conditions: medicalData.activeConditions,
      foodsToAvoid: Array.from(foodsToAvoid),
      requiredNutrients: medicalData.requiredNutrients || [],
      medicalData,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[MealPlannerContext] Error reading medical conditions:', error);
    }
    return {
      hasMedicalConditions: false,
      conditions: [],
      foodsToAvoid: [],
      requiredNutrients: [],
    };
  }
}

/**
 * Get comprehensive user context for meal planning
 */
export function getMealPlannerContext() {
  const calorieContext = getCalorieTrackerContext();
  const familyContext = getFamilyContext();
  const medicalContext = getUserMedicalContext();

  // Get dietary preferences
  const diet = localStorage.getItem('filters:diet') || '';
  const intolerances = localStorage.getItem('filters:intolerances') || '';
  const selectedIntolerances = (() => {
    try {
      return JSON.parse(localStorage.getItem('filters:selectedIntolerances') || '[]');
    } catch {
      return [];
    }
  })();

  // Get pantry
  const pantry = (() => {
    try {
      return JSON.parse(localStorage.getItem('filters:pantry') || '[]');
    } catch {
      return [];
    }
  })();

  // Get favorites
  const favorites = (() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  })();

  // Combine all foods to avoid (user + family)
  const allFoodsToAvoid = new Set([
    ...medicalContext.foodsToAvoid,
    ...familyContext.allAllergies,
  ]);

  // Combine all dietary restrictions
  const allDietaryRestrictions = new Set([
    ...familyContext.allDietaryRestrictions,
    ...selectedIntolerances.map(i => i.toLowerCase()),
  ]);

  // If there's a diet preference, add it
  if (diet && diet.toLowerCase() !== 'any diet') {
    allDietaryRestrictions.add(diet.toLowerCase());
  }

  return {
    // Calorie tracking
    ...calorieContext,

    // Family
    ...familyContext,

    // Medical
    ...medicalContext,

    // Combined safety data
    allFoodsToAvoid: Array.from(allFoodsToAvoid),
    allDietaryRestrictions: Array.from(allDietaryRestrictions),

    // Preferences
    diet,
    intolerances,
    selectedIntolerances,
    pantry,
    favorites,

    // Summary flags
    hasAnyRestrictions:
      calorieContext.hasGoals ||
      medicalContext.hasMedicalConditions ||
      familyContext.hasFamily ||
      allFoodsToAvoid.size > 0 ||
      allDietaryRestrictions.size > 0,
  };
}

/**
 * Check if a recipe is safe for ALL users (user + family)
 * Returns { safe: boolean, warnings: [], conflicts: [], safeForFamily: boolean }
 */
export function checkRecipeSafetyForAll(recipe, servings = null) {
  const context = getMealPlannerContext();

  // Check user's medical conditions
  const userCheck = checkRecipeForMedicalConditions(recipe, servings);
  let isSafe = userCheck.safe;
  const warnings = [...userCheck.warnings];
  const conflicts = [...userCheck.conflicts];

  // Check against foods to avoid (allergies, etc.)
  const ingredients = recipe.extendedIngredients || [];
  const recipeIngredients = ingredients.map(ing =>
    (ing.name || ing.originalName || '').toLowerCase()
  );

  context.allFoodsToAvoid.forEach(avoidFood => {
    const found = recipeIngredients.some(
      ing => ing.includes(avoidFood) || avoidFood.includes(ing)
    );
    if (found) {
      conflicts.push({
        condition: 'Allergy/Restriction',
        issue: `Contains ${avoidFood} which must be avoided`,
        severity: 'high',
      });
      isSafe = false;
    }
  });

  // Check calorie goals if user has tracker
  if (context.hasGoals && context.dailyCalories) {
    const nutrition = recipe.nutrition?.nutrients || [];
    const caloriesNutrient = nutrition.find(n => n.name.toLowerCase() === 'calories');
    const recipeServings = servings || recipe.servings || 1;
    const caloriesPerServing = caloriesNutrient
      ? caloriesNutrient.amount / recipeServings
      : null;

    if (caloriesPerServing) {
      // Estimate daily calories per meal (divide daily by 3 meals)
      const targetPerMeal = context.dailyCalories / 3;
      const variance = Math.abs(caloriesPerServing - targetPerMeal);

      // Warn if significantly over/under (more than 50% variance)
      if (variance > targetPerMeal * 0.5) {
        if (caloriesPerServing > targetPerMeal * 1.5) {
          warnings.push({
            condition: 'Calorie Goal',
            issue: `High calories (${Math.round(caloriesPerServing)}cal) - target is ~${Math.round(targetPerMeal)}cal per meal`,
            severity: 'medium',
          });
        } else if (caloriesPerServing < targetPerMeal * 0.5) {
          warnings.push({
            condition: 'Calorie Goal',
            issue: `Low calories (${Math.round(caloriesPerServing)}cal) - may not meet daily needs`,
            severity: 'low',
          });
        }
      }
    }
  }

  // Check if safe for family (no conflicts with family allergies/restrictions)
  const safeForFamily = conflicts.length === 0 && isSafe;

  return {
    safe: isSafe,
    safeForFamily,
    warnings,
    conflicts,
    context,
  };
}

/**
 * Filter recipes to only include safe ones for all users
 */
export function filterSafeRecipes(recipes, servings = null) {
  return recipes.filter(recipe => {
    const check = checkRecipeSafetyForAll(recipe, servings);
    return check.safe && check.safeForFamily;
  });
}

/**
 * Score recipe for meal planning (higher = better match)
 * Considers: calorie goals, macros, medical safety, family safety, preferences
 */
export function scoreRecipeForMealPlanning(recipe, mealType, servings = null) {
  const context = getMealPlannerContext();
  const safetyCheck = checkRecipeSafetyForAll(recipe, servings);

  // Start with safety score (must be safe to be considered)
  if (!safetyCheck.safe) {
    return -1000; // Completely unsafe
  }

  let score = 100; // Base score

  // Safety bonus (no conflicts)
  if (safetyCheck.conflicts.length === 0) {
    score += 50;
  }

  // Calorie goal matching
  if (context.hasGoals && context.dailyCalories) {
    const nutrition = recipe.nutrition?.nutrients || [];
    const caloriesNutrient = nutrition.find(n => n.name.toLowerCase() === 'calories');
    const recipeServings = servings || recipe.servings || 1;
    const caloriesPerServing = caloriesNutrient
      ? caloriesNutrient.amount / recipeServings
      : null;

    if (caloriesPerServing) {
      const targetPerMeal = context.dailyCalories / 3;
      const variance = Math.abs(caloriesPerServing - targetPerMeal);
      const variancePercent = (variance / targetPerMeal) * 100;

      // Score based on how close to target (closer = higher score)
      if (variancePercent < 10) score += 30; // Very close
      else if (variancePercent < 25) score += 20; // Close
      else if (variancePercent < 50) score += 10; // Acceptable
      else score -= 10; // Too far off
    }
  }

  // Macro matching (if targets exist)
  if (context.dailyProtein && context.dailyCarbs && context.dailyFats) {
    const nutrition = recipe.nutrition?.nutrients || [];
    const recipeServings = servings || recipe.servings || 1;

    const getNutrient = name => {
      const nutrient = nutrition.find(n => n.name.toLowerCase().includes(name));
      return nutrient ? nutrient.amount / recipeServings : null;
    };

    const protein = getNutrient('protein');
    const carbs = getNutrient('carbohydrates') || getNutrient('carbs');
    const fats = getNutrient('fat');

    const targetProteinPerMeal = context.dailyProtein / 3;
    const targetCarbsPerMeal = context.dailyCarbs / 3;
    const targetFatsPerMeal = context.dailyFats / 3;

    if (protein) {
      const proteinVariance = Math.abs(protein - targetProteinPerMeal) / targetProteinPerMeal;
      if (proteinVariance < 0.2) score += 10;
      else if (proteinVariance < 0.4) score += 5;
    }

    if (carbs) {
      const carbsVariance = Math.abs(carbs - targetCarbsPerMeal) / targetCarbsPerMeal;
      if (carbsVariance < 0.2) score += 10;
      else if (carbsVariance < 0.4) score += 5;
    }

    if (fats) {
      const fatsVariance = Math.abs(fats - targetFatsPerMeal) / targetFatsPerMeal;
      if (fatsVariance < 0.2) score += 10;
      else if (fatsVariance < 0.4) score += 5;
    }
  }

  // Pantry ingredient bonus
  if (context.pantry && context.pantry.length > 0 && recipe.extendedIngredients) {
    const recipeIngredients = recipe.extendedIngredients.map(ing =>
      (ing.name || ing.originalName || '').toLowerCase()
    );
    const pantryMatches = context.pantry.filter(pantryIng =>
      recipeIngredients.some(
        ing => ing.includes(pantryIng.toLowerCase()) || pantryIng.toLowerCase().includes(ing)
      )
    );
    if (pantryMatches.length > 0) {
      score += pantryMatches.length * 5; // Bonus for each pantry ingredient used
    }
  }

  // Favorite bonus
  if (context.favorites && context.favorites.some(fav => fav.id === recipe.id)) {
    score += 20;
  }

  // Meal type matching
  if (recipe.mealTypes && recipe.mealTypes.includes(mealType)) {
    score += 15;
  }

  return score;
}

