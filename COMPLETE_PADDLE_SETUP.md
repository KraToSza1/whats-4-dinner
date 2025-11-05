# 🚀 Complete Paddle Setup Guide - Step by Step

## Overview

This guide will walk you through setting up Paddle for your global business. **Paddle works in 200+ countries** and handles all taxes, VAT, and compliance automatically.

**Time to complete:** ~30 minutes

---

## Step 1: Sign Up for Paddle Account

### 1.1 Create Account

1. Go to [https://paddle.com](https://paddle.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"SaaS"** as your business type
4. Fill in:
   - **Email address** (use your business email)
   - **Password** (create a strong password)
   - **Company name** (e.g., "What's 4 Dinner" or your business name)

### 1.2 Business Verification

1. **Complete business details:**
   - Business name
   - Business address (can be your home address if starting)
   - Business type (Sole Proprietor, LLC, etc.)
   - Tax ID (if you have one, or skip for now)

2. **Submit for verification:**
   - Paddle will review your application
   - Usually takes **24-48 hours**
   - You'll get an email when approved

**Note:** You can use test mode while waiting for approval!

---

## Step 2: Get Your API Keys

### 2.1 Access Developer Tools

1. Once logged into Paddle Dashboard
2. Go to **"Developer Tools"** → **"API Keys"**
3. You'll see two sections:
   - **Sandbox (Test)** - For testing
   - **Live (Production)** - For real payments

### 2.2 Copy Your Keys

**For Testing (Start Here):**
- **Vendor ID**: Copy the number (e.g., `123456`)
- **Sandbox API Key**: Copy the key (starts with `test_...`)
- **Sandbox Public Key**: Copy the key (starts with `pk_test_...`)

**For Production (Later):**
- **Vendor ID**: Same as above
- **Live API Key**: Copy the key (starts with `live_...`)
- **Live Public Key**: Copy the key (starts with `pk_live_...`)

**Save these somewhere safe!** You'll need them in Step 5.

---

## Step 3: Create Products in Paddle

You need to create **6 products** (3 plans × 2 billing periods).

### 3.1 Navigate to Products

1. Go to **"Catalog"** → **"Products"**
2. Click **"Create Product"**

### 3.2 Create Supporter Monthly

1. **Product Name**: `Supporter Monthly`
2. **Product Type**: Select **"Subscription"**
3. **Price**: 
   - **Amount**: `2.99`
   - **Currency**: `USD` (recommended - Paddle converts automatically)
4. **Billing Period**: Select **"Monthly"**
5. **Tax Settings**: 
   - ✅ Enable **"Automatic Tax Calculation"**
   - ✅ Enable **"Collect Taxes"**
6. Click **"Save"** or **"Create Product"**
7. **Copy the Price ID** (starts with `pri_...`) - Save this!

### 3.3 Create Supporter Yearly

1. **Product Name**: `Supporter Yearly`
2. **Product Type**: Select **"Subscription"**
3. **Price**: 
   - **Amount**: `29.99`
   - **Currency**: `USD`
4. **Billing Period**: Select **"Yearly"**
5. **Tax Settings**: 
   - ✅ Enable **"Automatic Tax Calculation"**
   - ✅ Enable **"Collect Taxes"**
6. Click **"Save"**
7. **Copy the Price ID** (starts with `pri_...`) - Save this!

### 3.4 Create Unlimited Monthly

1. **Product Name**: `Unlimited Monthly`
2. **Product Type**: **"Subscription"**
3. **Price**: 
   - **Amount**: `4.99`
   - **Currency**: `USD`
4. **Billing Period**: **"Monthly"**
5. **Tax Settings**: 
   - ✅ Enable **"Automatic Tax Calculation"**
   - ✅ Enable **"Collect Taxes"**
6. Click **"Save"**
7. **Copy the Price ID** - Save this!

### 3.5 Create Unlimited Yearly

1. **Product Name**: `Unlimited Yearly`
2. **Product Type**: **"Subscription"**
3. **Price**: 
   - **Amount**: `49.99`
   - **Currency**: `USD`
4. **Billing Period**: **"Yearly"**
5. **Tax Settings**: 
   - ✅ Enable **"Automatic Tax Calculation"**
   - ✅ Enable **"Collect Taxes"**
6. Click **"Save"**
7. **Copy the Price ID** - Save this!

### 3.6 Create Family Monthly

1. **Product Name**: `Family Monthly`
2. **Product Type**: **"Subscription"**
3. **Price**: 
   - **Amount**: `9.99`
   - **Currency**: `USD`
4. **Billing Period**: **"Monthly"**
5. **Tax Settings**: 
   - ✅ Enable **"Automatic Tax Calculation"**
   - ✅ Enable **"Collect Taxes"**
6. Click **"Save"**
7. **Copy the Price ID** - Save this!

### 3.7 Create Family Yearly

1. **Product Name**: `Family Yearly`
2. **Product Type**: **"Subscription"**
3. **Price**: 
   - **Amount**: `99.99`
   - **Currency**: `USD`
4. **Billing Period**: **"Yearly"**
5. **Tax Settings**: 
   - ✅ Enable **"Automatic Tax Calculation"**
   - ✅ Enable **"Collect Taxes"**
6. Click **"Save"**
7. **Copy the Price ID** - Save this!

### 3.8 Save All Price IDs

You should have **6 Price IDs** saved. They look like:
```
pri_01abc123def456...
pri_01xyz789ghi012...
etc.
```

**Create a list like this:**
```
Supporter Monthly: pri_...
Supporter Yearly: pri_...
Unlimited Monthly: pri_...
Unlimited Yearly: pri_...
Family Monthly: pri_...
Family Yearly: pri_...
```

---

## Step 4: Set Up Webhook

### 4.1 Create Webhook Endpoint

1. Go to **"Developer Tools"** → **"Notifications"** or **"Webhooks"**
2. Click **"Add Notification"** or **"Create Webhook"**

### 4.2 Configure Webhook

1. **Notification URL**: 
   ```
   https://your-vercel-app.vercel.app/api/paddle/webhook
   ```
   (Replace `your-vercel-app` with your actual Vercel app name)

2. **Select Events** (check these boxes):
   - ✅ `transaction.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.payment_succeeded`
   - ✅ `subscription.payment_failed`

3. Click **"Save"** or **"Create Webhook"**

### 4.3 Copy Webhook Secret

1. After creating, you'll see a **"Webhook Secret"** or **"Signing Secret"**
2. It starts with `whsec_...`
3. **Copy this and save it!** You'll need it in Step 5.

---

## Step 5: Add Environment Variables to Vercel

### 5.1 Go to Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Log in to your account
3. Select your **"whats-4-dinner"** project (or whatever you named it)

### 5.2 Open Environment Variables

1. Click **"Settings"** (top menu)
2. Click **"Environment Variables"** (left sidebar)

### 5.3 Add Payment Provider

Add this first:
```
Name: VITE_PAYMENT_PROVIDER
Value: paddle
Environment: Production, Preview, Development (check all)
```

### 5.4 Add Paddle Credentials

**For Testing (Start Here):**
```
Name: PADDLE_VENDOR_ID
Value: 123456 (your actual vendor ID)
Environment: Production, Preview, Development (check all)

Name: PADDLE_API_KEY
Value: test_... (your sandbox API key)
Environment: Production, Preview, Development (check all)

Name: PADDLE_PUBLIC_KEY
Value: pk_test_... (your sandbox public key)
Environment: Production, Preview, Development (check all)

Name: PADDLE_WEBHOOK_SECRET
Value: whsec_... (your webhook secret)
Environment: Production, Preview, Development (check all)
```

### 5.5 Add Price IDs

Add all 6 price IDs (use the ones you saved in Step 3):

```
Name: PADDLE_PRICE_SUPPORTER_MONTHLY
Value: pri_... (your Supporter Monthly price ID)
Environment: Production, Preview, Development (check all)

Name: PADDLE_PRICE_SUPPORTER_YEARLY
Value: pri_... (your Supporter Yearly price ID)
Environment: Production, Preview, Development (check all)

Name: PADDLE_PRICE_UNLIMITED_MONTHLY
Value: pri_... (your Unlimited Monthly price ID)
Environment: Production, Preview, Development (check all)

Name: PADDLE_PRICE_UNLIMITED_YEARLY
Value: pri_... (your Unlimited Yearly price ID)
Environment: Production, Preview, Development (check all)

Name: PADDLE_PRICE_FAMILY_MONTHLY
Value: pri_... (your Family Monthly price ID)
Environment: Production, Preview, Development (check all)

Name: PADDLE_PRICE_FAMILY_YEARLY
Value: pri_... (your Family Yearly price ID)
Environment: Production, Preview, Development (check all)
```

### 5.6 Verify All Variables

You should have **11 environment variables** total:
1. `VITE_PAYMENT_PROVIDER`
2. `PADDLE_VENDOR_ID`
3. `PADDLE_API_KEY`
4. `PADDLE_PUBLIC_KEY`
5. `PADDLE_WEBHOOK_SECRET`
6. `PADDLE_PRICE_SUPPORTER_MONTHLY`
7. `PADDLE_PRICE_SUPPORTER_YEARLY`
8. `PADDLE_PRICE_UNLIMITED_MONTHLY`
9. `PADDLE_PRICE_UNLIMITED_YEARLY`
10. `PADDLE_PRICE_FAMILY_MONTHLY`
11. `PADDLE_PRICE_FAMILY_YEARLY`

---

## Step 6: Update Paddle API Endpoint

### 6.1 Check Your API File

The file `api/paddle/create-checkout.js` already uses environment variables to switch between sandbox and production.

**For Testing:** Uses `https://sandbox-api.paddle.com` (default)
**For Production:** Set `PADDLE_ENV=production` in Vercel to use `https://api.paddle.com`

---

## Step 7: Redeploy to Vercel

### 7.1 Push Changes to GitHub

1. Make sure all your code changes are committed
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Add Paddle payment integration"
   git push
   ```

### 7.2 Redeploy on Vercel

1. Vercel will automatically redeploy when you push
2. **OR** go to Vercel Dashboard → Your Project → **"Deployments"**
3. Click **"Redeploy"** → **"Redeploy"** (with "Clear Cache" checked)

### 7.3 Verify Deployment

1. Wait for deployment to complete
2. Check that your app loads without errors
3. Check browser console for any errors

---

## Step 8: Test the Integration

### 8.1 Test in Your App

1. Go to your deployed app
2. Click **"Upgrade Plan"** or **"Go Pro"** in the menu
3. Select a plan (e.g., "Supporter")
4. Click **"Upgrade"**
5. You should be redirected to Paddle checkout

### 8.2 Test with Test Cards

**Paddle Test Cards:**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Test Details:**
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name (e.g., `Test User`)

### 8.3 Test Subscription Flow

1. Complete a test purchase
2. Check that you're redirected back to your app
3. Check that subscription status updates
4. Check that ads are removed (if paid plan)

---

## Step 9: Switch to Production (When Ready)

### 9.1 Get Live Keys

1. Go to Paddle Dashboard → **"Developer Tools"** → **"API Keys"**
2. Copy your **Live** keys (not test keys):
   - Live API Key (`live_...`)
   - Live Public Key (`pk_live_...`)

### 9.2 Update Vercel Environment Variables

1. Go to Vercel → Your Project → **"Settings"** → **"Environment Variables"**
2. Update these variables:
   - `PADDLE_API_KEY` → Change to live key (`live_...`)
   - `PADDLE_PUBLIC_KEY` → Change to live key (`pk_live_...`)
3. Add this variable:
   - `PADDLE_ENV` → `production`

### 9.3 Redeploy

1. Push changes to GitHub
2. Vercel will redeploy automatically
3. **You're now live!** 🎉

---

## Step 10: Verify Webhook is Working

### 10.1 Check Webhook Logs

1. Go to Paddle Dashboard → **"Developer Tools"** → **"Notifications"**
2. Click on your webhook
3. Check **"Events"** or **"Logs"** tab
4. You should see events being received

### 10.2 Test Webhook

1. Make a test purchase
2. Check webhook logs in Paddle
3. Check that subscription status updates in your app

---

## Troubleshooting

### Error: "Missing Paddle credentials"

**Fix:** Check that all environment variables are set in Vercel:
- `PADDLE_VENDOR_ID`
- `PADDLE_API_KEY`
- `PADDLE_PUBLIC_KEY`

### Error: "Missing price ID"

**Fix:** Check that all 6 price IDs are set in Vercel:
- `PADDLE_PRICE_SUPPORTER_MONTHLY`
- `PADDLE_PRICE_SUPPORTER_YEARLY`
- etc.

### Error: "Webhook not working"

**Fix:**
1. Check webhook URL is correct: `https://your-app.vercel.app/api/paddle/webhook`
2. Check `PADDLE_WEBHOOK_SECRET` is set correctly
3. Check webhook events are selected in Paddle Dashboard

### Error: "Checkout not redirecting"

**Fix:**
1. Check that `VITE_PAYMENT_PROVIDER=paddle` is set
2. Check browser console for errors
3. Check that API endpoint is correct (sandbox vs production)

---

## Quick Checklist

Before going live, make sure:

- [ ] Paddle account created and verified
- [ ] All 6 products created in Paddle
- [ ] All 6 Price IDs copied
- [ ] Webhook created and secret copied
- [ ] All 11 environment variables added to Vercel
- [ ] Tested with test cards
- [ ] Webhook receiving events
- [ ] Subscription status updating correctly
- [ ] Switched to live keys (when ready)
- [ ] Added `PADDLE_ENV=production` for live mode

---

## Support

- **Paddle Docs**: https://developer.paddle.com
- **Paddle Support**: support@paddle.com
- **Paddle Community**: https://paddle.com/community

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test with test cards
3. ✅ Get customers!
4. ✅ Accept payments globally! 🌍

**You're ready to go global!** 🚀

