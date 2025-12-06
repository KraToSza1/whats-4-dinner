# Troubleshooting Guide

## Common Issues & Solutions

### 1. `import.meta` Error in Browser Console

**Error:** `Uncaught SyntaxError: Cannot use 'import.meta' outside a module`

**Cause:** Script tag in `index.html` was using `import.meta.env.DEV` but wasn't a module script.

**Solution:** ✅ Fixed - Changed to use `window.location.hostname` check instead of `import.meta.env.DEV`.

**Status:** Fixed in `index.html` line 205-221

---

### 2. Multiple Recipe Fetch Requests / Timeouts

**Symptoms:**
- Multiple identical fetch requests in console
- Queries timing out after 25 seconds
- Some queries complete (2-4s) but others timeout

**Causes:**
1. `fetchRecipes` in useEffect dependency array causing re-triggers
2. No duplicate request prevention
3. Multiple components triggering fetches simultaneously

**Solutions Applied:**
- ✅ Added `isFetchingRef` to prevent duplicate simultaneous requests
- ✅ Added loading check at start of `fetchRecipes` to skip if already fetching
- ✅ Removed `fetchRecipes` from useEffect deps (it's stable via useCallback)
- ✅ Added cleanup function to clear timeouts

**Status:** Fixed in `src/App.jsx`

---

### 3. Auth Session Missing Errors

**Error:** `AuthSessionMissingError: Auth session missing!`

**Cause:** Normal when user is not logged in. Supabase tries to get user session but none exists.

**Solution:** ✅ This is expected behavior - not an error. The app handles this gracefully.

**Status:** Working as intended

---

### 4. Image Loading Failures

**Error:** `Image failed to load` for recipe images

**Cause:** Some recipes don't have images or images are missing from Supabase storage.

**Solution:** ✅ App has fallback mechanism - shows placeholder when image fails.

**Status:** Working as intended (fallbacks in place)

---

### 5. Recipe Search Timeouts

**Symptoms:**
- Queries taking 25+ seconds
- Timeout errors appearing

**Possible Causes:**
1. Large database queries (230k+ recipes)
2. Network latency
3. Supabase query optimization needed
4. Multiple simultaneous queries

**Solutions:**
- ✅ Added duplicate request prevention
- ✅ Added loading state check
- ✅ Timeout set to 25 seconds (reasonable for large queries)
- ⚠️ Consider adding query optimization (indexes, pagination)

**Status:** Partially fixed - may need database optimization

---

## Quick Fixes

### If Recipes Not Loading:

1. **Check Supabase Connection:**
   ```bash
   # Verify environment variables
   npm run validate:all
   ```

2. **Check Browser Console:**
   - Look for network errors
   - Check for CORS errors
   - Verify Supabase URL is correct

3. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear localStorage if needed

4. **Check Network Tab:**
   - Verify requests to Supabase are completing
   - Check response times
   - Look for failed requests

### If Multiple Fetches Happening:

1. **Check useEffect Dependencies:**
   - Ensure `fetchRecipes` is NOT in dependency array
   - Verify debouncing is working (500ms delay)

2. **Check Component Re-renders:**
   - Use React DevTools to see what's causing re-renders
   - Verify FilterContext isn't causing unnecessary updates

---

## Validation Commands

Run these to check everything:

```bash
# Check all integrations
npm run validate:all

# Check just integration
npm run validate:integration

# Check production readiness
npm run validate:production

# Check user flows
npm run validate:users
```

---

## Performance Optimization

### If Queries Are Slow:

1. **Add Database Indexes:**
   - Index on `title` column
   - Index on `cuisine` column
   - Index on `diet` column
   - Index on `meal_type` column

2. **Optimize Queries:**
   - Use `select()` to only fetch needed columns
   - Add `limit` to prevent fetching too much data
   - Use pagination properly

3. **Add Caching:**
   - Cache frequent queries
   - Use React Query or SWR for caching
   - Implement request deduplication

---

## Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug:supabase', 'true');
// Reload page
```

This will show detailed Supabase query logs.

---

## Still Having Issues?

1. **Check Validation:**
   ```bash
   npm run validate:all
   ```

2. **Check Console:**
   - Look for specific error messages
   - Check network tab for failed requests

3. **Check Environment Variables:**
   - Verify Supabase URL and key are set
   - Check payment provider variables

4. **Check Supabase Dashboard:**
   - Verify database is accessible
   - Check for any errors in logs
   - Verify RLS policies are correct

