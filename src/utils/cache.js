// Utility helpers for clearing client-side caches safely
// Keeps Supabase auth/session keys intact so users stay signed in.

export async function clearClientCaches({ reason = 'manual', preserveKeys = [] } = {}) {
  const summary = {
    localStorageCleared: 0,
    sessionStorageCleared: 0,
    cachesCleared: 0,
    reason,
    errors: [],
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        const lowerKey = key.toLowerCase();
        const shouldPreserve =
          lowerKey.startsWith('sb-') || // Supabase session tokens
          lowerKey.includes('supabase') ||
          preserveKeys.some(k => lowerKey.includes(k.toLowerCase()));

        if (!shouldPreserve) {
          localStorage.removeItem(key);
          summary.localStorageCleared += 1;
        }
      });
    }
  } catch (error) {
    summary.errors.push(`localStorage: ${error.message}`);
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        sessionStorage.removeItem(key);
        summary.sessionStorageCleared += 1;
      });
    }
  } catch (error) {
    summary.errors.push(`sessionStorage: ${error.message}`);
  }

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheKeys = await caches.keys();
      for (const cacheKey of cacheKeys) {
        await caches.delete(cacheKey);
        summary.cachesCleared += 1;
      }
    }
  } catch (error) {
    summary.errors.push(`caches: ${error.message}`);
  }

  return summary;
}

