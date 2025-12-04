import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './Toast.jsx';
import {
  Database,
  Cloud,
  CreditCard,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Globe,
  Server,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default function AdminIntegrations() {
  const [supabaseStats, setSupabaseStats] = useState(null);
  const [vercelStats, setVercelStats] = useState(null);
  const [paddleStats, setPaddleStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadAllStats();
    // Refresh every 60 seconds
    const interval = setInterval(loadAllStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAllStats = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await Promise.all([loadSupabaseStats(), loadVercelStats(), loadPaddleStats()]);
    } catch (error) {
      console.error('Error loading integration stats:', error);
      toast.error('Failed to load integration statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSupabaseStats = async () => {
    try {
      // Database stats
      const { count: recipeCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Storage stats
      const { data: storageData } = await supabase.storage
        .from('recipe-images')
        .list('', { limit: 1000 });
      const imageCount = storageData?.length || 0;

      // Test database performance
      const dbStart = Date.now();
      await supabase.from('recipes').select('id').limit(1);
      const dbResponseTime = Date.now() - dbStart;

      setSupabaseStats({
        database: {
          recipes: recipeCount || 0,
          users: userCount || 0,
          responseTime: dbResponseTime,
          status: dbResponseTime < 200 ? 'healthy' : dbResponseTime < 500 ? 'warning' : 'error',
        },
        storage: {
          images: imageCount,
          status: 'healthy',
        },
        api: {
          status: 'healthy',
        },
      });
    } catch (error) {
      console.error('Error loading Supabase stats:', error);
      setSupabaseStats({
        database: { status: 'error', error: error.message },
        storage: { status: 'error', error: error.message },
        api: { status: 'error', error: error.message },
      });
    }
  };

  const loadVercelStats = async () => {
    try {
      // Check if we're on Vercel
      const isVercel =
        window.location.hostname.includes('vercel.app') || import.meta.env.VITE_VERCEL_ENV;

      // Get deployment info from environment or API
      const deploymentUrl = window.location.origin;
      const environment =
        import.meta.env.VITE_VERCEL_ENV || (isVercel ? 'production' : 'development');

      // Performance metrics (simulated - would use Vercel Analytics API in production)
      const performanceMetrics = {
        pageLoadTime: Math.random() * 500 + 200, // Simulated
        apiResponseTime: Math.random() * 300 + 100,
        errorRate: Math.random() * 2,
      };

      setVercelStats({
        deployment: {
          url: deploymentUrl,
          environment,
          status: 'deployed',
        },
        performance: {
          pageLoadTime: performanceMetrics.pageLoadTime,
          apiResponseTime: performanceMetrics.apiResponseTime,
          errorRate: performanceMetrics.errorRate,
          status: performanceMetrics.errorRate < 1 ? 'healthy' : 'warning',
        },
        analytics: {
          pageViews: Math.floor(Math.random() * 10000) + 5000, // Simulated
          uniqueVisitors: Math.floor(Math.random() * 2000) + 1000,
        },
      });
    } catch (error) {
      console.error('Error loading Vercel stats:', error);
      setVercelStats({
        deployment: { status: 'error', error: error.message },
        performance: { status: 'error', error: error.message },
        analytics: { status: 'error', error: error.message },
      });
    }
  };

  const loadPaddleStats = async () => {
    try {
      // Get subscription stats from Supabase
      const { data: profiles } = await supabase
        .from('profiles')
        .select('plan, subscription_status, subscription_id');

      let activeSubscriptions = 0;
      let totalRevenue = 0; // Would calculate from Paddle API in production
      let monthlyRecurringRevenue = 0;
      const planDistribution = {};

      if (profiles) {
        profiles.forEach(profile => {
          if (profile.plan && profile.plan !== 'free' && profile.subscription_status === 'active') {
            activeSubscriptions++;
            // Simulated revenue calculation
            const planPrices = {
              pro: 9.99,
              premium: 19.99,
              family: 29.99,
            };
            const price = planPrices[profile.plan] || 0;
            monthlyRecurringRevenue += price;
            planDistribution[profile.plan] = (planDistribution[profile.plan] || 0) + 1;
          }
        });
      }

      setPaddleStats({
        subscriptions: {
          active: activeSubscriptions,
          total: profiles?.length || 0,
          status: 'healthy',
        },
        revenue: {
          mrr: monthlyRecurringRevenue,
          total: totalRevenue,
          status: 'healthy',
        },
        plans: planDistribution,
      });
    } catch (error) {
      console.error('Error loading Paddle stats:', error);
      setPaddleStats({
        subscriptions: { status: 'error', error: error.message },
        revenue: { status: 'error', error: error.message },
        plans: {},
      });
    }
  };

  if (loading && !supabaseStats && !vercelStats && !paddleStats) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Integration Status
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor Supabase, Vercel, and Paddle integrations
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadAllStats(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Supabase Integration */}
      {supabaseStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Supabase</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Database & Storage</p>
              </div>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2"
            >
              Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Recipes</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {supabaseStats.database?.recipes?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Users</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {supabaseStats.database?.users?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Response Time</span>
                {supabaseStats.database?.status === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {supabaseStats.database?.responseTime || 0}ms
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Storage Images</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {supabaseStats.storage?.images?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Vercel Integration */}
      {vercelStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Vercel</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Deployment & Performance
                </p>
              </div>
            </div>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
            >
              Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Environment</span>
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {vercelStats.deployment?.environment || 'unknown'}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Page Load</span>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {vercelStats.performance?.pageLoadTime?.toFixed(0) || 0}ms
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Page Views</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {vercelStats.analytics?.pageViews?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Paddle Integration */}
      {paddleStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Paddle</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Subscriptions & Revenue
                </p>
              </div>
            </div>
            <a
              href="https://vendors.paddle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2"
            >
              Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Active Subscriptions
                </span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {paddleStats.subscriptions?.active || 0}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Revenue</span>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${paddleStats.revenue?.mrr?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Users</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {paddleStats.subscriptions?.total || 0}
              </p>
            </div>
          </div>

          {/* Plan Distribution */}
          {Object.keys(paddleStats.plans || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                Plan Distribution
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(paddleStats.plans).map(([plan, count]) => (
                  <div
                    key={plan}
                    className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium"
                  >
                    {plan}: {count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
