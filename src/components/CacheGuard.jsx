import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { clearClientCaches } from '../utils/cache.js';
import { useAuth } from '../context/AuthContext';

/**
 * Lightweight watcher that checks admin cache bust flag and user-specific
 * cache bust flags, clearing client-side caches when either changes.
 * This keeps users from serving stale data after an admin-triggered flush.
 */
export default function CacheGuard() {
  const { user } = useAuth();
  
  useEffect(() => {
    let isMounted = true;
    const STORAGE_KEY = 'admin:cacheBustVersion';
    const USER_STORAGE_KEY = 'user:cacheBustVersion';

    const fetchAndMaybeFlush = async () => {
      try {
        let shouldFlush = false;
        let flushReason = '';

        // Check global cache bust flag (gracefully handle missing table)
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'app_settings')
            .single();

          // Ignore 404 errors (table doesn't exist yet) - this is expected
          if (!adminError || adminError.code === 'PGRST116') {
            if (adminData?.value) {
              const remoteVersion = adminData.value.cacheBustVersion || 0;
              const localVersion = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

              if (Number.isFinite(remoteVersion) && remoteVersion > localVersion) {
                shouldFlush = true;
                flushReason = 'global-cache-bust';
                if (isMounted) {
                  localStorage.setItem(STORAGE_KEY, String(remoteVersion));
                }
              } else if (!localStorage.getItem(STORAGE_KEY)) {
                localStorage.setItem(STORAGE_KEY, String(remoteVersion));
              }
            }
          }
          // Silently ignore 404 errors - table might not exist yet
        } catch (e) {
          // Table doesn't exist or other error - silently continue
          if (import.meta?.env?.DEV) {
            console.warn('[CacheGuard] admin_settings table not available:', e.message);
          }
        }

        // Check user-specific cache bust flag (if user is logged in)
        if (user?.id) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('cache_bust_version')
              .eq('id', user.id)
              .single();

            // Handle missing column gracefully (400 error means column doesn't exist)
            if (profileError) {
              if (profileError.code === '42703' || profileError.message?.includes('cache_bust_version')) {
                // Column doesn't exist yet - this is fine, just skip user-specific cache bust
                if (import.meta?.env?.DEV) {
                  console.warn('[CacheGuard] cache_bust_version column not found in profiles table. Run migration: Database/ADD_CACHE_BUST_VERSION_TO_PROFILES.sql');
                }
              } else if (profileError.code !== 'PGRST116') {
                // Other error - log but continue
                if (import.meta?.env?.DEV) {
                  console.warn('[CacheGuard] Error reading user cache_bust_version:', profileError.message);
                }
              }
            } else if (profileData?.cache_bust_version !== undefined) {
              const userRemoteVersion = profileData.cache_bust_version || 0;
              const userLocalVersion = parseInt(localStorage.getItem(USER_STORAGE_KEY) || '0', 10);

              if (Number.isFinite(userRemoteVersion) && userRemoteVersion > userLocalVersion) {
                shouldFlush = true;
                flushReason = 'user-cache-bust';
                if (isMounted) {
                  localStorage.setItem(USER_STORAGE_KEY, String(userRemoteVersion));
                }
              } else if (!localStorage.getItem(USER_STORAGE_KEY)) {
                localStorage.setItem(USER_STORAGE_KEY, String(userRemoteVersion));
              }
            }
          } catch (profileErr) {
            // User-specific check failed, but continue with global check
            if (import.meta?.env?.DEV) {
              console.warn('[CacheGuard] Unable to read user cache_bust_version:', profileErr.message);
            }
          }
        }

        // Flush cache if needed
        if (shouldFlush) {
          const summary = await clearClientCaches({
            reason: flushReason,
            preserveKeys: ['theme', 'language', 'sb-'],
          });

          if (import.meta?.env?.DEV) {
            console.warn('[CacheGuard] Cache bust applied', { flushReason, summary });
          }
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
  }, [user?.id]);

  // No UI
  return null;
}

