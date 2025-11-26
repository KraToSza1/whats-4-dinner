/**
 * Currency Detection and Conversion Utility
 * Auto-detects user's country and converts USD (base) to local currency
 */

const CURRENCY_STORAGE_KEY = 'currency:settings:v1';
const EXCHANGE_RATE_CACHE_KEY = 'currency:rates:v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Comprehensive Country to Currency mapping (200+ countries)
const COUNTRY_CURRENCIES = {
  // North America
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  // Europe
  GB: 'GBP',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  CY: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  CH: 'CHF',
  NO: 'NOK',
  SE: 'SEK',
  DK: 'DKK',
  IS: 'ISK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  HR: 'HRK',
  RS: 'RSD',
  BA: 'BAM',
  MK: 'MKD',
  AL: 'ALL',
  // Asia
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  IN: 'INR',
  SG: 'SGD',
  MY: 'MYR',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  TW: 'TWD',
  HK: 'HKD',
  MO: 'MOP',
  BD: 'BDT',
  PK: 'PKR',
  LK: 'LKR',
  MM: 'MMK',
  KH: 'KHR',
  LA: 'LAK',
  BN: 'BND',
  MN: 'MNT',
  KZ: 'KZT',
  UZ: 'UZS',
  KG: 'KGS',
  TJ: 'TJS',
  TM: 'TMT',
  AF: 'AFN',
  NP: 'NPR',
  BT: 'BTN',
  MV: 'MVR',
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  IL: 'ILS',
  TR: 'TRY',
  IQ: 'IQD',
  IR: 'IRR',
  JO: 'JOD',
  LB: 'LBP',
  KW: 'KWD',
  OM: 'OMR',
  QA: 'QAR',
  BH: 'BHD',
  YE: 'YER',
  SY: 'SYP',
  PS: 'ILS',
  // Africa
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  EG: 'EGP',
  MA: 'MAD',
  DZ: 'DZD',
  TN: 'TND',
  ET: 'ETB',
  GH: 'GHS',
  UG: 'UGX',
  TZ: 'TZS',
  ZW: 'ZWL',
  ZM: 'ZMW',
  MW: 'MWK',
  MZ: 'MZN',
  AO: 'AOA',
  BW: 'BWP',
  LS: 'LSL',
  SZ: 'SZL',
  NA: 'NAD',
  // South America
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  VE: 'VES',
  UY: 'UYU',
  PY: 'PYG',
  BO: 'BOB',
  EC: 'USD',
  GY: 'GYD',
  SR: 'SRD',
  // Central America & Caribbean
  CR: 'CRC',
  PA: 'PAB',
  GT: 'GTQ',
  HN: 'HNL',
  NI: 'NIO',
  SV: 'USD',
  BZ: 'BZD',
  JM: 'JMD',
  TT: 'TTD',
  BB: 'BBD',
  BS: 'BSD',
  // Oceania
  AU: 'AUD',
  NZ: 'NZD',
  FJ: 'FJD',
  PG: 'PGK',
  SB: 'SBD',
  VU: 'VUV',
  NC: 'XPF',
  PF: 'XPF',
  // Eastern Europe & Central Asia
  RU: 'RUB',
  UA: 'UAH',
  BY: 'BYN',
  MD: 'MDL',
  GE: 'GEL',
  AM: 'AMD',
  AZ: 'AZN',
  // Other
  default: 'USD',
};

