# ⚡ Quick Start: Paddle Setup (5 Minutes)

## TL;DR - Just Get It Working

### Step 1: Sign Up (2 minutes)
1. Go to [https://paddle.com](https://paddle.com)
2. Sign up (choose "SaaS")
3. Get approved (24-48 hours, or use test mode now)

### Step 2: Get Keys (1 minute)
1. Dashboard → **Developer Tools** → **API Keys**
2. Copy:
   - **Vendor ID** (number)
   - **Sandbox API Key** (`test_...`)
   - **Sandbox Public Key** (`pk_test_...`)

### Step 3: Create 6 Products (2 minutes)
1. **Catalog** → **Products** → **Create Product**
2. Create these 6 products:

| Product | Price | Billing | Price ID |
|---------|-------|---------|----------|
| Supporter Monthly | $2.99 | Monthly | `pri_...` |
| Supporter Yearly | $29.99 | Yearly | `pri_...` |
| Unlimited Monthly | $4.99 | Monthly | `pri_...` |
| Unlimited Yearly | $49.99 | Yearly | `pri_...` |
| Family Monthly | $9.99 | Monthly | `pri_...` |
| Family Yearly | $99.99 | Yearly | `pri_...` |

3. **Copy all 6 Price IDs!**

### Step 4: Set Up Webhook (1 minute)
1. **Developer Tools** → **Notifications** → **Add Notification**
2. **URL**: `https://your-app.vercel.app/api/paddle/webhook`
3. **Events**: Select all subscription events
4. **Copy Webhook Secret** (`whsec_...`)

### Step 5: Add to Vercel (1 minute)
Go to **Vercel** → **Settings** → **Environment Variables**

Add these **11 variables**:

```
VITE_PAYMENT_PROVIDER=paddle
PADDLE_VENDOR_ID=123456
PADDLE_API_KEY=test_...
PADDLE_PUBLIC_KEY=pk_test_...
PADDLE_WEBHOOK_SECRET=whsec_...
PADDLE_PRICE_SUPPORTER_MONTHLY=pri_...
PADDLE_PRICE_SUPPORTER_YEARLY=pri_...
PADDLE_PRICE_UNLIMITED_MONTHLY=pri_...
PADDLE_PRICE_UNLIMITED_YEARLY=pri_...
PADDLE_PRICE_FAMILY_MONTHLY=pri_...
PADDLE_PRICE_FAMILY_YEARLY=pri_...
```

### Step 6: Deploy
1. Push to GitHub
2. Vercel auto-deploys
3. **Done!** ✅

---

## Test It

1. Go to your app
2. Click "Upgrade Plan"
3. Select a plan
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. ✅ Should work!

---

## Go Live (When Ready)

1. Get **Live** keys from Paddle Dashboard
2. Update `PADDLE_API_KEY` and `PADDLE_PUBLIC_KEY` in Vercel
3. Add `PADDLE_ENV=production` in Vercel
4. Redeploy
5. **You're live!** 🎉

---

**Need detailed instructions?** See `COMPLETE_PADDLE_SETUP.md`
