// src/pages/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header.jsx';
import SearchForm from './components/SearchForm.jsx';
import RecipeCard from './components/RecipeCard.jsx';
import RecipePage from './pages/RecipePage.jsx';
import MealPlanner from './pages/MealPlanner.jsx';
import Profile from './pages/Profile.jsx';
import FamilyPlan from './pages/FamilyPlan.jsx';
import Collections from './pages/Collections.jsx';
import Help from './pages/Help.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Analytics from './pages/Analytics.jsx';
import BillingManagement from './pages/BillingManagement.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';

import Filters from './components/Filters.jsx';
import GroceryDrawer from './components/GroceryDrawer.jsx';
import DailyRecipe from './components/DailyRecipe.jsx';
import GamificationDashboard from './components/GamificationDashboard.jsx';
import Favorites from './pages/Favorites.jsx';
import MealRemindersPage from './pages/MealRemindersPage.jsx';
import BudgetTrackerPage from './pages/BudgetTrackerPage.jsx';
import WaterTrackerPage from './pages/WaterTrackerPage.jsx';
import DieticianAIPage from './pages/DieticianAIPage.jsx';
import CalorieTrackerPage from './pages/CalorieTrackerPage.jsx';
import PantryPage from './pages/PantryPage.jsx';
import { RecipeCardSkeletons } from './components/LoadingSkeleton.jsx';
import { EmptyStateAnimation } from './components/LottieFoodAnimations.jsx';
import { InlineRecipeLoader, FullPageRecipeLoader } from './components/FoodLoaders.jsx';
import PullToRefresh from './components/PullToRefresh.jsx';
import BackToTop from './components/BackToTop.jsx';
import CookingAnimation from './components/CookingAnimation.jsx';
import { GroceryListProvider } from './context/GroceryListContext.jsx';
import { useFilters } from './context/FilterContext.jsx';

import { searchSupabaseRecipes } from './api/supabaseRecipes.js';
import { filterRecipesByMedicalConditions } from './utils/medicalConditions.js';
import { getPreferenceSummary } from './utils/preferenceAnalyzer.js';
import { trackRecipeInteraction } from './utils/analytics.js';
import {
  shouldShowAds,
  canPerformAction,
  recordSearch,
  getPlanDetails,
} from './utils/subscription.js';
import { checkPaymentSuccess } from './utils/paymentProviders.js';
import AdBanner, { InlineAd } from './components/AdBanner.jsx';
import ProModalWrapper from './components/ProModalWrapper.jsx';
import PremiumFeatureModalWrapper from './components/PremiumFeatureModalWrapper.jsx';
import { useToast } from './components/Toast.jsx';
import { AnimatePresence } from 'framer-motion';

