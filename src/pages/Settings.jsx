import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackToHome from '../components/BackToHome.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { safeLocalStorage } from '../utils/browserCompatibility.js';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  User,
  Globe,
  Bell,
  Shield,
  Palette,
  Languages,
  Ruler,
  Download,
  Trash2,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { useToast } from '../components/Toast.jsx';
import {
  getMeasurementSystemForCountry,
  getCountryName,
  getCountryFlag,
} from '../utils/measurementSystems.js';
import { getCurrencySettings, initializeCurrency } from '../utils/currency.js';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [unitSystem, setUnitSystem] = useState(() => safeLocalStorage.getItem('unitSystem') || 'metric');
  const [currencySettings, setCurrencySettings] = useState(null);
  const [detectedMeasurementSystem, setDetectedMeasurementSystem] = useState(null);

  // Initialize currency settings
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        await initializeCurrency();
        const settings = getCurrencySettings();
        setCurrencySettings(settings);

        if (settings?.country) {
          const detected = getMeasurementSystemForCountry(settings.country);
          setDetectedMeasurementSystem(detected);
        }
      } catch (error) {
        console.warn('[SETTINGS] Error initializing currency:', error);
      }
    };

    initializeSettings();
  }, []);

  // Theme is now managed by ThemeContext, no need for separate useEffect

  const handleThemeChange = (newTheme) => {
    console.error('🔥🔥🔥 [SETTINGS] handleThemeChange CALLED!', {
      newTheme,
      currentTheme: theme,
      setThemeType: typeof setTheme,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });
    
    try {
      setTheme(newTheme);
      console.error('🔥🔥🔥 [SETTINGS] setTheme() executed successfully', {
        newTheme,
        timestamp: new Date().toISOString()
      });
      toast.success(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
    } catch (error) {
      console.error('❌❌❌ [SETTINGS] setTheme() THREW ERROR!', {
        error,
        newTheme,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
    }
  };

  const handleUnitSystemChange = (system) => {
    setUnitSystem(system);
    safeLocalStorage.setItem('unitSystem', system);
    toast.success(`Measurement system set to ${system === 'metric' ? 'Metric' : system === 'us' ? 'US' : 'UK'}`);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This will remove favorites, meal plans, and preferences. This action cannot be undone.')) {
      try {
        // Clear all app data except theme and unit system
        const keysToKeep = ['theme', 'unitSystem'];
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !keysToKeep.includes(key)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => safeLocalStorage.removeItem(key));
        toast.success('Local data cleared successfully');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Failed to clear data');
        console.error('Error clearing data:', error);
      }
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        theme,
        unitSystem,
        favorites: safeLocalStorage.getItem('favorites'),
        mealPlans: safeLocalStorage.getItem('mealPlans'),
        groceryList: safeLocalStorage.getItem('groceryList'),
        pantry: safeLocalStorage.getItem('filters:pantry'),
        preferences: {
          theme,
          unitSystem,
        },
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whats4dinner-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Error exporting data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-shrink-0">
              <BackToHome className="mb-0" />
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white truncate">Settings</h1>
                <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 hidden sm:block">
                  Customize your app experience
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Status */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Sign in for more features
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Access your full profile, sync data across devices, and unlock premium features.
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h2>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={(e) => {
                  console.error('🔥🔥🔥 [SETTINGS BUTTON] Light button CLICKED!', {
                    event: e,
                    currentTheme: theme,
                    timestamp: new Date().toISOString(),
                    stack: new Error().stack
                  });
                  e.preventDefault();
                  e.stopPropagation();
                  handleThemeChange('light');
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${theme === 'light' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    Light
                  </span>
                  {theme === 'light' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </button>
              <button
                onClick={(e) => {
                  console.error('🔥🔥🔥 [SETTINGS BUTTON] Dark button CLICKED!', {
                    event: e,
                    currentTheme: theme,
                    timestamp: new Date().toISOString(),
                    stack: new Error().stack
                  });
                  e.preventDefault();
                  e.stopPropagation();
                  handleThemeChange('dark');
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    Dark
                  </span>
                  {theme === 'dark' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Units & Measurements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Ruler className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Units & Measurements</h2>
          </div>

          {/* Unit System Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Measurement System
            </label>
            {currencySettings?.country && detectedMeasurementSystem && (
              <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Detected: {getCountryFlag(currencySettings.country)}{' '}
                  {getCountryName(currencySettings.country) || currencySettings.country} ({detectedMeasurementSystem.toUpperCase()})
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {['metric', 'us', 'uk'].map((system) => (
                <button
                  key={system}
                  onClick={() => handleUnitSystemChange(system)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    unitSystem === system
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-sm font-medium ${unitSystem === system ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {system === 'metric' ? 'Metric' : system === 'us' ? 'US' : 'UK'}
                    </span>
                    {unitSystem === system && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Data Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data Management</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">Export Data</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Download all your local data as JSON
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </button>

            <button
              onClick={handleClearData}
              className="w-full p-4 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium text-red-600 dark:text-red-400">Clear All Data</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70">
                    Remove all local data (favorites, meal plans, etc.)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
            </button>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">More Options</h2>
          </div>

          <div className="space-y-2">
            {user && (
              <button
                onClick={() => navigate('/profile')}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-slate-900 dark:text-white">Full Profile</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <button
              onClick={() => navigate('/help')}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-slate-900 dark:text-white">Help & FAQ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-900 dark:text-white">Terms & Privacy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

