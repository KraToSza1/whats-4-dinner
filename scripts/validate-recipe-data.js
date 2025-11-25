/**
 * Validate recipe data in Supabase
 * Checks for missing fields, invalid data, and inconsistencies
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function validateRecipes() {
  console.log('🔍 Validating recipe data...\n');

  const issues = {
    missingImages: [],
    missingNutrition: [],
    missingIngredients: [],
    missingSteps: [],
    invalidServings: [],
    invalidNutrition: [],
    total: 0,
  };

  // Fetch recipes in batches
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, servings, hero_image_url, has_complete_nutrition')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching recipes:', error);
      break;
    }

    if (!recipes || recipes.length === 0) {
      hasMore = false;
      break;
    }

    issues.total += recipes.length;

    for (const recipe of recipes) {
      // Check for missing images
      if (!recipe.hero_image_url) {
        issues.missingImages.push({ id: recipe.id, title: recipe.title });
      }

      // Check for missing nutrition
      if (!recipe.has_complete_nutrition) {
        issues.missingNutrition.push({ id: recipe.id, title: recipe.title });
      }

      // Check for invalid servings
      if (!recipe.servings || recipe.servings <= 0) {
        issues.invalidServings.push({ id: recipe.id, title: recipe.title, servings: recipe.servings });
      }

      // Check for ingredients
      const { count: ingredientCount } = await supabase
        .from('recipe_ingredients')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipe.id);

      if (!ingredientCount || ingredientCount === 0) {
        issues.missingIngredients.push({ id: recipe.id, title: recipe.title });
      }

      // Check for steps
      const { count: stepCount } = await supabase
        .from('recipe_steps')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipe.id);

      if (!stepCount || stepCount === 0) {
        issues.missingSteps.push({ id: recipe.id, title: recipe.title });
      }

      // Check nutrition data
      const { data: nutrition } = await supabase
        .from('recipe_nutrition')
        .select('calories, protein, fat, carbs')
        .eq('recipe_id', recipe.id)
        .single();

      if (nutrition) {
        const caloriesPerServing = nutrition.calories / (recipe.servings || 1);
        if (caloriesPerServing > 2000 || caloriesPerServing < 50) {
          issues.invalidNutrition.push({
            id: recipe.id,
            title: recipe.title,
            calories: nutrition.calories,
            servings: recipe.servings,
            caloriesPerServing: caloriesPerServing.toFixed(1),
          });
        }
      }
    }

    offset += limit;
    if (recipes.length < limit) {
      hasMore = false;
    }

    console.log(`📊 Processed ${offset} recipes...`);
  }

  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('📋 Validation Report');
  console.log('='.repeat(60));
  console.log(`Total recipes checked: ${issues.total}\n`);

  console.log(`❌ Missing images: ${issues.missingImages.length}`);
  if (issues.missingImages.length > 0 && issues.missingImages.length <= 10) {
    issues.missingImages.forEach((r) => console.log(`   - ${r.title} (${r.id})`));
  }

  console.log(`\n❌ Missing nutrition: ${issues.missingNutrition.length}`);
  if (issues.missingNutrition.length > 0 && issues.missingNutrition.length <= 10) {
    issues.missingNutrition.forEach((r) => console.log(`   - ${r.title} (${r.id})`));
  }

  console.log(`\n❌ Missing ingredients: ${issues.missingIngredients.length}`);
  if (issues.missingIngredients.length > 0 && issues.missingIngredients.length <= 10) {
    issues.missingIngredients.forEach((r) => console.log(`   - ${r.title} (${r.id})`));
  }

  console.log(`\n❌ Missing steps: ${issues.missingSteps.length}`);
  if (issues.missingSteps.length > 0 && issues.missingSteps.length <= 10) {
    issues.missingSteps.forEach((r) => console.log(`   - ${r.title} (${r.id})`));
  }

  console.log(`\n⚠️  Invalid servings: ${issues.invalidServings.length}`);
  console.log(`\n⚠️  Invalid nutrition: ${issues.invalidNutrition.length}`);
  if (issues.invalidNutrition.length > 0 && issues.invalidNutrition.length <= 5) {
    issues.invalidNutrition.forEach((r) =>
      console.log(`   - ${r.title}: ${r.caloriesPerServing} kcal/serving (${r.calories} total / ${r.servings} servings)`)
    );
  }

  // Save detailed report
  const reportPath = join(__dirname, '..', 'Database', 'recipe_validation_report.json');
  await import('fs').then((fs) =>
    fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2))
  );
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
}

validateRecipes().catch(console.error);

