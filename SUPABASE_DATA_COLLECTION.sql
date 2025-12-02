-- Comprehensive Supabase Data Collection Schema
-- Run this in Supabase SQL Editor to track all important user data

-- ============================================
-- 1. USER ACTIVITY TRACKING
-- ============================================

-- Recipe views/interactions
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'recipe_view', 'recipe_favorite', 'recipe_rate', 'recipe_share', 'meal_planned', 'grocery_added', 'search_performed'
  recipe_id uuid, -- References recipes table if applicable
  metadata jsonb, -- Additional data (rating, search query, etc.)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_recipe_id ON public.user_activity(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity
DROP POLICY IF EXISTS "Users can read own activity" ON public.user_activity;
CREATE POLICY "Users can read own activity"
  ON public.user_activity
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;
CREATE POLICY "Users can insert own activity"
  ON public.user_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. RECIPE RATINGS & PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS public.recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON public.recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);

ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can read own ratings"
  ON public.recipe_ratings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can insert own ratings"
  ON public.recipe_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can update own ratings"
  ON public.recipe_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. MEAL PLANNING DATA
-- ============================================

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  plan_data jsonb NOT NULL, -- Full meal plan structure
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON public.meal_plans(week_start_date);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own meal plans" ON public.meal_plans;
CREATE POLICY "Users can read own meal plans"
  ON public.meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meal plans" ON public.meal_plans;
CREATE POLICY "Users can insert own meal plans"
  ON public.meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meal plans" ON public.meal_plans;
CREATE POLICY "Users can update own meal plans"
  ON public.meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. GROCERY LISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  list_name text DEFAULT 'My Grocery List',
  items jsonb NOT NULL, -- Array of grocery items
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON public.grocery_lists(user_id);

ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own grocery lists" ON public.grocery_lists;
CREATE POLICY "Users can read own grocery lists"
  ON public.grocery_lists
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own grocery lists" ON public.grocery_lists;
CREATE POLICY "Users can insert own grocery lists"
  ON public.grocery_lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own grocery lists" ON public.grocery_lists;
CREATE POLICY "Users can update own grocery lists"
  ON public.grocery_lists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own grocery lists" ON public.grocery_lists;
CREATE POLICY "Users can delete own grocery lists"
  ON public.grocery_lists
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. FAVORITES
-- ============================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON public.favorites(recipe_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON public.favorites;
CREATE POLICY "Users can read own favorites"
  ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. USER PREFERENCES & SETTINGS
-- ============================================

-- Extend profiles table with additional preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dietary_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS medical_conditions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unit_system text DEFAULT 'metric',
ADD COLUMN IF NOT EXISTS currency text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}';

-- ============================================
-- 7. ANALYTICS AGGREGATES (for faster queries)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_recipe_views integer DEFAULT 0,
  total_favorites integer DEFAULT 0,
  total_ratings integer DEFAULT 0,
  total_searches integer DEFAULT 0,
  total_meals_planned integer DEFAULT 0,
  favorite_cuisines jsonb DEFAULT '[]',
  favorite_meal_types jsonb DEFAULT '[]',
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own analytics" ON public.user_analytics;
CREATE POLICY "Users can read own analytics"
  ON public.user_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analytics" ON public.user_analytics;
CREATE POLICY "Users can update own analytics"
  ON public.user_analytics
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. FUNCTIONS FOR AUTO-UPDATING ANALYTICS
-- ============================================

-- Function to update analytics when activity is logged
CREATE OR REPLACE FUNCTION public.update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_analytics (user_id, total_recipe_views, last_active_at, updated_at)
  VALUES (NEW.user_id, 1, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_recipe_views = CASE 
      WHEN NEW.activity_type = 'recipe_view' THEN user_analytics.total_recipe_views + 1
      ELSE user_analytics.total_recipe_views
    END,
    total_favorites = CASE 
      WHEN NEW.activity_type = 'recipe_favorite' THEN user_analytics.total_favorites + 1
      ELSE user_analytics.total_favorites
    END,
    total_searches = CASE 
      WHEN NEW.activity_type = 'search_performed' THEN user_analytics.total_searches + 1
      ELSE user_analytics.total_searches
    END,
    last_active_at = now(),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update analytics
DROP TRIGGER IF EXISTS trigger_update_analytics ON public.user_activity;
CREATE TRIGGER trigger_update_analytics
  AFTER INSERT ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_analytics();

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

