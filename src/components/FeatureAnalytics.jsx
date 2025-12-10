import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  getFeatureUsageStats,
  getDailyFeatureUsage,
  FEATURES,
} from '../utils/featureTracking';
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  Calendar,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { BarChart } from './SimpleChart';

export default function FeatureAnalytics() {
  const [stats, setStats] = useState(null);
  const [dailyUsage, setDailyUsage] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(() => {
    setLoading(true);
    try {
      const usageStats = getFeatureUsageStats(selectedPeriod);
      const daily = getDailyFeatureUsage(selectedPeriod);
      setStats(usageStats);
      setDailyUsage(daily);
    } catch (error) {
      console.error('Error loading feature analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);


  const featureLabels = {
    [FEATURES.CALORIE_TRACKER]: { name: 'Calorie Tracker', icon: '🔥', color: 'from-red-500 to-orange-500' },
    [FEATURES.MEAL_PLANNER]: { name: 'Meal Planner', icon: '📅', color: 'from-blue-500 to-cyan-500' },
    [FEATURES.GROCERY_LIST]: { name: 'Grocery List', icon: '🛒', color: 'from-green-500 to-emerald-500' },
    [FEATURES.RECIPE_SEARCH]: { name: 'Recipe Search', icon: '🔍', color: 'from-purple-500 to-pink-500' },
    [FEATURES.RECIPE_COOK]: { name: 'Recipe Cook', icon: '👨‍🍳', color: 'from-orange-500 to-red-500' },
    [FEATURES.RECIPE_FAVORITE]: { name: 'Favorites', icon: '❤️', color: 'from-pink-500 to-rose-500' },
    [FEATURES.BUDGET_TRACKER]: { name: 'Budget Tracker', icon: '💰', color: 'from-yellow-500 to-amber-500' },
    [FEATURES.WATER_TRACKER]: { name: 'Water Tracker', icon: '💧', color: 'from-blue-400 to-cyan-400' },
    [FEATURES.CHALLENGES]: { name: 'Challenges', icon: '🎯', color: 'from-purple-500 to-indigo-500' },
    [FEATURES.STREAKS]: { name: 'Streaks', icon: '🔥', color: 'from-orange-500 to-red-500' },
    [FEATURES.BADGES]: { name: 'Badges', icon: '🏆', color: 'from-yellow-500 to-orange-500' },
    [FEATURES.XP_SYSTEM]: { name: 'XP System', icon: '⭐', color: 'from-yellow-400 to-yellow-600' },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-12 border-2 border-slate-200 dark:border-slate-700 text-center">
        <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4 animate-spin" />
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Loading feature analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-12 border-2 border-slate-200 dark:border-slate-700 text-center">
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No analytics data available</p>
      </div>
    );
  }

  // Prepare chart data
  const featureChartData = Object.entries(stats.featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([feature, count]) => ({
      name: featureLabels[feature]?.name || feature,
      value: count,
    }));

  const dailyChartData = dailyUsage.map(day => ({
    name: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.total,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 shrink-0" />
            <span className="truncate">Feature Usage Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track which features users are engaging with
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(parseInt(e.target.value))}
            className="px-3 sm:px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm sm:text-base touch-manipulation min-h-[44px]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadAnalytics}
            className="px-3 sm:px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation min-h-[44px] w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 opacity-80 shrink-0" />
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm opacity-90 mb-1">Total Usage</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.totalUsage.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 opacity-80 shrink-0" />
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm opacity-90 mb-1">Unique Users</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 opacity-80 shrink-0" />
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm opacity-90 mb-1">Active Features</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold">{Object.keys(stats.featureCounts).length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 opacity-80 shrink-0" />
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm opacity-90 mb-1">Avg per User</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold">
            {stats.uniqueUsers > 0
              ? Math.round(stats.totalUsage / stats.uniqueUsers)
              : 0}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Features Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
            <span>Top Features</span>
          </h3>
          {featureChartData.length > 0 ? (
            <BarChart
              data={featureChartData}
              labelKey="name"
              valueKey="value"
              color="purple"
              height={300}
            />
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-12">
              No feature usage data yet
            </p>
          )}
        </motion.div>

        {/* Daily Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Daily Usage Trend
          </h3>
          {dailyChartData.length > 0 ? (
            <BarChart
              data={dailyChartData}
              labelKey="name"
              valueKey="value"
              color="blue"
              height={300}
            />
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-12">
              No daily usage data yet
            </p>
          )}
        </motion.div>
      </div>

      {/* Feature Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Feature Usage Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Feature
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Usage Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Unique Users
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {stats.featureUsers
                .sort((a, b) => b.userCount - a.userCount)
                .map((feature, index) => {
                  const label = featureLabels[feature.feature];
                  const usageCount = stats.featureCounts[feature.feature] || 0;
                  const percentage = stats.totalUsage > 0
                    ? ((usageCount / stats.totalUsage) * 100).toFixed(1)
                    : 0;

                  return (
                    <motion.tr
                      key={feature.feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {label && (
                            <span className="text-2xl">{label.icon}</span>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {label?.name || feature.feature}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {usageCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {feature.userCount}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.05 + 0.2 }}
                              className={`h-full bg-gradient-to-r ${
                                label?.color || 'from-purple-500 to-pink-500'
                              }`}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* User Feature Usage */}
      {stats.userFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            User Feature Engagement
          </h3>
          <div className="space-y-3">
            {stats.userFeatures
              .sort((a, b) => b.featureCount - a.featureCount)
              .slice(0, 20)
              .map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.email || `User ${user.userId.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last active: {new Date(user.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                      {user.featureCount} features
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.features.map(feature => {
                      const label = featureLabels[feature];
                      return (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                        >
                          {label?.icon} {label?.name || feature}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

