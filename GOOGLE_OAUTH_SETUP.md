# Google OAuth Setup Guide

## Quick Setup (5 minutes)

### Step 1: Enable Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click **Enable**
5. You'll need to configure Google OAuth credentials (see Step 2)

### Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   - For **Local Development**: `http://localhost:5173`
   - For **Vercel Production**: `https://your-app.vercel.app` (replace with your actual Vercel URL)
   - Also add: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Supabase

1. Back in Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

### Step 4: Add Redirect URLs in Supabase

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:5173` (for local development)
   - `https://your-app.vercel.app` (for production - replace with your Vercel URL)
   - `https://your-app.vercel.app/**` (wildcard for all routes)

### Step 5: Test

1. **Local Development**: 
   - Google OAuth may not work locally if redirect URL isn't configured
   - It will work on Vercel once deployed
   
2. **Production (Vercel)**:
   - Deploy your app to Vercel
   - Make sure the Vercel URL is added to both:
     - Google Cloud Console (Authorized redirect URIs)
     - Supabase (Redirect URLs)
   - Test Google sign-in on the live site

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the exact URL (including `http://` or `https://`) is added to:
  - Google Cloud Console → OAuth Client → Authorized redirect URIs
  - Supabase → Authentication → URL Configuration → Redirect URLs

### "Provider is not enabled" error
- Go to Supabase → Authentication → Providers → Google
- Make sure it's enabled and credentials are saved

### OAuth works on Vercel but not locally
- This is normal! Google OAuth requires the redirect URL to be registered
- For local testing, use email magic link instead
- Or add `http://localhost:5173` to Google Cloud Console and Supabase redirect URLs

## Notes

- **Local Development**: Google OAuth may require additional setup. Email magic link works immediately.
- **Production**: Google OAuth will work perfectly once the Vercel URL is configured in both Google Cloud Console and Supabase.
- All OAuth setup is **100% FREE** - no credit card required!

