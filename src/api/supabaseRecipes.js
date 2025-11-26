import { supabase } from '../lib/supabaseClient';
import { isUuid } from '../utils/img.ts';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const STORAGE_BUCKET = 'recipe-images';

const supabaseLog = (stage, payload = {}) => {
  // Only log in dev mode if explicitly enabled via localStorage
  if (import.meta.env.DEV && localStorage.getItem('debug:supabase') === 'true') {
    console.debug(`[Supabase] ${stage}`, payload);
  }
  // Always log errors
  if (stage.includes('error')) {
    console.error(`[Supabase] ${stage}`, payload);
  }
};

const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

const NUTRITION_COLUMNS = [
  'calories',
  'protein',
  'fat',
  'carbs',
  'fiber',
  'sugar',
  'sodium',
  'cholesterol',
  'saturated_fat',
  'trans_fat',
  'vitamin_a',
  'vitamin_c',
  'vitamin_d',
  'potassium',
  'calcium',
  'iron',
];

function rehydrateCsvNutrition(nutritionRow, recipeRow) {
  if (!nutritionRow || !recipeRow) return nutritionRow;
  if (recipeRow.source !== 'csv_import') return nutritionRow;

  const servings = Number(recipeRow.servings);
  // Validate servings: must be finite, positive, and > 1 (since we're scaling from per-serving to total)
  if (!Number.isFinite(servings) || servings <= 1 || servings <= 0) return nutritionRow;

  // IMPORTANT: Check if values are already totals (not per-serving)
  // If calories per serving would be > 2000, the values are likely already totals
  // This prevents double-scaling recipes that were edited via Recipe Editor
  const calories = Number(nutritionRow.calories);
  if (calories && Number.isFinite(calories) && servings > 0) {
    const caloriesPerServing = calories / servings;
    // If calories per serving > 2000, values are likely already totals (don't rehydrate)
    // Also check if calories > 5000 total (definitely already totals)
    if (caloriesPerServing > 2000 || calories > 5000) {
      if (import.meta.env.DEV) {
        console.log(
          '⚠️ [NUTRITION REHYDRATION] Skipping rehydration - values appear to be totals already:',
          {
            recipeId: recipeRow.id,
            calories,
            servings,
            caloriesPerServing: caloriesPerServing.toFixed(1),
            note: 'Recipe was likely edited via Recipe Editor and already has total values',
          }
        );
      }
      return nutritionRow; // Return unchanged - values are already totals
    }
  }

  const scaled = { ...nutritionRow };
  let changed = false;

  NUTRITION_COLUMNS.forEach(column => {
    if (scaled[column] === null || scaled[column] === undefined) return;
    const numeric = Number(scaled[column]);
    // Only scale if value is finite and valid
    if (!Number.isFinite(numeric)) return;
    const scaledValue = numeric * servings;
    // Ensure scaled value is valid before assigning
    if (Number.isFinite(scaledValue)) {
      scaled[column] = scaledValue;
      changed = true;
    }
  });

  if (changed) {
    supabaseLog('nutrition:rehydrated', {
      recipeId: recipeRow.id,
      servings,
    });

    // Validate nutrition realism (only if we have calories)
    if (scaled.calories && Number.isFinite(scaled.calories) && servings > 0) {
      const caloriesPerServing = scaled.calories / servings;
      const expectedCalories =
        (scaled.protein || 0) * 4 + (scaled.carbs || 0) * 4 + (scaled.fat || 0) * 9;
      const calorieDiff = Math.abs(scaled.calories - expectedCalories);

      if (
        caloriesPerServing < 50 ||
        caloriesPerServing > 2000 ||
        calorieDiff > scaled.calories * 0.3
      ) {
        console.warn('⚠️ [NUTRITION VALIDATION] Unrealistic nutrition values detected:', {
          recipeId: recipeRow.id,
          recipeTitle: recipeRow.title,
          caloriesPerServing: caloriesPerServing.toFixed(1),
          totalCalories: scaled.calories,
          expectedCalories: expectedCalories.toFixed(1),
          difference: calorieDiff.toFixed(1),
          protein: scaled.protein,
          fat: scaled.fat,
          carbs: scaled.carbs,
          servings: servings,
          issue:
            caloriesPerServing < 50
              ? 'TOO_LOW'
              : caloriesPerServing > 2000
                ? 'TOO_HIGH'
                : 'MACRO_MISMATCH',
        });
      }
    }
  }

  return scaled;
}

function buildNutrients(nutritionRow) {
  if (!nutritionRow) {
    supabaseLog('buildNutrients:empty');
    return null;
  }

  supabaseLog('buildNutrients:start', { columns: Object.keys(nutritionRow) });

  const nutrients = [];
  const push = (name, amount, unit = 'g') => {
    if (amount === null || amount === undefined) return;
    nutrients.push({ name, amount: Number(amount), unit });
  };

  push('Calories', nutritionRow.calories, 'kcal');
  push('Protein', nutritionRow.protein);
  push('Fat', nutritionRow.fat);
  push('Carbohydrates', nutritionRow.carbs);
  push('Fiber', nutritionRow.fiber);
  push('Sugar', nutritionRow.sugar);
  push('Sodium', nutritionRow.sodium, 'mg');
  push('Cholesterol', nutritionRow.cholesterol, 'mg');

  // Extended nutrition fields
  if (nutritionRow.saturated_fat !== null && nutritionRow.saturated_fat !== undefined) {
    push('Saturated Fat', nutritionRow.saturated_fat);
  }
  if (nutritionRow.trans_fat !== null && nutritionRow.trans_fat !== undefined) {
    push('Trans Fat', nutritionRow.trans_fat);
  }
  if (nutritionRow.vitamin_a !== null && nutritionRow.vitamin_a !== undefined) {
    push('Vitamin A', nutritionRow.vitamin_a, 'IU');
  }
  if (nutritionRow.vitamin_c !== null && nutritionRow.vitamin_c !== undefined) {
    push('Vitamin C', nutritionRow.vitamin_c, 'mg');
  }
  if (nutritionRow.vitamin_d !== null && nutritionRow.vitamin_d !== undefined) {
    push('Vitamin D', nutritionRow.vitamin_d, 'IU');
  }
  if (nutritionRow.potassium !== null && nutritionRow.potassium !== undefined) {
    push('Potassium', nutritionRow.potassium, 'mg');
  }
  if (nutritionRow.calcium !== null && nutritionRow.calcium !== undefined) {
    push('Calcium', nutritionRow.calcium, 'mg');
  }
  if (nutritionRow.iron !== null && nutritionRow.iron !== undefined) {
    push('Iron', nutritionRow.iron, 'mg');
  }

  const result = nutrients.length ? { nutrients } : null;
  supabaseLog('buildNutrients:complete', {
    nutrientCount: nutrients.length,
    hasResult: !!result,
  });

  return result;
}

