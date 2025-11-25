// src/api/spoonacular.js
import { SPOONACULAR, FEATURES } from '../config';

const SPOON_DISABLED = FEATURES.disableSpoonacular;

// Force mock mode for testing (set in localStorage: "forceMockMode" = "true")
const FORCE_MOCK_MODE =
  SPOON_DISABLED ||
  (typeof window !== 'undefined' && localStorage.getItem('forceMockMode') === 'true');

function buildSpoonUrl(path, params = {}) {
  const u = new URL(path, SPOONACULAR.base);
  Object.entries({ ...params, apiKey: SPOONACULAR.key }).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) u.searchParams.set(k, v);
  });
  return u.toString();
}

// Choose API base: prefer serverless proxy in production or when explicitly set
const PROXY_BASE = import.meta.env.VITE_API_BASE || '/api'; // same-origin functions
const USE_PROXY = !!import.meta.env.PROD || !!import.meta.env.VITE_USE_PROXY;

// Simple localStorage cache with TTL
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
function cacheKey(url) {
  return `apiCache:${url}`;
}
function getCached(url) {
  try {
    const raw = localStorage.getItem(cacheKey(url));
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}
function setCached(url, data) {
  try {
    localStorage.setItem(cacheKey(url), JSON.stringify({ t: Date.now(), data }));
  } catch {}
}

async function _fetch(url) {
  // Try cache first
  const cached = getCached(url);
  if (cached) return cached;

  const res = await fetch(url);
  const bodyText = await res.text();
  let data = null;
  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    const msg =
      res.status === 401
        ? 'Invalid API key. Check VITE_SPOONACULAR_KEY.'
        : res.status === 402
          ? 'API quota reached.'
          : res.status === 404
            ? 'Not found.'
            : res.status === 429
              ? 'Too many requests. Slow down.'
              : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = bodyText;
    throw err;
  }
  setCached(url, data);
  return data;
}

export async function searchRecipes({
  query = '',
  includeIngredients = [],
  diet = '',
  intolerances = '',
  type = '', // meal type: breakfast, lunch, dinner, etc.
  number = FEATURES.resultsPerPage,
  maxReadyTime, // minutes (optional)
}) {
  const params = {
    query,
    ...(includeIngredients && Array.isArray(includeIngredients) && includeIngredients.length > 0
      ? { includeIngredients: includeIngredients.join(',') }
      : includeIngredients && typeof includeIngredients === 'string'
        ? { includeIngredients }
        : {}),
    ...(diet ? { diet } : {}),
    ...(intolerances ? { intolerances } : {}),
    ...(type ? { type } : {}),
    addRecipeInformation: true,
    instructionsRequired: true,
    number,
    ...(maxReadyTime ? { maxReadyTime } : {}),
  };

  if (SPOON_DISABLED) {
    const mock = await import('../assets/mockResults.json');
    return mock.default;
  }

  // If using proxy (recommended for prod), call our serverless endpoint
  if (USE_PROXY) {
    try {
      const u = new URL(`${PROXY_BASE}/spoonacular/search`, window.location.origin);
      Object.entries({
        q: query,
        includeIngredients: includeIngredients.join(','),
        diet,
        intolerances,
        type,
        number,
        ...(maxReadyTime ? { maxReadyTime } : {}),
      }).forEach(([k, v]) => v !== undefined && v !== '' && u.searchParams.set(k, v));
      const res = await fetch(u.toString());
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) {
        throw new Error(`Proxy error ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      // If proxy returns quota error, use mock immediately
      if (e.status === 402 || e.status === 429) {
        console.warn('[searchRecipes] API quota reached via proxy, using mock data', e.message);
        const mock = await import('../assets/mockResults.json');
        return mock.default;
      }
      console.warn('[searchRecipes] proxy unavailable in dev, falling back', e);
      // fall through to non-proxy paths below
    }
  }

  // Otherwise, if no key configured or force mock mode, go straight to mock
  if (!SPOONACULAR.key || FORCE_MOCK_MODE) {
    if (FORCE_MOCK_MODE) {
      console.log('[searchRecipes] Using mock data (forceMockMode enabled)');
    }
    const mock = await import('../assets/mockResults.json');
    return mock.default;
  }

  const url = buildSpoonUrl('/recipes/complexSearch', params);

  try {
    const data = await _fetch(url);
    return data;
  } catch (e) {
    // If quota reached or any error, use mock data
    if (e.status === 402 || e.status === 429 || e.status === 401) {
      console.warn('[searchRecipes] API quota reached or error, using mock data', e.message);
      const mock = await import('../assets/mockResults.json');
      return mock.default;
    }
    // For other errors, still try mock as fallback
    console.warn('[searchRecipes] falling back to mockResults.json', e.message);
    const mock = await import('../assets/mockResults.json');
    return mock.default;
  }
}

export async function getRecipeInformation(id) {
  if (SPOON_DISABLED) {
    console.warn('[getRecipeInformation] Spoonacular disabled via feature flag. Returning null.');
    return null;
  }

  // If using proxy (recommended for prod), call our serverless endpoint
  if (USE_PROXY) {
    try {
      const u = new URL(`${PROXY_BASE}/spoonacular/info`, window.location.origin);
      u.searchParams.set('id', String(id));
      const res = await fetch(u.toString());
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) {
        throw new Error(`Proxy error ${res.status}`);
      }
      const recipe = await res.json();
      // Cache individual recipe for offline access
      try {
        localStorage.setItem(`recipe_cache_${id}`, JSON.stringify(recipe));
      } catch (err) {
        console.warn('[OfflineCache] Failed to cache recipe', err);
      }
      return recipe;
    } catch (e) {
      // Try offline cache first before falling back
      try {
        const cached = localStorage.getItem(`recipe_cache_${id}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}

      console.warn('[getRecipeInformation] proxy unavailable in dev, falling back', e);
      // fall through to direct mode below
    }
  }

  // Direct API mode: try with nutrition first; if auth/quota blocks, retry without
  const withNutri = buildSpoonUrl(`/recipes/${id}/information`, { includeNutrition: true });
  try {
    const recipe = await _fetch(withNutri);
    // Cache for offline access
    try {
      localStorage.setItem(`recipe_cache_${id}`, JSON.stringify(recipe));
    } catch (err) {
      console.warn('[OfflineCache] Failed to cache recipe', err);
    }
    return recipe;
  } catch (e) {
    // If quota reached, try cached first
    if (e.status === 402 || e.status === 429) {
      console.warn('[getRecipeInformation] API quota reached, checking cache', e.message);
      const cached = localStorage.getItem(`recipe_cache_${id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      // If no cache, return null (will show error on page)
      return null;
    }

    if (e.status === 401 || e.status === 402) {
      // Try without nutrition if blocked
      try {
        const withoutNutri = buildSpoonUrl(`/recipes/${id}/information`, {
          includeNutrition: false,
        });
        const recipe = await _fetch(withoutNutri);
        // Cache for offline access
        try {
          localStorage.setItem(`recipe_cache_${id}`, JSON.stringify(recipe));
        } catch (err) {
          console.warn('[OfflineCache] Failed to cache recipe', err);
        }
        return recipe;
      } catch (e2) {
        // If still fails, try cache
        const cached = localStorage.getItem(`recipe_cache_${id}`);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {}
        }
        return null;
      }
    }
    throw e;
  }
}
