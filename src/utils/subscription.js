/**
 * Subscription Management Utilities
 * Handles subscription status, ad display, and feature access
 */

const SUBSCRIPTION_KEY = "subscription:plan:v1";
const AD_DISABLED_KEY = "ads:disabled";

// Subscription plans
export const PLANS = {
    FREE: "free",
    SUPPORTER: "supporter",
    UNLIMITED: "unlimited",
    FAMILY: "family",
};

// Plan details
export const PLAN_DETAILS = {
    [PLANS.FREE]: {
        name: "Free",
        price: 0,
        priceMonthly: 0,
        priceYearly: 0,
        hasAds: true,
        searchLimit: 10,
        favoritesLimit: 20,
        features: ["Basic features", "10 searches/day", "20 favorites", "Ads"],
    },
    [PLANS.SUPPORTER]: {
        name: "Supporter",
        price: 2.99,
        priceMonthly: 2.99,
        priceYearly: 29.99, // ~$2.50/mo (save 17%)
        hasAds: false,
        searchLimit: 50,
        favoritesLimit: 100,
        features: ["No ads", "50 searches/day", "100 favorites", "Cloud sync"],
    },
    [PLANS.UNLIMITED]: {
        name: "Unlimited",
        price: 4.99,
        priceMonthly: 4.99,
        priceYearly: 49.99, // ~$4.17/mo (save 16%)
        hasAds: false,
        searchLimit: -1, // unlimited
        favoritesLimit: -1, // unlimited
        features: ["No ads", "Unlimited searches", "Unlimited favorites", "All premium features"],
    },
    [PLANS.FAMILY]: {
        name: "Family",
        price: 9.99,
        priceMonthly: 9.99,
        priceYearly: 99.99, // ~$8.33/mo (save 17%)
        hasAds: false,
        searchLimit: -1,
        favoritesLimit: -1,
        features: ["No ads", "Everything in Unlimited", "10 family members", "Family features"],
    },
};

// Get current subscription plan
export function getCurrentPlan() {
    try {
        const plan = localStorage.getItem(SUBSCRIPTION_KEY);
        return plan || PLANS.FREE;
    } catch {
        return PLANS.FREE;
    }
}

// Set subscription plan
export function setCurrentPlan(plan) {
    try {
        localStorage.setItem(SUBSCRIPTION_KEY, plan);
        // If upgrading from free, disable ads
        if (plan !== PLANS.FREE) {
            localStorage.setItem(AD_DISABLED_KEY, "true");
        }
        return true;
    } catch {
        return false;
    }
}

// Check if user has ads disabled
export function hasAdsDisabled() {
    try {
        const plan = getCurrentPlan();
        const planDetails = PLAN_DETAILS[plan];
        
        // Paid plans don't have ads
        if (!planDetails.hasAds) {
            return true;
        }
        
        // Check if ads were manually disabled
        const adsDisabled = localStorage.getItem(AD_DISABLED_KEY);
        return adsDisabled === "true";
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
    const plan = getCurrentPlan();
    const planDetails = PLAN_DETAILS[plan];
    
    switch (feature) {
        case "unlimited_searches":
            return planDetails.searchLimit === -1;
        case "unlimited_favorites":
            return planDetails.favoritesLimit === -1;
        case "no_ads":
            return !planDetails.hasAds;
        case "cloud_sync":
            return plan !== PLANS.FREE;
        case "analytics":
            return plan !== PLANS.FREE;
        case "family_plan":
            return plan === PLANS.FAMILY;
        default:
            return false;
    }
}

// Check if user can perform an action (searches, favorites)
export function canPerformAction(action, currentCount) {
    const plan = getCurrentPlan();
    const planDetails = PLAN_DETAILS[plan];
    
    switch (action) {
        case "search":
            if (planDetails.searchLimit === -1) return true;
            return currentCount < planDetails.searchLimit;
        case "favorite":
            if (planDetails.favoritesLimit === -1) return true;
            return currentCount < planDetails.favoritesLimit;
        default:
            return true;
    }
}

// Get remaining actions for today
export function getRemainingActions(action, currentCount) {
    const plan = getCurrentPlan();
    const planDetails = PLAN_DETAILS[plan];
    
    switch (action) {
        case "search":
            if (planDetails.searchLimit === -1) return "Unlimited";
            return Math.max(0, planDetails.searchLimit - currentCount);
        case "favorite":
            if (planDetails.favoritesLimit === -1) return "Unlimited";
            return Math.max(0, planDetails.favoritesLimit - currentCount);
        default:
            return 0;
    }
}

// Get plan display name
export function getPlanName() {
    const plan = getCurrentPlan();
    return PLAN_DETAILS[plan].name;
}

// Check if user is on free plan
export function isFreePlan() {
    return getCurrentPlan() === PLANS.FREE;
}

