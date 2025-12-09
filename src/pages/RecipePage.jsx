import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// Spoonacular removed - using Supabase recipes only
import { getSupabaseRecipeById } from '../api/supabaseRecipes.js';
import { recipeImg, fallbackOnce, isUuid } from '../utils/img.ts';
import { useGroceryList } from '../context/GroceryListContext.jsx';
import { setMealPlanDay } from './MealPlanner.jsx';
import {
  safeLocalStorage,
  safeSessionStorage,
  safeJSONParse,
  safeJSONStringify,
} from '../utils/browserCompatibility.js';
import ServingsCalculator from '../components/ServingsCalculator.jsx';
import ShareButton from '../components/ShareButton.jsx';
import SmartSwaps from '../components/SmartSwaps.jsx';
import { getRecipeSwaps, applySwapToIngredient } from '../utils/ingredientSwaps.js';
import {
  convertIngredient,
  formatIngredientQuantity,
  formatNutrientAmount,
  UNIT_SYSTEMS,
} from '../utils/unitConverter.js';
import { RecipePageSkeleton } from '../components/LoadingSkeleton.jsx';
import { FullPageRecipeLoader } from '../components/FoodLoaders.jsx';
import { triggerHaptic } from '../utils/haptics.js';
import { addMealToTracker } from '../components/CalorieTracker.jsx';
import { cleanRecipeTitle, cleanRecipeInstructions } from '../utils/recipeFormatter.js';
import { trackRecipeView, trackRecipeInteraction } from '../utils/analytics.js';
import { trackRecipeView as trackGamificationView, trackRecipeCook } from '../utils/userStats.js';
import { calculateTotalServingsNeeded, getFamilySummary } from '../utils/familyCalculations.js';
import RecipeCollectionsButton from '../components/RecipeCollectionsButton.jsx';
import RecipeNotes from '../components/RecipeNotes.jsx';
import { addRecipeToHistory } from '../utils/recipeHistory.js';
import { getLeftoverIdeasFromRecipe } from '../utils/leftoverIdeas.js';
import { getSimilarRecipes, getCompleteMealSuggestions } from '../utils/recipeRecommendations.js';
import { FEATURES } from '../config';
import { useToast } from '../components/Toast.jsx';
import { trackFeatureUsage, FEATURES as FEATURE_CONSTANTS } from '../utils/featureTracking.js';
import { addRecipeToCalorieTracker } from '../utils/calorieIntegration.js';
import { IngredientReveal, FoodConfetti } from '../components/animations/FoodParticles.jsx';
import CookMode from '../components/CookMode.jsx';
import MealPrepMode from '../components/MealPrepMode.jsx';
import NutritionLabel from '../components/NutritionLabel.jsx';
import CookingSkills from '../components/CookingSkills.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { useAchievements, AchievementUnlock } from '../components/animations/Achievements.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyStateAnimation } from '../components/LottieFoodAnimations.jsx';
import MedicalWarning from '../components/MedicalWarning.jsx';

const MEASUREMENT_OPTIONS = [
  {
    key: 'metric',
    label: UNIT_SYSTEMS.metric?.name || 'Metric',
    hint: UNIT_SYSTEMS.metric?.hint || 'grams • milliliters',
    flag: UNIT_SYSTEMS.metric?.flag || '🌍',
  },
  {
    key: 'us',
    label: UNIT_SYSTEMS.us?.name || 'US',
    hint: UNIT_SYSTEMS.us?.hint || 'cups • ounces',
    flag: UNIT_SYSTEMS.us?.flag || '🇺🇸',
  },
  {
    key: 'uk',
    label: UNIT_SYSTEMS.uk?.name || 'UK',
    hint: UNIT_SYSTEMS.uk?.hint || 'ml • imperial',
    flag: UNIT_SYSTEMS.uk?.flag || '🇬🇧',
  },
];

