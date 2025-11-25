# Paddle Setup - Localhost Issue Solution

## Problem
Paddle requires a **public website URL** (not localhost) during signup. This is a common requirement for payment processors.

## ✅ Solution Options (Choose One)

### Option 1: Deploy to Vercel (RECOMMENDED - 5 minutes)
This gives you a real public URL that you can use immediately:

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin master
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login
   - Click "Add New Project"
   - Import your GitHub repo
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

3. **Get your URL**:
   - After deployment (2-3 minutes), you'll get a URL like: `https://whats-4-dinner-xyz.vercel.app`
   - Use this URL in Paddle signup: `https://whats-4-dinner-xyz.vercel.app` (no trailing slash)

4. **Complete Paddle signup** with the Vercel URL

5. **Update later**: You can change the domain in Paddle settings once you have a custom domain

### Option 2: Use ngrok (Quick Testing - 2 minutes)
For immediate testing without deploying:

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   # OR download from https://ngrok.com/download
   ```

2. **Start your dev server**:
   ```bash
   npm run dev
   ```

3. **In another terminal, expose localhost**:
   ```bash
   ngrok http 5173
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)
   - Use this in Paddle signup
   - ⚠️ **Note**: ngrok URLs change each time (unless you pay), so this is only for testing

### Option 3: Use a Placeholder Domain (Not Recommended)
Some users report success with:
- `https://example.com` (then update later)
- `https://your-app-name.vercel.app` (even if not deployed yet)

**However**, Paddle may verify the domain, so this might not work.

## 🎯 Recommended Workflow

1. **Deploy to Vercel** (5 min) → Get public URL
2. **Complete Paddle signup** with Vercel URL
3. **Test payments** in Paddle sandbox
4. **Add custom domain later** (optional)

## After Paddle Signup

Once you have Paddle credentials, add them to Vercel:

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add these variables:
   ```
   PADDLE_VENDOR_ID=your_vendor_id
   PADDLE_API_KEY=your_api_key
   PADDLE_ENV=sandbox
   PADDLE_PRICE_SUPPORTER_MONTHLY=price_xxx
   PADDLE_PRICE_SUPPORTER_YEARLY=price_xxx
   PADDLE_PRICE_UNLIMITED_MONTHLY=price_xxx
   PADDLE_PRICE_UNLIMITED_YEARLY=price_xxx
   PADDLE_PRICE_FAMILY_MONTHLY=price_xxx
   PADDLE_PRICE_FAMILY_YEARLY=price_xxx
   ```

3. Redeploy your Vercel project to apply env vars

## Need Help?

- **Vercel deployment issues?** Check [README.md](./README.md)
- **Paddle API docs**: https://developer.paddle.com/
- **Paddle sandbox**: https://sandbox-vendors.paddle.com/

