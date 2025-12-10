# Admin Setup Guide

## How to Add Admin Users

To fix the 403 errors on `/api/admin/users`, you need to add the `ADMIN_EMAILS` environment variable to Vercel.

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project: `whats-4-dinner`

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add ADMIN_EMAILS Variable**
   - Click **Add New**
   - **Key:** `ADMIN_EMAILS`
   - **Value:** `Raymondvdw@gmail.com,Elanrodp@gmail.com`
   - **Environment:** Select **Production**, **Preview**, and **Development** (or just Production if you only want it there)
   - Click **Save**

4. **Redeploy Your App**
   - After adding the environment variable, Vercel will automatically redeploy
   - Or go to **Deployments** tab and click **Redeploy** on the latest deployment

5. **Verify It Works**
   - Log in with one of the admin emails
   - Go to `/admin` page
   - The 403 errors should stop
   - You should see user data loading correctly

### Important Notes:

- **Email Format:** Use comma-separated list, no spaces (or spaces are fine, they get trimmed)
- **Case Insensitive:** The emails are compared case-insensitively, so `Raymondvdw@gmail.com` and `raymondvdw@gmail.com` both work
- **Current Admin Emails:**
  - `Raymondvdw@gmail.com`
  - `Elanrodp@gmail.com`

### Troubleshooting:

- **Still getting 403?** 
  - Make sure you're logged in with one of the admin emails
  - Check that the environment variable is set in the correct environment (Production/Preview)
  - Wait for Vercel to finish redeploying (can take 1-2 minutes)
  - Clear your browser cache and try again

- **Environment Variable Not Working?**
  - Make sure there are no extra spaces or quotes in the value
  - Format should be: `email1@example.com,email2@example.com`
  - Check that you selected the correct environments (Production, Preview, Development)

