# Fix "TypeError: Failed to fetch" Error

## Quick Fixes:

### 1. **Check Browser Console**
Open DevTools (F12) → Console tab → Look for the exact error message

### 2. **Common Causes:**

#### A. Missing/Invalid Supabase Keys
- Check `.env.local` has:
  - `VITE_SUPABASE_URL` (should start with `https://`)
  - `VITE_SUPABASE_ANON_KEY` (NOT service_role key!)
  
#### B. Service Worker Issues
- Open DevTools → Application → Service Workers
- Click "Unregister" if there's an old service worker
- Hard refresh: `Ctrl+Shift+R`

#### C. CORS Issues
- Check if Supabase URL is correct
- Make sure you're using ANON_KEY, not SERVICE_ROLE_KEY

#### D. Network Issues
- Check internet connection
- Try disabling VPN/proxy
- Check if Supabase is down: https://status.supabase.com

### 3. **Check Your .env.local File**

**WRONG (Service Role - NEVER use this in frontend!):**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...service_role...
```

**CORRECT (Anonymous Key - Safe for frontend):**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...anon...
```

### 4. **Get Your Correct Keys:**

1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY` (NOT service_role!)

### 5. **Restart Dev Server:**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 6. **Clear Browser Cache:**
- `Ctrl+Shift+Delete` → Clear cache
- Or use Incognito/Private window

## Still Not Working?

**Check the browser console for:**
- Exact error message
- Which URL is failing
- Network tab → See failed requests

**Common error patterns:**
- `Failed to fetch` → Network/CORS issue
- `401 Unauthorized` → Wrong API key
- `403 Forbidden` → Using service_role key (wrong!)
- `CORS policy` → CORS issue

