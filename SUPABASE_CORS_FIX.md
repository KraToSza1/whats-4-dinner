# 🔥 FIX CORS ERROR (Status 556) - COMPLETE GUIDE

## The Problem:
Status 556 = Supabase is blocking your requests due to CORS policy violation.

## Possible Causes:

### 1. **Wrong API Key Type** (Most Common)
- Using `service_role` key instead of `anon` key
- **Fix:** Use the "anon public" key from Supabase dashboard

### 2. **Supabase Project Settings** (Check This!)
Your Supabase project might be blocking localhost. Check:

1. Go to: https://app.supabase.com → Your Project → Settings → API
2. Scroll to **"Allowed Origins"** or **"CORS Settings"**
3. Make sure `http://localhost:5175` is in the allowed list
4. If not, add it: `http://localhost:5175`
5. Save and wait 30 seconds

### 3. **RLS Policies Blocking**
- Row Level Security might be blocking anonymous access
- **Fix:** Check your `recipes` table RLS policies in Supabase

### 4. **New vs Legacy API Keys**
Supabase has NEW API keys format:
- **New:** `sb_publishable_...` (use this if available)
- **Legacy:** `eyJhbGci...` (JWT format, still works)

## Quick Fix Steps:

### Step 1: Verify Your Key
Open browser console and look for:
```
Supabase Config Check: { keyRole: "..." }
```

If it says `SERVICE_ROLE (WRONG!)` → You're using the wrong key!

### Step 2: Check Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy the **"anon public"** key (NOT service_role!)
5. Update `.env.local`:
   ```
   VITE_SUPABASE_ANON_KEY=<paste anon key here>
   ```

### Step 3: Check CORS Settings
1. In Supabase dashboard → Settings → API
2. Look for "Allowed Origins" or "CORS"
3. Add: `http://localhost:5175`
4. Save

### Step 4: Restart Everything
1. Stop dev server (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart: `npm run dev`
4. Hard refresh: `Ctrl+Shift+R`

## If Still Not Working:

### Check Browser Network Tab:
1. Open DevTools → Network tab
2. Find a failed request to Supabase
3. Click it → Headers tab
4. Check:
   - **Request Headers:** Does it have `apikey` header?
   - **Response Headers:** What CORS headers are returned?

### Test Direct API Call:
Open browser console and run:
```javascript
fetch('https://chhdqmntirvngvamtgdo.supabase.co/rest/v1/recipes?select=id&limit=1', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  }
}).then(r => r.json()).then(console.log).catch(console.error)
```

If this works → The key is correct, issue is in your code
If this fails → The key is wrong or CORS is blocked in Supabase settings

## Nuclear Option:
If nothing works, try using the NEW API key format:
1. In Supabase → API Keys tab (not Legacy)
2. Copy the "Publishable key" (`sb_publishable_...`)
3. Use that instead of the legacy JWT key

