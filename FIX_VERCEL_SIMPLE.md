# 🚨 SIMPLE FIX - Do These 3 Steps

## The Problem:
Your Vercel has variables named wrong (like `SBPK`, `SBSK`, etc.)
Your app needs variables named EXACTLY:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  
- `SPOONACULAR_KEY`

---

## ✅ STEP 1: Delete ALL Old Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Click your project: `whats-4-dinner`
3. Click **"Settings"** tab (top)
4. Click **"Environment Variables"** (left sidebar)
5. **DELETE EVERYTHING** - Click the trash icon (minus) on EVERY variable you see
   - Delete: `SBPK`, `SBSK`, `SBANON`, `SBSR`, `SBURL`, `GOOGLECALLBACKAUTH`, `SPOONAPI`
   - Delete ALL of them!
6. Click **"Save"** at the bottom

---

## ✅ STEP 2: Get Your 3 Values

### A) Get Supabase URL and Key:
1. Go to: https://supabase.com/dashboard
2. Click your project: `What's-4-Dinner`
3. Click **"Settings"** (left sidebar)
4. Click **"API"** (under Settings)
5. Copy these TWO things:
   - **Project URL** → Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public** key → Copy this (long string starting with `eyJ...`)

### B) Get Spoonacular Key:
- Your Spoonacular API key is: `8f67ae0242414d98888d2bef7ceee978`
- (Or copy it from: https://spoonacular.com/food-api/console#Profile)

---

## ✅ STEP 3: Add the 3 NEW Variables in Vercel

1. Still in Vercel Environment Variables page
2. Click **"+ Add Another"** button (3 times, to create 3 rows)

### Variable #1:
- **Key:** Type exactly: `VITE_SUPABASE_URL`
- **Value:** Paste your Supabase Project URL (from Step 2A)
- **Environments:** Click dropdown → Select **"All Environments"**

### Variable #2:
- **Key:** Type exactly: `VITE_SUPABASE_ANON_KEY`
- **Value:** Paste your Supabase anon public key (from Step 2A)
- **Environments:** Click dropdown → Select **"All Environments"**

### Variable #3:
- **Key:** Type exactly: `SPOONACULAR_KEY`
- **Value:** Type exactly: `8f67ae0242414d98888d2bef7ceee978`
- **Environments:** Click dropdown → Select **"All Environments"**

3. Click **"Save"** button (bottom right)

---

## ✅ STEP 4: Redeploy

1. Click **"Deployments"** tab (top of Vercel page)
2. Find your latest deployment (top of list)
3. Click the **⋯** (three dots) menu button
4. Click **"Redeploy"**
5. Click **"Redeploy"** button again
6. Wait 2-3 minutes for it to finish

---

## ✅ STEP 5: Test

1. Go to your app: https://whats-4-dinner-mu.vercel.app
2. Try to **login with Google** → Should work now!
3. Try to **search for recipes** → Should work now!

---

## ❌ If It Still Doesn't Work:

Take a screenshot of your Vercel Environment Variables page and send it to me.
Make sure I can see:
- The variable NAMES (the "Key" column)
- That you selected "All Environments" for each

---

## 📝 Quick Checklist:

- [ ] Deleted ALL old variables in Vercel
- [ ] Added `VITE_SUPABASE_URL` with Supabase Project URL
- [ ] Added `VITE_SUPABASE_ANON_KEY` with Supabase anon key
- [ ] Added `SPOONACULAR_KEY` with `8f67ae0242414d98888d2bef7ceee978`
- [ ] Selected "All Environments" for all 3 variables
- [ ] Clicked "Save"
- [ ] Redeployed the project
- [ ] Tested login and recipes

