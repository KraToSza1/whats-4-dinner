-- =========================================
-- GO LIVE: MARK FIXED RECIPES AS COMPLETE
-- Run this to show only the 16,984 fixed recipes in your app
-- =========================================

-- Mark ALL recipes with realistic nutrition as complete
-- This includes the 16,984 that were just recalculated
UPDATE public.recipes r
SET has_complete_nutrition = TRUE
FROM public.recipe_nutrition rn
WHERE r.id = rn.recipe_id
  AND r.source = 'csv_import'
  AND r.servings > 0
  -- Realistic nutrition values
  AND rn.calories >= 50
  AND rn.calories <= 2000
  -- Macros make sense (within 30%)
  AND ABS(rn.calories - ((COALESCE(rn.protein, 0) * 4 + COALESCE(rn.carbs, 0) * 4 + COALESCE(rn.fat, 0) * 9))) <= (rn.calories * 0.3)
  -- Key nutrients present
  AND rn.potassium > 0
  AND rn.calcium > 0
  AND rn.iron > 0;

-- Show final count
SELECT 
    '✅ READY TO GO LIVE!' as status,
    COUNT(*) as recipes_available,
    'These recipes will show in your app' as note
FROM public.recipes
WHERE source = 'csv_import'
AND has_complete_nutrition = TRUE;

