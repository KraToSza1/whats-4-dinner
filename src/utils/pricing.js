/**
 * Location-Aware Pricing Utility
 * Converts USD subscription prices to user's local currency
 */

import {
  getCurrencySettings,
  convertToLocal,
  formatCurrency,
  initializeCurrency,
} from './currency.js';

// Base USD prices (these are the source of truth)
export const BASE_USD_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  supporter: {
    monthly: 2.99,
    yearly: 29.99,
  },
  unlimited: {
    monthly: 4.99,
    yearly: 49.99,
  },
  family: {
    monthly: 9.99,
    yearly: 99.99,
  },
};

// Cache for converted prices
let priceCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get converted price for a plan
 */
export async function getLocalPrice(plan, period = 'monthly') {
  // Initialize currency if needed
  await initializeCurrency();

  const settings = getCurrencySettings();
  const key = period === 'yearly' ? 'yearly' : 'monthly';

  // If USD, return base price
  if (settings.currency === 'USD') {
    return BASE_USD_PRICES[plan]?.[key] || 0;
  }

  // Check cache
  const cacheKey = `${plan}-${period}-${settings.currency}`;
  if (priceCache?.[cacheKey] && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return priceCache[cacheKey];
  }

  // Convert from USD
  const usdPrice = BASE_USD_PRICES[plan]?.[key] || 0;
  const localPrice = await convertToLocal(usdPrice);

  // Cache result
  if (!priceCache) priceCache = {};
  priceCache[cacheKey] = localPrice;
  cacheTimestamp = Date.now();

  return localPrice;
}

/**
 * Get formatted price string for a plan
 */
export async function getFormattedPrice(plan, period = 'monthly') {
  const price = await getLocalPrice(plan, period);
  return formatCurrency(price);
}

/**
 * Get all plan prices in local currency
 */
export async function getAllLocalPrices() {
  await initializeCurrency();

  const plans = ['free', 'supporter', 'unlimited', 'family'];
  const prices = {};

  for (const plan of plans) {
    prices[plan] = {
      monthly: await getLocalPrice(plan, 'monthly'),
      yearly: await getLocalPrice(plan, 'yearly'),
      formattedMonthly: await getFormattedPrice(plan, 'monthly'),
      formattedYearly: await getFormattedPrice(plan, 'yearly'),
    };
  }

  return prices;
}

/**
 * Clear price cache (useful when currency changes)
 */
export function clearPriceCache() {
  priceCache = null;
  cacheTimestamp = null;
}
