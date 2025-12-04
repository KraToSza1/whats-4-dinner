# Implementation Guide: Shareable Recipes + Free Trial System

## 📋 Overview

This guide covers implementing:
1. **Option A: Shareable Recipe Links** - Users can share recipes with anyone
2. **Free Trial System** - New users get 30 days of premium features

---

## 🎯 Part 1: Shareable Recipe Links

### Step 1: Update ShareButton Component
- Modify `ShareButton.jsx` to generate shareable URLs
- Format: `/recipe/shared/:recipeId` (public, no login required)
- Track share events for analytics

### Step 2: Create Public Recipe View Page
- New route: `/recipe/shared/:id`
- Component: `SharedRecipePage.jsx`
- Features:
  - Full recipe view (no login required)
  - Sign-up prompts for non-users
  - "Try What's 4 Dinner" CTAs
  - Related recipes preview
  - Share counter

### Step 3: Add Share Tracking
- Track when recipes are shared
- Track when shared links are viewed
- Track conversions (sign-ups from shared links)
- Store in Supabase `recipe_shares` table

### Step 4: Add Sign-up Prompts
- Banner: "Sign up to save this recipe"
- Button: "Create account to plan meals"
- Modal: "Join What's 4 Dinner" with benefits

---

## 🎯 Part 2: Free Trial System

### Step 1: Database Schema Update
**Supabase `profiles` table:**
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended BOOLEAN DEFAULT FALSE;
```

### Step 2: Create Trial Utility Functions
**File: `src/utils/trial.js`**
- `isTrialActive(userId)` - Check if user's trial is still active
- `getTrialDaysRemaining(userId)` - Get days left in trial
- `startTrial(userId)` - Set trial_start_date on signup
- `getEffectivePlan(userId)` - Returns 'trial' if active, otherwise actual plan

### Step 3: Modify Subscription System
**File: `src/utils/subscription.js`**
- Update `getCurrentPlan()` to check trial status first
- If trial active, return premium plan features
- Update `hasFeature()` to allow features during trial
- Update `canPerformAction()` to allow actions during trial

### Step 4: Update AuthContext
**File: `src/context/AuthContext.jsx`**
- On user signup, automatically set `trial_start_date`
- Create/update profile with trial_start_date = NOW()

### Step 5: Add Trial UI Components
- Trial countdown banner
- Trial status in Profile page
- Upgrade prompts when trial expires
- "X days left in your free trial" notifications

### Step 6: Handle Trial Expiration
- Check trial status on app load
- Show upgrade modal when trial expires
- Restrict features to free plan after trial ends

---

## 📊 Database Tables Needed

### 1. Recipe Shares Table
```sql
CREATE TABLE IF NOT EXISTS recipe_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id),
  shared_by_user_id UUID REFERENCES auth.users(id),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  share_token TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Share Views Table (for analytics)
```sql
CREATE TABLE IF NOT EXISTS share_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES recipe_shares(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id)
);
```

---

## 🔧 Implementation Order

### Phase 1: Shareable Links (Quick Win)
1. ✅ Update ShareButton to generate shareable URLs
2. ✅ Create SharedRecipePage component
3. ✅ Add route in App.jsx
4. ✅ Add share tracking (basic)

### Phase 2: Free Trial System
1. ✅ Update Supabase schema (add trial fields)
2. ✅ Create trial utility functions
3. ✅ Modify subscription.js to check trial
4. ✅ Update AuthContext to start trial on signup
5. ✅ Add trial UI components

### Phase 3: Analytics & Polish
1. ✅ Add share analytics dashboard
2. ✅ Add conversion tracking
3. ✅ Add referral attribution
4. ✅ Polish UI/UX

---

## 🎨 UI/UX Considerations

### Shared Recipe Page
- Clean, modern design
- Prominent sign-up CTAs
- Show recipe quality (ratings, views)
- Related recipes to keep users engaged
- "Join to save this recipe" messaging

### Trial System
- Clear countdown timer
- Feature highlights during trial
- Upgrade prompts (not annoying)
- Show what they'll lose after trial
- Easy upgrade path

---

## 📈 Analytics to Track

1. **Shares:**
   - Total shares per recipe
   - Shares per user
   - Share method (link, social, etc.)

2. **Views:**
   - Shared link views
   - Unique viewers
   - View-to-signup conversion rate

3. **Conversions:**
   - Sign-ups from shared links
   - Trial starts from shares
   - Paid conversions from shares

4. **Trial:**
   - Trial start rate
   - Trial-to-paid conversion rate
   - Feature usage during trial
   - Churn after trial ends

---

## 🚀 Next Steps

1. Review this guide
2. Start with Phase 1 (Shareable Links)
3. Then implement Phase 2 (Free Trial)
4. Finally add analytics (Phase 3)

Let's start implementing! 🎉

