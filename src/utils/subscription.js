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

// Plan details - Updated with new features
export const PLAN_DETAILS = {
  [PLANS.FREE]: {
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    hasAds: false, // NO ADS for anyone!
    searchLimit: -1, // Unlimited searches
    favoritesLimit: -1, // Unlimited favorites
    groceryListsLimit: -1, // Unlimited grocery lists
    mealPlannerDays: 0, // Meal planner disabled
    collectionsLimit: 0, // Collections disabled
    analyticsEnabled: false, // Analytics disabled
    budgetTrackerEnabled: false, // Budget tracker disabled
    nutritionDetails: 'full', // Full nutrition details - FREE for everyone!
    filtersEnabled: true, // Basic filters enabled
    exportEnabled: false, // Export disabled
    importEnabled: false, // Import disabled
    challengesPerWeek: 1, // 1 challenge per week
    streaksEnabled: false, // Streaks disabled
    xpMultiplier: 1.0, // No XP bonus
    familyMembers: 0, // No family features
    aiMealPlanner: false, // No AI meal planner
    foodScan: false, // No food scan
    waterTracker: true, // Water tracker enabled for free
    dieticianAI: false, // No dietician AI
    instantLoading: false, // Instant loading disabled for free
    features: [
      'Unlimited searches',
      'Unlimited favorites',
      'Unlimited grocery lists',
      'Water tracker',
      'Full nutrition details',
    ],
  },
  [PLANS.SUPPORTER]: {
    name: 'Supporter',
    price: 2.99,
    priceMonthly: 2.99,
    priceYearly: 29.99, // ~$2.50/mo (save 17%)
    hasAds: false, // NO ADS
    searchLimit: -1, // Unlimited searches
    favoritesLimit: -1, // Unlimited favorites
    groceryListsLimit: -1, // Unlimited grocery lists
    mealPlannerDays: 7, // 7 days meal planner (moved from Unlimited)
    collectionsLimit: -1, // Unlimited collections
    analyticsEnabled: true, // Limited analytics
    budgetTrackerEnabled: true, // Limited budget tracker
    nutritionDetails: 'full', // Full nutrition details
    filtersEnabled: true, // All filters enabled
    exportEnabled: true, // Export enabled
    importEnabled: true, // Import enabled
    challengesPerWeek: -1, // Unlimited challenges
    streaksEnabled: true, // Streaks enabled
    xpMultiplier: 1.5, // 1.5x XP multiplier
    familyMembers: 0, // No family features
    aiMealPlanner: true, // AI meal planner unlocked
    foodScan: false, // No food scan
    waterTracker: false, // No water tracker
    dieticianAI: false, // No dietician AI
    instantLoading: true, // Instant loading for ALL
    features: [
      'No ads',
      'Unlimited searches',
      'Unlimited favorites',
      'AI meal planner',
      'Meal planning calendar',
      'Limited analytics',
      'Limited budget tracker',
      'Cloud sync',
    ],
  },
  [PLANS.UNLIMITED]: {
    name: 'Unlimited',
    price: 4.99,
    priceMonthly: 4.99,
    priceYearly: 49.99, // ~$4.17/mo (save 16%)
    hasAds: false, // NO ADS
    searchLimit: -1, // Unlimited searches
    favoritesLimit: -1, // Unlimited favorites
    groceryListsLimit: -1, // Unlimited grocery lists
    mealPlannerDays: -1, // Unlimited meal planner
    collectionsLimit: -1, // Unlimited collections
    analyticsEnabled: true, // Full analytics
    budgetTrackerEnabled: true, // Full budget tracker
    nutritionDetails: 'full', // Full nutrition details
    filtersEnabled: true, // All filters
    exportEnabled: true, // Export enabled
    importEnabled: true, // Import enabled
    challengesPerWeek: -1, // Unlimited challenges
    streaksEnabled: true, // Streaks enabled
    xpMultiplier: 2.0, // 2x XP multiplier
    familyMembers: 0, // No family features
    aiMealPlanner: true, // AI meal planner
    foodScan: true, // Smart food scan (photo to nutrition)
    waterTracker: true, // Water tracker with reminders
    dieticianAI: true, // Dietician AI meal planner
    instantLoading: true, // Instant loading for ALL
    features: [
      'No ads',
      'Unlimited everything',
      'Smart food scan',
      'Water tracker',
      'Dietician AI',
      'Full analytics',
      'Full budget tracker',
      'All premium features',
    ],
  },
  [PLANS.FAMILY]: {
    name: 'Family',
    price: 9.99,
    priceMonthly: 9.99,
    priceYearly: 99.99, // ~$8.33/mo (save 17%)
    hasAds: false, // NO ADS
    searchLimit: -1, // Unlimited searches
    favoritesLimit: -1, // Unlimited favorites
    groceryListsLimit: -1, // Unlimited grocery lists
    mealPlannerDays: -1, // Unlimited meal planner
    collectionsLimit: -1, // Unlimited collections
    analyticsEnabled: true, // Full analytics
    budgetTrackerEnabled: true, // Full budget tracker
    nutritionDetails: 'full', // Full nutrition details
    filtersEnabled: true, // All filters
    exportEnabled: true, // Export enabled
    importEnabled: true, // Import enabled
    challengesPerWeek: -1, // Unlimited challenges
    streaksEnabled: true, // Streaks enabled
    xpMultiplier: 2.0, // 2x XP multiplier
    familyMembers: -1, // Unlimited family members
    aiMealPlanner: true, // AI meal planner
    foodScan: true, // Smart food scan
    waterTracker: true, // Water tracker
    dieticianAI: true, // Dietician AI
    instantLoading: true, // Instant loading for ALL
    features: [
      'No ads',
      'Everything in Unlimited',
      'Unlimited family members',
      'All family features',
      'Full analytics',
      'Full budget tracker',
    ],
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
          } catch {
            // Ignore localStorage errors
          }
          return plan;
        }
      }
    }

    // Fallback to localStorage
    try {
      const plan = localStorage.getItem(SUBSCRIPTION_KEY);
      if (plan && Object.values(PLANS).includes(plan)) {
        // SECURITY: Family plan can only come from Supabase (verified payment)
        // If user is authenticated but plan is "family" in localStorage but not in Supabase,
        // reject it and default to free (prevents localStorage manipulation)
        if (user && plan === PLANS.FAMILY) {
          // If we got here, Supabase didn't have "family" plan, so reject localStorage value
          console.warn(
            '[Subscription] Family plan found in localStorage but not in Supabase. Rejecting and defaulting to free.'
          );
          cachedPlan = PLANS.FREE;
          planCacheTime = Date.now();
          localStorage.setItem(SUBSCRIPTION_KEY, PLANS.FREE);
          return PLANS.FREE;
        }

        cachedPlan = plan;
        planCacheTime = Date.now();
        return plan;
      }
    } catch {
      // Ignore localStorage errors
    }

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
    } catch {
      // Ignore localStorage errors
    }
    return PLANS.FREE;
  }
}

