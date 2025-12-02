# Fixes Summary

## 1. Supabase Profiles Table (404 Error)

**Problem**: The `profiles` table doesn't exist in your Supabase database, causing 404 errors.

**Solution**: Run the SQL in `SUPABASE_PROFILES_FIX.sql`:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `SUPABASE_PROFILES_FIX.sql`
4. Click **Run**

This will:
- Create the `profiles` table
- Set up Row Level Security (RLS) policies
- Auto-create a profile when users sign up
- Grant necessary permissions

**After running**: The 404 error should be fixed and users will have profiles automatically created.

---

## 2. Paddle 403 Error

**Problem**: Paddle is rejecting the checkout request with a 403 error.

**Possible causes**:
1. **Domain not whitelisted** in Paddle Dashboard
2. **Environment mismatch** (sandbox vs production)
3. **Missing vendor_id** in API request (if required)

**Fixes applied**:
- Added `Paddle-Version` header to API request
- Code already uses correct `Authorization: Bearer` header

**What to check in Paddle Dashboard**:

1. **Go to Paddle Dashboard** → **Settings** → **Checkout** → **Checkout Settings**
2. **Default Payment Link** should be set to:
   ```
   https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
   ```

3. **Go to Settings** → **Domains** (or **Allowed Domains**)
4. **Add your domain**:
   ```
   whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
   ```

5. **Verify environment**:
   - If using **sandbox**: Make sure `PADDLE_ENV=sandbox` (or leave unset)
   - If using **production**: Set `PADDLE_ENV=production`
   - Your API key and vendor ID must match the environment

6. **Check the 403 error details**:
   - In browser DevTools → Network tab
   - Find the `transaction-checkout` request
   - Click it → **Response** tab
   - Copy the error JSON and check what Paddle says

**Common 403 causes**:
- Domain not in allowed list
- Using production API key with sandbox transaction
- Transaction expired (create a new one)
- Missing required fields in request

---

## 3. CSP Warnings (Non-Critical)

**Problem**: CSP is blocking `vercel.live` scripts and some eval() calls.

**Fix applied**: Removed `vercel.live` from CSP (it's not needed for production).

**Note**: The CSP warnings are mostly noise. The real issues are:
1. Supabase profiles 404 (fixed with SQL)
2. Paddle 403 (check domain whitelist)

---

## 4. Next Steps

1. **Run the Supabase SQL** (`SUPABASE_PROFILES_FIX.sql`)
2. **Check Paddle Dashboard** for domain whitelist
3. **Test checkout again**
4. **If 403 persists**, check the Network tab for the exact error message from Paddle

---

## Quick Test Checklist

- [ ] Supabase profiles table created (run SQL)
- [ ] Paddle domain whitelisted in dashboard
- [ ] Paddle Default Payment Link set correctly
- [ ] Environment variables match (sandbox vs production)
- [ ] Test checkout flow end-to-end

