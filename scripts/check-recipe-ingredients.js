/**
 * Check Recipe Ingredients Diagnostic Script
 * Checks if a recipe has ingredients in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function checkRecipeIngredients(recipeId) {
  console.log('\n🔍 Checking ingredients for recipe:', recipeId);
  console.log('='.repeat(60));

  // Check if recipe exists
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, title')
    .eq('id', recipeId)
    .maybeSingle();

  if (recipeError) {
    console.error('❌ Error fetching recipe:', recipeError.message);
    return;
  }

  if (!recipe) {
    console.error('❌ Recipe not found:', recipeId);
    return;
  }

  console.log('✅ Recipe found:', recipe.title);

  // Check recipe_ingredients table
  const { data: recipeIngredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('id, ingredient_id, quantity, unit, preparation, optional')
    .eq('recipe_id', recipeId);

  if (ingredientsError) {
    console.error('❌ Error fetching recipe_ingredients:', ingredientsError.message);
    return;
  }

  console.log('\n📋 Recipe Ingredients (recipe_ingredients table):');
  console.log('   Count:', recipeIngredients?.length || 0);

  if (!recipeIngredients || recipeIngredients.length === 0) {
    console.log('   ⚠️  NO INGREDIENTS FOUND in recipe_ingredients table!');
    console.log('\n💡 Solution:');
    console.log('   1. Go to admin dashboard → Recipes tab');
    console.log('   2. Find this recipe and edit it');
    console.log('   3. Add ingredients via the Recipe Editor');
    return;
  }

  // Check if ingredients exist in ingredients table
  const ingredientIds = recipeIngredients
    .map(ri => ri.ingredient_id)
    .filter(Boolean);

  if (ingredientIds.length === 0) {
    console.log('   ⚠️  Recipe ingredients have no ingredient_id values!');
    return;
  }

  const { data: ingredients, error: ingredientsTableError } = await supabase
    .from('ingredients')
    .select('id, name, default_unit')
    .in('id', ingredientIds);

  if (ingredientsTableError) {
    console.error('❌ Error fetching ingredients:', ingredientsTableError.message);
    return;
  }

  console.log('\n🥘 Ingredients (ingredients table):');
  console.log('   Found:', ingredients?.length || 0, 'out of', ingredientIds.length);

  // Check for missing ingredients
  const foundIds = new Set(ingredients?.map(i => i.id) || []);
  const missingIds = ingredientIds.filter(id => !foundIds.has(id));

  if (missingIds.length > 0) {
    console.log('   ⚠️  Missing ingredients:', missingIds.length);
    console.log('   Missing IDs:', missingIds);
  }

  // Show sample ingredients
  console.log('\n📝 Sample Ingredients:');
  recipeIngredients.slice(0, 5).forEach((ri, idx) => {
    const ingredient = ingredients?.find(i => i.id === ri.ingredient_id);
    console.log(`   ${idx + 1}. ${ingredient?.name || 'MISSING NAME'} (ID: ${ri.ingredient_id})`);
    console.log(`      Quantity: ${ri.quantity || 'N/A'}, Unit: ${ri.unit || 'N/A'}`);
  });

  // Test the join query (same as used in getSupabaseRecipeById)
  console.log('\n🔗 Testing join query (same as app uses):');
  const { data: joinedIngredients, error: joinError } = await supabase
    .from('recipe_ingredients')
    .select(
      'id, ingredient_id, quantity, unit, preparation, optional, ingredient:ingredients(name, default_unit)'
    )
    .eq('recipe_id', recipeId);

  if (joinError) {
    console.error('❌ Join query error:', joinError.message);
    return;
  }

  console.log('   Join query returned:', joinedIngredients?.length || 0, 'items');
  
  if (joinedIngredients && joinedIngredients.length > 0) {
    const withName = joinedIngredients.filter(ri => ri.ingredient?.name);
    const withoutName = joinedIngredients.filter(ri => !ri.ingredient?.name);
    
    console.log('   ✅ Ingredients with name:', withName.length);
    console.log('   ❌ Ingredients without name (join failed):', withoutName.length);
    
    if (withoutName.length > 0) {
      console.log('\n   ⚠️  JOIN FAILED for these ingredients:');
      withoutName.forEach(ri => {
        console.log(`      - ingredient_id: ${ri.ingredient_id} (no matching ingredient in ingredients table)`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic complete');
}

// Main execution
const recipeId = process.argv[2];

if (!recipeId) {
  console.error('Usage: node scripts/check-recipe-ingredients.js <recipe-id>');
  console.error('Example: node scripts/check-recipe-ingredients.js 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

checkRecipeIngredients(recipeId)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

