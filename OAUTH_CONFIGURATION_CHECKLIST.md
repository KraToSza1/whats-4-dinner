# Google OAuth Configuration Checklist

## ✅ Step 1: Fix Supabase URL Configuration

### Site URL
Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Site URL**

**Current (WRONG):** `https://whats-4-dinner`  
**Should be:** `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

**Action:** Update the Site URL field to: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

---

### Redirect URLs
Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**

**Current:** No Redirect URLs (empty)

**Add these URLs (click "Add URL" for each):**

1. `http://localhost:5173` (for npm run dev)
2. `http://localhost:5173/**` (wildcard for all localhost:5173 routes)
3. `http://localhost:3000` (for npx vercel dev - NEW!)
4. `http://localhost:3000/**` (wildcard for all localhost:3000 routes)
5. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
6. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/**` (wildcard for all Vercel routes)
7. `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback` (Supabase callback - should already be there)

**Action:** Click "Add URL" and add each URL above, then click "Save changes"

---

## ✅ Step 2: Fix Google Cloud Console Redirect URIs

### Current Issues:
- ❌ `s://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/` (WRONG - missing `http` and has trailing slash)
- ❌ `http://localhost:5173/auth/callback` (WRONG - Supabase doesn't use `/auth/callback` path)

### Correct Configuration:
Go to: **Google Cloud Console** → **APIs & Services** → **Credentials** → Click your OAuth 2.0 Client ID

**Authorized JavaScript origins:**
Add these (click "Add URI" for each):
1. `http://localhost:5173` (for npm run dev)
2. `http://localhost:3000` (for npx vercel dev - NEW!)
3. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

**Authorized redirect URIs:**
**REMOVE these (if present):**
- ❌ `s://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/` (DELETE - wrong format)
- ❌ `http://localhost:5173/auth/callback` (DELETE - wrong path)

**KEEP these:**
- ✅ `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback` (KEEP - this is correct)

**ADD these:**
1. `http://localhost:5173` (for npm run dev)
2. `http://localhost:3000` (for npx vercel dev - NEW!)
3. `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app` (for Vercel production)

**Final list should be:**
- `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
- `http://localhost:5173`
- `http://localhost:3000` (NEW - for vercel dev)
- `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

**Action:** 
1. Delete the incorrect URLs
2. Add the correct URLs
3. Click "Save"

---

## ✅ Step 3: Verify Supabase Google Provider Settings

Go to: **Supabase Dashboard** → **Authentication** → **Providers** → **Google**

**Check:**
- ✅ Google provider is **Enabled**
- ✅ **Client ID (for OAuth)** is set: `46126974507-s0k5t6hh9v1bqeo5j2p3f4n6ffoi6mvh.apps.googleusercontent.com`
- ✅ **Client Secret (for OAuth)** is set (should show `****KxdJ`)

**Action:** If not enabled, enable it and save the credentials

---

## ✅ Step 4: Test Configuration

### Local Development:
1. Open `http://localhost:5173`
2. Click "Sign In"
3. Click "Google" button
4. **Expected:** Should redirect to Google sign-in, then back to localhost

**Note:** If it doesn't work locally, that's okay - it will work on Vercel!

### Production (Vercel):
1. Open `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
2. Click "Sign In"
3. Click "Google" button
4. **Expected:** Should redirect to Google sign-in, then back to Vercel URL

---

## 📋 Quick Checklist

### Supabase:
- [ ] Site URL updated to: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- [ ] Redirect URL added: `http://localhost:5173` (for npm run dev)
- [ ] Redirect URL added: `http://localhost:5173/**` (wildcard)
- [ ] Redirect URL added: `http://localhost:3000` (for npx vercel dev - NEW!)
- [ ] Redirect URL added: `http://localhost:3000/**` (wildcard - NEW!)
- [ ] Redirect URL added: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- [ ] Redirect URL added: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/**`
- [ ] Google provider is enabled with correct Client ID and Secret

### Google Cloud Console:
- [ ] JavaScript origin added: `http://localhost:5173` (for npm run dev)
- [ ] JavaScript origin added: `http://localhost:3000` (for npx vercel dev - NEW!)
- [ ] JavaScript origin added: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- [ ] Redirect URI removed: `s://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/`
- [ ] Redirect URI removed: `http://localhost:5173/auth/callback`
- [ ] Redirect URI kept: `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
- [ ] Redirect URI added: `http://localhost:5173` (for npm run dev)
- [ ] Redirect URI added: `http://localhost:3000` (for npx vercel dev - NEW!)
- [ ] Redirect URI added: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`

---

## ⚠️ Important Notes

1. **Changes take effect:** Google Cloud Console changes can take 5 minutes to a few hours
2. **Local vs Production:** 
   - Local: May require additional setup, email magic link works immediately
   - Production: Will work perfectly once URLs are configured correctly
3. **Vercel URL:** The preview URL `whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app` is a preview deployment. For production, you might want to set up a custom domain later.

---

## 🎯 Summary of Fixes Needed

1. **Supabase Site URL:** Change from `https://whats-4-dinner` to full Vercel URL
2. **Supabase Redirect URLs:** Add 4 URLs (localhost and Vercel, with and without wildcards)
3. **Google Cloud Console:** 
   - Remove `s://` URL (wrong format)
   - Remove `/auth/callback` localhost URL (wrong path)
   - Add correct Vercel URL with `https://`
   - Add JavaScript origins

Once all these are configured, Google OAuth will work on both local and Vercel! 🚀

