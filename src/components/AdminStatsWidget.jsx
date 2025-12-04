import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardStats, getRecentActivity } from '../utils/adminStats';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AdminStatsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(5),
      ]);
      setStats(statsData);
      setActivity(activityData);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Recipes',
      value: stats?.totalRecipes || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      trend: stats?.recipesToday || 0,
      trendLabel: 'today',
      trendUp: true,
      description: 'All recipes in database',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      trend: stats?.freeUsers || 0,
      trendLabel: 'free',
      trendUp: true,
      subtitle: `${stats?.paidUsers || 0} paid`,
      description: 'Registered users',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      trend: stats?.paidUsers || 0,
      trendLabel: 'total paid',
      trendUp: true,
      description: 'Active paid subscriptions',
    },
    {
      title: 'Recipes This Week',
      value: stats?.recipesThisWeek || 0,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      trend: stats?.recipesToday || 0,
      trendLabel: 'today',
      trendUp: true,
      description: 'New recipes added',
    },
  ];

  const issueCards = [
    {
      title: 'Missing Images',
      value: stats?.missingImages || 0,
      icon: ImageIcon,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      action: () => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('🔍 [ADMIN STATS] Clicked Missing Images, navigating to dedicated page...');
        }
        navigate('/admin/missing-images');
      },
    },
    {
      title: 'Missing Nutrition',
      value: stats?.missingNutrition || 0,
      icon: AlertCircle,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-300 dark:border-amber-700',
      action: () => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log(
            '🔍 [ADMIN STATS] Clicked Missing Nutrition, navigating to dedicated page...'
          );
        }
        navigate('/admin/missing-nutrition');
      },
    },
  ];

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards with Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === index;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className={`
                relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300
                ${card.bgColor} ${card.borderColor}
                ${isHovered ? 'shadow-xl shadow-slate-200 dark:shadow-slate-900' : 'shadow-md'}
              `}
            >
              {/* Gradient Background Effect */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-2xl transition-opacity duration-300 ${
                  isHovered ? 'opacity-20' : ''
                }`}
              />

              {/* Sparkle Effect on Hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-4 right-4"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg transform transition-transform ${
                      isHovered ? 'rotate-6 scale-110' : ''
                    }`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {card.trend !== undefined && card.trend > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className="flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-slate-800/50 rounded-lg"
                    >
                      {card.trendUp ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">
                        +{card.trend}
                      </span>
                    </motion.div>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  {card.title}
                </h3>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  className="text-4xl font-bold text-slate-900 dark:text-white mb-1"
                >
                  {card.value.toLocaleString()}
                </motion.p>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                    {card.subtitle}
                  </p>
                )}
                {card.trend !== undefined && card.trendLabel && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{card.trend}
                    </span>{' '}
                    {card.trendLabel}
                  </motion.p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {card.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Issue Cards with Animation */}
      {(stats?.missingImages > 0 || stats?.missingNutrition > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {issueCards
            .filter(
              card =>
                (card.title === 'Missing Images' && stats.missingImages > 0) ||
                (card.title === 'Missing Nutrition' && stats.missingNutrition > 0)
            )
            .map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (card.action) {
                      card.action();
                    }
                  }}
                  className={`
                    relative overflow-hidden rounded-2xl p-6 border-2 cursor-pointer
                    ${card.bgColor} ${card.borderColor}
                    shadow-lg hover:shadow-xl transition-all duration-300
                  `}
                >
                  {/* Animated Background */}
                  <div
                    className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl animate-pulse`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      </motion.div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2"
                    >
                      {card.value}
                    </motion.p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span>Click to view and fix</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </p>
                  </div>
                </motion.div>
              );
            })}
        </motion.div>
      )}

      {/* Recent Activity with Modern Design */}
      {activity && (activity.recentRecipes.length > 0 || activity.recentUsers.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest updates and changes
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadData}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              Refresh
            </motion.button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {activity.recentRecipes.slice(0, 5).map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900 dark:to-transparent rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {recipe.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(recipe.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                    Recipe
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {activity.recentUsers.slice(0, 3).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (activity.recentRecipes.length + index) * 0.05 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900 dark:to-transparent rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {user.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-medium">
                        {user.plan || 'free'}
                      </span>
                      <Clock className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  User
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
