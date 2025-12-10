import React, { useState, useEffect, useCallback } from 'react';
// motion is used extensively throughout the JSX below
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './Toast';
import { clearClientCaches } from '../utils/cache.js';
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Mail,
  Bell,
  Shield,
  Key,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
} from 'lucide-react';

export default function AdminSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // App Settings
    appName: "What's 4 Dinner?",
    appDescription: 'Your personal cooking assistant',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back soon!',

    // Feature Flags
    enableChallenges: true,
    enableStreaks: true,
    enableBadges: true,
    enableXP: true,
    enableMealPlanner: true,
    enableGroceryList: true,
    enableBudgetTracker: true,

    // Limits & Quotas
    maxRecipesPerUser: 1000,
    maxFavoritesPerUser: 500,
    maxGroceryListsPerUser: 50,
    maxMealPlansPerUser: 10,

    // Email Settings
    emailNotificationsEnabled: true,
    emailFromName: "What's 4 Dinner?",
    emailFromAddress: 'noreply@whats4dinner.com',

    // Cache Settings
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour in seconds
    enableCDN: false,
    cacheBustVersion: 0,

    // Security Settings
    requireEmailVerification: false,
    allowGuestAccess: true,
    maxLoginAttempts: 5,
    sessionTimeout: 86400, // 24 hours in seconds

    // Analytics Settings
    enableAnalytics: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      // Try to load from Supabase admin_settings table
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'app_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for first time
        console.error('Error loading settings:', error);
      }

      if (data?.value) {
        setSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to localStorage for now
      const stored = localStorage.getItem('admin:settings:v1');
      if (stored) {
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
        } catch (e) {
          console.error('Error parsing stored settings:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to Supabase
      const { error: supabaseError } = await supabase.from('admin_settings').upsert(
        {
          key: 'app_settings',
          value: settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      );

      if (supabaseError) {
        console.error('Error saving to Supabase:', supabaseError);
        // Fallback to localStorage
        localStorage.setItem('admin:settings:v1', JSON.stringify(settings));
        toast.success('Settings saved locally (Supabase unavailable)');
      } else {
        // Also save to localStorage as backup
        localStorage.setItem('admin:settings:v1', JSON.stringify(settings));
        toast.success('✨ Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Fallback to localStorage
      localStorage.setItem('admin:settings:v1', JSON.stringify(settings));
      toast.success('Settings saved locally');
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('📥 Settings exported!');
  };

  const importSettings = event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        setSettings({ ...settings, ...imported });
        toast.success('Settings imported! Click Save to apply.');
      } catch (_error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const clearCache = async () => {
    try {
      const summary = await clearClientCaches({
        reason: 'admin-manual',
        preserveKeys: ['sb-', 'supabase', 'theme', 'language'],
      });

      const parts = [];
      if (summary.localStorageCleared) parts.push(`${summary.localStorageCleared} local entries`);
      if (summary.sessionStorageCleared) parts.push(`${summary.sessionStorageCleared} session entries`);
      if (summary.cachesCleared) parts.push(`${summary.cachesCleared} SW caches`);

      toast.success(`✨ Cache cleared (${parts.join(', ') || 'nothing to clear'})`);
    } catch (_error) {
      toast.error('Error clearing cache');
    }
  };

  const forceCacheFlushForAllUsers = async () => {
    const newVersion = Date.now();
    setSettings(prev => ({ ...prev, cacheBustVersion: newVersion }));

    try {
      const { error } = await supabase.from('admin_settings').upsert(
        {
          key: 'app_settings',
          value: { ...settings, cacheBustVersion: newVersion },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) {
        console.error('Error writing cache bust version:', error);
        toast.error('Failed to propagate cache flush flag');
        return;
      }

      toast.success('🚀 Cache flush flag broadcasted — users will clear cache on next load');
    } catch (_error) {
      console.error('Error forcing cache flush:', _error);
      toast.error('Failed to broadcast cache flush');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border-2 border-slate-200 dark:border-slate-700 text-center">
        <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-500" />
            Admin Settings
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage app-wide settings and configuration
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportSettings}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <label className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={importSettings} className="hidden" />
          </label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </div>
      </div>

      {/* App Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">App Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              App Name
            </label>
            <input
              type="text"
              value={settings.appName}
              onChange={e => setSettings({ ...settings, appName: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              App Description
            </label>
            <textarea
              value={settings.appDescription}
              onChange={e => setSettings({ ...settings, appDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <label className="block text-sm font-semibold text-red-700 dark:text-red-300">
                  Maintenance Mode
                </label>
                <p className="text-xs text-red-600 dark:text-red-400">
                  When enabled, only admins can access the app
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-red-500"></div>
            </label>
          </div>
          {settings.maintenanceMode && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={e => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Feature Flags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Feature Flags</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'enableChallenges', label: 'Challenges', icon: '🎯' },
            { key: 'enableStreaks', label: 'Streaks', icon: '🔥' },
            { key: 'enableBadges', label: 'Badges', icon: '🏆' },
            { key: 'enableXP', label: 'XP System', icon: '⭐' },
            { key: 'enableMealPlanner', label: 'Meal Planner', icon: '📅' },
            { key: 'enableGroceryList', label: 'Grocery Lists', icon: '🛒' },
            { key: 'enableAnalytics', label: 'Analytics', icon: '📊' },
            { key: 'enableBudgetTracker', label: 'Budget Tracker', icon: '💰' },
          ].map(feature => (
            <div
              key={feature.key}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {feature.label}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[feature.key]}
                  onChange={e => setSettings({ ...settings, [feature.key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Limits & Quotas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Limits & Quotas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'maxRecipesPerUser', label: 'Max Recipes per User', suffix: 'recipes' },
            { key: 'maxFavoritesPerUser', label: 'Max Favorites per User', suffix: 'favorites' },
            { key: 'maxGroceryListsPerUser', label: 'Max Grocery Lists per User', suffix: 'lists' },
            { key: 'maxMealPlansPerUser', label: 'Max Meal Plans per User', suffix: 'plans' },
          ].map(limit => (
            <div key={limit.key}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {limit.label}
              </label>
              <input
                type="number"
                value={settings[limit.key]}
                onChange={e =>
                  setSettings({ ...settings, [limit.key]: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{limit.suffix}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cache Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cache Management</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearCache}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </motion.button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cache Enabled
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enable/disable caching for better performance
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cacheEnabled}
                onChange={e => setSettings({ ...settings, cacheEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-500"></div>
            </label>
          </div>
          {settings.cacheEnabled && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cache TTL (Time To Live)
              </label>
              <input
                type="number"
                value={settings.cacheTTL}
                onChange={e =>
                  setSettings({ ...settings, cacheTTL: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cache duration in seconds (current: {settings.cacheTTL}s ={' '}
                {Math.floor(settings.cacheTTL / 60)} minutes)
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Cache Bust Version
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last broadcast: {settings.cacheBustVersion ? new Date(settings.cacheBustVersion).toLocaleString() : 'Never'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={forceCacheFlushForAllUsers}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg"
              >
                Force cache flush (all users)
              </motion.button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Sets a cache-bust flag in Supabase. Clients running CacheGuard will clear local caches and service-worker data the next time they load the app.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
              About Settings Storage
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Settings are stored in Supabase's{' '}
              <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                admin_settings
              </code>{' '}
              table. If Supabase is unavailable, settings will be saved to localStorage as a backup.
              To create the table in Supabase, run this SQL:
            </p>
            <pre className="mt-3 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-xs overflow-x-auto">
              {`CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
            </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
