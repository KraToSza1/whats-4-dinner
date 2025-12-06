#!/usr/bin/env node

/**
 * Comprehensive Feature Testing Script
 *
 * Tests all features programmatically without browser automation.
 * This complements the E2E tests by validating code paths and logic.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const results = {
  passed: [],
  failed: [],
  total: 0,
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed.push(name);
    log(`✅ ${name}`, 'green');
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`❌ ${name}: ${error.message}`, 'red');
  }
}

// Test: All routes are defined
function testRoutes() {
  log('\n📋 Testing Routes...', 'blue');

  const appFile = readFileSync(join(rootDir, 'src/App.jsx'), 'utf-8');

  const routes = [
    '/meal-planner',
    '/profile',
    '/favorites',
    '/collections',
    '/analytics',
    '/help',
    '/terms',
    '/privacy',
    '/calorie-tracker',
    '/water-tracker',
    '/meal-reminders',
    '/budget-tracker',
    '/pantry',
    '/recipe/:id',
    '/family-plan',
    '/billing',
  ];

  routes.forEach(route => {
    test(`Route ${route} is defined`, () => {
      // Check for route with or without colon (e.g., /recipe/:id or /recipe/id or RecipePage)
      const routePattern = route.replace(':', '').replace('/', '');
      const hasRoute =
        appFile.includes(route) ||
        appFile.includes(routePattern) ||
        (route.includes('recipe') && appFile.includes('RecipePage'));
      if (!hasRoute) {
        throw new Error(`Route ${route} not found in App.jsx`);
      }
    });
  });
}

// Test: All context providers are set up
function testContextProviders() {
  log('\n📋 Testing Context Providers...', 'blue');

  const mainFile = readFileSync(join(rootDir, 'src/main.jsx'), 'utf-8');
  const appFile = readFileSync(join(rootDir, 'src/App.jsx'), 'utf-8');

  const providers = [
    { name: 'AuthProvider', file: mainFile },
    { name: 'AdminProvider', file: mainFile },
    { name: 'LanguageProvider', file: mainFile },
    { name: 'ToastProvider', file: mainFile },
    { name: 'FilterProvider', file: mainFile },
    { name: 'GroceryListProvider', file: appFile }, // This one is in App.jsx
  ];

  providers.forEach(({ name, file }) => {
    test(`Context provider ${name} is set up`, () => {
      if (!file.includes(name)) {
        throw new Error(`Provider ${name} not found`);
      }
    });
  });
}

// Test: All pages exist
function testPagesExist() {
  log('\n📋 Testing Pages...', 'blue');

  const pages = [
    'RecipePage.jsx',
    'MealPlanner.jsx',
    'Profile.jsx',
    'FamilyPlan.jsx',
    'Collections.jsx',
    'Help.jsx',
    'Terms.jsx',
    'Privacy.jsx',
    'Analytics.jsx',
    'SharedRecipePage.jsx',
    'BillingManagement.jsx',
    'Favorites.jsx',
    'MealRemindersPage.jsx',
    'BudgetTrackerPage.jsx',
    'WaterTrackerPage.jsx',
    'DieticianAIPage.jsx',
    'CalorieTrackerPage.jsx',
    'PantryPage.jsx',
  ];

  pages.forEach(page => {
    test(`Page ${page} exists`, () => {
      try {
        readFileSync(join(rootDir, 'src/pages', page), 'utf-8');
      } catch {
        throw new Error(`Page file ${page} not found`);
      }
    });
  });
}

// Test: Key components exist
function testComponentsExist() {
  log('\n📋 Testing Components...', 'blue');

  const components = [
    'Header.jsx',
    'SearchForm.jsx',
    'RecipeCard.jsx',
    'Filters.jsx',
    'GroceryDrawer.jsx',
    'DailyRecipe.jsx',
    'Pagination.jsx',
    'BackToTop.jsx',
    'InstallPWA.jsx',
  ];

  components.forEach(component => {
    test(`Component ${component} exists`, () => {
      try {
        readFileSync(join(rootDir, 'src/components', component), 'utf-8');
      } catch {
        throw new Error(`Component file ${component} not found`);
      }
    });
  });
}

// Test: API functions exist
function testAPIFunctions() {
  log('\n📋 Testing API Functions...', 'blue');

  try {
    const apiFile = readFileSync(join(rootDir, 'src/api/supabaseRecipes.js'), 'utf-8');

    test('searchSupabaseRecipes function exists', () => {
      if (!apiFile.includes('searchSupabaseRecipes')) {
        throw new Error('searchSupabaseRecipes function not found');
      }
    });

    test('API uses proper error handling', () => {
      if (!apiFile.includes('try') || !apiFile.includes('catch')) {
        throw new Error('API missing error handling');
      }
    });
  } catch (error) {
    test('API file exists', () => {
      throw error;
    });
  }
}

// Test: Utility functions exist
function testUtilityFunctions() {
  log('\n📋 Testing Utility Functions...', 'blue');

  const utilities = [
    { file: 'subscription.js', functions: ['getCurrentPlan', 'shouldShowAds'] },
    { file: 'medicalConditions.js', functions: ['getActiveMedicalConditions'] },
    { file: 'trial.js', functions: ['startTrial', 'getTrialDaysRemaining'] },
  ];

  utilities.forEach(({ file, functions }) => {
    try {
      const content = readFileSync(join(rootDir, 'src/utils', file), 'utf-8');
      functions.forEach(fn => {
        test(`Utility ${file} exports ${fn}`, () => {
          if (!content.includes(fn)) {
            throw new Error(`Function ${fn} not found in ${file}`);
          }
        });
      });
    } catch (error) {
      test(`Utility file ${file} exists`, () => {
        throw error;
      });
    }
  });
}

// Test: Environment variables are documented
function testEnvironmentVariables() {
  log('\n📋 Testing Environment Configuration...', 'blue');

  try {
    const envExample = readFileSync(join(rootDir, '.env.example'), 'utf-8').catch(() => '');
    const readme = readFileSync(join(rootDir, 'README.md'), 'utf-8').catch(() => '');

    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_PADDLE_PUBLIC_TOKEN',
    ];

    requiredVars.forEach(varName => {
      test(`Environment variable ${varName} is documented`, () => {
        const documented = envExample.includes(varName) || readme.includes(varName);
        if (!documented) {
          throw new Error(`${varName} not documented in .env.example or README.md`);
        }
      });
    });
  } catch {
    // Skip if files don't exist
  }
}

// Test: PWA configuration
function testPWAConfig() {
  log('\n📋 Testing PWA Configuration...', 'blue');

  try {
    const viteConfig = readFileSync(join(rootDir, 'vite.config.js'), 'utf-8');
    const manifest = readFileSync(join(rootDir, 'public/manifest.json'), 'utf-8');
    const indexHtml = readFileSync(join(rootDir, 'index.html'), 'utf-8');

    test('VitePWA plugin is configured', () => {
      if (!viteConfig.includes('VitePWA')) {
        throw new Error('VitePWA plugin not found in vite.config.js');
      }
    });

    test('Manifest file exists', () => {
      if (!manifest.includes('name') || !manifest.includes('icons')) {
        throw new Error('Manifest file is invalid');
      }
    });

    test('Manifest is linked in index.html', () => {
      if (!indexHtml.includes('manifest')) {
        throw new Error('Manifest not linked in index.html');
      }
    });

    test('InstallPWA component exists', () => {
      try {
        readFileSync(join(rootDir, 'src/components/InstallPWA.jsx'), 'utf-8');
      } catch {
        throw new Error('InstallPWA component not found');
      }
    });
  } catch (error) {
    test('PWA configuration check', () => {
      throw error;
    });
  }
}

// Test: Error boundaries
function testErrorHandling() {
  log('\n📋 Testing Error Handling...', 'blue');

  try {
    const errorBoundary = readFileSync(join(rootDir, 'src/ErrorBoundary.jsx'), 'utf-8');

    test('ErrorBoundary component exists', () => {
      if (
        !errorBoundary.includes('componentDidCatch') &&
        !errorBoundary.includes('ErrorBoundary')
      ) {
        throw new Error('ErrorBoundary not properly implemented');
      }
    });

    test('ErrorBoundary is used in main.jsx', () => {
      const mainFile = readFileSync(join(rootDir, 'src/main.jsx'), 'utf-8');
      if (!mainFile.includes('ErrorBoundary')) {
        throw new Error('ErrorBoundary not used in main.jsx');
      }
    });
  } catch (error) {
    test('Error handling setup', () => {
      throw error;
    });
  }
}

// Run all tests
async function runTests() {
  log('\n🧪 Starting Comprehensive Feature Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');

  testRoutes();
  testContextProviders();
  testPagesExist();
  testComponentsExist();
  testAPIFunctions();
  testUtilityFunctions();
  testEnvironmentVariables();
  testPWAConfig();
  testErrorHandling();

  // Print results
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Test Results Summary\n', 'blue');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`✅ Passed: ${results.passed.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, 'red');

  if (results.failed.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.failed.forEach(({ name, error }) => {
      log(`   - ${name}`, 'red');
      log(`     ${error}`, 'red');
    });
  }

  const successRate = ((results.passed.length / results.total) * 100).toFixed(1);
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');

  if (results.failed.length === 0) {
    log('\n🎉 All tests passed!', 'green');
    return 0;
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    return 1;
  }
}

runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
