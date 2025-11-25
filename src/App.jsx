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
import PantryChips from './components/PantryChips.jsx';
import GroceryDrawer from './components/GroceryDrawer.jsx';
import DailyRecipe from './components/DailyRecipe.jsx';
import CalorieTracker from './components/CalorieTracker.jsx';
import GamificationDashboard from './components/GamificationDashboard.jsx';
import Favorites from './pages/Favorites.jsx';
import MealRemindersPage from './pages/MealRemindersPage.jsx';
import BudgetTrackerPage from './pages/BudgetTrackerPage.jsx';
import { RecipeCardSkeletons } from './components/LoadingSkeleton.jsx';
import { EmptyStateAnimation } from './components/LottieFoodAnimations.jsx';
import { InlineRecipeLoader, FullPageRecipeLoader } from './components/FoodLoaders.jsx';
import PullToRefresh from './components/PullToRefresh.jsx';
import BackToTop from './components/BackToTop.jsx';
import CookingAnimation from './components/CookingAnimation.jsx';
import { GroceryListProvider } from './context/GroceryListContext.jsx';

import { searchSupabaseRecipes } from './api/supabaseRecipes.js';
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
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearch, setLastSearch] = useState('');
  const [preferenceSummary, setPreferenceSummary] = useState(null);

  // NEW: filters & pantry chips
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
  }); // minutes
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
  }); // ["eggs","tomato"]

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check for payment success on mount
  useEffect(() => {
    const paymentResult = checkPaymentSuccess();
    if (paymentResult?.success) {
      // Payment successful - update subscription
      const { plan } = paymentResult;
      import('./utils/subscription.js').then(subscriptionUtils => {
        subscriptionUtils.setCurrentPlan(plan);

        // Show success message
        toast.success(
          `🎉 Payment successful! Welcome to ${plan}! Your subscription is now active.`,
          6000
        );

        // Refresh to update UI after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
    } else if (paymentResult?.canceled) {
      // Payment canceled
      console.log('Payment canceled by user');
    }
  }, [toast]);

  // Persist filters and pantry chips (batched to reduce writes)
  useEffect(() => {
    try {
      localStorage.setItem('filters:diet', diet);
      localStorage.setItem('filters:intolerances', intolerances);
      localStorage.setItem('filters:maxTime', maxTime);
      localStorage.setItem('filters:mealType', mealType);
      localStorage.setItem('filters:maxCalories', maxCalories);
      localStorage.setItem('filters:healthScore', healthScore);
      localStorage.setItem('filters:pantry', JSON.stringify(pantry));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [diet, intolerances, maxTime, mealType, maxCalories, healthScore, pantry]);

  // Note: Notification permission should be requested on user interaction
  // We'll request it when user clicks a button or interacts with the app

  // Cross-tab favorites sync
  useEffect(() => {
    const onStorage = e => {
      if (e.key === 'favorites' && e.newValue) {
        setFavorites(JSON.parse(e.newValue));
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
  const fetchRecipes = useCallback(
    async (raw = '', options = {}) => {
      const { allowEmpty = false } = options;
      const trimmedQuery = raw?.trim() || '';
      const includeIngredients = [...toIngredientArray(raw), ...pantry.filter(Boolean)].filter(
        Boolean
      );
      const shouldShowDefaultFeed = !trimmedQuery && includeIngredients.length === 0;

      // ENFORCE SEARCH LIMIT - Check if user can perform search
      if (!allowEmpty && !shouldShowDefaultFeed) {
        const canSearch = canPerformAction('search');
        if (!canSearch) {
          const planDetails = getPlanDetails();
          toast.error(
            `Search limit reached! You've used all ${planDetails.searchLimit} daily searches. Upgrade to unlock more!`
          );
          // Trigger upgrade modal
          window.dispatchEvent(new CustomEvent('openProModal'));
          return;
        }
      }

      const normalizedDiet = diet && diet.toLowerCase() !== 'any diet' ? diet : '';
      const normalizedMealType = mealType && mealType.toLowerCase() !== 'any meal' ? mealType : '';
      const normalizedMaxTime = maxTime && maxTime.toLowerCase() !== 'any time' ? maxTime : '';

      if (!allowEmpty && shouldShowDefaultFeed && pantry.length === 0) {
        setError('Type a keyword, pick a pantry ingredient, or scroll through the featured feed.');
        setRecipes([]);
        return;
      }

      setLoading(true);
      setError(null);
      setLastSearch(raw ?? '');

      // Record search if it's an actual search (not default feed)
      if (!shouldShowDefaultFeed) {
        recordSearch();
      }

      try {
        // Read additional filters from localStorage (managed by Filters component)
        const cuisine = localStorage.getItem('filters:cuisine') || '';
        const difficulty = localStorage.getItem('filters:difficulty') || '';
        const minProtein = localStorage.getItem('filters:minProtein') || '';
        const maxCarbs = localStorage.getItem('filters:maxCarbs') || '';
        const selectedIntolerances = JSON.parse(
          localStorage.getItem('filters:selectedIntolerances') || '[]'
        );
        const intolerancesString =
          selectedIntolerances.length > 0 ? selectedIntolerances.join(',') : '';

        const supabaseResults = await searchSupabaseRecipes({
          query: trimmedQuery,
          includeIngredients: shouldShowDefaultFeed ? [] : includeIngredients,
          diet: normalizedDiet,
          mealType: normalizedMealType,
          maxTime: normalizedMaxTime,
          cuisine,
          difficulty,
          maxCalories: maxCalories || '',
          healthScore: healthScore || '',
          minProtein,
          maxCarbs,
          intolerances: intolerancesString,
          limit: 24,
        });

        if (supabaseResults?.length) {
          setRecipes(supabaseResults);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🍽 Found ${supabaseResults.length} recipes`);
          }
        } else {
          setRecipes([]);
          setError(
            'No recipes matched your filters in Supabase yet. Try adjusting the search or add more recipes.'
          );
        }
      } catch (supabaseError) {
        console.error('[fetchRecipes] Supabase search error', supabaseError);

        // Better error messages for common issues
        let errorMessage = 'Failed to load recipes.';
        if (supabaseError instanceof TypeError && supabaseError.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.error?.message) {
          errorMessage = supabaseError.error.message;
        }

        setError(errorMessage);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    },
    [diet, mealType, maxTime, pantry, maxCalories, healthScore]
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
  }, [diet, mealType, maxTime, pantry, maxCalories, healthScore, fetchRecipes, lastSearch]);

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
            `Favorites limit reached! You can only save ${planDetails.favoritesLimit} favorites on the Free plan. Upgrade to unlock more!`
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
                    {/* Daily Recipe Surprise */}
                    <div className="mb-4 xs:mb-6 sm:mb-8">
                      <DailyRecipe onRecipeSelect={toggleFavorite} />
                    </div>

                    {/* Gamification Dashboard */}
                    <div className="mb-4 xs:mb-6 sm:mb-8">
                      <GamificationDashboard />
                    </div>

                    <div className="mb-4 xs:mb-5 sm:mb-6">
                      <SearchForm onSearch={fetchRecipes} />
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

                    {/* NEW: Filters */}
                    <Filters
                      diet={diet}
                      setDiet={setDiet}
                      intolerances={intolerances}
                      setIntolerances={setIntolerances}
                      maxTime={maxTime}
                      setMaxTime={setMaxTime}
                      mealType={mealType}
                      setMealType={setMealType}
                      maxCalories={maxCalories}
                      setMaxCalories={setMaxCalories}
                      healthScore={healthScore}
                      setHealthScore={setHealthScore}
                      onFiltersChange={useCallback(() => {
                        // Filters are already persisted to localStorage
                        // The debounced useEffect will handle the search automatically
                        console.log(
                          '🔍 [FILTERS] Filters changed - search will trigger automatically'
                        );
                      }, [])}
                    />

                    {/* Divider */}
                    <div className="border-b border-slate-200 dark:border-slate-800 my-6" />

                    {/* Calorie Tracker */}
                    <div className="mb-6">
                      <CalorieTracker />
                    </div>

                    {/* Divider */}
                    <div className="border-b border-slate-200 dark:border-slate-800 my-6" />

                    <PantryChips pantry={pantry} setPantry={setPantry} onSearch={fetchRecipes} />

                    {loading && (
                      <div className="mt-10">
                        <InlineRecipeLoader />
                      </div>
                    )}

                    {error && (
                      <p className="text-center mt-8 text-red-500 font-semibold">{error}</p>
                    )}

                    {recipes.length > 0 && (
                      <>
                        {/* Divider */}
                        <div className="border-b border-slate-200 dark:border-slate-800 my-6" />
                        <section className="mt-10">
                          <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold">Recipe Results</h2>
                          </div>

                          <div className="grid gap-3 xs:gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
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
                      <div className="mt-16 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex justify-center mb-6">
                          <CookingAnimation type="recipe-book" className="w-32 h-32 opacity-50" />
                        </div>
                        <p className="mb-2 text-lg font-semibold">
                          Ready to cook something delicious?
                        </p>
                        <p className="mb-4 text-sm">Try something like:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {['chicken, rice', 'eggs, tomato', 'pasta, bacon', 'tofu, broccoli'].map(
                            s => (
                              <button
                                key={s}
                                className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
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
          </Routes>

          {/* Pro Modal Wrapper - listen for open event */}
          <ProModalWrapper />

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
