# Debug Token Issue - Step by Step

## Quick Checks

### 1. Verify Token Was Actually Updated in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find **`VITE_PADDLE_PUBLIC_TOKEN`**
3. **Click to view** the value (it should show the full token)
4. **Verify** it starts with `test_` and matches the token you copied from Paddle
5. If it's different, **update it again** and **save**

### 2. Force Redeploy

After updating the token:
1. Go to **Vercel Dashboard** → Your Project → **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to finish (2-3 minutes)

### 3. Clear Browser Cache

1. **Hard refresh** the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or open in **Incognito/Private window**

### 4. Check the Error Again

1. Open **DevTools** → **Network** tab
2. Try checkout again
3. Find `transaction-checkout` (403 error)
4. Click it → **Response** tab
5. **Copy the error message** - it might be different now

### 5. Verify API Key and Token Match

**Critical**: Your API key and client token **MUST** be from the **same Paddle account**!

1. **API Key** (in Vercel `PADDLE_API_KEY`):
   - Should be from: https://sandbox-vendors.paddle.com/authentication-v2
   - Format: `pdl_sdbx_apikey_...` (50 chars, no prefix)

2. **Client Token** (in Vercel `VITE_PADDLE_PUBLIC_TOKEN`):
   - Should be from: https://sandbox-vendors.paddle.com/developer-tools/authentication
   - Format: `test_...` (starts with `test_`)

**Both must be from the SAME sandbox account!**

### 6. Check Domain Approval

1. Go to: https://sandbox-vendors.paddle.com → **Settings** → **Checkout** → **Website approval**
2. Verify: `whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app` is listed
3. If not, **add it** and save

## What to Share

After checking all of the above, please share:

1. **The new error message** from Network tab → Response (if it changed)
2. **Confirmation** that token was updated in Vercel
3. **Confirmation** that you redeployed after updating

This will help me pinpoint the exact issue!

