-- Fix Ingredients Display Issue
-- This script checks and fixes the database structure for ingredients

-- Step 1: Check if ingredients table exists and has the right structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ingredients'
ORDER BY ordinal_position;

-- Step 2: Check if recipe_ingredients table exists and has foreign key
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recipe_ingredients'
ORDER BY ordinal_position;

-- Step 3: Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'recipe_ingredients' OR tc.table_name = 'ingredients');

-- Step 4: Create ingredients table if it doesn't exist
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    default_unit TEXT DEFAULT 'g',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Ensure recipe_ingredients table has correct structure
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add order_index if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN order_index INTEGER;
    END IF;
    
    -- Ensure quantity is numeric (not null with default 0)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' 
        AND column_name = 'quantity' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE recipe_ingredients ALTER COLUMN quantity SET DEFAULT 0;
        UPDATE recipe_ingredients SET quantity = 0 WHERE quantity IS NULL;
        ALTER TABLE recipe_ingredients ALTER COLUMN quantity SET NOT NULL;
    END IF;
    
    -- Ensure unit is text (not null with default '')
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' 
        AND column_name = 'unit' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE recipe_ingredients ALTER COLUMN unit SET DEFAULT '';
        UPDATE recipe_ingredients SET unit = '' WHERE unit IS NULL;
        ALTER TABLE recipe_ingredients ALTER COLUMN unit SET NOT NULL;
    END IF;
    
    -- Ensure preparation is text (not null with default '')
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' 
        AND column_name = 'preparation' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE recipe_ingredients ALTER COLUMN preparation SET DEFAULT '';
        UPDATE recipe_ingredients SET preparation = '' WHERE preparation IS NULL;
        ALTER TABLE recipe_ingredients ALTER COLUMN preparation SET NOT NULL;
    END IF;
END $$;

-- Step 6: Create foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recipe_ingredients_ingredient_id_fkey'
        AND table_name = 'recipe_ingredients'
    ) THEN
        ALTER TABLE recipe_ingredients
        ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- Step 8: Check RLS policies - they should allow reading
-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('ingredients', 'recipe_ingredients');

-- Step 9: Create/update RLS policies to allow reading
-- Enable RLS if not enabled
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can read ingredients" ON ingredients;
DROP POLICY IF EXISTS "Anyone can read recipe_ingredients" ON recipe_ingredients;

-- Create policies that allow public read access
CREATE POLICY "Anyone can read ingredients"
ON ingredients FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can read recipe_ingredients"
ON recipe_ingredients FOR SELECT
TO public
USING (true);

-- Step 10: Diagnostic query - check if join works
SELECT 
    ri.id,
    ri.recipe_id,
    ri.ingredient_id,
    ri.quantity,
    ri.unit,
    ri.preparation,
    i.id as ingredient_table_id,
    i.name as ingredient_name,
    i.default_unit
FROM recipe_ingredients ri
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
LIMIT 10;

-- Step 11: Count recipes with ingredients
SELECT 
    COUNT(DISTINCT recipe_id) as recipes_with_ingredients,
    COUNT(*) as total_ingredient_links
FROM recipe_ingredients;

-- Step 12: Count ingredients in ingredients table
SELECT COUNT(*) as total_ingredients FROM ingredients;

