# Supabase Authentication Setup

## Enable Google and Apple Sign-In

To fix the "Unsupported provider: provider is not enabled" error, you need to enable these providers in your Supabase dashboard.

### Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Authentication Settings**
   - In the left sidebar, click **Authentication**
   - Then click **Providers**

3. **Enable Google OAuth**
   - Toggle **Google** to Enabled
   - You'll need:
     - **Client ID** (from Google Cloud Console)
     - **Client Secret** (from Google Cloud Console)
   - Add **Authorized Redirect URLs**: `https://YOUR_PROJECT_REFERENCE.supabase.co/auth/v1/callback`
   - Save

4. **Enable Apple OAuth (Optional)**
   - Toggle **Apple** to Enabled
   - Requires Apple Developer Account setup
   - Configure credentials in Supabase
   - Save

### Google Cloud Console Setup (for Google OAuth)

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   - `https://YOUR_PROJECT_REFERENCE.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for local dev)
7. Copy **Client ID** and **Client Secret**
8. Paste into Supabase Google provider settings

### Important Notes

- The magic link (email) authentication works without any additional setup
- Google and Apple require cloud provider configuration
- Make sure your Vercel deployment uses the same Supabase project

### Test Locally

```bash
npm run dev
```

Try signing in with Google. If you get the error, check:
1. Is Google enabled in Supabase?
2. Are redirect URLs correct?
3. Are Client ID and Secret correct?

