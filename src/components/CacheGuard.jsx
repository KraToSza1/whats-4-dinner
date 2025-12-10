import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { clearClientCaches } from '../utils/cache.js';

/**
 * Lightweight watcher that checks admin cache bust flag and clears
 * client-side caches when the flag changes. This keeps users from
 * serving stale data after an admin-triggered flush.
 */
export default function CacheGuard() {
  useEffect(() => {
    let isMounted = true;
    const STORAGE_KEY = 'admin:cacheBustVersion';

    const fetchAndMaybeFlush = async () => {
      try {
        // Read the admin settings row that stores cache controls
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'app_settings')
          .single();

        if (error) {
          // Table may not exist yet; fail softly
          if (import.meta?.env?.DEV) {
            console.warn('[CacheGuard] Unable to read admin_settings:', error.message);
          }
          return;
        }

        const remoteVersion = data?.value?.cacheBustVersion || 0;
        const localVersion = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

        if (Number.isFinite(remoteVersion) && remoteVersion > localVersion) {
          const summary = await clearClientCaches({
            reason: 'cache-bust',
            preserveKeys: ['theme', 'language', 'sb-'],
          });

          if (import.meta?.env?.DEV) {
            console.warn('[CacheGuard] Cache bust applied', { remoteVersion, summary });
          }

          if (isMounted) {
            localStorage.setItem(STORAGE_KEY, String(remoteVersion));
          }
        } else if (!localStorage.getItem(STORAGE_KEY)) {
          // Seed local version to avoid repeated work
          localStorage.setItem(STORAGE_KEY, String(remoteVersion));
        }
      } catch (e) {
        if (import.meta?.env?.DEV) {
          console.error('[CacheGuard] Unexpected error', e);
        }
      }
    };

    // Initial check and periodic polling (every 5 minutes)
    fetchAndMaybeFlush();
    const interval = setInterval(fetchAndMaybeFlush, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // No UI
  return null;
}

