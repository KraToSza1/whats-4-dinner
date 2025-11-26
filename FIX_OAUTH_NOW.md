 # 🔧 FIX GOOGLE OAUTH - EXACT STEPS

Based on your screenshots, here's exactly what to fix:

---

## 🎯 YOUR VERCEL URL
**Use this everywhere:** `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

---

## ✅ STEP 1: FIX SUPABASE SITE URL

**Go to:** Supabase Dashboard → Authentication → URL Configuration

### Site URL (currently shows: `https://whats-4-dinner` - WRONG!)

**Change to:**
```
https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app
```

**Action:** 
1. Click in the Site URL field
2. Replace `https://whats-4-dinner` with `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
3. Click **"Save changes"**

---

## ✅ STEP 2: ADD SUPABASE REDIRECT URLS

**Go to:** Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

**Currently:** Shows "No Redirect URLs" - you need to add these:

### Click "Add URL" and add each of these (one at a time):

1. `http://localhost:5173`
2. `http://localhost:5173/**` (wildcard - allows all localhost routes)
3. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
4. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/**` (wildcard - allows all Vercel routes)

**Action:**
1. Click **"Add URL"** button
2. Paste first URL: `http://localhost:5173`
3. Click **"Add URL"** again
4. Paste second URL: `http://localhost:5173/**`
5. Click **"Add URL"** again
6. Paste third URL: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
7. Click **"Add URL"** again
8. Paste fourth URL: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/**`
9. Click **"Save changes"** at the bottom

---

## ✅ STEP 3: FIX GOOGLE CLOUD CONSOLE

**Go to:** Google Cloud Console → APIs & Services → Credentials → Click your OAuth 2.0 Client ID

### Authorized JavaScript origins

**Currently:** Empty

**Add these (click "Add URI" for each):**
1. `http://localhost:5173`
2. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

---

### Authorized redirect URIs

**Currently you have:**
- ✅ `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback` (KEEP THIS - it's correct!)
- ✅ `http://localhost:5173` (KEEP THIS - it's correct!)
- ❌ `http://localhost:5173/auth/callback` (DELETE THIS - wrong path!)
- ❌ `s://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/` (DELETE THIS - wrong format!)

**Action:**
1. **DELETE** `http://localhost:5173/auth/callback` (click the X next to it)
2. **DELETE** `s://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/` (click the X next to it)
3. **ADD** `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app` (click "Add URI", paste it)

**Final list should be exactly:**
- `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
- `http://localhost:5173`
- `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

4. Click **"Save"** at the bottom

---

## ✅ STEP 4: VERIFY SUPABASE GOOGLE PROVIDER

**Go to:** Supabase Dashboard → Authentication → Providers → Google

**Check:**
- ✅ **Enabled** toggle is ON
- ✅ **Client ID (for OAuth)** = `46126974507-s0k5t6hh9v1bqeo5j2p3f4n6ffoi6mvh.apps.googleusercontent.com`
- ✅ **Client Secret (for OAuth)** = Shows `****KxdJ` (masked)

**If not enabled or missing credentials:**
1. Enable the toggle
2. Paste Client ID: `46126974507-s0k5t6hh9v1bqeo5j2p3f4n6ffoi6mvh.apps.googleusercontent.com`
3. Paste Client Secret (get it from Google Cloud Console if needed)
4. Click **"Save"**

---

## 🧪 TESTING

### Test on Vercel (Production):
1. Go to: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
2. Click "Sign In" (menu button)
3. Click "Google" button
4. **Expected:** Redirects to Google → You sign in → Redirects back to Vercel → You're signed in!

### Test Locally:
1. Go to: `http://localhost:5173`
2. Click "Sign In"
3. Click "Google" button
4. **Expected:** Should work if all URLs are configured correctly

**Note:** If local doesn't work, that's okay - it WILL work on Vercel once configured!

---

## ⚠️ IMPORTANT NOTES

1. **Changes take time:** Google Cloud Console changes can take 5 minutes to a few hours to propagate
2. **Exact URLs matter:** Make sure there are no typos, trailing slashes (except wildcards), or missing `https://`
3. **Supabase callback:** The `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback` URL is handled by Supabase automatically - you don't need to change it

---

## 📋 QUICK CHECKLIST

### Supabase:
- [ ] Site URL = `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- [ ] Redirect URL = `http://localhost:5173`
- [ ] Redirect URL = `http://localhost:5173/**`
- [ ] Redirect URL = `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- [ ] Redirect URL = `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/**`
- [ ] Google provider enabled with correct Client ID

### Google Cloud Console:
- [ ] JavaScript origin = `http://localhost:5173`
- [ ] JavaScript origin = `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- [ ] Redirect URI = `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback` (KEEP)
- [ ] Redirect URI = `http://localhost:5173` (KEEP)
- [ ] Redirect URI = `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app` (ADD)
- [ ] DELETED: `http://localhost:5173/auth/callback` (REMOVE)
- [ ] DELETED: `s://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/` (REMOVE)

---

## 🎉 AFTER FIXING

Once you've made all these changes:
1. Wait 5-10 minutes for Google Cloud Console changes to propagate
2. Test on Vercel: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
3. Google OAuth should work perfectly! 🚀

