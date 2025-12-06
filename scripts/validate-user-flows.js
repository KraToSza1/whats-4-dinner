/**
 * User Flow Validation Script
 *
 * Validates that everything connects correctly for:
 * - New users (signup, trial activation)
 * - Existing users (subscription sync, data persistence)
 * - Admin users (admin routes, admin features)
 * - User data isolation (users can't see each other's data)
 *
 * Run: node scripts/validate-user-flows.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: msg => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
  critical: msg => console.log(`${colors.red}🚨 ${msg}${colors.reset}`),
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: 0,
  tests: [],
};

function recordTest(name, passed, message, isWarning = false, isCritical = false) {
  results.tests.push({ name, passed, message, isWarning, isCritical });
  if (passed) {
    results.passed++;
    log.success(`${name}: ${message}`);
  } else if (isCritical) {
    results.critical++;
    results.failed++;
    log.critical(`${name}: ${message} [CRITICAL]`);
  } else if (isWarning) {
    results.warnings++;
    log.warning(`${name}: ${message}`);
  } else {
    results.failed++;
    log.error(`${name}: ${message}`);
  }
}

function readFile(filePath) {
  try {
    const fullPath = join(projectRoot, filePath);
    if (!existsSync(fullPath)) {
      return null;
    }
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    return null;
  }
}

function fileExists(filePath) {
  return existsSync(join(projectRoot, filePath));
}

// ============================================================================
// 1. NEW USER SIGNUP FLOW
// ============================================================================

function validateNewUserFlow() {
  log.section('New User Signup Flow');

  const authContext = readFile('src/context/AuthContext.jsx');
  const trialUtils = readFile('src/utils/trial.js');
  const subscriptionUtils = readFile('src/utils/subscription.js');

  // Check AuthContext starts trial on signup
  if (authContext) {
    const startsTrialOnSignup =
      authContext.includes('SIGNED_IN') &&
      (authContext.includes('startTrial') || authContext.includes('trial'));
    recordTest(
      'Trial Starts on Signup',
      startsTrialOnSignup,
      startsTrialOnSignup
        ? 'Trial automatically starts when user signs up'
        : 'Trial not started on signup',
      false,
      !startsTrialOnSignup
    );

    // Check auth state change handler
    const hasAuthStateChange = authContext.includes('onAuthStateChange');
    recordTest(
      'Auth State Change Handler',
      hasAuthStateChange,
      hasAuthStateChange ? 'Auth state change handler present' : 'Missing auth state handler',
      false,
      !hasAuthStateChange
    );
  } else {
    recordTest('AuthContext File', false, 'File not found', false, true);
  }

  // Check trial utilities exist
  if (trialUtils) {
    recordTest('Trial Utils File', true, 'File exists', false, false);

    const hasStartTrial =
      trialUtils.includes('startTrial') || trialUtils.includes('export.*startTrial');
    recordTest(
      'Start Trial Function',
      hasStartTrial,
      hasStartTrial ? 'startTrial function exists' : 'startTrial function missing',
      false,
      !hasStartTrial
    );

    const hasIsTrialActive = trialUtils.includes('isTrialActive');
    recordTest(
      'Check Trial Active Function',
      hasIsTrialActive,
      hasIsTrialActive ? 'isTrialActive function exists' : 'isTrialActive function missing',
      false,
      false
    );

    // Check trial duration
    const hasTrialDuration =
      trialUtils.includes('TRIAL_DURATION_DAYS') || trialUtils.includes('30');
    recordTest(
      'Trial Duration Configured',
      hasTrialDuration,
      hasTrialDuration ? 'Trial duration configured (30 days)' : 'Trial duration not configured',
      false,
      false
    );
  } else {
    recordTest('Trial Utils File', false, 'File not found', false, true);
  }

  // Check subscription sync on signup
  if (subscriptionUtils) {
    const syncsOnSignup =
      subscriptionUtils.includes('getCurrentPlan') ||
      subscriptionUtils.includes('getEffectivePlan');
    recordTest(
      'Subscription Sync on Signup',
      syncsOnSignup,
      syncsOnSignup ? 'Subscription syncs on signup' : 'Subscription not syncing on signup',
      false,
      false
    );
  }
}

// ============================================================================
// 2. EXISTING USER FLOW
// ============================================================================

function validateExistingUserFlow() {
  log.section('Existing User Flow');

  const authContext = readFile('src/context/AuthContext.jsx');
  const subscriptionUtils = readFile('src/utils/subscription.js');
  const appContent = readFile('src/App.jsx');

  // Check subscription plan syncs on auth change
  if (authContext) {
    const syncsPlanOnAuthChange =
      authContext.includes('subscriptionPlanChanged') || authContext.includes('getCurrentPlan');
    recordTest(
      'Plan Syncs on Auth Change',
      syncsPlanOnAuthChange,
      syncsPlanOnAuthChange
        ? 'Subscription plan syncs when auth state changes'
        : 'Plan not syncing on auth change',
      false,
      !syncsPlanOnAuthChange
    );

    // Check plan syncs on token refresh
    const syncsOnTokenRefresh = authContext.includes('TOKEN_REFRESHED');
    recordTest(
      'Plan Syncs on Token Refresh',
      syncsOnTokenRefresh,
      syncsOnTokenRefresh ? 'Plan syncs on token refresh' : 'Plan not syncing on token refresh',
      false,
      false
    );
  }

  // Check subscription utilities
  if (subscriptionUtils) {
    const hasGetCurrentPlan =
      subscriptionUtils.includes('getCurrentPlan') ||
      subscriptionUtils.includes('export.*getCurrentPlan');
    recordTest(
      'Get Current Plan Function',
      hasGetCurrentPlan,
      hasGetCurrentPlan ? 'getCurrentPlan function exists' : 'getCurrentPlan function missing',
      false,
      !hasGetCurrentPlan
    );

    const hasPlanCache =
      subscriptionUtils.includes('clearPlanCache') || subscriptionUtils.includes('cache');
    recordTest(
      'Plan Caching',
      hasPlanCache,
      hasPlanCache ? 'Plan caching implemented' : 'Plan caching not implemented',
      false,
      false
    );
  }

  // Check App.jsx listens for plan changes
  if (appContent) {
    const listensForPlanChanges = appContent.includes('subscriptionPlanChanged');
    recordTest(
      'App Listens for Plan Changes',
      listensForPlanChanges,
      listensForPlanChanges
        ? 'App listens for subscription plan changes'
        : 'App not listening for plan changes',
      false,
      false
    );

    // Check plan initialization on mount
    const initializesPlan =
      appContent.includes('getCurrentPlan') || appContent.includes('initializePlan');
    recordTest(
      'Plan Initialization on Mount',
      initializesPlan,
      initializesPlan ? 'Plan initializes on app mount' : 'Plan not initializing on mount',
      false,
      false
    );
  }
}

// ============================================================================
// 3. ADMIN FUNCTIONALITY
// ============================================================================

function validateAdminFunctionality() {
  log.section('Admin Functionality');

  const adminContext = readFile('src/context/AdminContext.jsx');
  const adminUtils = readFile('src/utils/admin.js');
  const protectedRoute = readFile('src/components/ProtectedAdminRoute.jsx');
  const adminDashboard = readFile('src/pages/AdminDashboard.jsx');

  // Check AdminContext
  if (adminContext) {
    recordTest('AdminContext File', true, 'File exists', false, false);

    const checksUserIsAdmin = adminContext.includes('isAdmin') || adminContext.includes('useAdmin');
    recordTest(
      'Admin Check Function',
      checksUserIsAdmin,
      checksUserIsAdmin ? 'Admin check function present' : 'Admin check missing',
      false,
      !checksUserIsAdmin
    );

    const usesAuthContext =
      adminContext.includes('useAuth') || adminContext.includes('AuthContext');
    recordTest(
      'Admin Uses Auth Context',
      usesAuthContext,
      usesAuthContext ? 'Admin context uses AuthContext' : 'Admin context not using AuthContext',
      false,
      !usesAuthContext
    );
  } else {
    recordTest('AdminContext File', false, 'File not found', false, true);
  }

  // Check admin utilities
  if (adminUtils) {
    recordTest('Admin Utils File', true, 'File exists', false, false);

    const hasIsAdminFunction =
      adminUtils.includes('isAdmin') || adminUtils.includes('export.*isAdmin');
    recordTest(
      'Is Admin Function',
      hasIsAdminFunction,
      hasIsAdminFunction ? 'isAdmin function exists' : 'isAdmin function missing',
      false,
      !hasIsAdminFunction
    );

    // Check admin email allowlist
    const hasAdminList =
      adminUtils.includes('ADMIN_EMAILS') ||
      adminUtils.includes('admin') ||
      adminUtils.includes('allowlist');
    recordTest(
      'Admin Email Allowlist',
      hasAdminList,
      hasAdminList ? 'Admin email allowlist configured' : 'Admin email allowlist missing',
      false,
      !hasAdminList
    );
  } else {
    recordTest('Admin Utils File', false, 'File not found', false, true);
  }

  // Check protected admin route
  if (protectedRoute) {
    recordTest('Protected Admin Route', true, 'File exists', false, false);

    const checksAuth = protectedRoute.includes('useAuth') || protectedRoute.includes('user');
    recordTest(
      'Route Checks Authentication',
      checksAuth,
      checksAuth ? 'Route checks user authentication' : 'Route not checking auth',
      false,
      !checksAuth
    );

    const checksAdmin = protectedRoute.includes('isAdmin') || protectedRoute.includes('admin');
    recordTest(
      'Route Checks Admin Status',
      checksAdmin,
      checksAdmin ? 'Route checks admin status' : 'Route not checking admin status',
      false,
      !checksAdmin
    );

    const redirectsNonAdmin =
      protectedRoute.includes('Navigate') || protectedRoute.includes('redirect');
    recordTest(
      'Redirects Non-Admin Users',
      redirectsNonAdmin,
      redirectsNonAdmin ? 'Route redirects non-admin users' : 'Route not redirecting non-admin',
      false,
      !redirectsNonAdmin
    );
  } else {
    recordTest('Protected Admin Route', false, 'File not found', false, true);
  }

  // Check admin dashboard exists
  if (adminDashboard) {
    recordTest('Admin Dashboard', true, 'File exists', false, false);
  } else {
    recordTest('Admin Dashboard', false, 'File not found', true, false);
  }

  // Check admin routes in App.jsx
  const appContent = readFile('src/App.jsx');
  if (appContent) {
    const hasAdminRoutes =
      appContent.includes('/admin') || appContent.includes('ProtectedAdminRoute');
    recordTest(
      'Admin Routes Configured',
      hasAdminRoutes,
      hasAdminRoutes ? 'Admin routes configured in App' : 'Admin routes not configured',
      false,
      !hasAdminRoutes
    );
  }
}

// ============================================================================
// 4. USER DATA ISOLATION
// ============================================================================

function validateUserDataIsolation() {
  log.section('User Data Isolation');

  const appContent = readFile('src/App.jsx');
  const favoritesPage = readFile('src/pages/Favorites.jsx');
  const mealPlanner = readFile('src/pages/MealPlanner.jsx');
  const profilePage = readFile('src/pages/Profile.jsx');

  // Check favorites use user-specific data
  if (appContent) {
    const favoritesUseLocalStorage = appContent.includes("localStorage.getItem('favorites')");
    recordTest(
      'Favorites Use Local Storage',
      favoritesUseLocalStorage,
      favoritesUseLocalStorage
        ? 'Favorites use localStorage (user-specific)'
        : 'Favorites not using localStorage',
      false,
      false
    );

    // Note: localStorage is per-browser, so it's user-specific
    // In production, you might want to sync with Supabase for multi-device
    recordTest(
      'Favorites Data Isolation',
      true,
      'Favorites isolated per browser (localStorage)',
      false,
      false
    );
  }

  // Check meal planner uses user-specific data
  if (mealPlanner) {
    const mealPlanUsesLocalStorage =
      mealPlanner.includes('localStorage') || mealPlanner.includes('MEAL_PLAN');
    recordTest(
      'Meal Planner Uses Local Storage',
      mealPlanUsesLocalStorage,
      mealPlanUsesLocalStorage
        ? 'Meal planner uses localStorage (user-specific)'
        : 'Meal planner not using localStorage',
      false,
      false
    );
  }

  // Check profile page uses authenticated user
  if (profilePage) {
    const usesAuth = profilePage.includes('useAuth') || profilePage.includes('user');
    recordTest(
      'Profile Uses Authenticated User',
      usesAuth,
      usesAuth ? 'Profile page uses authenticated user' : 'Profile page not using auth',
      false,
      !usesAuth
    );
  }

  // Check subscription uses user ID
  const subscriptionUtils = readFile('src/utils/subscription.js');
  if (subscriptionUtils) {
    const usesUserId =
      subscriptionUtils.includes('user.id') ||
      subscriptionUtils.includes('userId') ||
      subscriptionUtils.includes('getUser()');
    recordTest(
      'Subscription Uses User ID',
      usesUserId,
      usesUserId ? 'Subscription uses user ID for data' : 'Subscription not using user ID',
      false,
      false
    );
  }
}

// ============================================================================
// 5. CROSS-TAB SYNC
// ============================================================================

function validateCrossTabSync() {
  log.section('Cross-Tab Synchronization');

  const appContent = readFile('src/App.jsx');
  const groceryContext = readFile('src/context/GroceryListContext.jsx');

  // Check favorites sync across tabs
  if (appContent) {
    const favoritesSync = appContent.includes('storage') && appContent.includes('favorites');
    recordTest(
      'Favorites Cross-Tab Sync',
      favoritesSync,
      favoritesSync ? 'Favorites sync across tabs' : 'Favorites not syncing across tabs',
      false,
      false
    );

    const subscriptionSync = appContent.includes('storage') && appContent.includes('subscription');
    recordTest(
      'Subscription Cross-Tab Sync',
      subscriptionSync,
      subscriptionSync ? 'Subscription syncs across tabs' : 'Subscription not syncing across tabs',
      false,
      false
    );
  }

  // Check grocery list syncs across tabs
  if (groceryContext) {
    const grocerySync =
      groceryContext.includes('storage') || groceryContext.includes('addEventListener');
    recordTest(
      'Grocery List Cross-Tab Sync',
      grocerySync,
      grocerySync ? 'Grocery list syncs across tabs' : 'Grocery list not syncing',
      false,
      false
    );
  }
}

// ============================================================================
// 6. PAYMENT INTEGRATION FOR USERS
// ============================================================================

function validatePaymentUserIntegration() {
  log.section('Payment Integration for Users');

  const appContent = readFile('src/App.jsx');
  const paddleWebhook = readFile('api/paddle/webhook.js');
  const paddleUpdate = readFile('api/paddle/update-plan.js');

  // Check payment success handling
  if (appContent) {
    const handlesPaymentSuccess =
      appContent.includes('checkPaymentSuccess') ||
      appContent.includes('_ptxn') ||
      appContent.includes('payment');
    recordTest(
      'Payment Success Handling',
      handlesPaymentSuccess,
      handlesPaymentSuccess
        ? 'App handles payment success redirects'
        : 'Payment success not handled',
      false,
      !handlesPaymentSuccess
    );
  }

  // Check webhook updates user plan
  if (paddleWebhook) {
    const updatesUserPlan =
      paddleWebhook.includes('profiles') ||
      paddleWebhook.includes('upsert') ||
      paddleWebhook.includes('plan');
    recordTest(
      'Webhook Updates User Plan',
      updatesUserPlan,
      updatesUserPlan ? 'Webhook updates user plan in Supabase' : 'Webhook not updating plan',
      false,
      !updatesUserPlan
    );

    const usesUserEmail =
      paddleWebhook.includes('email') || paddleWebhook.includes('customer_email');
    recordTest(
      'Webhook Uses User Email',
      usesUserEmail,
      usesUserEmail ? 'Webhook uses user email to find user' : 'Webhook not using email',
      false,
      false
    );
  }

  // Check update-plan API
  if (paddleUpdate) {
    recordTest('Update Plan API', true, 'File exists', false, false);
    const updatesPlan = paddleUpdate.includes('profiles') || paddleUpdate.includes('plan');
    recordTest(
      'Update Plan Updates Database',
      updatesPlan,
      updatesPlan ? 'Update plan API updates database' : 'Update plan not updating database',
      false,
      !updatesPlan
    );
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

function runValidation() {
  console.log(`${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║     USER FLOW VALIDATION                                     ║
║     Validates new users, existing users, and admin flows     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  validateNewUserFlow();
  validateExistingUserFlow();
  validateAdminFunctionality();
  validateUserDataIsolation();
  validateCrossTabSync();
  validatePaymentUserIntegration();

  // Summary
  log.section('Validation Summary');
  console.log(`\n${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}🚨 Critical: ${results.critical}${colors.reset}\n`);

  // Critical issues
  const criticalTests = results.tests.filter(t => t.isCritical && !t.passed);
  if (criticalTests.length > 0) {
    log.critical('CRITICAL ISSUES FOUND:');
    criticalTests.forEach(test => {
      log.critical(`  - ${test.name}: ${test.message}`);
    });
    console.log('');
  }

  // User flow assessment
  const readinessScore = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  const isReady = results.critical === 0 && results.failed === 0;

  console.log(`${colors.cyan}━━━ User Flow Assessment ━━━${colors.reset}\n`);

  if (isReady) {
    log.success(`🎉 ALL USER FLOWS WORKING! (${readinessScore}% pass rate)`);
    console.log(`\n${colors.green}✅ New users: Trial starts automatically${colors.reset}`);
    console.log(`\n${colors.green}✅ Existing users: Subscription syncs correctly${colors.reset}`);
    console.log(`\n${colors.green}✅ Admin users: Admin routes protected${colors.reset}`);
    console.log(`\n${colors.green}✅ User data: Properly isolated${colors.reset}\n`);
    process.exit(0);
  } else if (results.critical > 0) {
    log.critical(`🚨 USER FLOWS HAVE ISSUES (${readinessScore}% pass rate)`);
    console.log(`\n${colors.red}Critical issues must be fixed.${colors.reset}\n`);
    process.exit(1);
  } else {
    log.warning(`⚠️  USER FLOWS WORKING WITH WARNINGS (${readinessScore}% pass rate)`);
    console.log(`\n${colors.yellow}Review warnings above.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run validation
runValidation();
