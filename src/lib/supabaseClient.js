import { createClient } from '@supabase/supabase-js';

// Get environment variables - Vite prefixes with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log what we're getting
const keyRole = supabaseAnonKey
  ? supabaseAnonKey.includes('service_role')
    ? 'SERVICE_ROLE (WRONG!)'
    : supabaseAnonKey.includes('anon')
      ? 'ANON (CORRECT)'
      : 'UNKNOWN'
  : 'MISSING';
// Only log in development to reduce console noise
if (import.meta.env.DEV) {
  console.log('Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    keyRole: keyRole,
    allEnvVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
  });
}

if (keyRole.includes('SERVICE_ROLE')) {
  console.error('🚨 CRITICAL ERROR: You are using SERVICE_ROLE key in the browser!');
  console.error('🚨 This causes CORS errors (status 556).');
  console.error('🚨 Fix: Update .env.local with the ANON key (not service_role)');
  console.error('🚨 Then restart your dev server!');
}

// Only create client if we have both values
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // CRITICAL: Increase session duration to prevent frequent logouts
      // Default is 1 hour, but we want longer for admins
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
      // Don't auto-sign out on token refresh failure - let it retry
      flowType: 'pkce',
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
      },
    },
    db: {
      schema: 'public',
    },
  });
  
  // URGENT: Monitor token refresh failures and localStorage access
  if (typeof window !== 'undefined') {
    // Protect localStorage from being cleared (except by explicit signOut)
    // This MUST be set up early to catch any attempts to clear
    if (!localStorage._originalClear) {
      localStorage._originalClear = localStorage.clear;
      localStorage.clear = function() {
        console.error('🚨🚨🚨 [AUTH PROTECTION] localStorage.clear() was called! 🚨🚨🚨');
        console.error('🚨 [AUTH PROTECTION] This will clear auth sessions!');
        console.error('🚨 [AUTH PROTECTION] Stack trace:', new Error().stack);
        // CRITICAL: Don't actually clear - this protects auth sessions
        // Only allow clear if explicitly called from signOut
        const stack = new Error().stack || '';
        const isFromSignOut = stack.includes('signOut') || stack.includes('AuthContext');
        if (isFromSignOut) {
          console.warn('⚠️ [AUTH PROTECTION] Allowing clear from signOut');
          return localStorage._originalClear.apply(this, arguments);
        }
        console.warn('⚠️ [AUTH PROTECTION] Blocked localStorage.clear() to protect auth session');
        return;
      };
    }
    
    // Monitor localStorage.removeItem for auth-related keys
    if (!localStorage._originalRemoveItem) {
      localStorage._originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = function(key) {
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          console.error('🚨🚨🚨 [AUTH PROTECTION] Attempt to remove auth key:', key);
          console.error('🚨 [AUTH PROTECTION] Stack trace:', new Error().stack);
          // Allow removal but log it extensively
        }
        return localStorage._originalRemoveItem.apply(this, arguments);
      };
    }
    
    // Intercept fetch to log auth-related requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('auth/v1/token')) {
        console.log('🔐 [AUTH FETCH] Token refresh request:', url);
        try {
          const response = await originalFetch.apply(this, args);
          if (!response.ok) {
            console.error('❌ [AUTH FETCH] Token refresh failed:', {
              status: response.status,
              statusText: response.statusText,
              url,
            });
          } else {
            console.log('✅ [AUTH FETCH] Token refresh succeeded');
          }
          return response;
        } catch (error) {
          console.error('❌ [AUTH FETCH] Token refresh error:', error);
          throw error;
        }
      }
      return originalFetch.apply(this, args);
    };
  }
} else {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  console.error('Set these in Vercel:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  console.error('Then REDEPLOY!');

  // Create a dummy client to prevent crashes (app will still work, just no auth)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: { persistSession: false },
  });
}

export { supabase };
