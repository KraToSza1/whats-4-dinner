import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast.jsx';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import {
  initializeCurrency,
  getCurrencySettings,
  setCurrency,
  convertToLocal,
  convertToUSD,
  formatCurrency,
  getCurrencyInfo,
  getAvailableCurrencies,
} from '../utils/currency.js';
import {
  getSpendingHistory,
  getSpendingByCategory,
  getBudgetPeriods,
  getPeriodSpending,
  getPeriodComparison,
  getCostPerMeal,
  getMostExpensiveRecipes,
  getBudgetRecommendations,
  getPriceTrends,
  getSavingsPotential,
  getBudgetHealthScore,
  exportBudgetData,
  BUDGET_CATEGORIES,
} from '../utils/budgetAnalytics.js';
import { BarChart, LineChart, DonutChart, ProgressRing } from './SimpleChart.jsx';

const STORAGE_KEY = 'budget:tracker:v2';
const PRICE_LOG_KEY = 'budget:prices:v1';
const SPENDING_LOG_KEY = 'budget:spending:v1';
const RECIPE_COST_KEY = 'budget:recipe:costs:v1';

// Common ingredient price estimates (per unit) in USD
const ESTIMATED_PRICES_USD = {
  chicken: 2.5,
  beef: 4.0,
  pork: 3.0,
  fish: 5.0,
  tofu: 1.5,
  eggs: 0.3,
  tomato: 1.5,
  onion: 0.8,
  garlic: 2.0,
  potato: 0.6,
  carrot: 0.7,
  broccoli: 1.2,
  spinach: 2.0,
  rice: 0.5,
  pasta: 0.8,
  flour: 0.4,
  bread: 1.0,
  milk: 0.6,
  cheese: 3.0,
  butter: 2.5,
  yogurt: 1.0,
  'olive oil': 3.0,
  'vegetable oil': 1.5,
  salt: 0.2,
  pepper: 2.0,
};

function readBudgetSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeBudgetSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function readPriceLogs() {
  try {
    return JSON.parse(localStorage.getItem(PRICE_LOG_KEY) || '{}');
  } catch {
    return {};
  }
}

function writePriceLogs(logs) {
  localStorage.setItem(PRICE_LOG_KEY, JSON.stringify(logs));
}

