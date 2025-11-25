/**
 * Analytics utilities - Aggregate and analyze all user data
 */

// Recipe view tracking
const VIEW_KEY = 'analytics:recipe:views';
const INTERACTION_KEY = 'analytics:recipe:interactions';

export function trackRecipeView(recipeId) {
  try {
    const views = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    const today = new Date().toISOString().split('T')[0];
    if (!views[today]) views[today] = {};
    views[today][recipeId] = (views[today][recipeId] || 0) + 1;
    localStorage.setItem(VIEW_KEY, JSON.stringify(views));
  } catch (e) {
    console.warn('[Analytics] Failed to track view', e);
  }
}

export function trackRecipeInteraction(recipeId, type, data = {}) {
  try {
    const interactions = JSON.parse(localStorage.getItem(INTERACTION_KEY) || '[]');
    interactions.push({
      recipeId,
      type, // "view", "favorite", "add_to_plan", "add_to_grocery", "rate", "share"
      timestamp: new Date().toISOString(),
      ...data,
    });
    // Keep last 1000 interactions
    if (interactions.length > 1000) {
      interactions.splice(0, interactions.length - 1000);
    }
    localStorage.setItem(INTERACTION_KEY, JSON.stringify(interactions));
  } catch (e) {
    console.warn('[Analytics] Failed to track interaction', e);
  }
}

export function getRecipeViews(days = 30) {
  try {
    const views = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayViews = views[dateStr] || {};
      const total = Object.values(dayViews).reduce((sum, count) => sum + count, 0);
      result.push({
        date: dateStr,
        total,
        unique: Object.keys(dayViews).length,
      });
    }
    return result;
  } catch {
    return [];
  }
}

export function getTopRecipes(limit = 10) {
  try {
    const views = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    const recipeCounts = {};

    Object.values(views).forEach(dayViews => {
      Object.entries(dayViews).forEach(([recipeId, count]) => {
        recipeCounts[recipeId] = (recipeCounts[recipeId] || 0) + count;
      });
    });

    return Object.entries(recipeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([recipeId, count]) => ({ recipeId, count }));
  } catch {
    return [];
  }
}

export function getCalorieHistory(days = 30) {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];
      const total = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

      // Calculate macros if available
      const macros = {
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      result.push({
        date: dateStr,
        calories: total,
        meals: dayMeals.length,
        macros,
      });
    }
    return result;
  } catch {
    return [];
  }
}

export function getMealPlanStats() {
  try {
    const plan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
    const stats = {
      totalMeals: 0,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      daysPlanned: 0,
    };

    Object.values(plan).forEach(day => {
      if (day && typeof day === 'object') {
        let hasMeals = false;
        if (day.breakfast) {
          stats.breakfast++;
          stats.totalMeals++;
          hasMeals = true;
        }
        if (day.lunch) {
          stats.lunch++;
          stats.totalMeals++;
          hasMeals = true;
        }
        if (day.dinner) {
          stats.dinner++;
          stats.totalMeals++;
          hasMeals = true;
        }
        if (hasMeals) stats.daysPlanned++;
      }
    });

    return stats;
  } catch {
    return {
      totalMeals: 0,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      daysPlanned: 0,
    };
  }
}

export function getFavoritesStats() {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const ratings = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('recipeRating:')) {
        const recipeId = key.replace('recipeRating:', '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.rating) {
          ratings[recipeId] = data.rating;
        }
      }
    }

    const ratedFavorites = favorites.filter(f => ratings[f.id]);
    const avgRating =
      ratedFavorites.length > 0
        ? ratedFavorites.reduce((sum, f) => sum + (ratings[f.id] || 0), 0) / ratedFavorites.length
        : 0;

    return {
      total: favorites.length,
      rated: ratedFavorites.length,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  } catch {
    return { total: 0, rated: 0, avgRating: 0 };
  }
}

export function getNutritionalInsights() {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const profile = JSON.parse(localStorage.getItem('calorie:tracker:v1') || 'null');
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];
      const total = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      last7Days.push(total);
    }

    const avgCalories = last7Days.reduce((sum, cal) => sum + cal, 0) / last7Days.length;
    const maxCalories = Math.max(...last7Days, 0);
    const minCalories = Math.min(...last7Days.filter(c => c > 0), 0) || 0;

    return {
      avgCalories: Math.round(avgCalories),
      maxCalories,
      minCalories,
      trend: last7Days[6] > last7Days[0] ? 'up' : last7Days[6] < last7Days[0] ? 'down' : 'stable',
      profile: profile
        ? {
            goal: profile.goal,
            activityLevel: profile.activityLevel,
            trainingFrequency: profile.trainingFrequency,
            bodyFat: profile.bodyFat,
            proteinTarget: profile.proteinTarget,
          }
        : null,
    };
  } catch {
    return {
      avgCalories: 0,
      maxCalories: 0,
      minCalories: 0,
      trend: 'stable',
      profile: null,
    };
  }
}

