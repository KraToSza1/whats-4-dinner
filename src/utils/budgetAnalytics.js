/**
 * Advanced Budget Analytics Utilities
 * Comprehensive budget tracking and analysis functions
 */

const STORAGE_KEY = 'budget:tracker:v2';
const PRICE_LOG_KEY = 'budget:prices:v1';
const SPENDING_LOG_KEY = 'budget:spending:v1';
const RECIPE_COST_KEY = 'budget:recipe:costs:v1';
const PRICE_HISTORY_KEY = 'budget:price:logs:v1';

// Budget categories
export const BUDGET_CATEGORIES = {
  groceries: { name: 'Groceries', icon: '🛒', color: 'emerald' },
  diningOut: { name: 'Dining Out', icon: '🍽️', color: 'blue' },
  mealPrep: { name: 'Meal Prep', icon: '🍱', color: 'purple' },
  snacks: { name: 'Snacks', icon: '🍪', color: 'orange' },
  beverages: { name: 'Beverages', icon: '🥤', color: 'teal' },
  other: { name: 'Other', icon: '📦', color: 'slate' },
};

function readBudgetSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function readPriceLogs() {
  try {
    return JSON.parse(localStorage.getItem(PRICE_LOG_KEY) || '{}');
  } catch {
    return {};
  }
}

