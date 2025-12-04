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
    auth: { persistSession: true, autoRefreshToken: true },
    global: {
      headers: {
        apikey: supabaseAnonKey,
      },
    },
    db: {
      schema: 'public',
    },
  });
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