export function getCalorieProfileData() {
  try {
    const profile = JSON.parse(localStorage.getItem('calorie:tracker:v1') || 'null');
    if (!profile) return null;

    return {
      goal: profile.goal || 'maintain',
      activityLevel: profile.activityLevel || 'moderate',
      trainingFrequency: profile.trainingFrequency || '3-4',
      bodyFat: profile.bodyFat || null,
      proteinTarget: profile.proteinTarget || null,
      weight: profile.weight || null,
      height: profile.height || null,
      age: profile.age || null,
      gender: profile.gender || 'male',
      createdAt: profile.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getActivitySummary() {
  try {
    const interactions = JSON.parse(localStorage.getItem(INTERACTION_KEY) || '[]');
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recent = interactions.filter(i => new Date(i.timestamp) > last30Days);

    const byType = {};
    recent.forEach(interaction => {
      byType[interaction.type] = (byType[interaction.type] || 0) + 1;
    });

    return {
      totalInteractions: recent.length,
      byType,
      mostActiveDay: getMostActiveDay(recent),
    };
  } catch {
    return { totalInteractions: 0, byType: {}, mostActiveDay: null };
  }
}

function getMostActiveDay(interactions) {
  const dayCounts = {};
  interactions.forEach(i => {
    const date = new Date(i.timestamp).toISOString().split('T')[0];
    dayCounts[date] = (dayCounts[date] || 0) + 1;
  });

  const maxDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];
  return maxDay ? { date: maxDay[0], count: maxDay[1] } : null;
}

// ========== ADVANCED ANALYTICS FUNCTIONS ==========

/**
 * Get macro tracking data (protein, carbs, fats)
 */
export function getMacroHistory(days = 30) {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];

      const macros = {
        protein: dayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
        carbs: dayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
        fats: dayMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0),
        fiber: dayMeals.reduce((sum, meal) => sum + (meal.fiber || 0), 0),
      };

      result.push({
        date: dateStr,
        ...macros,
        totalCalories: dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      });
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Get macro distribution percentages
 */
export function getMacroDistribution(days = 7) {
  try {
    const history = getMacroHistory(days);
    const totals = history.reduce(
      (acc, day) => ({
        protein: acc.protein + day.protein * 4, // 4 cal/g
        carbs: acc.carbs + day.carbs * 4, // 4 cal/g
        fats: acc.fats + day.fats * 9, // 9 cal/g
      }),
      { protein: 0, carbs: 0, fats: 0 }
    );

    const totalCals = totals.protein + totals.carbs + totals.fats;
    if (totalCals === 0) return { protein: 0, carbs: 0, fats: 0 };

    return {
      protein: Math.round((totals.protein / totalCals) * 100),
      carbs: Math.round((totals.carbs / totalCals) * 100),
      fats: Math.round((totals.fats / totalCals) * 100),
    };
  } catch {
    return { protein: 0, carbs: 0, fats: 0 };
  }
}

/**
 * Get recipe diversity score (how many unique recipes cooked)
 */
export function getRecipeDiversity(days = 30) {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const uniqueRecipes = new Set();
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];
      dayMeals.forEach(meal => {
        if (meal.recipeId) uniqueRecipes.add(meal.recipeId);
      });
    }

    const totalMeals = Object.values(mealLogs).reduce(
      (sum, dayMeals) => sum + (Array.isArray(dayMeals) ? dayMeals.length : 0),
      0
    );
    const diversityScore = totalMeals > 0 ? Math.round((uniqueRecipes.size / totalMeals) * 100) : 0;

    return {
      uniqueRecipes: uniqueRecipes.size,
      totalMeals,
      diversityScore: Math.min(100, diversityScore * 10), // Scale up for better visibility
    };
  } catch {
    return { uniqueRecipes: 0, totalMeals: 0, diversityScore: 0 };
  }
}

/**
 * Get cooking time patterns
 */
export function getCookingTimePatterns() {
  try {
    const interactions = JSON.parse(localStorage.getItem(INTERACTION_KEY) || '[]');
    const timePatterns = {
      morning: 0, // 6am - 12pm
      afternoon: 0, // 12pm - 6pm
      evening: 0, // 6pm - 12am
      night: 0, // 12am - 6am
    };

    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      if (hour >= 6 && hour < 12) timePatterns.morning++;
      else if (hour >= 12 && hour < 18) timePatterns.afternoon++;
      else if (hour >= 18 && hour < 24) timePatterns.evening++;
      else timePatterns.night++;
    });

    return timePatterns;
  } catch {
    return { morning: 0, afternoon: 0, evening: 0, night: 0 };
  }
}

/**
 * Get consistency score (how consistent calorie logging is)
 */
export function getConsistencyScore(days = 30) {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const today = new Date();
    let daysWithLogs = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];
      if (dayMeals.length > 0) daysWithLogs++;
    }

    return Math.round((daysWithLogs / days) * 100);
  } catch {
    return 0;
  }
}

/**
 * Get streak information
 */