function readSpendingLogs() {
  try {
    return JSON.parse(localStorage.getItem(SPENDING_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeSpendingLogs(logs) {
  localStorage.setItem(SPENDING_LOG_KEY, JSON.stringify(logs));
}

function estimateIngredientPriceUSD(ingredientName, amount, unit) {
  const lowerName = ingredientName.toLowerCase();
  const priceLogs = readPriceLogs();
  const savedPrice = priceLogs[lowerName];
  if (savedPrice) {
    return savedPrice * (amount || 1);
  }

  for (const [key, price] of Object.entries(ESTIMATED_PRICES_USD)) {
    if (lowerName.includes(key)) {
      let normalizedAmount = amount || 1;
      if (unit?.toLowerCase().includes('kg')) normalizedAmount *= 10;
      else if (unit?.toLowerCase().includes('g')) normalizedAmount /= 100;
      else if (unit?.toLowerCase().includes('lb')) normalizedAmount *= 0.45;
      else if (unit?.toLowerCase().includes('oz')) normalizedAmount *= 0.028;
      return price * normalizedAmount;
    }
  }

  return 1.0;
}

export async function calculateRecipeCost(ingredients, servings, currency = null) {
  if (!ingredients || !Array.isArray(ingredients)) return null;

  let totalCostUSD = 0;
  ingredients.forEach(ing => {
    const amount = parseFloat(ing.amount) || 0;
    const unit = ing.unit || '';
    const name = ing.name || ing.original || '';
    const cost = estimateIngredientPriceUSD(name, amount, unit);
    totalCostUSD += cost;
  });

  const costPerServingUSD = servings > 0 ? totalCostUSD / servings : totalCostUSD;
  const settings = getCurrencySettings();
  const targetCurrency = currency || settings.currency;

  if (targetCurrency !== 'USD') {
    const totalCostLocal = await convertToLocal(totalCostUSD);
    const costPerServingLocal = await convertToLocal(costPerServingUSD);

    return {
      totalUSD: Math.round(totalCostUSD * 100) / 100,
      perServingUSD: Math.round(costPerServingUSD * 100) / 100,
      total: Math.round(totalCostLocal * 100) / 100,
      perServing: Math.round(costPerServingLocal * 100) / 100,
      currency: targetCurrency,
    };
  }

  return {
    totalUSD: Math.round(totalCostUSD * 100) / 100,
    perServingUSD: Math.round(costPerServingUSD * 100) / 100,
    total: Math.round(totalCostUSD * 100) / 100,
    perServing: Math.round(costPerServingUSD * 100) / 100,
    currency: 'USD',
  };
}

export default function BudgetTracker() {
  const toast = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(readBudgetSettings());
  const [priceLogs, setPriceLogs] = useState(readPriceLogs());
  const [spendingLogs, setSpendingLogs] = useState(readSpendingLogs());
  const [currencySettings, setCurrencySettings] = useState(null);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90, 365
  const [period, setPeriod] = useState('weekly'); // daily, weekly, monthly, yearly

  // Analytics data
  const [spendingHistory, setSpendingHistory] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [budgetPeriods, setBudgetPeriods] = useState(null);
  const [periodSpending, setPeriodSpending] = useState(null);
  const [periodComparison, setPeriodComparison] = useState(null);
  const [costPerMeal, setCostPerMeal] = useState(null);
  const [mostExpensiveRecipes, setMostExpensiveRecipes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savingsPotential, setSavingsPotential] = useState(null);
  const [budgetHealthScore, setBudgetHealthScore] = useState(null);
  const [weeklySpending, setWeeklySpending] = useState({ usd: 0, local: 0 });
  const [recipeTitleCache, setRecipeTitleCache] = useState(new Map());
  const [recipesLoadingTitles, setRecipesLoadingTitles] = useState(false);

  useEffect(() => {
    initializeCurrency().then(currency => {
      setCurrencySettings(currency);
      setLoading(false);

      if (!settings) {
        const defaultSettings = {
          enabled: false,
          weeklyBudget: 100,
          currency: currency.currency,
        };
        setSettings(defaultSettings);
      } else if (!settings.currency) {
        setSettings({ ...settings, currency: currency.currency });
      }
    });
  }, []);

  useEffect(() => {
    if (settings) {
      writeBudgetSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    writePriceLogs(priceLogs);
  }, [priceLogs]);

  useEffect(() => {
    writeSpendingLogs(spendingLogs);
  }, [spendingLogs]);

  useEffect(() => {
    if (settings?.enabled && currencySettings) {
      loadBudgetAnalytics();
      calculateWeeklySpending();
      fetchMissingRecipeTitles();
    }
  }, [settings, priceLogs, currencySettings, timeRange, period]);

  // Fetch recipe titles from Supabase for recipes that don't have titles
  const fetchMissingRecipeTitles = async (forceRefresh = false) => {
    try {
      setRecipesLoadingTitles(true);
      const recipeCosts = JSON.parse(localStorage.getItem(RECIPE_COST_KEY) || '{}');
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');

      // Collect all recipe IDs that need titles
      const recipeIdsNeedingTitles = [];
      const recipeIdSet = new Set();

      // Check recipe costs
      Object.keys(recipeCosts).forEach(id => {
        const cost = recipeCosts[id];
        const favorite = favorites.find(f => f.id === id);
        // If force refresh or no title found, add to fetch list
        if (forceRefresh || (!cost.title && !favorite?.title && !recipeIdSet.has(id))) {
          recipeIdsNeedingTitles.push(id);
          recipeIdSet.add(id);
        }
      });

      // Check meal plan
      Object.values(mealPlan).forEach(day => {
        if (day && typeof day === 'object') {
          Object.values(day).forEach(meal => {
            if (meal?.id && (forceRefresh || (!meal?.title && !recipeIdSet.has(meal.id)))) {
              recipeIdsNeedingTitles.push(meal.id);
              recipeIdSet.add(meal.id);
            }
          });
        }
      });

      if (recipeIdsNeedingTitles.length === 0) {
        setRecipesLoadingTitles(false);
        return;
      }

      console.log(`📝 [BUDGET] Fetching titles for ${recipeIdsNeedingTitles.length} recipes...`);

      // Fetch titles from Supabase in batches
      const { getSupabaseRecipeById } = await import('../api/supabaseRecipes.js');
      const { isUuid } = await import('../utils/img.ts');

      const newTitles = new Map();
      const updatedCosts = JSON.parse(localStorage.getItem(RECIPE_COST_KEY) || '{}');
      let hasUpdates = false;
      const batchSize = 5;

      for (let i = 0; i < recipeIdsNeedingTitles.length; i += batchSize) {
        const batch = recipeIdsNeedingTitles.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async id => {
            // Only fetch if it's a valid UUID (Supabase recipe)
            if (isUuid(id)) {
              try {
                const recipe = await getSupabaseRecipeById(id);
                if (recipe?.title) {
                  newTitles.set(id, recipe.title);

                  // Update recipe costs with title
                  if (updatedCosts[id]) {
                    updatedCosts[id] = {
                      ...updatedCosts[id],
                      title: recipe.title,
                    };
                    hasUpdates = true;
                  }
                }
              } catch (e) {
                console.warn(`Failed to fetch title for recipe ${id}:`, e);
              }
            }
          })
        );
      }

      if (hasUpdates) {
        localStorage.setItem(RECIPE_COST_KEY, JSON.stringify(updatedCosts));
      }

      if (newTitles.size > 0) {
        console.log(`✅ [BUDGET] Fetched ${newTitles.size} recipe titles`);
        setRecipeTitleCache(newTitles);
        // Reload analytics to show updated titles
        loadBudgetAnalytics();
      }

      setRecipesLoadingTitles(false);
    } catch (error) {
      console.warn('Failed to fetch missing recipe titles:', error);
      setRecipesLoadingTitles(false);
    }
  };

  // Fetch titles when Recipes tab is active
  useEffect(() => {
    if (activeTab === 'recipes' && settings?.enabled) {
      fetchMissingRecipeTitles();
    }
  }, [activeTab, settings?.enabled]);

  const loadBudgetAnalytics = () => {
    const days = parseInt(timeRange);
    setSpendingHistory(getSpendingHistory(days));
    setSpendingByCategory(getSpendingByCategory(days));
    setBudgetPeriods(getBudgetPeriods());
    setPeriodSpending(getPeriodSpending(period));
    setPeriodComparison(getPeriodComparison(period));
    setCostPerMeal(getCostPerMeal(days));
    setMostExpensiveRecipes(getMostExpensiveRecipes(10));
    setRecommendations(getBudgetRecommendations());
    setSavingsPotential(getSavingsPotential());
    setBudgetHealthScore(getBudgetHealthScore());
  };

  const calculateWeeklySpending = async () => {
    try {
      const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
      let totalCostUSD = 0;

      Object.values(mealPlan).forEach(day => {
        if (day && typeof day === 'object') {
          Object.values(day).forEach(meal => {
            if (meal?.ingredients) {
              let totalUSD = 0;
              meal.ingredients.forEach(ing => {
                const amount = parseFloat(ing.amount) || 0;
                const unit = ing.unit || '';
                const name = ing.name || ing.original || '';
                totalUSD += estimateIngredientPriceUSD(name, amount, unit);
              });
              totalCostUSD += totalUSD;
            }
          });
        }
      });

      const totalCostLocal = await convertToLocal(totalCostUSD);
      setWeeklySpending({ usd: totalCostUSD, local: totalCostLocal });
    } catch {
      setWeeklySpending({ usd: 0, local: 0 });
    }
  };

  const handleUpdatePrice = async (ingredientName, price) => {
    const lowerName = ingredientName.toLowerCase();
    const currentSettings = settings || { currency: currencySettings?.currency || 'USD' };
    const priceUSD = await convertToUSD(parseFloat(price) || 0, currentSettings.currency);

    setPriceLogs(prev => ({
      ...prev,
      [lowerName]: priceUSD,
    }));

    // Also log price history
    const priceHistory = JSON.parse(localStorage.getItem('budget:price:logs:v1') || '[]');
    priceHistory.push({
      ingredient: lowerName,
      price: priceUSD,
      date: new Date().toISOString(),
      currency: 'USD',
    });
    localStorage.setItem('budget:price:logs:v1', JSON.stringify(priceHistory));

    toast.success(`Saved price for ${ingredientName}`);
  };

  const handleAddSpending = async (name, amount, category = 'other') => {
    const currentSettings = settings || { currency: currencySettings?.currency || 'USD' };
    const amountUSD = await convertToUSD(parseFloat(amount) || 0, currentSettings.currency);

    const newLog = {
      name,
      amount: amountUSD,
      amountLocal: parseFloat(amount) || 0,
      category,
      date: new Date().toISOString(),
      currency: currentSettings.currency,
    };

    setSpendingLogs(prev => [...prev, newLog]);
    toast.success(`Added spending: ${name}`);
  };

  const handleCurrencyChange = currency => {
    const currentSettings = settings || {
      enabled: false,
      weeklyBudget: 100,
      currency: currencySettings?.currency || 'USD',
    };
    const newSettings = { ...currentSettings, currency };
    setSettings(newSettings);
    setCurrency(currency);
    setShowCurrencySelector(false);
    toast.success(`Currency changed to ${currency}`);
  };

  const handleExport = () => {
    try {
      const data = exportBudgetData();
      if (!data) {
        toast.error('Failed to export data');
        return;
      }

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Budget data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const sliceAmount = days <= 7 ? days : days <= 30 ? 7 : 14;

    return {
      spendingHistory: spendingHistory.slice(-sliceAmount).map(day => ({
        label: new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        value: day.total,
      })),
      categorySpending: spendingByCategory.map(cat => ({
        label: BUDGET_CATEGORIES[cat.category]?.name || cat.category,
        value: cat.total,
      })),
    };
  }, [spendingHistory, spendingByCategory, timeRange]);

  if (loading || !currencySettings) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">💰</div>
          <p className="text-slate-600 dark:text-slate-400">Loading currency settings...</p>
        </div>
      </div>
    );
  }

  const currentSettings = settings || {
    enabled: false,
    weeklyBudget: 100,
    currency: currencySettings.currency,
  };

  if (!currentSettings.enabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Budget Tracker</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Track recipe costs and stay within budget
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Weekly Food Budget
            </label>
            <button
              onClick={() => setShowCurrencySelector(!showCurrencySelector)}
              className="text-xs px-2 py-1 rounded bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {getCurrencyInfo(currentSettings.currency).symbol} {currentSettings.currency} ▼
            </button>
          </div>

          {showCurrencySelector && (
            <div className="mb-3 p-3 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-green-200 dark:border-green-800 max-h-48 overflow-y-auto">
              <div className="text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Select Currency:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableCurrencies()
                  .slice(0, 15)
                  .map(curr => (
                    <motion.button
                      key={curr.code}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`px-2 py-1 rounded text-xs ${
                        currentSettings.currency === curr.code
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {curr.symbol} {curr.code}
                    </motion.button>
                  ))}
              </div>
            </div>
          )}

          <input
            type="number"
            value={currentSettings.weeklyBudget}
            onChange={e =>
              setSettings({ ...currentSettings, weeklyBudget: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-green-500 focus:outline-none mb-3"
            placeholder="e.g. 100"
            min="0"
            step="0.01"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSettings({ ...currentSettings, enabled: true })}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md transition-all"
          >
            Enable Budget Tracking
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const remaining = Math.max(0, currentSettings.weeklyBudget - weeklySpending.local);
  const percentage =
    currentSettings.weeklyBudget > 0
      ? Math.min(100, (weeklySpending.local / currentSettings.weeklyBudget) * 100)
      : 0;

  const currencyInfo = getCurrencyInfo(currentSettings.currency);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'spending', label: 'Spending', icon: '💸' },
    { id: 'analysis', label: 'Analysis', icon: '📈' },
    { id: 'recipes', label: 'Recipes', icon: '🍽️' },
    { id: 'insights', label: 'Insights', icon: '💡' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white truncate">
                Budget Tracker
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Weekly budget:{' '}
                {formatCurrency(currentSettings.weeklyBudget, currentSettings.currency)}
                {currencySettings.autoDetected && (
                  <span className="text-xs ml-2">🌍 Auto-detected</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-xs sm:text-sm font-semibold border border-green-200 dark:border-green-800 touch-manipulation flex-1 sm:flex-none min-w-[100px]"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
            <button
              onClick={handleExport}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-xs sm:text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-1 touch-manipulation flex-1 sm:flex-none justify-center"
            >
              <span className="text-sm sm:text-base">📥</span>
              <span className="hidden xs:inline">Export</span>
            </button>
            <button
              onClick={() => setShowCurrencySelector(!showCurrencySelector)}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-xs sm:text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors touch-manipulation flex-1 sm:flex-none justify-center"
            >
              {currencyInfo.symbol}{' '}
              <span className="hidden sm:inline">{currentSettings.currency}</span>
            </button>
            <button
              onClick={() => setSettings({ ...currentSettings, enabled: false })}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-xs sm:text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors touch-manipulation flex-1 sm:flex-none justify-center"
            >
              Disable
            </button>
          </div>
        </div>

        {showCurrencySelector && (
          <div className="mb-4 p-3 sm:p-4 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-xs sm:text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Select Currency:
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto overscroll-contain">
              {getAvailableCurrencies().map(curr => (
                <motion.button
                  key={curr.code}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCurrencyChange(curr.code)}
                  className={`px-2 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs font-medium touch-manipulation ${
                    currentSettings.currency === curr.code
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {curr.symbol} {curr.code}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Budget Progress */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 border border-green-200 dark:border-green-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">
                {formatCurrency(weeklySpending.local, currentSettings.currency)}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                of {formatCurrency(currentSettings.weeklyBudget, currentSettings.currency)} spent
              </div>
              {currentSettings.currency !== 'USD' && (
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-1">
                  ≈ ${weeklySpending.usd.toFixed(2)} USD
                </div>
              )}
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div
                className={`text-base sm:text-lg font-semibold ${
                  remaining > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(remaining, currentSettings.currency)} remaining
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className={`h-full rounded-full ${
                percentage <= 80
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : percentage <= 95
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{percentage.toFixed(0)}%</span>
            {remaining > 0 && (
              <span>{formatCurrency(remaining, currentSettings.currency)} remaining</span>
            )}
            {remaining <= 0 && <span className="text-red-600">Over budget!</span>}
          </div>
        </div>

        {/* Budget Health Score */}
        {budgetHealthScore !== null && (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 mb-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Budget Health Score
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {budgetHealthScore}/100
                </div>
              </div>
              <div className="w-[60px] h-[60px] sm:w-20 sm:h-20 flex-shrink-0">
                <ProgressRing value={budgetHealthScore} max={100} size={60} color="emerald" />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto overscroll-x-contain scrollbar-hide -mx-3 sm:-mx-0 px-3 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap touch-manipulation flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="text-base sm:text-lg">{tab.icon}</span>
            <span className="text-xs sm:text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {budgetPeriods && (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600 break-words">
                      {formatCurrency(budgetPeriods.daily, currentSettings.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Daily Budget
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 break-words">
                      {formatCurrency(budgetPeriods.weekly, currentSettings.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Weekly Budget
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 break-words">
                      {formatCurrency(budgetPeriods.monthly, currentSettings.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Monthly Budget
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-pink-600 break-words">
                      {formatCurrency(budgetPeriods.yearly, currentSettings.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Yearly Budget
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Spending Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
              <h3 className="text-base sm:text-lg font-bold mb-4">
                Spending History ({timeRange} days)
              </h3>
              <div className="min-w-[300px]">
                <BarChart data={chartData.spendingHistory} height={250} color="emerald" />
              </div>
            </div>

            {/* Category Breakdown */}
            {spendingByCategory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4">Spending by Category</h3>
                <div className="flex items-center justify-center mb-4 overflow-x-auto">
                  <div className="flex-shrink-0">
                    <DonutChart data={chartData.categorySpending} size={200} />
                  </div>
                </div>
                <div className="space-y-2">
                  {spendingByCategory.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-lg sm:text-xl flex-shrink-0">
                          {BUDGET_CATEGORIES[cat.category]?.icon || '📦'}
                        </span>
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {BUDGET_CATEGORIES[cat.category]?.name || cat.category}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-sm sm:text-base">
                          {formatCurrency(cat.total, currentSettings.currency)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                          {cat.count} transactions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      rec.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : rec.type === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div>
                        <div className="font-semibold mb-1">{rec.title}</div>
                        <div className="text-sm opacity-90">{rec.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'spending' && (
          <motion.div
            key="spending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Period Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <label className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                  Period:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm touch-manipulation ${
                        period === p
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Period Comparison */}
            {periodComparison && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4">Period Comparison</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      This {period}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">
                      {formatCurrency(periodComparison.thisPeriod.total, currentSettings.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {periodComparison.thisPeriod.transactions} transactions
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Last {period}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                      {formatCurrency(periodComparison.lastPeriod.total, currentSettings.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {periodComparison.lastPeriod.transactions} transactions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span
                    className={`font-semibold ${
                      periodComparison.trend === 'up'
                        ? 'text-red-600'
                        : periodComparison.trend === 'down'
                          ? 'text-green-600'
                          : 'text-slate-600'
                    }`}
                  >
                    {periodComparison.change > 0 ? '↑' : periodComparison.change < 0 ? '↓' : '→'}{' '}
                    {Math.abs(periodComparison.change)}%
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">vs last {period}</span>
                </div>
              </div>
            )}

            {/* Spending History Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
              <h3 className="text-base sm:text-lg font-bold mb-4">Spending Trend</h3>
              <div className="min-w-[300px]">
                <LineChart data={chartData.spendingHistory} height={300} color="emerald" />
              </div>
            </div>

            {/* Recent Spending */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold mb-4">Recent Spending</h3>
              <div className="space-y-2">
                {spendingLogs
                  .slice(-10)
                  .reverse()
                  .map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base truncate">
                          {log.name}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {new Date(log.date).toLocaleDateString()} •{' '}
                          {BUDGET_CATEGORIES[log.category]?.name || log.category}
                        </div>
                      </div>
                      <div className="font-bold text-sm sm:text-base flex-shrink-0">
                        {formatCurrency(log.amountLocal || log.amount, currentSettings.currency)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Cost Per Meal */}
            {costPerMeal && costPerMeal.totalMeals > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4">Cost Per Meal Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Avg Cost/Meal
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">
                      {formatCurrency(costPerMeal.avgCostPerMeal, currentSettings.currency)}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Avg Cost/Serving
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                      {formatCurrency(costPerMeal.avgCostPerServing, currentSettings.currency)}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Total Meals
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {costPerMeal.totalMeals}
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Total cost: {formatCurrency(costPerMeal.totalCost, currentSettings.currency)}
                </div>
              </div>
            )}

            {/* Savings Potential */}
            {savingsPotential && (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-4">Savings Potential</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="text-xs sm:text-sm opacity-90 mb-1">Weekly Savings</div>
                    <div className="text-2xl sm:text-3xl font-bold break-words">
                      {formatCurrency(
                        savingsPotential.potentialWeeklySavings,
                        currentSettings.currency
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm opacity-90 mb-1">Monthly Savings</div>
                    <div className="text-2xl sm:text-3xl font-bold break-words">
                      {formatCurrency(
                        savingsPotential.potentialMonthlySavings,
                        currentSettings.currency
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 text-xs sm:text-sm opacity-90">
                  Target:{' '}
                  {formatCurrency(savingsPotential.targetCostPerMeal, currentSettings.currency)} per
                  meal • {savingsPotential.mealsOverTarget} meals over target
                </div>
              </div>
            )}

            {/* Period Spending Breakdown */}
            {periodSpending && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4">
                  Current {period.charAt(0).toUpperCase() + period.slice(1)} Spending
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Total
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">
                      {formatCurrency(periodSpending.total, currentSettings.currency)}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Average
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                      {formatCurrency(periodSpending.average, currentSettings.currency)}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Transactions
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {periodSpending.transactions}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'recipes' && (
          <motion.div
            key="recipes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Most Expensive Recipes */}
            {mostExpensiveRecipes.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold">Most Expensive Recipes</h3>
                  {recipesLoadingTitles && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Loading titles...
                    </div>
                  )}
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {mostExpensiveRecipes.map((recipe, idx) => {
                    // Get recipe image from favorites or meal plan
                    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                    const favorite = favorites.find(f => f.id === recipe.recipeId);
                    const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
                    let recipeImage = favorite?.image || favorite?.hero_image_url;

                    // Try to find image from meal plan
                    if (!recipeImage) {
                      Object.values(mealPlan).forEach(day => {
                        if (day && typeof day === 'object') {
                          Object.values(day).forEach(meal => {
                            if (
                              meal?.id === recipe.recipeId &&
                              (meal.image || meal.hero_image_url)
                            ) {
                              recipeImage = meal.image || meal.hero_image_url;
                            }
                          });
                        }
                      });
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer touch-manipulation gap-3"
                        onClick={() => navigate(`/recipe/${recipe.recipeId}`)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {recipeImage ? (
                            <img
                              src={recipeImg(recipeImage, recipe.recipeId)}
                              alt={recipe.title}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                              onError={e => {
                                fallbackOnce(e);
                                // Show fallback number if image fails
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg sm:text-xl flex-shrink-0 ${recipeImage ? 'hidden' : ''}`}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base truncate">
                              {recipe.title}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              {formatCurrency(recipe.costPerServing, recipe.currency)} per serving
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg sm:text-xl font-bold text-emerald-600">
                            {formatCurrency(recipe.totalCost, recipe.currency)}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                            total
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cost Per Meal Breakdown */}
            {costPerMeal && costPerMeal.meals.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4">Meal Costs Breakdown</h3>
                <div className="space-y-2">
                  {costPerMeal.meals.slice(0, 10).map((meal, idx) => {
                    // Get recipe image from meal plan
                    const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
                    let recipeImage = null;

                    Object.values(mealPlan).forEach(day => {
                      if (day && typeof day === 'object') {
                        Object.values(day).forEach(planMeal => {
                          if (
                            planMeal?.id === meal.recipeId &&
                            (planMeal.image || planMeal.hero_image_url)
                          ) {
                            recipeImage = planMeal.image || planMeal.hero_image_url;
                          }
                        });
                      }
                    });

                    // Also check favorites
                    if (!recipeImage) {
                      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                      const favorite = favorites.find(f => f.id === meal.recipeId);
                      recipeImage = favorite?.image || favorite?.hero_image_url;
                    }

                    const mealTypeEmojis = {
                      breakfast: '🍳',
                      lunch: '🥗',
                      dinner: '🍽️',
                    };

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer touch-manipulation"
                        onClick={() => navigate(`/recipe/${meal.recipeId}`)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {recipeImage ? (
                            <img
                              src={recipeImg(recipeImage, meal.recipeId)}
                              alt={meal.recipeTitle}
                              className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                              onError={e => {
                                fallbackOnce(e);
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${recipeImage ? 'hidden' : ''}`}
                          >
                            {mealTypeEmojis[meal.mealType] || '🍽️'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm sm:text-base truncate">
                              {meal.recipeTitle}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              {new Date(meal.date).toLocaleDateString()} •{' '}
                              {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-sm sm:text-base">
                            {formatCurrency(meal.cost, currentSettings.currency)}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                            {formatCurrency(meal.costPerServing, currentSettings.currency)}/serving
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Budget Health */}
            {budgetHealthScore !== null && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4">Budget Health</h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] mx-auto">
                    <ProgressRing value={budgetHealthScore} max={100} size={120} color="emerald" />
                  </div>
                </div>
                <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {budgetHealthScore >= 80
                    ? '🎉 Excellent budget management!'
                    : budgetHealthScore >= 60
                      ? '👍 Good job staying on track!'
                      : '💪 Keep working on your budget goals!'}
                </p>
              </div>
            )}

            {/* Savings Potential */}
            {savingsPotential && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-bold mb-4">💡 Savings Insights</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs sm:text-sm opacity-90 mb-1">
                      Potential Weekly Savings
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold break-words">
                      {formatCurrency(
                        savingsPotential.potentialWeeklySavings,
                        currentSettings.currency
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm opacity-90 mb-1">
                      Potential Monthly Savings
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold break-words">
                      {formatCurrency(
                        savingsPotential.potentialMonthlySavings,
                        currentSettings.currency
                      )}
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm opacity-90">
                    {savingsPotential.mealsOverTarget} meals exceed your target cost of{' '}
                    {formatCurrency(savingsPotential.targetCostPerMeal, currentSettings.currency)}{' '}
                    per meal
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Budget Recommendations</h3>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      rec.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : rec.type === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div>
                        <div className="font-semibold mb-1">{rec.title}</div>
                        <div className="text-sm opacity-90">{rec.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export async function getRecipeCost(recipe) {
  if (!recipe?.extendedIngredients) return null;
  const servings = recipe.servings || 4;
  const cost = await calculateRecipeCost(recipe.extendedIngredients, servings);

  // Store recipe cost for analytics (including title)
  if (cost && recipe.id) {
    try {
      const recipeCosts = JSON.parse(localStorage.getItem(RECIPE_COST_KEY) || '{}');
      recipeCosts[recipe.id] = {
        ...cost,
        title: recipe.title || recipeCosts[recipe.id]?.title || null, // Preserve existing title if new one is missing
      };
      localStorage.setItem(RECIPE_COST_KEY, JSON.stringify(recipeCosts));
    } catch {}
  }

  return cost;
}
