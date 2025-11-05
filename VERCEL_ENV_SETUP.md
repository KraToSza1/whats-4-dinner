# 🔧 Vercel Environment Variables Setup

## ❌ Current Issues:
1. **Cannot login** - Missing Supabase environment variables
2. **Cannot see recipes** - Missing Spoonacular API key

## ✅ Solution: Add These Environment Variables in Vercel

### Step-by-Step Instructions:

1. **Go to your Vercel project:**
   - Visit https://vercel.com/dashboard
   - Click on your project: `whats-4-dinner`

2. **Navigate to Settings:**
   - Click **"Settings"** tab (top navigation)
   - Click **"Environment Variables"** (left sidebar)

3. **Add these 3 environment variables:**

   #### 🔐 Supabase Variables (for login):
   
   **Variable 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase project URL (from Supabase dashboard)
     - Format: `https://xxxxx.supabase.co`
     - Find it in: Supabase Dashboard → Settings → API → Project URL
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   
   **Variable 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon/public key
     - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

   #### 🍽️ Spoonacular API Key (for recipes):
   
   **Variable 3:**
   - **Name:** `SPOONACULAR_KEY`
   - **Value:** Your Spoonacular API key
     - Get it from: https://spoonacular.com/food-api/console
     - Or use your existing key if you have one
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

4. **After adding all variables:**
   - Click **"Save"** for each variable
   - Go to **"Deployments"** tab
   - Click the **"⋯"** (three dots) menu on the latest deployment
   - Click **"Redeploy"**
   - ✅ Check **"Use existing Build Cache"** (optional, faster)
   - Click **"Redeploy"**

5. **Wait for deployment to complete** (~2-3 minutes)

6. **Test your app:**
   - Try logging in with Google
   - Try searching for recipes

---

## 🔍 Where to Find Your Keys:

### Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_ANON_KEY`

### Spoonacular:
1. Go to https://spoonacular.com/food-api/console
2. Sign in or create an account
3. Copy your API key from the dashboard
4. Use it for `SPOONACULAR_KEY`

---

## ⚠️ Important Notes:

- **Variable names are CASE-SENSITIVE** - Make sure they match exactly:
  - `VITE_SUPABASE_URL` (not `vite_supabase_url`)
  - `VITE_SUPABASE_ANON_KEY` (not `VITE_SUPABASE_ANON_KEY_`)
  - `SPOONACULAR_KEY` (not `SPOONACULAR_API_KEY` or `VITE_SPOONACULAR_KEY`)

- **You MUST redeploy** after adding/changing environment variables
- Environment variables are only available **after redeployment**

---

## 🐛 Still Not Working?

If you still see errors after redeploying:

1. **Check the console** (F12 → Console tab)
2. **Verify the variable names** match exactly
3. **Make sure you selected all environments** (Production, Preview, Development)
4. **Try a fresh redeploy** (clear cache this time)

---

## 📝 Quick Checklist:

- [ ] Added `VITE_SUPABASE_URL` to Vercel
- [ ] Added `VITE_SUPABASE_ANON_KEY` to Vercel
- [ ] Added `SPOONACULAR_KEY` to Vercel
- [ ] Selected all 3 environments for each variable
- [ ] Clicked "Save" for each variable
- [ ] Redeployed the project
- [ ] Tested login
- [ ] Tested recipe search
