# ⚡ Quick Start: Google Auth (5-Minute Checklist)

**Follow this checklist in order:**

## ✅ Google Cloud Console (3 minutes)

- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project: "Whats-4-Dinner"
- [ ] APIs & Services → OAuth consent screen → Configure (External, your email)
- [ ] APIs & Services → Library → Enable "Google Identity Services API"
- [ ] APIs & Services → Credentials → Create OAuth Client ID
  - [ ] Type: Web application
  - [ ] Name: "What's 4 Dinner Web"
  - [ ] Redirect URI: `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
  - [ ] Redirect URI: `http://localhost:5173/auth/callback`
- [ ] Copy Client ID and Client Secret (save them!)

## ✅ Supabase Dashboard (2 minutes)

- [ ] Go to https://supabase.com/dashboard
- [ ] Select your project
- [ ] Authentication → Providers
- [ ] Enable Google
- [ ] Paste Client ID
- [ ] Paste Client Secret
- [ ] Save

## ✅ Test It!

- [ ] Run your app: `npm run dev`
- [ ] Click "Sign In" → "Google"
- [ ] Should redirect to Google login ✅

---

**Detailed guide:** See [GOOGLE_AUTH_STEP_BY_STEP.md](./GOOGLE_AUTH_STEP_BY_STEP.md)

