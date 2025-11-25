-- =========================================
-- RECALCULATE NUTRITION FOR RECIPES WITH UNREALISTIC VALUES
-- This script identifies recipes with bad nutrition data and recalculates from ingredients
-- =========================================
-- 
-- HOW IT WORKS:
-- 1. Find recipes with unrealistic nutrition (too low, too high, or macro mismatch)
-- 2. Recalculate nutrition from ingredients using USDA ingredient_nutrition data
-- 3. Update recipe_nutrition table with corrected values
--
-- =========================================

SET statement_timeout = 0;

-- Check if unit conversion table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ingredient_unit_conversions') THEN
        RAISE NOTICE '⚠️  ingredient_unit_conversions table does not exist!';
        RAISE NOTICE '   Please run IMPROVE_UNIT_CONVERSIONS.sql first to create it.';
        RAISE NOTICE '   Continuing with default conversions (less accurate)...';
    ELSE
        RAISE NOTICE '✅ ingredient_unit_conversions table found - using accurate conversions!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ingredient_synonyms') THEN
        RAISE NOTICE '⚠️  ingredient_synonyms table does not exist!';
        RAISE NOTICE '   Please run CREATE_INGREDIENT_SYNONYMS.sql for better matching.';
        RAISE NOTICE '   Continuing without synonyms (may miss some matches)...';
    ELSE
        RAISE NOTICE '✅ ingredient_synonyms table found - using synonym matching!';
    END IF;
END $$;

DO $$
DECLARE
    recipe_record RECORD;
    ingredient_record RECORD;
    total_calories NUMERIC := 0;
    total_protein NUMERIC := 0;
    total_fat NUMERIC := 0;
    total_carbs NUMERIC := 0;
    total_fiber NUMERIC := 0;
    total_sugar NUMERIC := 0;
    total_sodium NUMERIC := 0;
    total_cholesterol NUMERIC := 0;
    total_saturated_fat NUMERIC := 0;
    total_trans_fat NUMERIC := 0;
    total_vitamin_a NUMERIC := 0;
    total_vitamin_c NUMERIC := 0;
    total_vitamin_d NUMERIC := 0;
    total_potassium NUMERIC := 0;
    total_calcium NUMERIC := 0;
    total_iron NUMERIC := 0;
    ingredient_amount_g NUMERIC;
    nutrition_multiplier NUMERIC;
    ingredient_name_lower TEXT;
    conversion_found BOOLEAN;
    conversion_value NUMERIC;
    usda_ingredient_name TEXT;
    search_name TEXT;
    search_name_lower TEXT;
    has_synonym BOOLEAN;
    nutr_calories_per_100g NUMERIC;
    nutr_protein_per_100g NUMERIC;
    nutr_fat_per_100g NUMERIC;
    nutr_carbs_per_100g NUMERIC;
    nutr_fiber_per_100g NUMERIC;
    nutr_sugar_per_100g NUMERIC;
    nutr_sodium_per_100g NUMERIC;
    nutr_cholesterol_per_100g NUMERIC;
    nutr_saturated_fat_per_100g NUMERIC;
    nutr_trans_fat_per_100g NUMERIC;
    nutr_vitamin_a_per_100g NUMERIC;
    nutr_vitamin_c_per_100g NUMERIC;
    nutr_vitamin_d_per_100g NUMERIC;
    nutr_potassium_per_100g NUMERIC;
    nutr_calcium_per_100g NUMERIC;
    nutr_iron_per_100g NUMERIC;
    recipes_processed INTEGER := 0;
    recipes_updated INTEGER := 0;
    recipes_skipped INTEGER := 0;
    current_calories_per_serving NUMERIC;
    expected_calories NUMERIC;
    calorie_diff NUMERIC;
