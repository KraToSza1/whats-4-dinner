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
    } catch (_e) {
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
    has_complete_nutrition: row.has_complete_nutrition ?? true, // Preserve flag from database
    hasCompleteNutrition: row.has_complete_nutrition ?? true, // Also include camelCase version
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
    // Handle case where ingredient join failed - try to get name from item directly
    let ingredientName = item.ingredient?.name || item.name || 'Ingredient';
    
    // If still no name and we have ingredient_id, log warning
    if (!ingredientName || ingredientName === 'Ingredient') {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [INGREDIENT MAPPING] Missing ingredient name:', {
          itemId: item.id,
          ingredientId: item.ingredient_id,
          hasIngredientObject: !!item.ingredient,
          itemKeys: Object.keys(item),
          rawItem: item,
        });
      }
    }
    
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

export async function fetchLatestRecipes(limit = 6, isAdmin = false) {
  const t0 = now();
  const validatedLimit = Math.min(Math.max(Number(limit) || 6, 1), 100); // Clamp between 1-100
  supabaseLog('fetchLatestRecipes:start', { limit, validatedLimit, isAdmin });

  console.log('🔍 [SUPABASE] Fetching latest recipes from Supabase:', { limit, validatedLimit, isAdmin });

  let query = supabase
    .from('recipes')
    .select(
      'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition'
    );

  // Only filter by complete nutrition for regular users
  // Admins see all recipes (including incomplete ones)
  if (!isAdmin) {
    query = query.eq('has_complete_nutrition', true);
  }

  const { data, error } = await query
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

  let mapped = (data || []).map(mapSupabaseRecipe).filter(Boolean);

  // For regular users, filter out recipes without images
  // Admins see all recipes (including those without images)
  if (!isAdmin) {
    mapped = mapped.filter(recipe => {
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
  }

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

export async function getSupabaseRandomRecipe(isAdmin = false) {
  const t0 = now();
  supabaseLog('getSupabaseRandomRecipe:start', { isAdmin });

  let countQuery = supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true });

  // Only filter by complete nutrition for regular users
  if (!isAdmin) {
    countQuery = countQuery.eq('has_complete_nutrition', true);
  }

  const { count, error: countError } = await countQuery;

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

  let query = supabase
    .from('recipes')
    .select(
      'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition'
    );

  // Only filter by complete nutrition for regular users
  if (!isAdmin) {
    query = query.eq('has_complete_nutrition', true);
  }

  const { data, error } = await query
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
  offset = 0, // Add offset for server-side pagination
  isAdmin = false, // Admin flag - if true, shows all recipes including incomplete ones
}) {
  const t0 = now();
  const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // URGENT: EXTREMELY DETAILED LOGGING FOR ALL MOBILE DEVICES DEBUGGING
  console.log('🔍🔍🔍 [SEARCH START] ============================================');
  console.log('🔍 [SEARCH START] Search ID:', searchId);
  console.log('🔍 [SEARCH START] Timestamp:', new Date().toISOString());
  console.log('🔍 [SEARCH START] User Agent:', navigator.userAgent);
  console.log('🔍 [SEARCH START] Platform:', navigator.platform);
  console.log('🔍 [SEARCH START] Screen:', { width: window.screen.width, height: window.screen.height });
  console.log('🔍 [SEARCH START] Window:', { width: window.innerWidth, height: window.innerHeight });
  console.log('🔍 [SEARCH START] Network:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
  console.log('🔍 [SEARCH START] Connection:', navigator.connection ? {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt,
    saveData: navigator.connection.saveData
  } : 'NOT AVAILABLE');
  console.log('🔍 [SEARCH START] Search Parameters:', {
    query: query || '(empty)',
    queryLength: query?.length || 0,
    includeIngredients: includeIngredients || [],
    ingredientsCount: includeIngredients?.length || 0,
    diet: diet || '(none)',
    mealType: mealType || '(none)',
    maxTime: maxTime || '(none)',
    cuisine: cuisine || '(none)',
    difficulty: difficulty || '(none)',
    maxCalories: maxCalories || '(none)',
    healthScore: healthScore || '(none)',
    minProtein: minProtein || '(none)',
    maxCarbs: maxCarbs || '(none)',
    intolerances: intolerances || '(none)',
    limit: limit,
    offset: offset,
    isAdmin: isAdmin
  });
  console.log('🔍 [SEARCH START] Supabase Config:', {
    hasSupabase: !!supabase,
    hasUrl: !!SUPABASE_URL,
    urlLength: SUPABASE_URL?.length || 0,
    urlPreview: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
    hasAnonKey: !!(import.meta.env.VITE_SUPABASE_ANON_KEY),
    anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
  });
  console.log('🔍 [SEARCH START] Environment:', {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    baseUrl: import.meta.env.BASE_URL
  });
  console.log('🔍🔍🔍 [SEARCH START] ============================================');
  
  try {
    // Validate and sanitize inputs - increase max limit to support browsing large recipe databases
    const validatedLimit = Math.min(Math.max(Number(limit) || 24, 1), 1000); // Clamp between 1-1000 (increased to support large databases)
    const validatedOffset = Math.max(Number(offset) || 0, 0); // Offset for pagination
    
    // Declare variables at function scope so they're available in all code paths
    let data = null;
    let error = null;
    let count = null;
    let mapped = [];

    console.log('🔍 [SEARCH VALIDATION] Validated parameters:', {
      searchId,
      validatedLimit,
      validatedOffset,
      originalLimit: limit,
      originalOffset: offset
    });

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

    // Build the query - SIMPLIFIED for performance
    // Use a simpler query that's less likely to timeout
    // If no search query and no complex filters, use ultra-simple query
    const hasSearchQuery = trimmedQuery && trimmedQuery.length > 0;
    const hasIngredientFilters = filteredIngredients.length > 0;
    // CRITICAL: "none" means no filter - don't treat it as a complex filter
    const normalizedDietForCheck = typeof diet === 'string' ? diet.trim().toLowerCase() : '';
    const normalizedMealTypeForCheck =
      typeof mealType === 'string' ? mealType.trim().toLowerCase() : '';
    const normalizedMaxTimeForCheck =
      typeof maxTime === 'string' ? maxTime.trim().toLowerCase() : '';

    const hasComplexFilters =
      (normalizedDietForCheck &&
        normalizedDietForCheck !== 'any diet' &&
        normalizedDietForCheck !== 'none') ||
      (normalizedMealTypeForCheck &&
        normalizedMealTypeForCheck !== 'any meal' &&
        normalizedMealTypeForCheck !== 'none') ||
      (normalizedMaxTimeForCheck &&
        normalizedMaxTimeForCheck !== 'any time' &&
        normalizedMaxTimeForCheck !== 'none') ||
      (cuisine && cuisine.length > 0) ||
      (difficulty && difficulty.length > 0);

    // If no search and no filters, use the simplest possible query
    if (!hasSearchQuery && !hasIngredientFilters && !hasComplexFilters) {
      console.log('🔍 [SEARCH QUERY TYPE] Using ultra-simple query (no filters)', {
        searchId,
        hasSearchQuery,
        hasIngredientFilters,
        hasComplexFilters
      });

      let simpleBuilder = supabase
        .from('recipes')
        .select(
          'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition,source',
          {
            count: 'exact',
          }
        );

      // Only filter by complete nutrition for regular users
      // Admins see all recipes (including incomplete ones)
      if (!isAdmin) {
        simpleBuilder = simpleBuilder.eq('has_complete_nutrition', true);
      }

      // CRITICAL FIX: Ensure range doesn't exceed available records
      const simpleRangeEnd = validatedOffset + validatedLimit - 1;
      
      simpleBuilder = simpleBuilder
        .order('created_at', { ascending: false })
        .range(validatedOffset, simpleRangeEnd);

      // Execute immediately without complex filtering
      const queryStartTime = Date.now();
      
      console.log('🔍 [SEARCH QUERY EXEC] Starting simple query execution', {
        searchId,
        queryStartTime,
        validatedOffset,
        validatedLimit,
        isAdmin
      });

      // Declare variables for simple query result
      let simpleData = null;
      let simpleError = null;
      let simpleCount = null;

      try {
        // First, test if Supabase client is working
        if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
          console.log('🔍 [SEARCH API] Testing Supabase connection...');
          console.log('🔍 [SEARCH API] Supabase URL:', SUPABASE_URL);
          console.log('🔍 [SEARCH API] Supabase client:', {
            hasSupabase: !!supabase,
            hasFrom: typeof supabase?.from === 'function',
            url: supabase?.supabaseUrl || 'unknown',
          });

          // Test direct HTTP fetch first
          try {
            const testUrl = `${SUPABASE_URL}/rest/v1/recipes?select=id&limit=1`;
            if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
              console.log('🔍 [SEARCH API] Testing direct HTTP fetch to:', testUrl);
            }

            const fetchTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('HTTP fetch timeout')), 5000)
            );

            const fetchPromise = fetch(testUrl, {
              method: 'GET',
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
                'Content-Type': 'application/json',
              },
            });

            const fetchResult = await Promise.race([fetchPromise, fetchTimeout]);

            if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
              console.log('✅ [SEARCH API] Direct HTTP test:', {
                status: fetchResult.status,
                statusText: fetchResult.statusText,
                ok: fetchResult.ok,
                headers: Object.fromEntries(fetchResult.headers.entries()),
              });

              if (fetchResult.ok) {
                const data = await fetchResult.json();
                console.log('✅ [SEARCH API] HTTP test data:', data);
              } else {
                const text = await fetchResult.text();
                console.error('❌ [SEARCH API] HTTP test failed:', text);
              }
            }
          } catch (httpError) {
            if (import.meta.env.DEV) {
              console.error('❌ [SEARCH API] Direct HTTP test failed:', httpError);
              console.error('❌ [SEARCH API] This indicates a network/CORS issue');
            }
          }

          // Now test Supabase client
          try {
            // Quick connection test - just check if we can access the table
            const testQuery = supabase.from('recipes').select('id').limit(1);
            const testTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Connection test timeout')), 5000)
            );
            const testResult = await Promise.race([testQuery, testTimeout]);
            if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
              console.log('✅ [SEARCH API] Supabase client test passed:', {
                hasData: !!testResult?.data,
                hasError: !!testResult?.error,
                errorMessage: testResult?.error?.message || 'none',
                errorCode: testResult?.error?.code || 'none',
              });
            }
          } catch (testError) {
            if (import.meta.env.DEV) {
              console.error('❌ [SEARCH API] Supabase client test failed:', testError);
              console.error('❌ [SEARCH API] This indicates a Supabase client issue');
            }
          }
        }

        const timeoutMs = 30000;
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            const elapsed = Date.now() - queryStartTime;
            if (import.meta.env.DEV) {
              console.error('⏰ [SEARCH API] Simple query TIMEOUT after', elapsed, 'ms');
            }
            reject(new Error('Query timeout'));
          }, timeoutMs);
        });

        if (import.meta.env.DEV) {
          if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
            console.log('🔄 [SEARCH API] Executing simple query...');
            console.log('🔄 [SEARCH API] Query builder type:', typeof simpleBuilder);
            console.log('🔄 [SEARCH API] Query builder:', simpleBuilder);
          }
        }

        // Wrap the query in a try-catch to catch any immediate errors
        let queryPromise;
        try {
          queryPromise = simpleBuilder;
          if (import.meta.env.DEV) {
            if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
              console.log('🔄 [SEARCH API] Query promise created, type:', typeof queryPromise);
            }
            console.log(
              '🔄 [SEARCH API] Query promise has then:',
              typeof queryPromise?.then === 'function'
            );
            console.log(
              '🔄 [SEARCH API] Query promise has catch:',
              typeof queryPromise?.catch === 'function'
            );
          }

          // Check if it's actually a promise
          if (typeof queryPromise?.then !== 'function') {
            throw new Error(
              'Query builder did not return a promise - Supabase client may be broken'
            );
          }
        } catch (builderError) {
          // Clear timeout if builder error occurs
          if (timeoutId) clearTimeout(timeoutId);
          if (import.meta.env.DEV) {
            console.error('❌ [SEARCH API] Error creating query promise:', builderError);
          }
          throw builderError;
        }

        // Add a check to see if the promise resolves quickly (network issue detection)
        if (import.meta.env.DEV) {
          const quickCheck = Promise.race([
            queryPromise.then(() => 'resolved').catch(() => 'rejected'),
            new Promise(resolve => setTimeout(() => resolve('timeout'), 1000)),
          ]);
          quickCheck.then(result => {
            if (result === 'timeout') {
              console.warn(
                '⚠️ [SEARCH API] Query promise did not resolve/reject within 1 second - likely network issue'
              );
            } else {
              if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
                console.log('✅ [SEARCH API] Query promise responded:', result);
              }
            }
          });
        }

        let result;
        try {
          result = await Promise.race([queryPromise, timeoutPromise]);
          // Clear timeout if query completed successfully
          if (timeoutId) clearTimeout(timeoutId);
        } catch (error) {
          // Clear timeout on error too
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }
        const elapsed = Date.now() - queryStartTime;

        console.log('✅✅✅ [SEARCH QUERY SUCCESS] ============================================');
        console.log('✅ [SEARCH QUERY SUCCESS] Search ID:', searchId);
        console.log('✅ [SEARCH QUERY SUCCESS] Query completed in', elapsed, 'ms');
        console.log('✅ [SEARCH QUERY SUCCESS] Result:', {
          hasData: !!result?.data,
          dataLength: result?.data?.length || 0,
          dataIsArray: Array.isArray(result?.data),
          hasError: !!result?.error,
          errorMessage: result?.error?.message || 'none',
          errorCode: result?.error?.code || 'none',
          errorDetails: result?.error?.details || 'none',
          errorHint: result?.error?.hint || 'none',
          count: result?.count ?? 'null',
          sampleRecipeIds: result?.data?.slice(0, 3).map(r => r.id) || []
        });
        console.log('✅✅✅ [SEARCH QUERY SUCCESS] ============================================');

        simpleData = result?.data || null;
        simpleError = result?.error || null;
        simpleCount = result?.count ?? null;

        if (simpleError) {
          if (import.meta.env.DEV) {
            console.error('❌ [SUPABASE ERROR] Simple query failed:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
          }
          throw new Error(`Database error: ${simpleError.message || 'Unknown error'}`);
        }

        if (!simpleData || simpleData.length === 0) {
          return {
            data: [],
            totalCount: 0,
          };
        }

        // Map results
        const mappedRecipes = simpleData.map(mapSupabaseRecipe).filter(Boolean);

        return {
          data: mappedRecipes,
          totalCount: simpleCount ?? mappedRecipes.length,
        };
      } catch (queryError) {
        const elapsed = Date.now() - queryStartTime;
        console.error('❌❌❌ [SEARCH QUERY ERROR] ============================================');
        console.error('❌ [SEARCH QUERY ERROR] Search ID:', searchId);
        console.error('❌ [SEARCH QUERY ERROR] Query failed after', elapsed, 'ms');
        console.error('❌ [SEARCH QUERY ERROR] Error type:', queryError?.constructor?.name || typeof queryError);
        console.error('❌ [SEARCH QUERY ERROR] Error message:', queryError?.message || String(queryError));
        console.error('❌ [SEARCH QUERY ERROR] Error stack:', queryError?.stack || 'NO STACK');
        console.error('❌ [SEARCH QUERY ERROR] Full error object:', queryError);
        console.error('❌❌❌ [SEARCH QUERY ERROR] ============================================');
        throw queryError;
      }
    }

    // Build complex query with filters
    // CRITICAL: Filter by has_complete_nutrition for regular users (admins see all)
    let builder = supabase
      .from('recipes')
      .select(
        'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition,source',
        {
          count: 'exact',
        }
      );

    // Only filter by complete nutrition for regular users
    // Admins see all recipes (including incomplete ones)
    if (!isAdmin) {
      builder = builder.eq('has_complete_nutrition', true);
    }

    // CRITICAL FIX: Ensure we don't request beyond available records
    // Calculate the end index, but Supabase will automatically cap it to available records
    const rangeEnd = validatedOffset + validatedLimit - 1;
    
    builder = builder
      .order('created_at', { ascending: false }) // Use created_at instead of updated_at (simpler index)
      .range(validatedOffset, rangeEnd); // Server-side pagination (Supabase handles out-of-range gracefully)

    // Building complex query with filters

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
      // If only ingredient filters (no text query), don't filter by title/description
      // We'll search ALL recipes and filter by actual ingredients later
      // This ensures we find recipes even if ingredient names don't appear in titles
      // Just ensure we have complete nutrition recipes
      if (import.meta.env.DEV) {
        console.log(
          '🔍 [INGREDIENT SEARCH] Searching all recipes for ingredient matches:',
          filteredIngredients
        );
      }
    }

    // Apply filters with robust validation
    // CRITICAL: Skip filter if value is "none", "any diet", or "any meal" - these mean "no filter"
    const normalizedDiet = typeof diet === 'string' ? diet.trim().toLowerCase() : '';
    if (
      normalizedDiet &&
      normalizedDiet.length > 0 &&
      normalizedDiet.length <= 50 &&
      normalizedDiet !== 'none' &&
      normalizedDiet !== 'any diet'
    ) {
      try {
        builder = builder.contains('diets', [diet.trim()]); // Use original case for query
      } catch (dietError) {
        console.warn('[searchSupabaseRecipes] Error applying diet filter:', dietError);
      }
    }

    const normalizedMealType = typeof mealType === 'string' ? mealType.trim().toLowerCase() : '';
    if (
      normalizedMealType &&
      normalizedMealType.length > 0 &&
      normalizedMealType.length <= 50 &&
      normalizedMealType !== 'none' &&
      normalizedMealType !== 'any meal'
    ) {
      try {
        builder = builder.contains('meal_types', [mealType.trim()]); // Use original case for query
      } catch (mealTypeError) {
        console.warn('[searchSupabaseRecipes] Error applying meal type filter:', mealTypeError);
      }
    }

    // Max time filter - note: we filter by total time (prep + cook) client-side
    // because Supabase doesn't support computed columns in filters
    // Skip server-side time filtering entirely - let client-side handle it
    // This ensures we don't miss recipes where prep+cook <= maxTime but individual times are higher
    const maxTimeNumber = Number(maxTime);
    const hasMaxTime = !Number.isNaN(maxTimeNumber) && maxTimeNumber > 0 && maxTimeNumber <= 10000;
    // Note: maxTime filtering is done client-side after fetch (see line ~1838)

    // Cuisine filter - validate and skip if empty or "none"
    const normalizedCuisine = typeof cuisine === 'string' ? cuisine.trim().toLowerCase() : '';
    if (
      normalizedCuisine &&
      normalizedCuisine.length > 0 &&
      normalizedCuisine.length <= 50 &&
      normalizedCuisine !== 'none' &&
      normalizedCuisine !== 'any cuisine'
    ) {
      try {
        builder = builder.contains('cuisine', [cuisine.trim()]); // Use original case for query
      } catch (cuisineError) {
        if (import.meta.env.DEV) {
          console.warn('[searchSupabaseRecipes] Error applying cuisine filter:', cuisineError);
        }
      }
    }

    // Difficulty filter - validate and skip if empty or "none"
    // Try server-side first with case-insensitive approach, then refine client-side
    const normalizedDifficulty =
      typeof difficulty === 'string' ? difficulty.trim().toLowerCase() : '';
    const hasDifficulty =
      normalizedDifficulty &&
      normalizedDifficulty.length > 0 &&
      normalizedDifficulty.length <= 20 &&
      normalizedDifficulty !== 'none' &&
      normalizedDifficulty !== 'any difficulty';
    
    // Apply server-side difficulty filter if possible (database stores lowercase)
    // This helps narrow down results before client-side filtering
    if (hasDifficulty) {
      try {
        // Database stores lowercase values, so we can filter server-side
        builder = builder.eq('difficulty', normalizedDifficulty);
      } catch (difficultyError) {
        if (import.meta.env.DEV) {
          console.warn('[searchSupabaseRecipes] Error applying difficulty filter:', difficultyError);
        }
        // Fall back to client-side only if server-side fails
      }
    }
    // Note: Additional client-side filtering for case-insensitive matching (see line ~1940)

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

    // Execute query with timeout protection and detailed logging
    // Variables data, error, count, and mapped are already declared at function scope (line 838-841)
    const queryStartTime = Date.now();

    if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
      console.log('🚀 [SEARCH API] Starting query execution');
      console.log('🚀 [SEARCH API] Query params:', {
        trimmedQuery: trimmedQuery || '(empty)',
        validatedOffset,
        validatedLimit,
        hasFilters: !!(
          trimmedQuery ||
          filteredIngredients.length ||
          diet ||
          mealType ||
          maxTime ||
          cuisine ||
          difficulty
        ),
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Execute the query builder - Supabase returns a promise
      // Use a longer timeout and execute immediately
      const timeoutMs = 30000; // 30 seconds

      // Setting up timeout and executing query

      // Store timeout ID for cleanup
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const elapsed = Date.now() - queryStartTime;
          if (import.meta.env.DEV) {
            console.error('⏰ [SEARCH API] TIMEOUT after', elapsed, 'ms');
          }
          reject(new Error('Query timeout'));
        }, timeoutMs);
      });

      // Execute the query with timeout

      const result = await Promise.race([builder, timeoutPromise]);

      // Clear timeout immediately after result
      if (timeoutId) clearTimeout(timeoutId);

      const elapsed = Date.now() - queryStartTime;

      if (import.meta.env.DEV && import.meta.env.VITE_VERBOSE_LOGS === 'true') {
        console.log('✅ [SEARCH API] Query completed in', elapsed, 'ms');
        console.log('✅ [SEARCH API] Result:', {
          hasData: !!result?.data,
          dataLength: result?.data?.length || 0,
          hasError: !!result?.error,
          errorMessage: result?.error?.message || 'none',
          errorCode: result?.error?.code || 'none',
          count: result?.count ?? 'null',
          isArray: Array.isArray(result?.data),
        });
      }

      // Supabase returns { data, error, count }
      data = result?.data || null;
      error = result?.error || null;
      count = result?.count ?? null;

      // Validate result structure
      if (result && !result.data && !result.error) {
        if (import.meta.env.DEV) {
          console.warn(
            '⚠️ [SEARCH API] Result has no data or error - unexpected structure:',
            result
          );
        }
      }
    } catch (_timeoutError) {
      const elapsed = Date.now() - queryStartTime;

      // If timeout, try a much simpler query as fallback
      if (import.meta.env.DEV) {
        console.warn('⚠️ [SEARCH API] Main query timed out after', elapsed, 'ms, trying fallback...');
      }

      try {
        // Ultra-simple fallback query - no filters, just basic select
        const fallbackStartTime = Date.now();

        // Creating fallback query

        let simpleQuery = supabase
          .from('recipes')
          .select(
            'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition,source',
            { count: 'exact' }
          );

        // Only filter by complete nutrition for regular users
        if (!isAdmin) {
          simpleQuery = simpleQuery.eq('has_complete_nutrition', true);
        }

        simpleQuery = simpleQuery
          .order('created_at', { ascending: false })
          .range(validatedOffset, validatedOffset + validatedLimit - 1);

        const fallbackTimeoutMs = 15000; // 15 seconds for fallback

        if (import.meta.env.DEV) {
          console.log('⏱️ [SEARCH API] Fallback timeout:', fallbackTimeoutMs, 'ms');
          console.log('🔄 [SEARCH API] Executing fallback query...');
        }

        const fallbackTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            const fallbackElapsed = Date.now() - fallbackStartTime;
            if (import.meta.env.DEV) {
              console.error('⏰ [SEARCH API] FALLBACK TIMEOUT after', fallbackElapsed, 'ms');
            }
            reject(new Error('Fallback timeout'));
          }, fallbackTimeoutMs);
        });

        const fallbackResult = await Promise.race([simpleQuery, fallbackTimeoutPromise]);
        const fallbackElapsed = Date.now() - fallbackStartTime;

        if (import.meta.env.DEV) {
          console.log('✅ [SEARCH API] Fallback query completed in', fallbackElapsed, 'ms');
          console.log('✅ [SEARCH API] Fallback result:', {
            hasData: !!fallbackResult?.data,
            dataLength: fallbackResult?.data?.length || 0,
            hasError: !!fallbackResult?.error,
            errorMessage: fallbackResult?.error?.message || 'none',
            count: fallbackResult?.count ?? 'null',
          });
        }

        data = fallbackResult?.data || null;
        error = fallbackResult?.error || null;
        count = fallbackResult?.count ?? null;
      } catch (fallbackError) {
        const totalElapsed = Date.now() - queryStartTime;
        if (import.meta.env.DEV) {
          console.error('❌ [SEARCH API] ============================================');
          console.error('❌ [SEARCH API] BOTH QUERY AND FALLBACK FAILED');
          console.error('❌ [SEARCH API] Total elapsed time:', totalElapsed, 'ms');
          console.error('❌ [SEARCH API] Fallback error:', fallbackError?.message || fallbackError);
          console.error('❌ [SEARCH API] This indicates a Supabase connection issue');
          console.error('❌ [SEARCH API] Check:');
          console.error('❌ [SEARCH API]   1. Supabase URL and key are correct');
          console.error('❌ [SEARCH API]   2. Network connection is working');
          console.error('❌ [SEARCH API]   3. Supabase service is online');
          console.error('❌ [SEARCH API]   4. Database has recipes table');
          console.error('❌ [SEARCH API] ============================================');
        }
        throw new Error('Search request timed out. Please try again.');
      }
    }

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code || 'unknown',
        details: error.details || null,
        hint: error.hint || null,
      };

      if (import.meta.env.DEV) {
        console.error('❌ [SUPABASE ERROR] searchSupabaseRecipes failed:', errorDetails);
        console.error('❌ [SUPABASE ERROR] Full error object:', error);
      }

      // Provide user-friendly error messages based on error code
      if (error.code === 'PGRST116' || error.message?.includes('timeout')) {
        throw new Error('Search request timed out. Please try again with fewer filters.');
      } else if (error.code === 'PGRST301' || error.message?.includes('permission')) {
        throw new Error('Permission denied. Please check your database permissions.');
      } else if (error.code === 'PGRST202' || error.message?.includes('not found')) {
        throw new Error('Recipe not found. Please try a different search.');
      } else if (error.message) {
        throw new Error(`Search failed: ${error.message}`);
      } else {
        throw new Error('Search request failed. Please try again.');
      }
    }

    // Validate data before mapping
    if (!data) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [SEARCH API] No data returned from query');
      }
      return {
        data: [],
        totalCount: 0,
      };
    }

    if (!Array.isArray(data)) {
      if (import.meta.env.DEV) {
        console.error('❌ [SEARCH API] Data is not an array:', typeof data, data);
      }
      return {
        data: [],
        totalCount: 0,
      };
    }

    if (import.meta.env.DEV && data.length === 0) {
      console.warn('⚠️ [SEARCH API] Query returned 0 results');
      console.warn('⚠️ [SEARCH API] This might indicate:');
      console.warn('⚠️ [SEARCH API]   1. No recipes match the filters');
      console.warn('⚠️ [SEARCH API]   2. All recipes have has_complete_nutrition=false');
      console.warn('⚠️ [SEARCH API]   3. Database is empty');
    }

    // Map all recipes - show recipes with or without images
    mapped = data.map(mapSupabaseRecipe).filter(Boolean);

    if (import.meta.env.DEV) {
      console.log('✅ [SEARCH API] Mapped recipes:', {
        rawCount: data.length,
        mappedCount: mapped.length,
        filteredOut: data.length - mapped.length,
      });
    }

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

      // Return all matches (exact first, then partial) up to the requested limit
      // Don't artificially limit to 5-10 - return all matching results
      if (exactMatches.length > 0) {
        mapped = [...exactMatches, ...partialMatches].slice(0, validatedLimit);
      } else {
        mapped = partialMatches.slice(0, validatedLimit);
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
      if (import.meta.env.DEV) {
        console.log(
          '🔍 [INGREDIENT SEARCH] Filtering recipes by ingredients:',
          filteredIngredients
        );
      }

      // For ingredient-only searches, ALWAYS fetch a large batch of recipes
      // Don't rely on initial query results - fetch fresh data
      const fetchLimit = Math.max(validatedLimit * 10, 1000); // Fetch at least 1000 recipes
      if (import.meta.env.DEV) {
        console.log('🔍 [INGREDIENT SEARCH] Fetching recipes to search:', fetchLimit);
      }

      let moreDataQuery = supabase
        .from('recipes')
        .select(
          'id,title,description,hero_image_url,prep_minutes,cook_minutes,servings,difficulty,cuisine,meal_types,diets,author,calories,has_complete_nutrition'
        );

      // Only filter by complete nutrition for regular users
      if (!isAdmin) {
        moreDataQuery = moreDataQuery.eq('has_complete_nutrition', true);
      }

      const { data: moreData, error: moreError } = await moreDataQuery
        .order('created_at', { ascending: false })
        .limit(fetchLimit);

      if (!moreError && moreData) {
        mapped = moreData.map(mapSupabaseRecipe).filter(Boolean);
        if (import.meta.env.DEV) {
          console.log('✅ [INGREDIENT SEARCH] Fetched', mapped.length, 'recipes to search');
        }
      } else if (moreError) {
        console.error('❌ [INGREDIENT SEARCH] Error fetching recipes:', moreError);
        // Don't return empty - try to use existing mapped results if any
        if (mapped.length === 0) {
          throw new Error(`Failed to fetch recipes: ${moreError.message}`);
        }
      }

      if (mapped.length > 0) {
        // Get all recipe IDs
        const recipeIds = mapped.map(r => r.id);

        if (import.meta.env.DEV) {
          console.log(
            '🔍 [INGREDIENT SEARCH] Querying ingredients for',
            recipeIds.length,
            'recipes'
          );
        }

        // Query ingredients table for matching ingredients
        // Use chunks to avoid query size limits
        const chunkSize = 100;
        const chunks = [];
        for (let i = 0; i < recipeIds.length; i += chunkSize) {
          chunks.push(recipeIds.slice(i, i + chunkSize));
        }

        const allIngredientsData = [];
        for (const chunk of chunks) {
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .select('recipe_id, ingredient:ingredients(name)')
            .in('recipe_id', chunk);

          if (!ingredientsError && ingredientsData) {
            allIngredientsData.push(...ingredientsData);
          } else if (ingredientsError) {
            console.warn(
              '⚠️ [INGREDIENT SEARCH] Error querying ingredients chunk:',
              ingredientsError
            );
          }
        }

        if (allIngredientsData.length > 0) {
          // Group ingredients by recipe_id
          const recipeIngredientsMap = new Map();
          allIngredientsData.forEach(item => {
            if (!recipeIngredientsMap.has(item.recipe_id)) {
              recipeIngredientsMap.set(item.recipe_id, []);
            }
            const ingredientName = item.ingredient?.name?.toLowerCase().trim() || '';
            if (ingredientName) {
              recipeIngredientsMap.get(item.recipe_id).push(ingredientName);
            }
          });

          if (import.meta.env.DEV) {
            console.log(
              '✅ [INGREDIENT SEARCH] Found ingredients for',
              recipeIngredientsMap.size,
              'recipes'
            );
          }

          // Helper function to check if two ingredient names match
          // This is VERY lenient to ensure we find recipes - handles underscores, plurals, word matching
          const ingredientMatches = (searchIng, recipeIng) => {
            if (!searchIng || !recipeIng) return false;

            // Normalize both strings - handle underscores, special chars, whitespace
            const normalize = str => {
              if (!str) return '';
              return str
                .toLowerCase()
                .trim()
                .replace(/[^\w\s]/g, ' ') // Replace special chars with space
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/_/g, ' '); // Replace underscores with spaces
            };

            const searchNormalized = normalize(searchIng);
            const recipeNormalized = normalize(recipeIng);

            // Exact match after normalization
            if (searchNormalized === recipeNormalized) return true;

            // Extract meaningful words (length > 2 to avoid matching "a", "an", "the", etc.)
            const getWords = str => str.split(/\s+/).filter(w => w.length > 2);
            const searchWords = getWords(searchNormalized);
            const recipeWords = getWords(recipeNormalized);

            // If any search word appears in recipe (or vice versa), it's a match
            // This handles "chicken" matching "chicken breast", "potato" matching "potatoes", etc.
            for (const searchWord of searchWords) {
              for (const recipeWord of recipeWords) {
                // Exact word match
                if (searchWord === recipeWord) return true;

                // One word contains the other (e.g., "chicken" in "chicken breast")
                if (recipeWord.includes(searchWord) || searchWord.includes(recipeWord)) return true;

                // Handle plural forms more intelligently
                const searchSingular = searchWord.replace(/s$/, '').replace(/ies$/, 'y');
                const recipeSingular = recipeWord.replace(/s$/, '').replace(/ies$/, 'y');
                if (searchSingular === recipeSingular && searchSingular.length > 2) return true;
                if (
                  (recipeWord.includes(searchSingular) || searchWord.includes(recipeSingular)) &&
                  searchSingular.length > 2
                )
                  return true;
              }
            }

            // Fallback: check if the full normalized strings contain each other
            if (
              recipeNormalized.includes(searchNormalized) ||
              searchNormalized.includes(recipeNormalized)
            )
              return true;

            return false;
          };

          // Score recipes by ingredient matches
          const scoredRecipes = mapped.map(recipe => {
            const recipeIngredients = recipeIngredientsMap.get(recipe.id) || [];
            const matchedIngredients = filteredIngredients.filter(searchIng =>
              recipeIngredients.some(recipeIng => ingredientMatches(searchIng, recipeIng))
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

          if (import.meta.env.DEV) {
            const recipesWithMatches = scoredRecipes.filter(r => r._ingredientMatchCount > 0);
            console.log(
              '✅ [INGREDIENT SEARCH] Found',
              recipesWithMatches.length,
              'recipes with ingredient matches'
            );
            if (recipesWithMatches.length > 0) {
              console.log('📊 [INGREDIENT SEARCH] Match distribution:', {
                '1 match': recipesWithMatches.filter(r => r._ingredientMatchCount === 1).length,
                '2 matches': recipesWithMatches.filter(r => r._ingredientMatchCount === 2).length,
                '3+ matches': recipesWithMatches.filter(r => r._ingredientMatchCount >= 3).length,
              });
            }
          }

          // Filter: SUPER LENIENT - always require at least 1 match
          // This ensures we find recipes even with common ingredients like chicken, potato, etc.
          const minMatchThreshold = 1; // Always require at least 1 match

          let filtered = scoredRecipes.filter(r => r._ingredientMatchCount >= minMatchThreshold);

          if (import.meta.env.DEV) {
            console.log(
              '🔍 [INGREDIENT SEARCH] Filtered to',
              filtered.length,
              'recipes with',
              minMatchThreshold,
              '+ matches'
            );
            if (filtered.length === 0) {
              console.error('❌ [INGREDIENT SEARCH] NO MATCHES FOUND!', {
                searchIngredients: filteredIngredients,
                totalRecipesSearched: mapped.length,
                totalRecipesWithIngredients: recipeIngredientsMap.size,
                sampleRecipeIngredients: Array.from(recipeIngredientsMap.entries())
                  .slice(0, 10)
                  .map(([id, ings]) => ({
                    recipeId: id,
                    ingredients: ings.slice(0, 5), // First 5 ingredients
                  })),
                sampleIngredientNames: Array.from(recipeIngredientsMap.values())
                  .flat()
                  .slice(0, 30),
              });
            }
          }

          // If still no results, try recipes with at least 1 ingredient match
          if (filtered.length === 0) {
            filtered = scoredRecipes.filter(r => r._ingredientMatchCount >= 1);
            if (import.meta.env.DEV && filtered.length > 0) {
              console.log(
                '✅ [INGREDIENT SEARCH] Fallback: Found',
                filtered.length,
                'recipes with at least 1 match'
              );
            }
          }

          // Sort by match score (best matches first)
          filtered.sort((a, b) => {
            if (b._ingredientMatchScore !== a._ingredientMatchScore) {
              return b._ingredientMatchScore - a._ingredientMatchScore;
            }
            return b._ingredientMatchCount - a._ingredientMatchCount;
          });

          // Limit to requested limit
          filtered = filtered.slice(0, validatedLimit);

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

          if (import.meta.env.DEV) {
            console.log('✅ [INGREDIENT SEARCH] Final result:', mapped.length, 'recipes');
          }
        } else {
          console.warn('⚠️ [INGREDIENT SEARCH] No ingredients found for any recipes');
          // Return empty array if no ingredient matches
          mapped = [];
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [INGREDIENT SEARCH] No recipes to search through');
        }
        mapped = [];
      }
    }

    // Apply client-side filters that aren't supported by database queries

    // Max time filter - check total time (prep + cook)
    if (hasMaxTime) {
      const beforeTimeFilter = mapped.length;
      mapped = mapped.filter(r => {
        // Check readyInMinutes first (if available), otherwise calculate from prep + cook
        const readyInMinutes = r.readyInMinutes || r.ready_in_minutes;
        if (readyInMinutes && readyInMinutes > 0) {
          return readyInMinutes <= maxTimeNumber;
        }
        // Fallback: calculate from prep + cook
        const prep = r.prepMinutes || r.prep_minutes || 0;
        const cook = r.cookMinutes || r.cook_minutes || 0;
        const totalTime = prep + cook;
        // If total time is 0 or null, include the recipe (don't filter out recipes with missing time data)
        // Only filter out recipes where total time exceeds maxTime
        if (totalTime === 0 || totalTime === null) {
          return true; // Include recipes with missing time data
        }
        return totalTime <= maxTimeNumber;
      });
      if (import.meta.env.DEV && beforeTimeFilter > 0) {
        // Sample a few recipes to see their time data
        const sampleRecipes = mapped.slice(0, 3).map(r => ({
          id: r.id,
          title: r.title?.substring(0, 30),
          prepMinutes: r.prepMinutes,
          cookMinutes: r.cookMinutes,
          readyInMinutes: r.readyInMinutes,
          totalTime: (r.prepMinutes || 0) + (r.cookMinutes || 0),
        }));
        console.log('⏱️ [FILTER] Max time filter:', {
          before: beforeTimeFilter,
          after: mapped.length,
          maxTime: maxTimeNumber,
          removed: beforeTimeFilter - mapped.length,
          sampleRecipes,
        });
      }
    }

    // Max calories filter
    if (hasMaxCalories) {
      mapped = mapped.filter(r => {
        // Check calories from multiple possible locations
        const recipeCalories =
          r.calories ||
          r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount ||
          r.nutrition?.calories ||
          0;
        return recipeCalories > 0 && recipeCalories <= maxCaloriesNumber;
      });
    }

    if (hasHealthScore) {
      const beforeHealthScoreFilter = mapped.length;
      mapped = mapped.filter(r => {
        // Filter by health score if available
        const recipeHealthScore = r.healthScore || r.health_score || null;
        if (recipeHealthScore === null || recipeHealthScore === undefined) {
          // Include recipes without health score (don't filter them out)
          // This allows more recipes to be shown
          return true;
        }
        return recipeHealthScore >= healthScoreNumber;
      });
      if (import.meta.env.DEV && beforeHealthScoreFilter > 0) {
        console.log('💚 [FILTER] Health score filter:', {
          before: beforeHealthScoreFilter,
          after: mapped.length,
          minHealthScore: healthScoreNumber,
        });
      }
    }

    if (hasMinProtein) {
      const beforeProteinFilter = mapped.length;
      mapped = mapped.filter(r => {
        // Check protein from multiple possible locations
        const protein =
          r.protein ||
          r.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount ||
          r.nutrition?.protein ||
          0;
        // Include recipes with protein >= minProtein OR recipes with missing protein data
        // This allows more recipes to be shown
        if (protein === 0 || protein === null || protein === undefined) {
          return true; // Include recipes with missing protein data
        }
        return protein >= minProteinNumber;
      });
      if (import.meta.env.DEV && beforeProteinFilter > 0) {
        console.log('💪 [FILTER] Min protein filter:', {
          before: beforeProteinFilter,
          after: mapped.length,
          minProtein: minProteinNumber,
        });
      }
    }

    if (hasMaxCarbs) {
      mapped = mapped.filter(r => {
        // Check carbs from multiple possible locations
        const carbs =
          r.carbs ||
          r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount ||
          r.nutrition?.carbs ||
          0;
        return carbs > 0 && carbs <= maxCarbsNumber;
      });
    }

    // Difficulty filtering (client-side for case-insensitive matching)
    // Note: Server-side filter already applied, but we do client-side check for safety
    if (hasDifficulty) {
      const beforeDifficultyFilter = mapped.length;
      mapped = mapped.filter(r => {
        const recipeDifficulty = (r.difficulty || '').toString().toLowerCase().trim();
        const matches = recipeDifficulty === normalizedDifficulty;
        // If difficulty doesn't match but we have server-side filter, log it
        if (!matches && import.meta.env.DEV) {
          console.warn('⚠️ [FILTER] Recipe difficulty mismatch:', {
            recipeId: r.id,
            recipeDifficulty,
            expected: normalizedDifficulty,
          });
        }
        return matches;
      });
      if (import.meta.env.DEV && beforeDifficultyFilter > 0) {
        // Sample a few recipes to see their difficulty data
        const sampleRecipes = mapped.slice(0, 3).map(r => ({
          id: r.id,
          title: r.title?.substring(0, 30),
          difficulty: r.difficulty,
          difficultyLower: (r.difficulty || '').toString().toLowerCase().trim(),
        }));
        console.log('🎯 [FILTER] Difficulty filter:', {
          before: beforeDifficultyFilter,
          after: mapped.length,
          filterValue: normalizedDifficulty,
          removed: beforeDifficultyFilter - mapped.length,
          sampleRecipes,
        });
      }
    }

    // Intolerances filtering (client-side)
    if (intolerances) {
      const intoleranceList = intolerances
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(Boolean);
      if (intoleranceList.length > 0) {
        mapped = mapped.filter(r => {
          // Check recipe diets - some diets exclude certain intolerances
          const recipeDiets = Array.isArray(r.diets) ? r.diets.map(d => d.toLowerCase()) : [];

          // Map intolerances to diet exclusions
          const intoleranceToDietMap = {
            dairy: ['vegan', 'dairy-free'],
            egg: ['vegan'],
            gluten: ['gluten free', 'gluten-free'],
            wheat: ['gluten free', 'gluten-free'],
            peanut: ['peanut-free'],
            'tree nut': ['nut-free'],
            seafood: ['pescetarian'], // pescetarian includes seafood, so exclude if seafood intolerant
            shellfish: ['shellfish-free'],
            soy: ['soy-free'],
          };

          // Check if recipe has a diet that excludes any intolerance
          for (const intolerance of intoleranceList) {
            const exclusionDiets = intoleranceToDietMap[intolerance] || [];
            const hasExclusionDiet = exclusionDiets.some(diet =>
              recipeDiets.some(rd => rd.includes(diet) || diet.includes(rd))
            );

            // If recipe doesn't have an exclusion diet, check ingredient names if available
            if (
              !hasExclusionDiet &&
              r.extendedIngredients &&
              Array.isArray(r.extendedIngredients)
            ) {
              const ingredientNames = r.extendedIngredients.map(ing =>
                (ing.name || '').toLowerCase()
              );

              // Check if any ingredient name contains the intolerance
              const hasIntoleranceIngredient = ingredientNames.some(name => {
                // Check for exact match or partial match
                return (
                  name.includes(intolerance) ||
                  (intolerance === 'dairy' &&
                    (name.includes('milk') ||
                      name.includes('cheese') ||
                      name.includes('butter') ||
                      name.includes('cream'))) ||
                  (intolerance === 'gluten' &&
                    (name.includes('wheat') || name.includes('flour') || name.includes('bread'))) ||
                  (intolerance === 'peanut' && name.includes('peanut')) ||
                  (intolerance === 'tree nut' &&
                    (name.includes('almond') ||
                      name.includes('walnut') ||
                      name.includes('cashew') ||
                      name.includes('pecan'))) ||
                  (intolerance === 'soy' && (name.includes('soy') || name.includes('tofu')))
                );
              });

              // If recipe contains an intolerance ingredient, exclude it
              if (hasIntoleranceIngredient) {
                return false;
              }
            }
          }

          // If recipe has exclusion diets for all intolerances, include it
          // Otherwise, if we couldn't determine, include it (to avoid false negatives)
          return true;
        });
      }
    }

    // Removed verbose logging - only log errors

    const duration = Number((now() - t0).toFixed(2));

    console.log('✅✅✅ [SEARCH COMPLETE] ============================================');
    console.log('✅ [SEARCH COMPLETE] Search ID:', searchId);
    console.log('✅ [SEARCH COMPLETE] Total duration:', duration, 'ms');
    console.log('✅ [SEARCH COMPLETE] Final results:', {
      finalRecipeCount: mapped.length,
      rawDataCount: data?.length || 0,
      totalCount: count ?? 'unknown',
      offset: validatedOffset,
      limit: validatedLimit,
      firstRecipeId: mapped[0]?.id || null,
      firstRecipeTitle: mapped[0]?.title || null,
      lastRecipeId: mapped[mapped.length - 1]?.id || null,
      hasMaxTime,
      hasDifficulty,
      maxTimeNumber: hasMaxTime ? maxTimeNumber : null,
      difficultyValue: hasDifficulty ? normalizedDifficulty : null,
      sampleRecipes: mapped.slice(0, 3).map(r => ({
        id: r.id,
        title: r.title?.substring(0, 30),
        hasImage: !!(r.image || r.heroImageUrl)
      }))
    });
    console.log('✅✅✅ [SEARCH COMPLETE] ============================================');
      
    // Log sample recipes to debug filtering
    if (mapped.length === 0 && data && data.length > 0) {
      const samples = data.slice(0, 3).map(r => ({
        id: r.id,
        title: r.title?.substring(0, 40),
        prep_minutes: r.prep_minutes,
        cook_minutes: r.cook_minutes,
        difficulty: r.difficulty,
        totalTime: (r.prep_minutes || 0) + (r.cook_minutes || 0),
      }));
      console.warn('⚠️ [SEARCH API] All recipes filtered out!');
      console.warn('Sample recipes before filtering:', JSON.stringify(samples, null, 2));
      console.warn('Filter criteria:', {
        hasMaxTime,
        maxTimeNumber: hasMaxTime ? maxTimeNumber : null,
        hasDifficulty,
        difficultyValue: hasDifficulty ? normalizedDifficulty : null,
      });
    }

    supabaseLog('searchSupabaseRecipes:complete', {
      count: mapped.length,
      totalCount: count ?? null,
      first: mapped[0]?.id ?? null,
      rawCount: data?.length ?? 0,
      durationMs: duration,
    });

    // Return both data and total count for proper pagination
    return { data: mapped, totalCount: count ?? null };
  } catch (error) {
    console.error('❌❌❌ [SEARCH FATAL ERROR] ============================================');
    console.error('❌ [SEARCH FATAL ERROR] Search ID:', searchId);
    console.error('❌ [SEARCH FATAL ERROR] Error type:', error?.constructor?.name || typeof error);
    console.error('❌ [SEARCH FATAL ERROR] Error message:', error?.message || String(error));
    console.error('❌ [SEARCH FATAL ERROR] Error stack:', error?.stack || 'NO STACK');
    console.error('❌ [SEARCH FATAL ERROR] Full error object:', error);
    console.error('❌ [SEARCH FATAL ERROR] Timestamp:', new Date().toISOString());
    console.error('❌ [SEARCH FATAL ERROR] User Agent:', navigator.userAgent);
    console.error('❌ [SEARCH FATAL ERROR] Network:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
    console.error('❌❌❌ [SEARCH FATAL ERROR] ============================================');
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

  // Fetch related data with timeout protection
  const fetchRelatedData = async () => {
    const queries = [
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
    ];

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Related data fetch timeout')), 10000)
    );

    try {
      const results = await Promise.race([Promise.all(queries), timeoutPromise]);
      return results;
    } catch (_timeoutError) {
      console.error('⏰ [SUPABASE] Related data fetch timeout:', id);
      // Return empty results instead of failing completely
      return [
        { data: [], error: null },
        { data: [], error: null },
        { data: null, error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: null, error: null },
      ];
    }
  };

  const [ingredientsRes, stepsRes, nutritionRes, tagsRes, pairingsRes, healthBadgeRes] =
    await fetchRelatedData();

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

  // CRITICAL: Check for ingredient query errors
  if (ingredientsRes?.error) {
    console.error('❌ [SUPABASE] Error fetching ingredients:', {
      recipeId: id,
      error: ingredientsRes.error.message,
      code: ingredientsRes.error.code,
      details: ingredientsRes.error.details,
      hint: ingredientsRes.error.hint,
    });
  }

  // Warn if no ingredients found
  if (ingredients.length === 0) {
    console.warn('⚠️ [SUPABASE] Recipe has NO ingredients in database:', {
      recipeId: id,
      recipeTitle: recipeRow?.title,
      action: 'This recipe needs ingredients added via admin dashboard',
      hasError: !!ingredientsRes?.error,
      errorMessage: ingredientsRes?.error?.message || null,
    });
  }

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

  // Log all related data fetched with detailed ingredient info
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
    // Detailed ingredient debugging
    ingredientDetails: ingredients.length > 0 ? ingredients.slice(0, 3).map(ing => ({
      id: ing.id,
      ingredient_id: ing.ingredient_id,
      hasIngredientObject: !!ing.ingredient,
      ingredientName: ing.ingredient?.name || 'MISSING',
      quantity: ing.quantity,
      unit: ing.unit,
      preparation: ing.preparation,
    })) : 'NO INGREDIENTS FOUND',
    ingredientsRaw: ingredients.length > 0 ? ingredients.slice(0, 2) : [],
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
    extendedIngredientsCount: mapped?.extendedIngredients?.length ?? 0,
    hasSteps: steps.length > 0,
    hasNutrition: !!nutritionRow,
    hasTags: tags.length > 0,
    hasPairings: pairings.length > 0,
    durationMs: Number((now() - t0).toFixed(2)),
    // Critical: Check if extendedIngredients was properly set
    extendedIngredientsSample: mapped?.extendedIngredients?.slice(0, 2) || 'NOT SET',
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
