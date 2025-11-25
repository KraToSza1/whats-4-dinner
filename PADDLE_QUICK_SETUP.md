# 🚀 Paddle Quick Setup - Right Now!

## ✅ Step 1: Copy Your API Key (You're Here!)

1. **Click "Copy key"** button in the Paddle modal
2. **Save it somewhere safe** (like a text file or notes)
   - Your API Key: `pdl_sdbx_apikey_01kaxv8mj6pk2qzbmeedhr19ee_ynYpqmPxVznVRBqYYnk7mB_AJR`
   - Expires: Feb 23, 2026 (plenty of time!)

## ✅ Step 2: Get Your Vendor ID

1. **In Paddle Dashboard** (left sidebar)
2. Go to **Developer Tools** → **Authentication**
3. Look for **"Vendor ID"** (usually a number like `111111` or similar)
4. **Copy it** and save it

## ✅ Step 3: Add to Vercel (2 minutes)

1. **Go to Vercel Dashboard:**
   - https://vercel.com
   - Find your project: `whats-4-dinner`
   - Click on it

2. **Go to Settings → Environment Variables**

3. **Add these 2 variables:**

   **Variable 1:**
   ```
   Name: PADDLE_VENDOR_ID
   Value: [paste your Vendor ID]
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

   **Variable 2:**
   ```
   Name: PADDLE_API_KEY
   Value: pdl_sdbx_apikey_01kaxv8mj6pk2qzbmeedhr19ee_ynYpqmPxVznVRBqYYnk7mB_AJR
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

   **Variable 3:**
   ```
   Name: PADDLE_ENV
   Value: sandbox
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

4. **Click "Save"** for each

5. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

## ✅ Step 4: Create Products in Paddle (Next)

After Vercel is updated, we'll create the 6 products. But first, let's get the basics working!

---

**Right now, just:**
1. ✅ Copy API key (done!)
2. ✅ Get Vendor ID from Paddle Dashboard
3. ✅ Add both to Vercel
4. ✅ Redeploy

Then we'll create products! 🎉

