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
import Settings from './pages/Settings.jsx';
import Analytics from './pages/Analytics.jsx';
import SharedRecipePage from './pages/SharedRecipePage.jsx';
import BillingManagement from './pages/BillingManagement.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import MissingImagesPage from './pages/MissingImagesPage.jsx';
import MissingNutritionPage from './pages/MissingNutritionPage.jsx';

import Filters from './components/Filters.jsx';
import GroceryDrawer from './components/GroceryDrawer.jsx';
import DailyRecipe from './components/DailyRecipe.jsx';
import Pagination from './components/Pagination.jsx';
import GamificationBubbles from './components/GamificationBubbles.jsx';
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
import CookingMiniGames from './components/CookingMiniGames.jsx';
import InstallPWA from './components/InstallPWA.jsx';
import { GroceryListProvider } from './context/GroceryListContext.jsx';
import { useFilters } from './context/FilterContext.jsx';
import {
  safeLocalStorage,
  safeJSONParse,
  safeJSONStringify,
} from './utils/browserCompatibility.js';

import { searchSupabaseRecipes } from './api/supabaseRecipes.js';
import { filterRecipesByMedicalConditions } from './utils/medicalConditions.js';
import { getPreferenceSummary } from './utils/preferenceAnalyzer.js';
import { trackRecipeInteraction } from './utils/analytics.js';
import { useAdmin } from './context/AdminContext.jsx';
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
import CacheGuard from './components/CacheGuard.jsx';

