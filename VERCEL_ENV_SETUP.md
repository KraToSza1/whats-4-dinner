# 🚨 URGENT: Fix "supabaseUrl is required" Error

## The Problem
Your app is showing a blank page because `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set in Vercel.

## Fix in 3 Steps:

### Step 1: Get Your Supabase Keys

1. Go to: https://supabase.com/dashboard
2. Select your project (the one with ID `chhdqmntirvngvamtgdo`)
3. Click **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://chhdqmntirvngvamtgdo.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 2: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click on your **whats-4-dinner** project
3. Click **Settings** (left sidebar)
4. Click **Environment Variables**
5. Click **Add New** and add these THREE variables:

**Variable 1:**
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://chhdqmntirvngvamtgdo.supabase.co` (your actual URL)
- **Environment:** Select **Production**, **Preview**, and **Development**

**Variable 2:**
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** (paste your anon public key)
- **Environment:** Select **Production**, **Preview**, and **Development**

**Variable 3 (for recipes to work):**
- **Key:** `SPOONACULAR_KEY`
- **Value:** (your Spoonacular API key)
- **Environment:** Select **Production**, **Preview**, and **Development**

6. Click **Save** for each one

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **three dots** (⋯) menu
4. Click **Redeploy**
5. Wait for it to finish (about 30 seconds)
6. Refresh your site!

## That's It!

After redeploying, your site should work! The error will be gone because the Supabase client will have the URL it needs.

---

## If You Don't Have a Spoonacular Key Yet:

1. Go to: https://spoonacular.com/food-api
2. Sign up (free tier: 150 requests/day)
3. Copy your API key from the dashboard
4. Add it as `SPOONACULAR_KEY` in Vercel (Step 2 above)

---

## Visual Guide:

**Vercel Dashboard Path:**
```
Dashboard → Your Project → Settings → Environment Variables → Add New
```

**Make sure to select ALL environments:**
- ✅ Production
- ✅ Preview  
- ✅ Development

This ensures it works everywhere!

