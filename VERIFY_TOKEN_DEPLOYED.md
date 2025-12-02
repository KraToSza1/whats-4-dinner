# Verify Token is Actually Deployed

## Critical Steps

### 1. Check Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find **`VITE_PADDLE_PUBLIC_TOKEN`**
3. **Click the eye icon** to reveal the value
4. **Verify**:
   - It starts with `test_` ✅
   - It matches the token you copied from Paddle ✅
   - It's the FULL token (not truncated) ✅

### 2. Force Redeploy

**IMPORTANT**: After updating env vars, you MUST redeploy!

1. Go to **Vercel Dashboard** → Your Project → **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **"Redeploy"**
4. **Wait for it to finish** (watch the deployment log)
5. It should say "Ready" when done

### 3. Clear Browser Cache

After redeploy:
1. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or open in **Incognito/Private window**
3. Or clear browser cache completely

### 4. Check Console for Token

After the page loads, open **DevTools** → **Console** tab

You should see:
```
🔍 [PADDLE INIT] Token check: { hasToken: true, tokenStartsWithTest: true, ... }
```

If you see:
- `hasToken: false` → Token not in Vercel env vars
- `tokenStartsWithTest: false` → Wrong token (not sandbox)
- No log at all → Code not deployed yet

### 5. Check the New Error

1. Try checkout again
2. Open **Network** tab
3. Find `transaction-checkout` (403)
4. Click it → **Response** tab
5. **Copy the error** - it might be different now

## Common Issues

### Issue: Token updated but still old error
**Fix**: You didn't redeploy! Vercel doesn't auto-redeploy when you change env vars.

### Issue: Token shows in Vercel but console says "no token"
**Fix**: 
1. Make sure variable name is exactly: `VITE_PADDLE_PUBLIC_TOKEN`
2. Redeploy after adding/updating
3. Clear browser cache

### Issue: Token starts with something other than `test_`
**Fix**: You're using production token. Get sandbox token from: https://sandbox-vendors.paddle.com/developer-tools/authentication

## What to Share

After checking all of the above, share:

1. **Console log** showing the token check (from step 4)
2. **New error message** from Network tab (if it changed)
3. **Confirmation** that you redeployed after updating token

This will tell us exactly what's wrong!

