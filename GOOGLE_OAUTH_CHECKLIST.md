# Google OAuth Verification Checklist

## What to Check in Google Cloud Console

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com
- Select your project (or create one if you don't have one)

### 2. Enable Google+ API (if needed)
- Go to **APIs & Services** → **Library**
- Search for "Google+ API" or "Google Identity"
- Make sure it's **Enabled**

### 3. Check OAuth 2.0 Credentials
- Go to **APIs & Services** → **Credentials**
- Look for **OAuth 2.0 Client IDs**
- You should see a client ID for your app

### 4. Verify Authorized Redirect URIs
Click on your OAuth 2.0 Client ID and check:

**Authorized JavaScript origins:**
- `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- `https://whats4dinner.app` (if you have a custom domain)
- `http://localhost:5173` (for local development)

**Authorized redirect URIs:**
- `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
- `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/auth/v1/callback`
- `http://localhost:5173/auth/v1/callback` (for local dev)

**IMPORTANT:** The redirect URI MUST match what Supabase expects. Check your Supabase dashboard:
- Go to **Authentication** → **URL Configuration**
- Copy the **Redirect URLs** from there
- Add ALL of them to Google Cloud Console

### 5. Check OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**
- Make sure:
  - **User Type:** External (for public apps) or Internal (for Google Workspace)
  - **App name:** "What's 4 Dinner" (or your app name)
  - **User support email:** Your email
  - **Developer contact:** Your email
  - **Scopes:** Should include `email`, `profile`, `openid`

### 6. Test Users (if app is in Testing mode)
- If your app is in **Testing** mode, go to **OAuth consent screen**
- Scroll to **Test users**
- Add test users:
  - `Raymondvdw@gmail.com`
  - `Elanridp@gmail.com`
- **OR** publish your app to make it available to everyone

### 7. Check Supabase Configuration
- Go to **Supabase Dashboard** → Your Project → **Authentication** → **Providers**
- Make sure **Google** is **Enabled**
- Check that:
  - **Client ID (for OAuth)** is set (from Google Cloud Console)
  - **Client Secret (for OAuth)** is set (from Google Cloud Console)
  - **Redirect URL** matches what's in Google Cloud Console

### 8. Common Issues

**Error: "disallowed_useragent"**
- This happens when Google detects an embedded browser
- **Fix:** Sign in from a regular browser, not an embedded one
- Or use email magic link instead

**Error: "redirect_uri_mismatch"**
- The redirect URI in Google doesn't match Supabase
- **Fix:** Copy the exact redirect URI from Supabase and add it to Google Cloud Console

**Error: "access_denied"**
- App is in Testing mode and user isn't added as test user
- **Fix:** Add user to test users list OR publish the app

**OAuth not working at all**
- Check that Google provider is enabled in Supabase
- Verify Client ID and Secret are correct
- Make sure redirect URIs match exactly

## Quick Verification Steps

1. ✅ Google Cloud Console → Credentials → OAuth 2.0 Client ID exists
2. ✅ Authorized redirect URIs include Supabase callback URL
3. ✅ OAuth consent screen is configured
4. ✅ Test users added (if in Testing mode) OR app is Published
5. ✅ Supabase → Authentication → Providers → Google is Enabled
6. ✅ Client ID and Secret are set in Supabase

## What the Admin Dashboard Shows

The admin dashboard will show:
- ✅ **Green:** Google OAuth is enabled and configured
- ⚠️ **Yellow:** Configuration issue detected
- ❌ **Red:** Google OAuth not enabled or misconfigured

Check the Integration Status section in your admin dashboard to see the current status.