function mapSupabaseRecipe(row) {
  if (!row) {
    supabaseLog('mapSupabaseRecipe:empty');
    return null;
  }

  const prep = Number(row.prep_minutes) || 0;
  const cook = Number(row.cook_minutes) || 0;
  const ready = prep + cook;

  // Validate image URL and construct fallback if missing
  let heroImageUrl = row.hero_image_url || '';
  const hasImage = !!(heroImageUrl && heroImageUrl.trim());

  // Reject external URLs (Unsplash, etc.) - only allow Supabase storage
  if (hasImage) {
    try {
      const url = new URL(heroImageUrl);
      const supabaseBase = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
      const isExternal =
        !supabaseBase ||
        url.host !== supabaseBase.host ||
        !url.pathname.includes('/storage/v1/object/public/recipe-images/');

      if (isExternal) {
        heroImageUrl = ''; // Clear invalid URL
      }
    } catch (e) {
      // Invalid URL format
      heroImageUrl = '';
    }
  }

  // If no valid image URL, construct Supabase storage URL from recipe ID
  if (!heroImageUrl && row.id && SUPABASE_URL) {
    heroImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${row.id}/hero.webp`;
  }

  // Clean and format title (basic cleanup - full formatting happens in RecipePage)
  let cleanedTitle = row.title?.trim().replace(/\s+/g, ' ') || 'Untitled Recipe';

  const base = {
    id: row.id,
    title: cleanedTitle,
    summary: row.description,
    description: row.description,
    image: heroImageUrl,
    heroImageUrl: heroImageUrl,
    prepMinutes: prep || null,
    cookMinutes: cook || null,
    readyInMinutes: ready || null,
    servings: row.servings || null,
    difficulty: row.difficulty || 'unknown',
    cuisine: row.cuisine || [],
    mealTypes: row.meal_types || [],
    diets: row.diets || [],
    author: row.author || 'Community',
    calories: row.calories || null,
    source: 'supabase',
  };

  supabaseLog('mapSupabaseRecipe', {
    id: row.id,
    title: row.title,
    readyInMinutes: ready || null,
    servings: base.servings,
  });

  if (row.calories) {
    base.nutrition = {
      nutrients: [{ name: 'Calories', amount: Number(row.calories), unit: 'kcal' }],
    };
  }

  // Log data completeness
  const missingFields = [];
  if (!row.title) missingFields.push('title');
  if (!row.description) missingFields.push('description');
  if (!row.hero_image_url) missingFields.push('hero_image_url (using fallback)');
  if (!row.servings) missingFields.push('servings');
  if (!row.calories) missingFields.push('calories');

  // Removed verbose logging - only log errors

  return base;
}

function mapSupabaseRecipeDetail(
  row,
  ingredients = [],
  steps = [],
  nutritionRow = null,
  tags = [],
  pairings = [],
  healthBadge = null
) {
  const recipe = mapSupabaseRecipe(row);
  if (!recipe) return null;

  supabaseLog('mapSupabaseRecipeDetail:start', {
    id: recipe.id,
    ingredientRows: ingredients.length,
    stepRows: steps.length,
    hasNutritionRow: !!nutritionRow,
    tagRows: tags.length,
    pairingRows: pairings.length,
  });

  console.log('📋 [RECIPE DETAIL] Loading full recipe details:', {
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    ingredientsCount: ingredients.length,
    stepsCount: steps.length,
    hasNutrition: !!nutritionRow,
    tagsCount: tags.length,
    pairingsCount: pairings.length,
  });

  recipe.tags = tags.map(t => t.tag);
  recipe.beveragePairings = pairings.map(pair => ({
    id: pair.id,
    recipeId: pair.recipe_id,
    beverageType: pair.beverage_type,
    name: pair.name,
    varietal: pair.varietal,
    body: pair.body,
    sweetness: pair.sweetness,
    servingTemperature: pair.serving_temperature,
    pairingNotes: pair.notes,
    confidence: pair.confidence,
    source: pair.source || 'curated',
  }));

  // Log wine/pairing data
  if (pairings.length > 0) {
    if (import.meta.env.DEV) {
      console.debug('🍷 [WINE PAIRINGS] Found beverage pairings:', {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        pairings: pairings.map(p => ({
          name: p.name,
          type: p.beverage_type,
          varietal: p.varietal,
          confidence: p.confidence,
        })),
      });
    }
  }

  // Helper function to clean ingredient names and infer smart defaults
  const cleanIngredientName = name => {
    if (!name) return 'Ingredient';
    // Remove leading/trailing spaces, quotes, and apostrophes
    return name
      .trim()
      .replace(/^['"]+|['"]+$/g, '')
      .trim();
  };

  // Helper function to infer unit from ingredient name when unit is missing or "unit"
  const inferUnitFromName = (name, currentUnit, amount) => {
    // If we already have a valid unit, use it
    if (currentUnit && currentUnit !== 'unit' && currentUnit !== 'units' && currentUnit !== '') {
      return currentUnit;
    }

    const nameLower = name.toLowerCase().trim();

    // Common ingredient patterns with default units
    const unitPatterns = [
      // Spices/seasonings - usually tsp (match even with leading quotes/spaces)
      {
        pattern:
          /^['"]?\s*(salt|pepper|black pepper|white pepper|cayenne|paprika|cumin|curry|garlic powder|onion powder|chili powder|yeast|instant yeast|active dry yeast|dry yeast)\s*['"]?$/i,
        unit: 'tsp',
      },
      // Liquids - usually tbsp or cup depending on amount
      {
        pattern:
          /^['"]?\s*(vinegar|soy sauce|soya sauce|worcestershire|hot sauce|tabasco)\s*['"]?$/i,
        unit: amount && amount >= 2 ? 'tbsp' : 'tsp',
      },
      // Condiments - usually tbsp
      {
        pattern: /^['"]?\s*(ketchup|mustard|mayonnaise|bbq sauce|honey|maple syrup)\s*['"]?$/i,
        unit: 'tbsp',
      },
      // Water/broth/milk - usually cup
      {
        pattern:
          /^['"]?\s*(water|broth|stock|chicken broth|beef broth|vegetable broth|milk|whole milk|skim milk|almond milk|soy milk|coconut milk)\s*['"]?$/i,
        unit: 'cup',
      },
      // Oils/fats - usually tbsp
      {
        pattern: /^['"]?\s*(oil|olive oil|vegetable oil|canola oil|butter|margarine)\s*['"]?$/i,
        unit: 'tbsp',
      },
      // Flour/starch - usually cup or tbsp
      {
        pattern: /^['"]?\s*(flour|cornstarch|corn starch|baking powder|baking soda)\s*['"]?$/i,
        unit: amount && amount >= 0.5 ? 'cup' : 'tbsp',
      },
      // Sugar/sweeteners - usually cup or tbsp
      {
        pattern: /^['"]?\s*(sugar|brown sugar|powdered sugar|confectioners sugar)\s*['"]?$/i,
        unit: amount && amount >= 0.5 ? 'cup' : 'tbsp',
      },
      // Seeds/nuts - usually tbsp or tsp depending on amount
      {
        pattern:
          /^['"]?\s*(sesame seeds|poppy seeds|chia seeds|flax seeds|sunflower seeds|pumpkin seeds|almonds|walnuts|pecans|peanuts)\s*['"]?$/i,
        unit: amount && amount >= 2 ? 'tbsp' : 'tsp',
      },
      // Whole items - keep as unit (no unit needed)
      {
        pattern:
          /^['"]?\s*(egg|eggs|egg white|egg whites|egg yolk|egg yolks|chicken|chicken breast|chicken thigh|chicken wing|chicken wings|bouillon cube|bouillon cubes)\s*['"]?$/i,
        unit: '',
      },
    ];

    for (const { pattern, unit } of unitPatterns) {
      if (pattern.test(nameLower)) {
        return unit;
      }
    }

    // Default: return empty string (will be handled as "to taste" or just name)
    return '';
  };

  recipe.extendedIngredients = ingredients.map(item => {
    let ingredientName = item.ingredient?.name || 'Ingredient';
    // Clean the ingredient name
    ingredientName = cleanIngredientName(ingredientName);

    let amount = item.quantity ?? null;
    let unit = item.unit || item.ingredient?.default_unit || '';

    // If unit is "unit" or empty, try to infer from name
    if (!unit || unit === 'unit' || unit === 'units') {
      unit = inferUnitFromName(ingredientName, unit, amount);
    }

    const originalParts = [amount, unit, ingredientName].filter(Boolean).join(' ');

    return {
      id: item.ingredient_id,
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

  // Log ingredients data with detailed analysis
  if (import.meta.env.DEV) {
    const ingredientsWithIssues = ingredients.filter(
      ing =>
        ing.quantity === null ||
        ing.quantity === undefined ||
        !ing.unit ||
        ing.unit === 'unit' ||
        ing.unit === ''
    );

    console.log('🥘 [INGREDIENTS] Recipe ingredients loaded:', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      totalIngredients: ingredients.length,
      ingredientsWithIssues: ingredientsWithIssues.length,
      issues:
        ingredientsWithIssues.length > 0
          ? {
              missingQuantity: ingredients.filter(
                ing => ing.quantity === null || ing.quantity === undefined
              ).length,
              missingUnit: ingredients.filter(
                ing => !ing.unit || ing.unit === 'unit' || ing.unit === ''
              ).length,
              sampleIssues: ingredientsWithIssues.slice(0, 5).map(ing => ({
                name: ing.ingredient?.name || 'Unknown',
                quantity: ing.quantity,
                unit: ing.unit,
              })),
            }
          : null,
      sampleIngredients: ingredients.slice(0, 5).map(ing => ({
        name: ing.ingredient?.name || 'Unknown',
        quantity: ing.quantity,
        unit: ing.unit,
        hasQuantity: ing.quantity !== null && ing.quantity !== undefined,
        hasUnit: !!ing.unit && ing.unit !== 'unit' && ing.unit !== '',
      })),
    });
  }

  recipe.analyzedInstructions = steps.length
    ? [
        {
          name: 'Steps',
          steps: steps.map((step, idx) => ({
            number: step.position ?? idx + 1,
            step: step.instruction,
            length: step.timer_seconds
              ? { number: step.timer_seconds, unit: 'seconds' }
              : undefined,
          })),
        },
      ]
    : [];

  // Debug: Log before rehydration
  if (import.meta.env.DEV && nutritionRow) {
    console.log('📊 [NUTRITION BUILD] Before rehydration:', {
      recipeId: row.id,
      recipeSource: row.source,
      rawCalories: nutritionRow.calories,
      servings: row.servings,
      willRehydrate: row.source === 'csv_import',
    });
  }

  const normalizedNutrition = rehydrateCsvNutrition(nutritionRow, row);

  // Debug: Log after rehydration
  if (import.meta.env.DEV && normalizedNutrition) {
    console.log('📊 [NUTRITION BUILD] After rehydration:', {
      recipeId: row.id,
      normalizedCalories: normalizedNutrition.calories,
      changed: normalizedNutrition.calories !== nutritionRow?.calories,
    });
  }

  const nutrition = buildNutrients(normalizedNutrition);
  if (nutrition) {
    recipe.nutrition = nutrition;
    const caloriesEntry = nutrition.nutrients.find(n => n.name === 'Calories');
    if (caloriesEntry?.amount) {
      recipe.calories = Math.round(caloriesEntry.amount);
    }

    // Log detailed nutrition data (only in dev mode)
    if (import.meta.env.DEV) {
      const caloriesNutrient = nutrition.nutrients.find(n => n.name === 'Calories');
      console.debug('📊 [NUTRITION] Recipe nutrition data:', {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        rawCalories: normalizedNutrition?.calories,
        caloriesInNutrients: caloriesNutrient?.amount,
        protein: normalizedNutrition?.protein,
        fat: normalizedNutrition?.fat,
        carbs: normalizedNutrition?.carbs,
        totalNutrients: nutrition.nutrients.length,
        note: 'Raw calories from DB vs calories in nutrients array',
      });
    }
  } else {
    console.warn('⚠️ [NUTRITION] Missing nutrition data for recipe:', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    });
  }

  // Log steps data (only in dev mode)
  if (import.meta.env.DEV && steps.length > 0) {
    console.debug('👨‍🍳 [STEPS] Recipe cooking steps:', {
      recipeId: recipe.id,
      totalSteps: steps.length,
    });
  }

  // Add health badge/score from health_badges view
  if (healthBadge) {
    recipe.healthScore = healthBadge.score ?? null;
    recipe.healthBadge = healthBadge.badge ?? null;
    recipe.healthColor = healthBadge.color ?? null;
    if (import.meta.env.DEV) {
      console.debug('💚 [HEALTH BADGE] Health badge loaded:', {
        recipeId: recipe.id,
        score: healthBadge.score,
        badge: healthBadge.badge,
      });
    }
  }

  supabaseLog('mapSupabaseRecipeDetail:complete', {
    id: recipe.id,
    hasNutrition: !!recipe.nutrition,
    pairingRows: recipe.beveragePairings.length,
    hasHealthBadge: !!healthBadge,
  });

  // Final validation log
  const validation = {
    hasTitle: !!recipe.title,
    hasDescription: !!recipe.description,
    hasImage: !!(recipe.image || recipe.heroImageUrl),
    hasIngredients: recipe.extendedIngredients?.length > 0,
    hasSteps:
      recipe.analyzedInstructions?.length > 0 && recipe.analyzedInstructions[0]?.steps?.length > 0,
    hasNutrition: !!recipe.nutrition,
    hasTags: recipe.tags?.length > 0,
    hasPairings: recipe.beveragePairings?.length > 0,
  };

  if (import.meta.env.DEV) {
    const allComplete = Object.values(validation).every(v => v === true);
    if (!allComplete) {
      console.warn('⚠️ [VALIDATION] Recipe data incomplete:', {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        ...validation,
      });
    }
  }

  return recipe;
}

export async function fetchLatestRecipes(limit = 6) {
  const t0 = now();
  const validatedLimit = Math.min(Math.max(Number(limit) || 6, 1), 100); // Clamp between 1-100
  supabaseLog('fetchLatestRecipes:start', { limit, validatedLimit });

  console.log('🔍 [SUPABASE] Fetching latest recipes from Supabase:', { limit, validatedLimit });

  const { data, error } = await supabase
    .from('recipes')
    .select(
      'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories'
    )
    // Only show recipes with complete nutrition (for production)
    .eq('has_complete_nutrition', true)
    .order('created_at', { ascending: false })
    .limit(validatedLimit);

  if (error) {
    console.error('❌ [SUPABASE ERROR] fetchLatestRecipes failed:', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  console.log('📦 [SUPABASE] Raw data received:', {
    count: data?.length || 0,
    sampleIds: data?.slice(0, 3).map(r => r.id) || [],
  });

  const mapped = (data || []).map(mapSupabaseRecipe).filter(recipe => {
    // Only show recipes with valid images
    const hasImage = !!(recipe?.image || recipe?.heroImageUrl);
    if (!hasImage) {
      supabaseLog('fetchLatestRecipes:filtered', {
        id: recipe?.id,
        reason: 'missing_image',
      });
    }
    return hasImage;
  });

  console.log('✅ [SUPABASE] Mapped recipes:', {
    count: mapped.length,
    durationMs: Number((now() - t0).toFixed(2)),
    recipes: mapped.map(r => ({
      id: r.id,
      title: r.title,
      hasImage: !!(r.image || r.heroImageUrl),
      servings: r.servings,
    })),
  });

  supabaseLog('fetchLatestRecipes:complete', {
    received: mapped.length,
    durationMs: Number((now() - t0).toFixed(2)),
  });
  return mapped;
}

export async function getSupabaseRandomRecipe() {
  const t0 = now();
  supabaseLog('getSupabaseRandomRecipe:start');

  const { count, error: countError } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('has_complete_nutrition', true); // Only count complete nutrition recipes

  if (countError) {
    console.error('[Supabase] getSupabaseRandomRecipe:error', countError);
    throw countError;
  }

  if (!count || count <= 0) {
    supabaseLog('getSupabaseRandomRecipe:empty');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * count);
  supabaseLog('getSupabaseRandomRecipe:select', { total: count, randomIndex });

  const { data, error } = await supabase
    .from('recipes')
    .select(
      'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories'
    )
    .eq('has_complete_nutrition', true) // Only complete nutrition recipes
    .order('created_at', { ascending: true })
    .range(randomIndex, randomIndex);

  if (error) {
    console.error('[Supabase] getSupabaseRandomRecipe:error', error);
    throw error;
  }

  const recipe = data?.length ? mapSupabaseRecipe(data[0]) : null;
  supabaseLog('getSupabaseRandomRecipe:complete', {
    resultId: recipe?.id ?? null,
    durationMs: Number((now() - t0).toFixed(2)),
  });
  return recipe;
}

export async function searchSupabaseRecipes({
  query = '',
  includeIngredients = [],
  diet = '',
  mealType = '',
  maxTime = '',
  cuisine = '',
  difficulty = '',
  maxCalories = '',
  healthScore = '',
  minProtein = '',
  maxCarbs = '',
  intolerances = '',
  limit = 24,
}) {
  const t0 = now();
  try {
    // Validate and sanitize inputs
    const validatedLimit = Math.min(Math.max(Number(limit) || 24, 1), 100); // Clamp between 1-100

    const debugPayload = {
      query,
      includeIngredients,
      diet,
      mealType,
      maxTime,
      limit: validatedLimit,
    };
    supabaseLog('searchSupabaseRecipes:start', debugPayload);

    // Robust query parsing with validation
    const trimmedQuery = typeof query === 'string' ? query.trim() : '';

    // Validate query length to prevent extremely long queries
    if (trimmedQuery.length > 200) {
      console.warn('[searchSupabaseRecipes] Query too long, truncating:', trimmedQuery.length);
      // Truncate but keep first 200 chars
      query = trimmedQuery.substring(0, 200);
    }

    // Robust ingredient filtering with validation
    const filteredIngredients = (Array.isArray(includeIngredients) ? includeIngredients : [])
      .map(ing => {
        if (typeof ing !== 'string') return null;
        return ing.trim().toLowerCase();
      })
      .filter(Boolean)
      .filter(ing => ing.length > 0 && ing.length <= 50); // Max ingredient name length

    // Removed verbose logging - only log errors

    let builder = supabase
      .from('recipes')
      .select(
        'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition'
      )
      // Only show recipes with complete nutrition (for production)
      .eq('has_complete_nutrition', true)
      .order('updated_at', { ascending: false })
      .limit(validatedLimit);

    // Smart search: Split query into words and search for each
    // Enhanced with better escaping and validation
    if (trimmedQuery) {
      // Escape special characters that could break the query
      const sanitizedQuery = trimmedQuery.replace(/[%_\\]/g, '\\$&');

      const queryWords = sanitizedQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 0 && w.length <= 50) // Filter out extremely long words
        .slice(0, 10); // Limit to first 10 words to prevent query explosion

      if (queryWords.length > 0) {
        try {
          // Build OR conditions for title and description matching any word
          const titleClauses = queryWords.map(word => {
            const escapedWord = word.replace(/[%_\\]/g, '\\$&');
            return `title.ilike.%${escapedWord}%`;
          });
          const descClauses = queryWords.map(word => {
            const escapedWord = word.replace(/[%_\\]/g, '\\$&');
            return `description.ilike.%${escapedWord}%`;
          });

          // Also try exact phrase match (with escaping)
          const escapedQuery = sanitizedQuery.replace(/[%_\\]/g, '\\$&');
          const exactTitleMatch = `title.ilike.%${escapedQuery}%`;
          const exactDescMatch = `description.ilike.%${escapedQuery}%`;

          // Combine: exact phrase OR (any word in title OR any word in description)
          const allClauses = [exactTitleMatch, exactDescMatch, ...titleClauses, ...descClauses];

          builder = builder.or(allClauses.join(','));
        } catch (queryError) {
          console.warn('[searchSupabaseRecipes] Error building query clauses:', queryError);
          // Fallback to simple exact match
          const escapedQuery = sanitizedQuery.replace(/[%_\\]/g, '\\$&');
          builder = builder.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
        }
      }
    } else if (filteredIngredients.length > 0) {
      // If only ingredient filters, search in title/description as initial filter
      // Then we'll refine by actual ingredients
      try {
        const clauses = filteredIngredients
          .slice(0, 10) // Limit to prevent query explosion
          .map(term => {
            const escapedTerm = term.replace(/[%_\\]/g, '\\$&');
            return `title.ilike.%${escapedTerm}%,description.ilike.%${escapedTerm}%`;
          });
        if (clauses.length > 0) {
          builder = builder.or(clauses.join(','));
        }
      } catch (ingredientError) {
        console.warn('[searchSupabaseRecipes] Error building ingredient clauses:', ingredientError);
        // Continue without ingredient text search
      }
    }

    // Apply filters with robust validation
    const normalizedDiet = typeof diet === 'string' ? diet.trim() : '';
    if (normalizedDiet && normalizedDiet.length > 0 && normalizedDiet.length <= 50) {
      try {
        builder = builder.contains('diets', [normalizedDiet]);
      } catch (dietError) {
        console.warn('[searchSupabaseRecipes] Error applying diet filter:', dietError);
      }
    }

    const normalizedMealType = typeof mealType === 'string' ? mealType.trim() : '';
    if (normalizedMealType && normalizedMealType.length > 0 && normalizedMealType.length <= 50) {
      try {
        builder = builder.contains('meal_types', [normalizedMealType]);
      } catch (mealTypeError) {
        console.warn('[searchSupabaseRecipes] Error applying meal type filter:', mealTypeError);
      }
    }

    const maxTimeNumber = Number(maxTime);
    if (!Number.isNaN(maxTimeNumber) && maxTimeNumber > 0 && maxTimeNumber <= 10000) {
      try {
        builder = builder.or(`prep_minutes.lte.${maxTimeNumber},cook_minutes.lte.${maxTimeNumber}`);
      } catch (timeError) {
        console.warn('[searchSupabaseRecipes] Error applying time filter:', timeError);
      }
    }

    // Cuisine filter
    const normalizedCuisine = typeof cuisine === 'string' ? cuisine.trim() : '';
    if (normalizedCuisine && normalizedCuisine.length > 0 && normalizedCuisine.length <= 50) {
      try {
        builder = builder.contains('cuisine', [normalizedCuisine]);
      } catch (cuisineError) {
        console.warn('[searchSupabaseRecipes] Error applying cuisine filter:', cuisineError);
      }
    }

    // Difficulty filter
    const normalizedDifficulty = typeof difficulty === 'string' ? difficulty.trim() : '';
    if (
      normalizedDifficulty &&
      normalizedDifficulty.length > 0 &&
      normalizedDifficulty.length <= 20
    ) {
      try {
        builder = builder.eq('difficulty', normalizedDifficulty);
      } catch (difficultyError) {
        console.warn('[searchSupabaseRecipes] Error applying difficulty filter:', difficultyError);
      }
    }

    // Max calories filter (client-side filtering will be applied after fetch)
    const maxCaloriesNumber = Number(maxCalories);
    const hasMaxCalories = !Number.isNaN(maxCaloriesNumber) && maxCaloriesNumber > 0;

    // Health score filter (client-side filtering will be applied after fetch)
    const healthScoreNumber = Number(healthScore);
    const hasHealthScore = !Number.isNaN(healthScoreNumber) && healthScoreNumber > 0;

    // Protein and carbs filters (client-side filtering will be applied after fetch)
    const minProteinNumber = Number(minProtein);
    const hasMinProtein = !Number.isNaN(minProteinNumber) && minProteinNumber > 0;
    const maxCarbsNumber = Number(maxCarbs);
    const hasMaxCarbs = !Number.isNaN(maxCarbsNumber) && maxCarbsNumber > 0;

    supabaseLog('searchSupabaseRecipes:filtersApplied', {
      trimmedQuery,
      ingredientFilters: filteredIngredients.length,
      diet: normalizedDiet || null,
      mealType: normalizedMealType || null,
      maxTime: !Number.isNaN(maxTimeNumber) && maxTimeNumber > 0 ? maxTimeNumber : null,
      cuisine: normalizedCuisine || null,
      difficulty: normalizedDifficulty || null,
      maxCalories: hasMaxCalories ? maxCaloriesNumber : null,
      healthScore: hasHealthScore ? healthScoreNumber : null,
      minProtein: hasMinProtein ? minProteinNumber : null,
      maxCarbs: hasMaxCarbs ? maxCarbsNumber : null,
    });

    const { data, error } = await builder;
    if (error) {
      console.error('❌ [SUPABASE ERROR] searchSupabaseRecipes failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        query,
        filters: { diet, mealType, maxTime },
      });
      throw error;
    }

    let mapped = (data || []).map(mapSupabaseRecipe).filter(recipe => {
      // Only show recipes with valid images
      const hasImage = !!(recipe?.image || recipe?.heroImageUrl);
      if (!hasImage) {
        supabaseLog('searchSupabaseRecipes:filtered', {
          id: recipe?.id,
          reason: 'missing_image',
        });
      }
      return hasImage;
    });

    // If we have a text query, score and sort results by relevance with STRICT prioritization
    if (trimmedQuery && mapped.length > 0) {
      const queryLower = trimmedQuery.toLowerCase().trim();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

      // Score each recipe by relevance with MUCH higher weights for exact matches
      mapped = mapped.map(recipe => {
        const titleLower = (recipe.title || '').toLowerCase().trim();
        const descLower = (recipe.description || '').toLowerCase().trim();
        let score = 0;

        // EXACT title match = highest score (10000 points) - should be the ONLY result
        if (titleLower === queryLower) {
          score += 10000;
        }
        // Title contains exact phrase (case-insensitive)
        else if (titleLower.includes(queryLower)) {
          score += 5000;
        }
        // Title starts with query
        else if (titleLower.startsWith(queryLower)) {
          score += 3000;
        }
        // Description contains exact phrase
        else if (descLower.includes(queryLower)) {
          score += 1000;
        }

        // Count word matches in title (more words = higher score, but much lower than exact match)
        const titleWordMatches = queryWords.filter(word => titleLower.includes(word)).length;
        const wordMatchRatio = titleWordMatches / queryWords.length;
        score += Math.floor(wordMatchRatio * 100); // Max 100 points for all words

        // Count word matches in description (even lower)
        const descWordMatches = queryWords.filter(word => descLower.includes(word)).length;
        score += Math.floor((descWordMatches / queryWords.length) * 20); // Max 20 points

        return {
          ...recipe,
          _relevanceScore: score,
          _isExactMatch: titleLower === queryLower || titleLower.includes(queryLower),
        };
      });

      // Separate exact matches from partial matches
      const exactMatches = mapped.filter(r => r._isExactMatch && r._relevanceScore >= 5000);
      const partialMatches = mapped.filter(r => !r._isExactMatch || r._relevanceScore < 5000);

      // Sort each group by relevance score
      exactMatches.sort((a, b) => b._relevanceScore - a._relevanceScore);
      partialMatches.sort((a, b) => b._relevanceScore - a._relevanceScore);

      // If we have exact matches, ONLY return those (or limit to top 5)
      if (exactMatches.length > 0) {
        mapped = exactMatches.slice(0, 5);
      } else {
        // Otherwise return partial matches, but limit to top 10
        mapped = partialMatches.slice(0, 10);
      }

      // Remove scoring properties before returning
      mapped = mapped.map(({ _relevanceScore, _isExactMatch, ...recipe }) => recipe);
    }

    // If no results and we have a query, check if recipe exists without the flag
    if (mapped.length === 0 && trimmedQuery) {
      // First check for EXACT title match
      const { data: exactMatch, error: exactError } = await supabase
        .from('recipes')
        .select('id,title,has_complete_nutrition')
        .ilike('title', trimmedQuery)
        .limit(1);

      if (!exactError && exactMatch && exactMatch.length > 0) {
        console.warn('⚠️ [SEARCH] EXACT MATCH FOUND but missing has_complete_nutrition flag:', {
          recipe: exactMatch[0],
          action: "Go to Recipe Editor and click 'Save All Changes' to set the flag",
        });
      } else {
        // Check for partial matches
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recipes')
          .select('id,title,has_complete_nutrition')
          .or(`title.ilike.%${trimmedQuery}%,description.ilike.%${trimmedQuery}%`)
          .limit(5);

        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          console.warn('⚠️ [SEARCH] Recipe found but missing has_complete_nutrition flag:', {
            count: fallbackData.length,
            recipes: fallbackData.map(r => ({ id: r.id, title: r.title })),
          });
        }
      }
    }

    // IMPORTANT: If we have a text query, don't filter by ingredients - the text query takes precedence
    // Only filter by ingredients if we DON'T have a text query (ingredient-only search)
    const shouldFilterByIngredients = filteredIngredients.length > 0 && !trimmedQuery;

    // If we have ingredient filters BUT ALSO have a text query, skip ingredient filtering
    // The text query results are what the user wants - return them directly
    if (shouldFilterByIngredients) {
      // If no results from initial query, fetch more recipes to search through
      if (mapped.length === 0) {
        const { data: moreData, error: moreError } = await supabase
          .from('recipes')
          .select(
            'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories'
          )
          .eq('has_complete_nutrition', true)
          .order('updated_at', { ascending: false })
          .limit(limit * 2); // Fetch more to search through

        if (!moreError && moreData) {
          mapped = moreData.map(mapSupabaseRecipe);
        }
      }

      if (mapped.length > 0) {
        // Get all recipe IDs
        const recipeIds = mapped.map(r => r.id);

        // Query ingredients table for matching ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .select('recipe_id, ingredient:ingredients(name)')
          .in('recipe_id', recipeIds);

        if (!ingredientsError && ingredientsData) {
          // Group ingredients by recipe_id
          const recipeIngredientsMap = new Map();
          ingredientsData.forEach(item => {
            if (!recipeIngredientsMap.has(item.recipe_id)) {
              recipeIngredientsMap.set(item.recipe_id, []);
            }
            const ingredientName = item.ingredient?.name?.toLowerCase() || '';
            if (ingredientName) {
              recipeIngredientsMap.get(item.recipe_id).push(ingredientName);
            }
          });

          // Score recipes by ingredient matches
          const scoredRecipes = mapped.map(recipe => {
            const recipeIngredients = recipeIngredientsMap.get(recipe.id) || [];
            const matchedIngredients = filteredIngredients.filter(searchIng =>
              recipeIngredients.some(
                recipeIng => recipeIng.includes(searchIng) || searchIng.includes(recipeIng)
              )
            );
            const matchScore = matchedIngredients.length / filteredIngredients.length;
            const matchCount = matchedIngredients.length;

            return {
              ...recipe,
              _ingredientMatchScore: matchScore,
              _ingredientMatchCount: matchCount,
              _totalIngredients: filteredIngredients.length,
              _matchedIngredients: matchedIngredients,
            };
          });

          // Filter: Try progressive fallback
          // 1. First try: recipes with at least 50% of ingredients (or at least 2 if we have 4+ ingredients)
          const minMatchThreshold =
            filteredIngredients.length >= 4
              ? Math.max(2, Math.ceil(filteredIngredients.length * 0.5))
              : Math.max(1, Math.ceil(filteredIngredients.length * 0.5));

          let filtered = scoredRecipes.filter(r => r._ingredientMatchCount >= minMatchThreshold);

          // 2. If no results, try recipes with at least 1 ingredient match
          if (filtered.length === 0) {
            filtered = scoredRecipes.filter(r => r._ingredientMatchCount >= 1);
          }

          // Sort by match score (best matches first)
          filtered.sort((a, b) => {
            if (b._ingredientMatchScore !== a._ingredientMatchScore) {
              return b._ingredientMatchScore - a._ingredientMatchScore;
            }
            return b._ingredientMatchCount - a._ingredientMatchCount;
          });

          // Remove scoring properties before returning
          mapped = filtered.map(
            ({
              _ingredientMatchScore,
              _ingredientMatchCount,
              _totalIngredients,
              _matchedIngredients,
              ...recipe
            }) => recipe
          );
        } else if (ingredientsError) {
          console.warn('⚠️ [INGREDIENT SEARCH] Error querying ingredients:', ingredientsError);
          // Fall back to title/description search results
        }
      }
    }

    // Apply client-side filters that aren't supported by database queries
    if (hasMaxCalories) {
      mapped = mapped.filter(r => {
        const recipeCalories = r.calories || r.nutrition?.calories || 0;
        return recipeCalories > 0 && recipeCalories <= maxCaloriesNumber;
      });
    }

    if (hasHealthScore) {
      // Health score filtering would require health score data in the database
      // For now, we'll skip this filter or apply it if health score is available
      mapped = mapped.filter(r => {
        // If health score is not available, include the recipe
        // This can be enhanced when health score is added to the database
        return true;
      });
    }

    if (hasMinProtein) {
      mapped = mapped.filter(r => {
        const protein = r.nutrition?.protein || r.protein || 0;
        return protein >= minProteinNumber;
      });
    }

    if (hasMaxCarbs) {
      mapped = mapped.filter(r => {
        const carbs = r.nutrition?.carbs || r.carbs || 0;
        return carbs > 0 && carbs <= maxCarbsNumber;
      });
    }

    // Intolerances filtering (client-side)
    if (intolerances) {
      const intoleranceList = intolerances
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(Boolean);
      if (intoleranceList.length > 0) {
        mapped = mapped.filter(r => {
          // Check if recipe contains any of the intolerances
          // This would need ingredient data or intolerance tags in the database
          // For now, we'll include all recipes (can be enhanced later)
          return true;
        });
      }
    }

    // Removed verbose logging - only log errors

    supabaseLog('searchSupabaseRecipes:complete', {
      count: mapped.length,
      first: mapped[0]?.id ?? null,
      rawCount: data?.length ?? 0,
      durationMs: Number((now() - t0).toFixed(2)),
    });

    return mapped;
  } catch (error) {
    console.error('[Supabase] searchSupabaseRecipes:error', error);
    throw error;
  }
}

export async function getSupabaseRecipeById(id) {
  if (!id || !isUuid(id)) {
    supabaseLog('getSupabaseRecipeById:invalid', { id });
    return null;
  }

  const t0 = now();
  supabaseLog('getSupabaseRecipeById:start', { id });

  console.log('🔍 [SUPABASE] Fetching recipe by ID:', { id });

  const { data: recipeRow, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('❌ [SUPABASE ERROR] getSupabaseRecipeById failed:', {
      id,
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return null;
  }

  if (!recipeRow) {
    console.warn('⚠️ [SUPABASE] Recipe not found:', { id });
    supabaseLog('getSupabaseRecipeById:notFound', { id });
    return null;
  }

  console.log('📦 [SUPABASE] Recipe row fetched:', {
    id: recipeRow.id,
    title: recipeRow.title,
    hasImage: !!recipeRow.hero_image_url,
    imageUrl: recipeRow.hero_image_url
      ? recipeRow.hero_image_url.substring(0, 100) + '...'
      : 'MISSING',
    servings: recipeRow.servings,
    prepMinutes: recipeRow.prep_minutes,
    cookMinutes: recipeRow.cook_minutes,
  });

  const [ingredientsRes, stepsRes, nutritionRes, tagsRes, pairingsRes, healthBadgeRes] =
    await Promise.all([
      supabase
        .from('recipe_ingredients')
        .select(
          'id, ingredient_id, quantity, unit, preparation, optional, ingredient:ingredients(name, default_unit)'
        )
        .eq('recipe_id', id),
      supabase
        .from('recipe_steps')
        .select('id, position, instruction, timer_seconds')
        .eq('recipe_id', id)
        .order('position', { ascending: true }),
      supabase
        .from('recipe_nutrition')
        .select(
          'calories, protein, fat, carbs, fiber, sugar, sodium, cholesterol, saturated_fat, trans_fat, vitamin_a, vitamin_c, vitamin_d, potassium, calcium, iron'
        )
        .eq('recipe_id', id)
        .maybeSingle(),
      supabase.from('recipe_tags').select('tag').eq('recipe_id', id),
      supabase
        .from('recipe_pairings')
        .select(
          'id, recipe_id, beverage_type, name, varietal, body, sweetness, serving_temperature, notes, confidence, source'
        )
        .eq('recipe_id', id)
        .order('confidence', { ascending: false }),
      supabase
        .from('health_badges')
        .select('recipe_id, score, badge, color')
        .eq('recipe_id', id)
        .maybeSingle(),
    ]);

  const pairingError = pairingsRes?.error;

  supabaseLog('getSupabaseRecipeById:raw', {
    ingredientRows: ingredientsRes?.data?.length ?? 0,
    stepRows: stepsRes?.data?.length ?? 0,
    hasNutritionRow: !!nutritionRes?.data,
    tagRows: tagsRes?.data?.length ?? 0,
    sampleIngredientRows: ingredientsRes?.data?.slice?.(0, 2) ?? [],
    pairingRows: pairingsRes?.data?.length ?? 0,
    pairingError: pairingError?.message ?? null,
    hasHealthBadge: !!healthBadgeRes?.data,
  });

  const ingredients = ingredientsRes?.data || [];
  const steps = stepsRes?.data || [];
  const nutritionRow = nutritionRes?.data || null;
  const tags = tagsRes?.data || [];
  const pairings = pairingError || !pairingsRes?.data ? [] : pairingsRes.data.filter(Boolean);
  const healthBadge = healthBadgeRes?.data || null;

  // Log nutrition data being fetched (for debugging)
  if (nutritionRow) {
    console.log('📊 [SUPABASE] Nutrition data fetched from database:', {
      recipeId: id,
      calories: nutritionRow.calories,
      protein: nutritionRow.protein,
      fat: nutritionRow.fat,
      carbs: nutritionRow.carbs,
      note: 'These are TOTAL values stored in recipe_nutrition table',
    });
  }

  // Log all related data fetched
  console.log('📚 [SUPABASE] Related data fetched:', {
    recipeId: id,
    ingredientsCount: ingredients.length,
    stepsCount: steps.length,
    hasNutrition: !!nutritionRow,
    tagsCount: tags.length,
    pairingsCount: pairings.length,
    hasHealthBadge: !!healthBadge,
    healthScore: healthBadge?.score ?? null,
    healthBadge: healthBadge?.badge ?? null,
    ingredientErrors: ingredientsRes?.error ? ingredientsRes.error.message : null,
    stepsErrors: stepsRes?.error ? stepsRes.error.message : null,
    nutritionErrors: nutritionRes?.error ? nutritionRes.error.message : null,
    tagsErrors: tagsRes?.error ? tagsRes.error.message : null,
    pairingsErrors: pairingError ? pairingError.message : null,
    healthBadgeErrors: healthBadgeRes?.error ? healthBadgeRes.error.message : null,
  });

  const mapped = mapSupabaseRecipeDetail(
    recipeRow,
    ingredients,
    steps,
    nutritionRow,
    tags,
    pairings,
    healthBadge
  );

  console.log('✅ [SUPABASE] Full recipe loaded:', {
    id: mapped?.id ?? id,
    title: mapped?.title,
    hasImage: !!(mapped?.image || mapped?.heroImageUrl),
    imageUrl:
      mapped?.image || mapped?.heroImageUrl
        ? String(mapped?.image || mapped?.heroImageUrl || '').substring(0, 100) + '...'
        : 'MISSING',
    hasIngredients: ingredients.length > 0,
    hasSteps: steps.length > 0,
    hasNutrition: !!nutritionRow,
    hasTags: tags.length > 0,
    hasPairings: pairings.length > 0,
    durationMs: Number((now() - t0).toFixed(2)),
  });

  supabaseLog('getSupabaseRecipeById:complete', {
    id: mapped?.id ?? id,
    hasIngredients: ingredients.length,
    hasSteps: steps.length,
    hasNutrition: !!nutritionRow,
    tags: tags.length,
    pairings: pairings.length,
    durationMs: Number((now() - t0).toFixed(2)),
  });

  return mapped;
}

export function mapRecipe(row) {
  return mapSupabaseRecipe(row);
}
