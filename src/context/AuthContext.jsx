import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Handle OAuth callback - check if we have tokens in URL hash
    const handleOAuthCallback = async () => {
      // Check both hash and search params (Supabase uses hash for OAuth)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDescription =
        hashParams.get('error_description') || searchParams.get('error_description');

      // If we have an error, log it but don't redirect
      if (error) {
        console.error('🔐 [AUTH] OAuth error:', error, errorDescription);
        // Clear the error from URL
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      // If we have tokens in hash, Supabase will handle it automatically via onAuthStateChange
      if (accessToken) {
        // Clear hash/search after a short delay to let Supabase process it
        // The onAuthStateChange handler will update the user state
        setTimeout(() => {
          if (window.location.hash || window.location.search) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState(null, '', cleanUrl);
          }
        }, 1000);
      }
    };

    handleOAuthCallback();

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('🔐 [AUTH] getUser error:', error);
      }
      if (mounted) {
        setUser(data?.user || null);
      }
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      // Start free trial on signup
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { startTrial } = await import('../utils/trial.js');
          await startTrial(session.user.id);
          if (import.meta.env.DEV) {
            console.log('✅ [AUTH] Free trial started for user:', session.user.id);
          }
        } catch (error) {
          console.error('❌ [AUTH] Error starting trial:', error);
        }
      }

      // Sync subscription plan when auth state changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        import('../utils/subscription.js').then(subscriptionUtils => {
          // Clear cache to force refresh from Supabase
          subscriptionUtils.clearPlanCache();
          subscriptionUtils.getCurrentPlan().then(plan => {
            // Dispatch event to notify app of plan change
            window.dispatchEvent(new CustomEvent('subscriptionPlanChanged', { detail: { plan } }));
          });
        });
      }

      // Clear hash/search after successful auth
      if (event === 'SIGNED_IN') {
        if (window.location.hash || window.location.search) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export async function signInWithEmail(email) {
  // Build redirect URL for email magic links
  // Use window.location.origin to automatically get the correct port and protocol
  const redirectTo = window.location.origin;
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) {
    console.error('🔐 [AUTH] signInWithEmail error:', error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('🔐 [AUTH] signOut error:', error);
    throw error;
  }
}
