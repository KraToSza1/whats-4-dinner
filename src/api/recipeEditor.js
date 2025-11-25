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
    const { data, error } = await supabase
      .from('recipes')
      .update({
        hero_image_url: imageUrl,
        source: 'recipe_editor', // IMPORTANT: Mark as edited via Recipe Editor - prevents CSV rehydration
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ [RECIPE EDITOR API] updateRecipeImage success', { recipeId });
    return { success: true, data };
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
    // If calories seem too high, warn the user
    if (nutritionToSave.calories > 0) {
      const caloriesPerServing = nutritionToSave.calories / (nutritionData.servings || 1);
      if (caloriesPerServing > 2000) {
        console.warn('⚠️ [RECIPE EDITOR API] WARNING: Calories per serving seems very high!', {
          totalCalories: nutritionToSave.calories,
          servings: nutritionData.servings || 1,
          caloriesPerServing: caloriesPerServing.toFixed(1),
          note: 'This might indicate the values were multiplied incorrectly',
        });
      }
      if (nutritionToSave.calories > 10000) {
        console.error(
          '❌ [RECIPE EDITOR API] ERROR: Total calories exceeds 10,000 - this is likely incorrect!',
          {
            totalCalories: nutritionToSave.calories,
            servings: nutritionData.servings || 1,
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
    // Delete existing steps
    console.log('🗑️ [RECIPE EDITOR API] Deleting existing steps for recipe', recipeId);
    const { error: deleteError } = await supabase
      .from('recipe_steps')
      .delete()
      .eq('recipe_id', recipeId);

    if (deleteError) throw deleteError;
    console.log('✅ [RECIPE EDITOR API] Existing steps deleted');

    // Insert new steps
    const stepsToInsert = steps.map((step, index) => ({
      recipe_id: recipeId,
      position: index + 1,
      instruction: step.instruction || step,
      timer_seconds:
        step.timer_seconds !== null && step.timer_seconds !== undefined
          ? parseInt(step.timer_seconds)
          : 0,
    }));

    console.log('➕ [RECIPE EDITOR API] Inserting new steps', { count: stepsToInsert.length });
    const { data, error } = await supabase.from('recipe_steps').insert(stepsToInsert).select();

    if (error) throw error;

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
    // Delete existing ingredients
    console.log('🗑️ [RECIPE EDITOR API] Deleting existing ingredients for recipe', recipeId);
    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    if (deleteError) throw deleteError;
    console.log('✅ [RECIPE EDITOR API] Existing ingredients deleted');

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

      if (error) throw error;
      console.log('✅ [RECIPE EDITOR API] Ingredients inserted', { count: data?.length });
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
 * Compress image to JPEG format and ensure ≤100KB for PWA performance
 * CRITICAL: PNG files kill PWA performance - must convert to JPEG ≤100KB
 */
async function compressImageToJPEG(file, maxSizeKB = 100) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas to 1024x1024 (required size)
        canvas.width = 1024;
        canvas.height = 1024;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, 1024, 1024);

        // Compress to JPEG with quality adjustment
        let quality = 0.85;
        let compressedBlob = null;

        const tryCompress = () => {
          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If too large, reduce quality and try again
              if (sizeKB > maxSizeKB && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
                return;
              }

              // If still too large, resize more aggressively
              if (sizeKB > maxSizeKB && quality <= 0.1) {
                // Try smaller dimensions
                const scale = Math.sqrt(maxSizeKB / sizeKB) * 0.9;
                canvas.width = Math.floor(1024 * scale);
                canvas.height = Math.floor(1024 * scale);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                quality = 0.7;
                tryCompress();
                return;
              }

              compressedBlob = blob;
              resolve(compressedBlob);
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
    const isPNG = fileType.includes('png') || originalFileName.endsWith('.png');
    const isJPEG =
      fileType.includes('jpeg') ||
      fileType.includes('jpg') ||
      originalFileName.endsWith('.jpg') ||
      originalFileName.endsWith('.jpeg');

    // CRITICAL: PNG files kill PWA performance - must convert to JPEG
    if (isPNG || (!isJPEG && imageFile.size > 100 * 1024)) {
      console.warn(
        '⚠️ [RECIPE EDITOR API] Large/PNG file detected - compressing to JPEG ≤100KB...',
        {
          originalSize: `${(imageFile.size / 1024).toFixed(2)}KB`,
          isPNG,
          isJPEG,
        }
      );

      const compressedBlob = await compressImageToJPEG(imageFile, 100);
      const finalSizeKB = (compressedBlob.size / 1024).toFixed(2);

      console.log('✅ [RECIPE EDITOR API] Image compressed', {
        originalSize: `${(imageFile.size / 1024).toFixed(2)}KB`,
        compressedSize: `${finalSizeKB}KB`,
        reduction: `${((1 - compressedBlob.size / imageFile.size) * 100).toFixed(1)}%`,
        format: 'JPEG',
      });

      if (compressedBlob.size > 100 * 1024) {
        console.warn('⚠️ [RECIPE EDITOR API] Image still exceeds 100KB after compression', {
          size: `${finalSizeKB}KB`,
        });
      }

      // Create File object from compressed blob
      const compressedFile = new File([compressedBlob], `${recipeId}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const fileNameFinal = `${recipeId}.jpg`;

      console.log('📤 [RECIPE EDITOR API] Uploading compressed JPEG to storage', {
        fileName: fileNameFinal,
      });
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileNameFinal, compressedFile, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;
      console.log('✅ [RECIPE EDITOR API] Compressed JPEG uploaded to storage', {
        fileName: fileNameFinal,
      });

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

    // If already JPEG and ≤100KB, upload as-is
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${recipeId}.${fileExt}`;

    console.log('📤 [RECIPE EDITOR API] Uploading JPEG to storage (no compression needed)', {
      fileName,
    });
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, imageFile, {
        upsert: true,
        contentType: imageFile.type,
      });

    if (uploadError) throw uploadError;
    console.log('✅ [RECIPE EDITOR API] File uploaded to storage', { fileName });

    // Get public URL
    const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }
    console.log('✅ [RECIPE EDITOR API] Got public URL', {
      publicUrl: publicUrl.substring(0, 50) + '...',
    });

    // Update recipe with new image URL
    console.log('🔄 [RECIPE EDITOR API] Updating recipe with new image URL');
    const updateResult = await updateRecipeImage(recipeId, publicUrl);

    console.log('✅ [RECIPE EDITOR API] uploadRecipeImage success', {
      recipeId,
      success: updateResult.success,
    });
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
