import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { getSupabaseRecipeById } from '../api/supabaseRecipes.js';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import {
  getRecipeViews,
  getTopRecipes,
  getCalorieHistory,
  getMealPlanStats,
  getFavoritesStats,
  getNutritionalInsights,
  getActivitySummary,
  getCalorieProfileData,
  getMacroHistory,
  getMacroDistribution,
  getRecipeDiversity,
  getCookingTimePatterns,
  getConsistencyScore,
  getStreaks,
  getGoalProgress,
  getWeeklyComparison,
  getIngredientFrequency,
  getBudgetAnalytics,
  exportAnalyticsData,
} from '../utils/analytics.js';
import { BarChart, LineChart, ProgressRing, DonutChart } from '../components/SimpleChart.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90, 365
  const [topRecipes, setTopRecipes] = useState([]);

  // Analytics data
  const [viewsData, setViewsData] = useState([]);
  const [calorieData, setCalorieData] = useState([]);
  const [macroData, setMacroData] = useState([]);
  const [mealStats, setMealStats] = useState(null);
  const [favoritesStats, setFavoritesStats] = useState(null);
  const [nutritionalInsights, setNutritionalInsights] = useState(null);
  const [activitySummary, setActivitySummary] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [macroDistribution, setMacroDistribution] = useState(null);
  const [recipeDiversity, setRecipeDiversity] = useState(null);
  const [cookingTimePatterns, setCookingTimePatterns] = useState(null);
  const [consistencyScore, setConsistencyScore] = useState(0);
  const [streaks, setStreaks] = useState(null);
  const [goalProgress, setGoalProgress] = useState(null);
  const [weeklyComparison, setWeeklyComparison] = useState(null);
  const [ingredientFrequency, setIngredientFrequency] = useState([]);
  const [budgetAnalytics, setBudgetAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);

      // Load all analytics data
      const views = getRecipeViews(days);
      const calories = getCalorieHistory(days);
      const macros = getMacroHistory(days);

      console.log('[Analytics] Loaded data:', {
        viewsCount: views.length,
        caloriesCount: calories.length,
        macrosCount: macros.length,
        sampleViews: views.slice(0, 3),
        sampleCalories: calories.slice(0, 3),
      });

      setViewsData(views);
      setCalorieData(calories);
      setMacroData(macros);
      setMealStats(getMealPlanStats());
      setFavoritesStats(getFavoritesStats());
      setNutritionalInsights(getNutritionalInsights());
      setActivitySummary(getActivitySummary());
      setProfileData(getCalorieProfileData());
      setMacroDistribution(getMacroDistribution(7));
      setRecipeDiversity(getRecipeDiversity(days));
      setCookingTimePatterns(getCookingTimePatterns());
      setConsistencyScore(getConsistencyScore(days));
      setStreaks(getStreaks());
      setGoalProgress(getGoalProgress());
      setWeeklyComparison(getWeeklyComparison());
      setIngredientFrequency(getIngredientFrequency(days));
      setBudgetAnalytics(getBudgetAnalytics(days));

      // Load top recipes with full data
      const top = getTopRecipes(10);
      console.log('[Analytics] Top recipes from storage:', top);

      // First, try to get from favorites (fastest)
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

      const recipesWithData = await Promise.all(
        top.map(async item => {
          let recipe = null;
          let title = null;

          // Try favorites first (fastest, no API call)
          const favRecipe = favorites.find(f => {
            const favId = f.id?.toString();
            const itemId = item.recipeId?.toString();
            return (
              favId === itemId ||
              favId === item.recipeId ||
              favId?.includes(itemId) ||
              itemId?.includes(favId)
            );
          });

          if (favRecipe) {
            recipe = favRecipe;
            title = favRecipe.title || favRecipe.name;
            console.log('[Analytics] Found in favorites:', title);
          } else {
            // Try Supabase (only if it's a UUID)
            try {
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                item.recipeId
              );
              if (isUuid) {
                console.log('[Analytics] Fetching from Supabase:', item.recipeId);
                recipe = await getSupabaseRecipeById(item.recipeId);
                if (recipe) {
                  title = recipe.title;
                  console.log('[Analytics] Fetched from Supabase:', title);
                }
              }
            } catch (err) {
              console.error('[Analytics] Error fetching recipe:', item.recipeId, err);
            }
          }

          return {
            ...item,
            recipe: recipe,
            title: title || `Recipe ${item.recipeId?.substring(0, 8)}...`,
          };
        })
      );

      console.log(
        '[Analytics] Final recipes:',
        recipesWithData.map(r => ({
          id: r.recipeId,
          title: r.title,
          hasRecipe: !!r.recipe,
        }))
      );
      setTopRecipes(recipesWithData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const data = exportAnalyticsData();
      if (!data) {
        toast.error('Failed to export data');
        return;
      }

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Analytics data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const sliceAmount = days <= 7 ? days : days <= 30 ? 7 : 14;

    const dailyViews = viewsData
      .slice(-sliceAmount)
      .map(v => {
        try {
          return {
            label: new Date(v.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            value: Number(v.total) || 0,
          };
        } catch {
          return { label: v.date || 'Unknown', value: Number(v.total) || 0 };
        }
      })
      .filter(d => d.value >= 0);

    const dailyCalories = calorieData
      .slice(-sliceAmount)
      .map(c => {
        try {
          return {
            label: new Date(c.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            value: Number(c.calories) || 0,
          };
        } catch {
          return { label: c.date || 'Unknown', value: Number(c.calories) || 0 };
        }
      })
      .filter(d => d.value >= 0);

    const weeklyViews = viewsData
      .map(v => {
        try {
          return {
            label: new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Number(v.total) || 0,
          };
        } catch {
          return { label: v.date || 'Unknown', value: Number(v.total) || 0 };
        }
      })
      .filter(d => d.value >= 0);

    const weeklyCalories = calorieData
      .map(c => {
        try {
          return {
            label: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Number(c.calories) || 0,
          };
        } catch {
          return { label: c.date || 'Unknown', value: Number(c.calories) || 0 };
        }
      })
      .filter(d => d.value >= 0);

    console.log('[Analytics] Chart data prepared:', {
      dailyViews: dailyViews.length,
      dailyCalories: dailyCalories.length,
      weeklyViews: weeklyViews.length,
      weeklyCalories: weeklyCalories.length,
      sampleDailyViews: dailyViews.slice(0, 3),
      sampleDailyCalories: dailyCalories.slice(0, 3),
    });

    return {
      dailyViews,
      dailyCalories,
      weeklyViews,
      weeklyCalories,
      macroData: macroData.slice(-sliceAmount).map(m => ({
        label: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fats: Number(m.fats) || 0,
      })),
    };
  }, [viewsData, calorieData, macroData, timeRange]);

  // TEMPORARY: Allow access without login during development
  // Login check disabled - everyone can access analytics
  // if (!user) {
  //     return (
  //         <div className="min-h-screen flex items-center justify-center p-4">
  //             <div className="text-center">
  //                 <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
  //                 <button
  //                     onClick={() => navigate("/")}
  //                     className="px-4 py-2 rounded-md bg-emerald-600 text-white"
  //                 >
  //                     Go to Home
  //                 </button>
  //             </div>
  //         </div>
  //     );
  // }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'calories', label: 'Calories & Macros', icon: '🔥' },
    { id: 'recipes', label: 'Recipes', icon: '🍽️' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { id: 'activity', label: 'Activity', icon: '⚡' },
    { id: 'insights', label: 'Insights', icon: '💡' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <BackToHome />
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                className="px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm touch-manipulation"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={handleExport}
                className="px-3 sm:px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              >
                <span>📥</span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400">
            Comprehensive data visualization and insights about your cooking journey
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6 overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
          <div className="flex gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 min-w-max sm:min-w-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-3 md:px-4 py-2 rounded-t-lg transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap touch-manipulation text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 break-words">
                      {mealStats?.totalMeals || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Planned Meals
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 break-words">
                      {favoritesStats?.total || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Favorites
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 break-words">
                      {nutritionalInsights?.avgCalories || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Avg Daily Calories
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600 break-words">
                      {activitySummary?.totalInteractions || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Interactions ({timeRange}d)
                    </div>
                  </motion.div>
                </div>

                {/* Streaks & Achievements */}
                {(streaks || goalProgress) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {streaks && (
                      <>
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-white">
                          <div className="text-xs sm:text-sm opacity-90 mb-1">
                            🔥 Current Streak
                          </div>
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                            {streaks.current}
                          </div>
                          <div className="text-xs sm:text-sm opacity-75">days</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-white">
                          <div className="text-xs sm:text-sm opacity-90 mb-1">
                            🏆 Longest Streak
                          </div>
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                            {streaks.longest}
                          </div>
                          <div className="text-xs sm:text-sm opacity-75">days</div>
                        </div>
                      </>
                    )}
                    {goalProgress && (
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-white sm:col-span-2 md:col-span-1">
                        <div className="text-xs sm:text-sm opacity-90 mb-1">
                          🎯 Today's Progress
                        </div>
                        <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                          {goalProgress.progress}%
                        </div>
                        <div className="text-xs sm:text-sm opacity-75 break-words">
                          {goalProgress.current} / {goalProgress.goal} cal
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Recipe Views - Line Chart */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
                      Recipe Views Trend
                    </h3>
                    {(() => {
                      console.log('[Analytics Overview] Recipe Views Chart Data:', {
                        raw: chartData.dailyViews,
                        length: chartData.dailyViews?.length,
                        sample: chartData.dailyViews?.slice(0, 3),
                      });
                      return <LineChart data={chartData.dailyViews} height={250} color="blue" />;
                    })()}
                  </div>

                  {/* Calorie Intake - Line Chart */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
                      Calorie Intake Trend
                    </h3>
                    {(() => {
                      console.log('[Analytics Overview] Calorie Intake Chart Data:', {
                        raw: chartData.dailyCalories,
                        length: chartData.dailyCalories?.length,
                        sample: chartData.dailyCalories?.slice(0, 3),
                      });
                      return (
                        <LineChart data={chartData.dailyCalories} height={250} color="purple" />
                      );
                    })()}
                  </div>
                </div>

                {/* Consistency & Diversity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Consistency Score
                    </h3>
                    <div className="flex items-center justify-center">
                      <ProgressRing
                        value={consistencyScore}
                        max={100}
                        size={120}
                        color="emerald"
                        label="%"
                      />
                    </div>
                    <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 sm:mt-4 px-2">
                      {consistencyScore >= 80
                        ? '🎉 Excellent consistency!'
                        : consistencyScore >= 60
                          ? '👍 Good job!'
                          : '💪 Keep logging daily!'}
                    </p>
                  </div>
                  {recipeDiversity && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                        Recipe Diversity
                      </h3>
                      <div className="flex items-center justify-center">
                        <ProgressRing
                          value={recipeDiversity.diversityScore}
                          max={100}
                          size={120}
                          color="purple"
                          label="%"
                        />
                      </div>
                      <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 sm:mt-4 px-2 break-words">
                        {recipeDiversity.uniqueRecipes} unique recipes out of{' '}
                        {recipeDiversity.totalMeals} total meals
                      </p>
                    </div>
                  )}
                </div>

                {/* Meal Plan Distribution */}
                {mealStats && mealStats.totalMeals > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Meal Plan Distribution
                    </h3>
                    <div className="flex items-center justify-center overflow-x-auto">
                      <DonutChart
                        data={[
                          { label: 'Breakfast', value: mealStats.breakfast },
                          { label: 'Lunch', value: mealStats.lunch },
                          { label: 'Dinner', value: mealStats.dinner },
                        ].filter(d => d.value > 0)}
                        size={200}
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Breakfast: {mealStats.breakfast}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Lunch: {mealStats.lunch}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Dinner: {mealStats.dinner}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Calories & Macros Tab */}
            {activeTab === 'calories' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Goal Progress */}
                {goalProgress && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-white">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                      Today's Goal Progress
                    </h2>
                    <div className="mb-3 sm:mb-4">
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span className="break-words">
                          {goalProgress.current} / {goalProgress.goal} calories
                        </span>
                        <span className="ml-2 flex-shrink-0">{goalProgress.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 sm:h-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, goalProgress.progress)}%` }}
                          transition={{ duration: 1 }}
                          className="bg-white h-3 sm:h-4 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm opacity-90 break-words">
                      {goalProgress.remaining > 0
                        ? `${goalProgress.remaining} calories remaining`
                        : `${Math.abs(goalProgress.remaining)} calories over goal`}
                      {goalProgress.onTrack && ' ✅ On track!'}
                    </div>
                  </div>
                )}

                {/* Weekly Comparison */}
                {weeklyComparison && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                      Week Over Week Comparison
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          This Week
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">
                          {weeklyComparison.thisWeek.average} cal/day
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {weeklyComparison.thisWeek.total} total
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Last Week
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                          {weeklyComparison.lastWeek.average} cal/day
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {weeklyComparison.lastWeek.total} total
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                      <span
                        className={`font-semibold ${weeklyComparison.trend === 'up' ? 'text-red-600' : weeklyComparison.trend === 'down' ? 'text-green-600' : 'text-slate-600'}`}
                      >
                        {weeklyComparison.change > 0
                          ? '↑'
                          : weeklyComparison.change < 0
                            ? '↓'
                            : '→'}{' '}
                        {Math.abs(weeklyComparison.change)}%
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">vs last week</span>
                    </div>
                  </div>
                )}

                {/* Calorie Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Calorie Overview</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">
                        {nutritionalInsights?.avgCalories || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Average Daily
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                        {nutritionalInsights?.maxCalories || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Maximum
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600 break-words">
                        {nutritionalInsights?.minCalories || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Minimum
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro Distribution */}
                {macroDistribution && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Macro Distribution (Last 7 Days)
                    </h3>
                    <div className="flex items-center justify-center mb-3 sm:mb-4 overflow-x-auto">
                      <DonutChart
                        data={[
                          { label: 'Protein', value: macroDistribution.protein },
                          { label: 'Carbs', value: macroDistribution.carbs },
                          { label: 'Fats', value: macroDistribution.fats },
                        ]}
                        size={200}
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">
                          Protein: {macroDistribution.protein}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">
                          Carbs: {macroDistribution.carbs}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Fats: {macroDistribution.fats}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calorie Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
                    {timeRange}-Day Calorie History
                  </h3>
                  {(() => {
                    console.log('[Analytics Calories] Weekly Calories Chart Data:', {
                      raw: chartData.weeklyCalories,
                      length: chartData.weeklyCalories?.length,
                      sample: chartData.weeklyCalories?.slice(0, 5),
                    });
                    return (
                      <LineChart data={chartData.weeklyCalories} height={300} color="purple" />
                    );
                  })()}
                </div>

                {/* Daily Breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                    Daily Calorie Breakdown
                  </h3>
                  <div className="space-y-2">
                    {calorieData
                      .slice(-7)
                      .reverse()
                      .map((day, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 sm:gap-4 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm sm:text-base truncate">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              {day.meals} meal{day.meals !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-purple-600 flex-shrink-0">
                            {day.calories}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recipes Tab */}
            {activeTab === 'recipes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Recipe Views Chart - Line Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
                    Recipe Views Trend ({timeRange} Days)
                  </h3>
                  {(() => {
                    const viewsData = chartData.weeklyViews.slice(-14);
                    console.log('[Analytics Recipes] Weekly Views Chart Data:', {
                      raw: viewsData,
                      length: viewsData?.length,
                      sample: viewsData?.slice(0, 5),
                      allData: chartData.weeklyViews,
                    });
                    return <LineChart data={viewsData} height={300} color="blue" />;
                  })()}
                </div>

                {/* Top Recipes */}
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                    Most Viewed Recipes
                  </h3>
                  {loading && topRecipes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Loading recipe titles...
                      </p>
                    </div>
                  ) : topRecipes.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {topRecipes.map((item, idx) => {
                        const displayTitle = item.title || item.recipe?.title || item.recipe?.name;
                        const isIdOnly = !displayTitle || displayTitle.startsWith('Recipe ');
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors touch-manipulation ${
                              item.recipe
                                ? 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                                : 'opacity-75'
                            }`}
                            onClick={() => item.recipe && navigate(`/recipe/${item.recipeId}`)}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-semibold text-sm sm:text-base truncate ${isIdOnly ? 'text-slate-500 dark:text-slate-400 italic' : ''}`}
                                  title={displayTitle || item.recipeId}
                                >
                                  {displayTitle || `Recipe ${item.recipeId?.substring(0, 12)}...`}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  {item.count} view{item.count !== 1 ? 's' : ''}
                                  {isIdOnly && (
                                    <span className="ml-2 text-orange-500">(Title not found)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {item.recipe && (item.recipe.hero_image_url || item.recipe.image) ? (
                              <img
                                src={recipeImg(
                                  item.recipe.hero_image_url || item.recipe.image,
                                  item.recipe.id
                                )}
                                data-original-src={item.recipe.hero_image_url || item.recipe.image}
                                alt={displayTitle || 'Recipe'}
                                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={e => {
                                  if (import.meta.env.DEV) {
                                    console.error('[Analytics] top recipe image failed', {
                                      id: item.recipe?.id,
                                      src: e.currentTarget.src,
                                    });
                                  }
                                  fallbackOnce(e);
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🍽️</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center py-6 sm:py-8">
                      No recipe views yet. Start exploring recipes!
                    </p>
                  )}
                </div>

                {/* Favorites Stats */}
                {favoritesStats && favoritesStats.total > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Favorites Statistics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 break-words">
                          {favoritesStats.total}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Total Favorites
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-words">
                          {favoritesStats.rated}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Rated
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-words">
                          {favoritesStats.avgRating.toFixed(1)}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Avg Rating
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Nutrition Tab */}
            {activeTab === 'nutrition' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Profile Data */}
                {profileData && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                      Your Calorie Tracker Profile
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Fitness Goal
                        </div>
                        <div className="text-base sm:text-lg font-bold capitalize break-words">
                          {profileData.goal}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Activity Level
                        </div>
                        <div className="text-base sm:text-lg font-bold capitalize break-words">
                          {profileData.activityLevel}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Training Frequency
                        </div>
                        <div className="text-base sm:text-lg font-bold break-words">
                          {profileData.trainingFrequency || '3-4'} days/week
                        </div>
                      </div>
                      {profileData.bodyFat && (
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            Body Fat %
                          </div>
                          <div className="text-base sm:text-lg font-bold break-words">
                            {profileData.bodyFat}%
                          </div>
                        </div>
                      )}
                      {profileData.proteinTarget && (
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            Protein Target
                          </div>
                          <div className="text-base sm:text-lg font-bold break-words">
                            {profileData.proteinTarget}g/day
                          </div>
                        </div>
                      )}
                      {profileData.weight && (
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            Weight
                          </div>
                          <div className="text-base sm:text-lg font-bold break-words">
                            {profileData.weight} kg
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                    Nutritional Insights
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                    Track your nutritional progress and patterns
                  </p>
                  {nutritionalInsights && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Calorie Trend (7d)
                        </div>
                        <div className="text-base sm:text-lg font-bold capitalize flex items-center gap-2">
                          {nutritionalInsights.trend === 'up'
                            ? '📈'
                            : nutritionalInsights.trend === 'down'
                              ? '📉'
                              : '➡️'}
                          <span className="break-words">{nutritionalInsights.trend}</span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Average Daily
                        </div>
                        <div className="text-base sm:text-lg font-bold break-words">
                          {nutritionalInsights.avgCalories} cal
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Storage Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2">
                    <span>💾</span> Data Storage
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words">
                    <strong>All calorie tracker data is stored locally</strong> in your browser
                    (localStorage). This means your data stays on your device and is not sent to any
                    servers. To enable cloud sync across devices, connect your account to Supabase.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Activity Summary</h2>
                  {activitySummary && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="text-2xl sm:text-3xl font-bold text-emerald-600 break-words">
                        {activitySummary.totalInteractions}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                        Total interactions in the last 30 days
                      </div>
                      {Object.keys(activitySummary.byType).length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm sm:text-base">By Type:</h3>
                          <div className="space-y-1.5 sm:space-y-2">
                            {Object.entries(activitySummary.byType).map(([type, count]) => (
                              <div
                                key={type}
                                className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800 rounded"
                              >
                                <span className="capitalize text-xs sm:text-sm">{type}</span>
                                <span className="font-semibold text-xs sm:text-sm">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activitySummary.mostActiveDay && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            Most Active Day
                          </div>
                          <div className="font-semibold text-sm sm:text-base break-words">
                            {new Date(activitySummary.mostActiveDay.date).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {activitySummary.mostActiveDay.count} interactions
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cooking Time Patterns */}
                {cookingTimePatterns && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Cooking Time Patterns
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🌅</div>
                        <div className="text-lg sm:text-xl font-bold break-words">
                          {cookingTimePatterns.morning}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Morning
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xl sm:text-2xl mb-1 sm:mb-2">☀️</div>
                        <div className="text-lg sm:text-xl font-bold break-words">
                          {cookingTimePatterns.afternoon}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Afternoon
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🌆</div>
                        <div className="text-lg sm:text-xl font-bold break-words">
                          {cookingTimePatterns.evening}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Evening
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🌙</div>
                        <div className="text-lg sm:text-xl font-bold break-words">
                          {cookingTimePatterns.night}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Night
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Top Ingredients */}
                {ingredientFrequency.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Most Used Ingredients
                    </h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      {ingredientFrequency.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm flex-shrink-0">
                              {idx + 1}
                            </div>
                            <span className="font-semibold capitalize text-sm sm:text-base truncate">
                              {ing.name}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">
                            {ing.count} times
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget Analytics */}
                {budgetAnalytics && budgetAnalytics.transactions > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                      Budget Analytics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Total Spent
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">
                          ${budgetAnalytics.totalSpent}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Avg Daily
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words">
                          ${budgetAnalytics.avgDaily}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Transactions
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-purple-600 break-words">
                          {budgetAnalytics.transactions}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {recipeDiversity && (
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-white">
                      <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">
                        Recipe Diversity Score
                      </div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 break-words">
                        {recipeDiversity.diversityScore}%
                      </div>
                      <div className="text-xs sm:text-sm opacity-75 break-words">
                        {recipeDiversity.uniqueRecipes} unique recipes
                      </div>
                    </div>
                  )}
                  {consistencyScore > 0 && (
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-white">
                      <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">
                        Consistency Score
                      </div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 break-words">
                        {consistencyScore}%
                      </div>
                      <div className="text-xs sm:text-sm opacity-75 break-words">
                        {consistencyScore >= 80
                          ? 'Excellent logging!'
                          : consistencyScore >= 60
                            ? 'Good consistency'
                            : 'Keep it up!'}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
