# 🚀 Deployment Verification Checklist

Your Vercel deployment is **successful**, but let's make sure everything is working!

## Step 1: Check Your Live Site

1. **Visit your deployment URL:**
   - Production: `whats-4-dinner-mu.vercel.app`
   - Or check your Vercel dashboard for the exact URL

2. **Does the app load?**
   - ✅ You should see the "What's 4 Dinner" homepage
   - ❌ If you see a blank page or errors, check browser console (F12)

## Step 2: Set Environment Variables (CRITICAL!)

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

### Required Variables:

#### For Recipe Search (Spoonacular API):
```
SPOONACULAR_KEY = your-spoonacular-api-key-here
```

**How to get it:**
1. Go to https://spoonacular.com/food-api
2. Sign up (free tier: 150 requests/day)
3. Copy your API key from the dashboard

#### For Authentication (Supabase):
```
VITE_SUPABASE_URL = https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
```

**How to get it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon public** key

### Optional Variables:
```
CACHE_TTL_MS = 21600000
```

**⚠️ IMPORTANT:** After adding environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. This applies the new environment variables!

## Step 3: Test the App

### Test Recipe Search:
1. Type ingredients in the search bar (e.g., "chicken, rice")
2. Click "Search"
3. **Expected:** Recipe cards should appear
4. **If nothing happens:** 
   - Check browser console (F12) for errors
   - Verify `SPOONACULAR_KEY` is set in Vercel

### Test Authentication:
1. Click "Sign In" in the header
2. Try email magic link
3. **Expected:** You should receive an email
4. **If it fails:**
   - Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Check browser console for errors

### Test API Functions:
1. In browser console (F12), check Network tab
2. Search for recipes
3. Look for requests to `/api/spoonacular/search`
4. **Expected:** Should return 200 OK with recipe data
5. **If 500 error:**
   - Check Vercel **Runtime Logs** (in deployment dashboard)
   - Verify `SPOONACULAR_KEY` is set correctly

## Step 4: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → **Your Project** → **Deployments**
2. Click on your latest deployment
3. Click **Runtime Logs** tab
4. Look for any errors when you try to search

**Common Errors:**
- `Missing SPOONACULAR_KEY env var` → Add the environment variable
- `Invalid API key` → Check your Spoonacular key is correct
- `429 Too many requests` → You've hit your API limit

## Step 5: Test All Features

### ✅ Checklist:
- [ ] Homepage loads
- [ ] Search bar works
- [ ] Recipe results appear
- [ ] Click recipe → Recipe page loads
- [ ] Sign in modal opens
- [ ] Can add to favorites
- [ ] Can add to meal planner
- [ ] Can add to grocery list
- [ ] Analytics page loads (if signed in)

## Troubleshooting

### App loads but search doesn't work:
1. ✅ Check `SPOONACULAR_KEY` is set in Vercel
2. ✅ Redeploy after adding environment variables
3. ✅ Check browser console for errors
4. ✅ Check Vercel Runtime Logs for API errors

### Authentication doesn't work:
1. ✅ Check `VITE_SUPABASE_URL` is set
2. ✅ Check `VITE_SUPABASE_ANON_KEY` is set
3. ✅ Verify Supabase project is active
4. ✅ Check browser console for errors

### Blank page or errors:
1. ✅ Check browser console (F12)
2. ✅ Check Vercel build logs
3. ✅ Verify all environment variables are set
4. ✅ Try redeploying

## Quick Test Commands

Open your browser console (F12) and run:

```javascript
// Test if environment variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Spoonacular Key:', import.meta.env.VITE_SPOONACULAR_KEY ? 'Set' : 'Missing');

// Test API endpoint
fetch('/api/spoonacular/search?q=chicken&number=1')
  .then(r => r.json())
  .then(data => console.log('API Test:', data))
  .catch(err => console.error('API Error:', err));
```

## Still Not Working?

1. **Check Vercel Deployment Logs:**
   - Go to deployment → **Build Logs**
   - Look for any errors during build

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for red errors

3. **Check Network Tab:**
   - Open DevTools → Network
   - Try searching
   - Check if API calls are failing

4. **Verify Environment Variables:**
   - Go to Vercel → Settings → Environment Variables
   - Make sure they're set for **Production** environment
   - Redeploy after adding/updating

## Need Help?

If you're still stuck:
1. Share the error message from browser console
2. Share the error from Vercel Runtime Logs
3. Confirm which environment variables you've set

---

**Your deployment is successful!** Now we just need to make sure the environment variables are set correctly. 🎉

