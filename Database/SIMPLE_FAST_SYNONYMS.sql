-- =========================================
-- SIMPLE & FAST: CREATE SYNONYMS (NO COMPLEX JOINS)
-- This version is MUCH faster - processes in simple batches
-- =========================================

SET statement_timeout = 0;

DO $$
DECLARE
    total_count INTEGER;
    processed INTEGER := 0;
    created INTEGER := 0;
    start_time TIMESTAMP;
    current_ingredient TEXT;
    usda_name TEXT;
BEGIN
    start_time := clock_timestamp();
    RAISE NOTICE '🚀 Starting simple synonym creation...';
    RAISE NOTICE '⏰ Start: %', start_time;
    
    -- Count how many we need to process
    SELECT COUNT(DISTINCT i.id) INTO total_count
    FROM public.recipe_ingredients ri
    INNER JOIN public.ingredients i ON i.id = ri.ingredient_id
    WHERE i.name IS NOT NULL 
      AND TRIM(i.name) != ''
      AND (SELECT COUNT(DISTINCT ri2.recipe_id) FROM public.recipe_ingredients ri2 WHERE ri2.ingredient_id = i.id) >= 3
      AND NOT EXISTS (SELECT 1 FROM public.ingredient_nutrition in_nutr WHERE LOWER(TRIM(in_nutr.ingredient_name)) = LOWER(TRIM(i.name)))
      AND NOT EXISTS (SELECT 1 FROM public.ingredient_synonyms syn WHERE LOWER(TRIM(syn.recipe_ingredient_name)) = LOWER(TRIM(i.name)));
    
    RAISE NOTICE '📊 Total to process: %', total_count;
    RAISE NOTICE '';
    
    -- Process each ingredient
    FOR current_ingredient IN 
        SELECT DISTINCT i.name
        FROM public.recipe_ingredients ri
        INNER JOIN public.ingredients i ON i.id = ri.ingredient_id
        WHERE i.name IS NOT NULL 
          AND TRIM(i.name) != ''
          AND (SELECT COUNT(DISTINCT ri2.recipe_id) FROM public.recipe_ingredients ri2 WHERE ri2.ingredient_id = i.id) >= 3
          AND NOT EXISTS (SELECT 1 FROM public.ingredient_nutrition in_nutr WHERE LOWER(TRIM(in_nutr.ingredient_name)) = LOWER(TRIM(i.name)))
          AND NOT EXISTS (SELECT 1 FROM public.ingredient_synonyms syn WHERE LOWER(TRIM(syn.recipe_ingredient_name)) = LOWER(TRIM(i.name)))
        ORDER BY i.name
        LIMIT 5000  -- Process max 5000 at a time
    LOOP
        processed := processed + 1;
        
        -- Try to find USDA match (simple normalized match only)
        SELECT in_nutr.ingredient_name INTO usda_name
        FROM public.ingredient_nutrition in_nutr
        WHERE LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            in_nutr.ingredient_name, 'fresh ', ''), 'dried ', ''), 'raw ', ''), ' whole', ''), 
            ' chopped', ''), ' diced', ''), ' sliced', ''), ' minced', ''), ' grated', ''), ' ground', ''))) 
            = LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            current_ingredient, 'fresh ', ''), 'dried ', ''), 'raw ', ''), ' whole', ''), 
            ' chopped', ''), ' diced', ''), ' sliced', ''), ' minced', ''), ' grated', ''), ' ground', '')))
        LIMIT 1;
        
        -- If found, create synonym
        IF usda_name IS NOT NULL THEN
            INSERT INTO public.ingredient_synonyms (recipe_ingredient_name, usda_ingredient_name, confidence, notes)
            VALUES (LOWER(TRIM(current_ingredient)), usda_name, 0.7, 'Simple fast auto-generated')
            ON CONFLICT (recipe_ingredient_name) DO NOTHING;
            
            created := created + 1;
        END IF;
        
        -- Progress every 500
        IF processed % 500 = 0 THEN
            RAISE NOTICE '✅ % / % processed (%.1f%%) | % created | Time: %',
                processed, 
                total_count,
                ROUND(100.0 * processed / NULLIF(total_count, 0), 1),
                created,
                clock_timestamp() - start_time;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DONE! Processed: % | Created: % | Time: %', 
        processed, created, clock_timestamp() - start_time;
END $$;

-- Quick summary
SELECT 
    '📊 Quick Summary' as info,
    COUNT(*) as total_synonyms,
    COUNT(*) FILTER (WHERE notes LIKE '%Simple fast%') as new_synonyms
FROM public.ingredient_synonyms;

