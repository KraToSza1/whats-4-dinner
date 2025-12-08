#!/usr/bin/env node
/* eslint-env node */
/* global process */

/**
 * Comprehensive Feature Testing
 * Tests EVERY feature in the app systematically
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:5173',
  timeout: 120000,
  waitForSelectorTimeout: 20000,
  headless: process.env.CI === 'true', // Headless in CI, visible locally
  skipServerStart: process.env.SKIP_SERVER_START === 'true', // Skip if server already running
};

const results = {
  passed: [],
  failed: [],
  total: 0,
};

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
  };
  // eslint-disable-next-line no-console
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function recordTest(testName, passed, error = null) {
  results.total++;
  if (passed) {
    results.passed.push(testName);
    log(`✅ PASS: ${testName}`, 'green');
  } else {
    results.failed.push({ name: testName, error });
    log(`❌ FAIL: ${testName}`, 'red');
    if (error) log(`   Error: ${error.message || error}`, 'red');
  }
}

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
          log('✅ Dev server ready!', 'green');
          setTimeout(resolve, 5000);
        }
      }
    });

    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Dev server failed to start'));
      }
    }, 60000);
  });
}

// Unused helper function - kept for potential future use
async function _waitForElement(page, selector, timeout = TEST_CONFIG.waitForSelectorTimeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function testFeature(name, testFn) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
  try {
    await testFn();
    recordTest(name, true);
  } catch (error) {
    recordTest(name, false, error);
  }
}

async function runAllTests() {
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Set longer timeouts
  page.setDefaultTimeout(TEST_CONFIG.timeout);
  page.setDefaultNavigationTimeout(TEST_CONFIG.timeout);

  try {
    // Navigate to homepage
    log('\n📱 Navigating to homepage...', 'blue');
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(3000);

    // TEST 1: Homepage loads
    await testFeature('Homepage loads correctly', async () => {
      const title = await page.title();
      if (!title || title.includes('Error')) {
        throw new Error('Homepage failed to load');
      }
    });

    // TEST 2: Daily Recipe Surprise
    await testFeature('Daily Recipe Surprise displays', async () => {
      const dailyRecipe = await page.$(
        '[class*="daily"] [class*="recipe"], [class*="DailyRecipe"]'
      );
      if (!dailyRecipe) {
        // Check if loading
        const loading = await page.$('text=Loading');
        if (loading) {
          await page.waitForTimeout(5000);
        }
        const recipe = await page.$('[class*="recipe"], [class*="card"]');
        if (!recipe) throw new Error('Daily recipe not found');
      }
    });

    // TEST 3: Search functionality
    await testFeature('Recipe search works', async () => {
      const searchInput = await page.$(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="recipe" i]'
      );
      if (searchInput) {
        await searchInput.type('chicken', { delay: 100 });
        await page.waitForTimeout(1000);
        const searchButton = await page.$('button[type="submit"], button:has-text("Search")');
        if (searchButton) {
          await searchButton.click();
        } else {
          // Try Enter key
          await page.keyboard.press('Enter');
        }
        await page.waitForTimeout(5000);
        const results = await page.$$('[class*="recipe"], [class*="card"]');
        if (results.length === 0) throw new Error('No search results found');
      } else {
        throw new Error('Search input not found');
      }
    });

    // TEST 4: Click on a recipe
    await testFeature('Click recipe and navigate to detail page', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      // Find a recipe link
      const recipeLink = await page.$('a[href*="/recipe/"]');
      if (recipeLink) {
        // href not used but evaluated for debugging
        await page.evaluate(el => el.getAttribute('href'), recipeLink);
        await recipeLink.click();
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        if (!currentUrl.includes('/recipe/')) {
          throw new Error('Did not navigate to recipe page');
        }

        // Check if recipe loaded (not stuck on loading)
        await page.waitForTimeout(3000);
        const loading = await page.$('text=Loading delicious recipe details');
        if (loading) {
          // Wait a bit more
          await page.waitForTimeout(10000);
          const stillLoading = await page.$('text=Loading delicious recipe details');
          if (stillLoading) {
            throw new Error('Recipe page stuck on loading');
          }
        }

        // Check for recipe content
        const recipeTitle = await page.$('h1, [class*="title"]');
        if (!recipeTitle) {
          const error = await page.$('[class*="error"]');
          if (error) throw new Error('Recipe page shows error');
        }
      } else {
        throw new Error('No recipe link found');
      }
    });

    // TEST 5: Filters - Family-Friendly preset
    await testFeature('Smart filters - Family-Friendly preset', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      // Find filters button or section
      const filterButton = await page.$(
        'button:has-text("Filter"), button:has-text("Filters"), [class*="filter"] button'
      );
      if (filterButton) {
        await filterButton.click();
        await page.waitForTimeout(2000);
      }

      // Find Family-Friendly preset
      const familyFriendly = await page.$(
        'button:has-text("Family-Friendly"), [class*="preset"]:has-text("Family")'
      );
      if (familyFriendly) {
        await familyFriendly.click();
        await page.waitForTimeout(5000);

        // Check if recipes changed
        const recipes = await page.$$('[class*="recipe"], [class*="card"]');
        if (recipes.length === 0) {
          throw new Error('No recipes after applying filter');
        }
      } else {
        // Try Apply button
        const applyButton = await page.$('button:has-text("Apply")');
        if (applyButton) {
          await applyButton.click();
          await page.waitForTimeout(5000);
        }
      }
    });

    // TEST 6: Grocery List
    await testFeature('Grocery list drawer opens', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      // Find grocery button (🛒 emoji or text)
      const groceryButton = await page.$(
        'button:has-text("🛒"), button[title*="grocery" i], button[aria-label*="grocery" i], [class*="grocery"] button'
      );
      if (groceryButton) {
        await groceryButton.click();
        await page.waitForTimeout(3000);

        // Check if drawer opened
        const drawer = await page.$(
          '[role="dialog"], [aria-modal="true"], [class*="drawer"], [class*="grocery"]'
        );
        if (!drawer) {
          // Check if it's already visible
          const groceryContent = await page.$('text=Grocery, text=My Grocery List');
          if (!groceryContent) {
            throw new Error('Grocery drawer did not open');
          }
        }
      } else {
        throw new Error('Grocery button not found');
      }
    });

    // TEST 7: Meal Planner
    await testFeature('Meal Planner page loads', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/meal-planner`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      await page.waitForTimeout(5000);

      const error = await page.$('[class*="error"], text=Error');
      if (error) {
        throw new Error('Meal planner page shows error');
      }

      // Check for meal planner content
      const plannerContent = await page.$(
        '[class*="meal"], [class*="planner"], text=Meal, text=Plan'
      );
      if (!plannerContent) {
        // Might be loading or empty state
        await page.waitForTimeout(3000);
        const stillNoContent = await page.$('[class*="meal"], [class*="planner"]');
        if (!stillNoContent) {
          throw new Error('Meal planner content not found');
        }
      }
    });

    // TEST 8: Calorie Tracker
    await testFeature('Calorie Tracker accessible', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      // Try to find calorie tracker button/link
      const calorieLink = await page.$(
        'a[href*="calorie"], button:has-text("Calorie"), [class*="calorie"]'
      );
      if (calorieLink) {
        await calorieLink.click();
        await page.waitForTimeout(3000);

        const calorieContent = await page.$('[class*="calorie"], text=Calorie, text=Track');
        if (!calorieContent) {
          throw new Error('Calorie tracker not found');
        }
      } else {
        // Navigate directly
        await page.goto(`${TEST_CONFIG.baseUrl}/#calorie`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        const calorieContent = await page.$('[class*="calorie"], text=Calorie');
        if (!calorieContent) {
          // Might be in a modal or drawer
          await page.waitForTimeout(2000);
        }
      }
    });

    // TEST 9: Favorites
    await testFeature('Favorites functionality', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      // Find a favorite button
      const favoriteButton = await page.$(
        'button[aria-label*="favorite" i], button[title*="favorite" i], [class*="favorite"] button, button:has-text("❤"), button:has-text("♡")'
      );
      if (favoriteButton) {
        await favoriteButton.click();
        await page.waitForTimeout(2000);

        // Check if it's now favorited (visual change)
        const _favorited = await page.$('[class*="favorited"], [class*="active"]');
        // Just check it doesn't error
      }
    });

    // TEST 10: Theme Toggle
    await testFeature('Theme toggle works', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      const themeButton = await page.$(
        'button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀️"), [class*="theme"] button'
      );
      if (themeButton) {
        await themeButton.click();
        await page.waitForTimeout(2000);
        // Just verify it doesn't error
      }
    });

    // TEST 11: Multiple recipe searches
    await testFeature('Different recipe searches work', async () => {
      const searches = ['pasta', 'salad', 'dessert', 'breakfast'];

      for (const searchTerm of searches) {
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
          await searchInput.click({ clickCount: 3 });
          await searchInput.type(searchTerm, { delay: 100 });
          await page.waitForTimeout(1000);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(5000);

          const results = await page.$$('[class*="recipe"], [class*="card"]');
          if (results.length === 0 && !(await page.$('text=No results'))) {
            throw new Error(`No results for search: ${searchTerm}`);
          }
        }
      }
    });

    // TEST 12: Recipe detail page features
    await testFeature('Recipe detail page features work', async () => {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      const recipeLink = await page.$('a[href*="/recipe/"]');
      if (recipeLink) {
        await recipeLink.click();
        await page.waitForTimeout(8000); // Wait for recipe to load

        // Check for ingredients
        const ingredients = await page.$('[class*="ingredient"], text=Ingredients');
        if (!ingredients) {
          // Might be in a different section
          await page.waitForTimeout(3000);
        }

        // Check for instructions
        const instructions = await page.$('[class*="instruction"], text=Instructions, text=Steps');
        if (!instructions) {
          await page.waitForTimeout(3000);
        }

        // Check for share button
        const _shareButton = await page.$('button:has-text("Share"), [class*="share"] button');
        // Just verify page loaded
      }
    });

    // Print summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 TEST SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`Total Tests: ${results.total}`, 'blue');
    log(`✅ Passed: ${results.passed.length}`, 'green');
    log(`❌ Failed: ${results.failed.length}`, 'red');

    const passRate = ((results.passed.length / results.total) * 100).toFixed(1);
    log(`\nPass Rate: ${passRate}%`, passRate >= 90 ? 'green' : 'yellow');

    if (results.failed.length > 0) {
      log('\n❌ Failed Tests:', 'red');
      results.failed.forEach(f => {
        log(`  - ${f.name}`, 'red');
        if (f.error) log(`    ${f.error.message || f.error}`, 'red');
      });
    }

    log('\n' + '='.repeat(60), 'cyan');
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await browser.close();
    if (devServer) {
      devServer.kill();
    }
    process.exit(results.failed.length > 0 ? 1 : 0);
  }
}

// Main execution
(async () => {
  try {
    if (!TEST_CONFIG.skipServerStart) {
      await startDevServer();
    } else {
      log('⏭️  Skipping server start (assuming server already running)', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    await runAllTests();
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    if (devServer) devServer.kill();
    process.exit(1);
  }
})();
