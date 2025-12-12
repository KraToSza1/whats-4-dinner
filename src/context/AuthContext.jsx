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
      // URGENT: Log initial auth check
      console.log('🔐 [AUTH INIT] Checking initial user state...');
      const { data, error } = await supabase.auth.getUser();
      
      // URGENT: Log all auth errors, not just non-expected ones
      if (error) {
        console.error('🔐 [AUTH INIT] getUser error:', {
          name: error.name,
          message: error.message,
          status: error.status,
          isSessionMissing: error.name === 'AuthSessionMissingError',
        });
      }
      
      // Check session separately
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 [AUTH INIT] Session check:', {
        hasSession: !!session,
        hasUser: !!data?.user,
        userEmail: data?.user?.email || session?.user?.email || 'NO_USER',
        sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'NO_EXPIRY',
        sessionError: sessionError?.message || 'NO_ERROR',
      });
      
      if (mounted) {
        setUser(data?.user || null);
      }
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // URGENT: EXTENSIVE LOGGING FOR ADMIN LOGOUT ISSUE
      const timestamp = new Date().toISOString();
      const userEmail = session?.user?.email || 'NO_USER';
      const userId = session?.user?.id || 'NO_ID';
      const isAdmin = userEmail === 'Raymondvdw@gmail.com' || userEmail === 'Elanridp@gmail.com';
      
      console.log('🔐🔐🔐 [AUTH STATE CHANGE] ============================================');
      console.log('🔐 [AUTH STATE CHANGE] Event:', event);
      console.log('🔐 [AUTH STATE CHANGE] Timestamp:', timestamp);
      console.log('🔐 [AUTH STATE CHANGE] User Email:', userEmail);
      console.log('🔐 [AUTH STATE CHANGE] User ID:', userId);
      console.log('🔐 [AUTH STATE CHANGE] Is Admin:', isAdmin);
      console.log('🔐 [AUTH STATE CHANGE] Has Session:', !!session);
      console.log('🔐 [AUTH STATE CHANGE] Session Expires At:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'NO_EXPIRY');
      console.log('🔐 [AUTH STATE CHANGE] Session Expires In:', session?.expires_at ? `${Math.round((session.expires_at * 1000 - Date.now()) / 1000 / 60)} minutes` : 'NO_EXPIRY');
      console.log('🔐 [AUTH STATE CHANGE] Access Token Present:', !!session?.access_token);
      console.log('🔐 [AUTH STATE CHANGE] Refresh Token Present:', !!session?.refresh_token);
      console.log('🔐 [AUTH STATE CHANGE] User Agent:', navigator.userAgent);
      console.log('🔐 [AUTH STATE CHANGE] Current URL:', window.location.href);
      console.log('🔐 [AUTH STATE CHANGE] LocalStorage Keys:', Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('supabase')));
      
      // Check for localStorage clearing
      try {
        const supabaseAuthKey = Object.keys(localStorage).find(k => k.includes('supabase.auth'));
        if (supabaseAuthKey) {
          const authData = localStorage.getItem(supabaseAuthKey);
          console.log('🔐 [AUTH STATE CHANGE] Supabase Auth Data Present:', !!authData);
          console.log('🔐 [AUTH STATE CHANGE] Auth Data Length:', authData?.length || 0);
        } else {
          console.warn('⚠️ [AUTH STATE CHANGE] NO SUPABASE AUTH KEY FOUND IN LOCALSTORAGE!');
        }
      } catch (e) {
        console.error('❌ [AUTH STATE CHANGE] Error checking localStorage:', e);
      }
      
      // CRITICAL: Log SIGNED_OUT events in detail
      if (event === 'SIGNED_OUT') {
        console.error('🚨🚨🚨 [AUTH STATE CHANGE] SIGNED_OUT EVENT DETECTED! 🚨🚨🚨');
        console.error('🚨 [AUTH STATE CHANGE] User was signed out:', userEmail);
        console.error('🚨 [AUTH STATE CHANGE] Was Admin:', isAdmin);
        console.error('🚨 [AUTH STATE CHANGE] Session before signout:', session);
        console.error('🚨 [AUTH STATE CHANGE] Stack trace:', new Error().stack);
        
        // Check if session was cleared
        setTimeout(async () => {
          const { data: { session: checkSession } } = await supabase.auth.getSession();
          console.error('🚨 [AUTH STATE CHANGE] Session check after SIGNED_OUT:', {
            hasSession: !!checkSession,
            hasUser: !!checkSession?.user,
            userEmail: checkSession?.user?.email || 'NO_USER',
          });
        }, 1000);
      }
      
      // CRITICAL: Log TOKEN_REFRESHED events
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 [AUTH STATE CHANGE] Token refreshed successfully');
        console.log('🔄 [AUTH STATE CHANGE] New expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'NO_EXPIRY');
      }
      
      // CRITICAL: Log any errors during token refresh
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.error('❌ [AUTH STATE CHANGE] TOKEN_REFRESHED but NO SESSION! This will cause logout!');
      }
      
      console.log('🔐🔐🔐 [AUTH STATE CHANGE] ============================================');
      
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
    // URGENT: Periodic session check to detect unexpected logouts
    let currentUserRef = user; // Capture current user value
    const sessionCheckInterval = setInterval(async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        // Update ref to latest user value
        currentUserRef = currentUser;
        
        const userEmail = currentUser?.email || 'NO_USER';
        const isAdmin = userEmail === 'Raymondvdw@gmail.com' || userEmail === 'Elanridp@gmail.com';
        
        // Only log for admins to reduce noise
        if (isAdmin) {
          if (!currentSession && currentUserRef) {
            console.error('🚨🚨🚨 [AUTH MONITOR] Admin session lost! User was logged in but session is gone!');
            console.error('🚨 [AUTH MONITOR] Previous user:', currentUserRef?.email);
            console.error('🚨 [AUTH MONITOR] Current session:', currentSession);
            console.error('🚨 [AUTH MONITOR] Session error:', sessionError);
            console.error('🚨 [AUTH MONITOR] User error:', userError);
          } else if (currentSession && !currentUserRef) {
            console.warn('⚠️ [AUTH MONITOR] Session exists but user state is null - possible state desync');
          } else if (currentSession && currentUserRef && currentSession.user.id !== currentUserRef.id) {
            console.error('🚨🚨🚨 [AUTH MONITOR] User ID mismatch! Session user:', currentSession.user.id, 'State user:', currentUserRef.id);
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ [AUTH MONITOR] Error checking session:', error);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      sub.subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
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
