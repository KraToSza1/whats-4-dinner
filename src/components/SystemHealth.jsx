import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemHealth } from '../utils/adminStats';
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  HardDrive,
  Zap,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    checkHealth();
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await getSystemHealth();
      setHealth(data);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking system health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = status => {
    if (status === 'healthy') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (status === 'error') {
      return <XCircle className="w-6 h-6 text-red-500" />;
    } else {
      return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = status => {
    if (status === 'healthy') {
      return 'from-green-500 to-emerald-500';
    } else if (status === 'error') {
      return 'from-red-500 to-rose-500';
    } else {
      return 'from-yellow-500 to-orange-500';
    }
  };

  const getStatusBgColor = status => {
    if (status === 'healthy') {
      return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    } else if (status === 'error') {
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    } else {
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
    }
  };

  if (loading && !health) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border-2 border-slate-200 dark:border-slate-700 text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-lg">Failed to check system health</p>
      </div>
    );
  }

  const services = [
    {
      name: 'Database',
      status: health.database.status,
      icon: Database,
      details: health.database.responseTime
        ? `Response time: ${health.database.responseTime}ms`
        : health.database.error || 'Unknown',
      error: health.database.error,
      responseTime: health.database.responseTime,
    },
    {
      name: 'Storage',
      status: health.storage.status,
      icon: HardDrive,
      details: health.storage.bucketAccessible
        ? 'Bucket accessible'
        : health.storage.error || 'Not accessible',
      error: health.storage.error,
    },
    {
      name: 'API',
      status: health.api.status,
      icon: Zap,
      details: health.api.status === 'healthy' ? 'All systems operational' : 'Issues detected',
      error: null,
    },
  ];

  const allHealthy = services.every(s => s.status === 'healthy');
  const responseTime = health.database.responseTime || 0;
  const isFast = responseTime < 100;
  const isSlow = responseTime > 500;

  return (
    <div className="space-y-6">
      {/* Enhanced Overall Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-8 border-2 shadow-xl ${
          allHealthy
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
            : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {allHealthy ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <XCircle className="w-12 h-12 text-red-500" />
                </motion.div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                System Status: {allHealthy ? 'All Systems Operational' : 'Issues Detected'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last checked:{' '}
              {lastChecked
                ? lastChecked.toLocaleTimeString()
                : health.timestamp
                  ? new Date(health.timestamp).toLocaleTimeString()
                  : 'Never'}
            </p>
            {responseTime > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">Response Time:</span>
                <span
                  className={`text-sm font-bold ${
                    isFast
                      ? 'text-green-600 dark:text-green-400'
                      : isSlow
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {responseTime}ms
                </span>
                {isFast && <Sparkles className="w-4 h-4 text-green-500" />}
              </div>
            )}
          </div>
          {allHealthy && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-16 h-16 text-yellow-400 opacity-50" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`
                relative overflow-hidden rounded-2xl p-6 border-2 shadow-lg
                ${getStatusBgColor(service.status)}
              `}
            >
              {/* Gradient Background */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getStatusColor(
                  service.status
                )} opacity-10 rounded-full blur-3xl`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStatusColor(
                      service.status
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {service.name}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{service.details}</p>
                {service.responseTime !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((service.responseTime / 1000) * 100, 100)}%`,
                        }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-full bg-gradient-to-r ${getStatusColor(service.status)}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {service.responseTime}ms
                    </span>
                  </div>
                )}
                {service.error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-600 dark:text-red-400 mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    ⚠️ {service.error}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => checkHealth(true)}
          disabled={refreshing}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Checking...' : 'Refresh Status'}
        </motion.button>
      </div>
    </div>
  );
}
