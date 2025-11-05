# API Quota Solution Guide

## Current Status
Your Spoonacular API quota has been reached. The app now automatically falls back to mock data for testing.

## Immediate Solutions

### 1. **Use Mock Data (Already Implemented)**
The app now automatically uses mock data when the API quota is reached. You can continue testing all features:
- Collections ✅
- Notes ✅  
- Recipe viewing ✅
- All other features ✅

### 2. **Force Mock Mode**
To always use mock data (even if API works), add this to your browser console:
```javascript
localStorage.setItem("forceMockMode", "true");
```
Then refresh the page. To disable:
```javascript
localStorage.removeItem("forceMockMode");
```

### 3. **Use Cached Recipes**
The app caches all recipes you've viewed in localStorage. If you've viewed a recipe before, it will load from cache even without API access.

## Long-Term Solutions

### Option 1: Upgrade Spoonacular Plan
- Free tier: 150 requests/day
- Paid plans: $10-99/month for more requests
- Visit: https://spoonacular.com/food-api/pricing

### Option 2: Build Your Own Database (Recommended for Production)

#### Why Build Your Own?
✅ Full control over data
✅ No API costs
✅ No rate limits
✅ Customize recipes to your needs
✅ Better performance

#### What You'll Need:

1. **Database (Choose one):**
   - **Supabase** (already using for auth) - Free tier includes PostgreSQL
   - **Firebase Firestore** - Free tier, easy setup
   - **MongoDB Atlas** - Free tier available
   - **PlanetScale** - Free MySQL tier

2. **Recipe Data Sources:**
   - **Open Recipes Database** - Free, open-source recipe data
   - **Recipe Puppy API** - Free alternative
   - **Custom scraping** - From popular recipe sites (with permission)
   - **Manual entry** - Start with popular recipes

3. **Image Storage:**
   - **Cloudinary** - Free tier, excellent image optimization
   - **Supabase Storage** - Already using, free tier
   - **AWS S3** - Pay-as-you-go
   - **Unsplash API** - Free food images

#### Implementation Steps:

1. **Create Recipe Schema:**
```sql
-- Example for Supabase PostgreSQL
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty VARCHAR(50),
  cuisine VARCHAR(100),
  dish_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2),
  unit VARCHAR(50),
  original_text TEXT,
  order_index INTEGER
);

CREATE TABLE instructions (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id),
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  order_index INTEGER
);

CREATE TABLE nutrition (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id),
  calories INTEGER,
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sugar DECIMAL(10,2)
);
```

2. **Migrate Existing Data:**
- Export recipes from localStorage
- Bulk import into database
- Link images to recipe IDs

3. **Update API Functions:**
- Replace `spoonacular.js` calls with database queries
- Use Supabase client for queries
- Keep same interface for compatibility

4. **Add Recipe Management:**
- Admin panel to add/edit recipes
- User-submitted recipes
- Recipe moderation

### Option 3: Hybrid Approach
- Use your database for core recipes
- Use Spoonacular API for:
  - Search suggestions
  - Similar recipes
  - New/trending recipes
- Reduces API usage by 80%+

## Quick Fix for Testing Right Now

The app is already set up to use mock data when quota is reached. Just refresh and continue testing! All features work with mock data.

## Next Steps

1. **Short-term:** Continue development with mock data
2. **Medium-term:** Set up Supabase database schema
3. **Long-term:** Migrate to your own database

Would you like me to help you set up the database schema or migration script?

