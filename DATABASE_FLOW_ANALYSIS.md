# Complete Database Flow Analysis

## Overview
This document explains the complete data flow from Recipe Editor → Database → Recipe Page display.

## Database Tables Structure

### 1. `recipes` (Main Table)
**Purpose**: Stores recipe metadata

**Key Columns**:
- `id` (UUID, Primary Key)
- `title` (TEXT)
- `description` (TEXT)
- `hero_image_url` (TEXT)
- `prep_minutes` (INTEGER)
- `cook_minutes` (INTEGER)
- `servings` (NUMERIC)
- `difficulty` (TEXT)
- `cuisine` (TEXT[] - Array)
- `meal_types` (TEXT[] - Array)
- `diets` (TEXT[] - Array)
- `author` (TEXT)
- `source` (TEXT) - **CRITICAL**: 'recipe_editor', 'csv_import', etc.
- `calories` (NUMERIC)
- `has_complete_nutrition` (BOOLEAN) - **CRITICAL**: Filters use this
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2. `ingredients` (Master Ingredients Table)
**Purpose**: Master list of all ingredients

**Key Columns**:
- `id` (UUID, Primary Key)
- `name` (TEXT, UNIQUE, NOT NULL)
- `default_unit` (TEXT, DEFAULT 'g')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**CRITICAL**: This table must exist for the join to work!

### 3. `recipe_ingredients` (Junction Table)
**Purpose**: Links recipes to ingredients with quantities

**Key Columns**:
- `id` (UUID, Primary Key)
- `recipe_id` (UUID, Foreign Key → recipes.id)
- `ingredient_id` (UUID, Foreign Key → ingredients.id) **CRITICAL**
- `quantity` (NUMERIC, NOT NULL, DEFAULT 0)
- `unit` (TEXT, NOT NULL, DEFAULT '')
- `preparation` (TEXT, NOT NULL, DEFAULT '')
- `optional` (BOOLEAN)
- `order_index` (INTEGER)

**CRITICAL**: Foreign key relationship must exist: `recipe_ingredients.ingredient_id → ingredients.id`

### 4. `recipe_steps` (Instructions)
**Purpose**: Recipe instructions/steps

**Key Columns**:
- `id` (UUID, Primary Key)
- `recipe_id` (UUID, Foreign Key → recipes.id)
- `position` (INTEGER) - Order of steps
- `instruction` (TEXT)
- `timer_seconds` (INTEGER)

### 5. `recipe_nutrition` (Detailed Nutrition)
**Purpose**: Detailed nutrition information

**Key Columns**:
- `recipe_id` (UUID, Primary Key, Foreign Key → recipes.id)
- `calories` (INTEGER, NOT NULL, DEFAULT 0)
- `protein` (INTEGER, NOT NULL, DEFAULT 0)
- `fat` (INTEGER, NOT NULL, DEFAULT 0)
- `carbs` (INTEGER, NOT NULL, DEFAULT 0)
- `fiber` (INTEGER, NOT NULL, DEFAULT 0)
- `sugar` (INTEGER, NOT NULL, DEFAULT 0)
- `sodium` (INTEGER, NOT NULL, DEFAULT 0)
- `cholesterol` (INTEGER, NOT NULL, DEFAULT 0)
- `saturated_fat` (INTEGER, NOT NULL, DEFAULT 0)
- `trans_fat` (INTEGER, NOT NULL, DEFAULT 0)
- `vitamin_a` (INTEGER, NOT NULL, DEFAULT 0)
- `vitamin_c` (INTEGER, NOT NULL, DEFAULT 0)
- `vitamin_d` (INTEGER, NOT NULL, DEFAULT 0)
- `potassium` (INTEGER, NOT NULL, DEFAULT 0)
- `calcium` (INTEGER, NOT NULL, DEFAULT 0)
- `iron` (INTEGER, NOT NULL, DEFAULT 0)

## Data Flow: Recipe Editor → Database

### Step 1: User Edits Recipe in Recipe Editor
Location: `src/components/RecipeEditor.jsx`

User enters:
- Title, description, image
- Ingredients (name, quantity, unit, preparation)
- Steps (instructions)
- Nutrition data
- Metadata (prep time, cook time, servings, etc.)

### Step 2: Save Ingredients
Location: `src/api/recipeEditor.js` → `updateRecipeIngredients()`

**Process**:
1. **Delete existing ingredients** for the recipe
   ```javascript
   await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
   ```

2. **For each ingredient**:
   a. Check if ingredient exists in `ingredients` table by name:
      ```javascript
      const { data: existingIng } = await supabase
        .from('ingredients')
        .select('id')
        .ilike('name', ingredientName)
        .single();
      ```
   
   b. If not found, **create new ingredient**:
      ```javascript
      const { data: newIng } = await supabase
        .from('ingredients')
        .insert({
          name: ingredientName,
          default_unit: 'g'  // Required field
        })
        .select()
        .single();
      ```
   
   c. **Insert into recipe_ingredients**:
      ```javascript
      await supabase.from('recipe_ingredients').insert({
        recipe_id: recipeId,
        ingredient_id: ingredientId,  // From step 2a or 2b
        quantity: quantityValue,
        unit: unit || '',
        preparation: preparation || '',
        order_index: index + 1
      });
      ```

