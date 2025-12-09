# Ingredients Display Fix Guide

## Problem
Ingredients are not showing on recipe pages even though recipes have been edited via the Recipe Editor.

## Root Cause
The issue is likely one of these:
1. **Missing foreign key relationship** between `recipe_ingredients` and `ingredients` tables
2. **RLS (Row Level Security) policies** blocking the join query
3. **Missing `ingredients` table** or incorrect structure
4. **Join query failing silently** due to missing data

## Solution

### Step 1: Run the SQL Fix Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/fix-ingredients-display.sql`
4. Run the script

This script will:
- ✅ Check and create the `ingredients` table if missing
- ✅ Verify `recipe_ingredients` table structure
- ✅ Create foreign key relationship if missing
- ✅ Set up proper RLS policies for public read access
- ✅ Create indexes for performance
- ✅ Run diagnostic queries

### Step 2: Verify the Fix

After running the SQL script, check the diagnostic output:

1. **Foreign Key Check**: Should show `recipe_ingredients_ingredient_id_fkey`
2. **RLS Policies**: Should show policies allowing public SELECT
3. **Join Test**: Should return rows with ingredient names
4. **Counts**: Should show recipes with ingredients

### Step 3: Test in Browser

1. Open a recipe page that you've edited
2. Check browser console (F12) for any errors
3. Look for logs starting with `⚠️ [SUPABASE]` or `❌ [SUPABASE]`

### Step 4: Run Diagnostic Script

If ingredients still don't show, run:

```bash
node scripts/check-recipe-ingredients.js <recipe-id>
```

Replace `<recipe-id>` with an actual recipe ID from a recipe you've edited.

## Expected Database Structure

### `ingredients` table:
- `id` (UUID, primary key)
- `name` (TEXT, unique, not null)
- `default_unit` (TEXT, default 'g')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `recipe_ingredients` table:
- `id` (UUID, primary key)
- `recipe_id` (UUID, foreign key to recipes)
- `ingredient_id` (UUID, foreign key to ingredients) ⚠️ **CRITICAL**
- `quantity` (NUMERIC, not null, default 0)
- `unit` (TEXT, not null, default '')
- `preparation` (TEXT, not null, default '')
- `optional` (BOOLEAN)
- `order_index` (INTEGER)

### Foreign Key:
- `recipe_ingredients.ingredient_id` → `ingredients.id`

### RLS Policies:
- **ingredients**: Public SELECT allowed
- **recipe_ingredients**: Public SELECT allowed

## Common Issues

### Issue 1: Join Returns NULL
**Symptom**: `ingredient:ingredients(name, default_unit)` returns `null`

**Fix**: 
- Check if foreign key exists
- Verify `ingredient_id` values in `recipe_ingredients` match `id` values in `ingredients`
- Run: `SELECT * FROM recipe_ingredients ri LEFT JOIN ingredients i ON ri.ingredient_id = i.id WHERE i.id IS NULL;`

### Issue 2: RLS Blocking Query
**Symptom**: Query succeeds but returns empty array

**Fix**:
- Check RLS policies in Supabase Dashboard → Authentication → Policies
- Ensure policies allow `SELECT` for `anon` role
- Re-run the SQL fix script

### Issue 3: Missing Ingredients Table
**Symptom**: Query fails with "relation does not exist"

**Fix**:
- Run the SQL fix script (it creates the table)
- Or manually create the table using the structure above

## Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check if a specific recipe has ingredients
SELECT 
    r.id,
    r.title,
    COUNT(ri.id) as ingredient_count
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE r.id = 'YOUR_RECIPE_ID'
GROUP BY r.id, r.title;

-- Check if ingredients exist for those recipe_ingredients
SELECT 
    ri.recipe_id,
    ri.ingredient_id,
    i.name as ingredient_name,
    ri.quantity,
    ri.unit
FROM recipe_ingredients ri
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
WHERE ri.recipe_id = 'YOUR_RECIPE_ID';
```

## Next Steps

1. ✅ Run the SQL fix script
2. ✅ Verify database structure
3. ✅ Test a recipe page
4. ✅ Check browser console for errors
5. ✅ Run diagnostic script if needed

If issues persist, share:
- Output from the SQL diagnostic queries
- Browser console errors
- Output from `check-recipe-ingredients.js`

