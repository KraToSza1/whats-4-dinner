# Production Readiness Checklist

## 🎯 Quick Validation

Run the comprehensive production readiness check:
```bash
npm run validate:production
```

This checks **EVERYTHING**:
- ✅ Environment variables (Supabase, Paddle, Stripe, Paystack)
- ✅ Supabase connectivity and configuration
- ✅ Payment provider APIs (checkout, webhooks)
- ✅ Recipe search and display functionality
- ✅ All UI components and buttons
- ✅ Error handling
- ✅ Security headers and CORS
- ✅ Deployment configuration
- ✅ API routes
- ✅ Feature completeness

## 📋 Manual Production Checklist

### 1. Environment Variables (CRITICAL)

#### Supabase (Required)
- [ ] `VITE_SUPABASE_URL` - Set in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` - Set in Vercel (NOT service_role!)
- [ ] Verify keys are correct (check Supabase dashboard)

#### Payment Provider (Choose One)

**Paddle (Recommended)**
- [ ] `VITE_PADDLE_PUBLIC_TOKEN` - Set in Vercel
- [ ] `PADDLE_VENDOR_ID` - Set in Vercel
- [ ] `PADDLE_API_KEY` - Set in Vercel
- [ ] `VITE_PAYMENT_PROVIDER=paddle` - Set in Vercel

**OR Stripe**
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Set in Vercel
- [ ] `STRIPE_SECRET_KEY` - Set in Vercel
- [ ] `VITE_PAYMENT_PROVIDER=stripe` - Set in Vercel

**OR Paystack**
- [ ] `PAYSTACK_SECRET_KEY` - Set in Vercel
- [ ] `VITE_PAYMENT_PROVIDER=paystack` - Set in Vercel

### 2. Supabase Configuration

- [ ] Database is accessible
- [ ] Recipes table exists and has data
- [ ] Users table configured
- [ ] RLS (Row Level Security) policies set up
- [ ] Storage bucket for images configured
- [ ] Auth providers configured (Email, Google, etc.)

### 3. Payment Provider Setup

#### Paddle
- [ ] Paddle account created
- [ ] Products/plans created in Paddle dashboard
- [ ] Webhook URL configured: `https://yourdomain.com/api/paddle/webhook`
- [ ] Webhook signature verification enabled
- [ ] Test mode vs Production mode verified

#### Stripe
- [ ] Stripe account created
- [ ] Products/prices created in Stripe dashboard
- [ ] Webhook URL configured: `https://yourdomain.com/api/stripe/webhook`
- [ ] Webhook events subscribed (checkout.session.completed, etc.)

#### Paystack
- [ ] Paystack account created
- [ ] Plans created in Paystack dashboard
- [ ] Webhook URL configured

### 4. API Routes (Vercel Serverless Functions)

- [ ] `/api/health` - Health check endpoint works
- [ ] `/api/paddle/create-checkout` - Checkout creation works
- [ ] `/api/paddle/webhook` - Webhook receives events
- [ ] `/api/paddle/update-plan` - Plan updates work
- [ ] Payment provider routes tested

### 5. Recipe Functionality

- [ ] Recipe search works
- [ ] Filters apply correctly
- [ ] Medical conditions filter recipes
- [ ] Recipe details page loads
- [ ] Recipe images display
- [ ] Nutrition data shows correctly
- [ ] Ingredients list displays
- [ ] Instructions display

### 6. Core Features

- [ ] User authentication (Email, Google OAuth)
- [ ] Favorites save and persist
- [ ] Grocery list works
- [ ] Meal planner works
- [ ] Collections work
- [ ] Profile page works
- [ ] Family plan works
- [ ] Analytics work (if enabled)

### 7. UI Components

- [ ] Header displays correctly
- [ ] Search form works
- [ ] Filters UI works
- [ ] Recipe cards display correctly
- [ ] Pagination works
- [ ] Buttons are clickable
- [ ] Modals open/close correctly
- [ ] Toast notifications work
- [ ] Loading states display
- [ ] Error messages display