function readPriceHistory() {
  try {
    return JSON.parse(localStorage.getItem(PRICE_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function readSpendingLogs() {
  try {
    return JSON.parse(localStorage.getItem(SPENDING_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function readRecipeCosts() {
  try {
    return JSON.parse(localStorage.getItem(RECIPE_COST_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Get spending history for a date range
 */
export function getSpendingHistory(days = 30) {
  try {
    const logs = readSpendingLogs();
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySpending = logs.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate === dateStr;
      });

      const total = daySpending.reduce((sum, log) => sum + (parseFloat(log.amount) || 0), 0);

      result.push({
        date: dateStr,
        total,
        transactions: daySpending.length,
        byCategory: daySpending.reduce((acc, log) => {
          const cat = log.category || 'other';
          acc[cat] = (acc[cat] || 0) + (parseFloat(log.amount) || 0);
          return acc;
        }, {}),
      });
    }

    return result;
  } catch {
    return [];
  }
}

/**
 * Get spending by category
 */
export function getSpendingByCategory(days = 30) {
  try {
    const logs = readSpendingLogs();
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recent = logs.filter(log => new Date(log.date) >= cutoffDate);
    const byCategory = {};

    recent.forEach(log => {
      const cat = log.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(log.amount) || 0);
    });

    return Object.entries(byCategory)
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
        count: recent.filter(log => (log.category || 'other') === category).length,
      }))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

/**
 * Get budget periods (daily, weekly, monthly, yearly)
 */
export function getBudgetPeriods() {
  try {
    const settings = readBudgetSettings();
    if (!settings) return null;

    const weeklyBudget = settings.weeklyBudget || 100;
    const dailyBudget = weeklyBudget / 7;
    const monthlyBudget = weeklyBudget * 4.33; // Average weeks per month
    const yearlyBudget = weeklyBudget * 52;

    return {
      daily: Math.round(dailyBudget * 100) / 100,
      weekly: Math.round(weeklyBudget * 100) / 100,
      monthly: Math.round(monthlyBudget * 100) / 100,
      yearly: Math.round(yearlyBudget * 100) / 100,
    };
  } catch {
    return null;
  }
}

/**
 * Get spending for a specific period
 */
export function getPeriodSpending(period = 'weekly') {
  try {
    const logs = readSpendingLogs();
    const today = new Date();
    let cutoffDate = new Date(today);

    switch (period) {
      case 'daily':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'weekly':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'monthly':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case 'yearly':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }

    const recent = logs.filter(log => new Date(log.date) >= cutoffDate);
    const total = recent.reduce((sum, log) => sum + (parseFloat(log.amount) || 0), 0);

    return {
      total: Math.round(total * 100) / 100,
      transactions: recent.length,
      average: recent.length > 0 ? Math.round((total / recent.length) * 100) / 100 : 0,
      byCategory: getSpendingByCategory(
        period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365
      ),
    };
  } catch {
    return { total: 0, transactions: 0, average: 0, byCategory: [] };
  }
}

/**
 * Get period comparison (this period vs last period)
 */
export function getPeriodComparison(period = 'weekly') {
  try {
    const today = new Date();
    let thisPeriodStart = new Date(today);
    let lastPeriodStart = new Date(today);
    let lastPeriodEnd = new Date(today);

    switch (period) {
      case 'weekly':
        // This week (last 7 days)
        thisPeriodStart.setDate(today.getDate() - 7);
        // Last week (7-14 days ago)
        lastPeriodStart.setDate(today.getDate() - 14);
        lastPeriodEnd.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        thisPeriodStart.setMonth(today.getMonth() - 1);
        lastPeriodStart.setMonth(today.getMonth() - 2);
        lastPeriodEnd.setMonth(today.getMonth() - 1);
        break;
      default:
        thisPeriodStart.setDate(today.getDate() - 7);
        lastPeriodStart.setDate(today.getDate() - 14);
        lastPeriodEnd.setDate(today.getDate() - 7);
    }

    const logs = readSpendingLogs();

    const thisPeriod = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= thisPeriodStart && logDate <= today;
    });

    const lastPeriod = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= lastPeriodStart && logDate < lastPeriodEnd;
    });

    const thisTotal = thisPeriod.reduce((sum, log) => sum + (parseFloat(log.amount) || 0), 0);
    const lastTotal = lastPeriod.reduce((sum, log) => sum + (parseFloat(log.amount) || 0), 0);

    const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

    return {
      thisPeriod: {
        total: Math.round(thisTotal * 100) / 100,
        transactions: thisPeriod.length,
        average:
          thisPeriod.length > 0 ? Math.round((thisTotal / thisPeriod.length) * 100) / 100 : 0,
      },
      lastPeriod: {
        total: Math.round(lastTotal * 100) / 100,
        transactions: lastPeriod.length,
        average:
          lastPeriod.length > 0 ? Math.round((lastTotal / lastPeriod.length) * 100) / 100 : 0,
      },
      change: Math.round(change * 10) / 10,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    };
  } catch {
    return null;
  }
}

/**
 * Get cost per meal analysis
 */
export function getCostPerMeal(days = 30) {
  try {
    const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
    const recipeCosts = readRecipeCosts();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    // Check recipe history for titles
    const recipeHistory = JSON.parse(localStorage.getItem('recipe:history:v1') || '{}');
    const historyRecipes = new Map();
    Object.entries(recipeHistory).forEach(([recipeId, entries]) => {
      if (entries && entries.length > 0 && entries[0]?.title) {
        historyRecipes.set(recipeId, entries[0].title);
      }
    });

    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const meals = [];
    Object.entries(mealPlan).forEach(([dateStr, day]) => {
      const mealDate = new Date(dateStr);
      if (mealDate >= cutoffDate && day && typeof day === 'object') {
        Object.entries(day).forEach(([mealType, meal]) => {
          if (meal?.id) {
            const cost = recipeCosts[meal.id] || null;
            if (cost) {
              // Try multiple sources for recipe title
              const favorite = favorites.find(f => f.id === meal.id);
              const historyTitle = historyRecipes.get(meal.id);

              // Try multiple sources for recipe title (priority: cost.title > meal.title > favorite > history)
              const recipeTitle =
                cost.title || meal.title || favorite?.title || historyTitle || null;

              // Generate a smarter fallback if no title found
              let displayTitle = recipeTitle;
              if (!recipeTitle) {
                // Show loading placeholder instead of ID
                displayTitle = 'Loading recipe name...';
              }

              meals.push({
                date: dateStr,
                mealType,
                recipeId: meal.id,
                recipeTitle: displayTitle,
                cost: parseFloat(cost.total) || 0,
                costPerServing: parseFloat(cost.perServing) || 0,
                servings: meal.servings || 4,
              });
            }
          }
        });
      }
    });

    const totalCost = meals.reduce((sum, meal) => sum + meal.cost, 0);
    const avgCostPerMeal = meals.length > 0 ? totalCost / meals.length : 0;
    const avgCostPerServing =
      meals.length > 0
        ? meals.reduce((sum, meal) => sum + meal.costPerServing, 0) / meals.length
        : 0;

    return {
      totalMeals: meals.length,
      totalCost: Math.round(totalCost * 100) / 100,
      avgCostPerMeal: Math.round(avgCostPerMeal * 100) / 100,
      avgCostPerServing: Math.round(avgCostPerServing * 100) / 100,
      meals: meals.sort((a, b) => b.cost - a.cost).slice(0, 10), // Top 10 most expensive
    };
  } catch {
    return { totalMeals: 0, totalCost: 0, avgCostPerMeal: 0, avgCostPerServing: 0, meals: [] };
  }
}

/**
 * Get most expensive recipes
 */
export function getMostExpensiveRecipes(limit = 10) {
  try {
    const recipeCosts = readRecipeCosts();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    // Also check meal plan for recipe titles
    const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
    const mealPlanRecipes = new Map();
    Object.values(mealPlan).forEach(day => {
      if (day && typeof day === 'object') {
        Object.values(day).forEach(meal => {
          if (meal?.id && meal?.title) {
            mealPlanRecipes.set(meal.id, meal.title);
          }
        });
      }
    });

    // Check recipe history for titles
    const recipeHistory = JSON.parse(localStorage.getItem('recipe:history:v1') || '{}');
    const historyRecipes = new Map();
    Object.entries(recipeHistory).forEach(([recipeId, entries]) => {
      if (entries && entries.length > 0 && entries[0]?.title) {
        historyRecipes.set(recipeId, entries[0].title);
      }
    });

    const recipes = Object.entries(recipeCosts)
      .map(([recipeId, cost]) => {
        // Try multiple sources for recipe title (in priority order)
        // Priority: cost.title (from Supabase fetch) > favorite > mealPlan > history
        const favorite = favorites.find(f => f.id === recipeId);
        const mealPlanTitle = mealPlanRecipes.get(recipeId);
        const historyTitle = historyRecipes.get(recipeId);

        // Check cost.title FIRST since that's where we store fetched titles
        const title = cost?.title || favorite?.title || mealPlanTitle || historyTitle || null;

        // Generate a smarter fallback if no title found
        let displayTitle = title;
        if (!title) {
          // Show a loading/placeholder message instead of ID
          displayTitle = 'Loading recipe name...';
        }

        return {
          recipeId,
          title: displayTitle,
          totalCost: parseFloat(cost.total) || 0,
          costPerServing: parseFloat(cost.perServing) || 0,
          currency: cost.currency || 'USD',
          hasTitle: !!title,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);

    return recipes;
  } catch {
    return [];
  }
}

/**
 * Get budget recommendations
 */
export function getBudgetRecommendations() {
  try {
    const settings = readBudgetSettings();
    if (!settings || !settings.enabled) return [];

    const weeklySpending = getPeriodSpending('weekly');
    const weeklyBudget = settings.weeklyBudget || 100;
    const percentage = (weeklySpending.total / weeklyBudget) * 100;

    const recommendations = [];

    if (percentage > 90) {
      recommendations.push({
        type: 'warning',
        title: 'Budget Alert',
        message: `You've spent ${percentage.toFixed(0)}% of your weekly budget. Consider budget-friendly recipes this week.`,
        icon: '⚠️',
      });
    }

    if (weeklySpending.total > weeklyBudget) {
      recommendations.push({
        type: 'error',
        title: 'Over Budget',
        message: `You're ${Math.round((weeklySpending.total - weeklyBudget) * 100) / 100} over budget. Try meal prep to save money!`,
        icon: '🚨',
      });
    }

    const categorySpending = getSpendingByCategory(7);
    const topCategory = categorySpending[0];
    if (topCategory && topCategory.total > weeklyBudget * 0.5) {
      recommendations.push({
        type: 'info',
        title: 'Category Insight',
        message: `Most spending is on ${BUDGET_CATEGORIES[topCategory.category]?.name || topCategory.category}. Consider alternatives.`,
        icon: '💡',
      });
    }

    const costPerMeal = getCostPerMeal(7);
    if (costPerMeal.avgCostPerMeal > weeklyBudget / 7) {
      recommendations.push({
        type: 'suggestion',
        title: 'Cost Per Meal',
        message: `Average meal cost is ${costPerMeal.avgCostPerMeal.toFixed(2)}. Look for recipes under ${(weeklyBudget / 7).toFixed(2)} per meal.`,
        icon: '💰',
      });
    }

    return recommendations;
  } catch {
    return [];
  }
}

/**
 * Get price trends for ingredients
 */
export function getPriceTrends(ingredientName, days = 30) {
  try {
    const priceHistory = readPriceHistory();
    const lowerName = ingredientName.toLowerCase();
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const ingredientLogs = priceHistory
      .filter(
        log => log.ingredient?.toLowerCase() === lowerName && new Date(log.date) >= cutoffDate
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (ingredientLogs.length === 0) return null;

    const prices = ingredientLogs.map(log => parseFloat(log.price) || 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const change = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    return {
      ingredient: ingredientName,
      currentPrice: Math.round(currentPrice * 100) / 100,
      averagePrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      change: Math.round(change * 10) / 10,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      dataPoints: ingredientLogs.length,
      history: ingredientLogs.map(log => ({
        date: log.date,
        price: parseFloat(log.price) || 0,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Get savings potential
 */
export function getSavingsPotential() {
  try {
    const costPerMeal = getCostPerMeal(30);
    const settings = readBudgetSettings();
    if (!settings) return null;

    const weeklyBudget = settings.weeklyBudget || 100;
    const targetCostPerMeal = (weeklyBudget / 7) * 0.8; // 80% of daily budget per meal

    const potentialSavings = costPerMeal.meals
      .filter(meal => meal.costPerServing > targetCostPerMeal)
      .reduce((sum, meal) => {
        const savings = meal.costPerServing - targetCostPerMeal;
        return sum + savings;
      }, 0);

    return {
      targetCostPerMeal: Math.round(targetCostPerMeal * 100) / 100,
      currentAvgCostPerMeal: costPerMeal.avgCostPerMeal,
      potentialWeeklySavings: Math.round(potentialSavings * 7 * 100) / 100,
      potentialMonthlySavings: Math.round(potentialSavings * 30 * 100) / 100,
      mealsOverTarget: costPerMeal.meals.filter(meal => meal.costPerServing > targetCostPerMeal)
        .length,
    };
  } catch {
    return null;
  }
}

/**
 * Get budget health score
 */
export function getBudgetHealthScore() {
  try {
    const settings = readBudgetSettings();
    if (!settings || !settings.enabled) return null;

    const weeklySpending = getPeriodSpending('weekly');
    const weeklyBudget = settings.weeklyBudget || 100;
    const percentage = (weeklySpending.total / weeklyBudget) * 100;

    let score = 100;

    // Deduct points for being over budget
    if (percentage > 100) {
      score -= Math.min(50, (percentage - 100) * 2);
    }

    // Deduct points for being close to budget
    if (percentage > 90) {
      score -= 10;
    }

    // Add points for consistency
    const consistency = getSpendingConsistency();
    score += consistency * 0.2;

    // Deduct points for high variance
    const variance = getSpendingVariance();
    if (variance > 30) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  } catch {
    return null;
  }
}

/**
 * Get spending consistency
 */
function getSpendingConsistency(days = 30) {
  try {
    const history = getSpendingHistory(days);
    const nonZeroDays = history.filter(day => day.total > 0).length;
    return Math.round((nonZeroDays / days) * 100);
  } catch {
    return 0;
  }
}

/**
 * Get spending variance
 */
function getSpendingVariance(days = 30) {
  try {
    const history = getSpendingHistory(days);
    const totals = history.map(day => day.total);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance = totals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / totals.length;
    const stdDev = Math.sqrt(variance);
    return avg > 0 ? Math.round((stdDev / avg) * 100) : 0;
  } catch {
    return 0;
  }
}

/**
 * Export budget data
 */
export function exportBudgetData() {
  try {
    const settings = readBudgetSettings();
    const spendingLogs = readSpendingLogs();
    const priceLogs = readPriceLogs();
    const recipeCosts = readRecipeCosts();

    const data = {
      settings,
      spendingHistory: getSpendingHistory(365),
      spendingByCategory: getSpendingByCategory(365),
      periodSpending: {
        daily: getPeriodSpending('daily'),
        weekly: getPeriodSpending('weekly'),
        monthly: getPeriodSpending('monthly'),
        yearly: getPeriodSpending('yearly'),
      },
      periodComparison: {
        weekly: getPeriodComparison('weekly'),
        monthly: getPeriodComparison('monthly'),
      },
      costPerMeal: getCostPerMeal(365),
      mostExpensiveRecipes: getMostExpensiveRecipes(20),
      savingsPotential: getSavingsPotential(),
      budgetHealthScore: getBudgetHealthScore(),
      rawSpendingLogs: readSpendingLogs(),
      rawPriceLogs: readPriceLogs(),
      rawPriceHistory: readPriceHistory(),
      rawRecipeCosts: readRecipeCosts(),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export budget data:', error);
    return null;
  }
}