// Comprehensive Currency symbols and formatting (100+ currencies)
const CURRENCY_INFO = {
  // Major currencies
  USD: { symbol: '$', name: 'US Dollar', code: 'USD', position: 'before' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR', position: 'before' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP', position: 'before' },
  JPY: { symbol: '¥', name: 'Japanese Yen', code: 'JPY', position: 'before' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY', position: 'before' },
  // Americas
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD', position: 'before' },
  MXN: { symbol: '$', name: 'Mexican Peso', code: 'MXN', position: 'before' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', code: 'BRL', position: 'before' },
  ARS: { symbol: '$', name: 'Argentine Peso', code: 'ARS', position: 'before' },
  CLP: { symbol: '$', name: 'Chilean Peso', code: 'CLP', position: 'before' },
  COP: { symbol: '$', name: 'Colombian Peso', code: 'COP', position: 'before' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol', code: 'PEN', position: 'before' },
  VES: { symbol: 'Bs.', name: 'Venezuelan Bolívar', code: 'VES', position: 'before' },
  UYU: { symbol: '$U', name: 'Uruguayan Peso', code: 'UYU', position: 'before' },
  PYG: { symbol: '₲', name: 'Paraguayan Guaraní', code: 'PYG', position: 'before' },
  BOB: { symbol: 'Bs.', name: 'Bolivian Boliviano', code: 'BOB', position: 'before' },
  CRC: { symbol: '₡', name: 'Costa Rican Colón', code: 'CRC', position: 'before' },
  PAB: { symbol: 'B/.', name: 'Panamanian Balboa', code: 'PAB', position: 'before' },
  GTQ: { symbol: 'Q', name: 'Guatemalan Quetzal', code: 'GTQ', position: 'before' },
  HNL: { symbol: 'L', name: 'Honduran Lempira', code: 'HNL', position: 'before' },
  NIO: { symbol: 'C$', name: 'Nicaraguan Córdoba', code: 'NIO', position: 'before' },
  BZD: { symbol: 'BZ$', name: 'Belize Dollar', code: 'BZD', position: 'before' },
  JMD: { symbol: 'J$', name: 'Jamaican Dollar', code: 'JMD', position: 'before' },
  TTD: { symbol: 'TT$', name: 'Trinidad & Tobago Dollar', code: 'TTD', position: 'before' },
  BBD: { symbol: 'Bds$', name: 'Barbadian Dollar', code: 'BBD', position: 'before' },
  BSD: { symbol: 'B$', name: 'Bahamian Dollar', code: 'BSD', position: 'before' },
  // Europe
  CHF: { symbol: 'CHF', name: 'Swiss Franc', code: 'CHF', position: 'before' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', code: 'NOK', position: 'after' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', code: 'SEK', position: 'after' },
  DKK: { symbol: 'kr', name: 'Danish Krone', code: 'DKK', position: 'after' },
  ISK: { symbol: 'kr', name: 'Icelandic Króna', code: 'ISK', position: 'after' },
  PLN: { symbol: 'zł', name: 'Polish Zloty', code: 'PLN', position: 'after' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', code: 'CZK', position: 'after' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', code: 'HUF', position: 'after' },
  RON: { symbol: 'lei', name: 'Romanian Leu', code: 'RON', position: 'after' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev', code: 'BGN', position: 'after' },
  HRK: { symbol: 'kn', name: 'Croatian Kuna', code: 'HRK', position: 'after' },
  RSD: { symbol: 'дин', name: 'Serbian Dinar', code: 'RSD', position: 'after' },
  BAM: { symbol: 'КМ', name: 'Bosnia-Herzegovina Mark', code: 'BAM', position: 'after' },
  MKD: { symbol: 'ден', name: 'Macedonian Denar', code: 'MKD', position: 'after' },
  ALL: { symbol: 'L', name: 'Albanian Lek', code: 'ALL', position: 'after' },
  // Asia
  KRW: { symbol: '₩', name: 'South Korean Won', code: 'KRW', position: 'before' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR', position: 'before' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD', position: 'before' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', code: 'MYR', position: 'before' },
  THB: { symbol: '฿', name: 'Thai Baht', code: 'THB', position: 'before' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', code: 'IDR', position: 'before' },
  PHP: { symbol: '₱', name: 'Philippine Peso', code: 'PHP', position: 'before' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', code: 'VND', position: 'after' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar', code: 'TWD', position: 'before' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', code: 'HKD', position: 'before' },
  MOP: { symbol: 'MOP$', name: 'Macanese Pataca', code: 'MOP', position: 'before' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', code: 'BDT', position: 'before' },
  PKR: { symbol: '₨', name: 'Pakistani Rupee', code: 'PKR', position: 'before' },
  LKR: { symbol: '₨', name: 'Sri Lankan Rupee', code: 'LKR', position: 'before' },
  MMK: { symbol: 'K', name: 'Myanmar Kyat', code: 'MMK', position: 'before' },
  KHR: { symbol: '៛', name: 'Cambodian Riel', code: 'KHR', position: 'after' },
  LAK: { symbol: '₭', name: 'Lao Kip', code: 'LAK', position: 'before' },
  BND: { symbol: 'B$', name: 'Brunei Dollar', code: 'BND', position: 'before' },
  MNT: { symbol: '₮', name: 'Mongolian Tugrik', code: 'MNT', position: 'before' },
  KZT: { symbol: '₸', name: 'Kazakhstani Tenge', code: 'KZT', position: 'after' },
  UZS: { symbol: "so'm", name: 'Uzbekistani Som', code: 'UZS', position: 'after' },
  KGS: { symbol: 'сом', name: 'Kyrgystani Som', code: 'KGS', position: 'after' },
  TJS: { symbol: 'ЅМ', name: 'Tajikistani Somoni', code: 'TJS', position: 'after' },
  TMT: { symbol: 'm', name: 'Turkmenistani Manat', code: 'TMT', position: 'after' },
  AFN: { symbol: '؋', name: 'Afghan Afghani', code: 'AFN', position: 'before' },
  NPR: { symbol: '₨', name: 'Nepalese Rupee', code: 'NPR', position: 'before' },
  BTN: { symbol: 'Nu.', name: 'Bhutanese Ngultrum', code: 'BTN', position: 'before' },
  MVR: { symbol: 'Rf', name: 'Maldivian Rufiyaa', code: 'MVR', position: 'before' },
  // Middle East
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED', position: 'before' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', code: 'SAR', position: 'before' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', code: 'ILS', position: 'before' },
  TRY: { symbol: '₺', name: 'Turkish Lira', code: 'TRY', position: 'before' },
  IQD: { symbol: 'ع.د', name: 'Iraqi Dinar', code: 'IQD', position: 'after' },
  IRR: { symbol: '﷼', name: 'Iranian Rial', code: 'IRR', position: 'before' },
  JOD: { symbol: 'د.ا', name: 'Jordanian Dinar', code: 'JOD', position: 'before' },
  LBP: { symbol: '£', name: 'Lebanese Pound', code: 'LBP', position: 'before' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', code: 'KWD', position: 'before' },
  OMR: { symbol: '﷼', name: 'Omani Rial', code: 'OMR', position: 'before' },
  QAR: { symbol: '﷼', name: 'Qatari Riyal', code: 'QAR', position: 'before' },
  BHD: { symbol: 'د.ب', name: 'Bahraini Dinar', code: 'BHD', position: 'before' },
  YER: { symbol: '﷼', name: 'Yemeni Rial', code: 'YER', position: 'before' },
  SYP: { symbol: '£', name: 'Syrian Pound', code: 'SYP', position: 'before' },
  // Africa
  ZAR: { symbol: 'R', name: 'South African Rand', code: 'ZAR', position: 'before' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', code: 'NGN', position: 'before' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', code: 'KES', position: 'before' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', code: 'EGP', position: 'before' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham', code: 'MAD', position: 'after' },
  DZD: { symbol: 'د.ج', name: 'Algerian Dinar', code: 'DZD', position: 'before' },
  TND: { symbol: 'د.ت', name: 'Tunisian Dinar', code: 'TND', position: 'before' },
  ETB: { symbol: 'Br', name: 'Ethiopian Birr', code: 'ETB', position: 'before' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi', code: 'GHS', position: 'before' },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling', code: 'UGX', position: 'before' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', code: 'TZS', position: 'before' },
  ZWL: { symbol: 'Z$', name: 'Zimbabwean Dollar', code: 'ZWL', position: 'before' },
  ZMW: { symbol: 'ZK', name: 'Zambian Kwacha', code: 'ZMW', position: 'before' },
  MWK: { symbol: 'MK', name: 'Malawian Kwacha', code: 'MWK', position: 'before' },
  MZN: { symbol: 'MT', name: 'Mozambican Metical', code: 'MZN', position: 'before' },
  AOA: { symbol: 'Kz', name: 'Angolan Kwanza', code: 'AOA', position: 'before' },
  BWP: { symbol: 'P', name: 'Botswana Pula', code: 'BWP', position: 'before' },
  LSL: { symbol: 'L', name: 'Lesotho Loti', code: 'LSL', position: 'before' },
  SZL: { symbol: 'E', name: 'Swazi Lilangeni', code: 'SZL', position: 'before' },
  NAD: { symbol: 'N$', name: 'Namibian Dollar', code: 'NAD', position: 'before' },
  // Oceania
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD', position: 'before' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD', position: 'before' },
  FJD: { symbol: 'FJ$', name: 'Fijian Dollar', code: 'FJD', position: 'before' },
  PGK: { symbol: 'K', name: 'Papua New Guinean Kina', code: 'PGK', position: 'before' },
  SBD: { symbol: 'SI$', name: 'Solomon Islands Dollar', code: 'SBD', position: 'before' },
  VUV: { symbol: 'Vt', name: 'Vanuatu Vatu', code: 'VUV', position: 'after' },
  XPF: { symbol: '₣', name: 'CFP Franc', code: 'XPF', position: 'after' },
  // Eastern Europe & Central Asia
  RUB: { symbol: '₽', name: 'Russian Ruble', code: 'RUB', position: 'after' },
  UAH: { symbol: '₴', name: 'Ukrainian Hryvnia', code: 'UAH', position: 'after' },
  BYN: { symbol: 'Br', name: 'Belarusian Ruble', code: 'BYN', position: 'after' },
  MDL: { symbol: 'L', name: 'Moldovan Leu', code: 'MDL', position: 'after' },
  GEL: { symbol: '₾', name: 'Georgian Lari', code: 'GEL', position: 'after' },
  AMD: { symbol: '֏', name: 'Armenian Dram', code: 'AMD', position: 'after' },
  AZN: { symbol: '₼', name: 'Azerbaijani Manat', code: 'AZN', position: 'after' },
};

// Comprehensive fallback exchange rates (updated periodically, but API is preferred)
// These are approximate rates - API rates are always preferred
const FALLBACK_RATES = {
  // Major currencies
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.0,
  CNY: 7.2,
  // Americas
  CAD: 1.35,
  MXN: 17.0,
  BRL: 4.95,
  ARS: 850,
  CLP: 950,
  COP: 4100,
  PEN: 3.7,
  VES: 36.0,
  UYU: 39.0,
  PYG: 7300,
  BOB: 6.9,
  CRC: 520,
  PAB: 1.0,
  GTQ: 7.8,
  HNL: 24.7,
  NIO: 36.8,
  BZD: 2.0,
  JMD: 155,
  TTD: 6.8,
  BBD: 2.0,
  BSD: 1.0,
  // Europe
  CHF: 0.88,
  NOK: 10.5,
  SEK: 10.8,
  DKK: 6.85,
  ISK: 138,
  PLN: 4.0,
  CZK: 22.5,
  HUF: 360,
  RON: 4.6,
  BGN: 1.8,
  HRK: 6.9,
  RSD: 108,
  BAM: 1.8,
  MKD: 56,
  ALL: 93,
  // Asia
  KRW: 1320,
  INR: 83.0,
  SGD: 1.34,
  MYR: 4.7,
  THB: 35.5,
  IDR: 15700,
  PHP: 56.0,
  VND: 24500,
  TWD: 31.5,
  HKD: 7.8,
  MOP: 8.0,
  BDT: 110,
  PKR: 278,
  LKR: 325,
  MMK: 2100,
  KHR: 4100,
  LAK: 21000,
  BND: 1.34,
  MNT: 3400,
  KZT: 450,
  UZS: 12300,
  KGS: 89,
  TJS: 10.9,
  TMT: 3.5,
  AFN: 70,
  NPR: 133,
  BTN: 83.0,
  MVR: 15.4,
  // Middle East
  AED: 3.67,
  SAR: 3.75,
  ILS: 3.65,
  TRY: 32.0,
  IQD: 1310,
  IRR: 42000,
  JOD: 0.71,
  LBP: 15000,
  KWD: 0.31,
  OMR: 0.38,
  QAR: 3.64,
  BHD: 0.38,
  YER: 250,
  SYP: 13000,
  // Africa
  ZAR: 18.5,
  NGN: 1500,
  KES: 130,
  EGP: 31.0,
  MAD: 10.0,
  DZD: 134,
  TND: 3.1,
  ETB: 56,
  GHS: 12.5,
  UGX: 3700,
  TZS: 2500,
  ZWL: 1500,
  ZMW: 24,
  MWK: 1700,
  MZN: 64,
  AOA: 830,
  BWP: 13.6,
  LSL: 18.5,
  SZL: 18.5,
  NAD: 18.5,
  // Oceania
  AUD: 1.52,
  NZD: 1.62,
  FJD: 2.25,
  PGK: 3.8,
  SBD: 8.4,
  VUV: 119,
  XPF: 110,
  // Eastern Europe & Central Asia
  RUB: 92.0,
  UAH: 37.0,
  BYN: 3.3,
  MDL: 18.0,
  GEL: 2.7,
  AMD: 405,
  AZN: 1.7,
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
  } catch {
    // Ignore errors
  }
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
 * Detect user's country using multiple methods with comprehensive fallbacks
 */
export async function detectCountry() {
  // Check if user has manually set a country
  const settings = readCurrencySettings();
  if (settings?.country && settings?.country !== 'US') {
    return settings.country;
  }

  const detectionMethods = [];

  try {
    // Method 1: Try ipapi.co (free, no key needed, 1000 requests/day)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const geo = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      })
        .then(r => {
          clearTimeout(timeoutId);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch(err => {
          clearTimeout(timeoutId);
          throw err;
        });

      if (geo?.country_code) {
        detectionMethods.push({ method: 'ipapi.co', country: geo.country_code.toUpperCase() });
        return geo.country_code.toUpperCase();
      }
    } catch (e) {
      // Silently fail - try next method
      if (e.name !== 'AbortError') {
        console.warn('ipapi.co detection failed:', e.message);
      }
    }

    // Method 2: Try ip-api.com (free, no key needed, 45 requests/minute)
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 3000);

      const geo2 = await fetch('https://ip-api.com/json/', {
        signal: controller2.signal,
        mode: 'cors',
        credentials: 'omit',
      })
        .then(r => {
          clearTimeout(timeoutId2);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch(err => {
          clearTimeout(timeoutId2);
          throw err;
        });

      if (geo2?.countryCode) {
        detectionMethods.push({ method: 'ip-api.com', country: geo2.countryCode.toUpperCase() });
        return geo2.countryCode.toUpperCase();
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('ip-api.com detection failed:', e.message);
      }
    }

    // Method 3: Try geojs.io (free, no key needed)
    try {
      const controller3 = new AbortController();
      const timeoutId3 = setTimeout(() => controller3.abort(), 3000);

      const geo3 = await fetch('https://get.geojs.io/v1/ip/geo.json', {
        signal: controller3.signal,
        mode: 'cors',
        credentials: 'omit',
      })
        .then(r => {
          clearTimeout(timeoutId3);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch(err => {
          clearTimeout(timeoutId3);
          throw err;
        });

      if (geo3?.country_code) {
        detectionMethods.push({ method: 'geojs.io', country: geo3.country_code.toUpperCase() });
        return geo3.country_code.toUpperCase();
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('geojs.io detection failed:', e.message);
      }
    }

    // Method 4: Use browser locale
    try {
      const locale = navigator.language || navigator.languages?.[0] || 'en-US';
      const country = locale.split('-')[1] || locale.split('_')[1];
      if (country && country.length === 2) {
        detectionMethods.push({ method: 'browser-locale', country: country.toUpperCase() });
        return country.toUpperCase();
      }
    } catch (e) {
      // Silently fail
    }

    // Method 5: Use Intl API timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Map common timezones to countries (simplified)
      const timezoneToCountry = {
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Seoul': 'KR',
        'Asia/Dubai': 'AE',
        'Asia/Singapore': 'SG',
        'Asia/Mumbai': 'IN',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Pacific/Auckland': 'NZ',
      };
      if (timezoneToCountry[timezone]) {
        detectionMethods.push({ method: 'timezone', country: timezoneToCountry[timezone] });
        return timezoneToCountry[timezone];
      }
    } catch (e) {
      // Silently fail
    }
  } catch (e) {
    // Final catch - all methods failed
    console.warn('Country detection failed:', e.message);
  }

  // Log detection attempts for debugging (only in dev)
  if (detectionMethods.length > 0 && import.meta.env.DEV) {
    console.log('🌍 Country detection methods tried:', detectionMethods);
  }

  return 'US'; // Default to US if all methods fail
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode) {
  return COUNTRY_CURRENCIES[countryCode] || COUNTRY_CURRENCIES[countryCode?.slice(0, 2)] || 'USD';
}

/**
 * Fetch exchange rates from free API with multiple fallbacks
 */
export async function fetchExchangeRates() {
  // Check cache first
  const cached = readExchangeRates();
  if (cached) {
    return cached;
  }

  const apiMethods = [
    // Method 1: exchangerate-api.com (free, no key needed, unlimited requests)
    {
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      parser: async r => {
        const data = await r.json();
        return data.rates || {};
      },
    },
    // Method 2: exchangerate.host (free, no key needed)
    {
      url: 'https://api.exchangerate.host/latest?base=USD',
      parser: async r => {
        const data = await r.json();
        return data.rates || {};
      },
    },
    // Method 3: fixer.io free tier (requires API key, but we'll try)
    // Note: This would require an API key in production
    // Method 4: currencyapi.net (free tier: 300 requests/month)
    // Note: This would require an API key
  ];

  for (const method of apiMethods) {
    try {
      const response = await Promise.race([
        fetch(method.url, { signal: AbortSignal.timeout(5000) }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ]);

      if (response.ok) {
        const rates = await method.parser(response);
        if (rates && Object.keys(rates).length > 0) {
          writeExchangeRates(rates);
          console.log(`✅ Exchange rates fetched from ${method.url}`);
          return rates;
        }
      }
    } catch (e) {
      console.warn(`Exchange rate API (${method.url}) failed:`, e);
      continue;
    }
  }

  // Fallback to cached rates or default rates
  console.warn('⚠️ All exchange rate APIs failed, using fallback rates');
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
 * Format currency amount with proper positioning
 */
export function formatCurrency(amount, currency = null) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const settings = getCurrencySettings();
  const targetCurrency = currency || settings.currency;
  const info = CURRENCY_INFO[targetCurrency] || CURRENCY_INFO.USD;

  // Format number based on currency
  let formattedAmount;
  const currenciesNoDecimals = [
    'JPY',
    'KRW',
    'VND',
    'IDR',
    'CLP',
    'UGX',
    'TZS',
    'KHR',
    'LAK',
    'MNT',
    'UZS',
    'BYN',
    'PYG',
    'IQD',
    'IRR',
    'YER',
    'SYP',
    'LBP',
  ];

  if (currenciesNoDecimals.includes(targetCurrency)) {
    formattedAmount = Math.round(amount).toLocaleString();
  } else {
    formattedAmount = parseFloat(amount).toFixed(2).toLocaleString();
  }

  // Position symbol based on currency convention
  const position = info.position || 'before';
  if (position === 'after') {
    return `${formattedAmount} ${info.symbol}`;
  }

  // Handle special cases for $ symbol
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
