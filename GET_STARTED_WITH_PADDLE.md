# 🚀 Get Started with Paddle - Step by Step

## ✅ Step 1: Get Your Paddle Credentials

1. **In Paddle Sandbox Dashboard:**
   - Go to **Developer Tools** → **Authentication** (left sidebar)
   - You'll see:
     - **Vendor ID**: Copy this (looks like `111111` or similar)
     - **API Keys**: Click "Create API Key" or copy existing one
     - Copy the **API Key** (starts with `test_` for sandbox)

2. **Save these somewhere safe:**
   ```
   Vendor ID: _______________
   API Key: test_______________
   ```

## ✅ Step 2: Create Products & Prices in Paddle

You need to create 6 products (3 plans × 2 billing periods):

### In Paddle Dashboard → Catalog → Products:

#### Create Product 1: Supporter Monthly
1. Click **"Create Product"**
2. **Product Name**: "Supporter Plan - Monthly"
3. **Product Type**: Subscription
4. **Billing Period**: Monthly
5. **Price**: $2.99 (or your price)
6. Click **"Create"**
7. **Copy the Price ID** (looks like `pri_01xxxxx`) → Save as: `PADDLE_PRICE_SUPPORTER_MONTHLY`

#### Create Product 2: Supporter Yearly
- Same as above but:
- **Product Name**: "Supporter Plan - Yearly"
- **Billing Period**: Yearly
- **Price**: $29.99
- Copy Price ID → Save as: `PADDLE_PRICE_SUPPORTER_YEARLY`

#### Create Product 3: Unlimited Monthly
- **Product Name**: "Unlimited Plan - Monthly"
- **Billing Period**: Monthly
- **Price**: $4.99
- Copy Price ID → Save as: `PADDLE_PRICE_UNLIMITED_MONTHLY`

#### Create Product 4: Unlimited Yearly
- **Product Name**: "Unlimited Plan - Yearly"
- **Billing Period**: Yearly
- **Price**: $49.99
- Copy Price ID → Save as: `PADDLE_PRICE_UNLIMITED_YEARLY`

#### Create Product 5: Family Monthly
- **Product Name**: "Family Plan - Monthly"
- **Billing Period**: Monthly
- **Price**: $9.99
- Copy Price ID → Save as: `PADDLE_PRICE_FAMILY_MONTHLY`

#### Create Product 6: Family Yearly
- **Product Name**: "Family Plan - Yearly"
- **Billing Period**: Yearly
- **Price**: $99.99
- Copy Price ID → Save as: `PADDLE_PRICE_FAMILY_YEARLY`

## ✅ Step 3: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Find your project: `whats-4-dinner`
   - Click on it

2. **Go to Settings:**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

3. **Add These Variables** (click "Add" for each):

   ```
   Name: PADDLE_VENDOR_ID
   Value: [paste your Vendor ID]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_API_KEY
   Value: [paste your API Key starting with test_]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_ENV
   Value: sandbox
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_PRICE_SUPPORTER_MONTHLY
   Value: [paste Price ID from Product 1]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_PRICE_SUPPORTER_YEARLY
   Value: [paste Price ID from Product 2]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_PRICE_UNLIMITED_MONTHLY
   Value: [paste Price ID from Product 3]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_PRICE_UNLIMITED_YEARLY
   Value: [paste Price ID from Product 4]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_PRICE_FAMILY_MONTHLY
   Value: [paste Price ID from Product 5]
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: PADDLE_PRICE_FAMILY_YEARLY
   Value: [paste Price ID from Product 6]
   Environment: Production, Preview, Development (select all)
   ```

4. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click the **"..."** menu on latest deployment
   - Click **"Redeploy"**
   - Wait 2-3 minutes

## ✅ Step 4: Test Payment Flow

1. **Visit your Vercel URL:**
   - Go to: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
   - Or your production URL if you have one

2. **Try to Subscribe:**
   - Click any "Upgrade" or "Subscribe" button
   - Select a plan (e.g., "Supporter")
   - Click "Subscribe"

3. **Use Test Card:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVV: Any 3 digits (e.g., `123`)
   - Name: Any name

4. **Complete Payment:**
   - You should be redirected back to your app
   - Check Paddle Dashboard → Transactions to see the test payment

## ✅ Step 5: Set Up Webhooks (Optional but Recommended)

1. **In Paddle Dashboard:**
   - Go to **Developer Tools** → **Notifications**
   - Click **"Add Notification"**

2. **Webhook URL:**
   ```
   https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app/api/paddle/webhook
   ```
   (Replace with your actual Vercel URL)

3. **Select Events:**
   - ✅ `transaction.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`

4. **Save**

## 🎉 You're Done!

Your payment system is now live! Users can subscribe and payments will process through Paddle.

---

## 🐛 Troubleshooting

**Payment button doesn't work?**
- Check browser console for errors
- Verify environment variables are set in Vercel
- Make sure you redeployed after adding env vars

**"Missing Paddle credentials" error?**
- Double-check env vars in Vercel
- Make sure variable names match exactly (case-sensitive)
- Redeploy after adding env vars

**Checkout page doesn't load?**
- Verify Price IDs are correct
- Check Paddle Dashboard → Products to confirm prices exist
- Make sure you're using sandbox API key (starts with `test_`)

---

**Need help?** Check the Paddle Dashboard → Developer Tools → Logs for API errors.

