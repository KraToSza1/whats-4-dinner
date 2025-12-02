# Sandbox Setup Checklist - Step by Step

## ✅ Step 1: Check Vercel Environment Variables

**Where**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Check these variables exist and are correct**:

### Required Variables:

1. **`PADDLE_API_KEY`**
   - Should be **50 characters** (alphanumeric)
   - For sandbox: Get from https://sandbox-vendors.paddle.com/authentication-v2
   - ⚠️ **NOT** prefixed with `test_` or `live_` (just the raw key)
   - Example: `abc123def456...` (50 chars)

2. **`VITE_PADDLE_PUBLIC_TOKEN`** (or `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`)
   - For sandbox: **MUST start with `test_`**
   - Get from: Paddle Dashboard → Developer Tools → Authentication → Client-side token
   - Example: `test_d72b3dc291e3dd3ca13fa740772`

3. **`PADDLE_VENDOR_ID`**
   - Your sandbox vendor ID (numeric)
   - Get from: Paddle Dashboard → Settings → Account

4. **`PADDLE_ENV`** (optional)
   - Set to: `sandbox` (or leave unset, defaults to sandbox)

5. **Price IDs** (for each plan):
   - `PADDLE_PRICE_FAMILY_MONTHLY` = Your sandbox price ID
   - `PADDLE_PRICE_FAMILY_YEARLY` = Your sandbox price ID
   - `PADDLE_PRICE_SUPPORTER_MONTHLY` = Your sandbox price ID
   - `PADDLE_PRICE_SUPPORTER_YEARLY` = Your sandbox price ID
   - `PADDLE_PRICE_UNLIMITED_MONTHLY` = Your sandbox price ID
   - `PADDLE_PRICE_UNLIMITED_YEARLY` = Your sandbox price ID

**After checking**: If any are missing or wrong, **REDEPLOY** after adding/updating them!

---

## ✅ Step 2: Check Paddle Dashboard - Domain Approval

**Where**: https://sandbox-vendors.paddle.com → Settings → Checkout → Website approval

**What to check**:
1. Look for **"Approved Websites"** or **"Allowed Domains"** section
2. Your Vercel URL should be listed:
   ```
   whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
   ```
3. If **NOT listed**, click **"Add Domain"** or **"Approve Website"**
4. Enter your Vercel URL and save

---

## ✅ Step 3: Check Paddle Dashboard - Default Payment Link

**Where**: https://sandbox-vendors.paddle.com → Settings → Checkout → Checkout Settings

**What to check**:
1. Find **"Default Payment Link"** field
2. Should be set to:
   ```
   https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
   ```
3. If different or empty, **update it** and save

---

## ✅ Step 4: Check Paddle Dashboard - Checkout Settings

**Where**: https://sandbox-vendors.paddle.com → Settings → Checkout

**What to check**:
1. **"Allowed Domains"** or **"Site Domains"** section
2. Should include:
   ```
   whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
   ```
3. If missing, **add it** and save

---

## ✅ Step 5: Verify API Keys Match Environment

**Critical**: All your keys must be from **SANDBOX**, not production!

### Check API Key:
1. Go to: https://sandbox-vendors.paddle.com/authentication-v2
2. Copy your **API Key** (50 chars, no prefix)
3. Compare with `PADDLE_API_KEY` in Vercel
4. **Must match exactly**

### Check Client Token:
1. Go to: https://sandbox-vendors.paddle.com/developer-tools/authentication
2. Copy your **Client-side token** (starts with `test_`)
3. Compare with `VITE_PADDLE_PUBLIC_TOKEN` in Vercel
4. **Must start with `test_`**

---

## ✅ Step 6: Check CSP Configuration

**Where**: Your code → `index.html` → Line 9

**Current CSP should include**:
- `'unsafe-eval'` in `script-src` ✅ (already there)
- `https://cdn.paddle.com` in `script-src` ✅ (already there)
- `https://*.paddle.com` in `connect-src` ✅ (already there)

**If CSP is blocking**, the error will say "Content-Security-Policy blocked..."

---

## ✅ Step 7: Check Network Tab for Exact Error

**Where**: Browser DevTools → Network tab

**What to do**:
1. Open your app and try checkout
2. Find the request: `transaction-checkout` (the one with 403)
3. Click it → **Response** tab
4. **Copy the error JSON** - it will tell you exactly why Paddle rejected it

**Common error messages**:
- `"Domain not approved"` → Go to Step 2
- `"Invalid API key"` → Go to Step 5
- `"Transaction not found"` → Transaction expired, create new one
- `"Environment mismatch"` → Check Step 5

---

## ✅ Step 8: Verify Supabase Profiles Table

**Where**: Supabase Dashboard → SQL Editor

**What to do**:
1. Run the SQL from `SUPABASE_PROFILES_FIX.sql`
2. This creates the `profiles` table
3. Verify it exists: Table Editor → `profiles` table should be visible

---

## Quick Verification Checklist

Before testing checkout, verify:

- [ ] All Vercel env vars are set (Step 1)
- [ ] Domain approved in Paddle (Step 2)
- [ ] Default Payment Link set (Step 3)
- [ ] Allowed Domains includes your URL (Step 4)
- [ ] API keys are from sandbox (Step 5)
- [ ] CSP allows Paddle (Step 6)
- [ ] Supabase profiles table exists (Step 8)

**After making changes**: 
- **Redeploy on Vercel** (if you changed env vars)
- **Wait 1-2 minutes** for changes to propagate
- **Test checkout again**

---

## Still Getting 403?

1. **Check Network tab** → Response → Copy error message
2. **Verify transaction is fresh** (old ones expire)
3. **Check Paddle Dashboard** → Transactions → Find your transaction → Check status
4. **Double-check** all environment variables match sandbox

The exact error message from Paddle will tell you what's wrong!

