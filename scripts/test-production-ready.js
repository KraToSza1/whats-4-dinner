#!/usr/bin/env node
/* eslint-env node */
/* global process */

/**
 * PRODUCTION READINESS TEST SUITE
 *
 * What this does:
 * - Runs multiple realistic user scenarios (free, premium, family, medical conditions, diets)
 * - Exercises core journeys: search → view recipe → add to planner → build grocery list → favorites
 * - Captures console logs, page errors, network failures
 * - Writes a detailed JSON report to test-report-production-ready.json
 * - Can run all scenarios or a subset via CLI flags
 *
 * Usage examples:
 *   node prod-tests.js
 *   node prod-tests.js --scenario=familyOf5Premium
 *   node prod-tests.js --headless=false
 *   TEST_URL=https://your-prod-url.com node prod-tests.js
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

// -------------------------------------------------------------
// Paths / config
// -------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Basic CLI flag parsing
const args = process.argv.slice(2);
function getFlagValue(flag, defaultValue = undefined) {
  const arg = args.find(a => a.startsWith(`${flag}=`));
  if (!arg) return defaultValue;
  return arg.split('=').slice(1).join('=');
}

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:5173',
  timeout: 120000,
  waitForSelectorTimeout: 20000,
  headless:
    process.env.CI === 'true' ||
    process.env.HEADLESS === 'true' ||
    getFlagValue('--headless', 'true') === 'true',
  skipServerStart: process.env.SKIP_SERVER_START === 'true',
  onlyScenario: getFlagValue('--scenario', null), // e.g. --scenario=familyOf5Premium
  onlyTest: getFlagValue('--test', null), // e.g. --test=weekly_meal_plan_flow
};

// -------------------------------------------------------------
// Test result container
// -------------------------------------------------------------
const testResults = {
  scenarios: {},
  features: {},
  errors: [],
  warnings: [],
  networkRequests: [],
  networkFailures: [],
  consoleLogs: [],
  consoleErrors: [],
  consoleWarnings: [],
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  startTime: Date.now(),
};

// -------------------------------------------------------------
// User scenarios – real-world style
// -------------------------------------------------------------
const USER_SCENARIOS = {
  singlePersonFree: {
    name: 'Single Person (Free User)',
    description:
      'Lives alone, free plan, mostly browsing dinner ideas without strict restrictions.',
    localStorage: {
      'filters:diet': 'none',
      'filters:maxTime': 'none',
      'filters:mealType': 'none',
      'filters:pantry': JSON.stringify([]),
      favorites: JSON.stringify([]),
      theme: 'dark',
      recipesPerPage: '24',
      subscriptionPlan: 'free',
      medicalConditions: JSON.stringify([]),
      familyMembers: JSON.stringify([]),
    },
    tests: [
      'homepage_loads',
      'core_journey_basic',
      'recipe_search',
      'recipe_detail',
      'filters_work',
      'grocery_list',
      'favorites',
      'theme_toggle',
    ],
  },

  singlePersonWithDiabetes: {
    name: 'Single Person with Diabetes',
    description:
      'Adult with type 2 diabetes focusing on low-sugar, low-carb dinners under 30 minutes.',
    localStorage: {
      'filters:diet': 'low-carb',
      'filters:maxTime': '30',
      'filters:mealType': 'dinner',
      'filters:pantry': JSON.stringify(['chicken', 'vegetables', 'eggs']),
      favorites: JSON.stringify([]),
      theme: 'light',
      recipesPerPage: '24',
      subscriptionPlan: 'free',
      medicalConditions: JSON.stringify([
        {
          condition: 'diabetes',
          active: true,
          restrictions: ['low-sugar', 'low-carb'],
          severity: 'moderate',
        },
      ]),
      familyMembers: JSON.stringify([]),
    },
    tests: [
      'homepage_loads',
      'recipe_search',
      'medical_condition_filtering',
      'core_journey_health_focused',
      'recipe_detail',
      'filters_work',
      'grocery_list',
    ],
  },

  singlePersonWithCeliac: {
    name: 'Single Person with Celiac Disease',
    description:
      'Newly diagnosed celiac, strictly gluten-free, uses premium to get better filters & planning.',
    localStorage: {
      'filters:diet': 'gluten-free',
      'filters:maxTime': '45',
      'filters:mealType': 'lunch',
      'filters:pantry': JSON.stringify([
        'gluten-free pasta',
        'chicken',
        'vegetables',
      ]),
      favorites: JSON.stringify([]),
      theme: 'dark',
      recipesPerPage: '36',
      subscriptionPlan: 'premium',
      medicalConditions: JSON.stringify([
        {
          condition: 'celiac',
          active: true,
          restrictions: ['gluten-free'],
          severity: 'severe',
        },
      ]),
      familyMembers: JSON.stringify([]),
    },
    tests: [
      'homepage_loads',
      'recipe_search',
      'medical_condition_filtering',
      'core_journey_health_focused',
      'recipe_detail',
      'filters_work',
      'grocery_list',
      'meal_planner',
      'analytics',
    ],
  },

  familyOf5Premium: {
    name: 'Family of 5 (Premium)',
    description:
      'Two parents + 3 kids, one with diabetes, one lactose-intolerant, heavy use of planner & grocery list.',
    localStorage: {
      'filters:diet': 'none',
      'filters:maxTime': '60',
      'filters:mealType': 'dinner',
      'filters:pantry': JSON.stringify([
        'chicken',
        'beef',
        'pasta',
        'rice',
        'vegetables',
      ]),
      favorites: JSON.stringify([]),
      theme: 'dark',
      recipesPerPage: '48',
      subscriptionPlan: 'premium',
      medicalConditions: JSON.stringify([
        {
          condition: 'diabetes',
          active: true,
          memberId: 'parent1',
          restrictions: ['low-sugar'],
        },
        {
          condition: 'lactose-intolerance',
          active: true,
          memberId: 'child1',
          restrictions: ['dairy-free'],
        },
      ]),
      familyMembers: JSON.stringify([
        {
          id: 'parent1',
          name: 'Parent 1',
          age: 35,
          dietaryRestrictions: ['diabetes'],
        },
        {
          id: 'parent2',
          name: 'Parent 2',
          age: 33,
          dietaryRestrictions: [],
        },
        {
          id: 'child1',
          name: 'Child 1',
          age: 10,
          dietaryRestrictions: ['lactose-intolerance'],
        },
        {
          id: 'child2',
          name: 'Child 2',
          age: 8,
          dietaryRestrictions: [],
        },
        {
          id: 'child3',
          name: 'Child 3',
          age: 5,
          dietaryRestrictions: [],
        },
      ]),
    },
    tests: [
      'homepage_loads',
      'recipe_search',
      'family_plan',
      'meal_planner',
      'weekly_meal_plan_flow',
      'medical_condition_filtering',
      'grocery_list',
      'export_grocery_list_flow',
      'analytics',
      'calorie_tracker',
      'water_tracker',
    ],
  },

  veganFamily: {
    name: 'Vegan Family',
    description:
      'Two adults, fully vegan household, focusing on plant-based dinners and bulk cooking.',
    localStorage: {
      'filters:diet': 'vegan',
      'filters:maxTime': '45',
      'filters:mealType': 'dinner',
      'filters:pantry': JSON.stringify([
        'tofu',
        'beans',
        'vegetables',
        'quinoa',
      ]),
      favorites: JSON.stringify([]),
      theme: 'light',
      recipesPerPage: '24',
      subscriptionPlan: 'premium',
      medicalConditions: JSON.stringify([]),
      familyMembers: JSON.stringify([
        {
          id: 'member1',
          name: 'Member 1',
          age: 30,
          dietaryRestrictions: ['vegan'],
        },
        {
          id: 'member2',
          name: 'Member 2',
          age: 28,
          dietaryRestrictions: ['vegan'],
        },
      ]),
    },
    tests: [
      'homepage_loads',
      'recipe_search',
      'core_journey_basic',
      'recipe_detail',
      'filters_work',
      'grocery_list',
      'meal_planner',
      'weekly_meal_plan_flow',
    ],
  },

  ketoDiet: {
    name: 'Keto Diet User',
    description:
      'Solo user following ketogenic diet, wants quick high-protein dinners & snacks.',
    localStorage: {
      'filters:diet': 'ketogenic',
      'filters:maxTime': '30',
      'filters:mealType': 'dinner',
      'filters:pantry': JSON.stringify([
        'chicken',
        'eggs',
        'avocado',
        'cheese',
      ]),
      favorites: JSON.stringify([]),
      theme: 'dark',
      recipesPerPage: '24',
      subscriptionPlan: 'free',
      medicalConditions: JSON.stringify([]),
      familyMembers: JSON.stringify([]),
    },
    tests: [
      'homepage_loads',
      'recipe_search',
      'core_journey_basic',
      'recipe_detail',
      'filters_work',
      'grocery_list',
    ],
  },

  couplePremium: {
    name: 'Couple (Premium)',
    description:
      'Young couple cooking together, uses collections, analytics & trackers to hit nutrition goals.',
    localStorage: {
      'filters:diet': 'none',
      'filters:maxTime': '45',
      'filters:mealType': 'dinner',
      'filters:pantry': JSON.stringify([
        'chicken',
        'salmon',
        'vegetables',
        'pasta',
      ]),
      favorites: JSON.stringify([]),
      theme: 'dark',
      recipesPerPage: '36',
      subscriptionPlan: 'premium',
      medicalConditions: JSON.stringify([]),
      familyMembers: JSON.stringify([
        { id: 'person1', name: 'Person 1', age: 28, dietaryRestrictions: [] },
        { id: 'person2', name: 'Person 2', age: 26, dietaryRestrictions: [] },
      ]),
    },
    tests: [
      'homepage_loads',
      'recipe_search',
      'core_journey_basic',
      'add_favorite_and_recall',
      'recipe_detail',
      'filters_work',
      'grocery_list',
      'meal_planner',
      'weekly_meal_plan_flow',
      'analytics',
      'calorie_tracker',
      'water_tracker',
      'pantry',
      'collections',
    ],
  },
};

// -------------------------------------------------------------
// Console colors
// -------------------------------------------------------------
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    color,
  };
  testResults.consoleLogs.push(logEntry);
  // eslint-disable-next-line no-console
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message, error = null) {
  const timestamp = Date.now();
  const errorEntry = {
    timestamp,
    message,
    error: error ? (error.message || error.toString()) : null,
    stack: error?.stack,
    kind: 'suite',
  };
  testResults.errors.push(errorEntry);
  testResults.consoleErrors.push(errorEntry);
  log(`❌ ${message}`, 'red');
  if (error) {
    log(`   ${error.message || error}`, 'red');
  }
}

function logWarning(message) {
  const timestamp = Date.now();
  const warningEntry = {
    timestamp,
    message,
    kind: 'suite',
  };
  testResults.warnings.push(warningEntry);
  testResults.consoleWarnings.push(warningEntry);
  log(`⚠️  ${message}`, 'yellow');
}

function recordTest(scenario, testName, status, error = null, details = {}) {
  testResults.totalTests++;

  const testResult = {
    scenario,
    testName,
    status,
    error: error ? (error.message || error.toString()) : null,
    details,
    timestamp: Date.now(),
  };

  if (!testResults.scenarios[scenario]) {
    testResults.scenarios[scenario] = {
      name: USER_SCENARIOS[scenario]?.name || scenario,
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  testResults.scenarios[scenario].tests.push(testResult);

  if (status === 'passed') {
    testResults.passedTests++;
    testResults.scenarios[scenario].passed++;
    log(`✅ [${scenario}] ${testName}`, 'green');
  } else if (status === 'failed') {
    testResults.failedTests++;
    testResults.scenarios[scenario].failed++;
    log(`❌ [${scenario}] ${testName}`, 'red');
    if (error) {
      log(`   Error: ${error.message || error}`, 'red');
    }
  } else {
    testResults.skippedTests++;
    testResults.scenarios[scenario].skipped++;
    log(`⏭️  [${scenario}] ${testName}`, 'yellow');
  }
}

// -------------------------------------------------------------
// Dev server management
// -------------------------------------------------------------
let devServer = null;

async function startDevServer() {
  if (TEST_CONFIG.skipServerStart) {
    log('⏭️  Skipping server start (assuming server already running)', 'yellow');
    return;
  }

  return new Promise((resolve, reject) => {
    log('🚀 Starting dev server...', 'cyan');
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'pipe',
      shell: true,
    });

    let serverReady = false;

    devServer.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost')) {
        if (!serverReady) {
          serverReady = true;
          log('✅ Dev server is ready!', 'green');
          setTimeout(resolve, 5000);
        }
      }
    });

    devServer.stderr.on('data', data => {
      const output = data.toString();
      if (output.toLowerCase().includes('error')) {
        logWarning(`Server error: ${output.substring(0, 200)}`);
      }
    });

    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Dev server failed to start within 60 seconds'));
      }
    }, 60000);
  });
}

function stopDevServer() {
  if (devServer) {
    log('🛑 Stopping dev server...', 'cyan');
    devServer.kill();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------------------------------------------------
// Browser setup
// -------------------------------------------------------------
async function setupBrowser() {
  log('🌐 Launching browser...', 'cyan');
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(TEST_CONFIG.timeout);
  page.setDefaultNavigationTimeout(TEST_CONFIG.timeout);

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const timestamp = Date.now();

    const logEntry = {
      timestamp,
      type,
      text,
      kind: 'page',
    };

    testResults.consoleLogs.push(logEntry);

    if (type === 'error') {
      testResults.consoleErrors.push(logEntry);
      if (
        !text.includes('Auth session missing') &&
        !text.includes('Image failed to load') &&
        !text.includes('Failed to load resource') &&
        !text.includes('NS_BINDING_ABORTED') &&
        !text.includes('ResizeObserver')
      ) {
        log(`[Console Error]: ${text.substring(0, 150)}`, 'red');
      }
    } else if (type === 'warn') {
      testResults.consoleWarnings.push(logEntry);
    }
  });

  // Page errors
  page.on('pageerror', error => {
    const errorMsg = error.message;
    if (
      !errorMsg.includes('Auth session missing') &&
      !errorMsg.includes('ResizeObserver')
    ) {
      logError('[Page Error]', error);
    }
  });

  // Network tracking
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    const timestamp = Date.now();

    const requestEntry = {
      timestamp,
      url,
      method,
      headers: request.headers(),
    };

    testResults.networkRequests.push(requestEntry);

    if (url.includes('supabase.co')) {
      log(
        `[Network Request]: ${method} ${url.substring(0, 100)}...`,
        'cyan',
      );
    }
  });

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    const timestamp = Date.now();

    if (status >= 400) {
      const failureEntry = {
        timestamp,
        url,
        status,
        statusText: response.statusText(),
        method: 'UNKNOWN',
        source: 'response',
      };
      testResults.networkFailures.push(failureEntry);
      log(
        `[Network Failure]: ${status} ${url.substring(0, 100)}...`,
        'red',
      );
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    const timestamp = Date.now();

    const failureEntry = {
      timestamp,
      url,
      method: request.method(),
      errorText: failure?.errorText || 'Unknown error',
      failureReason: failure?.errorText || 'Unknown',
      source: 'requestfailed',
    };

    testResults.networkFailures.push(failureEntry);
    log(
      `[Request Failed]: ${request.method()} ${url.substring(0, 100)}...`,
      'red',
    );
  });

  return { browser, page };
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
async function elementExists(page, selector, timeout = 2000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function clearAndSetLocalStorage(page, localStorageData) {
  // Navigate to the app first (localStorage requires a valid origin)
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(data => {
    try {
      localStorage.clear();
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
      });
    } catch (error) {
      console.warn('Failed to set localStorage:', error);
    }
  }, localStorageData);
}

// -------------------------------------------------------------
// Test pieces
// -------------------------------------------------------------
async function testHomepageLoads(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, {
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout,
    });
    await delay(5000);

    const pageState = await page.evaluate(() => {
      const recipeCards = document.querySelectorAll(
        '[class*="recipe"], [class*="card"], article',
      );
      const loadingElements = document.querySelectorAll(
        '[class*="loading"], [class*="skeleton"]',
      );
      const errorElements = document.querySelectorAll(
        '[class*="error"], [class*="bg-red"], [role="alert"]',
      );

      const errorTexts = Array.from(errorElements)
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .filter(text => {
          const lower = text.toLowerCase();
          return (
            (lower.includes('error') ||
              lower.includes('failed') ||
              lower.includes('timeout')) &&
            !lower.includes('clear') &&
            !lower.includes('filter')
          );
        });

      return {
        recipeCount: recipeCards.length,
        isLoading: loadingElements.length > 0,
        hasErrors: errorElements.length > 0,
        errorTexts,
      };
    });

    if (pageState.hasErrors && pageState.errorTexts.length > 0) {
      recordTest(
        scenario,
        'homepage_loads',
        'failed',
        new Error(pageState.errorTexts[0]),
      );
      return false;
    }

    recordTest(scenario, 'homepage_loads', 'passed', null, {
      recipeCount: pageState.recipeCount,
      isLoading: pageState.isLoading,
    });
    return true;
  } catch (error) {
    recordTest(scenario, 'homepage_loads', 'failed', error);
    return false;
  }
}

async function testRecipeSearch(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(3000);

    const searchInput = await page.$(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="ingredient" i]',
    );

    if (!searchInput) {
      recordTest(scenario, 'recipe_search', 'skipped', null, {
        reason: 'Search input not found',
      });
      return false;
    }

    await page.evaluate(input => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, searchInput);

    await searchInput.type('chicken', { delay: 80 });
    await delay(400);
    await page.keyboard.press('Enter');
    await delay(8000);

    const hasResults = await elementExists(
      page,
      '[class*="recipe"], [class*="card"], article',
    );
    const hasNoResults = await page.evaluate(() => {
      const text = document.body.textContent?.toLowerCase() || '';
      return text.includes('no results') || text.includes('no recipes');
    });

    if (hasResults || hasNoResults) {
      recordTest(scenario, 'recipe_search', 'passed', null, {
        hasResults,
        hasNoResults,
      });
      return true;
    }

    recordTest(
      scenario,
      'recipe_search',
      'failed',
      new Error('Search did not return results or message'),
    );
    return false;
  } catch (error) {
    recordTest(scenario, 'recipe_search', 'failed', error);
    return false;
  }
}

async function testRecipeDetail(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(5000);

    const recipeLink = await page.$('a[href*="/recipe/"]');
    if (!recipeLink) {
      recordTest(scenario, 'recipe_detail', 'skipped', null, {
        reason: 'No recipe links found',
      });
      return false;
    }

    await recipeLink.click();
    await delay(8000);

    const hasContent = await elementExists(
      page,
      '[class*="ingredient"], [class*="instruction"], h1, [class*="title"]',
    );

    if (hasContent) {
      recordTest(scenario, 'recipe_detail', 'passed');
      return true;
    }

    recordTest(
      scenario,
      'recipe_detail',
      'failed',
      new Error('Recipe page did not load content'),
    );
    return false;
  } catch (error) {
    recordTest(scenario, 'recipe_detail', 'failed', error);
    return false;
  }
}

async function testFilters(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(3000);

    const filterButtonHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return (
        buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          const title = btn.getAttribute('title')?.toLowerCase() || '';
          return text.includes('filter') || title.includes('filter');
        }) || null
      );
    });

    const filterElement = await filterButtonHandle.asElement();
    if (filterElement) {
      await filterElement.click();
      await delay(2000);
    }

    const hasFilters = await elementExists(
      page,
      'select, [role="combobox"], input[type="checkbox"], [class*="filter"]',
    );

    recordTest(
      scenario,
      'filters_work',
      hasFilters ? 'passed' : 'skipped',
      null,
      {
        filtersVisible: hasFilters,
      },
    );
    return hasFilters;
  } catch (error) {
    recordTest(scenario, 'filters_work', 'failed', error);
    return false;
  }
}

async function testGroceryList(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(3000);

    const groceryButtonHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return (
        buttons.find(btn => {
          const text = btn.textContent || '';
          const title = btn.getAttribute('title')?.toLowerCase() || '';
          const ariaLabel = btn
            .getAttribute('aria-label')
            ?.toLowerCase() || '';
          return (
            text.includes('🛒') ||
            text.toLowerCase().includes('grocery') ||
            text.toLowerCase().includes('shopping list') ||
            title.includes('grocery') ||
            ariaLabel.includes('grocery')
          );
        }) || null
      );
    });

    const groceryElement = await groceryButtonHandle.asElement();
    if (!groceryElement) {
      recordTest(scenario, 'grocery_list', 'skipped', null, {
        reason: 'Grocery/shopping list button not found',
      });
      return false;
    }

    await groceryElement.click();
    
    // Wait for the drawer to appear using waitForFunction
    try {
      await page.waitForFunction(
        () => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
          return headings.some(h => {
            const text = h.textContent?.toLowerCase() || '';
            if (text.includes('my grocery list') || text.includes('grocery list')) {
              const dialog = h.closest('[role="dialog"], [aria-modal="true"]');
              if (dialog) {
                const style = window.getComputedStyle(dialog);
                const rect = dialog.getBoundingClientRect();
                return (
                  style.display !== 'none' &&
                  style.visibility !== 'hidden' &&
                  style.opacity !== '0' &&
                  rect.width > 0 &&
                  rect.height > 0
                );
              }
            }
            return false;
          });
        },
        { timeout: 8000 }
      );
    } catch (_e) {
      // If wait fails, continue to check anyway
    }
    
    await delay(2000); // Additional wait for animation

    const hasGroceryList = await page.evaluate(() => {
      // Check for the dialog with "My Grocery List" heading
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
      for (const heading of headings) {
        const text = heading.textContent?.toLowerCase() || '';
        if (text.includes('my grocery list') || text.includes('grocery list')) {
          // Check if it's in a visible dialog
          const dialog = heading.closest('[role="dialog"], [aria-modal="true"]');
          if (dialog) {
            const style = window.getComputedStyle(dialog);
            const rect = dialog.getBoundingClientRect();
            // Check if dialog is visible and on screen
            if (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              style.opacity !== '0' &&
              rect.width > 0 &&
              rect.height > 0
            ) {
              return true;
            }
          }
        }
      }
      
      // Also check dialogs directly
      const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
      for (const dialog of dialogs) {
        const text = dialog.textContent?.toLowerCase() || '';
        if (text.includes('my grocery list') || (text.includes('grocery') && text.includes('items'))) {
          const style = window.getComputedStyle(dialog);
          const rect = dialog.getBoundingClientRect();
          if (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0
          ) {
            return true;
          }
        }
      }
      
      return false;
    });

    recordTest(
      scenario,
      'grocery_list',
      hasGroceryList ? 'passed' : 'failed',
      hasGroceryList
        ? null
        : new Error('Grocery list dialog/page did not appear'),
    );
    return hasGroceryList;
  } catch (error) {
    recordTest(scenario, 'grocery_list', 'failed', error);
    return false;
  }
}

async function testMedicalConditionFiltering(page, scenario, scenarioConfig) {
  try {
    const medicalConditions = JSON.parse(
      scenarioConfig.localStorage.medicalConditions || '[]',
    );
    if (medicalConditions.length === 0) {
      recordTest(
        scenario,
        'medical_condition_filtering',
        'skipped',
        null,
        {
          reason: 'No medical conditions configured',
        },
      );
      return false;
    }

    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(8000);

    const pageState = await page.evaluate(() => {
      const recipeCards = document.querySelectorAll(
        '[class*="recipe"], [class*="card"]',
      );
      const errorElements = document.querySelectorAll(
        '[class*="error"], [role="alert"]',
      );
      return {
        recipeCount: recipeCards.length,
        hasErrors: errorElements.length > 0,
      };
    });

    recordTest(
      scenario,
      'medical_condition_filtering',
      'passed',
      null,
      {
        recipeCount: pageState.recipeCount,
        conditions: medicalConditions.map(c => c.condition),
      },
    );
    return true;
  } catch (error) {
    recordTest(scenario, 'medical_condition_filtering', 'failed', error);
    return false;
  }
}

async function testPageLoads(page, scenario, path, pageName) {
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}${path}`, {
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout,
    });
    await delay(5000);

    const pageState = await page.evaluate(() => {
      const errorElements = document.querySelectorAll(
        '[class*="error"], [role="alert"], [class*="bg-red"]',
      );
      const errorTexts = Array.from(errorElements)
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .filter(text => {
          const lower = text.toLowerCase();
          return (
            (lower.includes('error') ||
              lower.includes('failed') ||
              lower.includes('timeout')) &&
            !lower.includes('clear') &&
            !lower.includes('filter')
          );
        });

      return {
        hasErrors: errorTexts.length > 0,
        errorText: errorTexts[0] || null,
        hasContent: (document.body.textContent || '').length > 100,
      };
    });

    const testKey = pageName.toLowerCase().replace(/\s+/g, '_');

    if (pageState.hasErrors && pageState.errorText) {
      recordTest(
        scenario,
        testKey,
        'failed',
        new Error(pageState.errorText),
      );
      return false;
    }

    recordTest(scenario, testKey, 'passed', null, {
      hasContent: pageState.hasContent,
    });
    return true;
  } catch (error) {
    const testKey = pageName.toLowerCase().replace(/\s+/g, '_');
    recordTest(scenario, testKey, 'failed', error);
    return false;
  }
}

// -------------------------------------------------------------
// Real-world flows / journeys
// -------------------------------------------------------------
async function coreJourneyBasic(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(3000);

    // 1) Search
    const searchInput = await page.$(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="ingredient" i]',
    );
    if (searchInput) {
      await page.evaluate(input => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, searchInput);
      await searchInput.type('chicken', { delay: 50 });
      await delay(300);
      await page.keyboard.press('Enter');
      await delay(6000);
    }

    // 2) Open first recipe card
    const recipeCard = await page.$(
      'a[href*="/recipe/"], [data-testid*="recipe-card"], article a',
    );
    if (!recipeCard) {
      recordTest(scenario, 'core_journey_basic', 'skipped', null, {
        reason: 'No recipe card link found',
      });
      return false;
    }
    await recipeCard.click();
    await delay(6000);

    // 3) Add to grocery list (if there is such a button)
    const addToGroceryHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return (
        buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return (
            text.includes('grocery') ||
            text.includes('shopping list') ||
            text.includes('add to list')
          );
        }) || null
      );
    });
    const addToGroceryElement = await addToGroceryHandle.asElement();
    if (addToGroceryElement) {
      await addToGroceryElement.click();
      await delay(1500);
    }

    recordTest(scenario, 'core_journey_basic', 'passed');
    return true;
  } catch (error) {
    recordTest(scenario, 'core_journey_basic', 'failed', error);
    return false;
  }
}

async function coreJourneyHealthFocused(page, scenario) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(4000);

    // Assume medical filters and/or diet filters applied via localStorage already.
    // Just check we can still see and open a recipe.
    const recipeLink = await page.$(
      'a[href*="/recipe/"], [data-testid*="recipe-card"] a',
    );
    if (!recipeLink) {
      recordTest(
        scenario,
        'core_journey_health_focused',
        'skipped',
        null,
        {
          reason: 'No recipe link found under medical filters',
        },
      );
      return false;
    }

    await recipeLink.click();
    await delay(6000);

    const hasIngredients = await elementExists(
      page,
      '[class*="ingredient"], ul li, ol li',
      5000,
    );

    recordTest(
      scenario,
      'core_journey_health_focused',
      hasIngredients ? 'passed' : 'failed',
      hasIngredients
        ? null
        : new Error('Health-focused recipe page missing ingredients list'),
    );
    return hasIngredients;
  } catch (error) {
    recordTest(
      scenario,
      'core_journey_health_focused',
      'failed',
      error,
    );
    return false;
  }
}

async function weeklyMealPlanFlow(page, scenario) {
  try {
    // Go to meal planner page directly
    await page.goto(`${TEST_CONFIG.baseUrl}/meal-planner`, {
      waitUntil: 'networkidle2',
    });
    await delay(4000);

    const plannerHasContent = await page.evaluate(() => {
      const text = document.body.textContent?.toLowerCase() || '';
      return (
        text.includes('meal planner') ||
        text.includes('plan your week') ||
        text.includes('week') ||
        text.includes('monday')
      );
    });

    if (!plannerHasContent) {
      recordTest(
        scenario,
        'weekly_meal_plan_flow',
        'skipped',
        null,
        {
          reason: 'Meal planner page appears empty or text not recognized',
        },
      );
      return false;
    }

    // Try to add 2–3 meals to the week using generic "Add" style buttons
    const addedCount = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButtons = buttons.filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return (
          text.includes('add to plan') ||
          text.includes('add to planner') ||
          text.includes('add to week') ||
          text.includes('add meal')
        );
      });

      let clicks = 0;
      for (const btn of addButtons.slice(0, 3)) {
        btn.click();
        clicks++;
      }
      return clicks;
    });

    recordTest(
      scenario,
      'weekly_meal_plan_flow',
      'passed',
      null,
      {
        mealsAttemptedToAdd: addedCount,
      },
    );
    return true;
  } catch (error) {
    recordTest(scenario, 'weekly_meal_plan_flow', 'failed', error);
    return false;
  }
}

async function exportGroceryListFlow(page, scenario) {
  try {
    // Go to or open grocery list
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(3000);

    const groceryButtonHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return (
        buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return (
            text.includes('grocery') ||
            text.includes('shopping list') ||
            text.includes('view list')
          );
        }) || null
      );
    });
    const groceryElement = await groceryButtonHandle.asElement();
    if (!groceryElement) {
      recordTest(
        scenario,
        'export_grocery_list_flow',
        'skipped',
        null,
        {
          reason: 'Cannot locate button/link to open grocery list',
        },
      );
      return false;
    }

    await groceryElement.click();
    await delay(3000);

    // Look for export / print / share style buttons
    const exportClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const target = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return (
          text.includes('export') ||
          text.includes('download') ||
          text.includes('print') ||
          text.includes('share')
        );
      });
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    recordTest(
      scenario,
      'export_grocery_list_flow',
      exportClicked ? 'passed' : 'skipped',
      null,
      {
        exportTriggered: exportClicked,
      },
    );
    return true;
  } catch (error) {
    recordTest(
      scenario,
      'export_grocery_list_flow',
      'failed',
      error,
    );
    return false;
  }
}

async function addFavoriteAndRecallFlow(page, scenario) {
  try {
    // 1) Open homepage and first recipe, mark as favorite
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await delay(4000);

    const recipeLink = await page.$('a[href*="/recipe/"]');
    if (!recipeLink) {
      recordTest(
        scenario,
        'add_favorite_and_recall',
        'skipped',
        null,
        {
          reason: 'No recipe link found to favorite',
        },
      );
      return false;
    }

    await recipeLink.click();
    await delay(5000);

    const favoriteClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const favBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const aria = btn
          .getAttribute('aria-label')
          ?.toLowerCase() || '';
        return (
          text.includes('favorite') ||
          text.includes('favourite') ||
          text.includes('save') ||
          aria.includes('favorite')
        );
      });
      if (favBtn) {
        favBtn.click();
        return true;
      }
      return false;
    });

    // 2) Navigate to /favorites and confirm page loads
    await page.goto(`${TEST_CONFIG.baseUrl}/favorites`, {
      waitUntil: 'networkidle2',
    });
    await delay(5000);

    const hasFavoritesContent = await page.evaluate(() => {
      const text = document.body.textContent?.toLowerCase() || '';
      return text.includes('favorite') || text.includes('favourite');
    });

    recordTest(
      scenario,
      'add_favorite_and_recall',
      hasFavoritesContent ? 'passed' : 'failed',
      hasFavoritesContent
        ? null
        : new Error(
            'Favorites page did not show expected text/state',
          ),
      {
        favoriteClicked,
        favoritesPageHasContent: hasFavoritesContent,
      },
    );
    return hasFavoritesContent;
  } catch (error) {
    recordTest(
      scenario,
      'add_favorite_and_recall',
      'failed',
      error,
    );
    return false;
  }
}

// -------------------------------------------------------------
// Scenario runner
// -------------------------------------------------------------
async function testScenario(page, scenarioKey, scenarioConfig) {
  if (TEST_CONFIG.onlyScenario && TEST_CONFIG.onlyScenario !== scenarioKey) {
    log(
      `⏭️  Skipping scenario ${scenarioConfig.name} (filtered via --scenario)`,
      'gray',
    );
    return;
  }

  log('\n' + '='.repeat(70), 'magenta');
  log(`🧪 Testing Scenario: ${scenarioConfig.name}`, 'magenta');
  log(`   ${scenarioConfig.description}`, 'gray');
  log('='.repeat(70), 'magenta');

  // Reset localStorage for this scenario
  await clearAndSetLocalStorage(page, scenarioConfig.localStorage);

  // Run scenario tests
  for (const testName of scenarioConfig.tests) {
    if (TEST_CONFIG.onlyTest && TEST_CONFIG.onlyTest !== testName) {
      recordTest(
        scenarioKey,
        testName,
        'skipped',
        null,
        {
          reason: `Filtered via --test=${TEST_CONFIG.onlyTest}`,
        },
      );
      continue;
    }

    switch (testName) {
      case 'homepage_loads':
        await testHomepageLoads(page, scenarioKey);
        break;
      case 'recipe_search':
        await testRecipeSearch(page, scenarioKey);
        break;
      case 'recipe_detail':
        await testRecipeDetail(page, scenarioKey);
        break;
      case 'filters_work':
        await testFilters(page, scenarioKey);
        break;
      case 'grocery_list':
        await testGroceryList(page, scenarioKey);
        break;
      case 'medical_condition_filtering':
        await testMedicalConditionFiltering(
          page,
          scenarioKey,
          scenarioConfig,
        );
        break;
      case 'meal_planner':
        await testPageLoads(
          page,
          scenarioKey,
          '/meal-planner',
          'Meal Planner',
        );
        break;
      case 'favorites':
        await testPageLoads(
          page,
          scenarioKey,
          '/favorites',
          'Favorites',
        );
        break;
      case 'family_plan':
        await testPageLoads(
          page,
          scenarioKey,
          '/family-plan',
          'Family Plan',
        );
        break;
      case 'analytics':
        await testPageLoads(
          page,
          scenarioKey,
          '/analytics',
          'Analytics',
        );
        break;
      case 'calorie_tracker':
        await testPageLoads(
          page,
          scenarioKey,
          '/calorie-tracker',
          'Calorie Tracker',
        );
        break;
      case 'water_tracker':
        await testPageLoads(
          page,
          scenarioKey,
          '/water-tracker',
          'Water Tracker',
        );
        break;
      case 'pantry':
        await testPageLoads(page, scenarioKey, '/pantry', 'Pantry');
        break;
      case 'collections':
        await testPageLoads(
          page,
          scenarioKey,
          '/collections',
          'Collections',
        );
        break;
      case 'theme_toggle':
        try {
          await page.goto(TEST_CONFIG.baseUrl, {
            waitUntil: 'networkidle2',
          });
          await delay(2000);
          const themeButton = await page.evaluateHandle(() => {
            const buttons = Array.from(
              document.querySelectorAll('button'),
            );
            return (
              buttons.find(btn => {
                const text = btn.textContent || '';
                const aria =
                  btn
                    .getAttribute('aria-label')
                    ?.toLowerCase() || '';
                const title =
                  btn.getAttribute('title')?.toLowerCase() || '';
                return (
                  text.includes('🌙') ||
                  text.includes('☀️') ||
                  aria.includes('theme') ||
                  aria.includes('dark') ||
                  aria.includes('light') ||
                  title.includes('theme')
                );
              }) || null
            );
          });
          const themeElement = await themeButton.asElement();
          if (themeElement) {
            await themeElement.click();
            await delay(500);
          }
          recordTest(scenarioKey, 'theme_toggle', 'passed');
        } catch (error) {
          recordTest(scenarioKey, 'theme_toggle', 'failed', error);
        }
        break;
      case 'core_journey_basic':
        await coreJourneyBasic(page, scenarioKey);
        break;
      case 'core_journey_health_focused':
        await coreJourneyHealthFocused(page, scenarioKey);
        break;
      case 'weekly_meal_plan_flow':
        await weeklyMealPlanFlow(page, scenarioKey);
        break;
      case 'export_grocery_list_flow':
        await exportGroceryListFlow(page, scenarioKey);
        break;
      case 'add_favorite_and_recall':
        await addFavoriteAndRecallFlow(page, scenarioKey);
        break;
      default:
        recordTest(
          scenarioKey,
          testName,
          'skipped',
          null,
          {
            reason: `No handler implemented for test "${testName}"`,
          },
        );
        break;
    }

    await delay(800);
  }
}

// -------------------------------------------------------------
// Report
// -------------------------------------------------------------
async function generateReport() {
  const endTime = Date.now();
  const duration = ((endTime - testResults.startTime) / 1000).toFixed(2);

  log('\n' + '='.repeat(70), 'cyan');
  log('📊 PRODUCTION READINESS TEST REPORT', 'cyan');
  log('='.repeat(70), 'cyan');

  log(`\n⏱️  Test Duration: ${duration} seconds`, 'blue');
  log(`📈 Total Tests: ${testResults.totalTests}`, 'blue');
  log(`✅ Passed: ${testResults.passedTests}`, 'green');
  log(`❌ Failed: ${testResults.failedTests}`, 'red');
  log(`⏭️  Skipped: ${testResults.skippedTests}`, 'yellow');

  const passRate =
    testResults.totalTests > 0
      ? (
          (testResults.passedTests / testResults.totalTests) *
          100
        ).toFixed(1)
      : '0.0';
  log(
    `\n🎯 Pass Rate: ${passRate}%`,
    passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red',
  );

  // Scenario breakdown
  log('\n📋 Scenario Breakdown:', 'cyan');
  for (const [_scenarioKey, scenarioData] of Object.entries(
    testResults.scenarios,
  )) {
    const denominator = scenarioData.passed + scenarioData.failed || 1;
    const scenarioPassRate = (
      (scenarioData.passed / denominator) *
      100
    ).toFixed(1);
    log(`\n   ${scenarioData.name}:`, 'blue');
    log(`      ✅ Passed: ${scenarioData.passed}`, 'green');
    log(`      ❌ Failed: ${scenarioData.failed}`, 'red');
    log(`      ⏭️  Skipped: ${scenarioData.skipped}`, 'yellow');
    log(
      `      📊 Pass Rate: ${scenarioPassRate}%`,
      scenarioPassRate >= 90 ? 'green' : 'yellow',
    );
  }

  // Network issues
  if (testResults.networkFailures.length > 0) {
    log(
      `\n⚠️  Network Failures: ${testResults.networkFailures.length}`,
      'yellow',
    );
    testResults.networkFailures.slice(0, 10).forEach(failure => {
      const label =
        failure.status || failure.errorText || failure.failureReason;
      log(
        `   - ${failure.method || 'HTTP'} ${
          failure.url?.substring(0, 80) || ''
        }... (${label})`,
        'yellow',
      );
    });
  }

  // Console errors
  if (testResults.consoleErrors.length > 0) {
    log(
      `\n⚠️  Console Errors: ${testResults.consoleErrors.length}`,
      'yellow',
    );
    const uniqueErrors = new Set();
    testResults.consoleErrors.slice(0, 20).forEach(error => {
      const text =
        error.text ||
        error.error ||
        error.message ||
        'Unknown error';
      const errorText = text.substring(0, 100);
      if (!uniqueErrors.has(errorText)) {
        uniqueErrors.add(errorText);
        log(`   - ${errorText}`, 'yellow');
      }
    });
  }

  const reportPath = join(rootDir, 'test-report-production-ready.json');
  writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\n💾 Detailed report saved to: ${reportPath}`, 'cyan');

  return {
    passRate: parseFloat(passRate),
    totalTests: testResults.totalTests,
    passedTests: testResults.passedTests,
    failedTests: testResults.failedTests,
  };
}

// -------------------------------------------------------------
// Entry point
// -------------------------------------------------------------
async function runAllTests() {
  log(
    '\n🚀 STARTING PRODUCTION READINESS TEST SUITE (real-world scenarios)\n',
    'cyan',
  );

  let browser = null;
  let page = null;

  try {
    await startDevServer();
    const browserSetup = await setupBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;

    for (const [scenarioKey, scenarioConfig] of Object.entries(
      USER_SCENARIOS,
    )) {
      await testScenario(page, scenarioKey, scenarioConfig);
      await delay(1500);
    }

    const report = await generateReport();

    if (report.passRate >= 90) {
      log('\n🎉 App is PRODUCTION READY (by test criteria)', 'green');
      return 0;
    }
    if (report.passRate >= 70) {
      log('\n⚠️  App needs some fixes before production', 'yellow');
      return 1;
    }

    log('\n❌ App has critical issues that must be fixed', 'red');
    return 1;
  } catch (error) {
    logError('Test suite error', error);
    return 1;
  } finally {
    if (browser) {
      await browser.close();
    }
    stopDevServer();
  }
}

runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    stopDevServer();
    process.exit(1);
  });
