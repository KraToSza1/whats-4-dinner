# 🔐 Google OAuth Setup (100% FREE)

## Step 1: Google Cloud Console (5 minutes)

1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Name it: "Whats-4-Dinner"
4. Click **"Create"**

## Step 2: Enable OAuth API (FREE)

1. In the project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click **"Enable"** (100% FREE, no payment needed)

## Step 3: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Click **"Configure Consent Screen"**:
   - User Type: **External** (for testing)
   - App name: "What's 4 Dinner"
   - Support email: Your email
   - Click **"Save and Continue"** → **"Save and Continue"** → **"Back to Dashboard"**
4. Back to **"Create OAuth client ID"**:
   - Application type: **Web application**
   - Name: "What's 4 Dinner Web"
   - Add **Authorized redirect URIs**:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
   - Click **"Create"**
5. **Copy**:
   - Client ID
   - Client Secret

## Step 4: Add to Supabase

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click **"Authentication"** → **"Providers"**
3. Toggle **Google** to ON
4. Paste your **Client ID** and **Client Secret**
5. Click **"Save"**

## Step 5: Test It!

1. Run your app
2. Click **"Sign In"**
3. Click **"Google"**
4. Should redirect to Google login ✅

## That's It! 100% FREE

**No credit card needed, no payment required!**

- Free for unlimited users
- Free for unlimited authentications
- Only paid if you exceed 6+ million requests/day (unlikely)

---

**Common Issues:**

Q: "OAuth quota exceeded"
A: That's only if you get millions of users per day (very unlikely)

Q: "Redirect URI mismatch"
A: Make sure the URI in Google Console EXACTLY matches your Supabase URL

Q: Still not working?
A: Send me the error message and I'll help!

