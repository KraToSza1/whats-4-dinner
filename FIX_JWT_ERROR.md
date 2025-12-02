# Fix: "Failed to retrieve JWT" Error

## The Problem

Paddle is returning:
```json
{
  "errors": [
    {
      "status": 403,
      "code": "unauthorized",
      "details": "Failed to retrieve JWT"
    }
  ]
}
```

This means: **Your client token is invalid or doesn't match your Paddle account.**

## The Fix

### Step 1: Get New Client Token from Paddle

1. Go to: **https://sandbox-vendors.paddle.com/developer-tools/authentication**
2. Find **"Client-side tokens"** section
3. Click **"Create new token"** or **"Regenerate"**
4. **Copy the new token** (it will start with `test_`)
5. Example: `test_abc123def456...`

### Step 2: Update Vercel Environment Variable

1. Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find: **`VITE_PADDLE_PUBLIC_TOKEN`**
3. **Delete the old value**
4. **Paste the new token** from Step 1
5. **Save**

### Step 3: Redeploy

- Vercel will auto-deploy, or click **"Redeploy"** manually
- Wait 1-2 minutes for deployment

### Step 4: Test Again

- Try checkout again
- The 403 error should be gone!

## Why This Happened

- Token was deleted or expired
- Token is from different Paddle account than your API key
- Token format is incorrect

## Important Notes

- **Client token** (starts with `test_`) goes in `VITE_PADDLE_PUBLIC_TOKEN`
- **API key** (50 chars, no prefix) goes in `PADDLE_API_KEY`
- Both must be from the **same Paddle sandbox account**

After updating the token, the checkout should work!

