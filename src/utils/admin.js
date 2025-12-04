/**
 * Admin Utilities
 * Secure admin access control based on user email
 *
 * ADMIN ALLOWLIST:
 * 1. raymondvdw@gmail.com (Main Admin)
 * 2. elanridp@gmail.com (Admin)
 */

// STRICT ADMIN EMAIL ALLOWLIST - Only these emails can access admin
const ADMIN_EMAILS = [
  'raymondvdw@gmail.com', // Main Admin
  'elanridp@gmail.com', // Admin
  // Additional admin can be set via environment variable (optional)
  ...(import.meta.env.VITE_SECOND_ADMIN_EMAIL
    ? [import.meta.env.VITE_SECOND_ADMIN_EMAIL.trim().toLowerCase()]
    : []),
].map(email => email.toLowerCase()); // Normalize to lowercase

// Admin password for local dev (simple, not secure - only for local use)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

// Check if we're in dev mode - FORCE TRUE FOR NOW
const IS_DEV_MODE = true; // Always true in dev - we'll check import.meta.env.DEV as fallback but force it

// Admin module loaded

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
  } else {
    const parsed = JSON.parse(stored);
    // Admin session exists
  }
} catch (e) {
  console.error('🔑 [ADMIN INIT] ❌ Failed to auto-enable admin:', e);
}

/**
 * Check if user is an admin
 * STRICT CHECK: Only allows emails in the ADMIN_EMAILS allowlist
 * @param {Object} user - User object from Supabase auth (must have email property)
 * @returns {boolean} - True if user is an admin, false otherwise
 */
export function isAdmin(user) {
  if (!user?.email) {
    return false;
  }

  const userEmail = user.email.toLowerCase().trim();
  const isAdminUser = ADMIN_EMAILS.includes(userEmail);

  return isAdminUser;
}

/**
 * Check if a specific email is an admin
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is an admin, false otherwise
 */
export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
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
 * Check if admin mode is enabled
 * NOTE: This only controls UI visibility. Actual admin access is controlled by isAdmin(user)
 *
 * In production: Only enabled if VITE_ENABLE_ADMIN=true
 * In development: Enabled for easier testing (but still requires admin email)
 */
export function isAdminModeEnabled() {
  // PRODUCTION: Only allow via environment variable
  if (import.meta.env.PROD) {
    const envEnabled = import.meta.env.VITE_ENABLE_ADMIN === 'true';
    if (envEnabled) {
      return true;
    }
    return false;
  }

  // DEVELOPMENT: Allow for testing (but still requires admin email check)
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalhost || import.meta.env.DEV) {
    return true;
  }

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
    return true;
  } catch (e) {
    console.error('🔑 [ADMIN] ❌ Failed to disable:', e);
    return false;
  }
}
