# 🔐 Google OAuth Setup - Complete Step-by-Step Guide

**Total Time:** ~10 minutes  
**Cost:** $0.00 (100% FREE)  
**Difficulty:** Easy ✨

---

## 📋 What You'll Need

1. A Google account (Gmail)
2. Your Supabase dashboard access
3. Your Supabase project URL: `chhdqmntirvngvamtgdo.supabase.co`

---

## PART 1: Google Cloud Console Setup (5 minutes)

### Step 1: Open Google Cloud Console

1. **Open your browser** and go to: https://console.cloud.google.com/
2. **Sign in** with your Google account (if not already signed in)

### Step 2: Create a New Project

1. At the **top of the page**, click the **project dropdown** (it might say "Select a project" or show your current project name)
2. Click **"New Project"** (or the **"+"** button)
3. **Project name:** Enter: `Whats-4-Dinner`
4. **Location:** Leave as default (No organization)
5. Click **"CREATE"** button
6. **Wait** for the project to be created (usually 10-30 seconds)
7. Once created, **select the project** from the dropdown at the top

### Step 3: Enable OAuth Consent Screen

1. In the **left sidebar**, click **"APIs & Services"** (or hover and expand)
2. Click **"OAuth consent screen"**
3. You'll see a form. Fill it out:
   - **User Type:** Select **"External"** (this is free, no verification needed for testing)
   - Click **"CREATE"**
   
4. **App information:**
   - **App name:** `What's 4 Dinner`
   - **User support email:** Select your email from the dropdown
   - **App logo:** Leave blank (optional)
   - **App domain:** Leave blank (optional)
   - **Developer contact information:** Enter your email address
   
5. Click **"SAVE AND CONTINUE"** button at the bottom

6. **Scopes** (Step 2):
   - Don't add any scopes, just click **"SAVE AND CONTINUE"**

7. **Test users** (Step 3):
   - Don't add any test users, just click **"SAVE AND CONTINUE"**

8. **Summary** (Step 4):
   - Review the information
   - Click **"BACK TO DASHBOARD"**

### Step 4: Enable OAuth API

1. In the **left sidebar**, click **"APIs & Services"**
2. Click **"Library"** (or "Enabled APIs and services")
3. In the **search bar**, type: `Google Identity`
4. Click on **"Google Identity Services API"** (or similar)
5. Click the **"ENABLE"** button
6. Wait for it to enable (usually instant)

### Step 5: Create OAuth Credentials

1. In the **left sidebar**, click **"APIs & Services"**
2. Click **"Credentials"**
3. At the **top**, click **"CREATE CREDENTIALS"**
4. Select **"OAuth client ID"** from the dropdown

5. **If you see a warning about OAuth consent screen:**
   - Click **"CONFIGURE CONSENT SCREEN"** and complete Step 3 above
   - Then come back to this step

6. **Application type:** Select **"Web application"**

7. **Name:** Enter: `What's 4 Dinner Web`

8. **Authorized redirect URIs:** Click **"ADD URI"** and add these **TWO** URLs (one at a time):
   
   **First URI:**
   ```
   https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback
   ```
   
   **Second URI:**
   ```
   http://localhost:5173/auth/callback
   ```
   
   **Important:** Make sure there are NO extra spaces or characters!

9. Click **"CREATE"** button

10. **SUCCESS!** You'll see a popup with:
    - **Your Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
    - **Your Client Secret** (looks like: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`)
    
11. **IMPORTANT:** 
    - **Copy the Client ID** and paste it somewhere safe (Notepad, notes app, etc.)
    - **Copy the Client Secret** and paste it somewhere safe
    - **DO NOT CLOSE** this popup until you've copied both!
    
12. Click **"OK"** to close the popup

---

## PART 2: Supabase Dashboard Setup (3 minutes)

### Step 6: Open Supabase Dashboard

1. **Open a new tab** in your browser
2. Go to: https://supabase.com/dashboard
3. **Sign in** if needed
4. **Click on your project** (or find the project with URL: `chhdqmntirvngvamtgdo`)

### Step 7: Enable Google Provider

1. In the **left sidebar**, click **"Authentication"**
2. Click **"Providers"** (or look for it in the submenu)
3. Find **"Google"** in the list of providers
4. **Toggle the switch** to **ON** (or click the **"Edit"** button next to Google)

### Step 8: Add Google Credentials

1. You'll see a form with:
   - **Enabled:** Should be ON/checked
   - **Client ID (Consumer Key):** Paste your **Client ID** from Step 5
   - **Client Secret (Consumer Secret):** Paste your **Client Secret** from Step 5

2. **Important fields to fill:**
   - **Client ID:** Paste the Client ID you copied
   - **Client Secret:** Paste the Client Secret you copied

3. Scroll down and look for **"Allowed Redirect URLs"** or **"Authorized Redirect URLs"**
   - It should already have: `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
   - If not, add it manually

4. Click **"SAVE"** button (or **"Update"** or **"Save changes"**)

5. **SUCCESS!** You should see a green checkmark or success message

---

## PART 3: Test It! (2 minutes)

### Step 9: Test in Your App

1. **Go back to your app** (or start it if it's not running)
   - If not running, open terminal and type: `npm run dev`
   - Wait for it to start

2. **Open your app** in the browser (usually: http://localhost:5173)

3. **Click the "Sign In" button** (or wherever your auth modal is)

4. **Click the "Google" button**

5. **What should happen:**
   - You should be **redirected to Google's login page**
   - You'll see "Sign in with Google" or similar
   - You can select a Google account
   - After signing in, you'll be redirected back to your app
   - You should be logged in! ✅

---

## ✅ Success Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Google Identity API enabled
- [ ] OAuth credentials created (Client ID and Secret copied)
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret added to Supabase
- [ ] Tested sign-in - redirects to Google login
- [ ] Successfully signed in with Google account

---

## 🐛 Troubleshooting

### Error: "Provider is not enabled"
**Fix:** Make sure you clicked **"SAVE"** in Supabase after adding the credentials.

### Error: "Redirect URI mismatch"
**Fix:** 
1. Go back to Google Cloud Console → Credentials
2. Make sure the redirect URI is EXACTLY: `https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback`
3. No extra spaces, no trailing slashes
4. Copy it exactly as shown

### Error: "Invalid client"
**Fix:**
1. Double-check you copied the **Client ID** and **Client Secret** correctly
2. Make sure there are no extra spaces when pasting
3. Try copying them again from Google Cloud Console

### Still not working?
1. **Check the browser console** (F12 → Console tab) for error messages
2. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for any error messages

---

## 📝 Quick Reference

**Your Supabase URL:** `chhdqmntirvngvamtgdo.supabase.co`

**Redirect URI to use in Google Console:**
```
https://chhdqmntirvngvamtgdo.supabase.co/auth/v1/callback
```

**Local redirect URI (for development):**
```
http://localhost:5173/auth/callback
```

---

## 🎉 You're Done!

Once you see the Google login page when clicking "Sign In with Google", you've successfully set up Google OAuth!

**Total Cost:** $0.00  
**Time Spent:** ~10 minutes  
**Result:** Professional Google Sign-In working! 🚀




46126974507-s0k5t6hh9v1bqeo5j2p3f4n6ffoi6mvh.apps.googleusercontent.com