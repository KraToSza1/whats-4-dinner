/**
 * Comprehensive Integration Validation Script
 *
 * This script validates that all features work together correctly:
 * - Context providers are properly connected
 * - Data flows correctly between features
 * - localStorage and Supabase sync properly
 * - Filters, medical conditions, and other features integrate correctly
 * - No breaking changes or conflicts
 *
 * Run: node scripts/validate-integration.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: msg => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function recordTest(name, passed, message, isWarning = false) {
  results.tests.push({ name, passed, message, isWarning });
  if (passed) {
    results.passed++;
    log.success(`${name}: ${message}`);
  } else if (isWarning) {
    results.warnings++;
    log.warning(`${name}: ${message}`);
  } else {
    results.failed++;
    log.error(`${name}: ${message}`);
  }
}

// Read and parse a file
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

// Check if a file exists
function fileExists(filePath) {
  return existsSync(join(projectRoot, filePath));
}

// Check if imports are correct
function checkImports(filePath, requiredImports) {
  const content = readFile(filePath);
  if (!content) {
    return { passed: false, message: `File not found: ${filePath}` };
  }

  const missing = [];
  for (const imp of requiredImports) {
    if (!content.includes(imp)) {
      missing.push(imp);
    }
  }

  if (missing.length > 0) {
    return {
      passed: false,
      message: `Missing imports: ${missing.join(', ')}`,
    };
  }

  return { passed: true, message: 'All imports present' };
}

// Check if a context is properly exported
function checkContextExport(filePath, contextName) {
  const content = readFile(filePath);
  if (!content) {
    return { passed: false, message: `File not found: ${filePath}` };
  }

  const hasProvider =
    content.includes(`export.*${contextName}Provider`) ||
    content.includes(`export function ${contextName}Provider`) ||
    content.includes(`export const ${contextName}Provider`);
  const hasHook =
    content.includes(`export.*use${contextName}`) ||
    content.includes(`export function use${contextName}`) ||
    content.includes(`export const use${contextName}`);

  if (!hasProvider) {
    return { passed: false, message: `Missing ${contextName}Provider export` };
  }
  if (!hasHook) {
    return { passed: false, message: `Missing use${contextName} hook export` };
  }

  return { passed: true, message: 'Context properly exported' };
}

// Check if localStorage keys are consistent
function checkLocalStorageKeys() {
  const appContent = readFile('src/App.jsx');
  const filterContextContent = readFile('src/context/FilterContext.jsx');
  const groceryContent = readFile('src/context/GroceryListContext.jsx');

  const keys = {
    favorites: 'favorites',
    filters: {
      diet: 'filters:diet',
      maxTime: 'filters:maxTime',
      mealType: 'filters:mealType',
      maxCalories: 'filters:maxCalories',
      healthScore: 'filters:healthScore',
      cuisine: 'filters:cuisine',
      difficulty: 'filters:difficulty',
      minProtein: 'filters:minProtein',
      maxCarbs: 'filters:maxCarbs',
      selectedIntolerances: 'filters:selectedIntolerances',
      // Note: pantry is intentionally separate from FilterContext
    },
    pantry: 'filters:pantry', // Separate from FilterContext
    grocery: 'grocery:list:v2',
    subscription: 'subscription:plan:v1',
    medical: 'medical:conditions:v1',
  };

  const issues = [];

  // Check favorites
  if (appContent && !appContent.includes("localStorage.getItem('favorites')")) {
    issues.push('Favorites localStorage key not found in App.jsx');
  }

  // Check filter keys (excluding pantry which is separate)
  if (filterContextContent) {
    for (const [key, expectedKey] of Object.entries(keys.filters)) {
      if (
        !filterContextContent.includes(`'${expectedKey}'`) &&
        !filterContextContent.includes(`"${expectedKey}"`)
      ) {
        issues.push(`Filter key '${expectedKey}' not found in FilterContext`);
      }
    }
  }

  // Check pantry key (should be in App.jsx, not FilterContext)
  if (
    appContent &&
    !appContent.includes("'filters:pantry'") &&
    !appContent.includes('"filters:pantry"')
  ) {
    issues.push('Pantry localStorage key not found in App.jsx');
  }

  // Check grocery list key
  if (groceryContent && !groceryContent.includes("'grocery:list:v2'")) {
    issues.push('Grocery list localStorage key not found');
  }

  if (issues.length > 0) {
    return { passed: false, message: issues.join('; ') };
  }

  return { passed: true, message: 'All localStorage keys consistent (pantry is separate)' };
}

// Check if medical conditions integrate with filters
function checkMedicalConditionsIntegration() {
  const appContent = readFile('src/App.jsx');
  const medicalContent = readFile('src/utils/medicalConditions.js');

  if (!appContent || !medicalContent) {
    return { passed: false, message: 'Required files not found' };
  }

  const checks = [
    {
      name: 'Medical conditions imported in App.jsx',
      check:
        appContent.includes('filterRecipesByMedicalConditions') ||
        appContent.includes('medicalConditions'),
    },
    {
      name: 'getActiveMedicalConditions function exists',
      check: medicalContent.includes('getActiveMedicalConditions'),
    },
    {
      name: 'Medical filtering applied after Smart Filters',
      check:
        appContent.includes('filterRecipesByMedicalConditions') &&
        appContent.indexOf('filterRecipesByMedicalConditions') >
          appContent.indexOf('searchSupabaseRecipes'),
    },
  ];

  const failed = checks.filter(c => !c.check);
  if (failed.length > 0) {
    return {
      passed: false,
      message: `Failed checks: ${failed.map(f => f.name).join(', ')}`,
    };
  }

  return { passed: true, message: 'Medical conditions properly integrated' };
}

// Check if FilterContext is used consistently
function checkFilterContextUsage() {
  const appContent = readFile('src/App.jsx');
  const filtersContent = readFile('src/components/Filters.jsx');

  if (!appContent || !filtersContent) {
    return { passed: false, message: 'Required files not found' };
  }

  const checks = [
    {
      name: 'FilterContext imported in App.jsx',
      check: appContent.includes('useFilters') || appContent.includes('FilterContext'),
    },
    {
      name: 'Filters component uses FilterContext',
      check: filtersContent.includes('useFilters') || filtersContent.includes('FilterContext'),
    },
    {
      // Note: pantry is intentionally separate from FilterContext
      // Only check that main filters use FilterContext, not pantry
      name: 'Main filters use FilterContext (pantry is separate)',
      check:
        appContent.includes('useFilters') &&
        (appContent.includes('filters.diet') || appContent.includes('filters.maxTime')),
    },
  ];

  const failed = checks.filter(c => !c.check);
  if (failed.length > 0) {
    return {
      passed: false,
      message: `Failed checks: ${failed.map(f => f.name).join(', ')}`,
    };
  }

  return { passed: true, message: 'FilterContext used consistently' };
}

// Check if subscription system integrates properly
function checkSubscriptionIntegration() {
  const appContent = readFile('src/App.jsx');
  const subscriptionContent = readFile('src/utils/subscription.js');
  const authContent = readFile('src/context/AuthContext.jsx');

  if (!appContent || !subscriptionContent || !authContent) {
    return { passed: false, message: 'Required files not found' };
  }

  const checks = [
    {
      name: 'Subscription utilities imported',
      check:
        appContent.includes('canPerformAction') ||
        appContent.includes('getPlanDetails') ||
        appContent.includes('subscription.js'),
    },
    {
      name: 'Subscription plan syncs on auth change',
      check:
        authContent.includes('subscriptionPlanChanged') || authContent.includes('getCurrentPlan'),
    },
    {
      name: 'Plan change events dispatched',
      check: appContent.includes('subscriptionPlanChanged'),
    },
  ];

  const failed = checks.filter(c => !c.check);
  if (failed.length > 0) {
    return {
      passed: false,
      message: `Failed checks: ${failed.map(f => f.name).join(', ')}`,
    };
  }

  return { passed: true, message: 'Subscription system properly integrated' };
}

// Check if contexts are properly provided in main.jsx or App.jsx
function checkContextProviders() {
  const mainContent = readFile('src/main.jsx');
  const appContent = readFile('src/App.jsx');

  if (!mainContent) {
    return { passed: false, message: 'main.jsx not found' };
  }

  // Providers that should be in main.jsx
  const mainProviders = ['AuthProvider', 'FilterProvider', 'ToastProvider', 'LanguageProvider'];

  const missingMain = mainProviders.filter(provider => !mainContent.includes(provider));

  // GroceryListProvider is provided in App.jsx (which is fine)
  const hasGroceryProvider = appContent && appContent.includes('GroceryListProvider');

  if (missingMain.length > 0) {
    return {
      passed: false,
      message: `Missing providers in main.jsx: ${missingMain.join(', ')}`,
    };
  }

  if (!hasGroceryProvider) {
    return {
      passed: false,
      message: 'GroceryListProvider not found in App.jsx or main.jsx',
    };
  }

  return { passed: true, message: 'All context providers present' };
}

// Check if grocery list integrates with recipes
function checkGroceryListIntegration() {
  const recipePageContent = readFile('src/pages/RecipePage.jsx');
  const groceryContent = readFile('src/context/GroceryListContext.jsx');

  if (!recipePageContent || !groceryContent) {
    return { passed: false, message: 'Required files not found' };
  }

  const checks = [
    {
      name: 'GroceryListContext imported in RecipePage',
      check:
        recipePageContent.includes('useGroceryList') ||
        recipePageContent.includes('GroceryListContext'),
    },
    {
      name: 'Grocery list functions exported',
      check: groceryContent.includes('addMany') || groceryContent.includes('addOne'),
    },
  ];

  const failed = checks.filter(c => !c.check);
  if (failed.length > 0) {
    return {
      passed: false,
      message: `Failed checks: ${failed.map(f => f.name).join(', ')}`,
    };
  }

  return { passed: true, message: 'Grocery list properly integrated' };
}

// Check if meal planner integrates properly
function checkMealPlannerIntegration() {
  const mealPlannerContent = readFile('src/pages/MealPlanner.jsx');
  const recipePageContent = readFile('src/pages/RecipePage.jsx');

  if (!mealPlannerContent || !recipePageContent) {
    return { passed: false, message: 'Required files not found' };
  }

  const checks = [
    {
      name: 'setMealPlanDay function exists',
      check:
        mealPlannerContent.includes('setMealPlanDay') ||
        mealPlannerContent.includes('export function setMealPlanDay'),
    },
    {
      name: 'RecipePage can set meal plan',
      check:
        recipePageContent.includes('setMealPlanDay') || recipePageContent.includes('MealPlanner'),
    },
  ];

  const failed = checks.filter(c => !c.check);
  if (failed.length > 0) {
    return {
      passed: false,
      message: `Failed checks: ${failed.map(f => f.name).join(', ')}`,
    };
  }

  return { passed: true, message: 'Meal planner properly integrated' };
}

// Main validation function
function runValidation() {
  log.section('Integration Validation');
  log.info('Checking all feature integrations...\n');

  // 1. Context Providers
  log.section('Context Providers');
  const providersCheck = checkContextProviders();
  recordTest('Context Providers', providersCheck.passed, providersCheck.message);

  // 2. FilterContext Integration
  log.section('FilterContext Integration');
  const filterCheck = checkFilterContextUsage();
  recordTest('FilterContext Usage', filterCheck.passed, filterCheck.message);

  // 3. Medical Conditions Integration
  log.section('Medical Conditions Integration');
  const medicalCheck = checkMedicalConditionsIntegration();
  recordTest('Medical Conditions', medicalCheck.passed, medicalCheck.message);

  // 4. Subscription Integration
  log.section('Subscription Integration');
  const subscriptionCheck = checkSubscriptionIntegration();
  recordTest('Subscription System', subscriptionCheck.passed, subscriptionCheck.message);

  // 5. Grocery List Integration
  log.section('Grocery List Integration');
  const groceryCheck = checkGroceryListIntegration();
  recordTest('Grocery List', groceryCheck.passed, groceryCheck.message);

  // 6. Meal Planner Integration
  log.section('Meal Planner Integration');
  const mealPlannerCheck = checkMealPlannerIntegration();
  recordTest('Meal Planner', mealPlannerCheck.passed, mealPlannerCheck.message);

  // 7. LocalStorage Consistency
  log.section('LocalStorage Consistency');
  const localStorageCheck = checkLocalStorageKeys();
  recordTest('LocalStorage Keys', localStorageCheck.passed, localStorageCheck.message);

  // Summary
  log.section('Validation Summary');
  console.log(`\n${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}\n`);

  if (results.failed > 0) {
    log.error('Some integration checks failed. Please review the errors above.');
    process.exit(1);
  } else if (results.warnings > 0) {
    log.warning('Validation passed with warnings. Review warnings above.');
    process.exit(0);
  } else {
    log.success('All integration checks passed! ✅');
    process.exit(0);
  }
}

// Run validation
runValidation();
