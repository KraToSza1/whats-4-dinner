/**
 * Subscription Management Utilities
 * Handles subscription status, ad display, and feature access
 * ENFORCES STRICT LIMITS - Makes people want to upgrade!
 */

import { supabase } from '../lib/supabaseClient';

const SUBSCRIPTION_KEY = 'subscription:plan:v1';
const AD_DISABLED_KEY = 'ads:disabled';
const SEARCH_COUNT_KEY = 'subscription:searches:count:v1';
const SEARCH_DATE_KEY = 'subscription:searches:date:v1';

// Subscription plans
export const PLANS = {
  FREE: 'free',
  SUPPORTER: 'supporter',
  UNLIMITED: 'unlimited',
  FAMILY: 'family',
};

// Plan details with EXTREME limits to drive upgrades
export const PLAN_DETAILS = {
  [PLANS.FREE]: {
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    hasAds: true,
    searchLimit: 5, // EXTREME: Only 5 searches per day!
    favoritesLimit: 10, // EXTREME: Only 10 favorites total!
    groceryListsLimit: 1, // EXTREME: Only 1 grocery list!
    mealPlannerDays: 0, // EXTREME: Meal planner DISABLED!
    collectionsLimit: 0, // EXTREME: Collections DISABLED!
    analyticsEnabled: false, // EXTREME: Analytics DISABLED!
    nutritionDetails: 'basic', // EXTREME: Basic nutrition only!
    filtersEnabled: false, // EXTREME: Advanced filters DISABLED!
    exportEnabled: false, // EXTREME: Export DISABLED!
    importEnabled: false, // EXTREME: Import DISABLED!
    challengesPerWeek: 1, // EXTREME: Only 1 challenge per week!
    streaksEnabled: false, // EXTREME: Streaks DISABLED!
    xpMultiplier: 1.0, // EXTREME: No XP bonus!
    familyMembers: 0, // EXTREME: No family features!
    features: ['Basic features', '5 searches/day', '10 favorites', 'Ads', 'Limited features'],
  },
  [PLANS.SUPPORTER]: {
    name: 'Supporter',
    price: 2.99,
    priceMonthly: 2.99,
    priceYearly: 29.99, // ~$2.50/mo (save 17%)
    hasAds: false,
    searchLimit: 30, // Better: 30 searches per day
    favoritesLimit: 50, // Better: 50 favorites
    groceryListsLimit: 5, // Better: 5 grocery lists
    mealPlannerDays: 3, // Better: 3 days meal planner
    collectionsLimit: 3, // Better: 3 collections
    analyticsEnabled: true, // Better: Basic analytics
    nutritionDetails: 'full', // Better: Full nutrition details
    filtersEnabled: true, // Better: All filters enabled
    exportEnabled: true, // Better: Export enabled
    importEnabled: true, // Better: Import enabled
    challengesPerWeek: 3, // Better: 3 challenges per week
    streaksEnabled: true, // Better: Streaks enabled
    xpMultiplier: 1.5, // Better: 1.5x XP multiplier
    familyMembers: 0,
    features: ['No ads', '30 searches/day', '50 favorites', 'Cloud sync', 'Basic premium features'],
  },
  [PLANS.UNLIMITED]: {
    name: 'Unlimited',
    price: 4.99,
    priceMonthly: 4.99,
    priceYearly: 49.99, // ~$4.17/mo (save 16%)
    hasAds: false,
    searchLimit: -1, // unlimited
    favoritesLimit: -1, // unlimited
    groceryListsLimit: -1, // unlimited
    mealPlannerDays: -1, // unlimited
    collectionsLimit: -1, // unlimited
    analyticsEnabled: true, // Full analytics
    nutritionDetails: 'full', // Full nutrition details
    filtersEnabled: true, // All filters
    exportEnabled: true, // Export enabled
    importEnabled: true, // Import enabled
    challengesPerWeek: -1, // unlimited
    streaksEnabled: true, // Streaks enabled
    xpMultiplier: 2.0, // 2x XP multiplier
    familyMembers: 0,
    features: ['No ads', 'Unlimited searches', 'Unlimited favorites', 'All premium features'],
  },
  [PLANS.FAMILY]: {
    name: 'Family',
    price: 9.99,
    priceMonthly: 9.99,
    priceYearly: 99.99, // ~$8.33/mo (save 17%)
    hasAds: false,
    searchLimit: -1, // unlimited
    favoritesLimit: -1, // unlimited
    groceryListsLimit: -1, // unlimited
    mealPlannerDays: -1, // unlimited
    collectionsLimit: -1, // unlimited
    analyticsEnabled: true, // Full analytics
    nutritionDetails: 'full', // Full nutrition details
    filtersEnabled: true, // All filters
    exportEnabled: true, // Export enabled
    importEnabled: true, // Import enabled
    challengesPerWeek: -1, // unlimited
    streaksEnabled: true, // Streaks enabled
    xpMultiplier: 2.0, // 2x XP multiplier
    familyMembers: 10, // 10 family members
    features: ['No ads', 'Everything in Unlimited', '10 family members', 'Family features'],
  },
};

