# Fix Paddle Environment Variables

## Problem
`PADDLE_VENDOR_ID` is not being loaded by `vercel dev`, even though it exists in `.env.local`.

## Solution

### Step 1: Add PADDLE_VENDOR_ID to Vercel
1. Go to: https://vercel.com/dashboard
2. Select your project: `whats-4-dinner`
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `PADDLE_VENDOR_ID`
   - **Value**: `42069`
   - **Environments**: Check all (Development, Preview, Production)
5. Click **Save**

### Step 2: Pull Environment Variables
Run this command to sync Vercel env vars to your local `.env.local`:
```bash
npx vercel env pull .env.local
```
When prompted "Do you want to overwrite?", type `y` and press Enter.

### Step 3: Restart vercel dev
1. Stop `vercel dev` (Ctrl+C)
2. Start it again:
```bash
npx vercel dev
```

### Step 4: Verify
Try the Paddle payment again. Check the terminal - you should see:
```
[Paddle API] Environment check: {
  hasVendorId: true,  ← Should be true now!
  hasApiKey: true,
  vendorIdLength: 5,
  apiKeyLength: 69
}
```

## Current Status
✅ `PADDLE_API_KEY` - Set in Vercel  
❌ `PADDLE_VENDOR_ID` - Missing in Vercel (but exists in `.env.local`)

## All Required Variables
Make sure these are set in Vercel:
- `PADDLE_VENDOR_ID` = `42069`
- `PADDLE_API_KEY` = (your API key)
- `PADDLE_ENV` = `sandbox` (or `production`)
- `PADDLE_PRICE_SUPPORTER_MONTHLY` = `pri_01kay00wppbwg2cwdt6fdweqpr`
- `PADDLE_PRICE_SUPPORTER_YEARLY` = `pri_01kayObfm2njztsyw2mnqshjn1`
- `PADDLE_PRICE_UNLIMITED_MONTHLY` = `pri_01kay0ggeaq86hf7v4rr7k8kap`
- `PADDLE_PRICE_UNLIMITED_YEARLY` = `pri_01kay0jh31hafxfcdawanvhj0p`
- `PADDLE_PRICE_FAMILY_MONTHLY` = `pri_01kay0r1zyn8te63ab3h7m4j7v`
- `PADDLE_PRICE_FAMILY_YEARLY` = `pri_01kay0ww6zc0rzt0takfcxmj4y`

