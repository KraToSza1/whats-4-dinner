/**
 * Check database health and statistics
 * Provides overview of recipe database status
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabaseHealth() {
  console.log('🏥 Checking database health...\n');

  const stats = {};

  // Total recipes
  const { count: totalRecipes } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true });
  stats.totalRecipes = totalRecipes || 0;

  // Recipes with images
  const { count: recipesWithImages } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .not('hero_image_url', 'is', null);
  stats.recipesWithImages = recipesWithImages || 0;

  // Recipes with complete nutrition
  const { count: recipesWithNutrition } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('has_complete_nutrition', true);
  stats.recipesWithNutrition = recipesWithNutrition || 0;

  // Total ingredients
  const { count: totalIngredients } = await supabase
    .from('ingredients')
    .select('*', { count: 'exact', head: true });
  stats.totalIngredients = totalIngredients || 0;

  // Total recipe ingredients
  const { count: totalRecipeIngredients } = await supabase
    .from('recipe_ingredients')
    .select('*', { count: 'exact', head: true });
  stats.totalRecipeIngredients = totalRecipeIngredients || 0;

  // Total steps
  const { count: totalSteps } = await supabase
    .from('recipe_steps')
    .select('*', { count: 'exact', head: true });
  stats.totalSteps = totalSteps || 0;

  // Recipes by source
  const { data: recipesBySource } = await supabase
    .from('recipes')
    .select('source')
    .limit(10000);

  const sourceCounts = {};
  recipesBySource?.forEach((r) => {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
  });
  stats.recipesBySource = sourceCounts;

  // Print report
  console.log('='.repeat(60));
  console.log('📊 Database Statistics');
  console.log('='.repeat(60));
  console.log(`\n📝 Recipes:`);
  console.log(`   Total: ${stats.totalRecipes.toLocaleString()}`);
  console.log(`   With images: ${stats.recipesWithImages.toLocaleString()} (${((stats.recipesWithImages / stats.totalRecipes) * 100).toFixed(1)}%)`);
  console.log(`   With nutrition: ${stats.recipesWithNutrition.toLocaleString()} (${((stats.recipesWithNutrition / stats.totalRecipes) * 100).toFixed(1)}%)`);

  console.log(`\n🥘 Ingredients:`);
  console.log(`   Unique ingredients: ${stats.totalIngredients.toLocaleString()}`);
  console.log(`   Recipe-ingredient links: ${stats.totalRecipeIngredients.toLocaleString()}`);

  console.log(`\n📋 Steps:`);
  console.log(`   Total steps: ${stats.totalSteps.toLocaleString()}`);

  console.log(`\n📦 Recipes by source:`);
  Object.entries(stats.recipesBySource).forEach(([source, count]) => {
    console.log(`   ${source || 'null'}: ${count.toLocaleString()}`);
  });

  // Health score
  const imageScore = (stats.recipesWithImages / stats.totalRecipes) * 100;
  const nutritionScore = (stats.recipesWithNutrition / stats.totalRecipes) * 100;
  const healthScore = ((imageScore + nutritionScore) / 2).toFixed(1);

  console.log(`\n🏥 Health Score: ${healthScore}%`);
  if (healthScore >= 90) {
    console.log('   ✅ Excellent!');
  } else if (healthScore >= 70) {
    console.log('   ⚠️  Good, but could be better');
  } else {
    console.log('   ❌ Needs improvement');
  }

  console.log('\n' + '='.repeat(60));
}

checkDatabaseHealth().catch(console.error);

