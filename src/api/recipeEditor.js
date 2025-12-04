/**
 * Recipe Editor API Functions
 * Functions to update recipes, images, titles, and instructions
 */
import { supabase } from '../lib/supabaseClient';

/**
 * Create a new recipe
 */
export async function createRecipe(recipeData) {
  console.log('➕ [RECIPE EDITOR API] createRecipe called', {
    title: recipeData.title,
    hasSteps: recipeData.steps?.length > 0,
    hasIngredients: recipeData.ingredients?.length > 0,
  });
  try {
    // Prepare recipe metadata
    const recipeMetadata = {
      title: recipeData.title || 'Untitled Recipe',
      description: recipeData.description || null,
      hero_image_url: recipeData.hero_image_url || null,
      prep_minutes: recipeData.prep_minutes ? parseInt(recipeData.prep_minutes) : null,
      cook_minutes: recipeData.cook_minutes ? parseInt(recipeData.cook_minutes) : null,
      servings: recipeData.servings ? parseFloat(recipeData.servings) : 4,
      difficulty: recipeData.difficulty || 'easy',
      cuisine: recipeData.cuisine || [],
      meal_types: recipeData.meal_types || [],
      diets: recipeData.diets || [],
      author: recipeData.author || 'Community',
      source: 'recipe_editor', // IMPORTANT: Mark as created via Recipe Editor - prevents CSV rehydration
      calories: null, // Will be calculated later
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 [RECIPE EDITOR API] Inserting recipe...');
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert(recipeMetadata)
      .select()
      .single();

    if (recipeError) throw recipeError;
    console.log('✅ [RECIPE EDITOR API] Recipe created', { recipeId: recipe.id });

    const recipeId = recipe.id;
    let successCount = 1;
    let errorCount = 0;

    // Insert steps if provided
    if (recipeData.steps && recipeData.steps.length > 0) {
      const validSteps = recipeData.steps.filter(s => s.instruction && s.instruction.trim());
      if (validSteps.length > 0) {
        console.log('💾 [RECIPE EDITOR API] Inserting steps...', { count: validSteps.length });
        const stepsToInsert = validSteps.map((step, index) => ({
          recipe_id: recipeId,
          position: index + 1,
          instruction: step.instruction || step,
          timer_seconds: step.timer_seconds || null,
        }));

        const { error: stepsError } = await supabase.from('recipe_steps').insert(stepsToInsert);

        if (stepsError) {
          console.error('❌ [RECIPE EDITOR API] Steps insert error:', stepsError);
          errorCount++;
        } else {
          console.log('✅ [RECIPE EDITOR API] Steps inserted');
          successCount++;
        }
      }
    }

    // Insert ingredients if provided
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      console.log('💾 [RECIPE EDITOR API] Processing ingredients...', {
        count: recipeData.ingredients.length,
      });

      // Process ingredients - create ingredient entries and link them
      for (const ing of recipeData.ingredients) {
        if (!ing.ingredient_name || !ing.ingredient_name.trim()) continue;

        try {
          // Find or create ingredient
          let ingredientId = ing.ingredient_id;

          if (!ingredientId) {
            // Check if ingredient exists
            const { data: existingIng } = await supabase
              .from('ingredients')
              .select('id')
              .eq('name', ing.ingredient_name.trim())
              .limit(1)
              .single();

            if (existingIng) {
              ingredientId = existingIng.id;
            } else {
              // Create new ingredient
              const { data: newIng, error: ingError } = await supabase
                .from('ingredients')
                .insert({ name: ing.ingredient_name.trim() })
                .select()
                .single();

              if (ingError) throw ingError;
              ingredientId = newIng.id;
            }
          }

          // Create recipe_ingredient link
          const { error: linkError } = await supabase.from('recipe_ingredients').insert({
            recipe_id: recipeId,
            ingredient_id: ingredientId,
            quantity: ing.quantity ? parseFloat(ing.quantity) : null,
            unit: ing.unit || null,
            preparation: ing.preparation || null,
          });

          if (linkError) throw linkError;
        } catch (err) {
          console.error('❌ [RECIPE EDITOR API] Ingredient processing error:', err);
          errorCount++;
        }
      }

      console.log('✅ [RECIPE EDITOR API] Ingredients processed');
      successCount++;
    }

    // Save nutrition data if provided
    if (recipeData.nutrition && Object.keys(recipeData.nutrition).length > 0) {
      console.log('💾 [RECIPE EDITOR API] Saving nutrition data for new recipe...');
      const nutritionToSave = {
        recipe_id: recipeId,
        ...recipeData.nutrition,
      };

      const { error: nutritionError } = await supabase
        .from('recipe_nutrition')
        .insert(nutritionToSave);

      if (nutritionError) {
        console.error('❌ [RECIPE EDITOR API] Nutrition save error:', nutritionError);
        errorCount++;
      } else {
        console.log('✅ [RECIPE EDITOR API] Nutrition saved');
        successCount++;
      }
    }

    console.log('✅ [RECIPE EDITOR API] createRecipe success', {
      recipeId,
      successCount,
      errorCount,
    });
    return { success: true, data: recipe, recipeId, successCount, errorCount };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] createRecipe error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update recipe title
 */
export async function updateRecipeTitle(recipeId, newTitle) {
  console.log('📝 [RECIPE EDITOR API] updateRecipeTitle called', { recipeId, newTitle });
  try {
    const { data, error } = await supabase
      .from('recipes')
      .update({
        title: newTitle,
        source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ [RECIPE EDITOR API] updateRecipeTitle success', { recipeId, data });
    return { success: true, data };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeTitle error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update recipe description
 */
export async function updateRecipeDescription(recipeId, newDescription) {
  console.log('📝 [RECIPE EDITOR API] updateRecipeDescription called', {
    recipeId,
    descriptionLength: newDescription?.length,
  });
  try {
    const { data, error } = await supabase
      .from('recipes')
      .update({
        description: newDescription,
        source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ [RECIPE EDITOR API] updateRecipeDescription success', { recipeId });
    return { success: true, data };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeDescription error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update recipe image URL
 */
export async function updateRecipeImage(recipeId, imageUrl) {
  console.log('🖼️ [RECIPE EDITOR API] updateRecipeImage called', {
    recipeId,
    imageUrl: imageUrl?.substring(0, 50) + '...',
  });
  try {
    const { data, error, count } = await supabase
      .from('recipes')
      .update({
        hero_image_url: imageUrl,
        source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      console.error('❌ [RECIPE EDITOR API] updateRecipeImage: No rows updated', {
        recipeId,
        hint: 'RLS policy may be blocking UPDATE. Check recipes table RLS policies.',
      });
      return {
        success: false,
        error: 'Update blocked - check RLS policies on recipes table',
      };
    }

    console.log('✅ [RECIPE EDITOR API] updateRecipeImage success', {
      recipeId,
      updatedRows: data.length,
    });
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeImage error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update recipe nutrition data
 */
export async function updateRecipeNutrition(recipeId, nutritionData) {
  console.log('📊 [RECIPE EDITOR API] updateRecipeNutrition called', { recipeId, nutritionData });
  try {
    // Check if nutrition record exists
    const { data: existing } = await supabase
      .from('recipe_nutrition')
      .select('recipe_id')
      .eq('recipe_id', recipeId)
      .single();

    // Convert nutrition values to proper types
    // Note: Some fields might be INTEGER in DB, so we need to handle both cases
    const convertNutritionValue = (value, allowDecimals = true) => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return null;
      return allowDecimals ? num : Math.round(num);
    };

    // Based on errors, it seems MOST fields are INTEGER in the database
    // Only keep a few as NUMERIC (decimals) - let's be conservative and make most INTEGER
    // Helper to safely convert and default to 0 for required fields
    const safeConvert = (value, defaultValue = 0) => {
      const converted = convertNutritionValue(value, false);
      return converted !== null && converted !== undefined ? converted : defaultValue;
    };

    // IMPORTANT: Some fields have NOT NULL constraints, so default to 0 if not provided
    // Based on error: sugar has NOT NULL constraint, and likely others do too
    const nutritionToSave = {
      recipe_id: recipeId,
      calories: safeConvert(nutritionData.calories, 0), // REQUIRED - default to 0
      protein: safeConvert(nutritionData.protein, 0), // INTEGER
      fat: safeConvert(nutritionData.fat, 0), // INTEGER
      carbs: safeConvert(nutritionData.carbs, 0), // INTEGER
      fiber: safeConvert(nutritionData.fiber, 0), // INTEGER
      sugar: safeConvert(nutritionData.sugar, 0), // INTEGER - REQUIRED (NOT NULL constraint)
      sodium: safeConvert(nutritionData.sodium, 0), // INTEGER
      cholesterol: safeConvert(nutritionData.cholesterol, 0), // INTEGER
      saturated_fat: safeConvert(nutritionData.saturated_fat, 0), // INTEGER
      trans_fat: safeConvert(nutritionData.trans_fat, 0), // INTEGER
      vitamin_a: safeConvert(nutritionData.vitamin_a, 0), // INTEGER
      vitamin_c: safeConvert(nutritionData.vitamin_c, 0), // INTEGER
      vitamin_d: safeConvert(nutritionData.vitamin_d, 0), // INTEGER
      potassium: safeConvert(nutritionData.potassium, 0), // INTEGER
      calcium: safeConvert(nutritionData.calcium, 0), // INTEGER
      iron: safeConvert(nutritionData.iron, 0), // INTEGER
    };

    // Log any fields that were defaulted to 0
    const defaultedFields = [];
    Object.keys(nutritionToSave).forEach(key => {
      if (
        key !== 'recipe_id' &&
        nutritionToSave[key] === 0 &&
        (!nutritionData[key] || nutritionData[key] === '')
      ) {
        defaultedFields.push(key);
      }
    });
    if (defaultedFields.length > 0) {
      console.log(
        '⚠️ [RECIPE EDITOR API] Defaulted fields to 0 (required by database):',
        defaultedFields
      );
    }

    console.log('📊 [RECIPE EDITOR API] Converted nutrition values', {
      carbs: nutritionToSave.carbs,
      carbsType: typeof nutritionToSave.carbs,
      originalCarbs: nutritionData.carbs,
      originalCarbsType: typeof nutritionData.carbs,
    });

    // VALIDATION: Check for unrealistic nutrition values
    // Calories should be reasonable for a recipe (typically 200-5000 kcal total)
    // Fetch recipe servings for proper validation
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('servings')
      .eq('id', recipeId)
      .single();

    const recipeServings = recipeData?.servings || 1;

    if (nutritionToSave.calories > 0) {
      const caloriesPerServing = nutritionToSave.calories / recipeServings;
      if (caloriesPerServing > 2000) {
        console.warn('⚠️ [RECIPE EDITOR API] WARNING: Calories per serving seems very high!', {
          totalCalories: nutritionToSave.calories,
          servings: recipeServings,
          caloriesPerServing: caloriesPerServing.toFixed(1),
          note: 'This might indicate the values were multiplied incorrectly',
        });
      }
      if (nutritionToSave.calories > 10000) {
        console.error(
          '❌ [RECIPE EDITOR API] ERROR: Total calories exceeds 10,000 - this is likely incorrect!',
          {
            totalCalories: nutritionToSave.calories,
            servings: recipeServings,
            caloriesPerServing: caloriesPerServing.toFixed(1),
            warning: 'Please verify these values are correct before saving',
          }
        );
      }
    }

    let result;
    if (existing) {
      // Update existing
      console.log('🔄 [RECIPE EDITOR API] Updating existing nutrition record', {
        recipeId,
        calories: nutritionToSave.calories,
        updateData: nutritionToSave,
      });
      const { data, error } = await supabase
        .from('recipe_nutrition')
        .update(nutritionToSave)
        .eq('recipe_id', recipeId)
        .select()
        .single();

      if (error) {
        console.error('❌ [RECIPE EDITOR API] Update failed:', error);
        throw error;
      }

      console.log('✅ [RECIPE EDITOR API] Nutrition record updated successfully', {
        recipeId,
        savedCalories: data?.calories,
        expectedCalories: nutritionToSave.calories,
        match: data?.calories === nutritionToSave.calories,
      });
      result = data;
    } else {
      // Insert new
      console.log('➕ [RECIPE EDITOR API] Creating new nutrition record', {
        recipeId,
        calories: nutritionToSave.calories,
      });
      const { data, error } = await supabase
        .from('recipe_nutrition')
        .insert(nutritionToSave)
        .select()
        .single();

      if (error) {
        console.error('❌ [RECIPE EDITOR API] Insert failed:', error);
        throw error;
      }

      console.log('✅ [RECIPE EDITOR API] Nutrition record created successfully', {
        recipeId,
        savedCalories: data?.calories,
      });
      result = data;
    }

    // Update recipe's calories field and mark as having complete nutrition
    // IMPORTANT: Also set source to 'recipe_editor' to prevent CSV rehydration
    // Use the saved calories value (which defaults to 0 if null)
    const { error: recipeUpdateError } = await supabase
      .from('recipes')
      .update({
        calories: nutritionToSave.calories, // Use the converted value (defaults to 0 if null)
        source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
        has_complete_nutrition: true, // Mark as complete when nutrition is saved
      })
      .eq('id', recipeId);

    if (recipeUpdateError) {
      console.error('❌ [RECIPE EDITOR API] Failed to update recipe calories:', recipeUpdateError);
    }

    console.log(
      '✅ [RECIPE EDITOR API] Marking recipe as having complete nutrition (nutrition data saved)',
      {
        calories: nutritionToSave.calories,
      }
    );

    // VERIFICATION: Read back the data to confirm it was saved correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('recipe_nutrition')
      .select('calories, protein, fat, carbs')
      .eq('recipe_id', recipeId)
      .single();

    if (verifyError) {
      console.error('❌ [RECIPE EDITOR API] Verification read failed:', verifyError);
    } else {
      console.log('🔍 [RECIPE EDITOR API] Verification - Data in database after save:', {
        recipeId,
        savedCalories: verifyData?.calories,
        expectedCalories: nutritionToSave.calories,
        match: verifyData?.calories === nutritionToSave.calories,
        note:
          verifyData?.calories !== nutritionToSave.calories
            ? '⚠️ MISMATCH - Data may not have saved correctly!'
            : '✅ Values match',
      });
    }

    console.log('✅ [RECIPE EDITOR API] updateRecipeNutrition success', { recipeId });
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeNutrition error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update recipe metadata (prep_time, cook_time, servings, difficulty, cuisine, meal_types, diets, author)
 */
export async function updateRecipeMetadata(recipeId, metadata) {
  console.log('📝 [RECIPE EDITOR API] updateRecipeMetadata called', { recipeId, metadata });
  try {
    const updateData = {
      ...metadata,
      source: 'recipe_editor', // IMPORTANT: Override source to prevent CSV rehydration
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', recipeId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ [RECIPE EDITOR API] updateRecipeMetadata success', { recipeId });
    return { success: true, data };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeMetadata error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recipe steps
 */
export async function getRecipeSteps(recipeId) {
  try {
    const { data, error } = await supabase
      .from('recipe_steps')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching recipe steps:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Update a single recipe step
 */
export async function updateRecipeStep(stepId, instruction) {
  try {
    const { data, error } = await supabase
      .from('recipe_steps')
      .update({ instruction })
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating recipe step:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update all recipe steps at once
 */
export async function updateRecipeSteps(recipeId, steps) {
  console.log('📋 [RECIPE EDITOR API] updateRecipeSteps called', {
    recipeId,
    stepsCount: steps.length,
  });
  try {
    // Filter out empty/invalid steps
    const validSteps = steps.filter(step => {
      const instruction = typeof step === 'string' ? step.trim() : step?.instruction?.trim() || '';
      return instruction.length > 0;
    });

    if (validSteps.length === 0) {
      console.warn('⚠️ [RECIPE EDITOR API] No valid steps to insert');
      // Delete all existing steps if no valid steps provided
      await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);
      return { success: true, data: [] };
    }

    // Delete existing steps FIRST and verify deletion
    console.log('🗑️ [RECIPE EDITOR API] Deleting existing steps for recipe', recipeId);

    // First, get count of existing steps
    const { count: existingCount } = await supabase
      .from('recipe_steps')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    console.log('🔍 [RECIPE EDITOR API] Found existing steps to delete:', existingCount || 0);

    // Delete all existing steps
    const { error: deleteError } = await supabase
      .from('recipe_steps')
      .delete()
      .eq('recipe_id', recipeId);

    if (deleteError) throw deleteError;

    // Verify deletion completed by checking if any steps remain
    let retries = 0;
    let stepsRemain = true;
    while (stepsRemain && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      const { count: remainingCount } = await supabase
        .from('recipe_steps')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      stepsRemain = (remainingCount || 0) > 0;
      retries++;
      if (stepsRemain) {
        console.log(
          `⏳ [RECIPE EDITOR API] Waiting for deletion... (attempt ${retries}/10, remaining: ${remainingCount})`
        );
      }
    }

    if (stepsRemain) {
      throw new Error('Failed to delete existing steps after 10 retries');
    }

    console.log('✅ [RECIPE EDITOR API] Existing steps deleted and verified', {
      deletedCount: existingCount,
    });

    // Insert new steps with guaranteed unique sequential positions
    const stepsToInsert = validSteps.map((step, index) => ({
      recipe_id: recipeId,
      position: index + 1, // Sequential positions starting from 1
      instruction: typeof step === 'string' ? step.trim() : (step?.instruction || '').trim(),
      timer_seconds:
        step?.timer_seconds !== null && step?.timer_seconds !== undefined
          ? parseInt(step.timer_seconds)
          : 0,
    }));

    // Double-check positions are unique
    const positions = stepsToInsert.map(s => s.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      console.error('❌ [RECIPE EDITOR API] Duplicate positions detected!', { positions });
      // Fix: reassign positions sequentially
      stepsToInsert.forEach((step, index) => {
        step.position = index + 1;
      });
    }

    console.log('➕ [RECIPE EDITOR API] Inserting new steps', {
      count: stepsToInsert.length,
      positions: stepsToInsert.map(s => s.position),
    });
    const { data, error } = await supabase.from('recipe_steps').insert(stepsToInsert).select();

    if (error) {
      // If batch insert fails due to duplicate positions, verify deletion and retry
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        console.warn(
          '⚠️ [RECIPE EDITOR API] Batch insert failed, checking database state:',
          error.message
        );

        // Check what steps actually exist in the database
        const { data: existingSteps, error: checkError } = await supabase
          .from('recipe_steps')
          .select('position')
          .eq('recipe_id', recipeId)
          .order('position');

        if (checkError) {
          console.error('❌ [RECIPE EDITOR API] Error checking existing steps:', checkError);
          throw new Error(`Failed to check existing steps: ${checkError.message}`);
        }

        if (existingSteps && existingSteps.length > 0) {
          console.warn(
            `⚠️ [RECIPE EDITOR API] Found ${existingSteps.length} existing steps that should have been deleted. Attempting delete again...`
          );

          // Try deleting again
          const { error: retryDeleteError } = await supabase
            .from('recipe_steps')
            .delete()
            .eq('recipe_id', recipeId);

          if (retryDeleteError) {
            throw new Error(
              `Failed to delete existing steps on retry: ${retryDeleteError.message}`
            );
          }

          // Wait and verify deletion again
          await new Promise(resolve => setTimeout(resolve, 200));
          const { count: stillExisting } = await supabase
            .from('recipe_steps')
            .select('*', { count: 'exact', head: true })
            .eq('recipe_id', recipeId);

          if (stillExisting && stillExisting > 0) {
            throw new Error(
              `Steps still exist after retry delete. This may be a database constraint or RLS issue.`
            );
          }

          // Now retry the batch insert
          console.log('🔄 [RECIPE EDITOR API] Retrying batch insert after cleanup...');
          const { data: retryData, error: retryError } = await supabase
            .from('recipe_steps')
            .insert(stepsToInsert)
            .select();

          if (retryError) {
            throw new Error(`Failed to insert steps after cleanup: ${retryError.message}`);
          }

          // Update recipe
          await supabase
            .from('recipes')
            .update({
              source: 'recipe_editor',
              updated_at: new Date().toISOString(),
            })
            .eq('id', recipeId);

          console.log('✅ [RECIPE EDITOR API] Steps inserted successfully after cleanup', {
            recipeId,
            stepsInserted: retryData?.length,
          });
          return { success: true, data: retryData };
        } else {
          // No existing steps, but insert still failed - this is strange
          throw new Error(
            `Insert failed but no existing steps found. Database constraint issue: ${error.message}`
          );
        }
      } else {
        throw error;
      }
    }

    // Update recipe updated_at and mark as edited via Recipe Editor
    await supabase
      .from('recipes')
      .update({
        source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    console.log('✅ [RECIPE EDITOR API] updateRecipeSteps success', {
      recipeId,
      stepsInserted: data?.length,
    });
    return { success: true, data };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeSteps error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get full recipe data for editing
 */
export async function getRecipeForEditing(recipeId) {
  console.log('📖 [RECIPE EDITOR API] getRecipeForEditing called', { recipeId });
  try {
    // Get recipe
    console.log('🔍 [RECIPE EDITOR API] Fetching recipe data...');
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (recipeError) throw recipeError;
    console.log('✅ [RECIPE EDITOR API] Recipe fetched', { recipeId, title: recipe?.title });

    // Get steps
    console.log('🔍 [RECIPE EDITOR API] Fetching steps...');
    const { data: steps, error: stepsError } = await supabase
      .from('recipe_steps')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true });

    if (stepsError) throw stepsError;
    console.log('✅ [RECIPE EDITOR API] Steps fetched', { count: steps?.length || 0 });

    // Get ingredients
    console.log('🔍 [RECIPE EDITOR API] Fetching ingredients...');
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select(
        `
                *,
                ingredient:ingredients(*)
            `
      )
      .eq('recipe_id', recipeId)
      .order('id', { ascending: true });

    if (ingredientsError) throw ingredientsError;
    console.log('✅ [RECIPE EDITOR API] Ingredients fetched', { count: ingredients?.length || 0 });

    // Get nutrition data
    console.log('🔍 [RECIPE EDITOR API] Fetching nutrition data...');
    const { data: nutrition, error: nutritionError } = await supabase
      .from('recipe_nutrition')
      .select(
        'calories, protein, fat, carbs, fiber, sugar, sodium, cholesterol, saturated_fat, trans_fat, vitamin_a, vitamin_c, vitamin_d, potassium, calcium, iron'
      )
      .eq('recipe_id', recipeId)
      .single();

    if (nutritionError && nutritionError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.warn('⚠️ [RECIPE EDITOR API] Nutrition fetch error (non-critical):', nutritionError);
    }
    console.log('✅ [RECIPE EDITOR API] Nutrition fetched', { hasNutrition: !!nutrition });

    const result = {
      success: true,
      data: {
        recipe,
        steps: steps || [],
        ingredients: ingredients || [],
        nutrition: nutrition || null,
      },
    };
    console.log('✅ [RECIPE EDITOR API] getRecipeForEditing success', {
      recipeId,
      hasRecipe: !!recipe,
      stepsCount: steps?.length || 0,
      ingredientsCount: ingredients?.length || 0,
      hasNutrition: !!nutrition,
    });
    return result;
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] getRecipeForEditing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search recipes by title (for finding recipes to edit)
 * Improved search that checks both title and description
 */
export async function searchRecipesForEditing(query, limit = 50) {
  console.log('🔍 [RECIPE EDITOR API] searchRecipesForEditing called', { query, limit });
  try {
    // Normalize query - trim and handle multiple words
    const normalizedQuery = query.trim().toLowerCase();
    const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

    console.log('🔍 [RECIPE EDITOR API] Search terms extracted', { normalizedQuery, searchTerms });

    if (searchTerms.length === 0) {
      console.log('⚠️ [RECIPE EDITOR API] Empty search query');
      return { success: true, data: [] };
    }

    // Build search query - search in both title and description
    // Use OR to match if query appears in title OR description
    const queryPattern = `%${normalizedQuery}%`;

    console.log('🔍 [RECIPE EDITOR API] Executing search', { queryPattern, searchTerms });

    // Strategy 1: Try exact phrase match first (fastest and most accurate)
    let { data, error } = await supabase
      .from('recipes')
      .select('id, title, hero_image_url, description')
      .or(`title.ilike.${queryPattern},description.ilike.${queryPattern}`)
      .order('updated_at', { ascending: false })
      .limit(limit);

    // Strategy 2: If no exact phrase match, try flexible matching (all terms must be present)
    // This handles cases like searching "marshmallow peanut chocolate" and finding "marshmallow peanut chocolate squares"
    if ((!data || data.length === 0) && !error && searchTerms.length > 1) {
      console.log('🔍 [RECIPE EDITOR API] No exact phrase match, trying flexible term matching');

      // Build OR conditions for each term (recipe must match at least one term in title OR description)
      // Then we'll filter client-side to ensure ALL terms are present
      const termConditions = searchTerms
        .filter(term => term.length > 2) // Filter out very short terms
        .map(term => `title.ilike.%${term}%,description.ilike.%${term}%`);

      if (termConditions.length > 0) {
        const { data: flexibleData, error: flexibleError } = await supabase
          .from('recipes')
          .select('id, title, hero_image_url, description')
          .or(termConditions.join(','))
          .order('updated_at', { ascending: false })
          .limit(limit * 2); // Get more results to filter from

        if (!flexibleError && flexibleData && flexibleData.length > 0) {
          // Filter to ensure ALL search terms are present in title or description
          const filtered = flexibleData.filter(recipe => {
            const titleLower = (recipe.title || '').toLowerCase();
            const descLower = (recipe.description || '').toLowerCase();
            const combined = `${titleLower} ${descLower}`;
            // Check if ALL search terms are present (case-insensitive)
            return searchTerms.every(term => combined.includes(term));
          });

          if (filtered.length > 0) {
            console.log('✅ [RECIPE EDITOR API] Flexible search found results', {
              beforeFilter: flexibleData.length,
              afterFilter: filtered.length,
              terms: searchTerms,
            });
            // Limit to requested limit
            data = filtered.slice(0, limit);
          }
        }
      }
    }

    // If no results, try searching for individual important terms
    // But prioritize recipes that match MORE terms
    if ((!data || data.length === 0) && searchTerms.length > 1) {
      console.log('🔍 [RECIPE EDITOR API] No results with full query, trying individual terms');
      // Filter out common words and short terms
      const importantTerms = searchTerms.filter(
        term =>
          term.length > 2 && !['with', 'the', 'and', 'for', 'from', 'are', 'was'].includes(term)
      );

      if (importantTerms.length > 0) {
        // Search for recipes that contain ANY of the important terms
        const termConditions = importantTerms.map(
          term => `title.ilike.%${term}%,description.ilike.%${term}%`
        );

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recipes')
          .select('id, title, hero_image_url, description')
          .or(termConditions.join(','))
          .order('updated_at', { ascending: false })
          .limit(limit * 3); // Get more results to sort and filter

        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          // Score and sort results by how many terms they match
          const scored = fallbackData.map(recipe => {
            const titleLower = (recipe.title || '').toLowerCase();
            const descLower = (recipe.description || '').toLowerCase();
            const combined = `${titleLower} ${descLower}`;

            // Count how many terms match
            const matchCount = importantTerms.filter(term => combined.includes(term)).length;
            const titleMatchCount = importantTerms.filter(term => titleLower.includes(term)).length;

            // Bonus points if all terms match in title
            const allTermsInTitle = importantTerms.every(term => titleLower.includes(term));
            const allTermsBonus = allTermsInTitle ? 10 : 0;

            // Bonus points if title contains common recipe suffixes (squares, bars, cookies, etc.)
            const hasRecipeSuffix = /(square|bar|cookie|brownie|cake|pie|tart|muffin|bread)/i.test(
              titleLower
            );
            const suffixBonus = hasRecipeSuffix ? 5 : 0;

            return {
              ...recipe,
              _matchScore: matchCount,
              _titleMatchScore: titleMatchCount,
              _allTermsInTitle: allTermsInTitle,
              _hasSuffix: hasRecipeSuffix,
              _totalScore: matchCount + titleMatchCount + allTermsBonus + suffixBonus,
            };
          });

          // Sort by total score (highest first)
          scored.sort((a, b) => {
            if (b._totalScore !== a._totalScore) {
              return b._totalScore - a._totalScore;
            }
            if (b._matchScore !== a._matchScore) {
              return b._matchScore - a._matchScore;
            }
            if (b._titleMatchScore !== a._titleMatchScore) {
              return b._titleMatchScore - a._titleMatchScore;
            }
            return 0; // Keep original order for same scores
          });

          // Remove scoring fields before returning
          const sortedResults = scored.map(
            ({
              _matchScore,
              _titleMatchScore,
              _allTermsInTitle,
              _hasSuffix,
              _totalScore,
              ...recipe
            }) => recipe
          );

          // Log detailed top matches for debugging
          const topMatches = sortedResults.slice(0, 20).map((r, idx) => {
            const titleLower = (r.title || '').toLowerCase();
            const descLower = (r.description || '').toLowerCase();
            const combined = `${titleLower} ${descLower}`;
            const matchingTerms = importantTerms.filter(t => combined.includes(t));
            const originalScore = scored[idx];
            return {
              rank: idx + 1,
              title: r.title,
              titleMatches: importantTerms.filter(t => titleLower.includes(t)).length,
              totalMatches: matchingTerms.length,
              matchingTerms: matchingTerms,
              hasAllTerms: importantTerms.every(t => combined.includes(t)),
              allTermsInTitle: importantTerms.every(t => titleLower.includes(t)),
              hasSuffix: /(square|bar|cookie|brownie|cake|pie|tart|muffin|bread)/i.test(titleLower),
              score: originalScore?._totalScore || 0,
            };
          });

          // Check if any result contains "squares" (common suffix)
          const squaresMatches = sortedResults.filter(r => {
            const titleLower = (r.title || '').toLowerCase();
            return (
              titleLower.includes('square') && importantTerms.every(t => titleLower.includes(t))
            );
          });

          console.log('✅ [RECIPE EDITOR API] Fallback search found and sorted results', {
            count: sortedResults.length,
            termsUsed: importantTerms,
            topMatches: topMatches,
            squaresMatches: squaresMatches.slice(0, 10).map(r => r.title),
            note: `Showing top ${Math.min(limit, sortedResults.length)} of ${sortedResults.length} results`,
          });

          return { success: true, data: sortedResults.slice(0, limit) };
        }
      }
    }

    if (error) throw error;

    // Log detailed results for debugging
    const resultTitles = (data || []).map(r => r.title);
    const matchingTitles = resultTitles.filter(title => {
      const titleLower = (title || '').toLowerCase();
      return searchTerms.some(term => titleLower.includes(term));
    });

    console.log('✅ [RECIPE EDITOR API] searchRecipesForEditing success', {
      query,
      searchTerms,
      resultsCount: data?.length || 0,
      sampleTitles: resultTitles.slice(0, 5),
      allTitles: resultTitles,
      matchingTitles: matchingTitles.slice(0, 10),
      note:
        matchingTitles.length < resultTitles.length
          ? `⚠️ Some results may not match all search terms`
          : '✅ All results match search terms',
    });

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] searchRecipesForEditing error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Update recipe ingredients
 * Handles finding/creating ingredients by name
 */
export async function updateRecipeIngredients(recipeId, ingredients) {
  console.log('🥘 [RECIPE EDITOR API] updateRecipeIngredients called', {
    recipeId,
    ingredientsCount: ingredients.length,
  });
  console.log(
    '🥘 [RECIPE EDITOR API] Ingredients structure sample:',
    ingredients.length > 0
      ? {
          firstIngredient: ingredients[0],
          keys: Object.keys(ingredients[0] || {}),
          hasIngredientName: 'ingredient_name' in (ingredients[0] || {}),
        }
      : 'No ingredients'
  );
  try {
    // Delete existing ingredients and verify deletion
    console.log('🗑️ [RECIPE EDITOR API] Deleting existing ingredients for recipe', recipeId);

    // First, get count of existing ingredients
    const { count: existingCount } = await supabase
      .from('recipe_ingredients')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    console.log('🔍 [RECIPE EDITOR API] Found existing ingredients to delete:', existingCount || 0);

    // Delete all existing ingredients
    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    if (deleteError) throw deleteError;

    // Verify deletion completed by checking if any ingredients remain
    let retries = 0;
    let ingredientsRemain = true;
    while (ingredientsRemain && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      const { count: remainingCount } = await supabase
        .from('recipe_ingredients')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      ingredientsRemain = (remainingCount || 0) > 0;
      retries++;
      if (ingredientsRemain) {
        console.log(
          `⏳ [RECIPE EDITOR API] Waiting for ingredient deletion... (attempt ${retries}/10, remaining: ${remainingCount})`
        );
      }
    }

    if (ingredientsRemain) {
      throw new Error('Failed to delete existing ingredients after 10 retries');
    }

    console.log('✅ [RECIPE EDITOR API] Existing ingredients deleted and verified', {
      deletedCount: existingCount,
    });

    // Process each ingredient - find or create ingredient by name
    const ingredientsToInsert = [];

    for (let index = 0; index < ingredients.length; index++) {
      const ing = ingredients[index];

      console.log(
        `🔍 [RECIPE EDITOR API] Processing ingredient ${index + 1}/${ingredients.length}`,
        {
          ingredient: ing,
          hasIngredientName: 'ingredient_name' in ing,
          ingredientName: ing.ingredient_name,
          ingredientNameValue: ing?.ingredient_name,
        }
      );

      // Skip empty ingredients
      if (!ing.ingredient_name || !ing.ingredient_name.trim()) {
        console.log(
          `⚠️ [RECIPE EDITOR API] Skipping ingredient ${index + 1} - no ingredient_name`,
          ing
        );
        continue;
      }

      let ingredientId = ing.ingredient_id;

      // If no ingredient_id, try to find by name
      if (!ingredientId && ing.ingredient_name) {
        const ingredientName = ing.ingredient_name.trim();
        console.log('🔍 [RECIPE EDITOR API] Looking for ingredient:', ingredientName);

        const { data: existingIng, error: findError } = await supabase
          .from('ingredients')
          .select('id')
          .ilike('name', ingredientName)
          .limit(1)
          .maybeSingle();

        if (findError && findError.code !== 'PGRST116') {
          console.error('❌ [RECIPE EDITOR API] Error finding ingredient:', findError);
        }

        if (!findError && existingIng) {
          ingredientId = existingIng.id;
          console.log('✅ [RECIPE EDITOR API] Found existing ingredient', {
            name: ingredientName,
            id: ingredientId,
          });
        } else {
          // Create new ingredient if not found
          // Need to provide default_unit (required field) - use "g" as default
          console.log('➕ [RECIPE EDITOR API] Creating new ingredient:', ingredientName);
          const { data: newIng, error: createError } = await supabase
            .from('ingredients')
            .insert({
              name: ingredientName,
              default_unit: 'g', // Required field - default to grams
            })
            .select()
            .single();

          if (!createError && newIng) {
            ingredientId = newIng.id;
            console.log('✅ [RECIPE EDITOR API] Created new ingredient', {
              name: ingredientName,
              id: ingredientId,
            });
          } else {
            console.error('❌ [RECIPE EDITOR API] Failed to create ingredient:', createError);
            console.error('❌ [RECIPE EDITOR API] Ingredient details:', {
              name: ingredientName,
              error: createError,
            });
          }
        }
      }

      console.log('🔍 [RECIPE EDITOR API] Ingredient processing result', {
        index,
        ingredient_name: ing.ingredient_name,
        hasIngredientId: !!ingredientId,
        ingredientId: ingredientId,
      });

      // Parse quantity properly - must be a number (0 if empty/null)
      let quantityValue = 0; // Default to 0 instead of null (required by constraint)
      if (ing.quantity) {
        const qtyStr = String(ing.quantity).trim();
        if (qtyStr && qtyStr !== '') {
          const parsed = parseFloat(qtyStr);
          if (!isNaN(parsed)) {
            quantityValue = parsed;
          }
        }
      }

      // Insert if we have an ingredient_id (required) and ingredient_name
      if (ingredientId && ing.ingredient_name && ing.ingredient_name.trim()) {
        ingredientsToInsert.push({
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          quantity: quantityValue, // Always a number (0 if not provided)
          unit: ing.unit && ing.unit.trim() ? ing.unit.trim() : '', // Empty string instead of null (required by constraint)
          preparation: ing.preparation && ing.preparation.trim() ? ing.preparation.trim() : '', // Empty string instead of null (required field)
          order_index: index + 1,
        });
      } else {
        console.warn('⚠️ [RECIPE EDITOR API] Skipping ingredient - missing ingredient_id or name', {
          ingredient_name: ing.ingredient_name,
          hasIngredientId: !!ingredientId,
        });
      }
    }

    if (ingredientsToInsert.length > 0) {
      console.log('➕ [RECIPE EDITOR API] Inserting recipe ingredients', {
        count: ingredientsToInsert.length,
      });
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)
        .select();

      if (error) {
        // If duplicate constraint error, verify deletion and retry
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.warn(
            '⚠️ [RECIPE EDITOR API] Ingredients insert failed, checking database state:',
            error.message
          );

          // Check what ingredients actually exist
          const { data: existingIngredients, error: checkError } = await supabase
            .from('recipe_ingredients')
            .select('*')
            .eq('recipe_id', recipeId);

          if (checkError) {
            console.error(
              '❌ [RECIPE EDITOR API] Error checking existing ingredients:',
              checkError
            );
            throw new Error(`Failed to check existing ingredients: ${checkError.message}`);
          }

          if (existingIngredients && existingIngredients.length > 0) {
            console.warn(
              `⚠️ [RECIPE EDITOR API] Found ${existingIngredients.length} existing ingredients that should have been deleted. Attempting delete again...`
            );

            // Try deleting again
            const { error: retryDeleteError } = await supabase
              .from('recipe_ingredients')
              .delete()
              .eq('recipe_id', recipeId);

            if (retryDeleteError) {
              throw new Error(
                `Failed to delete existing ingredients on retry: ${retryDeleteError.message}`
              );
            }

            // Wait and verify deletion again
            await new Promise(resolve => setTimeout(resolve, 200));
            const { count: stillExisting } = await supabase
              .from('recipe_ingredients')
              .select('*', { count: 'exact', head: true })
              .eq('recipe_id', recipeId);

            if (stillExisting && stillExisting > 0) {
              throw new Error(
                `Ingredients still exist after retry delete. This may be a database constraint or RLS issue.`
              );
            }

            // Now retry the batch insert
            console.log('🔄 [RECIPE EDITOR API] Retrying ingredients insert after cleanup...');
            const { data: retryData, error: retryError } = await supabase
              .from('recipe_ingredients')
              .insert(ingredientsToInsert)
              .select();

            if (retryError) {
              throw new Error(`Failed to insert ingredients after cleanup: ${retryError.message}`);
            }

            console.log('✅ [RECIPE EDITOR API] Ingredients inserted successfully after cleanup', {
              count: retryData?.length,
            });
          } else {
            // No existing ingredients, but insert still failed
            throw new Error(
              `Insert failed but no existing ingredients found. Database constraint issue: ${error.message}`
            );
          }
        } else {
          throw error;
        }
      } else {
        console.log('✅ [RECIPE EDITOR API] Ingredients inserted', { count: data?.length });
      }
    } else {
      console.log('⚠️ [RECIPE EDITOR API] No valid ingredients to insert');
    }

    // Update recipe updated_at and mark as having complete nutrition if ingredients were saved
    const updateData = {
      source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
      updated_at: new Date().toISOString(),
    };

    // If we successfully inserted ingredients, mark recipe as having complete data
    if (ingredientsToInsert.length > 0) {
      updateData.has_complete_nutrition = true;
      console.log('✅ [RECIPE EDITOR API] Marking recipe as having complete nutrition');
    }

    await supabase.from('recipes').update(updateData).eq('id', recipeId);

    console.log('✅ [RECIPE EDITOR API] updateRecipeIngredients success', {
      recipeId,
      ingredientsInserted: ingredientsToInsert.length,
    });
    return { success: true, data: ingredientsToInsert };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] updateRecipeIngredients error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all recipes for browsing (paginated)
 */
export async function getAllRecipesForEditing(page = 1, pageSize = 24) {
  console.log('📚 [RECIPE EDITOR API] getAllRecipesForEditing called', { page, pageSize });
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log('🔍 [RECIPE EDITOR API] Fetching recipes', { from, to });
    const { data, error, count } = await supabase
      .from('recipes')
      .select('id, title, hero_image_url, description, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const result = {
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
    console.log('✅ [RECIPE EDITOR API] getAllRecipesForEditing success', {
      page,
      resultsCount: data?.length || 0,
      total: count || 0,
      totalPages: result.totalPages,
    });
    return result;
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] getAllRecipesForEditing error:', error);
    return { success: false, error: error.message, data: [], total: 0 };
  }
}

/**
 * Get recipes for bulk editing (includes all editable fields)
 * @param {number} limit - Maximum number of recipes to return
 * @param {boolean} needsReviewOnly - If true, only return recipes without images (likely need work)
 */
export async function getRecipesForBulkEditing(limit = 100, needsReviewOnly = false) {
  console.log('📚 [RECIPE EDITOR API] getRecipesForBulkEditing called', { limit, needsReviewOnly });
  try {
    let query = supabase
      .from('recipes')
      .select(
        'id, title, description, prep_minutes, cook_minutes, servings, difficulty, author, hero_image_url'
      )
      .order('updated_at', { ascending: false });

    // Filter to only recipes without images if needsReviewOnly is true
    if (needsReviewOnly) {
      query = query.or('hero_image_url.is.null,hero_image_url.eq.');
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    // Keep hero_image_url in response if needsReviewOnly is true (user wants to see image status)
    const cleanedData = needsReviewOnly
      ? data || [] // Keep all fields including hero_image_url when filtering
      : (data || []).map(({ hero_image_url: _hero_image_url, ...rest }) => rest); // Remove it otherwise

    console.log('✅ [RECIPE EDITOR API] getRecipesForBulkEditing success', {
      resultsCount: cleanedData?.length || 0,
      needsReviewOnly,
    });
    return { success: true, data: cleanedData || [] };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] getRecipesForBulkEditing error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * ULTRA-OPTIMIZED Image Compression - Handles ALL images, especially large ones (16-22MB)
 * CRITICAL: Converts all formats to JPEG and aggressively compresses to ≤100KB for PWA performance
 * IMPROVED: Better quality preservation with smarter compression algorithm
 */
async function compressImageToJPEG(file, maxSizeKB = 100) {
  const originalSizeMB = file.size / (1024 * 1024);
  const originalSizeKB = file.size / 1024;

  if (import.meta.env.DEV) {
    console.log('🔄 [IMAGE COMPRESSION] Starting compression', {
      originalSize: `${originalSizeMB.toFixed(2)}MB (${originalSizeKB.toFixed(0)}KB)`,
      targetSize: `${maxSizeKB}KB`,
    });
  }

  // Smart initial settings based on file size
  let targetWidth = 1024;
  let targetHeight = 1024;
  let initialQuality = 0.82; // Slightly lower for better compression

  if (originalSizeMB > 15) {
    // Extremely large files (16MB+): very aggressive
    targetWidth = 800;
    targetHeight = 800;
    initialQuality = 0.6;
    maxSizeKB = 90;
  } else if (originalSizeMB > 10) {
    // Very large files (10-15MB): aggressive
    targetWidth = 900;
    targetHeight = 900;
    initialQuality = 0.65;
    maxSizeKB = 95;
  } else if (originalSizeMB > 5) {
    // Large files (5-10MB): moderate
    targetWidth = 950;
    targetHeight = 950;
    initialQuality = 0.72;
  } else if (originalSizeMB > 2) {
    // Medium files (2-5MB): light compression
    targetWidth = 1000;
    targetHeight = 1000;
    initialQuality = 0.78;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;

        // Scale down if larger than target (maintain aspect ratio)
        if (width > targetWidth || height > targetHeight) {
          if (width > height) {
            width = targetWidth;
            height = Math.round(targetWidth / aspectRatio);
          } else {
            height = targetHeight;
            width = Math.round(targetHeight * aspectRatio);
          }
        }

        // Ensure minimum dimensions for quality
        width = Math.max(400, width);
        height = Math.max(400, height);

        canvas.width = width;
        canvas.height = height;

        // Optimize canvas rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);

        // Binary search for optimal quality to hit target size
        let quality = initialQuality;
        let attempts = 0;
        const maxAttempts = 15;
        let minQuality = 0.3;
        let maxQuality = 0.95;
        let bestBlob = null;
        let bestQuality = quality;

        const tryCompress = () => {
          attempts++;

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If we're within 5% of target, accept it
              if (sizeKB <= maxSizeKB * 1.05) {
                const finalSizeMB = blob.size / (1024 * 1024);
                const reduction = (((originalSizeMB - finalSizeMB) / originalSizeMB) * 100).toFixed(
                  1
                );

                if (import.meta.env.DEV) {
                  console.log('✅ [IMAGE COMPRESSION] Success', {
                    original: `${originalSizeMB.toFixed(2)}MB (${originalSizeKB.toFixed(0)}KB)`,
                    compressed: `${finalSizeMB.toFixed(2)}MB (${sizeKB.toFixed(0)}KB)`,
                    reduction: `${reduction}%`,
                    quality: quality.toFixed(2),
                    dimensions: `${canvas.width}x${canvas.height}`,
                    attempts,
                  });
                }

                resolve(blob);
                return;
              }

              // Binary search: adjust quality based on current size
              if (sizeKB > maxSizeKB) {
                // Too large: reduce quality
                maxQuality = quality;
                quality = (quality + minQuality) / 2;
              } else {
                // Too small: increase quality (but we want to stay under limit)
                bestBlob = blob;
                bestQuality = quality;
                minQuality = quality;
                quality = (quality + maxQuality) / 2;
              }

              // If still too large after many attempts, resize more aggressively
              if (sizeKB > maxSizeKB * 1.5 && attempts >= 8) {
                const scale = Math.sqrt((maxSizeKB * 0.9) / sizeKB);
                const newWidth = Math.max(400, Math.floor(width * scale));
                const newHeight = Math.max(400, Math.floor(height * scale));
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                width = newWidth;
                height = newHeight;
                quality = 0.65; // Reset quality after resize
                minQuality = 0.3;
                maxQuality = 0.85;
              }

              // If we've tried enough times, use best result or current
              if (attempts >= maxAttempts) {
                const finalBlob = bestBlob || blob;
                const finalSizeMB = finalBlob.size / (1024 * 1024);
                const finalSizeKB = finalBlob.size / 1024;
                const reduction = (((originalSizeMB - finalSizeMB) / originalSizeMB) * 100).toFixed(
                  1
                );

                if (import.meta.env.DEV) {
                  console.warn('⚠️ [IMAGE COMPRESSION] Max attempts reached', {
                    original: `${originalSizeMB.toFixed(2)}MB (${originalSizeKB.toFixed(0)}KB)`,
                    compressed: `${finalSizeMB.toFixed(2)}MB (${finalSizeKB.toFixed(0)}KB)`,
                    reduction: `${reduction}%`,
                    quality: bestQuality.toFixed(2),
                    dimensions: `${canvas.width}x${canvas.height}`,
                    attempts,
                    targetMet: finalSizeKB <= maxSizeKB,
                  });
                }

                resolve(finalBlob);
                return;
              }

              // Try again with adjusted quality
              tryCompress();
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image file to Supabase storage and return URL
 * CRITICAL: Converts PNG to JPEG and compresses to ≤100KB for PWA performance
 */
export async function uploadRecipeImage(recipeId, imageFile) {
  console.log('📤 [RECIPE EDITOR API] uploadRecipeImage called', {
    recipeId,
    fileName: imageFile.name,
    fileSize: imageFile.size,
    fileSizeKB: (imageFile.size / 1024).toFixed(2),
    fileType: imageFile.type,
  });

  try {
    const fileType = imageFile.type.toLowerCase();
    const originalFileName = imageFile.name.toLowerCase();
    const originalSizeMB = imageFile.size / (1024 * 1024);
    const isPNG = fileType.includes('png') || originalFileName.endsWith('.png');
    const isJPEG =
      fileType.includes('jpeg') ||
      fileType.includes('jpg') ||
      originalFileName.endsWith('.jpg') ||
      originalFileName.endsWith('.jpeg');

    // CRITICAL: ALWAYS compress ALL images to ≤100KB for optimal PWA performance
    // This ensures consistent file sizes and faster loading across the entire app
    const shouldCompress = true; // Always compress, no exceptions

    if (shouldCompress) {
      console.warn('⚠️ [RECIPE EDITOR API] Compressing image to JPEG ≤100KB...', {
        originalSize: `${originalSizeMB.toFixed(2)}MB (${(imageFile.size / 1024).toFixed(0)}KB)`,
        isPNG,
        isJPEG,
        reason: originalSizeMB > 1 ? 'Large file' : isPNG ? 'PNG format' : 'Size > 100KB',
      });

      const compressedBlob = await compressImageToJPEG(imageFile, 100);
      const finalSizeKB = (compressedBlob.size / 1024).toFixed(2);

      console.log('✅ [RECIPE EDITOR API] Image compressed', {
        originalSize: `${(imageFile.size / 1024).toFixed(2)}KB`,
        compressedSize: `${finalSizeKB}KB`,
        reduction: `${((1 - compressedBlob.size / imageFile.size) * 100).toFixed(1)}%`,
        format: 'JPEG',
      });

      // Create File object from compressed blob
      let finalCompressedBlob = compressedBlob;
      let finalCompressedFile = new File([compressedBlob], `${recipeId}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // If still over 100KB, try one more aggressive compression pass
      if (compressedBlob.size > 100 * 1024) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [RECIPE EDITOR API] Image still exceeds 100KB after compression', {
            size: `${finalSizeKB}KB`,
            target: '100KB',
            exceededBy: `${(compressedBlob.size - 100 * 1024).toFixed(0)} bytes`,
          });
        }
        // Try one more aggressive compression pass
        const recompressed = await compressImageToJPEG(finalCompressedFile, 95);
        if (recompressed.size <= 100 * 1024 && recompressed.size < compressedBlob.size) {
          if (import.meta.env.DEV) {
            console.log('✅ [RECIPE EDITOR API] Recompression successful, now under 100KB');
          }
          finalCompressedBlob = recompressed;
          finalCompressedFile = new File([recompressed], `${recipeId}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
        }
      }

      const fileNameFinal = `${recipeId}.jpg`;

      if (import.meta.env.DEV) {
        console.log('📤 [RECIPE EDITOR API] Uploading compressed JPEG to storage', {
          fileName: fileNameFinal,
          finalSize: `${(finalCompressedBlob.size / 1024).toFixed(2)}KB`,
          targetMet: finalCompressedBlob.size <= 100 * 1024,
        });
      }
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileNameFinal, finalCompressedFile, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;
      if (import.meta.env.DEV) {
        console.log('✅ [RECIPE EDITOR API] Compressed JPEG uploaded to storage', {
          fileName: fileNameFinal,
          finalSize: `${(finalCompressedBlob.size / 1024).toFixed(2)}KB`,
          targetMet: finalCompressedBlob.size <= 100 * 1024,
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(fileNameFinal);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Update recipe with new image URL
      const updateResult = await updateRecipeImage(recipeId, publicUrl);
      return {
        success: updateResult.success,
        data: { url: publicUrl },
        error: updateResult.error,
      };
    }

    // ALWAYS compress images - even if they're already JPEG and small
    // This ensures consistent quality and size across all uploads
    if (import.meta.env.DEV) {
      console.log('📤 [RECIPE EDITOR API] Compressing all images for optimal performance...');
    }
    let compressedBlob = await compressImageToJPEG(imageFile, 100);
    let finalSizeKB = (compressedBlob.size / 1024).toFixed(2);

    // If still over 100KB, try more aggressive compression
    if (compressedBlob.size > 100 * 1024) {
      if (import.meta.env.DEV) {
        console.warn(
          '⚠️ [RECIPE EDITOR API] First compression exceeded 100KB, trying more aggressive...'
        );
      }
      const recompressed = await compressImageToJPEG(imageFile, 95);
      if (recompressed.size < compressedBlob.size) {
        compressedBlob = recompressed;
        finalSizeKB = (compressedBlob.size / 1024).toFixed(2);
      }
    }

    if (import.meta.env.DEV) {
      console.log('✅ [RECIPE EDITOR API] Image compressed', {
        originalSize: `${originalSizeMB.toFixed(2)}MB (${(imageFile.size / 1024).toFixed(0)}KB)`,
        compressedSize: `${finalSizeKB}KB`,
        reduction: `${((1 - compressedBlob.size / imageFile.size) * 100).toFixed(1)}%`,
        format: 'JPEG',
        targetMet: compressedBlob.size <= 100 * 1024,
      });
    }

    // Create File object from compressed blob
    const compressedFile = new File([compressedBlob], `${recipeId}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    const fileNameFinal = `${recipeId}.jpg`;

    if (import.meta.env.DEV) {
      console.log('📤 [RECIPE EDITOR API] Uploading compressed JPEG to storage', {
        fileName: fileNameFinal,
        finalSize: `${finalSizeKB}KB`,
        targetMet: compressedBlob.size <= 100 * 1024,
      });
    }
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileNameFinal, compressedFile, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;
    if (import.meta.env.DEV) {
      console.log('✅ [RECIPE EDITOR API] Compressed JPEG uploaded to storage', {
        fileName: fileNameFinal,
        finalSize: `${finalSizeKB}KB`,
        targetMet: compressedBlob.size <= 100 * 1024,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(fileNameFinal);
    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    // Update recipe with new image URL
    const updateResult = await updateRecipeImage(recipeId, publicUrl);
    return {
      success: updateResult.success,
      data: { url: publicUrl },
      error: updateResult.error,
    };
  } catch (error) {
    console.error('❌ [RECIPE EDITOR API] uploadRecipeImage error:', error);
    return { success: false, error: error.message };
  }
}