export default function RecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rrLocation = useLocation(); // avoid colliding with window.location
  const toast = useToast();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Debug: Log confettiTrigger changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn('🎉 [RECIPE PAGE] confettiTrigger changed:', confettiTrigger);
    }
  }, [confettiTrigger]);
  const [showCookMode, setShowCookMode] = useState(false);
  const [showMealPrepMode, setShowMealPrepMode] = useState(false);
  const [showNutritionLabel, setShowNutritionLabel] = useState(false);
  const [showCookingSkills, setShowCookingSkills] = useState(false);
  const { checkAchievements, currentUnlock, setCurrentUnlock } = useAchievements();

  // Use card data for instant paint, but always fetch full details
  const preloaded = rrLocation.state?.recipe || null;

  const [recipe, setRecipe] = useState(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState(null);

  // If we have preloaded recipe, use it immediately for instant display
  // The main useEffect below will fetch full details (ingredients, steps, etc.)
  useEffect(() => {
    if (preloaded && preloaded.id === id) {
      // We have preloaded data, show it immediately for instant paint
      setRecipe(preloaded);
      setLoading(false);
      if (import.meta.env.DEV) {
        console.warn(
          '📄 [RECIPE PAGE] Using preloaded recipe for instant display, will fetch full details...',
          {
            hasExtendedIngredients: !!(preloaded.extendedIngredients?.length),
            extendedIngredientsCount: preloaded.extendedIngredients?.length || 0
          }
        );
      }
    }
  }, [preloaded, id]);

  // Grocery list context
  const { addMany, setOpen } = useGroceryList();

  // Servings calculator state
  const [targetServings, setTargetServings] = useState(4);

  // Unit system state to trigger re-render
  const [unitSystem, setUnitSystem] = useState(() => {
    try {
      return safeLocalStorage.getItem('unitSystem') || 'metric';
    } catch {
      return 'metric';
    }
  });
  const handleUnitPreferenceChange = useCallback(
    system => {
      if (!system || system === unitSystem) return;
      const allowed = UNIT_SYSTEMS[system] ? system : 'metric';
      setUnitSystem(allowed);
      try {
        safeLocalStorage.setItem('unitSystem', allowed);
      } catch (err) {
        // Silently handle localStorage errors (e.g., quota exceeded, private browsing)
        if (import.meta.env.DEV) {
          console.warn('[RecipePage] Failed to save unit system preference:', err);
        }
      }
    },
    [unitSystem]
  );

  // Cook Mode state
  const [cookOpen, setCookOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [ticking, setTicking] = useState(false);

  // New features state
  const [leftoverIdeas, setLeftoverIdeas] = useState([]);
  const [similarRecipes, setSimilarRecipes] = useState([]);
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [_loadingSuggestions, setLoadingSuggestions] = useState(false);

  // simple timer tick
  useEffect(() => {
    if (!ticking || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [ticking, secondsLeft]);

  useEffect(() => {
    // CRITICAL FIX: Always fetch full recipe details, even if preloaded
    // Preloaded recipes from RecipeCard don't include extendedIngredients, steps, etc.
    // We MUST fetch the full recipe to get all data including ingredients
    
    let ignore = false;
    let timeoutId = null;

    (async () => {
      if (import.meta.env.DEV) {
        console.warn('📄 [RECIPE PAGE] Loading recipe page:', { 
          id, 
          isUuid: isUuid(id),
          hasPreloaded: !!preloaded,
          preloadedHasIngredients: !!(preloaded?.extendedIngredients?.length)
        });
      }
      
      // Only show loading if we don't have preloaded data
      if (!preloaded || preloaded.id !== id) {
        setLoading(true);
      }
      setError(null);

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (!ignore) {
          console.error('⏰ [RECIPE PAGE] Recipe fetch timeout after 15 seconds');
          setError('Recipe load timeout. Please try again.');
          setLoading(false);
        }
      }, 15000);

      try {
        let full = null;

        if (isUuid(id)) {
          if (import.meta.env.DEV) {
            console.warn('🔍 [RECIPE PAGE] Attempting Supabase fetch for UUID:', id);
          }
          try {
            // Add timeout wrapper to prevent hanging
            const fetchPromise = getSupabaseRecipeById(id);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Fetch timeout')), 12000)
            );

            full = await Promise.race([fetchPromise, timeoutPromise]);

            if (full) {
              // Debug: Log nutrition data from the loaded recipe
              const caloriesNutrient = full.nutrition?.nutrients?.find(n => n.name === 'Calories');
              if (import.meta.env.DEV) {
                console.warn('✅ [RECIPE PAGE] Successfully loaded from Supabase:', {
                  id: full.id,
                  title: full.title,
                  hasImage: !!(full.image || full.heroImageUrl),
                  imageUrl: full.image || full.heroImageUrl || 'MISSING',
                  servings: full.servings,
                  readyInMinutes: full.readyInMinutes,
                  ingredientsCount: full.extendedIngredients?.length || 0,
                  stepsCount: full.analyzedInstructions?.[0]?.steps?.length || 0,
                  hasNutrition: !!full.nutrition,
                  nutritionCalories: caloriesNutrient?.amount,
                  nutritionCaloriesUnit: caloriesNutrient?.unit,
                  hasPairings: full.beveragePairings?.length > 0,
                  // CRITICAL: Check if extendedIngredients exists
                  extendedIngredientsExists: !!full.extendedIngredients,
                  extendedIngredientsIsArray: Array.isArray(full.extendedIngredients),
                  extendedIngredientsSample: full.extendedIngredients?.slice(0, 2) || 'NONE',
                });
              }

              // CRITICAL: Warn if recipe has no ingredients
              if (!full.extendedIngredients || full.extendedIngredients.length === 0) {
                console.warn('⚠️ [RECIPE PAGE] ⚠️⚠️⚠️ RECIPE HAS NO INGREDIENTS! ⚠️⚠️⚠️', {
                  recipeId: full.id,
                  recipeTitle: full.title,
                  action: 'This recipe needs ingredients added in the admin dashboard',
                  note: 'Go to /admin → Recipes tab → Find this recipe → Add ingredients',
                });
              }
            } else {
              if (import.meta.env.DEV) {
                console.warn('⚠️ [RECIPE PAGE] Supabase returned null for:', id);
              }
            }
          } catch (supabaseError) {
            console.error('❌ [RECIPE PAGE] Supabase fetch failed:', {
              id,
              error: supabaseError.message,
              stack: supabaseError.stack,
            });
            // If it's a timeout, show specific error
            if (supabaseError.message === 'Fetch timeout') {
              throw new Error('Recipe load timeout. Please try again.');
            }
          }
        }

        if (!full) {
          const reason = 'Recipe not found.';
          console.error('❌ [RECIPE PAGE] Recipe not found:', { id, reason });
          throw new Error(reason);
        }

        if (!ignore && full) {
          // Clear timeout since we got the recipe
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          // Debug: Log nutrition before setting recipe state
          const caloriesNutrient = full.nutrition?.nutrients?.find(n => n.name === 'Calories');
          if (import.meta.env.DEV) {
            console.warn('✅ [RECIPE PAGE] Setting recipe state:', {
              id: full.id,
              title: full.title,
              source: full.source || 'unknown',
              hasImage: !!(full.image || full.heroImageUrl),
              imageUrl: full.image || full.heroImageUrl || 'MISSING',
              nutritionCalories: caloriesNutrient?.amount,
              nutritionCaloriesUnit: caloriesNutrient?.unit,
              note: 'This is what will be stored in recipe state',
            });
          }

          // Clean title and instructions before setting recipe
          if (full) {
            full.title = cleanRecipeTitle(full.title);
            if (full.instructions) {
              full.instructions = cleanRecipeInstructions(full.instructions).join(' ');
            }
          }
          setRecipe(full);
          // Track recipe view
          if (full?.id) {
            trackRecipeView(full.id);
            trackRecipeInteraction(full.id, 'view', {
              title: full.title,
              image: full.image,
            });
            // Track for gamification (streaks, XP, badges)
            trackGamificationView(full);
          }
          // Set initial servings from saved, family members, or recipe default
          try {
            const saved = safeLocalStorage.getItem(`servings:${id}`);
            if (saved) {
              setTargetServings(parseInt(saved, 10));
            } else {
              // Try to use family-based calculation
              const familySummary = getFamilySummary();
              if (familySummary.totalMembers > 0) {
                const familyServings = calculateTotalServingsNeeded(full?.servings || 4);
                setTargetServings(familyServings);
              } else if (full?.servings) {
                setTargetServings(full.servings);
              }
            }
          } catch (err) {
            // Silently handle localStorage errors (e.g., quota exceeded, private browsing)
            if (import.meta.env.DEV) {
              console.warn('[RecipePage] Failed to load/save servings preference:', err);
            }
          }

          // Load suggestions
          loadSuggestions(full);
        }
      } catch (e) {
        console.error('[RecipePage] Failed to load recipe:', e);
        if (!ignore) setError(e.message || 'Failed to load recipe.');
      } finally {
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id, preloaded]);

  // Save servings preference
  useEffect(() => {
    if (recipe?.id && targetServings !== recipe.servings) {
      try {
        safeLocalStorage.setItem(`servings:${recipe.id}`, String(targetServings));
      } catch (err) {
        // Silently handle localStorage errors (e.g., quota exceeded, private browsing)
        if (import.meta.env.DEV) {
          console.warn('[RecipePage] Failed to save servings preference:', err);
        }
      }
    }
  }, [targetServings, recipe?.id, recipe?.servings]);

  // Calculate recipe cost when recipe changes

  // Load suggestions
  const loadSuggestions = async recipeData => {
    if (!recipeData) return;
    setLoadingSuggestions(true);
    try {
      // Load leftover ideas
      const diet = safeLocalStorage.getItem('filters:diet') || '';
      const intolerances = safeLocalStorage.getItem('filters:intolerances') || '';
      const leftovers = await getLeftoverIdeasFromRecipe(recipeData, diet, intolerances);
      setLeftoverIdeas(Array.isArray(leftovers) ? leftovers.slice(0, 6) : []);

      // Load similar recipes
      const similar = await getSimilarRecipes(recipeData, 5);
      setSimilarRecipes(similar);

      // Load meal suggestions
      const suggestions = await getCompleteMealSuggestions(recipeData, 3);
      setMealSuggestions(suggestions);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Track recipe made (add to history)
  const handleRecipeMade = () => {
    if (!recipe?.id) {
      toast.error('Recipe not loaded yet. Please wait.');
      return;
    }

    addRecipeToHistory(recipe.id, {
      servings: targetServings,
      success: true,
    });

    // Add to calorie tracker if nutrition data available
    if (recipe.calories || recipe.nutrition?.calories) {
      try {
        addRecipeToCalorieTracker(recipe, targetServings, 'dinner');
      } catch (error) {
        // Silently fail if calorie tracker not available
        if (import.meta.env.DEV) {
          console.warn('Could not add recipe to calorie tracker:', error);
        }
      }
    }

    // Track feature usage
    trackFeatureUsage(FEATURE_CONSTANTS.RECIPE_COOK, {
      recipeId: recipe.id,
      servings: targetServings,
      calories: recipe.calories || recipe.nutrition?.calories || 0,
    });

    // Track for gamification (XP, badges, streaks)
    const result = trackRecipeCook(recipe);
    if (result?.leveledUp) {
      // Level up will be handled by GamificationDashboard
      toast.success(`Level Up! You're now Level ${result.xpResult.newLevel}! 🎉`);
    }
    if (result?.newBadges && result.newBadges.length > 0) {
      result.newBadges.forEach(badge => {
        toast.success(`Badge Unlocked: ${badge.name}! 🏆`);
      });
    }

    // Show success message
    toast.success(`Marked "${title}" as made! ✅`);

    triggerHaptic('success');
    setConfettiTrigger(prev => {
      const newValue = prev + 1;
      if (import.meta.env.DEV) {
        console.warn('✅ [RECIPE PAGE] Confetti trigger:', { prev, newValue });
      }
      return newValue;
    });

    toast.success('Recipe added to your history! 📝');

    // Check achievements
    const history = safeJSONParse(safeLocalStorage.getItem('recipeHistory'), []);
    const cookedCount = history.filter(h => h.success).length;
    checkAchievements('recipe_cooked', cookedCount);
  };

  // Track recipe view for achievements
  useEffect(() => {
    if (recipe?.id) {
      const viewedRecipes = safeJSONParse(safeLocalStorage.getItem('viewedRecipes'), []);
      if (!viewedRecipes.includes(recipe.id)) {
        viewedRecipes.push(recipe.id);
        safeLocalStorage.setItem('viewedRecipes', safeJSONStringify(viewedRecipes, '[]'));
        checkAchievements('recipe_view', viewedRecipes.length);
      }
      // Track feature usage
      trackFeatureUsage(FEATURE_CONSTANTS.RECIPE_SEARCH, { recipeId: recipe.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]); // checkAchievements is stable via useCallback, but we only want to run when recipe.id changes

  // Listen for unit system changes
  useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === 'unitSystem') {
        setUnitSystem(e.newValue || 'metric');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check for same-tab changes (less frequently to avoid loops)
    const interval = setInterval(() => {
      try {
        const current = safeLocalStorage.getItem('unitSystem') || 'metric';
        setUnitSystem(prev => {
          // Only update if actually different
          if (current !== prev) {
            return current;
          }
          return prev;
        });
      } catch (err) {
        // Silently handle localStorage errors (e.g., quota exceeded, private browsing)
        if (import.meta.env.DEV) {
          console.warn('[RecipePage] Failed to sync recipe state from storage:', err);
        }
      }
    }, 2000); // Reduced frequency from 500ms to 2000ms
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []); // Empty deps - only run once on mount

  const title = recipe?.title || 'Recipe';
  const rawHeroImage = recipe?.hero_image_url || recipe?.image;
  const heroImage = rawHeroImage ? recipeImg(rawHeroImage, recipe?.id) : null;

  // Scaling logic for ingredients
  const originalServings = recipe?.servings || 4;
  // Protect against division by zero and invalid values
  // Memoize scaleRatio to ensure stable reference
  const scaleRatio = useMemo(() => {
    const ratio =
      originalServings > 0 &&
      targetServings > 0 &&
      Number.isFinite(originalServings) &&
      Number.isFinite(targetServings)
        ? targetServings / originalServings
        : 1;

    // Debug logging for scaling issues
    if (import.meta.env.DEV && recipe?.id) {
      const logKey = `scale-ratio-${recipe.id}-${targetServings}`;
      const lastLogged = safeSessionStorage.getItem(logKey);
      const currentKey = `${originalServings}-${targetServings}-${ratio.toFixed(3)}`;

      if (lastLogged !== currentKey) {
        console.warn('📊 [SCALE RATIO]', {
          recipeId: recipe.id,
          originalServings,
          targetServings,
          scaleRatio: ratio.toFixed(3),
          note: 'This ratio multiplies the TOTAL stored value to get scaled value',
        });
        safeSessionStorage.setItem(logKey, currentKey);
      }
    }

    return ratio;
  }, [originalServings, targetServings, recipe?.id]);

  const scaleNutrientAmount = useCallback(
    (name, baseAmount) => {
      if (baseAmount === null || baseAmount === undefined) return null;

      // Validate inputs
      if (
        !Number.isFinite(baseAmount) ||
        !Number.isFinite(scaleRatio) ||
        !Number.isFinite(originalServings)
      ) {
        console.warn('⚠️ [NUTRITION SCALING] Invalid values:', {
          name,
          baseAmount,
          scaleRatio,
          originalServings,
        });
        return baseAmount;
      }

      // IMPORTANT: baseAmount is stored as TOTAL for the recipe in the database
      // We need to: (total / originalServings) * targetServings = total * (targetServings / originalServings)
      // Which simplifies to: total * scaleRatio
      // This correctly scales the total to match targetServings
      const scaled = baseAmount * scaleRatio;

      // Ensure result is valid number
      if (!Number.isFinite(scaled)) {
        console.warn('⚠️ [NUTRITION SCALING] Scaled value is not finite:', {
          name,
          baseAmount,
          scaleRatio,
          scaled,
        });
        return baseAmount;
      }

      const result = scaled % 1 === 0 ? scaled : Math.round(scaled * 100) / 100;

      // Only log once per nutrient per scaleRatio change to prevent spam
      if (import.meta.env.DEV && scaleRatio !== 1) {
        const logKey = `nutrition-scaling-${name}-${scaleRatio}`;
        const lastLogged = safeSessionStorage.getItem(logKey);
        const currentKey = `${baseAmount}-${result}`;

        if (lastLogged !== currentKey) {
          console.warn('📊 [NUTRITION SCALING]', {
            nutrient: name,
            baseAmount,
            scaleRatio: Number(scaleRatio.toFixed(3)),
            scaledAmount: result,
            originalServings,
            targetServings,
          });
          safeSessionStorage.setItem(logKey, currentKey);
        }
      }

      return result;
    },
    [scaleRatio, originalServings, targetServings]
  );

  // Memoize nutrients array to prevent infinite loops
  const nutrientsArray = useMemo(() => {
    const nutrients = recipe?.nutrition?.nutrients || [];

    // Debug: Log what's actually in the nutrients array
    const caloriesNutrient = nutrients.find(n => n.name === 'Calories');
    if (caloriesNutrient && import.meta.env.DEV) {
      console.warn('📊 [NUTRITION] Nutrients array memoized', {
        count: nutrients.length,
        recipeId: recipe?.id,
        caloriesAmount: caloriesNutrient.amount,
        caloriesUnit: caloriesNutrient.unit,
        note: 'This is the value that will be used for scaling',
      });
    }

    return nutrients;
  }, [recipe?.id, recipe?.nutrition?.nutrients]);

  const getScaledNutrient = useCallback(
    name => {
      const entry = nutrientsArray.find(x => x.name === name);
      if (!entry) return null;

      // IMPORTANT: Nutrition values in database are stored as TOTAL for the recipe
      // We need to convert to per-serving first, then scale to target servings
      // Formula: (total / originalServings) * targetServings = total * (targetServings / originalServings)
      // Which simplifies to: total * scaleRatio (where scaleRatio = targetServings / originalServings)
      // So we can just multiply the stored TOTAL by scaleRatio directly!
      const amount = scaleNutrientAmount(name, entry.amount);
      if (amount === null || amount === undefined) return null;

      // Debug logging for nutrition scaling (only log once per change)
      if (import.meta.env.DEV && name === 'Calories') {
        const logKey = `nutrition-display-${recipe?.id}-${scaleRatio}`;
        const lastLogged = safeSessionStorage.getItem(logKey);
        const currentKey = `${entry.amount}-${amount}`;

        if (lastLogged !== currentKey) {
          const perServing = originalServings > 0 ? entry.amount / originalServings : entry.amount;
          console.warn('📊 [NUTRITION DISPLAY]', {
            nutrient: name,
            storedTotal: entry.amount,
            originalServings,
            targetServings,
            perServing: perServing.toFixed(1),
            scaleRatio: scaleRatio.toFixed(3),
            displayedAmount: amount,
            note: 'Stored value is TOTAL for recipe, displayed is scaled for target servings',
          });
          safeSessionStorage.setItem(logKey, currentKey);
        }
      }

      return { ...entry, amount };
    },
    [nutrientsArray, scaleNutrientAmount, scaleRatio, originalServings, targetServings, recipe?.id]
  );

  // Nutrient function that scales based on servings (legacy callers expect numeric amount)
  const nutrient = useCallback(
    name => getScaledNutrient(name)?.amount ?? null,
    [getScaledNutrient]
  );

  const macros = useMemo(() => {
    if (import.meta.env.DEV) {
      console.warn('📊 [MACROS] Calculating macros', {
        hasNutrients: nutrientsArray.length > 0,
        scaleRatio,
        unitSystem,
      });
    }

    const defs = [
      { key: 'Calories', label: 'Calories', max: 800 },
      { key: 'Protein', label: 'Protein', max: 60 },
      { key: 'Carbohydrates', label: 'Carbs', max: 90 },
      { key: 'Fat', label: 'Fat', max: 60 },
    ];

    const result = defs.map(def => {
      const info = getScaledNutrient(def.key);
      const formatted = formatNutrientAmount(info, unitSystem);
      const labelUnit = formatted?.unit || info?.unit || '';
      return {
        key: def.key,
        label: labelUnit ? `${def.label} (${labelUnit})` : def.label,
        value: info?.amount || 0,
        max: def.max,
        display:
          formatted?.text ??
          (info ? `${Number(info.amount || 0).toFixed(1)} ${info.unit || ''}`.trim() : '0'),
      };
    });

    if (import.meta.env.DEV) {
      console.warn('📊 [MACROS] Macros calculated', result);
    }
    return result;
  }, [getScaledNutrient, unitSystem, scaleRatio, nutrientsArray.length]);

  const scaleIngredientText = useCallback(
    originalText => {
      if (!originalText || scaleRatio === 1) return originalText;

      // Validate scaleRatio before processing
      if (!Number.isFinite(scaleRatio) || scaleRatio <= 0) {
        console.warn('⚠️ [INGREDIENT SCALING] Invalid scaleRatio:', scaleRatio);
        return originalText;
      }

      // Use a single regex that matches numbers with units OR standalone numbers
      // Process in reverse order (right to left) to avoid offset issues
      let scaledText = originalText;

      // First: handle numbers with units (most specific - do this first)
      scaledText = scaledText.replace(
        /\b(\d+(?:\.\d+)?)\s+(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|g|kg|lb|lbs|pound|pounds|gram|grams|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters)\b/gi,
        (match, num, unit) => {
          const amount = parseFloat(num);
          if (!Number.isFinite(amount)) return match;
          const scaled = Math.round(amount * scaleRatio * 100) / 100;
          return Number.isFinite(scaled) ? `${scaled} ${unit}` : match;
        }
      );

      // Then: handle standalone whole numbers (but only if they're not already part of a decimal)
      // Use word boundaries and negative lookahead to avoid matching numbers that are part of decimals
      scaledText = scaledText.replace(
        /\b(\d+)\b(?!\s*(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|g|kg|lb|lbs|pound|pounds|gram|grams|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters))/g,
        (match, num) => {
          const amount = parseFloat(num);
          // Only scale reasonable amounts (1-20) to avoid scaling years, etc.
          if (Number.isFinite(amount) && amount >= 1 && amount <= 20) {
            const scaled = Math.round(amount * scaleRatio * 100) / 100;
            return Number.isFinite(scaled)
              ? scaled % 1 === 0
                ? String(scaled)
                : scaled.toFixed(2)
              : match;
          }
          return match;
        }
      );

      return scaledText;
    },
    [scaleRatio]
  );

  // State for ingredient swaps
  const [ingredientSwaps, setIngredientSwaps] = useState({});

  // Load swaps when recipe changes
  useEffect(() => {
    if (id) {
      const swaps = getRecipeSwaps(id);
      setIngredientSwaps(swaps);
    }
  }, [id]);

  // Handle swap application
  const handleSwapApplied = useCallback((ingredientIndex, swapName, _originalText) => {
    setIngredientSwaps(prev => {
      if (swapName === null) {
        const newSwaps = { ...prev };
        delete newSwaps[ingredientIndex];
        return newSwaps;
      }
      return { ...prev, [ingredientIndex]: swapName };
    });

    // Force re-render of ingredients
    if (swapName) {
      // Update the display text immediately
      setIngredientSwaps(prev => ({ ...prev, [ingredientIndex]: swapName }));
    }
  }, []);

  // Scaled ingredients with ratio
  const scaledIngredients = useMemo(() => {
    if (!recipe?.extendedIngredients) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [INGREDIENT CALC] No extendedIngredients found:', {
          recipeId: recipe?.id,
          recipeTitle: recipe?.title,
        });
      }
      return [];
    }

    if (import.meta.env.DEV) {
      console.warn('🔢 [INGREDIENT CALC] Starting ingredient calculation:', {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        totalIngredients: recipe.extendedIngredients.length,
        baseServings: recipe.servings,
        targetServings,
        scaleRatio,
        unitSystem,
      });
    }

    return recipe.extendedIngredients.map((ing, index) => {
      // Log raw ingredient data
      if (import.meta.env.DEV) {
        console.warn(`📦 [INGREDIENT ${index + 1}] Raw ingredient data:`, {
          id: ing.id,
          name: ing.name,
          originalName: ing.originalName,
          amount: ing.amount,
          amountType: typeof ing.amount,
          unit: ing.unit,
          unitType: typeof ing.unit,
          original: ing.original,
          originalString: ing.originalString,
          meta: ing.meta,
          preparation: ing.preparation,
        });
      }

      const rawAmount =
        typeof ing.amount === 'number'
          ? ing.amount
          : typeof ing.amount === 'string' && ing.amount.trim()
            ? Number(ing.amount)
            : null;
      const baseAmount = Number.isFinite(rawAmount) ? rawAmount : null;
      // Validate scaleRatio and baseAmount before scaling
      const scaledAmount =
        baseAmount !== null &&
        Number.isFinite(baseAmount) &&
        Number.isFinite(scaleRatio) &&
        scaleRatio > 0
          ? (() => {
              const scaled = baseAmount * scaleRatio;
              return Number.isFinite(scaled) ? scaled : null;
            })()
          : null;
      // Clean ingredient name first (remove leading spaces/quotes)
      let ingredientName = (ing.name || ing.originalName || 'Ingredient').trim();
      ingredientName = ingredientName.replace(/^['"]+|['"]+$/g, '').trim();

      // Normalize unit - convert "unit" to empty string
      let normalizedUnit =
        typeof ing.unit === 'string' && /^(unit|units|item|items|piece|pieces)$/i.test(ing.unit)
          ? ''
          : ing.unit;

      // If still no unit, try to infer from cleaned ingredient name
      if (!normalizedUnit || normalizedUnit === '') {
        const nameLower = ingredientName.toLowerCase();
        // Quick inference for common ingredients (same logic as in supabaseRecipes.js)
        if (
          /^(salt|pepper|black pepper|white pepper|cayenne|paprika|cumin|curry|garlic powder|onion powder|chili powder|yeast|instant yeast|active dry yeast|dry yeast)$/i.test(
            nameLower
          )
        ) {
          normalizedUnit = 'tsp';
        } else if (
          /^(vinegar|soy sauce|soya sauce|worcestershire|hot sauce|tabasco)$/i.test(nameLower)
        ) {
          normalizedUnit = baseAmount && baseAmount >= 2 ? 'tbsp' : 'tsp';
        } else if (/^(ketchup|mustard|mayonnaise|bbq sauce|honey|maple syrup)$/i.test(nameLower)) {
          normalizedUnit = 'tbsp';
        } else if (
          /^(water|broth|stock|chicken broth|beef broth|vegetable broth|milk|whole milk|skim milk|almond milk|soy milk|coconut milk)$/i.test(
            nameLower
          )
        ) {
          normalizedUnit = 'cup';
        } else if (/^(oil|olive oil|vegetable oil|canola oil|butter|margarine)$/i.test(nameLower)) {
          normalizedUnit = 'tbsp';
        } else if (/^(flour|cornstarch|corn starch|baking powder|baking soda)$/i.test(nameLower)) {
          normalizedUnit = baseAmount && baseAmount >= 0.5 ? 'cup' : 'tbsp';
        } else if (/^(sugar|brown sugar|powdered sugar|confectioners sugar)$/i.test(nameLower)) {
          normalizedUnit = baseAmount && baseAmount >= 0.5 ? 'cup' : 'tbsp';
        } else if (
          /^(sesame seeds|poppy seeds|chia seeds|flax seeds|sunflower seeds|pumpkin seeds|almonds|walnuts|pecans|peanuts)$/i.test(
            nameLower
          )
        ) {
          normalizedUnit = baseAmount && baseAmount >= 2 ? 'tbsp' : 'tsp';
        }
        // Whole items (eggs, chicken pieces) keep empty unit - will be handled below
      }

      const prep = Array.isArray(ing.meta) ? ing.meta.join(', ') : ing.preparation;

      // Log parsing results
      if (import.meta.env.DEV) {
        console.warn(`🔍 [INGREDIENT ${index + 1}] Parsed values:`, {
          rawAmount,
          baseAmount,
          scaledAmount,
          normalizedUnit,
          ingredientName,
          preparation: prep,
          hasAmount: baseAmount !== null,
          hasUnit: !!normalizedUnit,
        });
      }

      // Handle ingredients without proper units - show "to taste" or just the name
      if (!normalizedUnit || normalizedUnit === '') {
        // For whole items (eggs, chicken pieces, etc.), show scaled amount with decimals
        if (
          baseAmount !== null &&
          baseAmount > 0 &&
          Number.isFinite(scaleRatio) &&
          scaleRatio > 0
        ) {
          const scaled = baseAmount * scaleRatio;
          if (Number.isFinite(scaled)) {
            const rounded = scaled % 1 === 0 ? scaled : Math.round(scaled * 100) / 100;
            const displayAmount = Number.isInteger(rounded) ? rounded : rounded.toFixed(2);
            const finalDisplayText = prep
              ? `${displayAmount} ${ingredientName}, ${prep}`
              : `${displayAmount} ${ingredientName}`;

            if (import.meta.env.DEV) {
              console.warn(`✅ [INGREDIENT ${index + 1}] Final result (no unit):`, {
                ingredientName,
                finalDisplayText,
                reason: 'No unit - showing as whole item',
              });
            }

            return {
              ...ing,
              displayText: finalDisplayText,
              originalText: `${baseAmount} ${ingredientName}`.trim(),
            };
          }
        }
        // No amount or invalid scaling - show "to taste" for seasonings, or just the name
        const isSeasoning =
          /^(salt|pepper|black pepper|white pepper|cayenne|paprika|garlic|onion|herbs|spices)$/i.test(
            ingredientName
          );
        const finalDisplayText = isSeasoning
          ? `${ingredientName} (to taste)${prep ? `, ${prep}` : ''}`
          : `${ingredientName}${prep ? `, ${prep}` : ''}`;

        if (import.meta.env.DEV) {
          console.warn(`✅ [INGREDIENT ${index + 1}] Final result (no amount/unit):`, {
            ingredientName,
            finalDisplayText,
            reason: 'No amount/unit - showing as seasoning or name only',
          });
        }

        return {
          ...ing,
          displayText: finalDisplayText,
          originalText: ingredientName,
        };
      }

      // Normal flow for ingredients with proper units
      const baseOriginalParts = [];
      if (baseAmount !== null) {
        const rounded = Math.round(baseAmount * 100) / 100;
        baseOriginalParts.push(Number.isInteger(rounded) ? rounded : rounded.toFixed(2));
      }
      if (normalizedUnit) baseOriginalParts.push(normalizedUnit);
      baseOriginalParts.push(ingredientName);

      const baseOriginal = (baseOriginalParts.join(' ').trim() || ingredientName).trim();
      const scaledOriginal = scaleIngredientText(baseOriginal);

      const structured =
        scaledAmount !== null
          ? formatIngredientQuantity(
              {
                amount: scaledAmount,
                unit: normalizedUnit,
                ingredientName,
                preparation: prep,
                fallback: scaledOriginal,
              },
              unitSystem
            )
          : null;

      const convertedFallback = convertIngredient(scaledOriginal, unitSystem);

      const finalDisplayText = structured || convertedFallback || scaledOriginal || ingredientName;

      // Log final result
      if (import.meta.env.DEV) {
        const hasIssues = baseAmount === null || !normalizedUnit;
        const logMethod = console.warn;
        logMethod(`✅ [INGREDIENT ${index + 1}] Final result:`, {
          ingredientName,
          baseOriginal,
          scaledOriginal,
          structured,
          convertedFallback,
          finalDisplayText,
          issues: hasIssues
            ? {
                missingAmount: baseAmount === null,
                missingUnit: !normalizedUnit,
                usingFallback: !structured,
              }
            : null,
        });
      }

      // Apply swap if exists
      const swapName = ingredientSwaps[index];
      const finalDisplayWithSwap = swapName
        ? applySwapToIngredient(finalDisplayText, swapName)
        : finalDisplayText;

      return {
        ...ing,
        displayText: finalDisplayWithSwap,
        originalText: baseOriginal,
        originalDisplayText: finalDisplayText, // Store original for swap reversion
      };
    });
  }, [
    recipe?.extendedIngredients,
    scaleRatio,
    unitSystem,
    recipe?.id,
    ingredientSwaps,
    recipe?.title,
    recipe?.servings,
    targetServings,
    scaleIngredientText,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!recipe?.nutrition?.nutrients?.length) return;
    if (!recipe?.servings) return;

    const perServingEntries = recipe.nutrition.nutrients.map(n => [n.name, Number(n.amount)]);
    const perServing = Object.fromEntries(perServingEntries);
    const multiplier = targetServings / recipe.servings;

    if (import.meta.env.DEV) {
      console.warn('[NutritionDebug]', {
        id: recipe.id,
        title: recipe.title,
        baseServings: recipe.servings,
        targetServings,
        multiplier: Number.isFinite(multiplier) ? Number(multiplier.toFixed(3)) : null,
        perServing,
        scaled: Object.fromEntries(
          perServingEntries.map(([name, amount]) => [
            name,
            Number.isFinite(amount * multiplier) ? Number((amount * multiplier).toFixed(2)) : null,
          ])
        ),
      });
    }
  }, [recipe?.nutrition, recipe?.servings, recipe?.id, recipe?.title, targetServings]);

  const beveragePairings = useMemo(() => {
    if (Array.isArray(recipe?.beveragePairings) && recipe.beveragePairings.length) {
      return recipe.beveragePairings.map((pair, idx) => ({
        id: pair.id || `${pair.name}-${idx}`,
        type: pair.beverageType || pair.beverage_type || 'wine',
        name: pair.name,
        varietal: pair.varietal,
        body: pair.body,
        sweetness: pair.sweetness,
        temperature: pair.servingTemperature || pair.serving_temperature,
        notes: pair.pairingNotes || pair.notes,
        confidence: pair.confidence,
        source: pair.source || 'curated',
      }));
    }

    const winePairing = recipe?.winePairing;
    if (winePairing?.pairedWines?.length) {
      return winePairing.pairedWines.map((wine, idx) => ({
        id: `spoonacular-${wine}-${idx}`,
        type: 'wine',
        name: wine,
        varietal: winePairing.pairingText || '',
        notes: winePairing.productMatches?.[idx]?.description || winePairing.pairingText,
        source: 'spoonacular',
      }));
    }

    return [];
  }, [recipe]);

  const steps = useMemo(() => {
    const analyzed = recipe?.analyzedInstructions?.[0]?.steps;
    if (Array.isArray(analyzed) && analyzed.length) {
      return cleanRecipeInstructions(analyzed.map(s => s.step).filter(Boolean));
    }
    if (recipe?.instructions) {
      return cleanRecipeInstructions(recipe.instructions);
    }
    return [];
  }, [recipe]);

  const closeCookMode = () => {
    setCookOpen(false);
    setTicking(false);
    setSecondsLeft(0);
  };
  const nextStep = useCallback(
    () => setStepIndex(i => Math.min(steps.length - 1, i + 1)),
    [steps.length]
  );
  const prevStep = useCallback(() => setStepIndex(i => Math.max(0, i - 1)), []);

  // Swipe gestures for cook mode
  useEffect(() => {
    if (!cookOpen) return;

    let startX = 0;
    let swipeDistance = 0;

    const handleTouchStart = e => {
      const touch = e.touches[0];
      startX = touch.clientX;
      // startY not used in swipe logic
    };

    const handleTouchMove = e => {
      const touch = e.touches[0];
      swipeDistance = touch.clientX - startX;
    };

    const handleTouchEnd = () => {
      const threshold = 100;

      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
          // Swipe right - previous step
          prevStep();
          triggerHaptic('light');
        } else {
          // Swipe left - next step
          nextStep();
          triggerHaptic('light');
        }
      }

      swipeDistance = 0;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [cookOpen, nextStep, prevStep]);

  const startTimerMins = m => {
    setSecondsLeft(m * 60);
    setTicking(true);
    triggerHaptic('success');
  };
  const pauseTimer = () => setTicking(false);
  const resumeTimer = () => secondsLeft > 0 && setTicking(true);
  const resetTimer = () => {
    setTicking(false);
    setSecondsLeft(0);
  };

  const checklistKey = `checklist:${id}`;
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(checklistKey) || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem(checklistKey, JSON.stringify(checked));
  }, [checked, checklistKey]);
  const toggleChecked = uid => setChecked(c => ({ ...c, [uid]: !c[uid] }));

  if (loading) {
    return <FullPageRecipeLoader message="Loading delicious recipe details..." />;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
            <BackToHome toHome={false} label="Back" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  if (!recipe) return null;

  const Stat = ({ label, value, icon, mobileValue }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: 'spring' }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-200/50 dark:border-emerald-800/50 shadow-md hover:shadow-lg backdrop-blur-sm min-w-0 flex-shrink transition-all duration-300"
      title={label}
    >
      <span className="text-base sm:text-lg md:text-xl flex-shrink-0">{icon}</span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 min-w-0">
        <span className="hidden sm:inline text-xs font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
          {label}:
        </span>
        <span className="font-bold text-xs sm:text-sm md:text-base text-emerald-800 dark:text-emerald-100 truncate min-w-0">
          <span className="sm:hidden">{mobileValue ?? value ?? '—'}</span>
          <span className="hidden sm:inline">{value ?? '—'}</span>
        </span>
      </div>
    </motion.div>
  );

  const MacroBar = ({ label, value, max, display }) => {
    const pct = max ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
    const colors = {
      Calories: {
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200/50 dark:border-orange-800/50',
        text: 'text-orange-700 dark:text-orange-300',
        shadow: 'shadow-orange-500/10',
      },
      Protein: {
        gradient: 'from-blue-500 via-cyan-500 to-teal-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200/50 dark:border-blue-800/50',
        text: 'text-blue-700 dark:text-blue-300',
        shadow: 'shadow-blue-500/10',
      },
      Carbs: {
        gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200/50 dark:border-yellow-800/50',
        text: 'text-yellow-700 dark:text-yellow-300',
        shadow: 'shadow-yellow-500/10',
      },
      Fat: {
        gradient: 'from-purple-500 via-pink-500 to-rose-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200/50 dark:border-purple-800/50',
        text: 'text-purple-700 dark:text-purple-300',
        shadow: 'shadow-purple-500/10',
      },
    };
    const colorScheme = colors[label] || {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200/50 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      shadow: 'shadow-emerald-500/10',
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, y: -2 }}
        className={`rounded-lg sm:rounded-xl ${colorScheme.bg} p-4 sm:p-5 md:p-6 lg:p-7 border ${colorScheme.border} shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
          <span className={`text-xs sm:text-sm font-semibold ${colorScheme.text} truncate min-w-0`}>
            {label}
          </span>
          <span className={`text-lg sm:text-xl md:text-2xl font-bold ${colorScheme.text} flex-shrink-0`}>
            {display ?? Number(value || 0).toFixed(1)}
          </span>
        </div>
        <div className="h-2 sm:h-2.5 md:h-3 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className={`h-full bg-gradient-to-r ${colorScheme.gradient} rounded-full shadow-md relative overflow-hidden`}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        </div>
        <div className="mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
          {pct}% of daily
        </div>
      </motion.div>
    );
  };

  const addAllToGrocery = () => {
    const items =
      scaledIngredients.length > 0
        ? scaledIngredients.map(i => i.displayText || '')
        : (recipe?.extendedIngredients || []).map(i => i.original || '');
    const filtered = items.filter(Boolean);
    if (filtered.length) {
      addMany(filtered, true); // Keep full quantities
      setOpen(true);
      // Track interaction
      if (recipe?.id) {
        trackRecipeInteraction(recipe.id, 'add_to_grocery', {
          title: recipe.title,
          ingredientCount: filtered.length,
        });
      }
    }
  };

  const addAllToPantry = () => {
    try {
      const currentPantry = JSON.parse(localStorage.getItem('filters:pantry') || '[]');
      const ingredientNames =
        scaledIngredients.length > 0
          ? scaledIngredients.map(i => {
              // Extract base ingredient name (remove quantities and units)
              const name = i.name || i.original || '';
              return name.toLowerCase().trim().replace(/\s+/g, '_');
            })
          : (recipe?.extendedIngredients || []).map(i => {
              const name = i.name || i.original || '';
              return name.toLowerCase().trim().replace(/\s+/g, '_');
            });

      const filtered = ingredientNames.filter(Boolean);
      const newIngredients = filtered.filter(ing => !currentPantry.includes(ing));

      if (newIngredients.length > 0) {
        const updatedPantry = [...currentPantry, ...newIngredients];
        localStorage.setItem('filters:pantry', JSON.stringify(updatedPantry));

        // Dispatch event for other components
        window.dispatchEvent(
          new CustomEvent('pantryUpdated', {
            detail: { pantry: updatedPantry },
          })
        );

        toast.success(
          `Added ${newIngredients.length} ingredient${newIngredients.length !== 1 ? 's' : ''} to your pantry! 🥘`
        );

        // Track interaction
        if (recipe?.id) {
          trackRecipeInteraction(recipe.id, 'add_to_pantry', {
            title: recipe.title,
            ingredientCount: newIngredients.length,
          });
        }
      } else {
        toast.info('All ingredients are already in your pantry!');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error adding to pantry:', error);
      }
      toast.error('Failed to add ingredients to pantry');
    }
  };

  if (import.meta.env.DEV) {
    console.warn('📄 [RECIPE PAGE] Component render', {
      recipeId: recipe?.id,
      recipeTitle: recipe?.title,
      confettiTrigger,
      loading,
      hasRecipe: !!recipe,
      hasExtendedIngredients: !!recipe?.extendedIngredients,
      extendedIngredientsType: typeof recipe?.extendedIngredients,
      extendedIngredientsIsArray: Array.isArray(recipe?.extendedIngredients),
      extendedIngredientsCount: recipe?.extendedIngredients?.length ?? 0,
      scaledIngredientsCount: scaledIngredients.length,
      extendedIngredientsSample: recipe?.extendedIngredients?.slice(0, 2) || 'NOT SET',
      error: !!error,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 relative">
      <FoodConfetti trigger={confettiTrigger} />
      <AnimatePresence>
        {showCookMode && steps.length > 0 && (
          <CookMode
            steps={steps}
            recipeTitle={recipe?.title || 'Recipe'}
            onClose={() => setShowCookMode(false)}
          />
        )}
        {showMealPrepMode && recipe && (
          <MealPrepMode
            recipe={recipe}
            servings={targetServings}
            originalServings={originalServings}
            scaledIngredients={scaledIngredients}
            onClose={() => setShowMealPrepMode(false)}
          />
        )}
        {showNutritionLabel && recipe && (
          <NutritionLabel
            recipe={recipe}
            servings={targetServings}
            onClose={() => setShowNutritionLabel(false)}
          />
        )}
        {showCookingSkills && <CookingSkills onClose={() => setShowCookingSkills(false)} />}
        {currentUnlock && (
          <AchievementUnlock achievement={currentUnlock} onClose={() => setCurrentUnlock(null)} />
        )}
      </AnimatePresence>
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          <BackToHome toHome={false} label="Back" />

          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-nowrap justify-end flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {/* Collections */}
            <RecipeCollectionsButton recipeId={id} />

            {/* Notes */}
            <RecipeNotes recipeId={id} ingredients={scaledIngredients} steps={steps} />

            {/* Add to planner */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!recipe?.id) {
                  toast.error('Recipe not loaded yet. Please wait.');
                  return;
                }
                // Default to adding as dinner
                const currentDay = new Date().getDay() - 1;
                const todayIdx = currentDay >= 0 ? currentDay : 6;
                const dayName = [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ][todayIdx];
                setMealPlanDay(todayIdx, 'dinner', recipe);
                triggerHaptic('success');
                toast.success(`Added to ${dayName}'s dinner! 📅`);
              }}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-md sm:rounded-lg md:rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all min-h-[36px] sm:min-h-0 touch-manipulation flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
              title="Add to today's dinner"
            >
              <span className="text-sm sm:text-base md:text-lg">📅</span>
              <span className="hidden sm:inline">Add to Planner</span>
            </motion.button>

            {/* Track as made */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecipeMade}
              className="px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 md:py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm min-h-[36px] sm:min-h-0 touch-manipulation flex-shrink-0"
              title="Mark as made"
            >
              <span className="hidden sm:inline">✓ Made</span>
              <span className="sm:hidden">✓</span>
            </motion.button>

            {/* Share */}
            <ShareButton
              title={title || recipe?.title || 'Recipe'}
              text={`Check out this recipe: ${title || recipe?.title || 'Recipe'}`}
              url={
                recipe?.id ? `${window.location.origin}/recipe/${recipe.id}` : window.location.href
              }
              recipeId={recipe?.id}
            />
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {heroImage && (
          <>
            <img
              src={heroImage}
              data-original-src={rawHeroImage || undefined}
              alt=""
              className="absolute inset-0 w-full h-[40vh] object-cover blur-3xl opacity-40 scale-110"
              aria-hidden
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={fallbackOnce}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/15 to-emerald-950/60 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-900/8 to-cyan-900/8 pointer-events-none" />
          </>
        )}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 relative">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight px-2 sm:px-4 md:px-6 break-words hyphens-auto bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-lg mb-3 sm:mb-4 md:mb-5 select-none"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {title}
          </motion.h1>

          <div className="mt-6 sm:mt-8 md:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 px-2 sm:px-4">
            <Stat
              label="Ready"
              value={recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : '—'}
              mobileValue={recipe.readyInMinutes ? `${recipe.readyInMinutes}` : '—'}
              icon="⏱️"
            />
            <Stat
              label="Servings"
              value={recipe.servings}
              mobileValue={recipe.servings}
              icon="🍽️"
            />
            <Stat
              label="Health"
              value={recipe.healthScore ?? '—'}
              mobileValue={recipe.healthScore ?? '—'}
              icon="💚"
            />
          </div>

          {/* Medical Condition Warnings */}
          <div className="mt-6 px-2">
            <MedicalWarning recipe={recipe} servings={targetServings} />
          </div>

          {heroImage && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative group w-full px-2 sm:px-0"
              >
                <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-xl sm:rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                <motion.img
                  whileHover={{ scale: 1.02 }}
                  src={heroImage}
                  alt={title}
                  className="relative mx-auto w-full max-w-3xl aspect-[4/3] object-cover rounded-xl sm:rounded-2xl shadow-2xl ring-2 sm:ring-4 ring-emerald-200/50 dark:ring-emerald-800/50"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={fallbackOnce}
                />
              </motion.div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="mt-4 sm:mt-6 flex justify-center gap-1.5 sm:gap-2 md:gap-3 flex-nowrap px-2">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (steps.length > 0) {
                    setShowCookMode(true);
                  } else {
                    toast.error('No cooking instructions available for this recipe.');
                  }
                }}
                className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 touch-manipulation min-h-[44px]"
                title="Open step-by-step Cook Mode with timer"
              >
                <span className="text-base sm:text-lg md:text-xl">👨‍🍳</span>
                <span className="hidden sm:inline">Start Cook Mode</span>
                <span className="sm:hidden">Cook</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(255, 140, 0, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMealPrepMode(true)}
                className="flex-1 sm:flex-none px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white font-bold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation min-h-[44px] group relative overflow-hidden"
                title="Open Meal Prep Mode for batch cooking and meal planning"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-base sm:text-lg md:text-xl relative z-10">🍱</span>
                <span className="hidden sm:inline relative z-10">Meal Prep Mode</span>
                <span className="sm:hidden relative z-10">Prep</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCookingSkills(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 touch-manipulation min-h-[44px]"
                title="Learn cooking techniques and skills"
              >
                <span className="text-base sm:text-lg md:text-xl">📚</span>
                <span className="hidden sm:inline">Cooking Skills</span>
                <span className="sm:hidden">Skills</span>
              </motion.button>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-2 sm:px-3 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Macros */}
        <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-lg max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center mb-4 sm:mb-5 gap-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-center bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
              🍽️ Nutritional Info
            </h2>
            
            {/* Full Label and Measurement Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
              {recipe?.nutrition?.nutrients && recipe.nutrition.nutrients.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNutritionLabel(true)}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group relative overflow-hidden"
                  title="View full FDA-style nutrition label"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-lg sm:text-xl relative z-10">📊</span>
                  <span className="relative z-10">Full Nutrition Label</span>
                  <motion.span
                    className="relative z-10"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.button>
              )}
              
              {/* Measurement System Selector */}
              <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded-xl">
                {MEASUREMENT_OPTIONS.map((opt) => {
                  const isActive = unitSystem === opt.key;
                  return (
                    <motion.button
                      key={opt.key}
                      type="button"
                      whileHover={{ scale: isActive ? 1 : 1.08, y: isActive ? 0 : -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUnitPreferenceChange(opt.key)}
                      aria-pressed={isActive}
                      className={`group relative rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 touch-manipulation overflow-hidden min-w-[60px] sm:min-w-[70px] ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-105'
                          : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                      title={`${opt.label} - ${opt.hint}`}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <span className={`text-lg sm:text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                          {opt.flag}
                        </span>
                        <span className={`font-bold text-xs sm:text-sm transition-colors ${
                          isActive ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {opt.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
              <span className="font-medium">📊 {targetServings} {targetServings === 1 ? 'serving' : 'servings'}</span>
              <span className="mx-2">·</span>
              <span>{UNIT_SYSTEMS[unitSystem]?.name || unitSystem.toUpperCase()}</span>
            </div>
          </div>

          {/* Macro Cards - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
            {macros.map(m => (
              <MacroBar
                key={m.key}
                label={m.label}
                value={m.value}
                max={m.max}
                display={m.display}
              />
            ))}
          </div>
        </section>

        {/* Servings Calculator */}
        {recipe?.servings && (
          <section>
            <ServingsCalculator
              originalServings={originalServings}
              targetServings={targetServings}
              onServingsChange={setTargetServings}
            />
          </section>
        )}

        {beveragePairings.length > 0 && (
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-rose-500/5 dark:shadow-rose-500/10">
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <motion.span 
                className="text-3xl sm:text-4xl md:text-5xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                {beveragePairings.some(p => p.type === 'beer')
                  ? '🍺'
                  : beveragePairings.some(p => p.type === 'cocktail')
                    ? '🍸'
                    : '🍷'}
              </motion.span>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-center bg-gradient-to-r from-rose-600 via-amber-500 to-orange-500 dark:from-rose-300 dark:via-amber-300 dark:to-orange-300 bg-clip-text text-transparent">
                Suggested Pairings
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-300 mb-4 sm:mb-5">
              Enjoy this recipe with a curated beverage pairing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {beveragePairings.map(pair => (
                <motion.div
                  key={pair.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="rounded-lg sm:rounded-xl border border-rose-200/50 dark:border-rose-800/50 bg-white/90 dark:bg-slate-900/70 p-4 sm:p-5 shadow-md hover:shadow-lg backdrop-blur-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                      <span className="text-lg sm:text-xl flex-shrink-0">
                        {pair.type === 'beer' ? '🍺' : pair.type === 'cocktail' ? '🍸' : '🍷'}
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate min-w-0">
                        {pair.name || 'Pairing'}
                      </h3>
                    </div>
                    {pair.confidence && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-200 flex-shrink-0">
                        {pair.confidence}
                      </span>
                    )}
                  </div>
                  <dl className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    {pair.varietal && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-600 dark:text-slate-300">
                          Varietal:
                        </dt>
                        <dd>{pair.varietal}</dd>
                      </div>
                    )}
                    {pair.body && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-600 dark:text-slate-300">Body:</dt>
                        <dd>{pair.body}</dd>
                      </div>
                    )}
                    {pair.sweetness && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-600 dark:text-slate-300">
                          Sweetness:
                        </dt>
                        <dd>{pair.sweetness}</dd>
                      </div>
                    )}
                    {pair.temperature && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-600 dark:text-slate-300">
                          Serve at:
                        </dt>
                        <dd>{pair.temperature}</dd>
                      </div>
                    )}
                  </dl>
                  {pair.notes && (
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm italic text-slate-600 dark:text-slate-300 break-words">
                      "{pair.notes}"
                    </p>
                  )}
                  <p className="mt-2 sm:mt-3 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Source: {pair.source}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Ingredients checklist + Grocery */}
        <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-lg overflow-hidden">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-center bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent break-words">
                🧂 Ingredients
              </h2>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg border border-emerald-300/50 dark:border-emerald-700/50 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-medium text-xs sm:text-sm shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:shadow-md transition-all touch-manipulation flex items-center justify-center gap-1.5"
                onClick={() => setOpen(true)}
                title="Open grocery list"
              >
                <span className="text-sm sm:text-base">🛒</span>
                <span className="hidden sm:inline">Open List</span>
                <span className="sm:hidden">List</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all touch-manipulation flex items-center justify-center gap-1.5"
                onClick={addAllToGrocery}
                title="Add all ingredients to grocery list"
              >
                <span className="text-sm sm:text-base">➕</span>
                <span className="hidden sm:inline">Add All</span>
                <span className="sm:hidden">Add</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all touch-manipulation flex items-center justify-center gap-1.5"
                onClick={addAllToPantry}
                title="Add all ingredients to your pantry"
              >
                <span className="text-sm sm:text-base">🥘</span>
                <span className="hidden sm:inline">Pantry</span>
                <span className="sm:hidden">Pantry</span>
              </motion.button>
              {nutrient('Calories') && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all touch-manipulation flex items-center justify-center gap-1.5"
                  onClick={() => {
                    // Try multiple methods to get calories
                    let calories = Math.round(nutrient('Calories') || 0);

                    // Fallback 1: Check recipe.calories directly (if stored at recipe level)
                    if (calories <= 0 && recipe?.calories) {
                      // Recipe calories are stored as TOTAL, need to scale for servings
                      const recipeCalories = Number(recipe.calories);
                      if (Number.isFinite(recipeCalories) && originalServings > 0) {
                        const perServing = recipeCalories / originalServings;
                        calories = Math.round(perServing * targetServings);
                      }
                    }

                    // Fallback 2: Calculate from macros if available
                    if (calories <= 0) {
                      const protein = nutrient('Protein') || 0;
                      const carbs = nutrient('Carbohydrates') || 0;
                      const fats = nutrient('Fat') || 0;
                      // 4 cal/g protein, 4 cal/g carbs, 9 cal/g fat
                      const calculatedCalories = protein * 4 + carbs * 4 + fats * 9;
                      if (calculatedCalories > 0) {
                        calories = Math.round(calculatedCalories);
                      }
                    }

                    if (calories > 0) {
                      // Extract macros from nutrition data
                      const macros = {
                        protein: Math.round(nutrient('Protein') || 0),
                        carbs: Math.round(nutrient('Carbohydrates') || 0),
                        fats: Math.round(nutrient('Fat') || 0),
                        fiber: Math.round(nutrient('Fiber') || 0),
                      };
                      addMealToTracker(recipe.id, title, calories, macros);
                      triggerHaptic('success');
                      toast.success(
                        `Added ${calories} calories (for ${targetServings} ${targetServings === 1 ? 'serving' : 'servings'}) to your tracker! 🎯`
                      );
                    } else {
                      toast.error(
                        "This recipe doesn't have nutrition data. Calories cannot be calculated."
                      );
                    }
                  }}
                  title="Add to calorie tracker"
                >
                  <span className="text-sm sm:text-base">📊</span>
                  <span className="hidden sm:inline">Tracker</span>
                  <span className="sm:hidden">Track</span>
                </motion.button>
              )}
            </div>
          </div>

          <ul className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {scaledIngredients.length ? (
              scaledIngredients.map((ing, idx) => {
                const uid = `${ing.id ?? 'noid'}-${idx}`;
                const isChecked = !!checked[uid];
                return (
                  <IngredientReveal key={uid} index={idx} isChecked={isChecked}>
                    <motion.li
                      className={`flex items-center gap-2.5 sm:gap-3 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border transition-all duration-200 group ${
                        isChecked
                          ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300/60 dark:border-emerald-700/60'
                          : 'bg-white dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-400/60 dark:hover:border-emerald-600/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'
                      }`}
                      whileHover={{ scale: 1.01, y: -1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 cursor-pointer flex items-center justify-center rounded-md border-2 transition-all ${
                          isChecked
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 border-emerald-500 dark:border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                        }`}
                        onClick={() => toggleChecked(uid)}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleChecked(uid);
                          }
                        }}
                      >
                        {isChecked && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <motion.span
                          className={`flex-1 min-w-0 text-sm sm:text-base break-words hyphens-auto font-medium leading-snug ${isChecked ? 'line-through opacity-50' : 'text-slate-700 dark:text-slate-200'}`}
                          animate={
                            isChecked
                              ? {
                                  scale: [1, 0.98, 1],
                                }
                              : {}
                          }
                          transition={{ duration: 0.2 }}
                        >
                          {ing.displayText}
                        </motion.span>
                        <div className="flex-shrink-0">
                          <SmartSwaps
                            ingredientName={ing.originalDisplayText || ing.displayText}
                            recipeId={id}
                            ingredientIndex={idx}
                            onSwapApplied={handleSwapApplied}
                            originalDisplayText={ing.originalDisplayText || ing.displayText}
                          />
                        </div>
                      </div>
                    </motion.li>
                  </IngredientReveal>
                );
              })
            ) : (
              <li className="col-span-full text-slate-500 dark:text-slate-400 text-center py-8 px-4">
                <div className="flex flex-col items-center gap-4">
                  <EmptyStateAnimation message="No ingredient list available for this recipe." />
                  {recipe?.id && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-800 max-w-md">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                        ⚠️ This recipe needs ingredients added
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Admins can add ingredients via the Recipe Editor in the admin dashboard.
                      </p>
                    </div>
                  )}
                </div>
              </li>
            )}
          </ul>
        </section>

        {/* Steps */}
        {steps.length > 0 && (
          <section className="print:break-inside-avoid bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-5 text-center bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
              📋 Instructions
            </h2>
            <ol className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
              {steps.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                  whileHover={{ x: 2, scale: 1.01 }}
                  className="group flex gap-3 sm:gap-4 items-start bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/80 dark:to-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <motion.span 
                    className="shrink-0 mt-0.5 sm:mt-1 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md ring-1 ring-emerald-200/50 dark:ring-emerald-800/50"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {i + 1}
                  </motion.span>
                  <p className="flex-1 min-w-0 leading-relaxed text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 font-medium break-words pt-0.5 sm:pt-1">
                    {s}
                  </p>
                </motion.li>
              ))}
            </ol>
          </section>
        )}

        {/* Suggestions Sections */}
        {(leftoverIdeas.length > 0 || similarRecipes.length > 0 || mealSuggestions.length > 0) && (
          <div className="space-y-8 sm:space-y-10 md:space-y-12 mt-8 sm:mt-10 md:mt-12">
            {/* Leftover Ideas */}
            {leftoverIdeas.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-amber-500/5 dark:shadow-amber-500/10"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">♻️</span>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-center">Leftover Ideas</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
                    What to make with leftover ingredients from this recipe
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {leftoverIdeas.map(recipe => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05, y: -6 }}
                      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                      className="bg-white/90 dark:bg-slate-800/90 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-slate-200/50 dark:border-slate-700/50 hover:border-amber-400/50 dark:hover:border-amber-600/50 hover:shadow-xl transition-all duration-300 touch-manipulation group"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={recipeImg(recipe.hero_image_url || recipe.image, recipe.id)}
                          data-original-src={recipe.hero_image_url || recipe.image}
                          alt={recipe.title}
                          className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={fallbackOnce}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-sm sm:text-base line-clamp-2 break-words text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                          {recipe.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                          <span>⏱️</span>
                          {recipe.readyInMinutes} min
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Similar Recipes */}
            {similarRecipes.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🔍</span>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-center">Similar Recipes</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
                    Recipes you might also like
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {similarRecipes.map(recipe => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05, y: -6 }}
                      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                      className="bg-white/90 dark:bg-slate-800/90 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-xl transition-all duration-300 touch-manipulation group"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={recipeImg(recipe.hero_image_url || recipe.image, recipe.id)}
                          data-original-src={recipe.hero_image_url || recipe.image}
                          alt={recipe.title}
                          className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={fallbackOnce}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-sm sm:text-base line-clamp-2 break-words text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {recipe.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                          <span>⏱️</span>
                          {recipe.readyInMinutes} min
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Complete Your Meal */}
            {mealSuggestions.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-purple-500/5 dark:shadow-purple-500/10"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🍽️</span>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-center">Complete Your Meal</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
                    Perfect pairings for this recipe
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {mealSuggestions.map(recipe => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05, y: -6 }}
                      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                      className="bg-white/90 dark:bg-slate-800/90 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-400/50 dark:hover:border-purple-600/50 hover:shadow-xl transition-all duration-300 touch-manipulation group"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={recipeImg(recipe.hero_image_url || recipe.image, recipe.id)}
                          data-original-src={recipe.hero_image_url || recipe.image}
                          alt={recipe.title}
                          className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={fallbackOnce}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-sm sm:text-base line-clamp-2 break-words text-slate-800 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                          {recipe.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                          <span>⏱️</span>
                          {recipe.readyInMinutes} min
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        )}
      </div>

      {/* Cook Mode overlay */}
      {cookOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={e => e.target === e.currentTarget && closeCookMode()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl mx-auto my-4 sm:my-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 border-2 border-emerald-500/30 p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Background gradient decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👨‍🍳</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent truncate">
                    Cook Mode
                  </h3>
                  <p className="text-xs text-slate-400">Step-by-step cooking guide</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeCookMode}
                className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 flex items-center justify-center transition-all flex-shrink-0 touch-manipulation min-h-[44px]"
                title="Close Cook Mode"
              >
                <span className="text-xl">✕</span>
              </motion.button>
            </div>

            {/* Step Navigation */}
            <div className="relative flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                disabled={stepIndex === 0}
                className="px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-emerald-600/20 border-2 border-slate-600 hover:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-slate-700/50 disabled:hover:border-slate-600 transition-all flex items-center gap-1.5 sm:gap-2 font-semibold text-sm sm:text-base min-h-[44px] touch-manipulation"
              >
                <span className="text-base sm:text-lg">←</span>
                <span className="hidden sm:inline">Previous</span>
              </motion.button>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex-shrink-0">
                <span className="text-xs sm:text-sm font-semibold text-emerald-300">Step</span>
                <span className="font-mono text-base sm:text-lg font-bold text-white">
                  {stepIndex + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-400">of</span>
                <span className="font-mono text-base sm:text-lg font-bold text-white">
                  {steps.length}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                disabled={stepIndex === steps.length - 1}
                className="px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-emerald-600/20 border-2 border-slate-600 hover:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-slate-700/50 disabled:hover:border-slate-600 transition-all flex items-center gap-1.5 sm:gap-2 font-semibold text-sm sm:text-base min-h-[44px] touch-manipulation"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="text-base sm:text-lg">→</span>
              </motion.button>
            </div>

            {/* Current Step */}
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative min-h-[150px] sm:min-h-[200px] text-base sm:text-lg leading-relaxed bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-emerald-500/20 shadow-xl mb-4 sm:mb-6"
            >
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg">
                {stepIndex + 1}
              </div>
              <p className="text-slate-100 font-medium pt-8 sm:pt-0 sm:pl-12 break-words">
                {steps[stepIndex]}
              </p>
            </motion.div>

            {/* Timer Section */}
            <div className="relative bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-500/20">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-2xl">⏱️</span>
                  <span className="text-xs sm:text-sm font-semibold text-emerald-300">Timer</span>
                </div>
                <motion.div
                  animate={ticking ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1, repeat: ticking ? Infinity : 0 }}
                  className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"
                >
                  {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                  {String(secondsLeft % 60).padStart(2, '0')}
                </motion.div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startTimerMins(5)}
                  className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  5m
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startTimerMins(10)}
                  className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  10m
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startTimerMins(15)}
                  className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  15m
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startTimerMins(30)}
                  className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  30m
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {!ticking && secondsLeft > 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(5, 150, 105, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resumeTimer}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation"
                  >
                    <span>▶</span>
                    <span>Resume</span>
                  </motion.button>
                ) : ticking ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseTimer}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation"
                  >
                    <span>⏸</span>
                    <span>Pause</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(5, 150, 105, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resumeTimer}
                    disabled={secondsLeft === 0}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    <span>▶</span>
                    <span>Start Timer</span>
                  </motion.button>
                )}
                {secondsLeft > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetTimer}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-red-600/30 border-2 border-slate-600 hover:border-red-500 font-semibold text-sm sm:text-base transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                  >
                    Reset
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
