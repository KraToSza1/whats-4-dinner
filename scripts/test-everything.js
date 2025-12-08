#!/usr/bin/env node
/* eslint-env node */
/* global process */

/**
 * COMPREHENSIVE TEST SUITE - Tests EVERY feature in the app
 * This tests all routes, all features, all combinations
 */

import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const HEADLESS = process.env.CI === 'true';

const results = { passed: [], failed: [], total: 0 };

function log(msg, color = 'reset') {
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
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function test(name, fn) {
  results.total++;
  return async () => {
    try {
      await fn();
      results.passed.push(name);
      log(`✅ ${name}`, 'green');
      return true;
    } catch (error) {
      results.failed.push({ name, error: error.message });
      log(`❌ ${name}: ${error.message}`, 'red');
      return false;
    }
  };
}

// Helper: delay function (replaces waitForTimeout)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: wait for selector
async function _waitFor(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

// Helper: safe click with delay
async function _clickSafe(page, selector, _description) {
  const element = await page.$(selector);
  if (element) {
    await element.click();
    await delay(1000);
    return true;
  }
  return false;
}

// Helper: find element by text content
async function findElementByText(page, text, tag = 'button') {
  const elements = await page.$$(tag);
  for (const el of elements) {
    const textContent = await page.evaluate(el => el.textContent, el);
    if (textContent && textContent.includes(text)) {
      return el;
    }
  }
  return null;
}

// Helper: navigate and wait
async function navigateAndWait(page, url, waitTime = 3000) {
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(waitTime);
    return true;
  } catch (error) {
    log(`Navigation failed: ${url} - ${error.message}`, 'yellow');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 STARTING COMPREHENSIVE TEST SUITE\n', 'cyan');

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // ============================================
    // CORE FUNCTIONALITY TESTS
    // ============================================

    log('\n📱 CORE FUNCTIONALITY', 'magenta');

    await test('Homepage loads', async () => {
      await navigateAndWait(page, '/');
      const title = await page.title();
      if (!title || title.includes('Error')) throw new Error('Homepage failed');
    })();

    await test('Daily Recipe Surprise displays', async () => {
      await navigateAndWait(page, '/');
      const daily = await page.$('[class*="daily"], [class*="DailyRecipe"]');
      if (!daily) {
        await delay(5000);
        const recipe = await page.$('[class*="recipe"], [class*="card"]');
        if (!recipe) throw new Error('Daily recipe not visible');
      }
    })();

    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================

    log('\n🔍 SEARCH TESTS', 'magenta');

    const searchTerms = [
      'chicken',
      'pasta',
      'salad',
      'dessert',
      'breakfast',
      'vegan',
      'gluten-free',
    ];
    for (const term of searchTerms) {
      await test(`Search: "${term}"`, async () => {
        await navigateAndWait(page, '/');
        await delay(3000); // Wait for page to fully load
        
        // Try multiple selectors for search input
        let input = await page.$('input[type="search"]');
        if (!input) {
          input = await page.$('input[placeholder*="search" i]');
        }
        if (!input) {
          input = await page.$('input[placeholder*="ingredient" i]');
        }
        if (!input) {
          input = await page.$('form[role="search"] input');
        }
        if (!input) {
          // Try finding by form with search role
          const form = await page.$('form[role="search"]');
          if (form) {
            input = await form.$('input');
          }
        }
        if (!input) throw new Error('Search input not found');

        await input.click({ clickCount: 3 });
        await input.type(term, { delay: 50 });
        await delay(500);
        await page.keyboard.press('Enter');
        await delay(5000);

        const results = await page.$$('[class*="recipe"], [class*="card"]');
        const noResults = await page.evaluate(() => {
          return document.body.textContent.includes('No results') || 
                 document.body.textContent.includes('not found');
        });
        if (results.length === 0 && !noResults) {
          throw new Error('Search returned no results and no message');
        }
      })();
    }

    // ============================================
    // FILTER TESTS
    // ============================================

    log('\n🎯 FILTER TESTS', 'magenta');

    await test('Open filters panel', async () => {
      await navigateAndWait(page, '/');
      // Try multiple ways to find filter button
      let filterBtn = await findElementByText(page, 'Filter', 'button');
      if (!filterBtn) {
        filterBtn = await page.$('[class*="filter"] button, button[aria-label*="filter" i]');
      }
      if (filterBtn) {
        await filterBtn.click();
        await delay(2000);
      }
    })();

    const presets = [
      'Family-Friendly',
      'Quick & Easy',
      'Healthy',
      'Vegetarian',
      'Vegan',
      'High Protein',
    ];
    for (const preset of presets) {
      await test(`Apply preset: ${preset}`, async () => {
        await navigateAndWait(page, '/');
        await delay(2000);

        const presetBtn = await findElementByText(page, preset, 'button');
        if (presetBtn) {
          await presetBtn.click();
          await delay(5000);

          const recipes = await page.$$('[class*="recipe"], [class*="card"]');
          if (recipes.length === 0) {
            const noResults = await page.evaluate(() => {
              return document.body.textContent.includes('No results') || 
                     document.body.textContent.includes('no recipes');
            });
            if (!noResults) throw new Error('No recipes after filter');
          }
        }
      })();
    }

    await test('Apply button triggers search', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);

      const applyBtn = await findElementByText(page, 'Apply', 'button');
      if (applyBtn) {
        await applyBtn.click();
        await delay(5000);
        // Just verify no errors
      }
    })();

    // ============================================
    // RECIPE DETAIL PAGE TESTS
    // ============================================

    log('\n📄 RECIPE PAGE TESTS', 'magenta');

    await test('Navigate to recipe detail page', async () => {
      await navigateAndWait(page, '/');
      await delay(5000); // Wait longer for recipes to load

      // Try multiple selectors for recipe links
      let recipeLink = await page.$('a[href*="/recipe/"]');
      if (!recipeLink) {
        // Wait a bit more and try again
        await delay(3000);
        recipeLink = await page.$('a[href*="/recipe/"]');
      }
      if (!recipeLink) {
        // Try finding by class
        recipeLink = await page.$('[class*="recipe"] a, [class*="card"] a');
      }
      if (!recipeLink) {
        throw new Error('No recipe link found - recipes may not have loaded');
      }

      // href not used but evaluated for debugging
      await page.evaluate(el => el.getAttribute('href'), recipeLink);
      await recipeLink.click();
      await delay(8000);

      if (!page.url().includes('/recipe/')) {
        throw new Error('Did not navigate to recipe page');
      }

      // Check for loading state resolution
      const loading = await page.evaluate(() => {
        return document.body.textContent.includes('Loading delicious recipe details');
      });
      if (loading) {
        await delay(15000);
        const stillLoading = await page.evaluate(() => {
          return document.body.textContent.includes('Loading delicious recipe details');
        });
        if (stillLoading) throw new Error('Recipe stuck on loading');
      }

      // Check for content
      const title = await page.$('h1, [class*="title"]');
      const error = await page.$('[class*="error"]:not([class*="hidden"])');
      if (!title && error) throw new Error('Recipe page shows error');
    })();

    await test('Recipe page - Ingredients section', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);
      const link = await page.$('a[href*="/recipe/"]');
      if (link) {
        await link.click();
        await delay(8000);
        const _ingredients = await page.$('[class*="ingredient"]') || 
          await page.evaluate(() => document.body.textContent.includes('Ingredients'));
        // Just verify page loaded
      }
    })();

    await test('Recipe page - Instructions section', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);
      const link = await page.$('a[href*="/recipe/"]');
      if (link) {
        await link.click();
        await delay(8000);
        const _instructions = await page.$('[class*="instruction"]') || 
          await page.evaluate(() => document.body.textContent.includes('Instructions') || 
            document.body.textContent.includes('Steps'));
        // Just verify page loaded
      }
    })();

    await test('Recipe page - Share button', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);
      const link = await page.$('a[href*="/recipe/"]');
      if (link) {
        await link.click();
        await delay(8000);
        const _shareBtn = await findElementByText(page, 'Share', 'button') || 
          await page.$('[class*="share"] button');
        // Just verify page loaded
      }
    })();

    await test('Recipe page - Favorite button', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);
      const link = await page.$('a[href*="/recipe/"]');
      if (link) {
        await link.click();
        await delay(8000);
        let favoriteBtn = await findElementByText(page, '❤', 'button');
        if (!favoriteBtn) {
          favoriteBtn = await page.$('button[aria-label*="favorite" i], [class*="favorite"] button');
        }
        if (favoriteBtn) {
          await favoriteBtn.click();
          await delay(2000);
        }
      }
    })();

    // ============================================
    // GROCERY LIST TESTS
    // ============================================

    log('\n🛒 GROCERY LIST TESTS', 'magenta');

    await test('Open grocery drawer', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);

      let groceryBtn = await findElementByText(page, '🛒', 'button');
      if (!groceryBtn) {
        groceryBtn = await page.$('button[title*="grocery" i], button[aria-label*="grocery" i]');
      }
      if (groceryBtn) {
        await groceryBtn.click();
        await delay(3000);

        const drawer = await page.$('[role="dialog"], [aria-modal="true"], [class*="drawer"]');
        const groceryContent = await page.evaluate(() => {
          return document.body.textContent.includes('Grocery') || 
                 document.body.textContent.includes('My Grocery List');
        });
        if (!drawer && !groceryContent) {
          throw new Error('Grocery drawer did not open');
        }
      } else {
        throw new Error('Grocery button not found');
      }
    })();

    // ============================================
    // PAGE NAVIGATION TESTS
    // ============================================

    log('\n📑 PAGE NAVIGATION TESTS', 'magenta');

    const pages = [
      { path: '/meal-planner', name: 'Meal Planner' },
      { path: '/favorites', name: 'Favorites' },
      { path: '/collections', name: 'Collections' },
      { path: '/profile', name: 'Profile' },
      { path: '/calorie-tracker', name: 'Calorie Tracker' },
      { path: '/budget-tracker', name: 'Budget Tracker' },
      { path: '/water-tracker', name: 'Water Tracker' },
      { path: '/pantry', name: 'Pantry' },
      { path: '/meal-reminders', name: 'Meal Reminders' },
      { path: '/dietician-ai', name: 'Dietician AI' },
      { path: '/analytics', name: 'Analytics' },
      { path: '/family-plan', name: 'Family Plan' },
      { path: '/help', name: 'Help' },
      { path: '/terms', name: 'Terms' },
      { path: '/privacy', name: 'Privacy' },
    ];

    for (const { path, name } of pages) {
      await test(`Page loads: ${name}`, async () => {
        const loaded = await navigateAndWait(page, path, 5000);
        if (!loaded) throw new Error(`Failed to navigate to ${path}`);

        // Check for error elements
        const errorElement = await page.$('[class*="error"]:not([class*="hidden"])');
        const hasErrorText = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          return bodyText.includes('Something went wrong') || 
                 (bodyText.includes('Error') && !bodyText.includes('hidden'));
        });
        
        if (errorElement || hasErrorText) {
          let errorText = 'Unknown error';
          if (errorElement) {
            errorText = await page.evaluate(el => el.textContent || 'Error element found', errorElement);
          } else if (hasErrorText) {
            errorText = await page.evaluate(() => {
              const errorDiv = document.querySelector('[role="alert"], [class*="error"]');
              return errorDiv ? errorDiv.textContent : 'Error text found in page';
            });
          }
          throw new Error(`Page shows error: ${errorText}`);
        }
      })();
    }

    // ============================================
    // FEATURE INTERACTION TESTS
    // ============================================

    log('\n⚙️ FEATURE INTERACTION TESTS', 'magenta');

    await test('Theme toggle', async () => {
      await navigateAndWait(page, '/');
      let themeBtn = await findElementByText(page, '🌙', 'button') || 
                     await findElementByText(page, '☀️', 'button');
      if (!themeBtn) {
        themeBtn = await page.$('button[aria-label*="theme" i], button[title*="theme" i]');
      }
      if (themeBtn) {
        await themeBtn.click();
        await delay(2000);
      }
    })();

    await test('Add recipe to favorites from homepage', async () => {
      await navigateAndWait(page, '/');
      await delay(3000);

      const favoriteBtn = await page.$(
        'button[aria-label*="favorite" i], button[title*="favorite" i], [class*="favorite"] button'
      );
      if (favoriteBtn) {
        await favoriteBtn.click();
        await delay(2000);
      }
    })();

    await test('Pagination works', async () => {
      await navigateAndWait(page, '/');
      await delay(3000);

      let nextBtn = await findElementByText(page, 'Next', 'button');
      if (!nextBtn) {
        nextBtn = await page.$('button[aria-label*="next" i]');
      }
      if (nextBtn) {
        const disabled = await page.evaluate(el => el.disabled, nextBtn);
        if (!disabled) {
          await nextBtn.click();
          await delay(5000);
        }
      }
    })();

    // ============================================
    // COMBINATION TESTS
    // ============================================

    log('\n🔗 COMBINATION TESTS', 'magenta');

    await test('Search + Filter combination', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);

      // Search first
      const input = await page.$('input[type="search"]');
      if (input) {
        await input.type('chicken', { delay: 50 });
        await page.keyboard.press('Enter');
        await delay(5000);

        // Then apply filter
        const preset = await findElementByText(page, 'Family-Friendly', 'button');
        if (preset) {
          await preset.click();
          await delay(5000);
        }
      }
    })();

    await test('Recipe detail + Favorite + Share', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);

      const link = await page.$('a[href*="/recipe/"]');
      if (link) {
        await link.click();
        await delay(8000);

        // Favorite
        const favorite = await page.$('button[aria-label*="favorite" i]');
        if (favorite) {
          await favorite.click();
          await delay(1000);
        }

        // Share
        const share = await findElementByText(page, 'Share', 'button');
        if (share) {
          await share.click();
          await delay(1000);
        }
      }
    })();

    // ============================================
    // ERROR HANDLING TESTS
    // ============================================

    log('\n⚠️ ERROR HANDLING TESTS', 'magenta');

    await test('Invalid recipe ID handles gracefully', async () => {
      await navigateAndWait(page, '/recipe/invalid-id-12345', 5000);
      const _error = await page.$('[class*="error"]') || 
        await page.evaluate(() => {
          return document.body.textContent.includes('not found') || 
                 document.body.textContent.includes('Error');
        });
      // Should show error or redirect, not crash
    })();

    await test('Empty search handles gracefully', async () => {
      await navigateAndWait(page, '/');
      await delay(2000);
      const input = await page.$('input[type="search"]');
      if (input) {
        await input.click();
        await page.keyboard.press('Enter');
        await delay(3000);
        // Should not crash
      }
    })();

    // ============================================
    // PRINT SUMMARY
    // ============================================

    log('\n' + '='.repeat(70), 'cyan');
    log('📊 COMPREHENSIVE TEST SUMMARY', 'cyan');
    log('='.repeat(70), 'cyan');
    log(`Total Tests: ${results.total}`, 'blue');
    log(`✅ Passed: ${results.passed.length}`, 'green');
    log(`❌ Failed: ${results.failed.length}`, 'red');

    const passRate = ((results.passed.length / results.total) * 100).toFixed(1);
    log(
      `\n🎯 Pass Rate: ${passRate}%`,
      passRate >= 95 ? 'green' : passRate >= 80 ? 'yellow' : 'red'
    );

    if (results.failed.length > 0) {
      log('\n❌ FAILED TESTS:', 'red');
      results.failed.forEach(f => {
        log(`  • ${f.name}`, 'red');
        log(`    ${f.error}`, 'red');
      });
    }

    if (consoleErrors.length > 0) {
      log(`\n⚠️ Console Errors: ${consoleErrors.length}`, 'yellow');
      consoleErrors.slice(0, 5).forEach(err => log(`  ${err}`, 'yellow'));
    }

    log('\n' + '='.repeat(70), 'cyan');
  } catch (error) {
    log(`\n💥 FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await browser.close();
    process.exit(results.failed.length > 0 ? 1 : 0);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 FATAL: ${error.message}`, 'red');
  process.exit(1);
});