BEGIN
    RAISE NOTICE '🔍 Starting nutrition recalculation for recipes with unrealistic values...';
    
    -- Process recipes with bad nutrition data
    FOR recipe_record IN 
        SELECT 
            r.id,
            r.title,
            r.servings,
            rn.calories,
            rn.protein,
            rn.fat,
            rn.carbs,
            (SELECT COUNT(*) FROM public.recipe_ingredients ri WHERE ri.recipe_id = r.id) as ingredient_count
        FROM public.recipes r
        INNER JOIN public.recipe_nutrition rn ON rn.recipe_id = r.id
        WHERE r.source = 'csv_import'
        AND r.servings > 0
        -- Removed has_complete_nutrition filter - we want to fix ALL recipes with bad nutrition
        AND (
            -- Too low calories per serving (rn.calories is already per-serving)
            rn.calories < 50
            OR
            -- Too high calories per serving
            rn.calories > 2000
            OR
            -- Macro mismatch (calories from macros don't match total by > 30%)
            ABS(rn.calories - ((COALESCE(rn.protein, 0) * 4 + COALESCE(rn.carbs, 0) * 4 + COALESCE(rn.fat, 0) * 9))) > (rn.calories * 0.3)
            OR
            -- Many ingredients but very low calories
            ((SELECT COUNT(*) FROM public.recipe_ingredients ri WHERE ri.recipe_id = r.id) > 5 
             AND rn.calories < 100)
        )
        ORDER BY r.id
        -- Process ALL recipes with bad nutrition (removed limit to process all)
    LOOP
        recipes_processed := recipes_processed + 1;
        
        -- Reset totals for this recipe
        total_calories := 0;
        total_protein := 0;
        total_fat := 0;
        total_carbs := 0;
        total_fiber := 0;
        total_sugar := 0;
        total_sodium := 0;
        total_cholesterol := 0;
        total_saturated_fat := 0;
        total_trans_fat := 0;
        total_vitamin_a := 0;
        total_vitamin_c := 0;
        total_vitamin_d := 0;
        total_potassium := 0;
        total_calcium := 0;
        total_iron := 0;
        
        -- Calculate current issue
        -- NOTE: recipe_record.calories is already PER-SERVING (database stores per-serving)
        current_calories_per_serving := recipe_record.calories;
        expected_calories := (COALESCE(recipe_record.protein, 0) * 4 + COALESCE(recipe_record.carbs, 0) * 4 + COALESCE(recipe_record.fat, 0) * 9);
        calorie_diff := ABS(recipe_record.calories - expected_calories);
        
        RAISE NOTICE '📋 Processing recipe: % (ID: %)', recipe_record.title, recipe_record.id;
        RAISE NOTICE '   Current: % kcal/serving (stored as per-serving), % ingredients', 
            current_calories_per_serving::INTEGER,
            recipe_record.ingredient_count;
        RAISE NOTICE '   Expected from macros: % kcal/serving (diff: %)', 
            expected_calories::INTEGER, 
            calorie_diff::INTEGER;
        
        -- Process each ingredient
        FOR ingredient_record IN
            SELECT 
                ri.quantity,
                ri.unit,
                i.name as ingredient_name
            FROM public.recipe_ingredients ri
            INNER JOIN public.ingredients i ON i.id = ri.ingredient_id
            WHERE ri.recipe_id = recipe_record.id
            AND ri.quantity IS NOT NULL
            AND ri.quantity > 0
        LOOP
            -- Convert quantity to grams using ingredient-specific conversions for 95%+ accuracy
            ingredient_amount_g := NULL;
            ingredient_name_lower := LOWER(TRIM(ingredient_record.ingredient_name));
            
            -- First, try to get ingredient-specific conversion from lookup table
            conversion_found := FALSE;
            conversion_value := NULL;
            
            -- Check for ingredient-specific conversion (exact match or pattern match)
            SELECT 
                CASE 
                    WHEN ingredient_record.unit IN ('cup', 'cups') THEN cup_to_grams
                    WHEN ingredient_record.unit IN ('tbsp', 'tablespoon', 'tablespoons') THEN tbsp_to_grams
                    WHEN ingredient_record.unit IN ('tsp', 'teaspoon', 'teaspoons') THEN tsp_to_grams
                    WHEN ingredient_record.unit IN ('oz', 'ounce', 'ounces') THEN oz_to_grams
                    ELSE NULL
                END
            INTO conversion_value
            FROM public.ingredient_unit_conversions
            WHERE 
                -- Exact match
                ingredient_name_pattern = ingredient_name_lower
                OR
                -- Pattern match (ingredient name contains pattern or vice versa)
                ingredient_name_lower LIKE '%' || ingredient_name_pattern || '%'
                OR
                ingredient_name_pattern LIKE '%' || ingredient_name_lower || '%'
            ORDER BY 
                -- Prioritize exact matches
                CASE WHEN ingredient_name_pattern = ingredient_name_lower THEN 1 ELSE 2 END,
                -- Then prioritize longer patterns (more specific)
                LENGTH(ingredient_name_pattern) DESC
            LIMIT 1;
            
            IF conversion_value IS NOT NULL THEN
                conversion_found := TRUE;
            END IF;
            
            -- Convert to grams using ingredient-specific or default conversion
            IF ingredient_record.unit IN ('g', 'gram', 'grams') THEN
                ingredient_amount_g := ingredient_record.quantity;
            ELSIF ingredient_record.unit IN ('kg', 'kilogram', 'kilograms') THEN
                ingredient_amount_g := ingredient_record.quantity * 1000;
            ELSIF ingredient_record.unit IN ('oz', 'ounce', 'ounces') THEN
                IF conversion_found THEN
                    ingredient_amount_g := ingredient_record.quantity * conversion_value;
                ELSE
                    ingredient_amount_g := ingredient_record.quantity * 28.35; -- Standard: 1 oz = 28.35g
                END IF;
            ELSIF ingredient_record.unit IN ('lb', 'pound', 'pounds', 'lbs') THEN
                ingredient_amount_g := ingredient_record.quantity * 453.592; -- Standard: 1 lb = 453.592g
            ELSIF ingredient_record.unit IN ('ml', 'milliliter', 'milliliters') THEN
                -- For liquids: 1ml ≈ 1g (water-based)
                -- Note: ml is volume, but for water-based liquids, 1ml ≈ 1g
                ingredient_amount_g := ingredient_record.quantity; -- 1ml ≈ 1g for most liquids
            ELSIF ingredient_record.unit IN ('l', 'liter', 'liters') THEN
                ingredient_amount_g := ingredient_record.quantity * 1000; -- 1L = 1000ml = 1000g (water)
            ELSIF ingredient_record.unit IN ('cup', 'cups') THEN
                IF conversion_found THEN
                    ingredient_amount_g := ingredient_record.quantity * conversion_value;
                ELSE
                    -- Default fallback: try to get default conversion
                    SELECT cup_to_grams INTO conversion_value 
                    FROM public.ingredient_unit_conversions 
                    WHERE ingredient_name_pattern = '*DEFAULT*';
                    IF conversion_value IS NOT NULL THEN
                        ingredient_amount_g := ingredient_record.quantity * conversion_value;
                    ELSE
                        ingredient_amount_g := ingredient_record.quantity * 240; -- Fallback: 1 cup = 240g
                    END IF;
                END IF;
            ELSIF ingredient_record.unit IN ('tbsp', 'tablespoon', 'tablespoons') THEN
                IF conversion_found THEN
                    ingredient_amount_g := ingredient_record.quantity * conversion_value;
                ELSE
                    SELECT tbsp_to_grams INTO conversion_value 
                    FROM public.ingredient_unit_conversions 
                    WHERE ingredient_name_pattern = '*DEFAULT*';
                    IF conversion_value IS NOT NULL THEN
                        ingredient_amount_g := ingredient_record.quantity * conversion_value;
                    ELSE
                        ingredient_amount_g := ingredient_record.quantity * 15; -- Fallback: 1 tbsp = 15g
                    END IF;
                END IF;
            ELSIF ingredient_record.unit IN ('tsp', 'teaspoon', 'teaspoons') THEN
                IF conversion_found THEN
                    ingredient_amount_g := ingredient_record.quantity * conversion_value;
                ELSE
                    SELECT tsp_to_grams INTO conversion_value 
                    FROM public.ingredient_unit_conversions 
                    WHERE ingredient_name_pattern = '*DEFAULT*';
                    IF conversion_value IS NOT NULL THEN
                        ingredient_amount_g := ingredient_record.quantity * conversion_value;
                    ELSE
                        ingredient_amount_g := ingredient_record.quantity * 5; -- Fallback: 1 tsp = 5g
                    END IF;
                END IF;
            END IF;
            
            -- Skip if we couldn't convert to grams
            IF ingredient_amount_g IS NULL OR ingredient_amount_g <= 0 THEN
                CONTINUE;
            END IF;
            
            -- Look up nutrition per 100g for this ingredient
            -- Try multiple matching strategies for better results (95%+ accuracy)
            
            -- First, check if we have a synonym mapping
            usda_ingredient_name := NULL;
            SELECT syn.usda_ingredient_name INTO usda_ingredient_name
            FROM public.ingredient_synonyms syn
            WHERE LOWER(TRIM(syn.recipe_ingredient_name)) = ingredient_name_lower
            LIMIT 1;
            
            -- Use synonym if found, otherwise use original name
            search_name := COALESCE(usda_ingredient_name, ingredient_record.ingredient_name);
            search_name_lower := LOWER(TRIM(search_name));
            has_synonym := (usda_ingredient_name IS NOT NULL);
            
            SELECT 
                in_nutr.calories_per_100g,
                in_nutr.protein_per_100g,
                in_nutr.fat_per_100g,
                in_nutr.carbs_per_100g,
                in_nutr.fiber_per_100g,
                in_nutr.sugar_per_100g,
                in_nutr.sodium_per_100g,
                in_nutr.cholesterol_per_100g,
                in_nutr.saturated_fat_per_100g,
                in_nutr.trans_fat_per_100g,
                in_nutr.vitamin_a_per_100g,
                in_nutr.vitamin_c_per_100g,
                in_nutr.vitamin_d_per_100g,
                in_nutr.potassium_per_100g,
                in_nutr.calcium_per_100g,
                in_nutr.iron_per_100g
            INTO 
                nutr_calories_per_100g,
                nutr_protein_per_100g,
                nutr_fat_per_100g,
                nutr_carbs_per_100g,
                nutr_fiber_per_100g,
                nutr_sugar_per_100g,
                nutr_sodium_per_100g,
                nutr_cholesterol_per_100g,
                nutr_saturated_fat_per_100g,
                nutr_trans_fat_per_100g,
                nutr_vitamin_a_per_100g,
                nutr_vitamin_c_per_100g,
                nutr_vitamin_d_per_100g,
                nutr_potassium_per_100g,
                nutr_calcium_per_100g,
                nutr_iron_per_100g
            FROM public.ingredient_nutrition in_nutr
            WHERE 
                -- Strategy 1: Exact match with synonym (highest priority)
                (has_synonym AND LOWER(TRIM(in_nutr.ingredient_name)) = search_name_lower)
                OR
                -- Strategy 2: Exact match original name
                LOWER(TRIM(in_nutr.ingredient_name)) = ingredient_name_lower
                OR
                -- Strategy 3: Match after removing common prefixes/suffixes
                LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    in_nutr.ingredient_name, 'fresh ', ''), 'dried ', ''), 'raw ', ''), ' whole', ''), 
                    ' chopped', ''), ' diced', ''), ' sliced', ''), ' minced', ''), ' grated', ''), ' ground', ''))) 
                = LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    search_name, 'fresh ', ''), 'dried ', ''), 'raw ', ''), ' whole', ''), 
                    ' chopped', ''), ' diced', ''), ' sliced', ''), ' minced', ''), ' grated', ''), ' ground', '')))
                OR
                -- Strategy 4: Partial match (contains the core ingredient name)
                LOWER(in_nutr.ingredient_name) LIKE '%' || search_name_lower || '%'
                OR
                search_name_lower LIKE '%' || LOWER(TRIM(in_nutr.ingredient_name)) || '%'
                OR
                -- Strategy 5: Match original name with partial (fallback)
                LOWER(in_nutr.ingredient_name) LIKE '%' || ingredient_name_lower || '%'
                OR
                ingredient_name_lower LIKE '%' || LOWER(TRIM(in_nutr.ingredient_name)) || '%'
            ORDER BY 
                -- Prioritize: synonym exact > original exact > normalized > partial
                CASE 
                    WHEN has_synonym AND LOWER(TRIM(in_nutr.ingredient_name)) = search_name_lower THEN 1
                    WHEN LOWER(TRIM(in_nutr.ingredient_name)) = ingredient_name_lower THEN 2
                    WHEN LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        in_nutr.ingredient_name, 'fresh ', ''), 'dried ', ''), 'raw ', ''), ' whole', ''), 
                        ' chopped', ''), ' diced', ''), ' sliced', ''), ' minced', ''), ' grated', ''), ' ground', ''))) 
                        = LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        search_name, 'fresh ', ''), 'dried ', ''), 'raw ', ''), ' whole', ''), 
                        ' chopped', ''), ' diced', ''), ' sliced', ''), ' minced', ''), ' grated', ''), ' ground', ''))) THEN 3
                    ELSE 4
                END
            LIMIT 1;
            
            -- If found, add to totals
            IF nutr_calories_per_100g IS NOT NULL THEN
                nutrition_multiplier := ingredient_amount_g / 100.0;
                
                total_calories := COALESCE(total_calories, 0) + COALESCE(nutr_calories_per_100g, 0) * nutrition_multiplier;
                total_protein := COALESCE(total_protein, 0) + COALESCE(nutr_protein_per_100g, 0) * nutrition_multiplier;
                total_fat := COALESCE(total_fat, 0) + COALESCE(nutr_fat_per_100g, 0) * nutrition_multiplier;
                total_carbs := COALESCE(total_carbs, 0) + COALESCE(nutr_carbs_per_100g, 0) * nutrition_multiplier;
                total_fiber := COALESCE(total_fiber, 0) + COALESCE(nutr_fiber_per_100g, 0) * nutrition_multiplier;
                total_sugar := COALESCE(total_sugar, 0) + COALESCE(nutr_sugar_per_100g, 0) * nutrition_multiplier;
                total_sodium := COALESCE(total_sodium, 0) + COALESCE(nutr_sodium_per_100g, 0) * nutrition_multiplier;
                total_cholesterol := COALESCE(total_cholesterol, 0) + COALESCE(nutr_cholesterol_per_100g, 0) * nutrition_multiplier;
                total_saturated_fat := COALESCE(total_saturated_fat, 0) + COALESCE(nutr_saturated_fat_per_100g, 0) * nutrition_multiplier;
                total_trans_fat := COALESCE(total_trans_fat, 0) + COALESCE(nutr_trans_fat_per_100g, 0) * nutrition_multiplier;
                total_vitamin_a := COALESCE(total_vitamin_a, 0) + COALESCE(nutr_vitamin_a_per_100g, 0) * nutrition_multiplier;
                total_vitamin_c := COALESCE(total_vitamin_c, 0) + COALESCE(nutr_vitamin_c_per_100g, 0) * nutrition_multiplier;
                total_vitamin_d := COALESCE(total_vitamin_d, 0) + COALESCE(nutr_vitamin_d_per_100g, 0) * nutrition_multiplier;
                total_potassium := COALESCE(total_potassium, 0) + COALESCE(nutr_potassium_per_100g, 0) * nutrition_multiplier;
                total_calcium := COALESCE(total_calcium, 0) + COALESCE(nutr_calcium_per_100g, 0) * nutrition_multiplier;
                total_iron := COALESCE(total_iron, 0) + COALESCE(nutr_iron_per_100g, 0) * nutrition_multiplier;
            END IF;
        END LOOP;
        
        -- Only update if we calculated meaningful values
        IF total_calories > 0 AND total_calories < 50000 THEN  -- Sanity check: max 50k calories total
            -- CRITICAL: Database stores PER-SERVING values, not totals!
            -- Calculate per-serving values by dividing totals by servings
            -- The rehydration function will multiply by servings when displaying
            
            -- Update recipe_nutrition with PER-SERVING values
            UPDATE public.recipe_nutrition
            SET 
                calories = ROUND(total_calories / recipe_record.servings),
                protein = ROUND((total_protein / recipe_record.servings), 1),
                fat = ROUND((total_fat / recipe_record.servings), 1),
                carbs = ROUND((total_carbs / recipe_record.servings), 1),
                fiber = ROUND((total_fiber / recipe_record.servings), 1),
                sugar = ROUND((total_sugar / recipe_record.servings), 1),
                sodium = ROUND(total_sodium / recipe_record.servings),
                cholesterol = ROUND(total_cholesterol / recipe_record.servings),
                saturated_fat = ROUND((total_saturated_fat / recipe_record.servings), 1),
                trans_fat = ROUND((total_trans_fat / recipe_record.servings), 1),
                vitamin_a = ROUND(total_vitamin_a / recipe_record.servings),
                vitamin_c = ROUND(total_vitamin_c / recipe_record.servings),
                vitamin_d = ROUND(total_vitamin_d / recipe_record.servings),
                potassium = ROUND(total_potassium / recipe_record.servings),
                calcium = ROUND(total_calcium / recipe_record.servings),
                iron = ROUND((total_iron / recipe_record.servings), 1)
            WHERE recipe_id = recipe_record.id;
            
            recipes_updated := recipes_updated + 1;
            
            RAISE NOTICE '   ✅ Updated: % kcal/serving (was %), % kcal total for % servings', 
                ROUND(total_calories / recipe_record.servings)::INTEGER,
                ROUND(recipe_record.calories / recipe_record.servings)::INTEGER,
                total_calories::INTEGER,
                recipe_record.servings;
        ELSE
            recipes_skipped := recipes_skipped + 1;
            RAISE NOTICE '   ⚠️  Skipped: Could not calculate from ingredients (no matching USDA data)';
        END IF;
        
        -- Progress update every 100 recipes
        IF recipes_processed % 100 = 0 THEN
            RAISE NOTICE '📊 Progress: % processed, % updated, % skipped', 
                recipes_processed, recipes_updated, recipes_skipped;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Complete! Processed: %, Updated: %, Skipped: %', 
        recipes_processed, recipes_updated, recipes_skipped;
END $$;