export function getStreaks() {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check current streak
    for (let i = 0; i >= -365; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];

      if (dayMeals.length > 0) {
        if (i === 0 || currentStreak > 0) {
          currentStreak++;
          tempStreak++;
        }
      } else {
        if (i < 0) break; // Stop if we hit a gap
        tempStreak = 0;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      current: currentStreak,
      longest: longestStreak,
    };
  } catch {
    return { current: 0, longest: 0 };
  }
}

/**
 * Get goal progress
 */
export function getGoalProgress() {
  try {
    const profile = JSON.parse(localStorage.getItem('calorie:tracker:v1') || 'null');
    if (!profile) return null;

    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = mealLogs[today] || [];
    const todayCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

    // Calculate goal calories
    const weight = parseFloat(profile.weight) || 70;
    const height = parseFloat(profile.height) || 170;
    const age = parseFloat(profile.age) || 30;
    const gender = profile.gender || 'male';

    const bmr =
      gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.55));
    let goalCalories = tdee;

    if (profile.goal === 'lose') {
      const rate = parseFloat(profile.rate) || 0.5;
      const weeklyDeficit = rate * 7700;
      goalCalories = Math.max(1200, Math.round(tdee - weeklyDeficit / 7));
    } else if (profile.goal === 'gain') {
      const rate = parseFloat(profile.rate) || 0.5;
      const weeklySurplus = rate * 7700;
      goalCalories = Math.round(tdee + weeklySurplus / 7);
    }

    const progress = Math.min(100, Math.round((todayCalories / goalCalories) * 100));

    return {
      goal: goalCalories,
      current: todayCalories,
      remaining: Math.max(0, goalCalories - todayCalories),
      progress,
      onTrack: progress >= 80 && progress <= 120, // Within 20% of goal
    };
  } catch {
    return null;
  }
}

/**
 * Get weekly comparison (this week vs last week)
 */
export function getWeeklyComparison() {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const today = new Date();

    // This week
    const thisWeek = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];
      thisWeek.push(dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0));
    }

    // Last week
    const lastWeek = [];
    for (let i = 13; i >= 7; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];
      lastWeek.push(dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0));
    }

    const thisWeekAvg = thisWeek.reduce((a, b) => a + b, 0) / 7;
    const lastWeekAvg = lastWeek.reduce((a, b) => a + b, 0) / 7;
    const change = lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;

    return {
      thisWeek: {
        total: thisWeek.reduce((a, b) => a + b, 0),
        average: Math.round(thisWeekAvg),
        daily: thisWeek,
      },
      lastWeek: {
        total: lastWeek.reduce((a, b) => a + b, 0),
        average: Math.round(lastWeekAvg),
        daily: lastWeek,
      },
      change: Math.round(change * 10) / 10,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    };
  } catch {
    return null;
  }
}

/**
 * Get ingredient frequency analysis
 */
export function getIngredientFrequency(days = 30) {
  try {
    const mealLogs = JSON.parse(localStorage.getItem('calorie:meals:v1') || '{}');
    const ingredientCounts = {};
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealLogs[dateStr] || [];

      dayMeals.forEach(meal => {
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ing => {
            const name = ing.name?.toLowerCase() || ing.toLowerCase();
            ingredientCounts[name] = (ingredientCounts[name] || 0) + 1;
          });
        }
      });
    }

    const topIngredients = Object.entries(ingredientCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return topIngredients;
  } catch {
    return [];
  }
}

/**
 * Get budget analytics (if available)
 */
export function getBudgetAnalytics(days = 30) {
  try {
    const priceLogs = JSON.parse(localStorage.getItem('budget:price:logs:v1') || '[]');
    const spendingLogs = JSON.parse(localStorage.getItem('budget:spending:logs:v1') || '[]');
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentSpending = spendingLogs.filter(log => new Date(log.date) >= cutoffDate);
    const totalSpent = recentSpending.reduce((sum, log) => sum + (parseFloat(log.amount) || 0), 0);
    const avgDaily = totalSpent / days;

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgDaily: Math.round(avgDaily * 100) / 100,
      transactions: recentSpending.length,
      days,
    };
  } catch {
    return { totalSpent: 0, avgDaily: 0, transactions: 0, days };
  }
}

/**
 * Export analytics data as JSON
 */
export function exportAnalyticsData() {
  try {
    const data = {
      recipeViews: getRecipeViews(365),
      calorieHistory: getCalorieHistory(365),
      macroHistory: getMacroHistory(365),
      mealPlanStats: getMealPlanStats(),
      favoritesStats: getFavoritesStats(),
      nutritionalInsights: getNutritionalInsights(),
      activitySummary: getActivitySummary(),
      profileData: getCalorieProfileData(),
      streaks: getStreaks(),
      goalProgress: getGoalProgress(),
      weeklyComparison: getWeeklyComparison(),
      recipeDiversity: getRecipeDiversity(365),
      consistencyScore: getConsistencyScore(365),
      cookingTimePatterns: getCookingTimePatterns(),
      ingredientFrequency: getIngredientFrequency(365),
      budgetAnalytics: getBudgetAnalytics(365),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return null;
  }
}
