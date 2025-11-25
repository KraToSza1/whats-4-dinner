# 🚀 Complete Paddle Setup Guide - Get Payments Working!

## ✅ Step 1: Get Your Paddle Credentials

From your Paddle sandbox dashboard:

1. **Vendor ID**: 
   - Go to **Developer Tools → Authentication**
   - Copy your **Vendor ID** (looks like: `111111`)

2. **API Key**:
   - Go to **Developer Tools → Authentication**
   - Click **"Create API Key"** or copy existing one
   - Copy the **API Key** (starts with `test_` for sandbox)

## ✅ Step 2: Create Products & Prices in Paddle

You need to create products for your subscription plans:

### In Paddle Dashboard:
1. Go to **Catalog → Products**
2. Click **"Create Product"**

Create these 3 products:

#### Product 1: Supporter Plan
- **Name**: "Supporter Plan"
- **Type**: Subscription
- **Billing Period**: Monthly
- **Price**: Set your price (e.g., $5/month)
- **Copy the Price ID** (looks like `pri_01xxxxx`)

#### Product 2: Unlimited Plan  
- **Name**: "Unlimited Plan"
- **Type**: Subscription
- **Billing Period**: Monthly
- **Price**: Set your price (e.g., $10/month)
- **Copy the Price ID**

#### Product 3: Family Plan
- **Name**: "Family Plan"
- **Type**: Subscription
- **Billing Period**: Monthly
- **Price**: Set your price (e.g., $15/month)
- **Copy the Price ID**

**Repeat for Yearly plans** (create 3 more products with yearly billing)

## ✅ Step 3: Add Environment Variables to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add these variables:

```
PADDLE_VENDOR_ID=your_vendor_id_here
PADDLE_API_KEY=test_your_api_key_here
PADDLE_ENV=sandbox
PADDLE_PRICE_SUPPORTER_MONTHLY=pri_01xxxxx
PADDLE_PRICE_SUPPORTER_YEARLY=pri_01xxxxx
PADDLE_PRICE_UNLIMITED_MONTHLY=pri_01xxxxx
PADDLE_PRICE_UNLIMITED_YEARLY=pri_01xxxxx
PADDLE_PRICE_FAMILY_MONTHLY=pri_01xxxxx
PADDLE_PRICE_FAMILY_YEARLY=pri_01xxxxx
```

3. **Redeploy** your project (click "Redeploy" button)

## ✅ Step 4: Add Paddle Script to Your App

The Paddle checkout script needs to be loaded. Check if it's in your `index.html`:

```html
<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
```

If not, we'll add it.

## ✅ Step 5: Test the Payment Flow

1. Visit your Vercel URL
2. Try to subscribe to a plan
3. Use Paddle's test card: `4242 4242 4242 4242`
4. Any future expiry date
5. Any CVV

## ✅ Step 6: Set Up Webhooks (Important!)

1. In Paddle Dashboard → **Developer Tools → Notifications**
2. Add webhook URL: `https://your-vercel-url.vercel.app/api/paddle/webhook`
3. Select events:
   - `transaction.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`

## 🎉 You're Done!

Once all this is set up, payments will work! Let me know which step you're on and I'll help you through it.

