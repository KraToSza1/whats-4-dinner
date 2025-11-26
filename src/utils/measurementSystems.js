/**
 * Comprehensive Country to Measurement System Mapping
 * Maps countries to their preferred measurement systems (Metric, US, UK)
 */

// Countries that use US Customary units
const US_MEASUREMENT_COUNTRIES = [
  'US', // United States
  'PR', // Puerto Rico
  'GU', // Guam
  'AS', // American Samoa
  'VI', // US Virgin Islands
  'UM', // US Minor Outlying Islands
  'MH', // Marshall Islands
  'FM', // Micronesia
  'PW', // Palau
  'LR', // Liberia (uses US system)
  'MM', // Myanmar (uses US system)
];

// Countries that use UK Imperial units
const UK_MEASUREMENT_COUNTRIES = [
  'GB', // United Kingdom
  'IE', // Ireland (uses metric but some imperial)
  'MT', // Malta
  'CY', // Cyprus
];

// All other countries use Metric (default)

/**
 * Get measurement system for a country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - 'us', 'uk', or 'metric'
 */
export function getMeasurementSystemForCountry(countryCode) {
  if (!countryCode) return 'metric';

  const code = countryCode.toUpperCase();

  if (US_MEASUREMENT_COUNTRIES.includes(code)) {
    return 'us';
  }

  if (UK_MEASUREMENT_COUNTRIES.includes(code)) {
    return 'uk';
  }

  // Default to metric for all other countries
  return 'metric';
}

/**
 * Get all countries grouped by measurement system
 * @returns {Object} - Object with 'us', 'uk', 'metric' arrays of country codes
 */
export function getCountriesByMeasurementSystem() {
  return {
    us: US_MEASUREMENT_COUNTRIES,
    uk: UK_MEASUREMENT_COUNTRIES,
    metric: 'all-others', // All other countries use metric
  };
}

/**
 * Get country name from code (simplified mapping)
 */
const COUNTRY_NAMES = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  IE: 'Ireland',
  MT: 'Malta',
  CY: 'Cyprus',
  PR: 'Puerto Rico',
  GU: 'Guam',
  AS: 'American Samoa',
  VI: 'US Virgin Islands',
  UM: 'US Minor Outlying Islands',
  MH: 'Marshall Islands',
  FM: 'Micronesia',
  PW: 'Palau',
  LR: 'Liberia',
  MM: 'Myanmar',
};

export function getCountryName(countryCode) {
  return COUNTRY_NAMES[countryCode?.toUpperCase()] || countryCode || 'Unknown';
}

/**
 * Get flag emoji for country (simplified - using common flags)
 */
const COUNTRY_FLAGS = {
  US: '🇺🇸',
  GB: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
  NZ: '🇳🇿',
  IE: '🇮🇪',
  MT: '🇲🇹',
  CY: '🇨🇾',
  PR: '🇵🇷',
  GU: '🇬🇺',
  AS: '🇦🇸',
  VI: '🇻🇮',
  UM: '🇺🇲',
  MH: '🇲🇭',
  FM: '🇫🇲',
  PW: '🇵🇼',
  LR: '🇱🇷',
  MM: '🇲🇲',
};

export function getCountryFlag(countryCode) {
  return COUNTRY_FLAGS[countryCode?.toUpperCase()] || '🌍';
}