### 8. Error Handling

- [ ] ErrorBoundary catches React errors
- [ ] API errors handled gracefully
- [ ] Network errors show user-friendly messages
- [ ] Missing data handled gracefully
- [ ] Invalid input validated

### 9. Security

- [ ] Security headers configured (vercel.json)
- [ ] CORS configured correctly
- [ ] Service role key NOT exposed in client
- [ ] Environment variables NOT committed to git
- [ ] `.env` files in `.gitignore`
- [ ] API routes validate input
- [ ] Webhook signatures verified

### 10. Performance

- [ ] Images optimized
- [ ] Code split/bundled correctly
- [ ] Lazy loading implemented
- [ ] Caching configured
- [ ] No console errors in production
- [ ] Page load time acceptable

### 11. Deployment (Vercel)

- [ ] `vercel.json` configured
- [ ] Build command works: `npm run build`
- [ ] Environment variables set in Vercel dashboard
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Deployment successful
- [ ] Production URL accessible

### 12. Testing

- [ ] Test payment flow (use test mode)
- [ ] Test recipe search
- [ ] Test user signup/login
- [ ] Test favorites
- [ ] Test grocery list
- [ ] Test meal planner
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Test error scenarios

## 🚨 Critical Issues to Fix Before Production

1. **Missing Environment Variables** - App won't work without them
2. **Service Role Key in Client** - Security risk
3. **Missing Webhook Verification** - Payment fraud risk
4. **No Error Handling** - App crashes on errors
5. **Missing Security Headers** - Vulnerable to attacks
6. **Environment Files in Git** - Security risk

## ✅ Pre-Deployment Steps

1. **Run Validation**
   ```bash
   npm run validate:production
   ```

2. **Fix All Critical Issues**
   - Address any critical failures
   - Fix security issues
   - Add missing environment variables

3. **Test Locally**
   ```bash
   npm run build
   npm run preview
   ```

4. **Set Environment Variables in Vercel**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables
   - Redeploy

5. **Deploy to Production**
   ```bash
   git push origin main
   # Or deploy via Vercel dashboard
   ```

6. **Verify Deployment**
   - Check production URL
   - Test critical flows
   - Monitor for errors

## 📊 Production Readiness Score

After running `npm run validate:production`, you'll get:
- **100% Pass Rate** = Ready for production ✅
- **< 100% Pass Rate with Critical Issues** = NOT ready ❌
- **< 100% Pass Rate with Warnings Only** = Ready with caution ⚠️

## 🔍 Post-Deployment Monitoring

After deploying, monitor:
- [ ] Error logs (Vercel dashboard)
- [ ] Payment webhooks (check Paddle/Stripe/Paystack dashboard)
- [ ] User signups
- [ ] API response times
- [ ] Error rates
- [ ] User feedback

## 🆘 Troubleshooting

### Payment Not Working
- Check environment variables are set in Vercel
- Verify webhook URL is correct
- Check payment provider dashboard for errors
- Test with test mode first

### Supabase Errors
- Verify Supabase URL and key are correct
- Check RLS policies
- Verify database tables exist
- Check Supabase dashboard for errors

### Build Fails
- Check `package.json` has build script
- Verify all dependencies installed
- Check for TypeScript/ESLint errors
- Review build logs in Vercel

### Features Not Working
- Check browser console for errors
- Verify API routes are deployed
- Check network tab for failed requests
- Verify environment variables are set

## 📚 Related Documentation

- `INTEGRATION_TESTING_GUIDE.md` - Detailed integration testing
- `FEATURE_DEPENDENCY_MAP.md` - Feature architecture
- `QUICK_INTEGRATION_CHECK.md` - Quick reference

## 🎉 You're Ready When:

- ✅ All critical checks pass
- ✅ All environment variables set
- ✅ Payment provider configured
- ✅ Supabase connected
- ✅ All features tested
- ✅ Security checks pass
- ✅ Build succeeds
- ✅ Deployment successful

**Run `npm run validate:production` to verify everything!**

