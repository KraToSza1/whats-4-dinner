import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, signOut } from '../context/AuthContext.jsx';
import { getAllRatings } from '../utils/preferenceAnalyzer.js';
import { getCurrentPlan, getPlanName, PLAN_DETAILS, PLANS } from '../utils/subscription.js';
import {
  getMeasurementSystemForCountry,
  getCountryName,
  getCountryFlag,
} from '../utils/measurementSystems.js';
import { getCurrencySettings } from '../utils/currency.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  MEDICAL_CONDITIONS,
  REQUIRED_NUTRIENTS,
  getMedicalConditions,
  saveMedicalConditions,
  initializeMedicalConditions,
} from '../utils/medicalConditions.js';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { language, setLanguage: setLanguageContext, supportedLanguages } = useLanguage();

  // Create a safe user reference that won't change during render
  const safeUser = useMemo(() => {
    try {
      if (!user) return null;
      // Safely check properties without accessing them directly
      const hasId = user && typeof user === 'object' && 'id' in user && user.id;
      const hasEmail = user && typeof user === 'object' && 'email' in user && user.email;
      if (!hasId && !hasEmail) return null;
      return user;
    } catch (error) {
      console.error('Error creating safeUser:', error);
      return null;
    }
  }, [user]);

  // Feature flag: Language selection temporarily disabled
  const ENABLE_LANGUAGE_SELECTION = false;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  // Check URL param for tab, default to 'account'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['account', 'preferences', 'dietary', 'medical', 'about'].includes(tabParam)
      ? tabParam
      : 'account';
  });

  // Update activeTab when URL param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['account', 'preferences', 'dietary', 'medical', 'about'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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

  // Get currency settings for auto-detection
  const [currencySettings, setCurrencySettings] = useState(null);
  const [detectedMeasurementSystem, setDetectedMeasurementSystem] = useState(null);

  // Auto-detect measurement system based on location
  useEffect(() => {
    const initializeMeasurementSystem = async () => {
      try {
        const settings = getCurrencySettings();
        setCurrencySettings(settings);

        if (settings?.country) {
          const detected = getMeasurementSystemForCountry(settings.country);
          setDetectedMeasurementSystem(detected);
          // Auto-set if not already set by user
          const savedSystem = localStorage.getItem('unitSystem');
          if (!savedSystem) {
            setUnitSystem(detected);
            localStorage.setItem('unitSystem', detected);
          }
        }
      } catch (_error) {
        // Failed to initialize measurement system
      }
    };

    initializeMeasurementSystem();
  }, []);

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

  // Medical conditions state
  const [medicalData, setMedicalData] = useState(() => {
    const stored = getMedicalConditions();
    return stored || initializeMedicalConditions();
  });

  const [showAddRequiredNutrient, setShowAddRequiredNutrient] = useState(false);
  const [requiredNutrientForm, setRequiredNutrientForm] = useState({
    nutrientId: '',
    minAmount: '',
  });

  // Stats
  const [stats, setStats] = useState({
    favorites: 0,
    mealPlans: 0,
    groceryLists: 0,
    ratedRecipes: 0,
    familyMembers: 0,
  });

  // Subscription plan state
  const [currentPlan, setCurrentPlan] = useState('free');
  const [planLoading, setPlanLoading] = useState(true);

  // Load plan from Supabase
  useEffect(() => {
    const loadPlan = async () => {
      console.warn('🔍 [PROFILE] ============================================');
      console.warn('🔍 [PROFILE] Loading plan in Profile component...');
      console.warn('🔍 [PROFILE] ============================================');

      try {
        const plan = await getCurrentPlan();
        console.warn('✅ [PROFILE] Plan loaded:', plan);
        setCurrentPlan(plan);
        console.warn('✅ [PROFILE] Plan state updated to:', plan);
      } catch (error) {
        console.error('❌ [PROFILE] Error loading plan:', error);
        console.error('❌ [PROFILE] Error details:', {
          message: error.message,
          stack: error.stack,
        });
      } finally {
        setPlanLoading(false);
        console.warn('✅ [PROFILE] Plan loading complete');
      }
    };
    loadPlan();

    // Listen for plan changes
    const handlePlanChange = event => {
      const { plan } = event.detail || {};
      console.warn('🔔 [PROFILE] Plan change event received:', plan);
      if (plan) {
        console.warn('✅ [PROFILE] Updating plan state from event:', plan);
        setCurrentPlan(plan);
      }
    };
    window.addEventListener('subscriptionPlanChanged', handlePlanChange);
    return () => window.removeEventListener('subscriptionPlanChanged', handlePlanChange);
  }, []);

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
    } catch (_e) {
      // Failed to load stats
    }
  }, []);

  // Language context handles language changes automatically

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

  // Save medical conditions when they change
  useEffect(() => {
    if (medicalData) {
      saveMedicalConditions(medicalData);
    }
  }, [medicalData]);

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

  // Export/Import functions removed to protect user data
  // These functions have been disabled to prevent unauthorized data access

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
    } catch (_error) {
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
    } catch (_error) {
      showMessage('error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = email => {
    if (!email || typeof email !== 'string') return '??';
    return email.substring(0, 2).toUpperCase();
  };

  const getAuthProvider = () => {
    const currentUser = safeUser || user;
    if (!currentUser) return 'Not signed in';
    try {
      const providers = currentUser.app_metadata?.providers || [];
      if (providers.includes('google')) return 'Google';
      if (providers.includes('email')) return 'Email';
      return 'Email';
    } catch {
      return 'Email';
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'dietary', label: 'Dietary', icon: '🥗' },
    { id: 'medical', label: 'Medical', icon: '🩺' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  // Update URL when tab changes
  const handleTabChange = tabId => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Show loading or sign-in prompt if user is not available
  // Use safeUser to prevent null access errors during render
  if (!safeUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You need to be signed in to view your profile.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

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
              onClick={() => handleTabChange(tab.id)}
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
                    {getInitials(safeUser?.email || '')}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        Email
                      </label>
                      <p className="text-base sm:text-lg font-semibold break-all">
                        {safeUser?.email || 'Not available'}
                      </p>
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
                        {safeUser?.id || 'Not available'}
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

              {/* Subscription Plan */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl shadow-sm border-2 border-emerald-200 dark:border-emerald-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Subscription Plan</h2>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openProModal'));
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    View Plans
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Current Plan:
                    </span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {planLoading ? 'Loading...' : getPlanName()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Monthly Cost:
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {planLoading
                        ? 'Loading...'
                        : currentPlan === PLANS.FREE
                          ? '$0.00'
                          : `$${PLAN_DETAILS[currentPlan]?.priceMonthly || '0.00'}`}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      💡 Want to unlock more features? View all plans and pricing options above.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <button
                    onClick={() => navigate('/water-tracker')}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="font-semibold mb-1">💧 Water Tracker</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Track hydration
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/dietician-ai')}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="font-semibold mb-1">🤖 AI Dietician</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Nutrition advice
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/budget-tracker')}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="font-semibold mb-1">💰 Budget Tracker</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Track spending</div>
                  </button>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="font-semibold mb-1">📊 Analytics</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">View insights</div>
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
              {/* Unit System - Enhanced with Country Detection */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Measurement System</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Choose how measurements are displayed (cups, ounces, grams, etc.)
                    </p>
                  </div>
                </div>

                {/* Auto-detection info */}
                {currencySettings?.country && detectedMeasurementSystem && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌍</span>
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {currencySettings.autoDetected ? 'Auto-detected' : 'Detected'} for{' '}
                        {getCountryFlag(currencySettings.country)}{' '}
                        {getCountryName(currencySettings.country) || currencySettings.country}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      Recommended:{' '}
                      <span className="font-medium">{detectedMeasurementSystem.toUpperCase()}</span>{' '}
                      system
                      {detectedMeasurementSystem === 'us' && ' (US Customary)'}
                      {detectedMeasurementSystem === 'uk' && ' (UK Imperial)'}
                      {detectedMeasurementSystem === 'metric' && ' (Metric)'}
                    </div>
                    {unitSystem !== detectedMeasurementSystem && (
                      <button
                        onClick={() => {
                          handleUnitSystemChange(detectedMeasurementSystem);
                        }}
                        className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Use Recommended System
                      </button>
                    )}
                    {unitSystem === detectedMeasurementSystem && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <span>✓</span>
                        <span>Using recommended system</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Measurement System Options */}
                <div className="space-y-3">
                  {[
                    {
                      key: 'metric',
                      name: 'Metric',
                      flag: '🌍',
                      description: 'Grams (g), Kilograms (kg), Milliliters (ml), Liters (L)',
                      countries: 'Most countries worldwide',
                    },
                    {
                      key: 'us',
                      name: 'US Customary',
                      flag: '🇺🇸',
                      description:
                        'Cups, Tablespoons (tbsp), Teaspoons (tsp), Ounces (oz), Pounds (lb)',
                      countries: 'United States, Puerto Rico, Guam, and others',
                    },
                    {
                      key: 'uk',
                      name: 'UK Imperial',
                      flag: '🇬🇧',
                      description: 'Milliliters (ml), Ounces (oz), Pounds (lb) - UK measurements',
                      countries: 'United Kingdom, Ireland, and others',
                    },
                  ].map(sys => (
                    <motion.button
                      key={sys.key}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleUnitSystemChange(sys.key)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        unitSystem === sys.key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl flex-shrink-0">{sys.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`font-bold text-base ${
                                  unitSystem === sys.key
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {sys.name}
                              </h3>
                              {unitSystem === sys.key && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-emerald-600 dark:text-emerald-400 text-lg"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                              {sys.description}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              Used in: {sys.countries}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Quick Reference */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    📏 Quick Reference
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-medium">1 cup =</span>
                      <br />
                      <span>240 ml (Metric)</span>
                      <br />
                      <span>284 ml (UK)</span>
                    </div>
                    <div>
                      <span className="font-medium">1 tbsp =</span>
                      <br />
                      <span>15 ml (Metric)</span>
                      <br />
                      <span>17 ml (UK)</span>
                    </div>
                    <div>
                      <span className="font-medium">1 oz =</span>
                      <br />
                      <span>28 g (all systems)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language - TEMPORARILY DISABLED */}
              {/* TODO: Re-enable when all translations are complete and working */}
              {ENABLE_LANGUAGE_SELECTION && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Language</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Choose your preferred language for the app interface
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {supportedLanguages.map(lang => {
                      const isSelected = language === lang.code;
                      return (
                        <motion.button
                          key={lang.code}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // Use context setLanguage which triggers immediate update across all components
                            const result = setLanguageContext(lang.code);
                            if (result) {
                              showMessage('success', `Language changed to ${lang.name}`);
                              // Force immediate re-render by updating document language
                              document.documentElement.lang = lang.code;
                            } else {
                              // Language change failed
                              showMessage('error', `Failed to change language to ${lang.name}`);
                            }
                          }}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{lang.flag}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`font-bold text-sm ${
                                    isSelected
                                      ? 'text-emerald-700 dark:text-emerald-300'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {lang.name}
                                </h3>
                                {isSelected && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-emerald-600 dark:text-emerald-400"
                                  >
                                    ✓
                                  </motion.span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                {lang.nativeName}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Note:</strong> Recipe content and ingredients are displayed in
                      their original language. The app interface will use your selected language
                      where translations are available.
                    </p>
                  </div>
                </div>
              )}

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

          {activeTab === 'medical' && (
            <motion.div
              key="medical"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Important Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                      Important Medical Disclaimer
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This feature is designed to help you manage dietary needs related to medical
                      conditions. However, it is not a substitute for professional medical advice.
                      Always consult with your doctor or a registered dietitian before making
                      significant dietary changes, especially if you have medical conditions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Medical Conditions</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Select conditions that affect your dietary needs
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {MEDICAL_CONDITIONS.map(condition => {
                    const isSelected = medicalData.conditions?.includes(condition.id);
                    return (
                      <motion.button
                        key={condition.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const current = medicalData.conditions || [];
                          const updated = isSelected
                            ? current.filter(c => c !== condition.id)
                            : [...current, condition.id];
                          setMedicalData({ ...medicalData, conditions: updated });
                          showMessage(
                            'success',
                            `${isSelected ? 'Removed' : 'Added'} ${condition.name}`
                          );
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{condition.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`font-bold text-sm ${
                                  isSelected
                                    ? 'text-red-700 dark:text-red-300'
                                    : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {condition.name}
                              </h3>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-red-600 dark:text-red-400 text-lg"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {condition.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Required Nutrients */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Required Nutrients</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Set minimum amounts of nutrients you need per serving
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddRequiredNutrient(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
                  >
                    + Add
                  </button>
                </div>
                {medicalData.requiredNutrients && medicalData.requiredNutrients.length > 0 ? (
                  <div className="space-y-2">
                    {medicalData.requiredNutrients.map((req, idx) => {
                      const nutrient = REQUIRED_NUTRIENTS.find(n => n.id === req.nutrientId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{nutrient?.icon || '💊'}</span>
                            <div>
                              <div className="font-semibold">
                                {nutrient?.name || req.nutrientId}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Minimum: {req.minAmount} {req.unit || nutrient?.unit || ''} per
                                serving
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updated = medicalData.requiredNutrients.filter(
                                (_, i) => i !== idx
                              );
                              setMedicalData({ ...medicalData, requiredNutrients: updated });
                              showMessage('success', 'Removed required nutrient');
                            }}
                            className="text-red-600 hover:text-red-700 px-2"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No required nutrients set yet.</p>
                )}
              </div>

              {/* Foods to Avoid */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Foods to Avoid</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Ingredients or foods your doctor has told you to avoid
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newFood = e.target.value.trim();
                      const current = medicalData.foodsToAvoid || [];
                      if (!current.includes(newFood)) {
                        setMedicalData({
                          ...medicalData,
                          foodsToAvoid: [...current, newFood],
                        });
                        e.target.value = '';
                        showMessage('success', 'Added food to avoid list');
                      }
                    }
                  }}
                  placeholder="Type food/ingredient and press Enter"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 mb-4"
                />
                {medicalData.foodsToAvoid && medicalData.foodsToAvoid.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalData.foodsToAvoid.map(food => (
                      <span
                        key={food}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-sm flex items-center gap-2"
                      >
                        {food}
                        <button
                          onClick={() => {
                            const updated = medicalData.foodsToAvoid.filter(f => f !== food);
                            setMedicalData({ ...medicalData, foodsToAvoid: updated });
                            showMessage('success', 'Removed from avoid list');
                          }}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No foods to avoid set yet.</p>
                )}
              </div>

              {/* Foods Recommended */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Foods Recommended by Doctor</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Foods your doctor has recommended you include in your diet
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newFood = e.target.value.trim();
                      const current = medicalData.foodsRecommended || [];
                      if (!current.includes(newFood)) {
                        setMedicalData({
                          ...medicalData,
                          foodsRecommended: [...current, newFood],
                        });
                        e.target.value = '';
                        showMessage('success', 'Added recommended food');
                      }
                    }
                  }}
                  placeholder="Type food/ingredient and press Enter"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 mb-4"
                />
                {medicalData.foodsRecommended && medicalData.foodsRecommended.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalData.foodsRecommended.map(food => (
                      <span
                        key={food}
                        className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm flex items-center gap-2"
                      >
                        {food}
                        <button
                          onClick={() => {
                            const updated = medicalData.foodsRecommended.filter(f => f !== food);
                            setMedicalData({ ...medicalData, foodsRecommended: updated });
                            showMessage('success', 'Removed recommended food');
                          }}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No recommended foods set yet.</p>
                )}
              </div>

              {/* Doctor Notes */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Doctor's Notes</h2>
                <textarea
                  value={medicalData.doctorNotes || ''}
                  onChange={e => setMedicalData({ ...medicalData, doctorNotes: e.target.value })}
                  placeholder="Enter any notes or instructions from your doctor..."
                  className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[120px]"
                />
                <p className="text-xs text-slate-500 mt-2">
                  These notes are stored locally and are not shared with anyone.
                </p>
              </div>

              {/* Add Required Nutrient Modal */}
              <AnimatePresence>
                {showAddRequiredNutrient && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowAddRequiredNutrient(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={e => e.stopPropagation()}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
                    >
                      <h3 className="text-xl font-bold mb-4">Add Required Nutrient</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nutrient</label>
                          <select
                            value={requiredNutrientForm.nutrientId}
                            onChange={e =>
                              setRequiredNutrientForm({
                                ...requiredNutrientForm,
                                nutrientId: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            <option value="">Select nutrient...</option>
                            {REQUIRED_NUTRIENTS.map(nutrient => (
                              <option key={nutrient.id} value={nutrient.id}>
                                {nutrient.icon} {nutrient.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Minimum Amount (per serving)
                          </label>
                          <input
                            type="number"
                            value={requiredNutrientForm.minAmount}
                            onChange={e =>
                              setRequiredNutrientForm({
                                ...requiredNutrientForm,
                                minAmount: e.target.value,
                              })
                            }
                            placeholder="e.g. 2"
                            className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (requiredNutrientForm.nutrientId && requiredNutrientForm.minAmount) {
                              const nutrient = REQUIRED_NUTRIENTS.find(
                                n => n.id === requiredNutrientForm.nutrientId
                              );
                              const current = medicalData.requiredNutrients || [];
                              setMedicalData({
                                ...medicalData,
                                requiredNutrients: [
                                  ...current,
                                  {
                                    nutrientId: requiredNutrientForm.nutrientId,
                                    minAmount: Number(requiredNutrientForm.minAmount),
                                    unit: nutrient?.unit || '',
                                  },
                                ],
                              });
                              setRequiredNutrientForm({ nutrientId: '', minAmount: '' });
                              setShowAddRequiredNutrient(false);
                              showMessage('success', 'Added required nutrient');
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold"
                        >
                          Add
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setShowAddRequiredNutrient(false);
                            setRequiredNutrientForm({ nutrientId: '', minAmount: '' });
                          }}
                          className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
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
