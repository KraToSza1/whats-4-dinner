/**
 * Robust Search Retry Utility
 * Ensures searches never completely fail by implementing:
 * - Automatic retries with exponential backoff
 * - Fallback to simpler queries
 * - Graceful degradation
 * - Circuit breaker pattern
 */

// Circuit breaker state
let circuitBreakerState = {
  failures: 0,
  lastFailureTime: null,
  isOpen: false,
  halfOpenAttempts: 0,
};

const CIRCUIT_BREAKER_THRESHOLD = 5; // Open after 5 failures
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds before trying again
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 500; // 500ms

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if circuit breaker should allow request
 */
function canMakeRequest() {
  const now = Date.now();
  
  if (!circuitBreakerState.isOpen) {
    return true; // Circuit is closed, allow requests
  }
  
  // Check if enough time has passed to try again (half-open state)
  if (circuitBreakerState.lastFailureTime && 
      now - circuitBreakerState.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
    circuitBreakerState.isOpen = false;
    circuitBreakerState.halfOpenAttempts = 0;
    return true;
  }
  
  return false; // Circuit is open, block requests
}

/**
 * Record a successful request
 */
function recordSuccess() {
  circuitBreakerState.failures = 0;
  circuitBreakerState.isOpen = false;
  circuitBreakerState.halfOpenAttempts = 0;
}

/**
 * Record a failed request
 */
function recordFailure() {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    if (import.meta.env.DEV) {
      console.warn('🔴 [CIRCUIT BREAKER] Circuit opened due to failures:', circuitBreakerState.failures);
    }
  }
}

/**
 * Create a simplified query for fallback
 */
function createFallbackQuery(originalQuery) {
  return {
    ...originalQuery,
    // Remove complex filters that might cause issues
    includeIngredients: [],
    maxCalories: '',
    healthScore: '',
    minProtein: '',
    maxCarbs: '',
    intolerances: '',
    // Keep only essential filters
    query: originalQuery.query || '',
    diet: originalQuery.diet || '',
    mealType: originalQuery.mealType || '',
    maxTime: originalQuery.maxTime || '',
    cuisine: originalQuery.cuisine || '',
    difficulty: originalQuery.difficulty || '',
    limit: originalQuery.limit || 24,
    offset: originalQuery.offset || 0,
    isAdmin: originalQuery.isAdmin || false,
  };
}

/**
 * Create ultra-simple query (last resort fallback)
 */
function createUltraSimpleQuery(originalQuery) {
  return {
    query: '',
    includeIngredients: [],
    diet: '',
    mealType: '',
    maxTime: '',
    cuisine: '',
    difficulty: '',
    maxCalories: '',
    healthScore: '',
    minProtein: '',
    maxCarbs: '',
    intolerances: '',
    limit: originalQuery.limit || 24,
    offset: originalQuery.offset || 0,
    isAdmin: originalQuery.isAdmin || false,
  };
}

/**
 * Robust search with retry and fallback logic
 * NEVER throws - always returns a result (even if empty)
 */
export async function robustSearch(searchFunction, query, options = {}) {
  const { maxRetries = MAX_RETRIES, enableFallback = true } = options;
  const searchId = `robust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check circuit breaker
  if (!canMakeRequest()) {
    if (import.meta.env.DEV) {
      console.warn('🔴 [ROBUST SEARCH] Circuit breaker is open, using fallback');
    }
    // Try ultra-simple query as last resort
    if (enableFallback) {
      const fallbackQuery = createUltraSimpleQuery(query);
      try {
        const result = await searchFunction(fallbackQuery);
        if (result && (result.data?.length > 0 || result.length > 0)) {
          recordSuccess();
          return result;
        }
      } catch (_e) {
        // Ignore fallback errors
      }
    }
    // Return empty result instead of failing
    return { data: [], totalCount: 0 };
  }
  
  let lastError = null;
  let attempt = 0;
  
  // Try original query with retries
  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        if (import.meta.env.DEV) {
          console.warn(`🔄 [ROBUST SEARCH] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        }
        await sleep(delay);
      }
      
      const result = await searchFunction(query);
      
      // Validate result
      if (result && (result.data?.length > 0 || (Array.isArray(result) && result.length > 0))) {
        recordSuccess();
        if (import.meta.env.DEV && attempt > 0) {
          console.warn(`✅ [ROBUST SEARCH] Success on attempt ${attempt + 1}`);
        }
        return result;
      }
      
      // Empty result is still success (no error, just no data)
      recordSuccess();
      return result || { data: [], totalCount: 0 };
      
    } catch (error) {
      lastError = error;
      attempt++;
      
      if (import.meta.env.DEV) {
        console.warn(`❌ [ROBUST SEARCH] Attempt ${attempt} failed:`, error.message);
      }
      
      // If this was the last retry, try fallback
      if (attempt > maxRetries) {
        break;
      }
    }
  }
  
  // All retries failed - try fallback queries
  if (enableFallback) {
    if (import.meta.env.DEV) {
      console.warn('🔄 [ROBUST SEARCH] All retries failed, trying fallback queries');
    }
    
    // Try simplified query (remove complex filters)
    try {
      const fallbackQuery = createFallbackQuery(query);
      const result = await searchFunction(fallbackQuery);
      
      if (result && (result.data?.length > 0 || (Array.isArray(result) && result.length > 0))) {
        recordSuccess();
        if (import.meta.env.DEV) {
          console.warn('✅ [ROBUST SEARCH] Fallback query succeeded');
        }
        return result;
      }
    } catch (fallbackError) {
      if (import.meta.env.DEV) {
        console.warn('❌ [ROBUST SEARCH] Fallback query failed:', fallbackError.message);
      }
    }
    
    // Last resort: ultra-simple query (no filters)
    try {
      const ultraSimpleQuery = createUltraSimpleQuery(query);
      const result = await searchFunction(ultraSimpleQuery);
      
      if (result && (result.data?.length > 0 || (Array.isArray(result) && result.length > 0))) {
        recordSuccess();
        if (import.meta.env.DEV) {
          console.warn('✅ [ROBUST SEARCH] Ultra-simple query succeeded');
        }
        return result;
      }
    } catch (ultraError) {
      if (import.meta.env.DEV) {
        console.warn('❌ [ROBUST SEARCH] Ultra-simple query failed:', ultraError.message);
      }
    }
  }
  
  // Record failure for circuit breaker
  recordFailure();
  
  // NEVER throw - always return empty result
  if (import.meta.env.DEV) {
    console.warn('⚠️ [ROBUST SEARCH] All attempts failed, returning empty result');
  }
  
  return { data: [], totalCount: 0 };
}

/**
 * Reset circuit breaker (useful for testing or manual recovery)
 */
export function resetCircuitBreaker() {
  circuitBreakerState = {
    failures: 0,
    lastFailureTime: null,
    isOpen: false,
    halfOpenAttempts: 0,
  };
  if (import.meta.env.DEV) {
    console.warn('🟢 [CIRCUIT BREAKER] Reset');
  }
}

