# Paddle 403 Error Diagnostic Guide

## What's Happening

You're getting a **403 Forbidden** error from:
```
https://checkout-service.paddle.com/transaction-checkout
```

This happens **AFTER** the transaction is created successfully. The flow is:
1. ✅ Your API creates transaction → Success (200)
2. ✅ Transaction ID returned → `txn_01kbfdhavtyp270fn8vk9p92aa`
3. ✅ Paddle.js tries to open checkout → **403 Error**

## Why This Happens

The 403 means Paddle is **rejecting** the checkout request. Common causes:

### 1. Domain Not Whitelisted (MOST LIKELY)

**Fix**: Add your domain to Paddle Dashboard

1. Go to **Paddle Dashboard** → **Settings** → **Checkout** → **Checkout Settings**
2. Find **"Allowed Domains"** or **"Site Domains"**
3. Add:
   ```
   whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
   ```
4. **Save**

### 2. Environment Mismatch

**Check**: Your API keys must match the transaction environment

- **Sandbox transaction** → Must use **sandbox API key** + **sandbox public token**
- **Production transaction** → Must use **production API key** + **production public token**

**Verify in Vercel**:
- `PADDLE_ENV` = `sandbox` (or unset for sandbox)
- `PADDLE_API_KEY` = Starts with `test_` for sandbox
- `VITE_PADDLE_PUBLIC_TOKEN` = Sandbox public token (starts with `test_`)

### 3. Transaction Expired

Transactions expire quickly. If you wait too long between creating and opening, it will 403.

**Fix**: Create a fresh transaction (click the plan button again)

### 4. Default Payment Link Not Set

**Check**: Paddle Dashboard → Settings → Checkout → Default Payment Link

Should be set to:
```
https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
```

## How to Debug

### Step 1: Check Network Tab

1. Open **DevTools** → **Network** tab
2. Find the `transaction-checkout` request (the one with 403)
3. Click it → **Response** tab
4. **Copy the error JSON** - it will tell you exactly why Paddle rejected it

### Step 2: Check Paddle Dashboard

1. Go to **Paddle Dashboard** → **Transactions**
2. Find your transaction ID: `txn_01kbfdhavtyp270fn8vk9p92aa`
3. Check:
   - Status (should be "draft" or "ready")
   - Environment (sandbox vs production)
   - Domain/URL settings

### Step 3: Verify Environment Variables

In **Vercel Dashboard** → **Settings** → **Environment Variables**, check:

- `PADDLE_ENV` = `sandbox` (or leave unset)
- `PADDLE_VENDOR_ID` = Your sandbox vendor ID
- `PADDLE_API_KEY` = Your sandbox API key (starts with `test_`)
- `VITE_PADDLE_PUBLIC_TOKEN` = Your sandbox public token (starts with `test_`)

## Quick Fix Checklist

- [ ] Domain added to Paddle "Allowed Domains"
- [ ] Default Payment Link set to your Vercel URL
- [ ] All environment variables are **sandbox** (not production)
- [ ] API key starts with `test_`
- [ ] Public token starts with `test_`
- [ ] Transaction is fresh (not expired)
- [ ] Checked Network tab for exact error message

## If Still Not Working

1. **Copy the exact error** from Network tab → Response
2. **Check Paddle Dashboard** → Transactions → Your transaction → Details
3. **Verify** all environment variables match sandbox
4. **Try creating a new transaction** (old ones expire)

The 403 error message from Paddle will tell you exactly what's wrong!

