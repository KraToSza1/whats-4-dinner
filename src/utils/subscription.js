/**
 * Subscription Management Utilities
 * Handles subscription status, ad display, and feature access
 */

const SUBSCRIPTION_KEY = 'subscription:plan:v1';
const AD_DISABLED_KEY = 'ads:disabled';

// Subscription plans
export const PLANS = {
  FREE: 'free',
  SUPPORTER: 'supporter',
  UNLIMITED: 'unlimited',
  FAMILY: 'family',
};

// Plan details
export const PLAN_DETAILS = {
  [PLANS.FREE]: {
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    hasAds: true,
    searchLimit: 10,
    favoritesLimit: 20,
    features: ['Basic features', '10 searches/day', '20 favorites', 'Ads'],
  },
  [PLANS.SUPPORTER]: {
    name: 'Supporter',
    price: 2.99,
    priceMonthly: 2.99,
    priceYearly: 29.99, // ~$2.50/mo (save 17%)
    hasAds: false,
    searchLimit: 50,
    favoritesLimit: 100,
    features: ['No ads', '50 searches/day', '100 favorites', 'Cloud sync'],
  },
  [PLANS.UNLIMITED]: {
    name: 'Unlimited',
    price: 4.99,
    priceMonthly: 4.99,
    priceYearly: 49.99, // ~$4.17/mo (save 16%)
    hasAds: false,
    searchLimit: -1, // unlimited
    favoritesLimit: -1, // unlimited
    features: ['No ads', 'Unlimited searches', 'Unlimited favorites', 'All premium features'],
  },
  [PLANS.FAMILY]: {
    name: 'Family',
    price: 9.99,
    priceMonthly: 9.99,
    priceYearly: 99.99, // ~$8.33/mo (save 17%)
    hasAds: false,
    searchLimit: -1,
    favoritesLimit: -1,
    features: ['No ads', 'Everything in Unlimited', '10 family members', 'Family features'],
  },
};

// Get current subscription plan - FOR NOW, EVERYONE GETS UNLIMITED FOR FREE
export function getCurrentPlan() {
  // TEMPORARY: Give everyone unlimited plan for free during development
  return PLANS.UNLIMITED;

  // Original code (commented out for now):
  // try {
  //     const plan = localStorage.getItem(SUBSCRIPTION_KEY);
  //     return plan || PLANS.FREE;
  // } catch {
  //     return PLANS.FREE;
  // }
}

// Set subscription plan
export function setCurrentPlan(plan) {
  try {
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

// Check if user has ads disabled - FOR NOW, NO ADS FOR ANYONE
export function hasAdsDisabled() {
  // TEMPORARY: No ads for anyone during development
  return true;

  // Original code (commented out for now):
  // try {
  //     const plan = getCurrentPlan();
  //     const planDetails = PLAN_DETAILS[plan];
  //
  //     // Paid plans don't have ads
  //     if (!planDetails.hasAds) {
  //         return true;
  //     }
  //
  //     // Check if ads were manually disabled
  //     const adsDisabled = localStorage.getItem(AD_DISABLED_KEY);
  //     return adsDisabled === "true";
  // } catch {
  //     return false;
  // }
}

// Check if ads should be shown
export function shouldShowAds() {
  return !hasAdsDisabled();
}

// Check if user has access to a feature
export function hasFeature(feature) {
  // TEMPORARY: Everyone gets all features for free during development
  // Uncomment below to enable premium features
  // const plan = getCurrentPlan();
  // const planDetails = PLAN_DETAILS[plan];

  // Premium feature gates
  const premiumFeatures = {
    // Existing features
    unlimited_searches: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return PLAN_DETAILS[plan].searchLimit === -1;
    },
    unlimited_favorites: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return PLAN_DETAILS[plan].favoritesLimit === -1;
    },
    no_ads: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return !PLAN_DETAILS[plan].hasAds;
    },
    cloud_sync: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan !== PLANS.FREE;
    },
    analytics: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan !== PLANS.FREE;
    },
    family_plan: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan === PLANS.FAMILY;
    },
    // New gamification features
    streak_freeze: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan !== PLANS.FREE;
    },
    streak_recovery: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan === PLANS.UNLIMITED || plan === PLANS.FAMILY;
    },
    unlimited_challenges: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan !== PLANS.FREE;
    },
    xp_multiplier: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan === PLANS.UNLIMITED || plan === PLANS.FAMILY;
    },
    animated_badges: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan !== PLANS.FREE;
    },
    badge_showcase: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan !== PLANS.FREE;
    },
    leaderboards: () => {
      // TEMP: return true;
      const plan = getCurrentPlan();
      return plan === PLANS.UNLIMITED || plan === PLANS.FAMILY;
    },
  };

  // TEMP: Return true for all features during development
  if (premiumFeatures[feature]) {
    return true; // TEMP: Change to premiumFeatures[feature]() when ready
  }

  return true; // Default to true during development
}

// Check if user can perform an action - FOR NOW, UNLIMITED FOR EVERYONE
export function canPerformAction(action, currentCount) {
  // TEMPORARY: Unlimited actions for everyone during development
  return true;

  // Original code (commented out for now):
  // const plan = getCurrentPlan();
  // const planDetails = PLAN_DETAILS[plan];
  //
  // switch (action) {
  //     case "search":
  //         if (planDetails.searchLimit === -1) return true;
  //         return currentCount < planDetails.searchLimit;
  //     case "favorite":
  //         if (planDetails.favoritesLimit === -1) return true;
  //         return currentCount < planDetails.favoritesLimit;
  //     default:
  //         return true;
  // }
}

// Get remaining actions for today - FOR NOW, UNLIMITED FOR EVERYONE
export function getRemainingActions(action, currentCount) {
  // TEMPORARY: Unlimited for everyone during development
  return 'Unlimited';

  // Original code (commented out for now):
  // const plan = getCurrentPlan();
  // const planDetails = PLAN_DETAILS[plan];
  //
  // switch (action) {
  //     case "search":
  //         if (planDetails.searchLimit === -1) return "Unlimited";
  //         return Math.max(0, planDetails.searchLimit - currentCount);
  //     case "favorite":
  //         if (planDetails.favoritesLimit === -1) return "Unlimited";
  //         return Math.max(0, planDetails.favoritesLimit - currentCount);
  //     default:
  //         return 0;
  // }
}

// Get plan display name - FOR NOW, SHOW UNLIMITED
export function getPlanName() {
  // TEMPORARY: Show "Unlimited" for everyone during development
  return 'Unlimited';

  // Original code (commented out for now):
  // const plan = getCurrentPlan();
  // return PLAN_DETAILS[plan].name;
}

// Check if user is on free plan - FOR NOW, NO ONE IS ON FREE PLAN
export function isFreePlan() {
  // TEMPORARY: No one is on free plan during development
  return false;

  // Original code (commented out for now):
  // return getCurrentPlan() === PLANS.FREE;
}
