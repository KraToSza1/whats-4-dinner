# Fix PADDLE_VENDOR_ID in Vercel

## The Problem

When you run `npx vercel env pull .env.local`, it shows:
```
- PADDLE_VENDOR_ID
```

This means `PADDLE_VENDOR_ID` is **NOT enabled for Development environment** in Vercel, so it gets removed from `.env.local`.

## The Solution

### Step 1: Enable Development Environment in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: `whats-4-dinner`
3. Go to **Settings** → **Environment Variables**
4. Find `PADDLE_VENDOR_ID` in the list
5. Click the **three dots (...)** on the right → **Edit**
6. **IMPORTANT:** Make sure **"Development"** is **CHECKED** ✅
   - It should show: ✅ Development, ✅ Preview, ✅ Production
7. Click **Save**

### Step 2: Pull Environment Variables

After enabling Development, run:
```bash
npx vercel env pull .env.local
```

You should see:
```
+ PADDLE_VENDOR_ID (Added)
```

Instead of:
```
- PADDLE_VENDOR_ID (Removed)
```

### Step 3: Restart vercel dev

```bash
# Stop vercel dev (Ctrl+C)
npx vercel dev
```

## Why This Happens

Vercel environment variables can be scoped to specific environments:
- **Development** - for `vercel dev` (local)
- **Preview** - for preview deployments
- **Production** - for production deployments

If a variable isn't enabled for Development, `vercel dev` won't have access to it, even if it exists in Vercel.

## Temporary Workaround

I've added `PADDLE_VENDOR_ID=42069` directly to `.env.local` so you can test now, but you should fix it in Vercel for a permanent solution.

