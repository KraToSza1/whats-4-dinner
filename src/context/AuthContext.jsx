import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('🔐 [AUTH CONTEXT] =========================================');
    console.log('🔐 [AUTH CONTEXT] 🚀 AuthProvider initializing...');
    console.log('🔐 [AUTH CONTEXT] Current URL:', {
      full: window.location.href,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
    });

    // Handle OAuth callback - check if we have tokens in URL hash
    const handleOAuthCallback = async () => {
      console.log('🔐 [AUTH CONTEXT] =========================================');
      console.log('🔐 [AUTH CONTEXT] 🔍 Checking for OAuth callback...');
      console.log('🔐 [AUTH CONTEXT] Hash:', window.location.hash);

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      console.log('🔐 [AUTH CONTEXT] Hash params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasError: !!error,
        error,
        errorDescription,
        hostname: window.location.hostname,
      });

      // If we're on wrong domain but have tokens, redirect to localhost
      if (
        accessToken &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        const port = '5173'; // Always use port 5173 for localhost
        const redirectUrl = `http://localhost:${port}${window.location.pathname}${window.location.hash}`;
        console.log('🔐 [AUTH CONTEXT] ⚠️ WRONG DOMAIN DETECTED!');
        console.log('🔐 [AUTH CONTEXT] Current hostname:', window.location.hostname);
        console.log('🔐 [AUTH CONTEXT] Current URL:', window.location.href);
        console.log(
          '🔐 [AUTH CONTEXT] Hash with tokens:',
          window.location.hash.substring(0, 100) + '...'
        );
        console.log('🔐 [AUTH CONTEXT] Redirecting to localhost:', redirectUrl);
        console.log(
          '[Supabase][AuthContext] Redirecting OAuth callback to localhost:',
          redirectUrl
        );
        // Use replace to avoid back button issues
        window.location.replace(redirectUrl);
        return;
      }

      // If we have tokens in hash, Supabase will handle it automatically
      if (accessToken) {
        console.log('🔐 [AUTH CONTEXT] ✅ OAuth tokens detected in hash!');
        console.log('🔐 [AUTH CONTEXT] Access token length:', accessToken.length);
        console.log('🔐 [AUTH CONTEXT] Refresh token:', refreshToken ? 'present' : 'missing');
        console.debug('[Supabase][AuthContext] OAuth callback detected, processing...');
      }

      if (error) {
        console.error('🔐 [AUTH CONTEXT] ❌ OAuth error in hash:', error);
        console.error('🔐 [AUTH CONTEXT] Error description:', errorDescription);
        console.error('[Supabase][AuthContext] OAuth error:', error);
      }

      console.log('🔐 [AUTH CONTEXT] =========================================');
    };

    handleOAuthCallback();

    (async () => {
      console.log('🔐 [AUTH CONTEXT] =========================================');
      console.log('🔐 [AUTH CONTEXT] 👤 Getting user session...');
      console.debug('[Supabase][AuthContext] getUser:start');
      const { data, error } = await supabase.auth.getUser();
      console.log('🔐 [AUTH CONTEXT] getUser response:', {
        hasUser: !!data?.user,
        userId: data?.user?.id,
        email: data?.user?.email,
        error: error?.message,
      });
      if (error) {
        console.error('🔐 [AUTH CONTEXT] ❌ getUser error:', error);
        console.error('[Supabase][AuthContext] getUser:error', error);
      }
      if (mounted) {
        setUser(data?.user || null);
        console.log(
          '🔐 [AUTH CONTEXT] User state set:',
          data?.user ? '✅ Logged in' : '❌ Not logged in'
        );
      }
      setLoading(false);
      console.log('🔐 [AUTH CONTEXT] =========================================');
      console.debug('[Supabase][AuthContext] getUser:complete', {
        hasUser: !!data?.user,
      });
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [AUTH CONTEXT] =========================================');
      console.log('🔐 [AUTH CONTEXT] 🔄 Auth state changed!');
      console.log('🔐 [AUTH CONTEXT] Event:', event);
      console.log('🔐 [AUTH CONTEXT] Session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        accessToken: session?.access_token ? 'present' : 'missing',
        refreshToken: session?.refresh_token ? 'present' : 'missing',
      });
      console.debug('[Supabase][AuthContext] onAuthStateChange', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
      });

      setUser(session?.user || null);
      console.log(
        '🔐 [AUTH CONTEXT] User state updated:',
        session?.user ? '✅ Logged in' : '❌ Not logged in'
      );

      // Clear hash after successful auth
      if (event === 'SIGNED_IN' && window.location.hash) {
        console.log('🔐 [AUTH CONTEXT] ✅ Signed in! Clearing hash...');
        console.log('🔐 [AUTH CONTEXT] Hash before clear:', window.location.hash);
        window.history.replaceState(null, '', window.location.pathname);
        console.log('🔐 [AUTH CONTEXT] Hash after clear:', window.location.hash);
      }
      console.log('🔐 [AUTH CONTEXT] =========================================');
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
  console.log('🔐 [AUTH CONTEXT] =========================================');
  console.log('🔐 [AUTH CONTEXT] 📧 signInWithEmail called');
  console.log('🔐 [AUTH CONTEXT] Email:', email);
  console.debug('[Supabase][AuthContext] signInWithEmail:start', { email });
  // Force localhost for local development
  // In production, use the actual current origin (Vercel URL)
  const redirectTo =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:${window.location.port || '5173'}`
      : window.location.origin; // This will be the actual Vercel URL in production
  console.log('🔐 [AUTH CONTEXT] Redirect URL:', redirectTo);
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  console.log('🔐 [AUTH CONTEXT] signInWithOtp response:', { data, error });
  if (error) {
    console.error('🔐 [AUTH CONTEXT] ❌ signInWithEmail error:', error);
    console.error('[Supabase][AuthContext] signInWithEmail:error', error);
    throw error;
  }
  console.log('🔐 [AUTH CONTEXT] ✅ Magic link sent successfully!');
  console.log('🔐 [AUTH CONTEXT] =========================================');
  console.debug('[Supabase][AuthContext] signInWithEmail:complete');
}

export async function signOut() {
  console.debug('[Supabase][AuthContext] signOut:start');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Supabase][AuthContext] signOut:error', error);
    throw error;
  }
  console.debug('[Supabase][AuthContext] signOut:complete');
}
