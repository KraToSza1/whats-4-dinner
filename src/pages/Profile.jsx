import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth, signOut } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';
import { exportFavorites, importFavorites } from '../helpers/favoritesIO';
import { getAllRatings } from '../utils/preferenceAnalyzer.js';

const DIETS = [
  'Gluten Free',
  'Ketogenic',
  'Vegetarian',
  'Lacto-Vegetarian',
  'Ovo-Vegetarian',
  'Vegan',
  'Pescetarian',
  'Paleo',
  'Primal',
  'Low FODMAP',
  'Whole30',
];

const INTOLERANCES = [
  'Dairy',
  'Egg',
  'Gluten',
  'Grain',
  'Peanut',
  'Seafood',
  'Sesame',
  'Shellfish',
  'Soy',
  'Sulfite',
  'Tree Nut',
  'Wheat',
];

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('account');

  // User preferences
  const [unitSystem, setUnitSystem] = useState(() => {
    try {
      return localStorage.getItem('unitSystem') || 'metric';
    } catch {
      return 'metric';
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const [diet, setDiet] = useState(() => {
    try {
      return localStorage.getItem('filters:diet') || '';
    } catch {
      return '';
    }
  });

  const [intolerances, setIntolerances] = useState(() => {
    try {
      return localStorage.getItem('filters:intolerances') || '';
    } catch {
      return '';
    }
  });

  const [maxTime, setMaxTime] = useState(() => {
    try {
      return localStorage.getItem('filters:maxTime') || '';
    } catch {
      return '';
    }
  });

  const [mealType, setMealType] = useState(() => {
    try {
      return localStorage.getItem('filters:mealType') || '';
    } catch {
      return '';
    }
  });

  const [maxCalories, setMaxCalories] = useState(() => {
    try {
      return localStorage.getItem('filters:maxCalories') || '';
    } catch {
      return '';
    }
  });

  const [healthScore, setHealthScore] = useState(() => {
    try {
      return localStorage.getItem('filters:healthScore') || '';
    } catch {
      return '';
    }
  });

  const [pantry, setPantry] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('filters:pantry') || '[]');
    } catch {
      return [];
    }
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('notifications:enabled') === 'true';
    } catch {
      return false;
    }
  });

  // Stats
  const [stats, setStats] = useState({
    favorites: 0,
    mealPlans: 0,
    groceryLists: 0,
    ratedRecipes: 0,
    familyMembers: 0,
  });

  useEffect(() => {
    // Load stats
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v2') || '{}');
      const groceryList = JSON.parse(localStorage.getItem('grocery:list:v2') || '[]');
      const familyMembers = JSON.parse(localStorage.getItem('family:members:v1') || '[]');
      const ratings = getAllRatings();

      // Count meals in meal plan
      const mealCount = Object.values(mealPlan).reduce((acc, day) => {
        if (day && typeof day === 'object') {
          return acc + Object.values(day).filter(Boolean).length;
        }
        return acc;
      }, 0);

      setStats({
        favorites: favorites.length,
        mealPlans: mealCount,
        groceryLists: groceryList.length,
        ratedRecipes: Object.keys(ratings).length,
        familyMembers: familyMembers.length,
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    if (diet !== undefined) localStorage.setItem('filters:diet', diet);
  }, [diet]);

  useEffect(() => {
    if (intolerances !== undefined) localStorage.setItem('filters:intolerances', intolerances);
  }, [intolerances]);

  useEffect(() => {
    if (maxTime !== undefined) localStorage.setItem('filters:maxTime', maxTime);
  }, [maxTime]);

  useEffect(() => {
    if (mealType !== undefined) localStorage.setItem('filters:mealType', mealType);
  }, [mealType]);

  useEffect(() => {
    if (maxCalories !== undefined) localStorage.setItem('filters:maxCalories', maxCalories);
  }, [maxCalories]);

  useEffect(() => {
    if (healthScore !== undefined) localStorage.setItem('filters:healthScore', healthScore);
  }, [healthScore]);

  useEffect(() => {
    if (pantry !== undefined) localStorage.setItem('filters:pantry', JSON.stringify(pantry));
  }, [pantry]);

  useEffect(() => {
    localStorage.setItem('notifications:enabled', notificationsEnabled.toString());
  }, [notificationsEnabled]);

  const handleUnitSystemChange = system => {
    setUnitSystem(system);
    localStorage.setItem('unitSystem', system);
    showMessage('success', 'Unit system updated!');
  };

  const handleThemeChange = newTheme => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    showMessage('success', 'Theme updated!');
  };

  const handleDietChange = selectedDiet => {
    setDiet(selectedDiet === diet ? '' : selectedDiet);
    showMessage('success', 'Diet preference updated!');
  };

  const handleIntoleranceToggle = intolerance => {
    const current = intolerances.split(',').filter(Boolean);
    const newIntolerances = current.includes(intolerance)
      ? current.filter(i => i !== intolerance)
      : [...current, intolerance];
    setIntolerances(newIntolerances.join(','));
    showMessage('success', 'Intolerance preferences updated!');
  };

  const handlePantryRemove = item => {
    setPantry(pantry.filter(p => p !== item));
    showMessage('success', 'Item removed from pantry');
  };

  const handlePantryAdd = e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newItem = e.target.value.trim();
      if (!pantry.includes(newItem)) {
        setPantry([...pantry, newItem]);
        e.target.value = '';
        showMessage('success', 'Item added to pantry');
      }
    }
  };

  const handleClearPantry = () => {
    if (confirm('Clear all pantry items?')) {
      setPantry([]);
      showMessage('success', 'Pantry cleared');
    }
  };

  const handleNotificationsToggle = async () => {
    if (!notificationsEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showMessage('success', 'Notifications enabled!');
      } else {
        showMessage('error', 'Notification permission denied');
      }
    } else {
      setNotificationsEnabled(false);
      showMessage('success', 'Notifications disabled');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleExportData = async () => {
    // ENFORCE EXPORT LIMIT - Check if user has export feature
    const { hasFeature } = await import('../utils/subscription.js');
    if (!hasFeature('export_data')) {
      showMessage('error', 'Export is a premium feature! Upgrade to unlock data export.');
      window.dispatchEvent(new CustomEvent('openProModal'));
      return;
    }

    try {
      setLoading(true);
      const data = {
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        mealPlan: JSON.parse(localStorage.getItem('meal:plan:v2') || '{}'),
        groceryList: JSON.parse(localStorage.getItem('grocery:list:v2') || '[]'),
        familyMembers: JSON.parse(localStorage.getItem('family:members:v1') || '[]'),
        mealLogs: JSON.parse(localStorage.getItem('family:meal:logs:v1') || '{}'),
        preferences: {
          unitSystem: localStorage.getItem('unitSystem') || 'metric',
          theme: localStorage.getItem('theme') || 'system',
          diet: localStorage.getItem('filters:diet') || '',
          intolerances: localStorage.getItem('filters:intolerances') || '',
          maxTime: localStorage.getItem('filters:maxTime') || '',
          mealType: localStorage.getItem('filters:mealType') || '',
          maxCalories: localStorage.getItem('filters:maxCalories') || '',
          healthScore: localStorage.getItem('filters:healthScore') || '',
          pantry: JSON.parse(localStorage.getItem('filters:pantry') || '[]'),
        },
        ratings: getAllRatings(),
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whats-4-dinner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    // ENFORCE IMPORT LIMIT - Check if user has import feature
    const { hasFeature } = await import('../utils/subscription.js');
    if (!hasFeature('import_data')) {
      showMessage('error', 'Import is a premium feature! Upgrade to unlock data import.');
      window.dispatchEvent(new CustomEvent('openProModal'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setLoading(true);
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate and import
        if (data.favorites) localStorage.setItem('favorites', JSON.stringify(data.favorites));
        if (data.mealPlan) localStorage.setItem('meal:plan:v2', JSON.stringify(data.mealPlan));
        if (data.groceryList)
          localStorage.setItem('grocery:list:v2', JSON.stringify(data.groceryList));
        if (data.familyMembers)
          localStorage.setItem('family:members:v1', JSON.stringify(data.familyMembers));
        if (data.mealLogs)
          localStorage.setItem('family:meal:logs:v1', JSON.stringify(data.mealLogs));
        if (data.preferences) {
          if (data.preferences.unitSystem)
            localStorage.setItem('unitSystem', data.preferences.unitSystem);
          if (data.preferences.theme) localStorage.setItem('theme', data.preferences.theme);
          if (data.preferences.diet) localStorage.setItem('filters:diet', data.preferences.diet);
          if (data.preferences.intolerances)
            localStorage.setItem('filters:intolerances', data.preferences.intolerances);
          if (data.preferences.maxTime)
            localStorage.setItem('filters:maxTime', data.preferences.maxTime);
          if (data.preferences.mealType)
            localStorage.setItem('filters:mealType', data.preferences.mealType);
          if (data.preferences.maxCalories)
            localStorage.setItem('filters:maxCalories', data.preferences.maxCalories);
          if (data.preferences.healthScore)
            localStorage.setItem('filters:healthScore', data.preferences.healthScore);
          if (data.preferences.pantry)
            localStorage.setItem('filters:pantry', JSON.stringify(data.preferences.pantry));
        }
        if (data.ratings) {
          Object.keys(data.ratings).forEach(recipeId => {
            localStorage.setItem(
              `recipeRating:${recipeId}`,
              JSON.stringify(data.ratings[recipeId])
            );
          });
        }

        showMessage('success', 'Data imported successfully! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        showMessage('error', 'Failed to import data. Invalid file format.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This will delete all your data and cannot be undone.'
      )
    ) {
      return;
    }

    if (
      !confirm(
        'This is your last chance. All your favorites, meal plans, grocery lists, and family data will be permanently deleted. Continue?'
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Delete all local data
      const keysToDelete = [
        'favorites',
        'meal:plan:v2',
        'grocery:list:v2',
        'unitSystem',
        'theme',
        'filters:diet',
        'filters:intolerances',
        'filters:maxTime',
        'filters:mealType',
        'filters:maxCalories',
        'filters:healthScore',
        'filters:pantry',
        'family:members:v1',
        'family:meal:logs:v1',
        'notifications:enabled',
      ];

      keysToDelete.forEach(key => localStorage.removeItem(key));

      // Delete all recipe ratings
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('recipeRating:')) {
          localStorage.removeItem(key);
        }
      }

      // Sign out from Supabase
      await signOut();

      showMessage('success', 'Account deleted. Redirecting...');
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 2000);
    } catch (error) {
      showMessage('error', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      navigate('/');
      window.location.reload();
    } catch (error) {
      showMessage('error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = email => {
    return email.substring(0, 2).toUpperCase();
  };

  const getAuthProvider = () => {
    if (!user) return null;
    const providers = user.app_metadata?.providers || [];
    if (providers.includes('google')) return 'Google';
    if (providers.includes('email')) return 'Email';
    return 'Email';
  };

  // TEMPORARY: Allow access without login during development
  // Login check disabled - everyone can access profile
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
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'dietary', label: 'Dietary', icon: '🥗' },
    { id: 'data', label: 'Data', icon: '💾' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="page-shell py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Profile & Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your account and preferences</p>
        </motion.div>

        {/* Message */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2 border-b border-slate-200 dark:border-slate-800 -mx-3 sm:mx-0 px-3 sm:px-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[44px] sm:min-h-0 touch-manipulation basis-[48%] sm:basis-auto flex-grow sm:flex-grow-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="text-base sm:text-lg">{tab.icon}</span>
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Account Info */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Account Information</h2>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4 text-center sm:text-left">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold mx-auto sm:mx-0">
                    {getInitials(user.email)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        Email
                      </label>
                      <p className="text-base sm:text-lg font-semibold break-all">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        Signed in with
                      </label>
                      <p className="text-sm sm:text-base">{getAuthProvider()}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        User ID
                      </label>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 font-mono break-all">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Your Activity</h2>
                <div className="card-cluster auto-fit-sm">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-600">{stats.favorites}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Favorites</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{stats.mealPlans}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Meals Planned</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{stats.groceryLists}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Grocery Items</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{stats.ratedRecipes}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Rated Recipes</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-3xl font-bold text-pink-600">{stats.familyMembers}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Family Members</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="card-cluster auto-fit-md">
                  <button
                    onClick={() => navigate('/meal-planner')}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="font-semibold mb-1">📅 Meal Planner</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Plan your week</div>
                  </button>
                  <button
                    onClick={() => navigate('/family-plan')}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="font-semibold mb-1">👨‍👩‍👧‍👦 Family Plan</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Manage family members
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Account Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Unit System */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Measurement System</h2>
                <div className="flex flex-wrap gap-2">
                  {['metric', 'us', 'uk'].map(sys => (
                    <button
                      key={sys}
                      onClick={() => handleUnitSystemChange(sys)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        unitSystem === sys
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sys.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Theme</h2>
                <div className="flex flex-wrap gap-2">
                  {['light', 'dark', 'system'].map(t => (
                    <button
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`px-4 py-2 rounded-md transition-colors capitalize ${
                        theme === t
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t === 'system' ? 'System Default' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Notifications</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive meal reminders and recipe suggestions
                    </p>
                  </div>
                  <button
                    onClick={handleNotificationsToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Search Filters */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Default Search Filters</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Cooking Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={maxTime}
                      onChange={e => setMaxTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Meal Type</label>
                    <select
                      value={mealType}
                      onChange={e => setMealType(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Any</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Calories</label>
                      <input
                        type="number"
                        value={maxCalories}
                        onChange={e => setMaxCalories(e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        placeholder="No limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Health Score</label>
                      <input
                        type="number"
                        value={healthScore}
                        onChange={e => setHealthScore(e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        placeholder="No minimum"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dietary' && (
            <motion.div
              key="dietary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Diet */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Dietary Preferences</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Select your preferred diet (only one active at a time)
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETS.map(d => (
                    <button
                      key={d}
                      onClick={() => handleDietChange(d)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        diet === d
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intolerances */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Food Intolerances</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTOLERANCES.map(intolerance => {
                    const isSelected = intolerances.split(',').includes(intolerance);
                    return (
                      <button
                        key={intolerance}
                        onClick={() => handleIntoleranceToggle(intolerance)}
                        className={`px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {intolerance}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pantry */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Pantry Items</h2>
                  {pantry.length > 0 && (
                    <button
                      onClick={handleClearPantry}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  onKeyDown={handlePantryAdd}
                  placeholder="Type ingredient and press Enter"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 mb-4"
                />
                {pantry.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {pantry.map(item => (
                      <span
                        key={item}
                        className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm flex items-center gap-2"
                      >
                        {item}
                        <button
                          onClick={() => handlePantryRemove(item)}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No pantry items yet. Add ingredients to find recipes using what you have!
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Data Export/Import */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Data Management</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Export all your data for backup or import previously exported data
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportData}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    Export All Data
                  </button>
                  <button
                    onClick={handleImportData}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                  >
                    Import Data
                  </button>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm font-medium mb-2">What's included in export:</p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>Favorites</li>
                    <li>Meal plans</li>
                    <li>Grocery lists</li>
                    <li>Family members and meal logs</li>
                    <li>Recipe ratings</li>
                    <li>All preferences and settings</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* App Info */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">About What's 4 Dinner</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Version
                    </label>
                    <p className="text-lg">1.0.0</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Description
                    </label>
                    <p className="text-slate-600 dark:text-slate-400">
                      A modern recipe discovery app with meal planning, grocery lists, and family
                      management features.
                    </p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Help & Support</h2>
                <div className="space-y-2">
                  <a href="/help" className="block text-emerald-600 hover:underline">
                    Help & FAQ
                  </a>
                  <a href="/terms" className="block text-emerald-600 hover:underline">
                    Terms of Service
                  </a>
                  <a href="/privacy" className="block text-emerald-600 hover:underline">
                    Privacy Policy
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
