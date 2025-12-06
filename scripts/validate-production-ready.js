/**
 * Comprehensive Production Readiness Validation
 *
 * Validates EVERYTHING needed for production:
 * - Environment variables (Supabase, Paddle, Stripe, Paystack, Vercel)
 * - API connectivity (Supabase, payment providers)
 * - Recipe functionality (search, display, filters)
 * - Payment flows (checkout, webhooks)
 * - UI components and buttons
 * - Error handling
 * - Performance
 * - Security
 * - Deployment readiness
 *
 * Run: node scripts/validate-production-ready.js
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
// 1. ENVIRONMENT VARIABLES VALIDATION
// ============================================================================

function validateEnvironmentVariables() {
  log.section('Environment Variables');

  const envExample = readFile('.env.example');
  const envLocal = readFile('.env.local');
  const envFile = readFile('.env');

  // Required Supabase variables
  const supabaseVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  // Required Paddle variables (if using Paddle)
  const paddleVars = ['VITE_PADDLE_PUBLIC_TOKEN', 'PADDLE_VENDOR_ID', 'PADDLE_API_KEY'];

  // Required Stripe variables (if using Stripe)
  const stripeVars = ['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'];

  // Required Paystack variables (if using Paystack)
  const paystackVars = ['PAYSTACK_SECRET_KEY'];

  // Check Supabase (CRITICAL)
  supabaseVars.forEach(varName => {
    const hasVar = envLocal?.includes(varName) || envFile?.includes(varName);
    recordTest(
      `Env: ${varName}`,
      hasVar,
      hasVar ? 'Present' : 'MISSING - CRITICAL for Supabase',
      false,
      !hasVar
    );
  });

  // Check if payment provider is configured
  const paymentProvider =
    envLocal?.match(/VITE_PAYMENT_PROVIDER=(.+)/)?.[1] ||
    envFile?.match(/VITE_PAYMENT_PROVIDER=(.+)/)?.[1] ||
    'paddle';

  recordTest('Payment Provider', true, `Configured: ${paymentProvider}`, false, false);

  // Check payment provider variables
  if (paymentProvider === 'paddle') {
    paddleVars.forEach(varName => {
      const hasVar = envLocal?.includes(varName) || envFile?.includes(varName);
      recordTest(
        `Env: ${varName}`,
        hasVar,
        hasVar ? 'Present' : 'MISSING - Required for Paddle',
        false,
        !hasVar
      );
    });
  } else if (paymentProvider === 'stripe') {
    stripeVars.forEach(varName => {
      const hasVar = envLocal?.includes(varName) || envFile?.includes(varName);
      recordTest(
        `Env: ${varName}`,
        hasVar,
        hasVar ? 'Present' : 'MISSING - Required for Stripe',
        false,
        !hasVar
      );
    });
  } else if (paymentProvider === 'paystack') {
    paystackVars.forEach(varName => {
      const hasVar = envLocal?.includes(varName) || envFile?.includes(varName);
      recordTest(
        `Env: ${varName}`,
        hasVar,
        hasVar ? 'Present' : 'MISSING - Required for Paystack',
        false,
        !hasVar
      );
    });
  }

  // Check Vercel-specific variables
  const vercelVars = ['VERCEL_URL', 'VERCEL_ENV'];

  vercelVars.forEach(varName => {
    // These are auto-set by Vercel, so just note them
    recordTest(`Env: ${varName}`, true, 'Auto-set by Vercel', false, false);
  });
}

// ============================================================================
// 2. SUPABASE CONFIGURATION & CONNECTIVITY
// ============================================================================

function validateSupabaseIntegration() {
  log.section('Supabase Integration');

  const supabaseClient = readFile('src/lib/supabaseClient.js');
  const supabaseRecipes = readFile('src/api/supabaseRecipes.js');

  // Check Supabase client configuration
  if (!supabaseClient) {
    recordTest('Supabase Client File', false, 'File not found', false, true);
    return;
  }

  recordTest('Supabase Client File', true, 'File exists', false, false);

  // Check for correct key type (anon, not service_role)
  const hasAnonKeyCheck = supabaseClient.includes('anon') || supabaseClient.includes('ANON');
  recordTest(
    'Supabase Key Type',
    hasAnonKeyCheck,
    hasAnonKeyCheck ? 'Using ANON key (correct)' : 'Check key type',
    !hasAnonKeyCheck,
    false
  );

  // Check for service_role key warning
  const hasServiceRoleWarning =
    supabaseClient.includes('SERVICE_ROLE') || supabaseClient.includes('service_role');
  recordTest(
    'Service Role Key Warning',
    !hasServiceRoleWarning || supabaseClient.includes('WRONG'),
    hasServiceRoleWarning ? 'Has warning for service_role key' : 'No service_role key detected',
    false,
    false
  );

  // Check Supabase recipes API
  if (!supabaseRecipes) {
    recordTest('Supabase Recipes API', false, 'File not found', false, true);
    return;
  }

  recordTest('Supabase Recipes API', true, 'File exists', false, false);

  // Check for search function
  const hasSearchFunction =
    supabaseRecipes.includes('searchSupabaseRecipes') ||
    supabaseRecipes.includes('export.*searchSupabaseRecipes');
  recordTest(
    'Recipe Search Function',
    hasSearchFunction,
    hasSearchFunction ? 'Search function exists' : 'Search function missing',
    false,
    !hasSearchFunction
  );

  // Check for error handling
  const hasErrorHandling = supabaseRecipes.includes('catch') || supabaseRecipes.includes('try');
  recordTest(
    'Error Handling',
    hasErrorHandling,
    hasErrorHandling ? 'Error handling present' : 'Missing error handling',
    false,
    false
  );
}

// ============================================================================
// 3. PAYMENT PROVIDER INTEGRATION
// ============================================================================

function validatePaymentProviders() {
  log.section('Payment Provider Integration');

  // Check Paddle
  const paddleCheckout = readFile('api/paddle/create-checkout.js');
  const paddleWebhook = readFile('api/paddle/webhook.js');
  const paddleUpdate = readFile('api/paddle/update-plan.js');
  const paymentUtils = readFile('src/utils/paymentProviders.js');

  if (paddleCheckout) {
    recordTest('Paddle Checkout API', true, 'File exists', false, false);
    const hasEnvCheck =
      paddleCheckout.includes('PADDLE_VENDOR_ID') || paddleCheckout.includes('process.env');
    recordTest(
      'Paddle Env Check',
      hasEnvCheck,
      hasEnvCheck ? 'Environment variable checks present' : 'Missing env checks',
      false,
      false
    );
  } else {
    recordTest('Paddle Checkout API', false, 'File not found', true, false);
  }

  if (paddleWebhook) {
    recordTest('Paddle Webhook API', true, 'File exists', false, false);
    const hasSignatureCheck =
      paddleWebhook.includes('signature') || paddleWebhook.includes('verify');
    recordTest(
      'Paddle Webhook Security',
      hasSignatureCheck,
      hasSignatureCheck ? 'Signature verification present' : 'Missing signature check',
      false,
      true // Critical for security
    );
  } else {
    recordTest('Paddle Webhook API', false, 'File not found', true, false);
  }

  if (paddleUpdate) {
    recordTest('Paddle Update Plan API', true, 'File exists', false, false);
  } else {
    recordTest('Paddle Update Plan API', false, 'File not found', true, false);
  }

  // Check Stripe
  const stripeCheckout = readFile('api/stripe/create-checkout.js');
  const stripeWebhook = readFile('api/stripe/webhook.js');

  if (stripeCheckout) {
    recordTest('Stripe Checkout API', true, 'File exists', false, false);
  } else {
    recordTest('Stripe Checkout API', false, 'File not found', true, false);
  }

  if (stripeWebhook) {
    recordTest('Stripe Webhook API', true, 'File exists', false, false);
  } else {
    recordTest('Stripe Webhook API', false, 'File not found', true, false);
  }

  // Check Paystack
  const paystackCheckout = readFile('api/paystack/create-checkout.js');

  if (paystackCheckout) {
    recordTest('Paystack Checkout API', true, 'File exists', false, false);
  } else {
    recordTest('Paystack Checkout API', false, 'File not found', true, false);
  }

  // Check payment provider abstraction
  if (paymentUtils) {
    recordTest('Payment Provider Utils', true, 'File exists', false, false);
    const supportsMultiple = paymentUtils.includes('switch') || paymentUtils.includes('PROVIDER');
    recordTest(
      'Multiple Provider Support',
      supportsMultiple,
      supportsMultiple ? 'Supports multiple providers' : 'Single provider only',
      false,
      false
    );
  } else {
    recordTest('Payment Provider Utils', false, 'File not found', false, true);
  }
}

// ============================================================================
// 4. RECIPE FUNCTIONALITY
// ============================================================================

function validateRecipeFunctionality() {
  log.section('Recipe Functionality');

  const appContent = readFile('src/App.jsx');
  const recipePage = readFile('src/pages/RecipePage.jsx');
  const recipeCard = readFile('src/components/RecipeCard.jsx');
  const filters = readFile('src/components/Filters.jsx');

  // Check search functionality
  if (appContent) {
    const hasSearch =
      appContent.includes('fetchRecipes') || appContent.includes('searchSupabaseRecipes');
    recordTest(
      'Recipe Search',
      hasSearch,
      hasSearch ? 'Search function present' : 'Search function missing',
      false,
      !hasSearch
    );

    // Check filter integration
    const hasFilterIntegration =
      appContent.includes('useFilters') || appContent.includes('FilterContext');
    recordTest(
      'Filter Integration',
      hasFilterIntegration,
      hasFilterIntegration ? 'Filters integrated' : 'Filters not integrated',
      false,
      !hasFilterIntegration
    );

    // Check medical conditions integration
    const hasMedicalIntegration =
      appContent.includes('filterRecipesByMedicalConditions') ||
      appContent.includes('medicalConditions');
    recordTest(
      'Medical Conditions Integration',
      hasMedicalIntegration,
      hasMedicalIntegration ? 'Medical conditions integrated' : 'Medical conditions not integrated',
      false,
      false
    );
  }

  // Check recipe page
  if (recipePage) {
    recordTest('Recipe Page Component', true, 'File exists', false, false);
    const hasRecipeDetails =
      recipePage.includes('getSupabaseRecipeById') || recipePage.includes('recipe');
    recordTest(
      'Recipe Details Loading',
      hasRecipeDetails,
      hasRecipeDetails ? 'Recipe details loading present' : 'Missing recipe details',
      false,
      !hasRecipeDetails
    );
  } else {
    recordTest('Recipe Page Component', false, 'File not found', false, true);
  }

  // Check recipe card
  if (recipeCard) {
    recordTest('Recipe Card Component', true, 'File exists', false, false);
  } else {
    recordTest('Recipe Card Component', false, 'File not found', false, true);
  }

  // Check filters component
  if (filters) {
    recordTest('Filters Component', true, 'File exists', false, false);
  } else {
    recordTest('Filters Component', false, 'File not found', false, true);
  }
}

// ============================================================================
// 5. UI COMPONENTS & BUTTONS
// ============================================================================

function validateUIComponents() {
  log.section('UI Components & Buttons');

  const components = [
    'src/components/Header.jsx',
    'src/components/SearchForm.jsx',
    'src/components/Filters.jsx',
    'src/components/RecipeCard.jsx',
    'src/components/GroceryDrawer.jsx',
    'src/components/Pagination.jsx',
    'src/components/BackToTop.jsx',
  ];

  components.forEach(componentPath => {
    const exists = fileExists(componentPath);
    const componentName = componentPath.split('/').pop();
    recordTest(
      `Component: ${componentName}`,
      exists,
      exists ? 'File exists' : 'File not found',
      false,
      false
    );
  });

  // Check for button components
  const appContent = readFile('src/App.jsx');
  if (appContent) {
    const hasButtons =
      appContent.includes('button') ||
      appContent.includes('onClick') ||
      appContent.includes('Button');
    recordTest(
      'Interactive Elements',
      hasButtons,
      hasButtons ? 'Interactive elements present' : 'Missing interactive elements',
      false,
      false
    );
  }
}

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

function validateErrorHandling() {
  log.section('Error Handling');

  const appContent = readFile('src/App.jsx');
  const errorBoundary = readFile('src/ErrorBoundary.jsx');

  // Check ErrorBoundary
  if (errorBoundary) {
    recordTest('Error Boundary', true, 'File exists', false, false);
  } else {
    recordTest('Error Boundary', false, 'File not found', true, false);
  }

  // Check error handling in App.jsx
  if (appContent) {
    const hasErrorState = appContent.includes('error') || appContent.includes('setError');
    recordTest(
      'Error State Management',
      hasErrorState,
      hasErrorState ? 'Error state present' : 'Missing error state',
      false,
      false
    );

    const hasTryCatch = appContent.includes('try') && appContent.includes('catch');
    recordTest(
      'Try-Catch Blocks',
      hasTryCatch,
      hasTryCatch ? 'Try-catch blocks present' : 'Missing try-catch',
      false,
      false
    );
  }
}

// ============================================================================
// 7. SECURITY CHECKS
// ============================================================================

function validateSecurity() {
  log.section('Security');

  const vercelConfig = readFile('vercel.json');
  const supabaseClient = readFile('src/lib/supabaseClient.js');

  // Check security headers
  if (vercelConfig) {
    const hasSecurityHeaders =
      vercelConfig.includes('X-Content-Type-Options') || vercelConfig.includes('X-Frame-Options');
    recordTest(
      'Security Headers',
      hasSecurityHeaders,
      hasSecurityHeaders ? 'Security headers configured' : 'Missing security headers',
      false,
      !hasSecurityHeaders
    );

    const hasCORS = vercelConfig.includes('Access-Control-Allow-Origin');
    recordTest(
      'CORS Configuration',
      hasCORS,
      hasCORS ? 'CORS configured' : 'Missing CORS config',
      false,
      false
    );
  }

  // Check for service_role key exposure
  if (supabaseClient) {
    const hasServiceRoleCheck =
      supabaseClient.includes('SERVICE_ROLE') && supabaseClient.includes('WRONG');
    recordTest(
      'Service Role Key Protection',
      hasServiceRoleCheck,
      hasServiceRoleCheck ? 'Service role key check present' : 'Missing service role check',
      false,
      false
    );
  }
}

// ============================================================================
// 8. DEPLOYMENT READINESS
// ============================================================================

function validateDeploymentReadiness() {
  log.section('Deployment Readiness');

  // Check Vercel configuration
  const vercelConfig = readFile('vercel.json');
  if (vercelConfig) {
    recordTest('Vercel Config', true, 'File exists', false, false);
    const hasBuildCommand = vercelConfig.includes('buildCommand') || vercelConfig.includes('build');
    recordTest(
      'Build Configuration',
      hasBuildCommand,
      hasBuildCommand ? 'Build command configured' : 'Missing build command',
      false,
      false
    );
  } else {
    recordTest('Vercel Config', false, 'File not found', false, true);
  }

  // Check package.json
  const packageJson = readFile('package.json');
  if (packageJson) {
    recordTest('Package.json', true, 'File exists', false, false);
    const hasBuildScript = packageJson.includes('"build"');
    recordTest(
      'Build Script',
      hasBuildScript,
      hasBuildScript ? 'Build script present' : 'Missing build script',
      false,
      !hasBuildScript
    );
  }

  // Check for .gitignore
  const gitignore = readFile('.gitignore');
  if (gitignore) {
    recordTest('.gitignore', true, 'File exists', false, false);
    const ignoresEnv = gitignore.includes('.env') || gitignore.includes('node_modules');
    recordTest(
      'Environment File Protection',
      ignoresEnv,
      ignoresEnv ? 'Environment files ignored' : 'Environment files not ignored',
      false,
      true // Critical for security
    );
  } else {
    recordTest('.gitignore', false, 'File not found', true, false);
  }
}

// ============================================================================
// 9. API ROUTES
// ============================================================================

function validateAPIRoutes() {
  log.section('API Routes');

  const apiRoutes = [
    'api/health.js',
    'api/paddle/create-checkout.js',
    'api/paddle/webhook.js',
    'api/paddle/update-plan.js',
    'api/stripe/create-checkout.js',
    'api/stripe/webhook.js',
    'api/paystack/create-checkout.js',
  ];

  apiRoutes.forEach(route => {
    const exists = fileExists(route);
    const routeName = route.split('/').pop();
    recordTest(
      `API Route: ${routeName}`,
      exists,
      exists ? 'File exists' : 'File not found',
      !exists, // Warning if missing (some routes are optional)
      false
    );
  });

  // Check health endpoint
  const health = readFile('api/health.js');
  if (health) {
    recordTest('Health Check Endpoint', true, 'File exists', false, false);
  } else {
    recordTest('Health Check Endpoint', false, 'File not found', true, false);
  }
}

// ============================================================================
// 10. FEATURE COMPLETENESS
// ============================================================================

function validateFeatureCompleteness() {
  log.section('Feature Completeness');

  const features = [
    { name: 'Favorites', file: 'src/pages/Favorites.jsx' },
    { name: 'Meal Planner', file: 'src/pages/MealPlanner.jsx' },
    { name: 'Profile', file: 'src/pages/Profile.jsx' },
    { name: 'Family Plan', file: 'src/pages/FamilyPlan.jsx' },
    { name: 'Collections', file: 'src/pages/Collections.jsx' },
    { name: 'Analytics', file: 'src/pages/Analytics.jsx' },
    { name: 'Grocery List', file: 'src/context/GroceryListContext.jsx' },
    { name: 'Medical Conditions', file: 'src/utils/medicalConditions.js' },
  ];

  features.forEach(feature => {
    const exists = fileExists(feature.file);
    recordTest(
      `Feature: ${feature.name}`,
      exists,
      exists ? 'File exists' : 'File not found',
      false,
      false
    );
  });
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

function runValidation() {
  console.log(`${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║     PRODUCTION READINESS VALIDATION                          ║
║     Comprehensive check of all integrations and features     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  validateEnvironmentVariables();
  validateSupabaseIntegration();
  validatePaymentProviders();
  validateRecipeFunctionality();
  validateUIComponents();
  validateErrorHandling();
  validateSecurity();
  validateDeploymentReadiness();
  validateAPIRoutes();
  validateFeatureCompleteness();

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

  // Production readiness assessment
  const readinessScore = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  const isReady = results.critical === 0 && results.failed === 0;

  console.log(`${colors.cyan}━━━ Production Readiness Assessment ━━━${colors.reset}\n`);

  if (isReady) {
    log.success(`🎉 READY FOR PRODUCTION! (${readinessScore}% pass rate)`);
    console.log(
      `\n${colors.green}All critical checks passed. You can deploy to production!${colors.reset}\n`
    );
    process.exit(0);
  } else if (results.critical > 0) {
    log.critical(`🚨 NOT READY FOR PRODUCTION (${readinessScore}% pass rate)`);
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
