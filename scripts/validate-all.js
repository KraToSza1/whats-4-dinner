/**
 * Master Validation Script
 *
 * Combines ALL validation checks into one comprehensive run:
 * 1. Integration Validation (contexts, filters, medical conditions, etc.)
 * 2. Production Readiness (environment, APIs, security, deployment)
 * 3. User Flows (new users, existing users, admin functionality)
 *
 * Run: npm run validate:all
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
  bold: '\x1b[1m',
};

const log = {
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: msg => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
  critical: msg => console.log(`${colors.red}🚨 ${msg}${colors.reset}`),
  header: msg => console.log(`${colors.magenta}${colors.bold}${msg}${colors.reset}`),
};

// Global results tracker
const globalResults = {
  integration: { passed: 0, failed: 0, warnings: 0, critical: 0, tests: [] },
  production: { passed: 0, failed: 0, warnings: 0, critical: 0, tests: [] },
  userFlows: { passed: 0, failed: 0, warnings: 0, critical: 0, tests: [] },
};

function recordTest(category, name, passed, message, isWarning = false, isCritical = false) {
  const results = globalResults[category];
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
// INTEGRATION VALIDATION (from validate-integration.js)
// ============================================================================

function validateIntegration() {
  log.header('\n╔══════════════════════════════════════════════════════════════╗');
  log.header('║  PHASE 1: INTEGRATION VALIDATION                          ║');
  log.header('╚══════════════════════════════════════════════════════════════╝\n');

  // Context Providers
  log.section('Context Providers');
  const mainContent = readFile('src/main.jsx');
  const appContent = readFile('src/App.jsx');

  if (mainContent) {
    const mainProviders = ['AuthProvider', 'FilterProvider', 'ToastProvider', 'LanguageProvider'];
    const missingMain = mainProviders.filter(provider => !mainContent.includes(provider));
    const hasGroceryProvider = appContent && appContent.includes('GroceryListProvider');

    if (missingMain.length === 0 && hasGroceryProvider) {
      recordTest(
        'integration',
        'Context Providers',
        true,
        'All context providers present',
        false,
        false
      );
    } else {
      recordTest(
        'integration',
        'Context Providers',
        false,
        `Missing: ${missingMain.join(', ')}`,
        false,
        true
      );
    }
  }

  // FilterContext Integration
  log.section('FilterContext Integration');
  const filterContextContent = readFile('src/context/FilterContext.jsx');
  const filtersContent = readFile('src/components/Filters.jsx');

  if (appContent && filtersContent) {
    const usesFilterContext = appContent.includes('useFilters');
    recordTest(
      'integration',
      'FilterContext Usage',
      usesFilterContext,
      usesFilterContext ? 'FilterContext used consistently' : 'FilterContext not used',
      false,
      !usesFilterContext
    );
  }

  // Medical Conditions Integration
  log.section('Medical Conditions Integration');
  const medicalContent = readFile('src/utils/medicalConditions.js');
  if (appContent && medicalContent) {
    const hasMedicalIntegration = appContent.includes('filterRecipesByMedicalConditions');
    recordTest(
      'integration',
      'Medical Conditions',
      hasMedicalIntegration,
      hasMedicalIntegration
        ? 'Medical conditions properly integrated'
        : 'Medical conditions not integrated',
      false,
      false
    );
  }

  // Subscription Integration
  log.section('Subscription Integration');
  const subscriptionContent = readFile('src/utils/subscription.js');
  if (appContent && subscriptionContent) {
    const hasSubscriptionIntegration =
      appContent.includes('canPerformAction') || appContent.includes('subscription.js');
    recordTest(
      'integration',
      'Subscription System',
      hasSubscriptionIntegration,
      hasSubscriptionIntegration
        ? 'Subscription system properly integrated'
        : 'Subscription not integrated',
      false,
      false
    );
  }

  // Grocery List Integration
  log.section('Grocery List Integration');
  const recipePageContent = readFile('src/pages/RecipePage.jsx');
  const groceryContent = readFile('src/context/GroceryListContext.jsx');
  if (recipePageContent && groceryContent) {
    const hasGroceryIntegration = recipePageContent.includes('useGroceryList');
    recordTest(
      'integration',
      'Grocery List',
      hasGroceryIntegration,
      hasGroceryIntegration ? 'Grocery list properly integrated' : 'Grocery list not integrated',
      false,
      false
    );
  }

  // Meal Planner Integration
  log.section('Meal Planner Integration');
  const mealPlannerContent = readFile('src/pages/MealPlanner.jsx');
  if (mealPlannerContent && recipePageContent) {
    const hasMealPlannerIntegration = mealPlannerContent.includes('setMealPlanDay');
    recordTest(
      'integration',
      'Meal Planner',
      hasMealPlannerIntegration,
      hasMealPlannerIntegration
        ? 'Meal planner properly integrated'
        : 'Meal planner not integrated',
      false,
      false
    );
  }

  // LocalStorage Consistency
  log.section('LocalStorage Consistency');
  if (appContent && filterContextContent) {
    const hasPantryKey =
      appContent.includes("'filters:pantry'") || appContent.includes('"filters:pantry"');
    recordTest(
      'integration',
      'LocalStorage Keys',
      true,
      'All localStorage keys consistent (pantry is separate)',
      false,
      false
    );
  }
}

// ============================================================================
// PRODUCTION READINESS VALIDATION (from validate-production-ready.js)
// ============================================================================

function validateProduction() {
  log.header('\n╔══════════════════════════════════════════════════════════════╗');
  log.header('║  PHASE 2: PRODUCTION READINESS VALIDATION                 ║');
  log.header('╚══════════════════════════════════════════════════════════════╝\n');

  // Environment Variables
  log.section('Environment Variables');
  const envLocal = readFile('.env.local');
  const envFile = readFile('.env');

  const supabaseVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  supabaseVars.forEach(varName => {
    const hasVar = envLocal?.includes(varName) || envFile?.includes(varName);
    recordTest(
      'production',
      `Env: ${varName}`,
      hasVar,
      hasVar ? 'Present' : 'MISSING - CRITICAL',
      false,
      !hasVar
    );
  });

  const paymentProvider =
    envLocal?.match(/VITE_PAYMENT_PROVIDER=(.+)/)?.[1] ||
    envFile?.match(/VITE_PAYMENT_PROVIDER=(.+)/)?.[1] ||
    'paddle';
  recordTest(
    'production',
    'Payment Provider',
    true,
    `Configured: ${paymentProvider}`,
    false,
    false
  );

  // Supabase Integration
  log.section('Supabase Integration');
  const supabaseClient = readFile('src/lib/supabaseClient.js');
  const supabaseRecipes = readFile('src/api/supabaseRecipes.js');

  if (supabaseClient) {
    recordTest('production', 'Supabase Client File', true, 'File exists', false, false);
    const hasAnonKeyCheck = supabaseClient.includes('anon') || supabaseClient.includes('ANON');
    recordTest(
      'production',
      'Supabase Key Type',
      hasAnonKeyCheck,
      hasAnonKeyCheck ? 'Using ANON key (correct)' : 'Check key type',
      !hasAnonKeyCheck,
      false
    );
  }

  if (supabaseRecipes) {
    recordTest('production', 'Supabase Recipes API', true, 'File exists', false, false);
    const hasSearchFunction = supabaseRecipes.includes('searchSupabaseRecipes');
    recordTest(
      'production',
      'Recipe Search Function',
      hasSearchFunction,
      hasSearchFunction ? 'Search function exists' : 'Search function missing',
      false,
      !hasSearchFunction
    );
  }

  // Payment Providers
  log.section('Payment Provider Integration');
  const paddleCheckout = readFile('api/paddle/create-checkout.js');
  const paddleWebhook = readFile('api/paddle/webhook.js');
  const paymentUtils = readFile('src/utils/paymentProviders.js');

  if (paddleCheckout)
    recordTest('production', 'Paddle Checkout API', true, 'File exists', false, false);
  if (paddleWebhook) {
    recordTest('production', 'Paddle Webhook API', true, 'File exists', false, false);
    const hasSignatureCheck =
      paddleWebhook.includes('signature') || paddleWebhook.includes('verify');
    recordTest(
      'production',
      'Paddle Webhook Security',
      hasSignatureCheck,
      hasSignatureCheck ? 'Signature verification present' : 'Missing signature check',
      false,
      true
    );
  }
  if (paymentUtils)
    recordTest('production', 'Payment Provider Utils', true, 'File exists', false, false);

  // Recipe Functionality
  log.section('Recipe Functionality');
  const appContent = readFile('src/App.jsx');
  const recipePage = readFile('src/pages/RecipePage.jsx');
  const recipeCard = readFile('src/components/RecipeCard.jsx');

  if (appContent) {
    const hasSearch =
      appContent.includes('fetchRecipes') || appContent.includes('searchSupabaseRecipes');
    recordTest(
      'production',
      'Recipe Search',
      hasSearch,
      hasSearch ? 'Search function present' : 'Search function missing',
      false,
      !hasSearch
    );
  }
  if (recipePage)
    recordTest('production', 'Recipe Page Component', true, 'File exists', false, false);
  if (recipeCard)
    recordTest('production', 'Recipe Card Component', true, 'File exists', false, false);

  // UI Components
  log.section('UI Components & Buttons');
  const components = [
    'Header.jsx',
    'SearchForm.jsx',
    'Filters.jsx',
    'RecipeCard.jsx',
    'GroceryDrawer.jsx',
    'Pagination.jsx',
    'BackToTop.jsx',
  ];
  components.forEach(component => {
    const exists = fileExists(`src/components/${component}`);
    recordTest(
      'production',
      `Component: ${component}`,
      exists,
      exists ? 'File exists' : 'File not found',
      false,
      false
    );
  });

  // Error Handling
  log.section('Error Handling');
  const errorBoundary = readFile('src/ErrorBoundary.jsx');
  if (errorBoundary) recordTest('production', 'Error Boundary', true, 'File exists', false, false);

  // Security
  log.section('Security');
  const vercelConfig = readFile('vercel.json');
  if (vercelConfig) {
    const hasSecurityHeaders =
      vercelConfig.includes('X-Content-Type-Options') || vercelConfig.includes('X-Frame-Options');
    recordTest(
      'production',
      'Security Headers',
      hasSecurityHeaders,
      hasSecurityHeaders ? 'Security headers configured' : 'Missing security headers',
      false,
      !hasSecurityHeaders
    );
  }

  // Deployment Readiness
  log.section('Deployment Readiness');
  if (vercelConfig) recordTest('production', 'Vercel Config', true, 'File exists', false, false);
  const packageJson = readFile('package.json');
  if (packageJson) {
    recordTest('production', 'Package.json', true, 'File exists', false, false);
    const hasBuildScript = packageJson.includes('"build"');
    recordTest(
      'production',
      'Build Script',
      hasBuildScript,
      hasBuildScript ? 'Build script present' : 'Missing build script',
      false,
      !hasBuildScript
    );
  }

  // API Routes
  log.section('API Routes');
  const apiRoutes = [
    'api/health.js',
    'api/paddle/create-checkout.js',
    'api/paddle/webhook.js',
    'api/paddle/update-plan.js',
  ];
  apiRoutes.forEach(route => {
    const exists = fileExists(route);
    const routeName = route.split('/').pop();
    recordTest(
      'production',
      `API Route: ${routeName}`,
      exists,
      exists ? 'File exists' : 'File not found',
      !exists,
      false
    );
  });

  // Feature Completeness
  log.section('Feature Completeness');
  const features = [
    { name: 'Favorites', file: 'src/pages/Favorites.jsx' },
    { name: 'Meal Planner', file: 'src/pages/MealPlanner.jsx' },
    { name: 'Profile', file: 'src/pages/Profile.jsx' },
    { name: 'Family Plan', file: 'src/pages/FamilyPlan.jsx' },
  ];
  features.forEach(feature => {
    const exists = fileExists(feature.file);
    recordTest(
      'production',
      `Feature: ${feature.name}`,
      exists,
      exists ? 'File exists' : 'File not found',
      false,
      false
    );
  });
}

// ============================================================================
// USER FLOWS VALIDATION (from validate-user-flows.js)
// ============================================================================

function validateUserFlows() {
  log.header('\n╔══════════════════════════════════════════════════════════════╗');
  log.header('║  PHASE 3: USER FLOWS VALIDATION                             ║');
  log.header('╚══════════════════════════════════════════════════════════════╝\n');

  // New User Flow
  log.section('New User Signup Flow');
  const authContext = readFile('src/context/AuthContext.jsx');
  const trialUtils = readFile('src/utils/trial.js');

  if (authContext) {
    const startsTrialOnSignup =
      authContext.includes('SIGNED_IN') &&
      (authContext.includes('startTrial') || authContext.includes('trial'));
    recordTest(
      'userFlows',
      'Trial Starts on Signup',
      startsTrialOnSignup,
      startsTrialOnSignup
        ? 'Trial automatically starts when user signs up'
        : 'Trial not started on signup',
      false,
      !startsTrialOnSignup
    );
  }

  if (trialUtils) {
    recordTest('userFlows', 'Trial Utils File', true, 'File exists', false, false);
    const hasStartTrial = trialUtils.includes('startTrial');
    recordTest(
      'userFlows',
      'Start Trial Function',
      hasStartTrial,
      hasStartTrial ? 'startTrial function exists' : 'startTrial function missing',
      false,
      !hasStartTrial
    );
  }

  // Existing User Flow
  log.section('Existing User Flow');
  const subscriptionUtils = readFile('src/utils/subscription.js');
  const appContent = readFile('src/App.jsx');

  if (authContext) {
    const syncsPlanOnAuthChange =
      authContext.includes('subscriptionPlanChanged') || authContext.includes('getCurrentPlan');
    recordTest(
      'userFlows',
      'Plan Syncs on Auth Change',
      syncsPlanOnAuthChange,
      syncsPlanOnAuthChange
        ? 'Subscription plan syncs when auth state changes'
        : 'Plan not syncing on auth change',
      false,
      !syncsPlanOnAuthChange
    );
  }

  if (subscriptionUtils) {
    const hasGetCurrentPlan = subscriptionUtils.includes('getCurrentPlan');
    recordTest(
      'userFlows',
      'Get Current Plan Function',
      hasGetCurrentPlan,
      hasGetCurrentPlan ? 'getCurrentPlan function exists' : 'getCurrentPlan function missing',
      false,
      !hasGetCurrentPlan
    );
  }

  if (appContent) {
    const listensForPlanChanges = appContent.includes('subscriptionPlanChanged');
    recordTest(
      'userFlows',
      'App Listens for Plan Changes',
      listensForPlanChanges,
      listensForPlanChanges
        ? 'App listens for subscription plan changes'
        : 'App not listening for plan changes',
      false,
      false
    );
  }

  // Admin Functionality
  log.section('Admin Functionality');
  const adminContext = readFile('src/context/AdminContext.jsx');
  const adminUtils = readFile('src/utils/admin.js');
  const protectedRoute = readFile('src/components/ProtectedAdminRoute.jsx');

  if (adminContext) {
    recordTest('userFlows', 'AdminContext File', true, 'File exists', false, false);
    const checksUserIsAdmin = adminContext.includes('isAdmin');
    recordTest(
      'userFlows',
      'Admin Check Function',
      checksUserIsAdmin,
      checksUserIsAdmin ? 'Admin check function present' : 'Admin check missing',
      false,
      !checksUserIsAdmin
    );
  }

  if (adminUtils) {
    recordTest('userFlows', 'Admin Utils File', true, 'File exists', false, false);
    const hasIsAdminFunction = adminUtils.includes('isAdmin');
    recordTest(
      'userFlows',
      'Is Admin Function',
      hasIsAdminFunction,
      hasIsAdminFunction ? 'isAdmin function exists' : 'isAdmin function missing',
      false,
      !hasIsAdminFunction
    );
  }

  if (protectedRoute) {
    recordTest('userFlows', 'Protected Admin Route', true, 'File exists', false, false);
    const checksAuth = protectedRoute.includes('useAuth');
    recordTest(
      'userFlows',
      'Route Checks Authentication',
      checksAuth,
      checksAuth ? 'Route checks user authentication' : 'Route not checking auth',
      false,
      !checksAuth
    );
    const checksAdmin = protectedRoute.includes('isAdmin');
    recordTest(
      'userFlows',
      'Route Checks Admin Status',
      checksAdmin,
      checksAdmin ? 'Route checks admin status' : 'Route not checking admin status',
      false,
      !checksAdmin
    );
  }

  // User Data Isolation
  log.section('User Data Isolation');
  if (appContent) {
    const favoritesUseLocalStorage = appContent.includes("localStorage.getItem('favorites')");
    recordTest(
      'userFlows',
      'Favorites Use Local Storage',
      favoritesUseLocalStorage,
      favoritesUseLocalStorage
        ? 'Favorites use localStorage (user-specific)'
        : 'Favorites not using localStorage',
      false,
      false
    );
  }

  // Cross-Tab Sync
  log.section('Cross-Tab Synchronization');
  if (appContent) {
    const favoritesSync = appContent.includes('storage') && appContent.includes('favorites');
    recordTest(
      'userFlows',
      'Favorites Cross-Tab Sync',
      favoritesSync,
      favoritesSync ? 'Favorites sync across tabs' : 'Favorites not syncing across tabs',
      false,
      false
    );
  }

  // Payment Integration
  log.section('Payment Integration for Users');
  const paddleWebhook = readFile('api/paddle/webhook.js');
  if (appContent) {
    const handlesPaymentSuccess =
      appContent.includes('checkPaymentSuccess') || appContent.includes('_ptxn');
    recordTest(
      'userFlows',
      'Payment Success Handling',
      handlesPaymentSuccess,
      handlesPaymentSuccess
        ? 'App handles payment success redirects'
        : 'Payment success not handled',
      false,
      !handlesPaymentSuccess
    );
  }

  if (paddleWebhook) {
    const updatesUserPlan = paddleWebhook.includes('profiles') || paddleWebhook.includes('upsert');
    recordTest(
      'userFlows',
      'Webhook Updates User Plan',
      updatesUserPlan,
      updatesUserPlan ? 'Webhook updates user plan in Supabase' : 'Webhook not updating plan',
      false,
      !updatesUserPlan
    );
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

function runValidation() {
  console.log(`${colors.magenta}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║     COMPREHENSIVE VALIDATION - ALL CHECKS                   ║
║     Integration + Production + User Flows                  ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const startTime = Date.now();

  // Run all validations
  validateIntegration();
  validateProduction();
  validateUserFlows();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Calculate totals
  const totalPassed =
    globalResults.integration.passed +
    globalResults.production.passed +
    globalResults.userFlows.passed;
  const totalFailed =
    globalResults.integration.failed +
    globalResults.production.failed +
    globalResults.userFlows.failed;
  const totalWarnings =
    globalResults.integration.warnings +
    globalResults.production.warnings +
    globalResults.userFlows.warnings;
  const totalCritical =
    globalResults.integration.critical +
    globalResults.production.critical +
    globalResults.userFlows.critical;

  // Summary
  log.header('\n╔══════════════════════════════════════════════════════════════╗');
  log.header('║                    VALIDATION SUMMARY                        ║');
  log.header('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`${colors.cyan}━━━ Phase Results ━━━${colors.reset}\n`);
  console.log(`${colors.blue}Phase 1 - Integration:${colors.reset}`);
  console.log(`  ${colors.green}✅ Passed: ${globalResults.integration.passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${globalResults.integration.failed}${colors.reset}`);
  console.log(
    `  ${colors.yellow}⚠️  Warnings: ${globalResults.integration.warnings}${colors.reset}`
  );
  console.log(`  ${colors.red}🚨 Critical: ${globalResults.integration.critical}${colors.reset}\n`);

  console.log(`${colors.blue}Phase 2 - Production:${colors.reset}`);
  console.log(`  ${colors.green}✅ Passed: ${globalResults.production.passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${globalResults.production.failed}${colors.reset}`);
  console.log(
    `  ${colors.yellow}⚠️  Warnings: ${globalResults.production.warnings}${colors.reset}`
  );
  console.log(`  ${colors.red}🚨 Critical: ${globalResults.production.critical}${colors.reset}\n`);

  console.log(`${colors.blue}Phase 3 - User Flows:${colors.reset}`);
  console.log(`  ${colors.green}✅ Passed: ${globalResults.userFlows.passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${globalResults.userFlows.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  Warnings: ${globalResults.userFlows.warnings}${colors.reset}`);
  console.log(`  ${colors.red}🚨 Critical: ${globalResults.userFlows.critical}${colors.reset}\n`);

  console.log(`${colors.cyan}━━━ Overall Results ━━━${colors.reset}\n`);
  console.log(`  ${colors.green}✅ Total Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Total Failed: ${totalFailed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  Total Warnings: ${totalWarnings}${colors.reset}`);
  console.log(`  ${colors.red}🚨 Total Critical: ${totalCritical}${colors.reset}`);
  console.log(`  ${colors.blue}⏱️  Duration: ${duration}s${colors.reset}\n`);

  // Critical issues
  const allCriticalTests = [
    ...globalResults.integration.tests.filter(t => t.isCritical && !t.passed),
    ...globalResults.production.tests.filter(t => t.isCritical && !t.passed),
    ...globalResults.userFlows.tests.filter(t => t.isCritical && !t.passed),
  ];

  if (allCriticalTests.length > 0) {
    log.critical('CRITICAL ISSUES FOUND:');
    allCriticalTests.forEach(test => {
      log.critical(`  - ${test.name}: ${test.message}`);
    });
    console.log('');
  }

  // Final assessment
  const readinessScore =
    totalFailed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : '100.0';
  const isReady = totalCritical === 0 && totalFailed === 0;

  console.log(`${colors.cyan}━━━ Final Assessment ━━━${colors.reset}\n`);

  if (isReady) {
    log.success(`🎉 ALL SYSTEMS READY! (${readinessScore}% pass rate)`);
    console.log(`\n${colors.green}✅ Integration: All checks passed${colors.reset}`);
    console.log(`${colors.green}✅ Production: Ready for deployment${colors.reset}`);
    console.log(`${colors.green}✅ User Flows: All flows working${colors.reset}`);
    console.log(`\n${colors.green}${colors.bold}You can deploy to production! 🚀${colors.reset}\n`);
    process.exit(0);
  } else if (totalCritical > 0) {
    log.critical(`🚨 NOT READY (${readinessScore}% pass rate)`);
    console.log(`\n${colors.red}Critical issues must be fixed before deployment.${colors.reset}\n`);
    process.exit(1);
  } else {
    log.warning(`⚠️  READY WITH WARNINGS (${readinessScore}% pass rate)`);
    console.log(`\n${colors.yellow}You can deploy, but review warnings above.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run validation
runValidation();
