/**
 * Comprehensive Database Analysis Script
 * This script analyzes the entire Supabase database structure, relationships, and data flow
 * to understand what's working and what's missing.
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

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}${colors.bright}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        return { exists: false, error: 'Table does not exist' };
      }
      return { exists: false, error: error.message };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function getTableStructure(tableName) {
  try {
    // Get column information using a test query
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      return { columns: [], error: error.message };
    }
    
    // Try to get actual structure by querying information_schema
    // Note: This requires direct SQL access, so we'll infer from data
    return { columns: 'inferred', error: null };
  } catch (err) {
    return { columns: [], error: err.message };
  }
}

async function checkForeignKey(tableName, columnName, referencedTable, referencedColumn) {
  try {
    // Test if foreign key works by trying a join
    const { data, error } = await supabase
      .from(tableName)
      .select(`${columnName}:${referencedTable}(${referencedColumn})`)
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function analyzeDatabase() {
  console.log('\n' + colors.bright + colors.magenta);
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          COMPREHENSIVE SUPABASE DATABASE ANALYSIS                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // ============================================================================
  // STEP 1: Check Core Tables
  // ============================================================================
  logSection('STEP 1: Checking Core Tables');

  const coreTables = [
    'recipes',
    'ingredients',
    'recipe_ingredients',
    'recipe_steps',
    'recipe_nutrition',
    'recipe_tags',
    'recipe_pairings',
    'health_badges',
  ];

  const tableStatus = {};
  for (const table of coreTables) {
    const status = await checkTableExists(table);
    tableStatus[table] = status;
    if (status.exists) {
      logSuccess(`${table} table exists`);
    } else {
      logError(`${table} table missing: ${status.error}`);
    }
  }

  // ============================================================================
  // STEP 2: Analyze Recipes Table
  // ============================================================================
  logSection('STEP 2: Analyzing Recipes Table');

  if (tableStatus.recipes?.exists) {
    // Get sample recipes
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, source, has_complete_nutrition, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (!error && recipes) {
      logSuccess(`Found ${recipes.length} sample recipes`);
      
      // Count recipes by source
      const bySource = {};
      recipes.forEach(r => {
        bySource[r.source] = (bySource[r.source] || 0) + 1;
      });
      
      console.log('\n📊 Recipe Sources:');
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
      });

      // Count recipes with complete nutrition
      const { count: completeCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('has_complete_nutrition', true);

      const { count: totalCount } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true });

      logInfo(`Total recipes: ${totalCount || 0}`);
      logInfo(`Recipes with complete nutrition: ${completeCount || 0}`);

      // Find recipes edited via Recipe Editor
      const { data: editedRecipes } = await supabase
        .from('recipes')
        .select('id, title, updated_at')
        .eq('source', 'recipe_editor')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (editedRecipes && editedRecipes.length > 0) {
        logSuccess(`Found ${editedRecipes.length} recipes edited via Recipe Editor`);
        console.log('\n📝 Recently edited recipes:');
        editedRecipes.forEach((r, idx) => {
          console.log(`   ${idx + 1}. ${r.title} (${r.id.substring(0, 8)}...)`);
        });
      } else {
        logWarning('No recipes found with source="recipe_editor"');
      }
    }
  }

  // ============================================================================
  // STEP 3: Analyze Ingredients Table
  // ============================================================================
  logSection('STEP 3: Analyzing Ingredients Table');

  if (tableStatus.ingredients?.exists) {
    const { count: ingredientCount } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });

    logInfo(`Total ingredients: ${ingredientCount || 0}`);

    // Get sample ingredients
    const { data: sampleIngredients } = await supabase
      .from('ingredients')
      .select('id, name, default_unit')
      .limit(10);

    if (sampleIngredients && sampleIngredients.length > 0) {
      logSuccess('Sample ingredients:');
      sampleIngredients.forEach((ing, idx) => {
        console.log(`   ${idx + 1}. ${ing.name} (unit: ${ing.default_unit || 'N/A'})`);
      });
    }
  } else {
    logError('ingredients table does not exist - this is CRITICAL!');
  }

  // ============================================================================
  // STEP 4: Analyze Recipe-Ingredients Relationship
  // ============================================================================
  logSection('STEP 4: Analyzing Recipe-Ingredients Relationship');

  if (tableStatus.recipe_ingredients?.exists) {
    const { count: linkCount } = await supabase
      .from('recipe_ingredients')
      .select('*', { count: 'exact', head: true });

    logInfo(`Total recipe-ingredient links: ${linkCount || 0}`);

    // Check if foreign key relationship works
    const { data: testJoin, error: joinError } = await supabase
      .from('recipe_ingredients')
      .select('id, recipe_id, ingredient_id, quantity, unit, ingredient:ingredients(name, default_unit)')
      .limit(5);

    if (joinError) {
      logError(`Foreign key join FAILED: ${joinError.message}`);
      logError(`Error code: ${joinError.code}`);
      logError(`Error details: ${JSON.stringify(joinError, null, 2)}`);
    } else if (testJoin) {
      logSuccess('Foreign key join works!');
      console.log('\n🔗 Sample recipe-ingredient joins:');
      testJoin.forEach((link, idx) => {
        if (link.ingredient) {
          console.log(`   ${idx + 1}. Recipe ${link.recipe_id.substring(0, 8)}... → ${link.ingredient.name} (${link.quantity} ${link.unit})`);
        } else {
          logWarning(`   ${idx + 1}. Recipe ${link.recipe_id.substring(0, 8)}... → JOIN FAILED (ingredient_id: ${link.ingredient_id})`);
        }
      });

      // Count successful vs failed joins
      const successfulJoins = testJoin.filter(link => link.ingredient).length;
      const failedJoins = testJoin.filter(link => !link.ingredient).length;
      
      if (failedJoins > 0) {
        logWarning(`${failedJoins} out of ${testJoin.length} joins failed`);
      } else {
        logSuccess(`All ${successfulJoins} joins successful`);
      }
    }

    // Check for orphaned recipe_ingredients (ingredient_id doesn't exist in ingredients table)
    if (tableStatus.ingredients?.exists) {
      const { data: allLinks } = await supabase
        .from('recipe_ingredients')
        .select('ingredient_id')
        .limit(100);

      if (allLinks && allLinks.length > 0) {
        const uniqueIngredientIds = [...new Set(allLinks.map(l => l.ingredient_id))];
        logInfo(`Checking ${uniqueIngredientIds.length} unique ingredient IDs...`);

        let orphanedCount = 0;
        for (const ingId of uniqueIngredientIds.slice(0, 20)) {
          const { data: ing } = await supabase
            .from('ingredients')
            .select('id')
            .eq('id', ingId)
            .single();
          
          if (!ing) {
            orphanedCount++;
          }
        }

        if (orphanedCount > 0) {
          logWarning(`Found ${orphanedCount} potentially orphaned ingredient IDs (sampled first 20)`);
        } else {
          logSuccess('No orphaned ingredient IDs found (sampled first 20)');
        }
      }
    }
  }

  // ============================================================================
  // STEP 5: Check Specific Edited Recipes
  // ============================================================================
  logSection('STEP 5: Analyzing Edited Recipes');

  // Get recipes edited via Recipe Editor
  const { data: editedRecipes } = await supabase
    .from('recipes')
    .select('id, title, source, updated_at')
    .eq('source', 'recipe_editor')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (editedRecipes && editedRecipes.length > 0) {
    logSuccess(`Analyzing ${editedRecipes.length} recently edited recipes...`);

    for (const recipe of editedRecipes) {
      console.log(`\n📋 Recipe: ${recipe.title} (${recipe.id.substring(0, 8)}...)`);
      
      // Check ingredients
      const { data: ingredients, error: ingError } = await supabase
        .from('recipe_ingredients')
        .select('id, ingredient_id, quantity, unit, preparation, ingredient:ingredients(name)')
        .eq('recipe_id', recipe.id);

      if (ingError) {
        logError(`  Ingredients query failed: ${ingError.message}`);
      } else if (ingredients && ingredients.length > 0) {
        logSuccess(`  ✅ Has ${ingredients.length} ingredients`);
        
        // Check if joins work
        const successfulJoins = ingredients.filter(ing => ing.ingredient).length;
        const failedJoins = ingredients.filter(ing => !ing.ingredient).length;
        
        if (failedJoins > 0) {
          logWarning(`  ⚠️  ${failedJoins} ingredient joins failed`);
          ingredients.forEach(ing => {
            if (!ing.ingredient) {
              console.log(`     - ingredient_id ${ing.ingredient_id} → JOIN FAILED`);
            }
          });
        } else {
          logSuccess(`  ✅ All ${successfulJoins} ingredient joins successful`);
          console.log(`     Sample: ${ingredients.slice(0, 3).map(ing => 
            `${ing.ingredient?.name || 'MISSING'} (${ing.quantity} ${ing.unit})`
          ).join(', ')}`);
        }
      } else {
        logWarning(`  ⚠️  No ingredients found for this recipe`);
      }

      // Check steps
      const { count: stepsCount } = await supabase
        .from('recipe_steps')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipe.id);

      if (stepsCount > 0) {
        logSuccess(`  ✅ Has ${stepsCount} steps`);
      } else {
        logWarning(`  ⚠️  No steps found`);
      }

      // Check nutrition
      const { data: nutrition } = await supabase
        .from('recipe_nutrition')
        .select('calories, protein, fat, carbs')
        .eq('recipe_id', recipe.id)
        .single();

      if (nutrition) {
        logSuccess(`  ✅ Has nutrition data (${nutrition.calories} cal)`);
      } else {
        logWarning(`  ⚠️  No nutrition data`);
      }
    }
  } else {
    logWarning('No recipes found with source="recipe_editor"');
    logInfo('This means either:');
    logInfo('  1. No recipes have been edited via Recipe Editor yet');
    logInfo('  2. The source field is not being set correctly');
  }

  // ============================================================================
  // STEP 6: Check RLS Policies
  // ============================================================================
  logSection('STEP 6: Checking RLS Policies');

  // Note: We can't directly query RLS policies via Supabase JS client
  // But we can test if queries work
  logInfo('Testing public read access...');

  const testTables = ['ingredients', 'recipe_ingredients'];
  for (const table of testTables) {
    if (tableStatus[table]?.exists) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        logError(`${table}: Read access blocked - ${error.message}`);
      } else {
        logSuccess(`${table}: Read access works`);
      }
    }
  }

  // ============================================================================
  // STEP 7: Data Flow Analysis
  // ============================================================================
  logSection('STEP 7: Data Flow Analysis');

  logInfo('How Recipe Editor saves data:');
  console.log(`
  1. Recipe Editor calls updateRecipeIngredients(recipeId, ingredients)
  2. For each ingredient:
     a. Checks if ingredient exists in 'ingredients' table by name
     b. If not found, creates new ingredient with default_unit='g'
     c. Inserts into 'recipe_ingredients' table with:
        - recipe_id
        - ingredient_id (foreign key to ingredients.id)
        - quantity
        - unit
        - preparation
        - order_index
  3. Recipe Page fetches via getSupabaseRecipeById():
     a. Queries recipe_ingredients with join: ingredient:ingredients(name, default_unit)
     b. Maps to extendedIngredients array
  `);

  // ============================================================================
  // STEP 8: Summary & Recommendations
  // ============================================================================
  logSection('STEP 8: Summary & Recommendations');

  const issues = [];
  const recommendations = [];

  if (!tableStatus.ingredients?.exists) {
    issues.push('CRITICAL: ingredients table does not exist');
    recommendations.push('Create ingredients table with: id, name, default_unit');
  }

  if (!tableStatus.recipe_ingredients?.exists) {
    issues.push('CRITICAL: recipe_ingredients table does not exist');
    recommendations.push('Create recipe_ingredients table with foreign key to ingredients');
  }

  if (tableStatus.ingredients?.exists && tableStatus.recipe_ingredients?.exists) {
    // Test the join one more time
    const { data: finalTest, error: finalError } = await supabase
      .from('recipe_ingredients')
      .select('ingredient:ingredients(name)')
      .limit(1);

    if (finalError) {
      issues.push(`Foreign key relationship broken: ${finalError.message}`);
      recommendations.push('Check foreign key constraint: recipe_ingredients.ingredient_id → ingredients.id');
      recommendations.push('Verify RLS policies allow SELECT on both tables');
    }
  }

  if (issues.length > 0) {
    console.log('\n' + colors.red + colors.bright + '🚨 ISSUES FOUND:' + colors.reset);
    issues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue}`);
    });
  } else {
    logSuccess('No critical issues found!');
  }

  if (recommendations.length > 0) {
    console.log('\n' + colors.yellow + colors.bright + '💡 RECOMMENDATIONS:' + colors.reset);
    recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(colors.green + colors.bright + '✅ Analysis Complete!' + colors.reset);
  console.log('='.repeat(80) + '\n');
}

// Run the analysis
analyzeDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n' + colors.red + colors.bright + '❌ Fatal Error:' + colors.reset);
    console.error(error);
    process.exit(1);
  });

