# 🚨 URGENT FIX - Do This RIGHT NOW

## ❌ The Problem:
You have `VITE_SPOONACULAR_KEY` but the serverless functions need `SPOONACULAR_KEY` (NO VITE_ prefix!)

---

## ✅ What You Need to Do in Vercel:

### Step 1: Delete `VITE_SPOONACULAR_KEY`
1. In Vercel Environment Variables page
2. Find `VITE_SPOONACULAR_KEY`
3. Click the trash icon (minus) to delete it
4. Click "Save"

### Step 2: Add `SPOONACULAR_KEY` (NEW NAME!)
1. Click "+ Add Another"
2. **Key:** Type exactly: `SPOONACULAR_KEY`
   - **IMPORTANT:** NO `VITE_` prefix! Just `SPOONACULAR_KEY`
3. **Value:** Copy the value from `VITE_SPOONACULAR_KEY` (click the eye icon to reveal it)
   - Or use: `8f67ae0242414d98888d2bef7ceee978`
4. **Environments:** Select "All Environments"
5. Click "Save"

### Step 3: Delete All Old/Unused Variables (Optional but Recommended)
Delete these (they're not needed):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SBPK`
- `SBSK`
- `SBANON`
- `SBSR`
- `SBURL`
- `GOOGLECALLBACKAUTH`
- `SPOONAPI`

Keep these (they're correct):
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `SPOONACULAR_KEY` (the new one you just added)

### Step 4: Redeploy
1. Go to "Deployments" tab
2. Click ⋯ on latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes

---

## 📝 Summary:

**You need 3 variables total:**
1. `VITE_SUPABASE_URL` ✅ (you have this)
2. `VITE_SUPABASE_ANON_KEY` ✅ (you have this)
3. `SPOONACULAR_KEY` ❌ (you have `VITE_SPOONACULAR_KEY` - WRONG!)

**Fix:** Delete `VITE_SPOONACULAR_KEY`, add `SPOONACULAR_KEY` with the same value.

---

## 🎯 Why?
- `VITE_` prefix = Frontend only (client-side)
- No `VITE_` prefix = Backend only (serverless functions)
- Your API functions run on the server, so they need `SPOONACULAR_KEY` (no VITE_)