// "chicken,  rice , , tomato" -> ["chicken","rice","tomato"]
const toIngredientArray = raw =>
  raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const App = () => {
  const toast = useToast();
  const filters = useFilters(); // Use FilterContext
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearch, setLastSearch] = useState('');
  const [preferenceSummary, setPreferenceSummary] = useState(null);
  const [pantry, setPantry] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('filters:pantry') || '[]');
    } catch {
      return [];
    }
  }); // ["eggs","tomato"]

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize Paddle globally when app loads
  useEffect(() => {
    const initializePaddle = () => {
      const paddleToken =
        import.meta.env.VITE_PADDLE_PUBLIC_TOKEN ||
        import.meta.env.VITE_PADDLE_CLIENT_TOKEN ||
        import.meta.env.VITE_PADDLE_TOKEN;

      console.warn('🔍 [PADDLE INIT] Token check:', {
        hasToken: !!paddleToken,
        tokenLength: paddleToken?.length || 0,
        tokenPrefix: paddleToken?.substring(0, 15) || 'none',
        tokenStartsWithTest: paddleToken?.startsWith('test_') || false,
        envVars: Object.keys(import.meta.env).filter(k => k.includes('PADDLE')),
      });

      if (!paddleToken) {
        console.error(
          '❌ [PADDLE INIT] No token found! Check Vercel env vars: VITE_PADDLE_PUBLIC_TOKEN'
        );
        return;
      }

      if (!paddleToken.startsWith('test_')) {
        console.error(
          '❌ [PADDLE INIT] Token does not start with "test_" - make sure you are using SANDBOX token!'
        );
      }

      if (window.Paddle && typeof window.Paddle.Initialize === 'function') {
        try {
          // CRITICAL: Set environment BEFORE Initialize (Paddle v2 quirk)
          // If token starts with test_, use sandbox; otherwise production
          const isSandbox = paddleToken.startsWith('test_');
          if (window.Paddle.Environment && typeof window.Paddle.Environment.set === 'function') {
            window.Paddle.Environment.set(isSandbox ? 'sandbox' : 'production');
          }

          // Now initialize with token
          window.Paddle.Initialize({
            token: paddleToken,
          });
          console.warn('✅ [PADDLE INIT] Paddle initialized', {
            environment: isSandbox ? 'sandbox' : 'production',
          });
        } catch (err) {
          console.error('❌ [PADDLE] Failed to initialize:', err);
        }
      }
    };

    // Try to initialize immediately if Paddle is already loaded
    if (window.Paddle) {
      initializePaddle();
    } else {
      // Wait for Paddle.js to load
      const checkPaddle = setInterval(() => {
        if (window.Paddle) {
          clearInterval(checkPaddle);
          initializePaddle();
        }
      }, 100);

      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkPaddle), 5000);
    }
  }, []);

  // Handle Paddle checkout redirect with _ptxn parameter
  useEffect(() => {
    const handlePaddleCheckout = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionId = urlParams.get('_ptxn');

      if (!transactionId) {
        return;
      }

      // Function to open checkout
      const openCheckout = async () => {
        try {
          if (!window.Paddle || typeof window.Paddle.Checkout === 'undefined') {
            console.error('❌ [PADDLE] Paddle.js not ready');
            return;
          }

          // Ensure Paddle is initialized (re-initialize if needed)
          const paddleToken =
            import.meta.env.VITE_PADDLE_PUBLIC_TOKEN ||
            import.meta.env.VITE_PADDLE_CLIENT_TOKEN ||
            import.meta.env.VITE_PADDLE_TOKEN;

          if (!paddleToken) {
            console.error(
              '❌ [PADDLE CHECKOUT] No token found! Check Vercel: VITE_PADDLE_PUBLIC_TOKEN'
            );
            return;
          }

          if (!paddleToken.startsWith('test_')) {
            console.error(
              '❌ [PADDLE CHECKOUT] Token does not start with "test_" - using sandbox?'
            );
          }

          console.warn('🔍 [PADDLE CHECKOUT] Using token:', paddleToken.substring(0, 15) + '...');

          // CRITICAL: Set environment BEFORE Initialize (Paddle v2 quirk)
          const isSandbox = paddleToken.startsWith('test_');
          if (window.Paddle.Environment && typeof window.Paddle.Environment.set === 'function') {
            window.Paddle.Environment.set(isSandbox ? 'sandbox' : 'production');
          }

          // Always re-initialize to ensure it's ready
          window.Paddle.Initialize({
            token: paddleToken,
          });
          // Wait for initialization to complete
          await new Promise(resolve => setTimeout(resolve, 300));

          // Open checkout for the transaction
          try {
            const checkoutResult = window.Paddle.Checkout.open({
              transactionId: transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
              },
            });

            // Get plan from stored checkout data
            const getCheckoutData = () => {
              try {
                const checkoutDataStr = localStorage.getItem('paddle:checkout:data');
                console.warn('🔍 [PADDLE CHECKOUT] Reading checkout data from localStorage:', {
                  hasData: !!checkoutDataStr,
                  dataLength: checkoutDataStr?.length || 0,
                });
                if (checkoutDataStr) {
                  const checkoutData = JSON.parse(checkoutDataStr);
                  console.warn('📦 [PADDLE CHECKOUT] Parsed checkout data:', {
                    plan: checkoutData.plan,
                    billingPeriod: checkoutData.billingPeriod,
                    transactionId: checkoutData.transactionId,
                    userEmail: checkoutData.userEmail,
                  });
                  return checkoutData;
                }
              } catch (err) {
                console.error('❌ [PADDLE CHECKOUT] Error parsing checkout data:', err);
              }
              console.error('❌ [PADDLE CHECKOUT] No checkout data found in localStorage');
              return null;
            };

            // Handle checkout completion - update plan immediately
            const handleCheckoutComplete = async () => {
              console.warn('🚀 [PADDLE CHECKOUT] ============================================');
              console.warn('🚀 [PADDLE CHECKOUT] CHECKOUT COMPLETED - STARTING PLAN UPDATE');
              console.warn('🚀 [PADDLE CHECKOUT] Transaction ID:', transactionId);
              console.warn('🚀 [PADDLE CHECKOUT] ============================================');

              try {
                // Get checkout data (plan, billing period, etc.)
                console.warn(
                  '📋 [PADDLE CHECKOUT] Step 1: Getting checkout data from localStorage...'
                );
                const checkoutData = getCheckoutData();
                if (!checkoutData) {
                  console.error('❌ [PADDLE CHECKOUT] Step 1 FAILED: No checkout data found');
                  toast.error('Failed to find payment details. Please contact support.');
                  return;
                }
                console.warn('✅ [PADDLE CHECKOUT] Step 1 SUCCESS: Checkout data found:', {
                  plan: checkoutData.plan,
                  billingPeriod: checkoutData.billingPeriod,
                  transactionId: checkoutData.transactionId,
                });

                // Get user email
                console.warn('📋 [PADDLE CHECKOUT] Step 2: Getting user from Supabase...');
                const { supabase } = await import('./lib/supabaseClient.js');
                const {
                  data: { user },
                  error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                  console.error(
                    '❌ [PADDLE CHECKOUT] Step 2 FAILED: Error getting user:',
                    userError
                  );
                  toast.error('Please sign in to activate your plan.');
                  return;
                }

                if (!user?.email) {
                  console.error('❌ [PADDLE CHECKOUT] Step 2 FAILED: No user email found');
                  console.error('❌ [PADDLE CHECKOUT] User object:', user);
                  toast.error('Please sign in to activate your plan.');
                  return;
                }
                console.warn('✅ [PADDLE CHECKOUT] Step 2 SUCCESS: User found:', {
                  email: user.email,
                  userId: user.id,
                });

                // Directly update plan via API (immediate, doesn't wait for webhook)
                console.warn('📋 [PADDLE CHECKOUT] Step 3: Calling update-plan API...');
                console.warn('📋 [PADDLE CHECKOUT] Request payload:', {
                  transactionId: transactionId,
                  plan: checkoutData.plan,
                  billingPeriod: checkoutData.billingPeriod || 'monthly',
                  userEmail: user.email,
                });

                const updateResponse = await fetch('/api/paddle/update-plan', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    transactionId: transactionId,
                    plan: checkoutData.plan,
                    billingPeriod: checkoutData.billingPeriod || 'monthly',
                    userEmail: user.email,
                  }),
                });

                console.warn('📋 [PADDLE CHECKOUT] Step 3: API response received:', {
                  status: updateResponse.status,
                  statusText: updateResponse.statusText,
                  ok: updateResponse.ok,
                });

                const responseText = await updateResponse.text();
                console.warn('📋 [PADDLE CHECKOUT] Step 3: Response body:', responseText);

                if (updateResponse.ok) {
                  console.warn('✅ [PADDLE CHECKOUT] Step 3 SUCCESS: Plan updated via API');

                  // Clear cache and refresh
                  console.warn(
                    '📋 [PADDLE CHECKOUT] Step 4: Clearing cache and fetching fresh plan...'
                  );
                  const subscriptionUtils = await import('./utils/subscription.js');
                  subscriptionUtils.clearPlanCache();
                  console.warn('✅ [PADDLE CHECKOUT] Cache cleared');

                  // Wait a moment then fetch fresh plan
                  await new Promise(resolve => setTimeout(resolve, 500));
                  console.warn('📋 [PADDLE CHECKOUT] Fetching plan from Supabase...');
                  const actualPlan = await subscriptionUtils.getCurrentPlan();
                  console.warn(
                    '✅ [PADDLE CHECKOUT] Step 4 SUCCESS: Plan fetched from Supabase:',
                    actualPlan
                  );

                  subscriptionUtils.setCurrentPlan(actualPlan, true); // Skip verification - already verified via API
                  console.warn('✅ [PADDLE CHECKOUT] Plan set in localStorage:', actualPlan);

                  // Show success message
                  toast.success(`🎉 Congratulations! Your ${actualPlan} plan is now active!`, 8000);

                  // Dispatch plan change event
                  window.dispatchEvent(
                    new CustomEvent('subscriptionPlanChanged', { detail: { plan: actualPlan } })
                  );
                  console.warn('✅ [PADDLE CHECKOUT] Plan change event dispatched');

                  // Clean up stored checkout data
                  localStorage.removeItem('paddle:checkout:data');
                  console.warn('✅ [PADDLE CHECKOUT] Checkout data cleaned up');

                  // Refresh page after a delay
                  console.warn('📋 [PADDLE CHECKOUT] Refreshing page in 2 seconds...');
                  setTimeout(() => {
                    console.warn('🔄 [PADDLE CHECKOUT] RELOADING PAGE NOW');
                    window.location.reload();
                  }, 2000);
                } else {
                  console.error('❌ [PADDLE CHECKOUT] Step 3 FAILED: API returned error');
                  console.error('❌ [PADDLE CHECKOUT] Error response:', responseText);

                  // Fallback: wait for webhook and refresh
                  console.warn('📋 [PADDLE CHECKOUT] FALLBACK: Waiting for webhook (3 seconds)...');
                  const subscriptionUtils = await import('./utils/subscription.js');
                  subscriptionUtils.clearPlanCache();
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  console.warn(
                    '📋 [PADDLE CHECKOUT] FALLBACK: Fetching plan after webhook wait...'
                  );
                  const plan = await subscriptionUtils.getCurrentPlan();
                  console.warn('📋 [PADDLE CHECKOUT] FALLBACK: Plan fetched:', plan);
                  subscriptionUtils.setCurrentPlan(plan);
                  toast.success(`🎉 Payment successful! Your ${plan} plan is now active!`, 8000);
                  setTimeout(() => window.location.reload(), 2000);
                }
              } catch (err) {
                console.error('❌ [PADDLE CHECKOUT] ============================================');
                console.error('❌ [PADDLE CHECKOUT] EXCEPTION CAUGHT:', err);
                console.error('❌ [PADDLE CHECKOUT] Error message:', err.message);
                console.error('❌ [PADDLE CHECKOUT] Error stack:', err.stack);
                console.error('❌ [PADDLE CHECKOUT] ============================================');
                toast.success('🎉 Payment successful! Your plan will be activated shortly.');
              }
            };

            // Monitor for checkout completion
            console.warn('🔍 [PADDLE CHECKOUT] Starting checkout completion monitor...');
            console.warn('🔍 [PADDLE CHECKOUT] Transaction ID being monitored:', transactionId);

            // Paddle overlay mode doesn't reliably fire events, so we check when modal closes
            let lastModalState = true;
            let checkCount = 0;
            let checkInterval = setInterval(() => {
              checkCount++;
              // Check if Paddle checkout modal/overlay is visible
              const paddleOverlay =
                document.querySelector('[data-paddle-overlay]') ||
                document.querySelector('.paddle-checkout-overlay') ||
                document.querySelector('[class*="paddle"]') ||
                document.querySelector('iframe[src*="paddle"]');

              const isModalOpen =
                paddleOverlay &&
                paddleOverlay.offsetParent !== null &&
                window.getComputedStyle(paddleOverlay).display !== 'none';

              // Log every 10 checks (every 10 seconds)
              if (checkCount % 10 === 0) {
                console.warn('🔍 [PADDLE CHECKOUT] Monitor check #' + checkCount + ':', {
                  modalOpen: isModalOpen,
                  foundOverlay: !!paddleOverlay,
                  transactionId: transactionId,
                });
              }

              // If modal was open and now closed, payment might be complete
              if (lastModalState && !isModalOpen) {
                console.warn(
                  '✅ [PADDLE CHECKOUT] Modal closed detected! Triggering plan update...'
                );
                clearInterval(checkInterval);
                // Wait a moment for Paddle to finish processing
                setTimeout(handleCheckoutComplete, 1000);
              }

              lastModalState = isModalOpen;
            }, 1000);

            // Stop checking after 5 minutes
            setTimeout(
              () => {
                console.warn('⏰ [PADDLE CHECKOUT] Monitor timeout (5 minutes), stopping checks');
                clearInterval(checkInterval);
              },
              5 * 60 * 1000
            );

            if (checkoutResult && typeof checkoutResult.catch === 'function') {
              checkoutResult.catch(err => {
                console.error('❌ [PADDLE] Checkout.open() failed:', err);
                toast.error('Failed to open checkout. Please try again.');
              });
            }
          } catch (err) {
            console.error('❌ [PADDLE] Error opening checkout:', err);
            toast.error('Failed to open checkout. Please try again.');
          }

          // Clean up URL - remove _ptxn parameter after a delay
          setTimeout(() => {
            urlParams.delete('_ptxn');
            const newUrl =
              window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
          }, 1000);
        } catch (err) {
          console.error('❌ [PADDLE] Error opening checkout:', err);
        }
      };

      // Wait for Paddle.js to load, then handle checkout
      if (window.Paddle) {
        openCheckout();
      } else {
        // Wait for Paddle.js to load
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        const checkPaddle = setInterval(() => {
          attempts++;
          if (window.Paddle) {
            clearInterval(checkPaddle);
            openCheckout();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkPaddle);
            console.error('❌ [PADDLE] Paddle.js failed to load');
          }
        }, 100);
      }
    };

    // Run immediately
    handlePaddleCheckout();

    // Also listen for popstate (browser back/forward)
    const handlePopStateChange = () => {
      handlePaddleCheckout();
    };
    window.addEventListener('popstate', handlePopStateChange);

    return () => {
      window.removeEventListener('popstate', handlePopStateChange);
    };
  }, []);

  // Initialize subscription plan on app load
  useEffect(() => {
    const initializePlan = async () => {
      try {
        const { getCurrentPlan } = await import('./utils/subscription.js');
        const plan = await getCurrentPlan();
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('subscriptionPlanChanged', { detail: { plan } }));
      } catch (error) {
        // Plan initialization failed - user will see free plan
      }
    };
    initializePlan();
  }, []);

  // Listen for subscription plan changes (from auth, payments, etc.)
  useEffect(() => {
    const handlePlanChange = async event => {
      const { plan } = event.detail || {};
      // Plan changed - UI will update automatically
      // Force refresh of plan-dependent features
      // Components will re-check limits when they re-render
    };
    window.addEventListener('subscriptionPlanChanged', handlePlanChange);
    return () => window.removeEventListener('subscriptionPlanChanged', handlePlanChange);
  }, []);

  // Check for payment success on mount (from URL redirect)
  useEffect(() => {
    const paymentResult = checkPaymentSuccess();
    if (paymentResult?.success) {
      // Payment successful - force refresh from Supabase
      const { plan } = paymentResult;
      import('./utils/subscription.js').then(async subscriptionUtils => {
        // Clear cache to force fresh fetch from Supabase
        subscriptionUtils.clearPlanCache();
        // Wait a moment for webhook to process (if it hasn't already)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const actualPlan = await subscriptionUtils.getCurrentPlan();

        // Update local storage
        subscriptionUtils.setCurrentPlan(actualPlan);

        // Show success message
        toast.success(`🎉 Congratulations! Your ${actualPlan} plan is now active!`, 8000);

        // Dispatch plan change event
        window.dispatchEvent(
          new CustomEvent('subscriptionPlanChanged', { detail: { plan: actualPlan } })
        );

        // Refresh to update UI after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
    } else if (paymentResult?.canceled) {
      // Payment canceled - no action needed
      toast.info('Payment was canceled.');
    }
  }, [toast]);

  // Listen for toast events from contexts (e.g., GroceryListContext)
  useEffect(() => {
    const handleShowToast = event => {
      const { type, message, duration } = event.detail || {};
      if (type && message) {
        toast[type](message, duration || 5000);
      }
    };
    window.addEventListener('showToast', handleShowToast);
    return () => window.removeEventListener('showToast', handleShowToast);
  }, [toast]);

  // Persist pantry chips (filters are now managed by FilterContext)
  useEffect(() => {
    try {
      localStorage.setItem('filters:pantry', JSON.stringify(pantry));
    } catch (error) {
      console.warn('Failed to save pantry to localStorage:', error);
    }
  }, [pantry]);

  // Note: Notification permission should be requested on user interaction
  // We'll request it when user clicks a button or interacts with the app

  // Cross-tab sync for favorites and subscription plan
  useEffect(() => {
    const onStorage = e => {
      if (e.key === 'favorites' && e.newValue) {
        setFavorites(JSON.parse(e.newValue));
      } else if (e.key === 'subscription:plan:v1' && e.newValue) {
        // Plan changed in another tab - refresh
        // Plan changed in another tab - will refresh
        window.dispatchEvent(
          new CustomEvent('subscriptionPlanChanged', { detail: { plan: e.newValue } })
        );
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Update preference summary
  useEffect(() => {
    const summary = getPreferenceSummary();
    setPreferenceSummary(summary);
  }, [favorites]);

  // Debounce ref for filter changes
  const filterDebounceRef = React.useRef(null);

  // Main search using the unified API wrapper (handles quota fallback)
  // Enhanced with robust error handling, query validation, and smart fallbacks
  const fetchRecipes = useCallback(
    async (raw = '', options = {}) => {
      const { allowEmpty = false } = options;

      // Robust query parsing and validation
      const trimmedQuery = typeof raw === 'string' ? raw.trim() : '';
      const includeIngredients = [
        ...toIngredientArray(raw || ''),
        ...(Array.isArray(pantry) ? pantry : []).filter(Boolean),
      ].filter(Boolean);

      const shouldShowDefaultFeed = !trimmedQuery && includeIngredients.length === 0;

      // Note: Searches are now unlimited for all plans, but we still record them for analytics
      // No need to check limits anymore

      // Normalize filter values with robust validation (from FilterContext)
      const normalizedDiet =
        filters.diet &&
        typeof filters.diet === 'string' &&
        filters.diet.toLowerCase() !== 'any diet'
          ? filters.diet.trim()
          : '';
      const normalizedMealType =
        filters.mealType &&
        typeof filters.mealType === 'string' &&
        filters.mealType.toLowerCase() !== 'any meal'
          ? filters.mealType.trim()
          : '';
      const normalizedMaxTime =
        filters.maxTime &&
        typeof filters.maxTime === 'string' &&
        filters.maxTime.toLowerCase() !== 'any time'
          ? filters.maxTime.trim()
          : '';

      // Validate query length (prevent extremely long queries that could cause issues)
      if (trimmedQuery.length > 200) {
        setError('Search query is too long. Please use 200 characters or less.');
        setRecipes([]);
        setLoading(false);
        return;
      }

      if (!allowEmpty && shouldShowDefaultFeed && pantry.length === 0) {
        setError('Type a keyword, pick a pantry ingredient, or scroll through the featured feed.');
        setRecipes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setLastSearch(raw ?? '');

      // Record search if it's an actual search (not default feed)
      if (!shouldShowDefaultFeed) {
        try {
          recordSearch();
        } catch (recordError) {
          // Silently fail analytics - don't block search
          console.warn('[fetchRecipes] Failed to record search:', recordError);
        }
      }

      try {
        // Read additional filters from localStorage (managed by Filters component)
        // Use try-catch for each localStorage access to prevent errors
        let cuisine = '';
        let difficulty = '';
        let minProtein = '';
        let maxCarbs = '';
        let selectedIntolerances = [];
        let intolerancesString = '';

        try {
          cuisine = localStorage.getItem('filters:cuisine') || '';
          difficulty = localStorage.getItem('filters:difficulty') || '';
          minProtein = localStorage.getItem('filters:minProtein') || '';
          maxCarbs = localStorage.getItem('filters:maxCarbs') || '';
          const intolerancesRaw = localStorage.getItem('filters:selectedIntolerances') || '[]';
          selectedIntolerances = JSON.parse(intolerancesRaw);
          if (!Array.isArray(selectedIntolerances)) {
            selectedIntolerances = [];
          }
          intolerancesString =
            selectedIntolerances.length > 0 ? selectedIntolerances.join(',') : '';
        } catch (storageError) {
          console.warn('[fetchRecipes] Error reading filters from localStorage:', storageError);
          // Continue with empty filters
        }

        // Validate numeric filters (from FilterContext)
        const validatedMaxCalories =
          filters.maxCalories &&
          !isNaN(Number(filters.maxCalories)) &&
          Number(filters.maxCalories) > 0
            ? String(Number(filters.maxCalories))
            : '';
        const validatedHealthScore =
          filters.healthScore &&
          !isNaN(Number(filters.healthScore)) &&
          Number(filters.healthScore) > 0
            ? String(Number(filters.healthScore))
            : '';

        // Execute search with timeout protection
        const searchPromise = searchSupabaseRecipes({
          query: trimmedQuery,
          includeIngredients: shouldShowDefaultFeed ? [] : includeIngredients,
          diet: normalizedDiet,
          mealType: normalizedMealType,
          maxTime: normalizedMaxTime,
          cuisine: cuisine || '',
          difficulty: difficulty || '',
          maxCalories: validatedMaxCalories,
          healthScore: validatedHealthScore,
          minProtein: minProtein || '',
          maxCarbs: maxCarbs || '',
          intolerances: intolerancesString,
          limit: 24,
        });

        // Add timeout to prevent hanging requests (30 seconds)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Search request timed out. Please try again.')), 30000);
        });

        const supabaseResults = await Promise.race([searchPromise, timeoutPromise]);

        if (supabaseResults?.length) {
          setRecipes(supabaseResults);
          // Clear any previous errors on success
          setError(null);

          // Optional: Show notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`🍽 Found ${supabaseResults.length} recipes`);
            } catch (notifError) {
              // Silently fail notifications
              console.warn('[fetchRecipes] Failed to show notification:', notifError);
            }
          }
        } else {
          setRecipes([]);
          // Provide helpful error message based on search type
          if (trimmedQuery || includeIngredients.length > 0) {
            setError(
              'No recipes found matching your search. Try different keywords, adjust your filters, or browse the featured recipes below.'
            );
          } else {
            setError(
              'No recipes matched your filters. Try adjusting your search criteria or browse the featured recipes below.'
            );
          }
        }
      } catch (searchError) {
        console.error('[fetchRecipes] Search error:', searchError);

        // Enhanced error messages for different error types
        let errorMessage = 'Failed to load recipes. Please try again.';

        if (searchError instanceof TypeError) {
          if (searchError.message.includes('fetch') || searchError.message.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (searchError.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
          }
        } else if (searchError instanceof Error) {
          if (
            searchError.message.includes('timeout') ||
            searchError.message.includes('timed out')
          ) {
            errorMessage = 'Search request timed out. Please try a simpler search or try again.';
          } else if (searchError.message) {
            errorMessage = searchError.message;
          }
        } else if (searchError?.error?.message) {
          errorMessage = searchError.error.message;
        } else if (searchError?.message) {
          errorMessage = searchError.message;
        }

        setError(errorMessage);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    },
    [
      filters.diet,
      filters.mealType,
      filters.maxTime,
      pantry,
      filters.maxCalories,
      filters.healthScore,
    ]
  );

  // Only fetch on mount
  useEffect(() => {
    fetchRecipes('', { allowEmpty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search when filters change (but not on initial mount)
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timeout
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }

    // Set new timeout
    filterDebounceRef.current = setTimeout(() => {
      fetchRecipes(lastSearch || '', { allowEmpty: true });
    }, 500);
  }, [
    filters.diet,
    filters.mealType,
    filters.maxTime,
    pantry,
    filters.maxCalories,
    filters.healthScore,
    fetchRecipes,
    lastSearch,
  ]);

  // Add/Remove favorite (dedupe by id) - memoized to prevent re-renders
  const toggleFavorite = useCallback(
    recipe => {
      const exists = favorites.some(f => f.id === recipe.id);

      // ENFORCE FAVORITES LIMIT - Check if user can add more favorites
      if (!exists) {
        const canFavorite = canPerformAction('favorite', favorites.length);
        if (!canFavorite) {
          const planDetails = getPlanDetails();
          toast.error(
            `⭐ Favorites limit reached! You've saved ${favorites.length} recipes. The Free plan allows up to ${planDetails.favoritesLimit} favorites. Upgrade to save unlimited recipes!`,
            { duration: 5000 }
          );
          // Trigger upgrade modal
          window.dispatchEvent(new CustomEvent('openProModal'));
          return;
        }
      }

      const updated = exists ? favorites.filter(f => f.id !== recipe.id) : [recipe, ...favorites];
      setFavorites(updated);
      localStorage.setItem('favorites', JSON.stringify(updated));

      // Track interaction
      if (recipe?.id) {
        trackRecipeInteraction(recipe.id, exists ? 'unfavorite' : 'favorite', {
          title: recipe.title,
          image: recipe.image,
        });
      }
    },
    [favorites, toast]
  );

  // Memoize favorite IDs set for O(1) lookup instead of O(n) some() calls
  const favoriteIds = useMemo(() => {
    return new Set(favorites.map(f => f.id));
  }, [favorites]);

  return (
    <Router>
      <GroceryListProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            favorites={favorites}
            setFavorites={setFavorites}
          />

          <Routes>
            <Route
              path="/"
              element={
                <PullToRefresh
                  onRefresh={() => fetchRecipes(lastSearch || '', { allowEmpty: true })}
                >
                  <main className="mx-auto max-w-7xl px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 xs:py-6 sm:py-8">
                    {/* Search Form - At the Very Top */}
                    <div className="mb-6 xs:mb-8 sm:mb-10">
                      <SearchForm onSearch={fetchRecipes} />
                    </div>

                    {/* Daily Recipe Surprise */}
                    <div className="mb-4 xs:mb-6 sm:mb-8">
                      <DailyRecipe onRecipeSelect={toggleFavorite} />
                    </div>

                    {/* Gamification Dashboard - Progress Tracking */}
                    <div className="mb-4 xs:mb-6 sm:mb-8">
                      <GamificationDashboard />
                    </div>

                    {/* Ad Banner (Top) */}
                    {shouldShowAds() && (
                      <div className="mb-4">
                        <AdBanner position="top" size="banner" />
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-b border-slate-200 dark:border-slate-800 mb-6" />

                    {/* Inline Ad (after search, before filters) */}
                    {shouldShowAds() && (
                      <div className="mb-6">
                        <InlineAd />
                      </div>
                    )}

                    {/* Smart Filters - Now using FilterContext */}
                    <Filters
                      onFiltersChange={useCallback(() => {
                        // Filters are already persisted to localStorage
                        // The debounced useEffect will handle the search automatically
                      }, [])}
                    />

                    {loading && (
                      <div className="mt-10">
                        <InlineRecipeLoader />
                      </div>
                    )}

                    {error && (
                      <div className="mt-6 xs:mt-8 px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-center text-sm xs:text-base text-red-600 dark:text-red-400 font-semibold break-words">
                          {error}
                        </p>
                      </div>
                    )}

                    {recipes.length > 0 && (
                      <>
                        {/* Divider */}
                        <div className="border-b border-slate-200 dark:border-slate-800 my-4 xs:my-5 sm:my-6" />
                        <section className="mt-6 xs:mt-8 sm:mt-10">
                          <div className="flex items-baseline justify-between mb-3 xs:mb-4">
                            <h2 className="text-lg xs:text-xl sm:text-2xl font-bold">
                              Recipe Results
                            </h2>
                          </div>

                          <div className="grid gap-3 xs:gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {recipes.map((recipe, idx) => (
                              <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                index={idx}
                                onFavorite={() => toggleFavorite(recipe)}
                                isFavorite={favoriteIds.has(recipe.id)}
                              />
                            ))}
                          </div>
                        </section>
                      </>
                    )}

                    {!loading && !error && recipes.length === 0 && (
                      <div className="mt-10 xs:mt-12 sm:mt-16 text-center text-slate-500 dark:text-slate-400 px-4">
                        <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6">
                          <CookingAnimation
                            type="recipe-book"
                            className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 opacity-50"
                          />
                        </div>
                        <p className="mb-2 text-base xs:text-lg font-semibold">
                          Ready to cook something delicious?
                        </p>
                        <p className="mb-3 xs:mb-4 text-xs xs:text-sm">Try something like:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {['chicken, rice', 'eggs, tomato', 'pasta, bacon', 'tofu, broccoli'].map(
                            s => (
                              <button
                                key={s}
                                className="px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors min-h-[44px] xs:min-h-0 touch-manipulation"
                                onClick={() => fetchRecipes(s)}
                              >
                                {s}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </main>

                  {/* Ad Banner (Bottom) */}
                  {shouldShowAds() && (
                    <div className="mt-6">
                      <AdBanner position="bottom" size="banner" />
                    </div>
                  )}
                </PullToRefresh>
              }
            />
            <Route path="/recipe/:id" element={<RecipePage />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/family-plan" element={<FamilyPlan />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/billing" element={<BillingManagement />} />
            <Route path="/admin" element={<ProtectedAdminRoute />} />
            <Route
              path="/favorites"
              element={
                <Favorites
                  favorites={favorites}
                  setFavorites={setFavorites}
                  onFavorite={toggleFavorite}
                />
              }
            />
            <Route path="/meal-reminders" element={<MealRemindersPage />} />
            <Route path="/budget-tracker" element={<BudgetTrackerPage />} />
            <Route path="/water-tracker" element={<WaterTrackerPage />} />
            <Route path="/dietician-ai" element={<DieticianAIPage />} />
            <Route path="/calorie-tracker" element={<CalorieTrackerPage />} />
            <Route path="/pantry" element={<PantryPage />} />
          </Routes>

          {/* Pro Modal Wrapper - listen for open event */}
          <ProModalWrapper />
          <PremiumFeatureModalWrapper />

          {/* Floating grocery list drawer */}
          <GroceryDrawer />

          {/* Back to top button */}
          <BackToTop />
        </div>
      </GroceryListProvider>
    </Router>
  );
};

export default App;
