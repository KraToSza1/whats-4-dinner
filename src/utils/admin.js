/**
 * Admin Utilities
 * Simple admin detection for local development
 */

// Admin emails (for local development)
// In production, this should be stored in Supabase or environment variables
const ADMIN_EMAILS = [
  'admin@whats4dinner.com',
  'admin@localhost',
  'test@admin.com',
  // Add your email here for local testing
  ...(import.meta.env.VITE_ADMIN_EMAILS
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim())
    : []),
];

// Admin password for local dev (simple, not secure - only for local use)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

// Check if we're in dev mode - FORCE TRUE FOR NOW
const IS_DEV_MODE = true; // Always true in dev - we'll check import.meta.env.DEV as fallback but force it

// Log dev mode status immediately - THIS SHOULD ALWAYS RUN
console.log('🔑 [ADMIN INIT] =========================================');
console.log('🔑 [ADMIN INIT] ADMIN MODULE LOADED!');
console.log('🔑 [ADMIN INIT] Dev mode check:', {
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  IS_DEV_MODE: true, // FORCED TO TRUE
  NODE_ENV: import.meta.env.NODE_ENV,
  allEnvKeys: Object.keys(import.meta.env),
});
console.log('🔑 [ADMIN INIT] =========================================');

// Auto-enable admin in dev mode - ALWAYS RUN THIS
const ADMIN_SESSION_KEY = 'admin:session:v1';
try {
  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) {
    // Auto-create admin session in dev mode
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        expiresAt,
        autoEnabled: true,
        forced: true, // Mark as forced for debugging
      })
    );
    console.log('🔑 [ADMIN INIT] ✅ Auto-enabled admin access for local development');
    console.log('🔑 [ADMIN INIT] Session expires:', new Date(expiresAt).toLocaleString());
  } else {
    const parsed = JSON.parse(stored);
    console.log('🔑 [ADMIN INIT] ✅ Admin session already exists');
    console.log('🔑 [ADMIN INIT] Session expires:', new Date(parsed.expiresAt).toLocaleString());
    console.log('🔑 [ADMIN INIT] Session valid:', Date.now() < parsed.expiresAt);
  }
} catch (e) {
  console.error('🔑 [ADMIN INIT] ❌ Failed to auto-enable admin:', e);
}

/**
 * Check if user is an admin
 */
export function isAdmin(user) {
  if (!user?.email) return false;
  return ADMIN_EMAILS.some(email => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Verify admin password (for local dev login)
 */
export function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

/**
 * Get admin emails list
 */
export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}

/**
 * Check if admin mode is enabled (local dev only)
 * MULTIPLE WAYS TO ENABLE:
 * 1. URL query parameter: ?admin=true
 * 2. localStorage flag: admin:force:enabled
 * 3. Dev mode (import.meta.env.DEV)
 * 4. Always enabled in localhost
 */
export function isAdminModeEnabled() {
  // Check URL parameter first (easiest way)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === 'true') {
    console.log('🔑 [ADMIN] ✅ Enabled via URL parameter (?admin=true)');
    // Save to localStorage for persistence
    try {
      localStorage.setItem('admin:force:enabled', 'true');
    } catch {}
    return true;
  }

  // Check localStorage flag
  try {
    const forceEnabled = localStorage.getItem('admin:force:enabled');
    if (forceEnabled === 'true') {
      console.log('🔑 [ADMIN] ✅ Enabled via localStorage flag');
      return true;
    }
  } catch {}

  // Check if we're on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔑 [ADMIN] ✅ Enabled (localhost detected)');
    return true;
  }

  // Check dev mode
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    console.log('🔑 [ADMIN] ✅ Enabled (dev mode)');
    return true;
  }

  console.log('🔑 [ADMIN] ❌ Not enabled');
  return false;
}

/**
 * Force enable admin mode (for easy access)
 */
export function forceEnableAdmin() {
  try {
    localStorage.setItem('admin:force:enabled', 'true');
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        autoEnabled: true,
        forced: true,
      })
    );
    console.log('🔑 [ADMIN] ✅ Admin mode FORCED ENABLED');
    return true;
  } catch (e) {
    console.error('🔑 [ADMIN] ❌ Failed to force enable:', e);
    return false;
  }
}

/**
 * Disable admin mode
 */
export function disableAdmin() {
  try {
    localStorage.removeItem('admin:force:enabled');
    localStorage.removeItem(ADMIN_SESSION_KEY);
    console.log('🔑 [ADMIN] ✅ Admin mode disabled');
    return true;
  } catch (e) {
    console.error('🔑 [ADMIN] ❌ Failed to disable:', e);
    return false;
  }
}
