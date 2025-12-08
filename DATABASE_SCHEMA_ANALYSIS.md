# Supabase Database Schema Analysis

## Recipes Table Structure

Based on code analysis, the `recipes` table has the following columns:

### Core Fields
- `id` - Primary key (UUID)
- `title` - Recipe title (text)
- `description` - Recipe description (text)
- `hero_image_url` - Image URL (text)
- `author` - Recipe author (text, defaults to 'Community')
- `source` - Source identifier (text, e.g., 'csv_import', 'supabase')
- `created_at` - Timestamp
- `updated_at` - Timestamp (if exists)

### Time Fields
- `prep_minutes` - Preparation time in minutes (integer)
- `cook_minutes` - Cooking time in minutes (integer)
- **Total time** = `prep_minutes + cook_minutes` (calculated client-side)

### Nutrition Fields
- `calories` - Total calories (integer/float)
- `has_complete_nutrition` - Boolean flag (CRITICAL: filters use this)
- Nutrition details are in separate `recipe_nutrition` table with columns:
  - `calories`, `protein`, `fat`, `carbs`, `fiber`, `sugar`, `sodium`, `cholesterol`
  - `saturated_fat`, `trans_fat`, `vitamin_a`, `vitamin_c`, `vitamin_d`
  - `potassium`, `calcium`, `iron`

### Filter Fields
- `difficulty` - Difficulty level (text)
  - **Expected values**: `'easy'`, `'medium'`, `'hard'` (lowercase)
  - **Fallback**: `'unknown'` if null
  - **Note**: Code does `.toLowerCase()` suggesting database might have mixed case
- `cuisine` - Array of cuisine types (array/text[])
  - Examples: `['American']`, `['Italian']`, `['Mexican']`
- `meal_types` - Array of meal types (array/text[])
  - Examples: `['breakfast']`, `['lunch']`, `['dinner']`
- `diets` - Array of diet types (array/text[])
  - Examples: `['vegan']`, `['vegetarian']`, `['keto']`, `['gluten free']`

### Serving Info
- `servings` - Number of servings (integer)

## Related Tables

### recipe_ingredients
- Links recipes to ingredients
- Columns: `id`, `recipe_id`, `ingredient_id`, `quantity`, `unit`, `preparation`, `optional`

### recipe_steps
- Recipe instructions
- Columns: `id`, `recipe_id`, `position`, `instruction`, `timer_seconds`

### recipe_nutrition
- Detailed nutrition information
- Columns: All nutrition fields listed above

### recipe_tags
- Recipe tags
- Columns: `recipe_id`, `tag`

### recipe_pairings
- Wine/beverage pairings
- Columns: `recipe_id`, `beverage_type`, `name`, `varietal`, `body`, `sweetness`, etc.

### health_badges
- Health score information
- Columns: `recipe_id`, `score`, `badge`, `color`

## Filter Implementation Details

### Current Filter Logic

1. **has_complete_nutrition**: 
   - ALWAYS filtered server-side first: `.eq('has_complete_nutrition', true)`
   - This is the primary filter - recipes without complete nutrition are excluded

2. **maxTime** (Total Time):
   - **Server-side**: REMOVED (was too restrictive)
   - **Client-side**: Filters by `prep_minutes + cook_minutes <= maxTime`
   - Applied after fetching recipes

3. **difficulty**:
   - **Server-side**: REMOVED (was case-sensitive)
   - **Client-side**: Case-insensitive matching
   - Normalizes both filter and recipe difficulty to lowercase before comparing

4. **diet**:
   - **Server-side**: Uses `.contains('diets', [diet.trim()])`
   - Matches if recipe's `diets` array contains the filter value

5. **mealType**:
   - **Server-side**: Uses `.contains('meal_types', [mealType.trim()])`
   - Matches if recipe's `meal_types` array contains the filter value

6. **cuisine**:
   - **Server-side**: Uses `.contains('cuisine', [cuisine.trim()])`
   - Matches if recipe's `cuisine` array contains the filter value

7. **maxCalories**:
   - **Client-side only**: Filters recipes after fetch
   - Checks `calories` field or nutrition data

8. **healthScore**:
   - **Client-side only**: Filters recipes after fetch
   - Checks `health_badges.score` field

9. **minProtein**:
   - **Client-side only**: Filters recipes after fetch
   - Checks nutrition data

10. **maxCarbs**:
    - **Client-side only**: Filters recipes after fetch
    - Checks nutrition data

11. **intolerances**:
    - **Client-side only**: Complex logic checking diets and ingredients

## Issues Found & Fixed

### ✅ Fixed Issues

1. **maxTime Filter Too Restrictive**
   - **Problem**: Server-side filter required BOTH `prep_minutes <= maxTime AND cook_minutes <= maxTime`
   - **Impact**: Excluded valid recipes where total time (prep + cook) <= maxTime but individual times were higher
   - **Fix**: Removed server-side filter, now filters entirely client-side by total time

2. **Difficulty Filter Case-Sensitive**
   - **Problem**: Server-side filter used `.eq('difficulty', difficulty.trim())` which is case-sensitive
   - **Impact**: If database has "Easy" but filter uses "easy", no match
   - **Fix**: Moved to client-side with case-insensitive matching

### ⚠️ Potential Issues to Verify

1. **Difficulty Values in Database**
   - Need to verify actual values stored in database
   - Code suggests lowercase (`'easy'`, `'medium'`, `'hard'`)
   - But RecipeCard does `.toLowerCase()` suggesting mixed case might exist
   - **Recommendation**: Query database to see actual values

2. **Array Field Matching**
   - `cuisine`, `meal_types`, `diets` use `.contains()` which should work
   - But need to verify exact format (case, spacing, etc.)

3. **Filter Preset Values**
   - Family-Friendly: `maxTime: '45', difficulty: 'easy'`
   - Quick & Healthy: `maxTime: '30', healthScore: '70'`
   - High Protein: `minProtein: '20'`
   - Low Carb: `diet: 'keto', maxCarbs: '20'`
   - **Need to verify**: Do recipes exist matching these criteria?

## Recommendations

1. **Query Database Directly** to verify:
   - Actual `difficulty` values (case, format)
   - Sample `cuisine`, `meal_types`, `diets` arrays
   - Distribution of `prep_minutes` and `cook_minutes`
   - How many recipes have `has_complete_nutrition: true`

2. **Test Filter Combinations**:
   - Test each preset filter individually
   - Test combinations of filters
   - Verify client-side filters work correctly

3. **Consider Database Constraints**:
   - Add CHECK constraint for `difficulty` values
   - Normalize `difficulty` to lowercase in database
   - Add indexes for common filter combinations

4. **Improve Filter Logic**:
   - Consider using database functions for total time calculation
   - Use case-insensitive text search for difficulty if possible
   - Add better error handling for missing data

## Next Steps

1. Create a diagnostic query to inspect actual database values
2. Test filters with real data
3. Adjust filter presets based on actual data distribution
4. Consider database-level optimizations

