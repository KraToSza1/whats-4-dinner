# End-to-End Testing Guide

## Overview

This guide explains how to run comprehensive E2E tests that simulate a complete user journey through your app without requiring real accounts.

## Test Suites

### 1. Feature Tests (`test:features`)
Tests code structure, file existence, and configuration:
- ✅ All routes are defined
- ✅ All context providers are set up
- ✅ All pages exist
- ✅ All components exist
- ✅ API functions exist
- ✅ Utility functions exist
- ✅ PWA configuration is correct
- ✅ Error handling is in place

**Run:** `npm run test:features`

**Duration:** ~5 seconds

**No server required** - runs instantly

### 2. E2E User Journey Tests (`test:e2e`)
Simulates real user interactions using browser automation:
- ✅ Homepage loads correctly
- ✅ Recipe search works
- ✅ Filters work
- ✅ Grocery list works
- ✅ Theme toggle works
- ✅ Recipe detail pages load
- ✅ All pages are accessible
- ✅ Navigation works

**Run:** `npm run test:e2e`

**Duration:** ~2-3 minutes

**Requires:** Dev server running (automatically started)

### 3. Combined Tests (`test:all`)
Runs both test suites in sequence.

**Run:** `npm run test:all`

## Quick Start

### Run All Tests
```bash
npm run test:all
```

### Run Only Feature Tests (Fast)
```bash
npm run test:features
```

### Run Only E2E Tests (Requires Dev Server)
```bash
npm run test:e2e
```

## What Gets Tested

### ✅ Core Features
- Recipe search and display
- Recipe detail pages
- Filtering system
- Grocery list
- Theme switching
- Navigation

### ✅ All Pages
- Homepage
- Meal Planner
- Profile
- Favorites
- Collections
- Analytics
- Help
- Terms & Privacy
- Calorie Tracker
- Water Tracker
- Meal Reminders
- Budget Tracker
- Pantry

### ✅ Technical Checks
- Routes are properly configured
- Context providers are set up
- Components exist and are importable
- API functions are available
- Error handling is in place
- PWA configuration is correct

## Test Results

Tests output color-coded results:
- ✅ **Green** - Test passed
- ❌ **Red** - Test failed (with error details)
- ⏭️ **Yellow** - Test skipped (not applicable)

At the end, you'll see:
- Total tests run
- Pass/fail counts
- Success rate percentage
- Detailed error messages for failures

## Troubleshooting

### E2E Tests Fail to Start
- **Issue:** Dev server doesn't start
- **Solution:** Make sure port 5173 is available
- **Alternative:** Start dev server manually: `npm run dev`

### Tests Timeout
- **Issue:** Tests take too long
- **Solution:** Increase timeout in `test-e2e-user-journey.js`:
  ```javascript
  timeout: 60000, // Increase from 30000
  ```

### Browser Doesn't Launch
- **Issue:** Puppeteer can't launch browser
- **Solution:** Install Chromium manually:
  ```bash
  npm install puppeteer --save-dev
  ```

### Tests Skip Features
- **Issue:** Tests skip certain features
- **Solution:** This is normal - tests skip features that aren't available (e.g., when not logged in)

## Customization

### Add New Tests

Edit `scripts/test-e2e-user-journey.js`:

```javascript
// Add new test function
async function testMyFeature(page) {
  try {
    // Your test logic here
    logTest('My Feature', 'passed');
    return true;
  } catch (error) {
    logTest('My Feature', 'failed', error);
    return false;
  }
}

// Call it in runTests()
await testMyFeature(page);
```

### Modify Test Configuration

Edit `TEST_CONFIG` in `test-e2e-user-journey.js`:

```javascript
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  timeout: 30000,
  waitForSelectorTimeout: 10000,
  headless: true, // Set to true for CI/CD
};
```

## CI/CD Integration

For automated testing in CI/CD:

1. Set `headless: true` in test config
2. Install dependencies: `npm install`
3. Run tests: `npm run test:all`

Example GitHub Actions:
```yaml
- name: Run E2E Tests
  run: |
    npm install
    npm run test:all
```

## Best Practices

1. **Run tests before deploying** - Catch issues early
2. **Fix failing tests immediately** - Don't let them accumulate
3. **Add tests for new features** - Keep coverage up to date
4. **Review skipped tests** - They might indicate missing features
5. **Check console output** - Look for unexpected errors

## Limitations

- **No real authentication** - Tests use localStorage mocks
- **No payment testing** - Can't test actual payment flows
- **No database writes** - Tests are read-only
- **Limited error scenarios** - Focuses on happy paths

## Next Steps

After running tests:
1. Review any failed tests
2. Fix issues found
3. Re-run tests to verify fixes
4. Deploy with confidence! 🚀

