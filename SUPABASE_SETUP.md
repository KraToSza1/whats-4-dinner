# Supabase Database Setup for Shareable Recipes & Free Trial

## 📋 Required Database Changes

### Step 1: Update `profiles` Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add trial fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended BOOLEAN DEFAULT FALSE;

-- Create index for faster trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_start_date 
ON profiles(trial_start_date) 
WHERE trial_start_date IS NOT NULL;
```

### Step 2: Create `recipe_shares` Table (Optional - for analytics)

```sql
-- Table to track recipe shares
CREATE TABLE IF NOT EXISTS recipe_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  share_method TEXT, -- 'copy', 'native', 'whatsapp', 'facebook', etc.
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_shares_recipe_id ON recipe_shares(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_user_id ON recipe_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_shared_at ON recipe_shares(shared_at);
```

### Step 3: Create `share_views` Table (Optional - for detailed analytics)

```sql
-- Table to track individual share link views
CREATE TABLE IF NOT EXISTS share_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES recipe_shares(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_views_share_id ON share_views(share_id);
CREATE INDEX IF NOT EXISTS idx_share_views_recipe_id ON share_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_share_views_viewed_at ON share_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_share_views_converted ON share_views(converted);
```

### Step 4: Set Row Level Security (RLS) Policies

```sql
-- Enable RLS on recipe_shares
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own shares
CREATE POLICY "Users can insert their own shares"
ON recipe_shares FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = shared_by_user_id);

-- Policy: Anyone can read shares (for analytics)
CREATE POLICY "Anyone can read shares"
ON recipe_shares FOR SELECT
TO authenticated
USING (true);

-- Policy: Public can read shares (for shared recipe pages)
CREATE POLICY "Public can read shares"
ON recipe_shares FOR SELECT
TO anon
USING (true);

-- Enable RLS on share_views
ALTER TABLE share_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views (for tracking)
CREATE POLICY "Anyone can insert views"
ON share_views FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Authenticated users can read their own conversions
CREATE POLICY "Users can read their conversions"
ON share_views FOR SELECT
TO authenticated
USING (auth.uid() = converted_user_id);
```

## ✅ Verification

After running the SQL:

1. **Check profiles table:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('trial_start_date', 'trial_ended');
   ```

2. **Test trial start:**
   - Sign up a new user
   - Check that `trial_start_date` is set in their profile
   - Verify `trial_ended` is `false`

3. **Test share tracking:**
   - Share a recipe
   - Check `recipe_shares` table for the entry

## 🎯 Next Steps

1. ✅ Run the SQL above in Supabase
2. ✅ Test signup to verify trial starts automatically
3. ✅ Test sharing a recipe
4. ✅ Test viewing a shared recipe (no login required)
5. ✅ Verify trial features are accessible

## 📝 Notes

- **Trial Duration:** 30 days (configurable in `src/utils/trial.js`)
- **Trial Features:** All premium features unlocked during trial
- **After Trial:** Users revert to their actual plan (usually 'free')
- **Share Links:** Format is `/recipe/shared/:recipeId` (public, no login)