// "chicken,  rice , , tomato" -> ["chicken","rice","tomato"]
const toIngredientArray = raw =>
  raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const App = () => {
  const toast = useToast();
  const filters = useFilters(); // Use FilterContext
  const { isAdmin } = useAdmin(); // Get admin status
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = safeLocalStorage.getItem('favorites');
    return saved ? safeJSONParse(saved, []) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearch, setLastSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recipesPerPage, setRecipesPerPage] = useState(() => {
    try {
      const saved = safeLocalStorage.getItem('recipesPerPage');
      return saved ? Math.max(12, Math.min(120, parseInt(saved, 10))) : 24;
    } catch {
      return 24;
    }
  });
  const [_preferenceSummary, setPreferenceSummary] = useState(null);
  const [miniGamesOpen, setMiniGamesOpen] = useState(false);
  const [pantry, _setPantry] = useState(() => {
    try {
      return safeJSONParse(safeLocalStorage.getItem('filters:pantry'), []);
    } catch {
      return [];
    }
  }); // ["eggs","tomato"]

  // Theme is now managed globally by ThemeContext

  // Listen for mini games open event
  useEffect(() => {
    const handleOpenMiniGames = () => {
      setMiniGamesOpen(true);
    };

    window.addEventListener('openMiniGames', handleOpenMiniGames);
    return () => {
      window.removeEventListener('openMiniGames', handleOpenMiniGames);
    };
  }, []);

  // Initialize Paddle globally when app loads
  useEffect(() => {
    const initializePaddle = () => {
      const paddleToken =
        import.meta.env.VITE_PADDLE_PUBLIC_TOKEN ||
        import.meta.env.VITE_PADDLE_CLIENT_TOKEN ||
        import.meta.env.VITE_PADDLE_TOKEN;

      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.warn('🔍 [PADDLE INIT] Token check:', {
          hasToken: !!paddleToken,
          tokenLength: paddleToken?.length || 0,
          tokenPrefix: paddleToken?.substring(0, 15) || 'none',
          tokenStartsWithTest: paddleToken?.startsWith('test_') || false,
          envVars: Object.keys(import.meta.env).filter(k => k.includes('PADDLE')),
        });
      }

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
          // Only log in development to reduce console noise
          if (import.meta.env.DEV) {
            console.warn('✅ [PADDLE INIT] Paddle initialized', {
              environment: isSandbox ? 'sandbox' : 'production',
            });
          }
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
                const checkoutDataStr = safeLocalStorage.getItem('paddle:checkout:data');
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
                  safeLocalStorage.removeItem('paddle:checkout:data');
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
  }, [toast]);

  // Initialize subscription plan on app load
  useEffect(() => {
    const initializePlan = async () => {
      try {
        const { getCurrentPlan } = await import('./utils/subscription.js');
        const plan = await getCurrentPlan();
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('subscriptionPlanChanged', { detail: { plan } }));
      } catch (_error) {
        // Plan initialization failed - user will see free plan
      }
    };
    initializePlan();
  }, []);

  // Listen for subscription plan changes (from auth, payments, etc.)
  useEffect(() => {
    const handlePlanChange = async event => {
      const { plan: _plan } = event.detail || {};
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
      const { plan: _plan } = paymentResult;
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
      safeLocalStorage.setItem('filters:pantry', safeJSONStringify(pantry));
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
  // Ref to prevent duplicate simultaneous requests
  const isFetchingRef = React.useRef(false);

  // Main search using the unified API wrapper (handles quota fallback)
  // Enhanced with robust error handling, query validation, and smart fallbacks
  const fetchRecipes = useCallback(
    async (raw = '', options = {}) => {
      // Prevent duplicate simultaneous requests
      if (isFetchingRef.current) {
        if (import.meta.env.DEV) {
          // Already fetching, skipping duplicate request
        }
        return;
      }

      const { allowEmpty = false, limitOverride } = options;

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

      // Set loading state and mark as fetching
      isFetchingRef.current = true;
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

      const fetchStartTime = Date.now();

      try {
        // Use FilterContext for all filters (consistent source)
        const cuisine = filters.cuisine || '';
        const difficulty = filters.difficulty || '';
        const minProtein = filters.minProtein || '';
        const maxCarbs = filters.maxCarbs || '';
        const selectedIntolerances = Array.isArray(filters.selectedIntolerances)
          ? filters.selectedIntolerances
          : [];
        const intolerancesString =
          selectedIntolerances.length > 0 ? selectedIntolerances.join(',') : '';

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
        const page = options.page || 1;
        const offset = options.offset || (page - 1) * recipesPerPage;
        
        // Increase limit when filters are active because client-side filtering removes many results
        // This ensures we get enough recipes after filtering
        const hasActiveFilters = filters.hasActiveFilters();
        const baseLimit = limitOverride || recipesPerPage;
        // If filters are active, fetch 3-4x more recipes to account for client-side filtering
        const requestedLimit = hasActiveFilters ? Math.max(baseLimit * 3, 100) : baseLimit;

        if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
          console.warn('🔍 [FETCH RECIPES] Starting recipe fetch');
          console.warn('🔍 [FETCH RECIPES] Params:', {
            query: trimmedQuery || '(empty)',
            includeIngredients: includeIngredients.length,
            diet: normalizedDiet || 'none',
            mealType: normalizedMealType || 'none',
            maxTime: normalizedMaxTime || 'none',
            cuisine: cuisine || 'none',
            difficulty: difficulty || 'none',
            page,
            offset,
            limit: requestedLimit,
            shouldShowDefaultFeed,
            timestamp: new Date().toISOString(),
          });
        }

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
          limit: requestedLimit,
          offset: offset, // Add offset for server-side pagination
          isAdmin: isAdmin, // Pass admin status - admins see all recipes including incomplete ones
        });

        // Add timeout to prevent hanging requests (25 seconds - reduced from 30)
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            const elapsed = Date.now() - fetchStartTime;
            if (import.meta.env.DEV) {
              console.error('⏰ [FETCH RECIPES] TIMEOUT after', elapsed, 'ms');
            }
            reject(new Error('Search request timed out. Please try again.'));
          }, 25000);
        });

        if (import.meta.env.DEV) {
          // Racing search promise against timeout
        }

        let searchResult;
        try {
          searchResult = await Promise.race([searchPromise, timeoutPromise]);
          // Clear timeout if query completed successfully
          if (timeoutId) clearTimeout(timeoutId);
        } catch (error) {
          // Clear timeout on error too
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }

        const fetchElapsed = Date.now() - fetchStartTime;

        if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
          console.warn('✅ [FETCH RECIPES] Search completed in', fetchElapsed, 'ms');
          console.warn('✅ [FETCH RECIPES] Result:', {
            isArray: Array.isArray(searchResult),
            hasData: !!searchResult?.data,
            dataLength: Array.isArray(searchResult)
              ? searchResult.length
              : searchResult?.data?.length || 0,
            totalCount: searchResult?.totalCount ?? 'null',
            searchResultType: typeof searchResult,
            searchResultKeys:
              searchResult && typeof searchResult === 'object' ? Object.keys(searchResult) : 'N/A',
          });
        }

        // Handle both old format (array) and new format (object with data and totalCount)
        // CRITICAL: Ensure we extract the data correctly
        let supabaseResults;
        let totalCountFromServer = null;

        if (Array.isArray(searchResult)) {
          // Old format: direct array
          supabaseResults = searchResult;
        } else if (searchResult && typeof searchResult === 'object') {
          // New format: object with data and totalCount
          supabaseResults = searchResult.data || [];
          totalCountFromServer = searchResult.totalCount ?? null;
        } else {
          // Invalid format
          supabaseResults = [];
          if (import.meta.env.DEV) {
            console.error('❌ [FETCH RECIPES] Invalid searchResult format:', {
              searchResult,
              type: typeof searchResult,
              isArray: Array.isArray(searchResult),
            });
          }
        }

        // Ensure supabaseResults is always an array
        if (!Array.isArray(supabaseResults)) {
          if (import.meta.env.DEV) {
            console.error('❌ [FETCH RECIPES] supabaseResults is not an array:', {
              supabaseResults,
              type: typeof supabaseResults,
            });
          }
          supabaseResults = [];
        }

        if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
          console.warn('📊 [FETCH RECIPES] Query result:', {
            isArray: Array.isArray(searchResult),
            hasData: !!searchResult?.data,
            resultsLength: supabaseResults?.length || 0,
            totalCount: totalCountFromServer,
            trimmedQuery: trimmedQuery || '(empty)',
            searchResultType: typeof searchResult,
            searchResultKeys:
              searchResult && typeof searchResult === 'object' && !Array.isArray(searchResult)
                ? Object.keys(searchResult)
                : 'N/A',
            firstResult: supabaseResults?.[0]
              ? { id: supabaseResults[0].id, title: supabaseResults[0].title }
              : 'none',
          });
        }

        // Validate that we actually got results
        if (!supabaseResults || !Array.isArray(supabaseResults)) {
          if (import.meta.env.DEV) {
            console.error('❌ [FETCH RECIPES] Invalid results format:', {
              searchResult,
              supabaseResults,
              type: typeof supabaseResults,
            });
          }
          setRecipes([]);
          setError('Invalid response from server. Please try again.');
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }

        if (supabaseResults?.length) {
          // Apply medical condition filtering AFTER all other filters
          // This ensures medical conditions work with Smart Filters
          let filteredResults = supabaseResults;

          try {
            // Check if user or family has medical conditions
            // getActiveMedicalConditions() now includes family member conditions
            const { getActiveMedicalConditions } = await import('./utils/medicalConditions.js');
            const medicalData = getActiveMedicalConditions();

            // Apply medical filtering if user or family has conditions
            if (medicalData?.activeConditions && medicalData.activeConditions.length > 0) {
              const beforeFilter = supabaseResults.length;
              filteredResults = filterRecipesByMedicalConditions(supabaseResults);
              const afterFilter = filteredResults.length;

              if (import.meta.env.DEV) {
                console.warn('🏥 [MEDICAL FILTER] Applied medical condition filtering:', {
                  originalCount: beforeFilter,
                  filteredCount: afterFilter,
                  removed: beforeFilter - afterFilter,
                  activeConditions: medicalData.activeConditions.length,
                });
              }

              // CRITICAL: If medical filtering removed ALL recipes, show a warning but don't fail completely
              // This can happen if filters are too restrictive - show some recipes anyway
              if (afterFilter === 0 && beforeFilter > 0) {
                if (import.meta.env.DEV) {
                  console.warn('⚠️ [MEDICAL FILTER] Medical conditions filtered out ALL recipes!', {
                    originalCount: beforeFilter,
                    activeConditions: medicalData.activeConditions,
                    action: 'Showing original results to prevent empty state',
                  });
                }
                // Show original results instead of empty state - better UX
                filteredResults = supabaseResults.slice(0, Math.min(10, supabaseResults.length));
              }
            }
          } catch (medicalError) {
            // If medical filtering fails, use original results (fail gracefully)
            if (import.meta.env.DEV) {
              console.warn('[fetchRecipes] Error applying medical condition filter:', medicalError);
            }
            filteredResults = supabaseResults;
          }

          // CRITICAL: Ensure we actually have recipes to set
          if (filteredResults && filteredResults.length > 0) {
            setRecipes(filteredResults);

            if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
              console.warn('✅ [FETCH RECIPES] Set recipes in state:', {
                count: filteredResults.length,
                originalCount: supabaseResults.length,
                medicalFiltered: filteredResults.length !== supabaseResults.length,
                firstRecipe: filteredResults[0]
                  ? { id: filteredResults[0].id, title: filteredResults[0].title }
                  : 'none',
              });
            }
          } else {
            if (import.meta.env.DEV) {
              console.error('❌ [FETCH RECIPES] filteredResults is empty after processing!', {
                supabaseResultsLength: supabaseResults.length,
                filteredResultsLength: filteredResults?.length || 0,
                filteredResultsType: typeof filteredResults,
                isArray: Array.isArray(filteredResults),
              });
            }
            // Fallback: use original results if filtering removed everything
            if (supabaseResults && supabaseResults.length > 0) {
              setRecipes(supabaseResults);
              if (import.meta.env.DEV) {
                // Using original results as fallback
              }
            } else {
              setRecipes([]);
            }
          }

          // Use actual total count from server if available, otherwise estimate
          // Adjust count based on medical filtering
          if (totalCountFromServer !== null && totalCountFromServer !== undefined) {
            // If medical filtering removed recipes, adjust the count proportionally
            const medicalFilterRatio = filteredResults.length / supabaseResults.length;
            setTotalRecipesCount(Math.floor(totalCountFromServer * medicalFilterRatio));
          } else if (filteredResults.length < requestedLimit) {
            // If we got fewer than requested, that's likely all there is
            const estimatedTotal = offset + filteredResults.length;
            setTotalRecipesCount(estimatedTotal);
          } else {
            // Got full page - assume there are more (conservative estimate)
            const estimatedTotal = Math.max(offset + requestedLimit * 2, 1000);
            setTotalRecipesCount(estimatedTotal);
          }

          // Only reset to page 1 if this is a NEW search (not pagination)
          if (!options.page || page === 1) {
            setCurrentPage(1);
          }
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
          // No results - handle differently based on context
          if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
            console.warn('⚠️ [FETCH RECIPES] No recipes returned from search:', {
              trimmedQuery: trimmedQuery || '(empty)',
              includeIngredients: includeIngredients.length,
              shouldShowDefaultFeed,
              allowEmpty,
              filters: {
                diet: normalizedDiet || 'none',
                mealType: normalizedMealType || 'none',
                maxTime: normalizedMaxTime || 'none',
              },
            });
          }

          setRecipes([]);

          // Only show error if it's NOT the initial load with allowEmpty
          // For initial load, we want to show the empty state gracefully
          const isInitialLoad =
            allowEmpty &&
            !trimmedQuery &&
            includeIngredients.length === 0 &&
            !normalizedDiet &&
            !normalizedMealType;

          if (isInitialLoad) {
            // Initial load with no filters - don't show error, just empty state
            setError(null);
            if (import.meta.env.DEV) {
              console.warn(
                'ℹ️ [FETCH RECIPES] Initial load returned 0 results - showing empty state'
              );
            }
          } else if (trimmedQuery || includeIngredients.length > 0) {
            // User searched for something specific
            setError(
              'No recipes found matching your search. Try different keywords, adjust your filters, or browse the featured recipes below.'
            );
          } else {
            // Filters applied but no results
            setError(
              'No recipes matched your filters. Try adjusting your search criteria or browse the featured recipes below.'
            );
          }
        }
      } catch (searchError) {
        const fetchElapsed = Date.now() - (fetchStartTime || Date.now());

        if (import.meta.env.DEV) {
          console.error('❌ [FETCH RECIPES] ============================================');
          console.error('❌ [FETCH RECIPES] SEARCH FAILED');
          console.error('❌ [FETCH RECIPES] Elapsed time:', fetchElapsed, 'ms');
          console.error('❌ [FETCH RECIPES] Error:', searchError);
          console.error(
            '❌ [FETCH RECIPES] Error message:',
            searchError?.message || 'Unknown error'
          );
          console.error('❌ [FETCH RECIPES] Error stack:', searchError?.stack || 'No stack trace');
          console.error('❌ [FETCH RECIPES] ============================================');
        }

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
        isFetchingRef.current = false; // Reset fetching flag
      }
    },
    [
      filters, // Include full filters object since we use filters.hasActiveFilters()
      pantry,
      recipesPerPage, // Need this for pagination calculations
      isAdmin, // Need this for admin filtering
      // Removed from deps: loading (causes infinite loops)
      // handleItemsPerPageChange manually triggers fetchRecipes
    ]
  );

  // Only fetch on mount - ensure recipes load on initial page load
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn('🚀 [APP] Initial mount - fetching recipes with allowEmpty: true');
    }
    // Use a small delay to ensure all context providers are ready
    const timer = setTimeout(() => {
      fetchRecipes('', { allowEmpty: true }).catch(err => {
        if (import.meta.env.DEV) {
          console.error('❌ [APP] Initial fetch failed:', err);
        }
      });
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search when filters change (but not on initial mount)
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }

    // Clear existing timeout
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }

    // Set new timeout
    filterDebounceRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      isFetchingRef.current = true;
      fetchRecipes(lastSearch || '', { allowEmpty: true }).finally(() => {
        isFetchingRef.current = false;
      });
    }, 500);

    // Cleanup function
    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.diet,
    filters.mealType,
    filters.maxTime,
    pantry,
    filters.maxCalories,
    filters.minProtein,
    filters.maxCarbs,
    filters.healthScore,
    filters.cuisine,
    filters.difficulty,
    filters.selectedIntolerances,
    // Removed fetchRecipes from deps to prevent infinite loops
    // fetchRecipes is stable due to useCallback with proper deps
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
      safeLocalStorage.setItem('favorites', safeJSONStringify(updated));

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

  // State for total recipe count (for server-side pagination)
  const [totalRecipesCount, setTotalRecipesCount] = useState(0);

  // Calculate pagination - now using server-side pagination
  const totalPages =
    totalRecipesCount > 0
      ? Math.ceil(totalRecipesCount / recipesPerPage)
      : Math.ceil(recipes.length / recipesPerPage); // Fallback to client-side if count not available

  // Server-side pagination: recipes array already contains just the current page's recipes
  // No need to slice - the server returns exactly what we need for the current page
  const paginatedRecipes = recipes;

  // Only log in development to reduce console noise
  // Removed verbose logging

  // Handle page change - now with server-side pagination!
  const handlePageChange = async page => {
    // Removed verbose logging

    setCurrentPage(page);

    // Calculate offset for server-side pagination
    const offset = (page - 1) * recipesPerPage;

    // For server-side pagination: Always fetch the page we need from the server
    // Removed verbose logging

    // Fetch the specific page from server
    await fetchRecipes(lastSearch || '', {
      allowEmpty: true,
      page: page,
      offset: offset,
    });

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle items per page change
  const handleItemsPerPageChange = async newPerPage => {
    // Prevent duplicate fetches by updating state first, then fetching
    setRecipesPerPage(newPerPage);
    safeLocalStorage.setItem('recipesPerPage', newPerPage.toString());
    setCurrentPage(1); // Reset to first page

    // Always re-fetch recipes with the new limit to ensure we have enough recipes
    if (recipes.length > 0 || lastSearch) {
      // Use the new per-page value directly (no need for limitOverride)
      await fetchRecipes(lastSearch || '', { allowEmpty: true, page: 1, offset: 0 });
    }

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Router>
      <CacheGuard />
      <GroceryListProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Header
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
                    {/* Gamification Bubbles - Above Search */}
                    <GamificationBubbles />

                    {/* Search Form */}
                    <div className="mb-6 xs:mb-8 sm:mb-10">
                      <SearchForm onSearch={fetchRecipes} />
                    </div>

                    {/* Daily Recipe Surprise */}
                    <div className="mb-4 xs:mb-6 sm:mb-8">
                      <DailyRecipe onRecipeSelect={toggleFavorite} />
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
                        // Trigger immediate search when Apply Filters is clicked or preset is applied
                        // Clear any pending debounced searches
                        if (filterDebounceRef.current) {
                          clearTimeout(filterDebounceRef.current);
                          filterDebounceRef.current = null;
                        }
                        // Reset to first page
                        setCurrentPage(1);
                        // Trigger search immediately (allowEmpty: true so filters work without search query)
                        // Use a delay to ensure filter state has updated in React
                        setTimeout(() => {
                          // fetchRecipes will read filters from context directly, so they'll be up-to-date
                          // fetchRecipes manages isFetchingRef internally, so we don't set it here
                          fetchRecipes(lastSearch || '', { allowEmpty: true })
                            .catch(err => {
                              console.error('Error applying filters:', err);
                              // Error is already handled in fetchRecipes
                            });
                        }, 300);
                      }, [fetchRecipes, lastSearch])}
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
                            {paginatedRecipes.map((recipe, idx) => {
                              // For server-side pagination, calculate index based on current page
                              // This is for analytics/tracking purposes only
                              const recipeIndex = (currentPage - 1) * recipesPerPage + idx;
                              return (
                                <RecipeCard
                                  key={recipe.id}
                                  recipe={recipe}
                                  index={recipeIndex}
                                  onFavorite={() => toggleFavorite(recipe)}
                                  isFavorite={favoriteIds.has(recipe.id)}
                                />
                              );
                            })}
                          </div>

                          {/* Pagination */}
                          {recipes.length > 0 && (
                            <Pagination
                              currentPage={currentPage}
                              totalPages={totalPages}
                              onPageChange={handlePageChange}
                              totalItems={totalRecipesCount || recipes.length}
                              itemsPerPage={recipesPerPage}
                              onItemsPerPageChange={handleItemsPerPageChange}
                            />
                          )}
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
            <Route path="/recipe/shared/:id" element={<SharedRecipePage />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/family-plan" element={<FamilyPlan />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/billing" element={<BillingManagement />} />
            {/* Admin routes - specific routes must come BEFORE /admin */}
            <Route path="/admin/missing-images" element={<MissingImagesPage />} />
            <Route path="/admin/missing-nutrition" element={<MissingNutritionPage />} />
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

          {/* PWA Install Prompt */}
          <InstallPWA />

          {/* Cooking Mini Games */}
          <CookingMiniGames isOpen={miniGamesOpen} onClose={() => setMiniGamesOpen(false)} />
        </div>
      </GroceryListProvider>
    </Router>
  );
};

export default App;