// Cache for current plan (to avoid repeated Supabase calls)
let cachedPlan = null;
let planCacheTime = 0;
const PLAN_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get current subscription plan from Supabase profiles table
 * Falls back to localStorage if not authenticated
 */
export async function getCurrentPlan() {
  try {
    // Check cache first
    if (cachedPlan && Date.now() - planCacheTime < PLAN_CACHE_TTL) {
      return cachedPlan;
    }

    // Try to get from Supabase if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (!error && profile?.plan) {
        const plan = profile.plan.toLowerCase();
        // Validate plan
        if (Object.values(PLANS).includes(plan)) {
          cachedPlan = plan;
          planCacheTime = Date.now();
          // Sync to localStorage for offline access
          try {
            localStorage.setItem(SUBSCRIPTION_KEY, plan);
          } catch {}
          return plan;
        }
      }
    }

    // Fallback to localStorage
    try {
      const plan = localStorage.getItem(SUBSCRIPTION_KEY);
      if (plan && Object.values(PLANS).includes(plan)) {
        cachedPlan = plan;
        planCacheTime = Date.now();
        return plan;
      }
    } catch {}

    // Default to FREE plan
    cachedPlan = PLANS.FREE;
    planCacheTime = Date.now();
    return PLANS.FREE;
  } catch (error) {
    console.error('[Subscription] Error getting plan:', error);
    // Fallback to localStorage
    try {
      const plan = localStorage.getItem(SUBSCRIPTION_KEY);
      if (plan && Object.values(PLANS).includes(plan)) {
        return plan;
      }
    } catch {}
    return PLANS.FREE;
  }
}

/**
 * Get current plan synchronously (uses cache or localStorage)
 * Use this for UI rendering, use getCurrentPlan() for actual checks
 */
export function getCurrentPlanSync() {
  if (cachedPlan) return cachedPlan;
  try {
    const plan = localStorage.getItem(SUBSCRIPTION_KEY);
    if (plan && Object.values(PLANS).includes(plan)) {
      return plan;
    }
  } catch {}
  return PLANS.FREE;
}

// Set subscription plan
export function setCurrentPlan(plan) {
  try {
    cachedPlan = plan;
    planCacheTime = Date.now();
    localStorage.setItem(SUBSCRIPTION_KEY, plan);
    // If upgrading from free, disable ads
    if (plan !== PLANS.FREE) {
      localStorage.setItem(AD_DISABLED_KEY, 'true');
    }
    return true;
  } catch {
    return false;
  }
}

// Check if user has ads disabled
export function hasAdsDisabled() {
  try {
    const plan = getCurrentPlanSync();
    const planDetails = PLAN_DETAILS[plan];

    // Paid plans don't have ads
    if (!planDetails.hasAds) {
      return true;
    }

    // Check if ads were manually disabled
    const adsDisabled = localStorage.getItem(AD_DISABLED_KEY);
    return adsDisabled === 'true';
  } catch {
    return false;
  }
}

// Check if ads should be shown
export function shouldShowAds() {
  return !hasAdsDisabled();
}

// Check if user has access to a feature
export function hasFeature(feature) {
  const plan = getCurrentPlanSync();
  const planDetails = PLAN_DETAILS[plan];

  const premiumFeatures = {
    unlimited_searches: () => planDetails.searchLimit === -1,
    unlimited_favorites: () => planDetails.favoritesLimit === -1,
    no_ads: () => !planDetails.hasAds,
    cloud_sync: () => plan !== PLANS.FREE,
    analytics: () => planDetails.analyticsEnabled,
    family_plan: () => plan === PLANS.FAMILY,
    streak_freeze: () => planDetails.streaksEnabled,
    streak_recovery: () => plan !== PLANS.FREE,
    unlimited_challenges: () => planDetails.challengesPerWeek === -1,
    xp_multiplier: () => planDetails.xpMultiplier > 1.0,
    animated_badges: () => plan !== PLANS.FREE,
    badge_showcase: () => plan !== PLANS.FREE,
    leaderboards: () => plan === PLANS.UNLIMITED || plan === PLANS.FAMILY,
    meal_planner: () => planDetails.mealPlannerDays > 0,
    collections: () => planDetails.collectionsLimit > 0,
    export_data: () => planDetails.exportEnabled,
    import_data: () => planDetails.importEnabled,
    advanced_filters: () => planDetails.filtersEnabled,
    full_nutrition: () => planDetails.nutritionDetails === 'full',
    grocery_lists: () => planDetails.groceryListsLimit > 0,
  };

  if (premiumFeatures[feature]) {
    return premiumFeatures[feature]();
  }

  return false; // Default to false - feature locked
}

