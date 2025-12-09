/**
 * Test the exact query that RecipePage uses to fetch ingredients
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function testRecipeQuery() {
  console.log('\n🔍 Testing Recipe Query (exact same as RecipePage uses)\n');
  console.log('='.repeat(80));

  // Step 1: Get a recipe edited via Recipe Editor
  console.log('\n📋 Step 1: Finding a recipe edited via Recipe Editor...');
  const { data: editedRecipes, error: recipeError } = await supabase
    .from('recipes')
    .select('id, title, source')
    .eq('source', 'recipe_editor')
    .limit(1)
    .single();

  if (recipeError || !editedRecipes) {
    console.error('❌ No recipes found with source="recipe_editor"');
    console.error('   Error:', recipeError?.message);
    
    // Try to get any recipe
    const { data: anyRecipe } = await supabase
      .from('recipes')
      .select('id, title, source')
      .limit(1)
      .single();
    
    if (anyRecipe) {
      console.log(`\n⚠️  Using any recipe instead: ${anyRecipe.title} (${anyRecipe.id})`);
      editedRecipes = anyRecipe;
    } else {
      process.exit(1);
    }
  }

  const recipeId = editedRecipes.id;
  console.log(`✅ Found recipe: ${editedRecipes.title}`);
  console.log(`   ID: ${recipeId}`);
  console.log(`   Source: ${editedRecipes.source}`);

  // Step 2: Test the EXACT query that getSupabaseRecipeById uses
  console.log('\n📋 Step 2: Testing ingredient query (exact same as RecipePage)...');
  const { data: ingredients, error: ingError } = await supabase
    .from('recipe_ingredients')
    .select(
      'id, ingredient_id, quantity, unit, preparation, optional, ingredient:ingredients(name, default_unit)'
    )
    .eq('recipe_id', recipeId);

  if (ingError) {
    console.error('❌ Ingredient query FAILED:');
    console.error('   Error:', ingError.message);
    console.error('   Code:', ingError.code);
    console.error('   Details:', ingError.details);
    console.error('   Hint:', ingError.hint);
    process.exit(1);
  }

  console.log(`✅ Query succeeded! Found ${ingredients?.length || 0} ingredients`);

  if (!ingredients || ingredients.length === 0) {
    console.error('\n❌ NO INGREDIENTS FOUND in recipe_ingredients table!');
    console.error('   This recipe has no ingredients saved.');
    process.exit(1);
  }

  // Step 3: Check if join worked
  console.log('\n📋 Step 3: Checking if ingredient join worked...');
  const successfulJoins = ingredients.filter(ing => ing.ingredient).length;
  const failedJoins = ingredients.filter(ing => !ing.ingredient).length;

  console.log(`   Successful joins: ${successfulJoins}`);
  console.log(`   Failed joins: ${failedJoins}`);

  if (failedJoins > 0) {
    console.error('\n❌ JOIN FAILED for some ingredients!');
    ingredients.forEach((ing, idx) => {
      if (!ing.ingredient) {
        console.error(`   ${idx + 1}. ingredient_id: ${ing.ingredient_id} → JOIN FAILED`);
      }
    });
  }

  // Step 4: Show sample data
  console.log('\n📋 Step 4: Sample ingredient data:');
  ingredients.slice(0, 5).forEach((ing, idx) => {
    console.log(`   ${idx + 1}. ${ing.ingredient?.name || 'MISSING NAME'}`);
    console.log(`      - ingredient_id: ${ing.ingredient_id}`);
    console.log(`      - quantity: ${ing.quantity}`);
    console.log(`      - unit: ${ing.unit || '(empty)'}`);
    console.log(`      - has ingredient object: ${!!ing.ingredient}`);
    if (ing.ingredient) {
      console.log(`      - ingredient name: ${ing.ingredient.name}`);
      console.log(`      - default_unit: ${ing.ingredient.default_unit || 'N/A'}`);
    }
  });

  // Step 5: Test the mapping function logic
  console.log('\n📋 Step 5: Testing mapping logic (same as mapSupabaseRecipeDetail)...');
  
  const mappedIngredients = ingredients.map(item => {
    let ingredientName = item.ingredient?.name || 'Ingredient';
    
    // Clean the ingredient name
    ingredientName = ingredientName
      .trim()
      .replace(/^['"]+|['"]+$/g, '')
      .trim();

    let amount = item.quantity ?? null;
    let unit = item.unit || item.ingredient?.default_unit || '';

    const originalParts = [amount, unit, ingredientName].filter(Boolean).join(' ');

    return {
      id: item.ingredient_id || item.id,
      name: ingredientName,
      original: originalParts,
      originalString: originalParts,
      originalName: ingredientName,
      amount,
      unit,
      meta: item.preparation ? [item.preparation] : [],
      optional: !!item.optional,
    };
  });

  console.log(`✅ Mapped ${mappedIngredients.length} ingredients`);
  console.log('\n📋 Sample mapped ingredients:');
  mappedIngredients.slice(0, 3).forEach((ing, idx) => {
    console.log(`   ${idx + 1}. ${ing.name}`);
    console.log(`      - amount: ${ing.amount}`);
    console.log(`      - unit: ${ing.unit || '(empty)'}`);
    console.log(`      - original: ${ing.original}`);
  });

  // Step 6: Check if this would pass RecipePage check
  console.log('\n📋 Step 6: RecipePage check simulation...');
  const hasExtendedIngredients = mappedIngredients.length > 0;
  const wouldShowIngredients = hasExtendedIngredients;

  console.log(`   recipe?.extendedIngredients exists: ${hasExtendedIngredients}`);
  console.log(`   recipe?.extendedIngredients.length: ${mappedIngredients.length}`);
  console.log(`   Would show ingredients: ${wouldShowIngredients ? '✅ YES' : '❌ NO'}`);

  if (!wouldShowIngredients) {
    console.error('\n❌ PROBLEM FOUND: RecipePage would show "No ingredient list available"');
    console.error('   Reason: extendedIngredients array is empty or missing');
  } else {
    console.log('\n✅ RecipePage would display ingredients correctly!');
  }

  // Step 7: Full recipe fetch test
  console.log('\n📋 Step 7: Testing full recipe fetch (getSupabaseRecipeById simulation)...');
  
  // Get recipe row
  const { data: recipeRow, error: recipeRowError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (recipeRowError) {
    console.error('❌ Failed to fetch recipe row:', recipeRowError.message);
    process.exit(1);
  }

  console.log(`✅ Recipe row fetched: ${recipeRow.title}`);

  // Simulate what getSupabaseRecipeById does
  const fullRecipe = {
    id: recipeRow.id,
    title: recipeRow.title,
    extendedIngredients: mappedIngredients, // This is what should be set
    // ... other fields
  };

  console.log(`✅ Full recipe object created`);
  console.log(`   extendedIngredients.length: ${fullRecipe.extendedIngredients.length}`);

  // Final check
  console.log('\n' + '='.repeat(80));
  if (fullRecipe.extendedIngredients.length > 0) {
    console.log('✅ SUCCESS: Recipe has ingredients and they should display!');
  } else {
    console.log('❌ FAILURE: Recipe has no ingredients in extendedIngredients array');
  }
  console.log('='.repeat(80) + '\n');
}

testRecipeQuery()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

