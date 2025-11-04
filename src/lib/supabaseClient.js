import { createClient } from "@supabase/supabase-js";

// Get environment variables - Vite prefixes with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log what we're getting
console.log("Supabase Config Check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
  allEnvVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
});

// Only create client if we have both values
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
} else {
  console.error("❌ CRITICAL: Missing Supabase environment variables!");
  console.error("Set these in Vercel:");
  console.error("  - VITE_SUPABASE_URL");
  console.error("  - VITE_SUPABASE_ANON_KEY");
  console.error("Then REDEPLOY!");
  
  // Create a dummy client to prevent crashes (app will still work, just no auth)
  supabase = createClient(
    "https://placeholder.supabase.co",
    "placeholder-key",
    { auth: { persistSession: false } }
  );
}

export { supabase };


