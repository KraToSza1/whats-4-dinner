/**
 * Daily Challenges System - ENHANCED
 * Provides daily cooking challenges for users with MANY more options
 */

const CHALLENGES_STORAGE_KEY = 'challenges:completed:v1';
const DAILY_CHALLENGE_KEY = 'challenges:daily:v1';
const WEEKLY_CHALLENGE_KEY = 'challenges:weekly:v1';

export const CHALLENGE_TYPES = {
  // Speed Challenges
  FAST_COOK: 'fast_cook',
  ULTRA_FAST_COOK: 'ultra_fast_cook',
  SPEED_MASTER: 'speed_master',
  
  // Cuisine Challenges
  NEW_CUISINE: 'new_cuisine',
  CUISINE_EXPLORER: 'cuisine_explorer',
  ASIAN_CUISINE: 'asian_cuisine',
  MEDITERRANEAN_CUISINE: 'mediterranean_cuisine',
  MEXICAN_CUISINE: 'mexican_cuisine',
  
  // Ingredient Challenges
  FEW_INGREDIENTS: 'few_ingredients',
  ONE_POT_WONDER: 'one_pot_wonder',
  PANTRY_CHALLENGE: 'pantry_challenge',
  FRESH_INGREDIENTS: 'fresh_ingredients',
  
  // Dietary Challenges
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  GLUTEN_FREE: 'gluten_free',
  KETO: 'keto',
  LOW_CARB: 'low_carb',
  HIGH_PROTEIN: 'high_protein',
  
  // Meal Type Challenges
  MEAL_PREP: 'meal_prep',
  BREAKFAST_CHAMPION: 'breakfast_champion',
  LUNCH_MASTER: 'lunch_master',
  DINNER_EXPERT: 'dinner_expert',
  SNACK_TIME: 'snack_time',
  DESSERT_LOVER: 'dessert_lover',
  
  // Health Challenges
  HEALTHY: 'healthy',
  SUPER_HEALTHY: 'super_healthy',
  LOW_CALORIE: 'low_calorie',
  HIGH_FIBER: 'high_fiber',
  VITAMIN_BOOST: 'vitamin_boost',
  
  // Budget Challenges
  BUDGET: 'budget',
  ULTRA_BUDGET: 'ultra_budget',
  ZERO_WASTE: 'zero_waste',
  
  // Family Challenges
  FAMILY_FRIENDLY: 'family_friendly',
  KID_FRIENDLY: 'kid_friendly',
  CROWD_PLEASER: 'crowd_pleaser',
  
  // Skill Challenges
  BAKING_MASTER: 'baking_master',
  GRILL_MASTER: 'grill_master',
  PASTA_PRO: 'pasta_pro',
  SOUP_SPECIALIST: 'soup_specialist',
  SALAD_ARTIST: 'salad_artist',
  
  // Time Challenges
  WEEKEND_WARRIOR: 'weekend_warrior',
  QUICK_LUNCH: 'quick_lunch',
  MEAL_PREP_SUNDAY: 'meal_prep_sunday',
  
  // Social Challenges
  SHARE_RECIPE: 'share_recipe',
  RATE_RECIPES: 'rate_recipes',
  EXPLORE_RECIPES: 'explore_recipes',
  
  // Streak Challenges
  MAINTAIN_STREAK: 'maintain_streak',
  STREAK_WARRIOR: 'streak_warrior',
  
  // Special Challenges
  SEASONAL_SPECIAL: 'seasonal_special',
  HOLIDAY_TREAT: 'holiday_treat',
  COMFORT_FOOD: 'comfort_food',
  ADVENTURE_TIME: 'adventure_time',
};