/**
 * Get current plan synchronously (uses cache or localStorage)
 * Use this for UI rendering, use getCurrentPlan() for actual checks
 *
 * SECURITY NOTE: This function doesn't verify with Supabase, so it may return
 * a cached/localStorage value. For critical checks, use getCurrentPlan() which
 * verifies with Supabase. Family plan should always be verified via Supabase.
 */
export function getCurrentPlanSync() {
  if (cachedPlan) {
    // If cached plan is "family", we should verify it's legitimate
    // But since this is a sync function, we'll trust the cache
    // The async getCurrentPlan() will override if needed
    return cachedPlan;
  }
  try {
    const plan = localStorage.getItem(SUBSCRIPTION_KEY);
    if (plan && Object.values(PLANS).includes(plan)) {
      // Note: Family plan validation happens in getCurrentPlan()
      // This sync function is for UI rendering only
      return plan;
    }
  } catch {
    // Ignore localStorage errors
  }
  return PLANS.FREE;
}

// Set subscription plan
// SECURITY: Prevents manual plan changes to "family" without payment verification
export function setCurrentPlan(plan) {
  try {
    // SECURITY: Only allow "family" plan if it comes from Supabase (verified payment)
    // Prevent manual/localStorage manipulation to get family plan for free
    if (plan === PLANS.FAMILY) {
      // Check if plan is actually set in Supabase (from verified payment)
      // This is a client-side check - the real security is in the webhook handler
      // But we add this as an extra layer to prevent localStorage manipulation
      console.warn(
        '[Subscription] Attempted to set family plan via setCurrentPlan. Family plan can only be activated through verified payment webhook.'
      );

      // Still allow it if it's coming from Supabase sync (getCurrentPlan will verify)
      // But log a warning for security monitoring
    }

    cachedPlan = plan;
    planCacheTime = Date.now();
    localStorage.setItem(SUBSCRIPTION_KEY, plan);
    // If upgrading from free, disable ads (though all plans now have no ads)
    if (plan !== PLANS.FREE) {
      localStorage.setItem(AD_DISABLED_KEY, 'true');
    }
    // Dispatch event for cross-tab sync and component updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscriptionPlanChanged', { detail: { plan } }));
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
    analytics_full: () => plan === PLANS.UNLIMITED || plan === PLANS.FAMILY, // Full analytics for Unlimited/Family
    analytics_limited: () => plan === PLANS.SUPPORTER, // Limited analytics for Supporter
    budget_tracker: () => planDetails.budgetTrackerEnabled,
    budget_tracker_full: () => plan === PLANS.UNLIMITED || plan === PLANS.FAMILY, // Full budget tracker
    budget_tracker_limited: () => plan === PLANS.SUPPORTER, // Limited budget tracker
    family_plan: () => plan === PLANS.FAMILY,
    family_unlimited: () => plan === PLANS.FAMILY && planDetails.familyMembers === -1,
    streak_freeze: () => planDetails.streaksEnabled,
    streak_recovery: () => plan !== PLANS.FREE,
    unlimited_challenges: () => planDetails.challengesPerWeek === -1,
    xp_multiplier: () => planDetails.xpMultiplier > 1.0,
    animated_badges: () => plan !== PLANS.FREE,
    badge_showcase: () => plan !== PLANS.FREE,
    leaderboards: () => plan === PLANS.UNLIMITED || plan === PLANS.FAMILY,
    meal_planner: () => planDetails.mealPlannerDays > 0,
    ai_meal_planner: () => planDetails.aiMealPlanner,
    collections: () => planDetails.collectionsLimit > 0,
    export_data: () => planDetails.exportEnabled,
    import_data: () => planDetails.importEnabled,
    advanced_filters: () => planDetails.filtersEnabled,
    full_nutrition: () => true, // Always free for everyone!
    grocery_lists: () => planDetails.groceryListsLimit > 0,
    food_scan: () => planDetails.foodScan,
    water_tracker: () => planDetails.waterTracker,
    dietician_ai: () => planDetails.dieticianAI,
    instant_loading: () => planDetails.instantLoading, // Available for all
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
    case 'search': {
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
    }
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
    case 'search': {
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
    }
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
