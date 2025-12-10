import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecipeAnalytics } from '../utils/adminStats';
import { BarChart, DonutChart } from './SimpleChart';
import {
  TrendingUp,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Award,
} from 'lucide-react';

export default function RecipeAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await getRecipeAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading recipe analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-5 sm:h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 sm:w-48 mb-3 sm:mb-4"></div>
            <div className="h-48 sm:h-64 bg-slate-200 dark:bg-slate-700 rounded-lg sm:rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-12 border-2 border-slate-200 dark:border-slate-700 text-center">
        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400">Failed to load analytics</p>
      </div>
    );
  }

  // Prepare chart data
  const cuisineData = Object.entries(analytics.cuisineDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const mealTypeData = Object.entries(analytics.mealTypeDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const difficultyData = Object.entries(analytics.difficultyDistribution || {}).map(
    ([name, value]) => ({ name, value })
  );

  const metricCards = [
    {
      title: 'Popular Recipes',
      value: analytics.popularRecipes.length,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Avg Prep Time',
      value: `${analytics.avgPrepTime} min`,
      icon: Clock,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Avg Cook Time',
      value: `${analytics.avgCookTime} min`,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Missing Data',
      value: analytics.missingImages + analytics.missingNutrition,
      icon: AlertCircle,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      subtitle: `${analytics.missingImages} images, ${analytics.missingNutrition} nutrition`,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 shrink-0" />
            <span className="truncate">Recipe Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Insights into your recipe database
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base touch-manipulation min-h-[44px] w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </motion.button>
      </div>

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`
                relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 shadow-lg
                ${card.bgColor} ${card.borderColor}
              `}
            >
              {/* Gradient Background */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl`}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shrink-0`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {index === 0 && (
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse shrink-0" />
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
                  {card.title}
                </h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuisine Distribution */}
        {cuisineData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Cuisines</h3>
            </div>
            <BarChart
              data={cuisineData}
              xKey="name"
              yKey="value"
              color="blue"
              height={300}
            />
          </motion.div>
        )}

        {/* Meal Type Distribution */}
        {mealTypeData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Meal Types</h3>
            </div>
            <DonutChart data={mealTypeData} height={300} />
          </motion.div>
        )}

        {/* Difficulty Distribution */}
        {difficultyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Difficulty Levels
              </h3>
            </div>
            <BarChart
              data={difficultyData}
              xKey="name"
              yKey="value"
              color="purple"
              height={300}
            />
          </motion.div>
        )}
      </div>

      {/* Enhanced Popular Recipes List */}
      {analytics.popularRecipes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Recipes</h3>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {analytics.popularRecipes.slice(0, 10).map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900 dark:to-transparent rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {recipe.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {recipe.cuisine && recipe.cuisine.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            {recipe.cuisine[0]}
                          </span>
                        )}
                        {recipe.difficulty && (
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                            {recipe.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {recipe.created_at
                      ? new Date(recipe.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