export const CHALLENGES = {
  // ========== SPEED CHALLENGES ==========
  [CHALLENGE_TYPES.FAST_COOK]: {
    id: CHALLENGE_TYPES.FAST_COOK,
    name: 'Speed Cooking',
    emoji: '⚡',
    description: 'Cook a recipe in under 30 minutes',
    xpReward: 50,
    category: 'speed',
    check: recipe => {
      const totalTime = recipe.readyInMinutes || recipe.totalTime || 
        ((recipe.prepMinutes || 0) + (recipe.cookMinutes || 0));
      return totalTime > 0 && totalTime <= 30;
    },
  },
  [CHALLENGE_TYPES.ULTRA_FAST_COOK]: {
    id: CHALLENGE_TYPES.ULTRA_FAST_COOK,
    name: 'Lightning Fast',
    emoji: '💨',
    description: 'Cook a recipe in under 15 minutes',
    xpReward: 75,
    category: 'speed',
    check: recipe => {
      const totalTime = recipe.readyInMinutes || recipe.totalTime || 
        ((recipe.prepMinutes || 0) + (recipe.cookMinutes || 0));
      return totalTime > 0 && totalTime <= 15;
    },
  },
  [CHALLENGE_TYPES.SPEED_MASTER]: {
    id: CHALLENGE_TYPES.SPEED_MASTER,
    name: 'Speed Master',
    emoji: '🚀',
    description: 'Cook 3 recipes under 20 minutes each',
    xpReward: 100,
    category: 'speed',
    check: (recipe, userStats) => {
      const fastCount = parseInt(localStorage.getItem('stats:fastRecipesCooked:v1') || '0');
      return fastCount >= 3;
    },
  },
  
  // ========== CUISINE CHALLENGES ==========
  [CHALLENGE_TYPES.NEW_CUISINE]: {
    id: CHALLENGE_TYPES.NEW_CUISINE,
    name: 'Cuisine Explorer',
    emoji: '🌍',
    description: "Try a cuisine you've never cooked before",
    xpReward: 75,
    category: 'cuisine',
    check: (recipe, userStats) => {
      const cuisine = (recipe.cuisine || recipe.cuisineType || [])[0] || '';
      if (!cuisine) return false;
      const triedCuisines = userStats?.cuisinesTried || [];
      return !triedCuisines.includes(cuisine.toLowerCase());
    },
  },
  [CHALLENGE_TYPES.CUISINE_EXPLORER]: {
    id: CHALLENGE_TYPES.CUISINE_EXPLORER,
    name: 'World Traveler',
    emoji: '🗺️',
    description: 'Try 3 different cuisines today',
    xpReward: 100,
    category: 'cuisine',
    check: (recipe, userStats) => {
      const todayCuisines = JSON.parse(localStorage.getItem('stats:todayCuisines:v1') || '[]');
      return todayCuisines.length >= 3;
    },
  },
  [CHALLENGE_TYPES.ASIAN_CUISINE]: {
    id: CHALLENGE_TYPES.ASIAN_CUISINE,
    name: 'Asian Adventure',
    emoji: '🥢',
    description: 'Cook an Asian cuisine recipe',
    xpReward: 60,
    category: 'cuisine',
    check: recipe => {
      const cuisine = (recipe.cuisine || recipe.cuisineType || []).join(' ').toLowerCase();
      return cuisine.includes('asian') || cuisine.includes('chinese') || 
             cuisine.includes('japanese') || cuisine.includes('thai') || 
             cuisine.includes('korean') || cuisine.includes('vietnamese') ||
             cuisine.includes('indian');
    },
  },
  [CHALLENGE_TYPES.MEDITERRANEAN_CUISINE]: {
    id: CHALLENGE_TYPES.MEDITERRANEAN_CUISINE,
    name: 'Mediterranean Magic',
    emoji: '🫒',
    description: 'Cook a Mediterranean recipe',
    xpReward: 60,
    category: 'cuisine',
    check: recipe => {
      const cuisine = (recipe.cuisine || recipe.cuisineType || []).join(' ').toLowerCase();
      return cuisine.includes('mediterranean') || cuisine.includes('greek') || 
             cuisine.includes('italian') || cuisine.includes('spanish');
    },
  },
  [CHALLENGE_TYPES.MEXICAN_CUISINE]: {
    id: CHALLENGE_TYPES.MEXICAN_CUISINE,
    name: 'Mexican Fiesta',
    emoji: '🌮',
    description: 'Cook a Mexican recipe',
    xpReward: 60,
    category: 'cuisine',
    check: recipe => {
      const cuisine = (recipe.cuisine || recipe.cuisineType || []).join(' ').toLowerCase();
      return cuisine.includes('mexican') || cuisine.includes('tex-mex') || 
             cuisine.includes('latin');
    },
  },
  
  // ========== INGREDIENT CHALLENGES ==========
  [CHALLENGE_TYPES.FEW_INGREDIENTS]: {
    id: CHALLENGE_TYPES.FEW_INGREDIENTS,
    name: 'Minimalist Chef',
    emoji: '🎯',
    description: 'Cook a recipe with 5 ingredients or less',
    xpReward: 60,
    category: 'ingredients',
    check: recipe => {
      const ingredients = recipe.ingredients || recipe.extendedIngredients || [];
      return ingredients.length <= 5;
    },
  },
  [CHALLENGE_TYPES.ONE_POT_WONDER]: {
    id: CHALLENGE_TYPES.ONE_POT_WONDER,
    name: 'One Pot Wonder',
    emoji: '🍲',
    description: 'Cook a one-pot recipe',
    xpReward: 70,
    category: 'ingredients',
    check: recipe => {
      const title = (recipe.title || '').toLowerCase();
      const instructions = (recipe.instructions || '').toLowerCase();
      return title.includes('one pot') || title.includes('one-pot') || 
             instructions.includes('one pot') || instructions.includes('one-pot') ||
             (recipe.dishTypes || []).some(d => d.toLowerCase().includes('one pot'));
    },
  },
  [CHALLENGE_TYPES.PANTRY_CHALLENGE]: {
    id: CHALLENGE_TYPES.PANTRY_CHALLENGE,
    name: 'Pantry Power',
    emoji: '🥫',
    description: 'Cook using only pantry staples',
    xpReward: 65,
    category: 'ingredients',
    check: recipe => {
      // Simple check - recipes with mostly dry/canned ingredients
      const ingredients = (recipe.ingredients || []).map(i => 
        (i.name || i.ingredient || '').toLowerCase()
      );
      const pantryKeywords = ['canned', 'jar', 'dried', 'pasta', 'rice', 'flour', 'sugar', 'oil', 'vinegar'];
      const pantryCount = ingredients.filter(ing => 
        pantryKeywords.some(keyword => ing.includes(keyword))
      ).length;
      return pantryCount >= ingredients.length * 0.6;
    },
  },
  [CHALLENGE_TYPES.FRESH_INGREDIENTS]: {
    id: CHALLENGE_TYPES.FRESH_INGREDIENTS,
    name: 'Farm Fresh',
    emoji: '🥬',
    description: 'Cook with 5+ fresh vegetables',
    xpReward: 70,
    category: 'ingredients',
    check: recipe => {
      const ingredients = (recipe.ingredients || []).map(i => 
        (i.name || i.ingredient || '').toLowerCase()
      );
      const freshVeggies = ['tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery', 
                           'lettuce', 'spinach', 'broccoli', 'cauliflower', 'zucchini', 
                           'cucumber', 'mushroom', 'avocado', 'corn', 'peas'];
      const veggieCount = ingredients.filter(ing => 
        freshVeggies.some(veg => ing.includes(veg))
      ).length;
      return veggieCount >= 5;
    },
  },
  
  // ========== DIETARY CHALLENGES ==========
  [CHALLENGE_TYPES.VEGETARIAN]: {
    id: CHALLENGE_TYPES.VEGETARIAN,
    name: 'Plant Power',
    emoji: '🥗',
    description: 'Cook a vegetarian recipe',
    xpReward: 40,
    category: 'dietary',
    check: recipe => {
      const dietLabels = recipe.dietLabels || [];
      const diets = recipe.diets || [];
      const tags = recipe.tags || [];
      return dietLabels.includes('Vegetarian') || diets.includes('vegetarian') ||
        tags.some(tag => tag.toLowerCase().includes('vegetarian'));
    },
  },
  [CHALLENGE_TYPES.VEGAN]: {
    id: CHALLENGE_TYPES.VEGAN,
    name: 'Vegan Victory',
    emoji: '🌱',
    description: 'Cook a vegan recipe',
    xpReward: 50,
    category: 'dietary',
    check: recipe => {
      const dietLabels = recipe.dietLabels || [];
      const diets = recipe.diets || [];
      const tags = recipe.tags || [];
      return dietLabels.includes('Vegan') || diets.includes('vegan') ||
        tags.some(tag => tag.toLowerCase().includes('vegan'));
    },
  },
  [CHALLENGE_TYPES.GLUTEN_FREE]: {
    id: CHALLENGE_TYPES.GLUTEN_FREE,
    name: 'Gluten Free',
    emoji: '🌾',
    description: 'Cook a gluten-free recipe',
    xpReward: 45,
    category: 'dietary',
    check: recipe => {
      const dietLabels = recipe.dietLabels || [];
      const diets = recipe.diets || [];
      return dietLabels.includes('Gluten-Free') || diets.includes('gluten free') ||
        diets.includes('gluten-free');
    },
  },
  [CHALLENGE_TYPES.KETO]: {
    id: CHALLENGE_TYPES.KETO,
    name: 'Keto King',
    emoji: '🥑',
    description: 'Cook a keto-friendly recipe',
    xpReward: 55,
    category: 'dietary',
    check: recipe => {
      const dietLabels = recipe.dietLabels || [];
      const diets = recipe.diets || [];
      const tags = recipe.tags || [];
      return dietLabels.includes('Keto-Friendly') || diets.includes('keto') ||
        tags.some(tag => tag.toLowerCase().includes('keto'));
    },
  },
  [CHALLENGE_TYPES.LOW_CARB]: {
    id: CHALLENGE_TYPES.LOW_CARB,
    name: 'Low Carb Hero',
    emoji: '🥩',
    description: 'Cook a low-carb recipe',
    xpReward: 50,
    category: 'dietary',
    check: recipe => {
      const carbs = recipe.nutrition?.carbs || recipe.carbs || 0;
      return carbs > 0 && carbs <= 20;
    },
  },
  [CHALLENGE_TYPES.HIGH_PROTEIN]: {
    id: CHALLENGE_TYPES.HIGH_PROTEIN,
    name: 'Protein Power',
    emoji: '💪',
    description: 'Cook a high-protein recipe (30g+)',
    xpReward: 55,
    category: 'dietary',
    check: recipe => {
      const protein = recipe.nutrition?.protein || recipe.protein || 0;
      return protein >= 30;
    },
  },
  
  // ========== MEAL TYPE CHALLENGES ==========
  [CHALLENGE_TYPES.MEAL_PREP]: {
    id: CHALLENGE_TYPES.MEAL_PREP,
    name: 'Meal Prep Master',
    emoji: '📦',
    description: 'Add 3+ meals to your meal plan',
    xpReward: 80,
    category: 'meal',
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
  [CHALLENGE_TYPES.BREAKFAST_CHAMPION]: {
    id: CHALLENGE_TYPES.BREAKFAST_CHAMPION,
    name: 'Breakfast Champion',
    emoji: '🥞',
    description: 'Cook a breakfast recipe',
    xpReward: 45,
    category: 'meal',
    check: recipe => {
      const mealTypes = recipe.mealTypes || recipe.dishTypes || [];
      return mealTypes.some(type => 
        type.toLowerCase().includes('breakfast') || type.toLowerCase().includes('morning')
      );
    },
  },
  [CHALLENGE_TYPES.LUNCH_MASTER]: {
    id: CHALLENGE_TYPES.LUNCH_MASTER,
    name: 'Lunch Master',
    emoji: '🥪',
    description: 'Cook a lunch recipe',
    xpReward: 45,
    category: 'meal',
    check: recipe => {
      const mealTypes = recipe.mealTypes || recipe.dishTypes || [];
      return mealTypes.some(type => type.toLowerCase().includes('lunch'));
    },
  },
  [CHALLENGE_TYPES.DINNER_EXPERT]: {
    id: CHALLENGE_TYPES.DINNER_EXPERT,
    name: 'Dinner Expert',
    emoji: '🍽️',
    description: 'Cook a dinner recipe',
    xpReward: 45,
    category: 'meal',
    check: recipe => {
      const mealTypes = recipe.mealTypes || recipe.dishTypes || [];
      return mealTypes.some(type => type.toLowerCase().includes('dinner') || 
        type.toLowerCase().includes('main course'));
    },
  },
  [CHALLENGE_TYPES.SNACK_TIME]: {
    id: CHALLENGE_TYPES.SNACK_TIME,
    name: 'Snack Attack',
    emoji: '🍿',
    description: 'Cook a snack recipe',
    xpReward: 40,
    category: 'meal',
    check: recipe => {
      const mealTypes = recipe.mealTypes || recipe.dishTypes || [];
      return mealTypes.some(type => type.toLowerCase().includes('snack'));
    },
  },
  [CHALLENGE_TYPES.DESSERT_LOVER]: {
    id: CHALLENGE_TYPES.DESSERT_LOVER,
    name: 'Dessert Lover',
    emoji: '🍰',
    description: 'Cook a dessert recipe',
    xpReward: 50,
    category: 'meal',
    check: recipe => {
      const mealTypes = recipe.mealTypes || recipe.dishTypes || [];
      return mealTypes.some(type => type.toLowerCase().includes('dessert'));
    },
  },
  
  // ========== HEALTH CHALLENGES ==========
  [CHALLENGE_TYPES.HEALTHY]: {
    id: CHALLENGE_TYPES.HEALTHY,
    name: 'Healthy Choice',
    emoji: '💚',
    description: 'Cook a recipe under 400 calories',
    xpReward: 45,
    category: 'health',
    check: recipe => {
      const calories = recipe.calories || recipe.nutrition?.calories || 0;
      return calories > 0 && calories <= 400;
    },
  },
  [CHALLENGE_TYPES.SUPER_HEALTHY]: {
    id: CHALLENGE_TYPES.SUPER_HEALTHY,
    name: 'Super Healthy',
    emoji: '🌟',
    description: 'Cook a recipe under 300 calories',
    xpReward: 60,
    category: 'health',
    check: recipe => {
      const calories = recipe.calories || recipe.nutrition?.calories || 0;
      return calories > 0 && calories <= 300;
    },
  },
  [CHALLENGE_TYPES.LOW_CALORIE]: {
    id: CHALLENGE_TYPES.LOW_CALORIE,
    name: 'Low Calorie',
    emoji: '🥗',
    description: 'Cook a recipe under 250 calories',
    xpReward: 70,
    category: 'health',
    check: recipe => {
      const calories = recipe.calories || recipe.nutrition?.calories || 0;
      return calories > 0 && calories <= 250;
    },
  },
  [CHALLENGE_TYPES.HIGH_FIBER]: {
    id: CHALLENGE_TYPES.HIGH_FIBER,
    name: 'Fiber Boost',
    emoji: '🌾',
    description: 'Cook a recipe with 10g+ fiber',
    xpReward: 55,
    category: 'health',
    check: recipe => {
      const fiber = recipe.nutrition?.fiber || recipe.fiber || 0;
      return fiber >= 10;
    },
  },
  [CHALLENGE_TYPES.VITAMIN_BOOST]: {
    id: CHALLENGE_TYPES.VITAMIN_BOOST,
    name: 'Vitamin Boost',
    emoji: '🥕',
    description: 'Cook a recipe rich in vitamins',
    xpReward: 50,
    category: 'health',
    check: recipe => {
      const ingredients = (recipe.ingredients || []).map(i => 
        (i.name || i.ingredient || '').toLowerCase()
      );
      const vitaminRich = ['carrot', 'spinach', 'broccoli', 'sweet potato', 'bell pepper', 
                          'tomato', 'citrus', 'berry', 'kale', 'avocado'];
      return vitaminRich.some(food => 
        ingredients.some(ing => ing.includes(food))
      );
    },
  },
  
  // ========== BUDGET CHALLENGES ==========
  [CHALLENGE_TYPES.BUDGET]: {
    id: CHALLENGE_TYPES.BUDGET,
    name: 'Budget Friendly',
    emoji: '💰',
    description: 'Cook a recipe estimated under $5',
    xpReward: 55,
    category: 'budget',
    check: recipe => {
      const ingredients = recipe.ingredients || [];
      const estimatedCost = ingredients.length * 0.75;
      return estimatedCost <= 5;
    },
  },
  [CHALLENGE_TYPES.ULTRA_BUDGET]: {
    id: CHALLENGE_TYPES.ULTRA_BUDGET,
    name: 'Ultra Budget',
    emoji: '💵',
    description: 'Cook a recipe estimated under $3',
    xpReward: 75,
    category: 'budget',
    check: recipe => {
      const ingredients = recipe.ingredients || [];
      const estimatedCost = ingredients.length * 0.75;
      return estimatedCost <= 3;
    },
  },
  [CHALLENGE_TYPES.ZERO_WASTE]: {
    id: CHALLENGE_TYPES.ZERO_WASTE,
    name: 'Zero Waste',
    emoji: '♻️',
    description: 'Cook using leftover ingredients',
    xpReward: 65,
    category: 'budget',
    check: (recipe, userStats) => {
      // Check if user has pantry items that match recipe ingredients
      const pantry = JSON.parse(localStorage.getItem('pantry:items:v1') || '[]');
      const ingredients = (recipe.ingredients || []).map(i => 
        (i.name || i.ingredient || '').toLowerCase()
      );
      const matches = ingredients.filter(ing => 
        pantry.some(p => p.name?.toLowerCase().includes(ing) || ing.includes(p.name?.toLowerCase()))
      );
      return matches.length >= ingredients.length * 0.5;
    },
  },
  
  // ========== FAMILY CHALLENGES ==========
  [CHALLENGE_TYPES.FAMILY_FRIENDLY]: {
    id: CHALLENGE_TYPES.FAMILY_FRIENDLY,
    name: 'Family Favorite',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Cook a recipe that serves 4+ people',
    xpReward: 50,
    category: 'family',
    check: recipe => {
      const servings = recipe.servings || recipe.yield || 0;
      return servings >= 4;
    },
  },
  [CHALLENGE_TYPES.KID_FRIENDLY]: {
    id: CHALLENGE_TYPES.KID_FRIENDLY,
    name: 'Kid Approved',
    emoji: '👶',
    description: 'Cook a kid-friendly recipe',
    xpReward: 55,
    category: 'family',
    check: recipe => {
      const tags = recipe.tags || [];
      const title = (recipe.title || '').toLowerCase();
      return tags.some(tag => tag.toLowerCase().includes('kid')) ||
        tags.some(tag => tag.toLowerCase().includes('family')) ||
        title.includes('kid') || title.includes('children');
    },
  },
  [CHALLENGE_TYPES.CROWD_PLEASER]: {
    id: CHALLENGE_TYPES.CROWD_PLEASER,
    name: 'Crowd Pleaser',
    emoji: '🎉',
    description: 'Cook a recipe that serves 6+ people',
    xpReward: 65,
    category: 'family',
    check: recipe => {
      const servings = recipe.servings || recipe.yield || 0;
      return servings >= 6;
    },
  },
  
  // ========== SKILL CHALLENGES ==========
  [CHALLENGE_TYPES.BAKING_MASTER]: {
    id: CHALLENGE_TYPES.BAKING_MASTER,
    name: 'Baking Master',
    emoji: '🍞',
    description: 'Cook a baking recipe',
    xpReward: 60,
    category: 'skill',
    check: recipe => {
      const dishTypes = recipe.dishTypes || [];
      const tags = recipe.tags || [];
      return dishTypes.some(type => type.toLowerCase().includes('baking')) ||
        tags.some(tag => tag.toLowerCase().includes('bake')) ||
        tags.some(tag => tag.toLowerCase().includes('bread'));
    },
  },
  [CHALLENGE_TYPES.GRILL_MASTER]: {
    id: CHALLENGE_TYPES.GRILL_MASTER,
    name: 'Grill Master',
    emoji: '🔥',
    description: 'Cook a grilled recipe',
    xpReward: 60,
    category: 'skill',
    check: recipe => {
      const title = (recipe.title || '').toLowerCase();
      const instructions = (recipe.instructions || '').toLowerCase();
      const tags = recipe.tags || [];
      return title.includes('grill') || instructions.includes('grill') ||
        tags.some(tag => tag.toLowerCase().includes('grill'));
    },
  },
  [CHALLENGE_TYPES.PASTA_PRO]: {
    id: CHALLENGE_TYPES.PASTA_PRO,
    name: 'Pasta Pro',
    emoji: '🍝',
    description: 'Cook a pasta recipe',
    xpReward: 55,
    category: 'skill',
    check: recipe => {
      const title = (recipe.title || '').toLowerCase();
      const ingredients = (recipe.ingredients || []).map(i => 
        (i.name || i.ingredient || '').toLowerCase()
      );
      return title.includes('pasta') || ingredients.some(ing => ing.includes('pasta'));
    },
  },
  [CHALLENGE_TYPES.SOUP_SPECIALIST]: {
    id: CHALLENGE_TYPES.SOUP_SPECIALIST,
    name: 'Soup Specialist',
    emoji: '🍲',
    description: 'Cook a soup recipe',
    xpReward: 55,
    category: 'skill',
    check: recipe => {
      const dishTypes = recipe.dishTypes || [];
      const title = (recipe.title || '').toLowerCase();
      return dishTypes.some(type => type.toLowerCase().includes('soup')) ||
        title.includes('soup') || title.includes('stew');
    },
  },
  [CHALLENGE_TYPES.SALAD_ARTIST]: {
    id: CHALLENGE_TYPES.SALAD_ARTIST,
    name: 'Salad Artist',
    emoji: '🥗',
    description: 'Cook a salad recipe',
    xpReward: 50,
    category: 'skill',
    check: recipe => {
      const dishTypes = recipe.dishTypes || [];
      const title = (recipe.title || '').toLowerCase();
      return dishTypes.some(type => type.toLowerCase().includes('salad')) ||
        title.includes('salad');
    },
  },
  
  // ========== TIME CHALLENGES ==========
  [CHALLENGE_TYPES.WEEKEND_WARRIOR]: {
    id: CHALLENGE_TYPES.WEEKEND_WARRIOR,
    name: 'Weekend Warrior',
    emoji: '🏋️',
    description: 'Cook a recipe that takes 60+ minutes (weekend only)',
    xpReward: 70,
    category: 'time',
    check: recipe => {
      const day = new Date().getDay();
      if (day !== 0 && day !== 6) return false; // Only weekends
      const totalTime = recipe.readyInMinutes || recipe.totalTime || 
        ((recipe.prepMinutes || 0) + (recipe.cookMinutes || 0));
      return totalTime >= 60;
    },
  },
  [CHALLENGE_TYPES.QUICK_LUNCH]: {
    id: CHALLENGE_TYPES.QUICK_LUNCH,
    name: 'Quick Lunch',
    emoji: '⏰',
    description: 'Cook a lunch recipe in under 20 minutes',
    xpReward: 60,
    category: 'time',
    check: recipe => {
      const mealTypes = recipe.mealTypes || [];
      const isLunch = mealTypes.some(type => type.toLowerCase().includes('lunch'));
      if (!isLunch) return false;
      const totalTime = recipe.readyInMinutes || recipe.totalTime || 
        ((recipe.prepMinutes || 0) + (recipe.cookMinutes || 0));
      return totalTime > 0 && totalTime <= 20;
    },
  },
  
  // ========== SOCIAL CHALLENGES ==========
  [CHALLENGE_TYPES.SHARE_RECIPE]: {
    id: CHALLENGE_TYPES.SHARE_RECIPE,
    name: 'Share the Love',
    emoji: '📤',
    description: 'Share a recipe with friends',
    xpReward: 30,
    category: 'social',
    check: (recipe, userStats) => {
      const sharedToday = parseInt(localStorage.getItem('stats:sharedToday:v1') || '0');
      return sharedToday > 0;
    },
  },
  [CHALLENGE_TYPES.RATE_RECIPES]: {
    id: CHALLENGE_TYPES.RATE_RECIPES,
    name: 'Rate Master',
    emoji: '⭐',
    description: 'Rate 3 recipes today',
    xpReward: 40,
    category: 'social',
    check: (recipe, userStats) => {
      const ratedToday = parseInt(localStorage.getItem('stats:ratedToday:v1') || '0');
      return ratedToday >= 3;
    },
  },
  [CHALLENGE_TYPES.EXPLORE_RECIPES]: {
    id: CHALLENGE_TYPES.EXPLORE_RECIPES,
    name: 'Recipe Explorer',
    emoji: '🔍',
    description: 'View 10 different recipes today',
    xpReward: 50,
    category: 'social',
    check: (recipe, userStats) => {
      const viewedToday = JSON.parse(localStorage.getItem('stats:viewedToday:v1') || '[]');
      return viewedToday.length >= 10;
    },
  },
  
  // ========== STREAK CHALLENGES ==========
  [CHALLENGE_TYPES.MAINTAIN_STREAK]: {
    id: CHALLENGE_TYPES.MAINTAIN_STREAK,
    name: 'Streak Keeper',
    emoji: '🔥',
    description: 'Maintain your cooking streak today',
    xpReward: 25,
    category: 'streak',
    check: (recipe, userStats) => {
      const streakData = JSON.parse(localStorage.getItem('cooking:streaks:v1') || '{}');
      const lastDate = streakData.lastDate ? new Date(streakData.lastDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!lastDate) return false;
      lastDate.setHours(0, 0, 0, 0);
      return lastDate.getTime() === today.getTime();
    },
  },
  [CHALLENGE_TYPES.STREAK_WARRIOR]: {
    id: CHALLENGE_TYPES.STREAK_WARRIOR,
    name: 'Streak Warrior',
    emoji: '⚡',
    description: 'Maintain a 7+ day streak',
    xpReward: 100,
    category: 'streak',
    check: (recipe, userStats) => {
      const streak = userStats?.currentStreak || 0;
      return streak >= 7;
    },
  },
  
  // ========== SPECIAL CHALLENGES ==========
  [CHALLENGE_TYPES.SEASONAL_SPECIAL]: {
    id: CHALLENGE_TYPES.SEASONAL_SPECIAL,
    name: 'Seasonal Special',
    emoji: '🍂',
    description: 'Cook a seasonal recipe',
    xpReward: 65,
    category: 'special',
    check: recipe => {
      const month = new Date().getMonth();
      const tags = recipe.tags || [];
      const title = (recipe.title || '').toLowerCase();
      
      // Spring (Mar-May)
      if (month >= 2 && month <= 4) {
        return tags.some(tag => tag.toLowerCase().includes('spring')) ||
          title.includes('spring') || title.includes('fresh');
      }
      // Summer (Jun-Aug)
      if (month >= 5 && month <= 7) {
        return tags.some(tag => tag.toLowerCase().includes('summer')) ||
          title.includes('summer') || title.includes('grill') || title.includes('bbq');
      }
      // Fall (Sep-Nov)
      if (month >= 8 && month <= 10) {
        return tags.some(tag => tag.toLowerCase().includes('fall')) ||
          tags.some(tag => tag.toLowerCase().includes('autumn')) ||
          title.includes('pumpkin') || title.includes('apple');
      }
      // Winter (Dec-Feb)
      return tags.some(tag => tag.toLowerCase().includes('winter')) ||
        title.includes('warm') || title.includes('comfort');
    },
  },
  [CHALLENGE_TYPES.COMFORT_FOOD]: {
    id: CHALLENGE_TYPES.COMFORT_FOOD,
    name: 'Comfort Food',
    emoji: '🍜',
    description: 'Cook a comfort food recipe',
    xpReward: 55,
    category: 'special',
    check: recipe => {
      const tags = recipe.tags || [];
      const title = (recipe.title || '').toLowerCase();
      return tags.some(tag => tag.toLowerCase().includes('comfort')) ||
        title.includes('comfort') || title.includes('mac and cheese') ||
        title.includes('lasagna') || title.includes('casserole');
    },
  },
  [CHALLENGE_TYPES.ADVENTURE_TIME]: {
    id: CHALLENGE_TYPES.ADVENTURE_TIME,
    name: 'Adventure Time',
    emoji: '🗺️',
    description: 'Try a completely new recipe type',
    xpReward: 80,
    category: 'special',
    check: (recipe, userStats) => {
      const cookedTypes = JSON.parse(localStorage.getItem('stats:cookedTypes:v1') || '[]');
      const dishTypes = recipe.dishTypes || [];
      const newTypes = dishTypes.filter(type => !cookedTypes.includes(type));
      return newTypes.length > 0;
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
 * Get week key (for weekly challenges)
 */
function getWeekKey() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  return `${startOfWeek.getFullYear()}-W${Math.ceil(startOfWeek.getDate() / 7)}`;
}

/**
 * Get daily challenges for today (ENHANCED - More challenges!)
 */
export function getDailyChallenges() {
  try {
    const todayKey = getTodayKey();
    const stored = JSON.parse(localStorage.getItem(DAILY_CHALLENGE_KEY) || '{}');

    if (stored.date === todayKey && stored.challenges) {
      // Mark completed challenges
      return stored.challenges.map(ch => ({
        ...ch,
        completed: isChallengeCompleted(ch.id, todayKey),
      }));
    }

    // Generate new challenges for today
    const challengeTypes = Object.keys(CHALLENGES);
    const numChallenges = canUseUnlimitedChallenges() ? 5 : 3; // More challenges for premium

    // Categorize challenges for variety
    const categories = {
      speed: challengeTypes.filter(id => CHALLENGES[id]?.category === 'speed'),
      cuisine: challengeTypes.filter(id => CHALLENGES[id]?.category === 'cuisine'),
      dietary: challengeTypes.filter(id => CHALLENGES[id]?.category === 'dietary'),
      health: challengeTypes.filter(id => CHALLENGES[id]?.category === 'health'),
      skill: challengeTypes.filter(id => CHALLENGES[id]?.category === 'skill'),
      special: challengeTypes.filter(id => CHALLENGES[id]?.category === 'special'),
    };

    // Pick diverse challenges
    const selected = [];
    const usedCategories = new Set();
    
    // Ensure variety - pick from different categories
    while (selected.length < numChallenges && selected.length < challengeTypes.length) {
      const availableCategories = Object.keys(categories).filter(cat => 
        categories[cat].length > 0 && !usedCategories.has(cat)
      );
      
      if (availableCategories.length === 0) {
        // If all categories used, allow repeats
        const allAvailable = challengeTypes.filter(id => !selected.includes(id));
        if (allAvailable.length === 0) break;
        const randomId = allAvailable[Math.floor(Math.random() * allAvailable.length)];
        selected.push(randomId);
      } else {
        const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const categoryChallenges = categories[randomCategory].filter(id => !selected.includes(id));
        if (categoryChallenges.length > 0) {
          const randomId = categoryChallenges[Math.floor(Math.random() * categoryChallenges.length)];
          selected.push(randomId);
          usedCategories.add(randomCategory);
        }
      }
    }

    const challenges = selected.map(id => ({
      ...CHALLENGES[id],
      completed: false,
    }));

    // Store for today
    localStorage.setItem(
      DAILY_CHALLENGE_KEY,
      JSON.stringify({
        date: todayKey,
        challenges,
      })
    );

    return challenges;
  } catch (error) {
    console.error('Error getting daily challenges:', error);
    return [];
  }
}

/**
 * Get weekly challenges
 */
export function getWeeklyChallenges() {
  try {
    const weekKey = getWeekKey();
    const stored = JSON.parse(localStorage.getItem(WEEKLY_CHALLENGE_KEY) || '{}');

    if (stored.week === weekKey && stored.challenges) {
      return stored.challenges.map(ch => ({
        ...ch,
        completed: isChallengeCompleted(ch.id, weekKey),
      }));
    }

    // Generate weekly challenges (bigger, more rewarding)
    const weeklyChallengeTypes = [
      CHALLENGE_TYPES.SPEED_MASTER,
      CHALLENGE_TYPES.CUISINE_EXPLORER,
      CHALLENGE_TYPES.STREAK_WARRIOR,
      CHALLENGE_TYPES.ADVENTURE_TIME,
    ];

    const selected = weeklyChallengeTypes.slice(0, 2).map(id => ({
      ...CHALLENGES[id],
      completed: false,
      xpReward: CHALLENGES[id].xpReward * 2, // Double XP for weekly challenges
    }));

    localStorage.setItem(
      WEEKLY_CHALLENGE_KEY,
      JSON.stringify({
        week: weekKey,
        challenges: selected,
      })
    );

    return selected;
  } catch (error) {
    console.error('Error getting weekly challenges:', error);
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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

/**
 * Get weekly challenge progress
 */
export function getWeeklyChallengeProgress() {
  const challenges = getWeeklyChallenges();
  const completed = challenges.filter(c => c.completed).length;
  return {
    total: challenges.length,
    completed,
    progress: challenges.length > 0 ? (completed / challenges.length) * 100 : 0,
  };
}
