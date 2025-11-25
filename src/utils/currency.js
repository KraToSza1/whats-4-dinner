/**
 * Currency Detection and Conversion Utility
 * Auto-detects user's country and converts USD (base) to local currency
 */

const CURRENCY_STORAGE_KEY = 'currency:settings:v1';
const EXCHANGE_RATE_CACHE_KEY = 'currency:rates:v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Country to Currency mapping
const COUNTRY_CURRENCIES = {
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  EU: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  IN: 'INR',
  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  EG: 'EGP',
  MA: 'MAD',
  AE: 'AED',
  SA: 'SAR',
  IL: 'ILS',
  TR: 'TRY',
  RU: 'RUB',
  SG: 'SGD',
  MY: 'MYR',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  CH: 'CHF',
  NO: 'NOK',
  SE: 'SEK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  // Default fallbacks
  default: 'USD',
};

// Currency symbols and formatting
const CURRENCY_INFO = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  JPY: { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', code: 'BRL' },
  MXN: { symbol: '$', name: 'Mexican Peso', code: 'MXN' },
  ZAR: { symbol: 'R', name: 'South African Rand', code: 'ZAR' },
  KRW: { symbol: '₩', name: 'South Korean Won', code: 'KRW' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', code: 'CHF' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', code: 'NOK' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', code: 'SEK' },
  DKK: { symbol: 'kr', name: 'Danish Krone', code: 'DKK' },
  PLN: { symbol: 'zł', name: 'Polish Zloty', code: 'PLN' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', code: 'CZK' },
  TRY: { symbol: '₺', name: 'Turkish Lira', code: 'TRY' },
  RUB: { symbol: '₽', name: 'Russian Ruble', code: 'RUB' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', code: 'SAR' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', code: 'ILS' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', code: 'NGN' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', code: 'KES' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', code: 'EGP' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham', code: 'MAD' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', code: 'MYR' },
  THB: { symbol: '฿', name: 'Thai Baht', code: 'THB' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', code: 'IDR' },
  PHP: { symbol: '₱', name: 'Philippine Peso', code: 'PHP' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', code: 'VND' },
  ARS: { symbol: '$', name: 'Argentine Peso', code: 'ARS' },
  CLP: { symbol: '$', name: 'Chilean Peso', code: 'CLP' },
};

// Fallback exchange rates (updated periodically, but API is preferred)
const FALLBACK_RATES = {
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.0,
  CAD: 1.35,
  AUD: 1.52,
  CNY: 7.2,
  INR: 83.0,
  BRL: 4.95,
  MXN: 17.0,
  ZAR: 18.5,
  KRW: 1320,
  SGD: 1.34,
  NZD: 1.62,
  CHF: 0.88,
  NOK: 10.5,
  SEK: 10.8,
  DKK: 6.85,
  PLN: 4.0,
  CZK: 22.5,
  TRY: 32.0,
  RUB: 92.0,
  AED: 3.67,
  SAR: 3.75,
  ILS: 3.65,
  NGN: 1500,
  KES: 130,
  EGP: 31.0,
  MAD: 10.0,
  MYR: 4.7,
  THB: 35.5,
  IDR: 15700,
  PHP: 56.0,
  VND: 24500,
  ARS: 850,
  CLP: 950,
};

function readCurrencySettings() {
  try {
    return JSON.parse(localStorage.getItem(CURRENCY_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeCurrencySettings(settings) {
  localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(settings));
}

function readExchangeRates() {
  try {
    const cached = JSON.parse(localStorage.getItem(EXCHANGE_RATE_CACHE_KEY) || 'null');
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rates;
    }
  } catch {}
  return null;
}

function writeExchangeRates(rates) {
  localStorage.setItem(
    EXCHANGE_RATE_CACHE_KEY,
    JSON.stringify({
      rates,
      timestamp: Date.now(),
    })
  );
}

/**
 * Detect user's country using multiple methods
 */
export async function detectCountry() {
  // Check if user has manually set a country
  const settings = readCurrencySettings();
  if (settings?.country) {
    return settings.country;
  }

  try {
    // Method 1: Try IP geolocation API (free, no key needed)
    const geo = await fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .catch(() => null);

    if (geo?.country_code) {
      return geo.country_code.toUpperCase();
    }

    // Method 2: Try another free API
    const geo2 = await fetch('https://ip-api.com/json/')
      .then(r => r.json())
      .catch(() => null);

    if (geo2?.countryCode) {
      return geo2.countryCode.toUpperCase();
    }

    // Method 3: Use browser locale
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    const country = locale.split('-')[1] || locale.split('_')[1];
    if (country) {
      return country.toUpperCase();
    }
  } catch (e) {
    console.warn('Country detection failed:', e);
  }

  return 'US'; // Default to US
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode) {
  return COUNTRY_CURRENCIES[countryCode] || COUNTRY_CURRENCIES[countryCode?.slice(0, 2)] || 'USD';
}

/**
 * Fetch exchange rates from free API
 */
export async function fetchExchangeRates() {
  // Check cache first
  const cached = readExchangeRates();
  if (cached) {
    return cached;
  }

  try {
    // Try exchangerate-api.com (free, no key needed for basic usage)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      const rates = data.rates || {};
      writeExchangeRates(rates);
      return rates;
    }
  } catch (e) {
    console.warn('Exchange rate API failed:', e);
  }

  // Fallback to cached rates or default rates
  return FALLBACK_RATES;
}

/**
 * Initialize currency settings (detect country and currency)
 */
export async function initializeCurrency() {
  const settings = readCurrencySettings();
  if (settings?.currency && settings?.country) {
    return settings;
  }

  const country = await detectCountry();
  const currency = getCurrencyForCountry(country);

  const newSettings = {
    country,
    currency,
    autoDetected: true,
  };

  writeCurrencySettings(newSettings);
  await fetchExchangeRates(); // Pre-fetch rates

  return newSettings;
}

/**
 * Get current currency settings
 */
export function getCurrencySettings() {
  return readCurrencySettings() || { currency: 'USD', country: 'US' };
}

/**
 * Set currency manually
 */
export function setCurrency(currency, country = null) {
  const settings = {
    currency,
    country: country || 'US',
    autoDetected: false,
  };
  writeCurrencySettings(settings);
  return settings;
}

/**
 * Convert USD amount to local currency
 */
export async function convertToLocal(usdAmount) {
  if (!usdAmount || isNaN(usdAmount)) return usdAmount;

  const settings = getCurrencySettings();
  if (settings.currency === 'USD') {
    return usdAmount;
  }

  const rates = await fetchExchangeRates();
  const rate = rates[settings.currency] || FALLBACK_RATES[settings.currency] || 1;

  return usdAmount * rate;
}

/**
 * Convert local currency amount to USD
 */
export async function convertToUSD(localAmount, currency = null) {
  if (!localAmount || isNaN(localAmount)) return localAmount;

  const settings = getCurrencySettings();
  const targetCurrency = currency || settings.currency;

  if (targetCurrency === 'USD') {
    return localAmount;
  }

  const rates = await fetchExchangeRates();
  const rate = rates[targetCurrency] || FALLBACK_RATES[targetCurrency] || 1;

  return localAmount / rate;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount, currency = null) {
  const settings = getCurrencySettings();
  const targetCurrency = currency || settings.currency;
  const info = CURRENCY_INFO[targetCurrency] || CURRENCY_INFO.USD;

  // Format number based on currency
  let formattedAmount;
  if (
    targetCurrency === 'JPY' ||
    targetCurrency === 'KRW' ||
    targetCurrency === 'VND' ||
    targetCurrency === 'IDR'
  ) {
    formattedAmount = Math.round(amount).toLocaleString();
  } else {
    formattedAmount = amount.toFixed(2);
  }

  // Add symbol based on currency
  if (info.symbol === '$' && targetCurrency !== 'USD') {
    return `${info.symbol}${formattedAmount}`;
  }

  return `${info.symbol}${formattedAmount}`;
}

/**
 * Get currency info
 */
export function getCurrencyInfo(currency = null) {
  const settings = getCurrencySettings();
  const targetCurrency = currency || settings.currency;
  return CURRENCY_INFO[targetCurrency] || CURRENCY_INFO.USD;
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies() {
  return Object.entries(CURRENCY_INFO).map(([code, info]) => ({
    code,
    ...info,
  }));
}