/**
 * Check if user can perform an action (searches, favorites, etc.)
 * ENFORCES LIMITS STRICTLY
 */
export function canPerformAction(action, currentCount = 0) {
  const plan = getCurrentPlanSync();
  const planDetails = PLAN_DETAILS[plan];

  switch (action) {
    case 'search':
      if (planDetails.searchLimit === -1) return true; // unlimited
      const today = new Date().toDateString();
      const lastSearchDate = localStorage.getItem(SEARCH_DATE_KEY);
      let searchCount = parseInt(localStorage.getItem(SEARCH_COUNT_KEY) || '0', 10);

      // Reset count if new day
      if (lastSearchDate !== today) {
        searchCount = 0;
        localStorage.setItem(SEARCH_COUNT_KEY, '0');
        localStorage.setItem(SEARCH_DATE_KEY, today);
      }

      return searchCount < planDetails.searchLimit;

    case 'favorite':
      if (planDetails.favoritesLimit === -1) return true; // unlimited
      return currentCount < planDetails.favoritesLimit;

    case 'grocery_list':
      if (planDetails.groceryListsLimit === -1) return true; // unlimited
      return currentCount < planDetails.groceryListsLimit;

    case 'collection':
      if (planDetails.collectionsLimit === -1) return true; // unlimited
      if (planDetails.collectionsLimit === 0) return false; // disabled
      return currentCount < planDetails.collectionsLimit;

    case 'meal_planner':
      return planDetails.mealPlannerDays > 0;

    case 'challenge':
      if (planDetails.challengesPerWeek === -1) return true; // unlimited
      return true; // TODO: Track weekly challenge count

    default:
      return true;
  }
}

/**
 * Record that a search was performed
 */
export function recordSearch() {
  const today = new Date().toDateString();
  const lastSearchDate = localStorage.getItem(SEARCH_DATE_KEY);
  let searchCount = parseInt(localStorage.getItem(SEARCH_COUNT_KEY) || '0', 10);

  // Reset count if new day
  if (lastSearchDate !== today) {
    searchCount = 0;
  }

  searchCount++;
  localStorage.setItem(SEARCH_COUNT_KEY, searchCount.toString());
  localStorage.setItem(SEARCH_DATE_KEY, today);
}

/**
 * Get remaining actions for today
 */
export function getRemainingActions(action, currentCount = 0) {
  const plan = getCurrentPlanSync();
  const planDetails = PLAN_DETAILS[plan];

  switch (action) {
    case 'search':
      if (planDetails.searchLimit === -1) return 'Unlimited';
      const today = new Date().toDateString();
      const lastSearchDate = localStorage.getItem(SEARCH_DATE_KEY);
      let searchCount = parseInt(localStorage.getItem(SEARCH_COUNT_KEY) || '0', 10);

      // Reset count if new day
      if (lastSearchDate !== today) {
        searchCount = 0;
      }

      const remaining = Math.max(0, planDetails.searchLimit - searchCount);
      return remaining;

    case 'favorite':
      if (planDetails.favoritesLimit === -1) return 'Unlimited';
      return Math.max(0, planDetails.favoritesLimit - currentCount);

    case 'grocery_list':
      if (planDetails.groceryListsLimit === -1) return 'Unlimited';
      return Math.max(0, planDetails.groceryListsLimit - currentCount);

    case 'collection':
      if (planDetails.collectionsLimit === -1) return 'Unlimited';
      if (planDetails.collectionsLimit === 0) return 0;
      return Math.max(0, planDetails.collectionsLimit - currentCount);

    default:
      return 0;
  }
}

// Get plan display name
export function getPlanName() {
  const plan = getCurrentPlanSync();
  return PLAN_DETAILS[plan].name;
}

// Check if user is on free plan
export function isFreePlan() {
  return getCurrentPlanSync() === PLANS.FREE;
}

// Get plan details
export function getPlanDetails(plan = null) {
  const currentPlan = plan || getCurrentPlanSync();
  return PLAN_DETAILS[currentPlan] || PLAN_DETAILS[PLANS.FREE];
}
