/**
 * Database Inspection Script
 * Queries Supabase to inspect actual values in the recipes table
 * Helps verify filter logic matches database structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading from .env.local first, then .env
const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

// Load environment variables (try .env.local first, then .env)
const result = dotenv.config({ path: envLocalPath });
if (result.error) {
  // If .env.local doesn't exist, try .env
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local or .env file');
  console.error(`\nChecked paths:`);
  console.error(`  - ${envLocalPath}`);
  console.error(`  - ${envPath}`);
  console.error(`\nAvailable env vars:`, Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase Database...\n');

  try {
    // 1. Check difficulty values
    console.log('1️⃣ Checking difficulty values...');
    const { data: difficultyData, error: diffError } = await supabase
      .from('recipes')
      .select('difficulty')
      .eq('has_complete_nutrition', true)
      .limit(1000);

    if (diffError) {
      console.error('❌ Error fetching difficulty:', diffError);
    } else {
      const difficultyValues = {};
      difficultyData.forEach(row => {
        const val = row.difficulty || 'null';
        difficultyValues[val] = (difficultyValues[val] || 0) + 1;
      });
      console.log('   Difficulty distribution:', difficultyValues);
      console.log('   Unique values:', Object.keys(difficultyValues));
    }

    // 2. Check time distribution
    console.log('\n2️⃣ Checking time distribution...');
    const { data: timeData, error: timeError } = await supabase
      .from('recipes')
      .select('prep_minutes, cook_minutes')
      .eq('has_complete_nutrition', true)
      .limit(1000);

    if (timeError) {
      console.error('❌ Error fetching time data:', timeError);
    } else {
      const totalTimes = timeData.map(r => (r.prep_minutes || 0) + (r.cook_minutes || 0));
      const under30 = totalTimes.filter(t => t <= 30).length;
      const under45 = totalTimes.filter(t => t <= 45).length;
      const avgTime = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
      console.log(`   Recipes with total time <= 30 min: ${under30}/${totalTimes.length}`);
      console.log(`   Recipes with total time <= 45 min: ${under45}/${totalTimes.length}`);
      console.log(`   Average total time: ${avgTime.toFixed(1)} min`);
    }

    // 3. Check cuisine values
    console.log('\n3️⃣ Checking cuisine values...');
    const { data: cuisineData, error: cuisineError } = await supabase
      .from('recipes')
      .select('cuisine')
      .eq('has_complete_nutrition', true)
      .limit(1000);

    if (cuisineError) {
      console.error('❌ Error fetching cuisine:', cuisineError);
    } else {
      const cuisineValues = {};
      cuisineData.forEach(row => {
        const cuisines = Array.isArray(row.cuisine) ? row.cuisine : [];
        cuisines.forEach(c => {
          cuisineValues[c] = (cuisineValues[c] || 0) + 1;
        });
      });
      console.log('   Top cuisines:', Object.entries(cuisineValues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10));
    }

    // 4. Check diet values
    console.log('\n4️⃣ Checking diet values...');
    const { data: dietData, error: dietError } = await supabase
      .from('recipes')
      .select('diets')
      .eq('has_complete_nutrition', true)
      .limit(1000);

    if (dietError) {
      console.error('❌ Error fetching diets:', dietError);
    } else {
      const dietValues = {};
      dietData.forEach(row => {
        const diets = Array.isArray(row.diets) ? row.diets : [];
        diets.forEach(d => {
          dietValues[d] = (dietValues[d] || 0) + 1;
        });
      });
      console.log('   Diet distribution:', Object.entries(dietValues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10));
      console.log('   Has "keto":', !!dietValues['keto'] || !!dietValues['Keto']);
    }

    // 5. Check meal_types
    console.log('\n5️⃣ Checking meal_types...');
    const { data: mealData, error: mealError } = await supabase
      .from('recipes')
      .select('meal_types')
      .eq('has_complete_nutrition', true)
      .limit(1000);

    if (mealError) {
      console.error('❌ Error fetching meal_types:', mealError);
    } else {
      const mealValues = {};
      mealData.forEach(row => {
        const meals = Array.isArray(row.meal_types) ? row.meal_types : [];
        meals.forEach(m => {
          mealValues[m] = (mealValues[m] || 0) + 1;
        });
      });
      console.log('   Meal type distribution:', Object.entries(mealValues)
        .sort((a, b) => b[1] - a[1]));
    }

    // 6. Test Family-Friendly filter criteria
    console.log('\n6️⃣ Testing Family-Friendly filter (maxTime <= 45, difficulty = easy)...');
    const { data: familyData, error: familyError } = await supabase
      .from('recipes')
      .select('id, title, prep_minutes, cook_minutes, difficulty')
      .eq('has_complete_nutrition', true)
      .limit(1000);

    if (familyError) {
      console.error('❌ Error fetching family data:', familyError);
    } else {
      const familyFriendly = familyData.filter(r => {
        const totalTime = (r.prep_minutes || 0) + (r.cook_minutes || 0);
        const difficulty = (r.difficulty || '').toLowerCase();
        return totalTime <= 45 && difficulty === 'easy';
      });
      console.log(`   Recipes matching Family-Friendly: ${familyFriendly.length}/${familyData.length}`);
      if (familyFriendly.length > 0) {
        console.log('   Sample recipes:', familyFriendly.slice(0, 5).map(r => r.title));
      }
    }

    // 7. Count recipes with complete nutrition
    console.log('\n7️⃣ Counting recipes...');
    const { count, error: countError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('has_complete_nutrition', true);

    if (countError) {
      console.error('❌ Error counting recipes:', countError);
    } else {
      console.log(`   Total recipes with complete nutrition: ${count}`);
    }

    console.log('\n✅ Database inspection complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run inspection
inspectDatabase();