3. **Update recipe**:
   ```javascript
   await supabase.from('recipes').update({
     source: 'recipe_editor',
     has_complete_nutrition: true,  // If ingredients were saved
     updated_at: new Date().toISOString()
   }).eq('id', recipeId);
   ```

### Step 3: Save Steps
Location: `src/api/recipeEditor.js` → `updateRecipeSteps()`

**Process**:
1. Delete existing steps
2. Insert new steps with sequential positions

### Step 4: Save Nutrition
Location: `src/api/recipeEditor.js` → `updateRecipeNutrition()`

**Process**:
1. Check if nutrition record exists
2. Upsert (insert or update) nutrition data
3. Update recipe's `calories` field and `has_complete_nutrition` flag

## Data Flow: Database → Recipe Page Display

### Step 1: Fetch Recipe
Location: `src/api/supabaseRecipes.js` → `getSupabaseRecipeById()`

**Query**:
```javascript
const { data: recipeRow } = await supabase
  .from('recipes')
  .select('*')
  .eq('id', id)
  .single();
```

### Step 2: Fetch Related Data (Parallel Queries)
Location: `src/api/supabaseRecipes.js` → `getSupabaseRecipeById()`

**CRITICAL QUERY - Ingredients with Join**:
```javascript
const { data: ingredients } = await supabase
  .from('recipe_ingredients')
  .select(
    'id, ingredient_id, quantity, unit, preparation, optional, ingredient:ingredients(name, default_unit)'
  )
  .eq('recipe_id', id);
```

**This join syntax** `ingredient:ingredients(name, default_unit)` requires:
1. Foreign key relationship: `recipe_ingredients.ingredient_id → ingredients.id`
2. RLS policies allowing SELECT on both tables
3. `ingredients` table must exist

### Step 3: Map to Recipe Object
Location: `src/api/supabaseRecipes.js` → `mapSupabaseRecipeDetail()`

**Process**:
```javascript
recipe.extendedIngredients = ingredients.map(item => {
  let ingredientName = item.ingredient?.name || 'Ingredient';
  // ... clean and format ...
  return {
    id: item.ingredient_id,
    name: ingredientName,
    amount: item.quantity,
    unit: item.unit || item.ingredient?.default_unit || '',
    // ... more fields ...
  };
});
```

**CRITICAL**: If `item.ingredient` is `null` (join failed), ingredient name will be 'Ingredient'

### Step 4: Display on Recipe Page
Location: `src/pages/RecipePage.jsx`

**Process**:
1. Recipe object has `extendedIngredients` array
2. If array is empty or all items have `ingredient: null`, shows "No ingredient list available"
3. Otherwise, displays ingredients with scaling, unit conversion, etc.

## Common Issues & Solutions

### Issue 1: Ingredients Not Showing
**Symptoms**: "No ingredient list available" message

**Possible Causes**:
1. ❌ `ingredients` table doesn't exist
2. ❌ Foreign key relationship missing
3. ❌ RLS policies blocking join query
4. ❌ `recipe_ingredients` has `ingredient_id` values that don't exist in `ingredients` table
5. ❌ Join query syntax incorrect

**Diagnosis**:
```sql
-- Check if join works
SELECT 
  ri.id,
  ri.ingredient_id,
  i.name
FROM recipe_ingredients ri
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
LIMIT 10;
```

**Solution**: Run `scripts/fix-ingredients-display.sql`

### Issue 2: Join Returns NULL
**Symptoms**: Ingredients exist in `recipe_ingredients` but `item.ingredient` is `null`

**Causes**:
- `ingredient_id` in `recipe_ingredients` doesn't match any `id` in `ingredients` table
- Foreign key constraint not enforced
- Data inconsistency

**Solution**:
1. Check for orphaned `ingredient_id` values
2. Re-create ingredients that are missing
3. Fix foreign key constraint

### Issue 3: RLS Policies Blocking
**Symptoms**: Query succeeds but returns empty array

**Solution**:
```sql
-- Allow public read access
CREATE POLICY "Anyone can read ingredients"
ON ingredients FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can read recipe_ingredients"
ON recipe_ingredients FOR SELECT
TO public
USING (true);
```

## Verification Checklist

- [ ] `ingredients` table exists
- [ ] `recipe_ingredients` table exists
- [ ] Foreign key: `recipe_ingredients.ingredient_id → ingredients.id`
- [ ] RLS policies allow SELECT on both tables
- [ ] Sample join query works: `SELECT * FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id LIMIT 1;`
- [ ] Edited recipes have `source = 'recipe_editor'`
- [ ] Edited recipes have entries in `recipe_ingredients`
- [ ] All `ingredient_id` values in `recipe_ingredients` exist in `ingredients` table

## Next Steps

1. Run `scripts/comprehensive-database-analysis.js` to see actual database state
2. Run `scripts/fix-ingredients-display.sql` to fix any issues
3. Test with a specific recipe ID using `scripts/check-recipe-ingredients.js <recipe-id>`

