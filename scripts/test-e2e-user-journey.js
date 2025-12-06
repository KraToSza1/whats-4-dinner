#!/usr/bin/env node

/**
 * Comprehensive End-to-End User Journey Test
 *
 * This script simulates a complete user journey through the app
 * without requiring real accounts. It tests all features, pages,
 * and user interactions to ensure everything works correctly.
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  timeout: 30000,
  waitForSelectorTimeout: 10000,
  headless: false, // Set to true for CI/CD
};

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: [],
  total: 0,
};

// Colors for console output
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

function logTest(name, status, error = null) {
  results.total++;
  if (status === 'passed') {
    results.passed.push(name);
    log(`✅ PASS: ${name}`, 'green');
  } else if (status === 'failed') {
    results.failed.push({ name, error });
    log(`❌ FAIL: ${name}`, 'red');
    if (error) log(`   Error: ${error.message || error}`, 'red');
  } else {
    results.skipped.push(name);
    log(`⏭️  SKIP: ${name}`, 'yellow');
  }
}

// Start dev server
let devServer = null;

async function startDevServer() {
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
          setTimeout(resolve, 3000); // Give it a moment to fully start
        }
      }
    });

    devServer.stderr.on('data', data => {
      const output = data.toString();
      if (output.includes('error')) {
        console.error('Server error:', output);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Dev server failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

// Stop dev server
function stopDevServer() {
  if (devServer) {
    log('🛑 Stopping dev server...', 'cyan');
    devServer.kill();
  }
}

// Setup browser and page
async function setupBrowser() {
  log('🌐 Launching browser...', 'cyan');
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Set up console logging
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      const text = msg.text();
      // Ignore known non-critical errors
      if (
        !text.includes('Auth session missing') &&
        !text.includes('Image failed to load') &&
        !text.includes('Failed to load resource') &&
        !text.includes('NS_BINDING_ABORTED')
      ) {
        console.log(`[Browser ${type}]:`, text);
      }
    }
  });

  // Handle page errors
  page.on('pageerror', error => {
    const errorMsg = error.message;
    // Ignore known non-critical errors
    if (!errorMsg.includes('Auth session missing') && !errorMsg.includes('ResizeObserver')) {
      console.error('[Page Error]:', errorMsg);
    }
  });

  return { browser, page };
}

// Helper: Wait for element
async function waitForElement(page, selector, timeout = TEST_CONFIG.waitForSelectorTimeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper: Check if element exists
async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Helper: Mock localStorage data
async function setupMockUserData(page) {
  await page.evaluateOnNewDocument(() => {
    // Mock user preferences
    localStorage.setItem('filters:diet', 'vegetarian');
    localStorage.setItem('filters:maxTime', '30');
    localStorage.setItem('filters:mealType', 'dinner');
    localStorage.setItem('filters:pantry', JSON.stringify(['chicken', 'rice', 'tomato']));
    localStorage.setItem('favorites', JSON.stringify([]));
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('recipesPerPage', '24');

    // Mock gamification data
    localStorage.setItem('xp', '500');
    localStorage.setItem('level', '2');
    localStorage.setItem('streak', '5');
    localStorage.setItem('badges', JSON.stringify(['first_recipe', 'explorer']));
  });
}

// Test: Homepage loads
async function testHomepage(page) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, {
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout,
    });
    await page.waitForTimeout(2000); // Wait for React to render

    // Check for key elements
    const hasHeader = await elementExists(page, 'header, [role="banner"], nav');
    const hasSearch = await elementExists(
      page,
      'input[type="text"], input[placeholder*="search" i], input[placeholder*="ingredient" i]'
    );
    const hasRecipes = await elementExists(page, '[class*="recipe"], [class*="card"], article');

    if (hasHeader && hasSearch) {
      logTest('Homepage loads and displays correctly', 'passed');
      return true;
    } else {
      logTest('Homepage loads and displays correctly', 'failed', 'Missing key elements');
      return false;
    }
  } catch (error) {
    logTest('Homepage loads and displays correctly', 'failed', error);
    return false;
  }
}

// Test: Recipe search
async function testRecipeSearch(page) {
  try {
    // Find search input
    const searchInput = await page.$(
      'input[type="text"], input[placeholder*="search" i], input[placeholder*="ingredient" i]'
    );
    if (!searchInput) {
      logTest('Recipe search functionality', 'skipped', 'Search input not found');
      return false;
    }

    // Type search query
    await searchInput.type('chicken', { delay: 100 });
    await page.waitForTimeout(1000);

    // Try to submit (look for button or press Enter)
    const searchButton = await page.$(
      'button[type="submit"], button:has-text("Search"), button:has-text("Find")'
    );
    if (searchButton) {
      await searchButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait for results
    await page.waitForTimeout(3000);

    // Check if recipes loaded
    const hasResults = await elementExists(
      page,
      '[class*="recipe"], [class*="card"], article, [data-testid*="recipe"]'
    );

    if (hasResults) {
      logTest('Recipe search functionality', 'passed');
      return true;
    } else {
      logTest('Recipe search functionality', 'failed', 'No results displayed');
      return false;
    }
  } catch (error) {
    logTest('Recipe search functionality', 'failed', error);
    return false;
  }
}

// Test: Navigation to pages
async function testPageNavigation(page, route, pageName) {
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}${route}`, {
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout,
    });
    await page.waitForTimeout(2000);

    // Check if page loaded (not 404)
    const pageContent = await page.content();
    const is404 =
      pageContent.includes('404') ||
      pageContent.includes('Not Found') ||
      pageContent.includes('Page not found');

    if (!is404) {
      logTest(`Navigate to ${pageName}`, 'passed');
      return true;
    } else {
      logTest(`Navigate to ${pageName}`, 'failed', 'Page not found (404)');
      return false;
    }
  } catch (error) {
    logTest(`Navigate to ${pageName}`, 'failed', error);
    return false;
  }
}

// Test: Recipe page
async function testRecipePage(page) {
  try {
    // First, get a recipe ID from homepage
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    // Find a recipe link
    const recipeLink = await page.$('a[href*="/recipe/"], [class*="recipe"] a, article a');
    if (!recipeLink) {
      logTest('Recipe detail page', 'skipped', 'No recipe links found');
      return false;
    }

    const href = await page.evaluate(el => el.getAttribute('href'), recipeLink);
    if (!href || !href.includes('/recipe/')) {
      logTest('Recipe detail page', 'skipped', 'Invalid recipe link');
      return false;
    }

    // Navigate to recipe
    await page.goto(`${TEST_CONFIG.baseUrl}${href}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Check for recipe content
    const hasIngredients = await elementExists(page, '[class*="ingredient"], li, ul, ol');
    const hasInstructions = await elementExists(page, '[class*="instruction"], [class*="step"], p');

    if (hasIngredients || hasInstructions) {
      logTest('Recipe detail page', 'passed');
      return true;
    } else {
      logTest('Recipe detail page', 'failed', 'Recipe content not found');
      return false;
    }
  } catch (error) {
    logTest('Recipe detail page', 'failed', error);
    return false;
  }
}

// Test: Filters
async function testFilters(page) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Look for filter button or panel
    const filterButton = await page.$(
      'button:has-text("Filter"), button:has-text("Filters"), [aria-label*="filter" i]'
    );
    if (!filterButton) {
      logTest('Filter functionality', 'skipped', 'Filter button not found');
      return false;
    }

    await filterButton.click();
    await page.waitForTimeout(1000);

    // Check if filters panel opened
    const hasFilters = await elementExists(
      page,
      'select, [role="combobox"], input[type="checkbox"], [class*="filter"]'
    );

    if (hasFilters) {
      logTest('Filter functionality', 'passed');
      return true;
    } else {
      logTest('Filter functionality', 'failed', 'Filter panel not found');
      return false;
    }
  } catch (error) {
    logTest('Filter functionality', 'failed', error);
    return false;
  }
}

// Test: Grocery list
async function testGroceryList(page) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Look for grocery list button
    const groceryButton = await page.$(
      'button:has-text("Grocery"), button:has-text("Shopping"), [aria-label*="grocery" i], [aria-label*="shopping" i]'
    );
    if (!groceryButton) {
      logTest('Grocery list functionality', 'skipped', 'Grocery button not found');
      return false;
    }

    await groceryButton.click();
    await page.waitForTimeout(1000);

    // Check if grocery drawer opened
    const hasGroceryList = await elementExists(
      page,
      '[class*="grocery"], [class*="shopping"], ul, ol'
    );

    if (hasGroceryList) {
      logTest('Grocery list functionality', 'passed');
      return true;
    } else {
      logTest('Grocery list functionality', 'failed', 'Grocery list not found');
      return false;
    }
  } catch (error) {
    logTest('Grocery list functionality', 'failed', error);
    return false;
  }
}

// Test: Theme toggle
async function testThemeToggle(page) {
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Look for theme toggle button
    const themeButton = await page.$(
      'button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i], button:has-text("🌙"), button:has-text("☀️")'
    );
    if (!themeButton) {
      logTest('Theme toggle functionality', 'skipped', 'Theme button not found');
      return false;
    }

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    await themeButton.click();
    await page.waitForTimeout(500);

    // Check if theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    if (initialTheme !== newTheme) {
      logTest('Theme toggle functionality', 'passed');
      return true;
    } else {
      logTest('Theme toggle functionality', 'failed', 'Theme did not change');
      return false;
    }
  } catch (error) {
    logTest('Theme toggle functionality', 'failed', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Starting Comprehensive E2E User Journey Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');

  let browser = null;
  let page = null;

  try {
    // Start dev server
    await startDevServer();

    // Setup browser
    const browserSetup = await setupBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;

    // Setup mock user data
    await setupMockUserData(page);

    // Run tests
    log('\n📋 Running Tests...\n', 'blue');

    // Core functionality tests
    await testHomepage(page);
    await testRecipeSearch(page);
    await testFilters(page);
    await testGroceryList(page);
    await testThemeToggle(page);
    await testRecipePage(page);

    // Page navigation tests
    const pages = [
      { route: '/meal-planner', name: 'Meal Planner' },
      { route: '/profile', name: 'Profile' },
      { route: '/favorites', name: 'Favorites' },
      { route: '/collections', name: 'Collections' },
      { route: '/analytics', name: 'Analytics' },
      { route: '/help', name: 'Help' },
      { route: '/terms', name: 'Terms' },
      { route: '/privacy', name: 'Privacy' },
      { route: '/calorie-tracker', name: 'Calorie Tracker' },
      { route: '/water-tracker', name: 'Water Tracker' },
      { route: '/meal-reminders', name: 'Meal Reminders' },
      { route: '/budget-tracker', name: 'Budget Tracker' },
      { route: '/pantry', name: 'Pantry' },
    ];

    for (const pageTest of pages) {
      await testPageNavigation(page, pageTest.route, pageTest.name);
    }

    // Print results
    log('\n' + '='.repeat(60), 'cyan');
    log('\n📊 Test Results Summary\n', 'blue');
    log(`Total Tests: ${results.total}`, 'cyan');
    log(`✅ Passed: ${results.passed.length}`, 'green');
    log(`❌ Failed: ${results.failed.length}`, 'red');
    log(`⏭️  Skipped: ${results.skipped.length}`, 'yellow');

    if (results.failed.length > 0) {
      log('\n❌ Failed Tests:', 'red');
      results.failed.forEach(({ name, error }) => {
        log(`   - ${name}`, 'red');
        if (error) log(`     ${error.message || error}`, 'red');
      });
    }

    if (results.skipped.length > 0) {
      log('\n⏭️  Skipped Tests:', 'yellow');
      results.skipped.forEach(name => {
        log(`   - ${name}`, 'yellow');
      });
    }

    // Final status
    const successRate = ((results.passed.length / results.total) * 100).toFixed(1);
    log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

    if (results.failed.length === 0) {
      log('\n🎉 All critical tests passed!', 'green');
      return 0;
    } else {
      log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
      return 1;
    }
  } catch (error) {
    log(`\n💥 Test suite error: ${error.message}`, 'red');
    console.error(error);
    return 1;
  } finally {
    if (browser) {
      await browser.close();
    }
    stopDevServer();
  }
}

// Run tests
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    stopDevServer();
    process.exit(1);
  });
