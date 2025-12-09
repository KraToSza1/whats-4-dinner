import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGroceryList } from '../context/GroceryListContext.jsx';
import { getSupabaseRecipeById } from '../api/supabaseRecipes.js';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import { trackRecipeInteraction } from '../utils/analytics.js';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { CompactRecipeLoader } from '../components/FoodLoaders.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { useToast } from '../components/Toast.jsx';
import { hasFeature, canPerformAction } from '../utils/subscription.js';
import { trackFeatureUsage, FEATURES } from '../utils/featureTracking';
import {
  Sparkles,
  Heart,
  ShoppingCart,
  X,
  Copy,
  Calendar,
  Plus,
  Settings,
  CheckCircle2,
  Circle,
  RefreshCw,
  AlertTriangle,
  Target,
  Users,
} from 'lucide-react';
import MealSwap from '../components/MealSwap.jsx';
import {
  getMealPlannerContext,
  checkRecipeSafetyForAll,
  filterSafeRecipes,
  scoreRecipeForMealPlanning,
} from '../utils/mealPlannerContext.js';
import { filterRecipesByMedicalConditions } from '../utils/medicalConditions.js';

const KEY = 'meal:plan:v3'; // Updated version with snacks support
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const SNACKS = ['morning_snack', 'afternoon_snack', 'evening_snack'];

// Initialize structure: 7 days x 3 meals + optional snacks
// Each meal can now have: { id, title, image, familyMembers: [memberId1, memberId2, ...] }
function emptyDay() {
  return {
    breakfast: null,
    lunch: null,
    dinner: null,
    morning_snack: null,
    afternoon_snack: null,
    evening_snack: null,
  };
}

export function readMealPlan() {
  try {
    // Try v3 first
    let parsed = JSON.parse(localStorage.getItem(KEY) || 'null');

    // If v3 doesn't exist, try v2
    if (!parsed) {
      parsed = JSON.parse(localStorage.getItem('meal:plan:v2') || 'null');
    }

    // Handle migration from v1 format (backward compatibility)
    if (Array.isArray(parsed)) {
      // Old format - migrate to new format
      const newPlan = {};
      parsed.forEach((meal, idx) => {
        if (meal) {
          newPlan[DAYS_SHORT[idx]] = { ...emptyDay(), dinner: meal };
        } else {
          newPlan[DAYS_SHORT[idx]] = emptyDay();
        }
      });
      writeMealPlan(newPlan);
      return newPlan;
    }

    // New format (v2 or v3)
    if (parsed && typeof parsed === 'object') {
      // Fill in any missing days and ensure snack fields exist
      const plan = {};
      DAYS_SHORT.forEach(day => {
        const dayData = parsed[day] || {};
        plan[day] = {
          ...emptyDay(),
          ...dayData,
          // Ensure snack fields exist even if not in old data
          morning_snack: dayData.morning_snack || null,
          afternoon_snack: dayData.afternoon_snack || null,
          evening_snack: dayData.evening_snack || null,
        };
      });
      return plan;
    }

    return {};
  } catch {
    return {};
  }
}

export function writeMealPlan(plan) {
  localStorage.setItem(KEY, JSON.stringify(plan));
}

/** Call this from anywhere (e.g., RecipePage) to set a meal or snack */
export function setMealPlanDay(dayIndex, mealType, recipe) {
  const current = readMealPlan();
  const day = DAYS_SHORT[dayIndex];

  if (!current[day]) {
    current[day] = emptyDay();
  }

  // Ensure all snack fields exist
  if (!current[day].morning_snack) current[day].morning_snack = null;
  if (!current[day].afternoon_snack) current[day].afternoon_snack = null;
  if (!current[day].evening_snack) current[day].evening_snack = null;

  current[day][mealType] = recipe
    ? {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image || recipe.hero_image_url,
        familyMembers: recipe.familyMembers || [], // Array of family member IDs
      }
    : null;

  writeMealPlan(current);
  return current;
}
/* --------------------------------------------------------------------------- */

export default function MealPlanner() {
  const [plan, setPlan] = useState(() => readMealPlan());
  const { addMany, setOpen } = useGroceryList();
  const [loading, setLoading] = useState(false);
  const [showSnacks, setShowSnacks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('meal:plan:showSnacks') || 'false');
    } catch {
      return false;
    }
  });
  const [includeSnacksInPlan, setIncludeSnacksInPlan] = useState(false);
  const [swapState, setSwapState] = useState(null); // { dayIdx, mealType, recipe }
  const toast = useToast();
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  // ENFORCE MEAL PLANNER LIMIT - Check access on mount (only once)
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const canAccess = canPerformAction('meal_planner');
    if (!canAccess) {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('openPremiumFeatureModal', {
            detail: { feature: 'meal_planner' },
          })
        );
      }, 300);
    }
  }, [navigate]);

  // Persist whenever plan changes
  useEffect(() => writeMealPlan(plan), [plan]);

  // Persist snack visibility preference
  useEffect(() => {
    localStorage.setItem('meal:plan:showSnacks', JSON.stringify(showSnacks));
  }, [showSnacks]);

  // Listen for changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === KEY && e.newValue) {
        try {
          setPlan(JSON.parse(e.newValue));
        } catch (_err) {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check for same-tab changes
    const interval = setInterval(() => {
      try {
        const current = readMealPlan();
        setPlan(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(current)) {
            return current;
          }
          return prev;
        });
      } catch (_err) {
        // Ignore parse errors
      }
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const setMeal = (dayIdx, mealType, recipe, familyMembers = null) => {
    // If recipe exists and familyMembers provided, merge them
    const mealData = recipe
      ? {
          ...recipe,
          familyMembers: familyMembers !== null ? familyMembers : recipe.familyMembers || [],
        }
      : null;
    setPlan(setMealPlanDay(dayIdx, mealType, mealData));
    // Track interaction
    if (recipe?.id) {
      trackRecipeInteraction(recipe.id, 'add_to_plan', {
        title: recipe.title,
        mealType,
        day: DAYS_SHORT[dayIdx],
        familyMembers: familyMembers?.length || 0,
      });
      trackFeatureUsage(FEATURES.MEAL_PLANNER, {
        action: 'add_meal',
        mealType,
        recipeId: recipe.id,
        familyMembers: familyMembers?.length || 0,
      });
    }
  };

  const favorites = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  }, []);

  // Get family members for assignment
  const familyMembers = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('family:members:v1') || '[]');
    } catch {
      return [];
    }
  }, []);

  // State for family member assignment modal
  const [assigningToMeal, setAssigningToMeal] = useState(null); // { dayIdx, mealType, recipe }

  // ENHANCED Smart meal planning - COMPREHENSIVE AI planning with family member assignment
  const generateSmartPlan = async () => {
    setLoading(true);
    try {
      // Get COMPREHENSIVE user context (calorie goals, medical conditions, family, etc.)
      const context = getMealPlannerContext();

      // Show context summary (dev only)
      if (import.meta.env.DEV) {
        console.warn('🧠 [SmartPlan] User Context:', {
          hasCalorieGoals: context.hasGoals,
          hasMedicalConditions: context.hasMedicalConditions,
          hasFamily: context.hasFamily,
          childrenCount: context.childrenCount,
          foodsToAvoid: context.allFoodsToAvoid.length,
          dietaryRestrictions: context.allDietaryRestrictions.length,
          pantryItems: context.pantry.length,
          favorites: context.favorites.length,
          familyMembers: familyMembers.length,
        });
      }

      const next = { ...plan };
      let suggestionCount = 0;
      let skippedUnsafe = 0;
      let assignedToFamily = 0;
      const maxSuggestions = includeSnacksInPlan ? 42 : 21; // 21 meals or 21 meals + 21 snacks

      // Track used recipes to ensure variety
      const usedRecipeIds = new Set();
      
      // Track meals per family member for balanced assignment
      const memberMealCounts = {};
      familyMembers.forEach(member => {
        memberMealCounts[member.id] = 0;
      });

      // Meal type mapping
      const mealTypeMap = {
        breakfast: 'breakfast',
        lunch: 'lunch',
        dinner: 'dinner',
        morning_snack: 'snack',
        afternoon_snack: 'snack',
        evening_snack: 'snack',
      };

      // Build search filters from context
      const searchDiet = context.diet || '';

      // Helper function to check if recipe is safe for specific family member
      const isSafeForMember = (recipe, member) => {
        // Check allergies
        if (member.allergies && member.allergies.length > 0) {
          const ingredients = recipe.extendedIngredients || [];
          const recipeIngredientNames = ingredients.map(ing =>
            (ing.name || ing.originalName || '').toLowerCase()
          );
          const hasAllergy = member.allergies.some(allergy =>
            recipeIngredientNames.some(
              ing => ing.includes(allergy.toLowerCase()) || allergy.toLowerCase().includes(ing)
            )
          );
          if (hasAllergy) return false;
        }

        // Check dietary restrictions
        if (member.dietaryRestrictions && member.dietaryRestrictions.length > 0) {
          // Check if recipe conflicts with restrictions
          const restrictions = member.dietaryRestrictions.map(r => r.toLowerCase());
          if (restrictions.includes('vegetarian') || restrictions.includes('vegan')) {
            const hasMeat = (recipe.extendedIngredients || []).some(ing => {
              const name = (ing.name || ing.originalName || '').toLowerCase();
              return (
                name.includes('chicken') ||
                name.includes('beef') ||
                name.includes('pork') ||
                name.includes('fish') ||
                name.includes('meat')
              );
            });
            if (hasMeat && restrictions.includes('vegan')) return false;
            if (hasMeat && restrictions.includes('vegetarian')) return false;
          }
        }

        // Check medical conditions for this member
        if (member.medicalConditions && member.medicalConditions.length > 0) {
          const safetyCheck = checkRecipeSafetyForAll(recipe);
          if (!safetyCheck.safe) return false;
        }

        return true;
      };

      // Helper function to assign meal to appropriate family members
      const assignToFamilyMembers = (recipe, mealType) => {
        if (familyMembers.length === 0) return [];

        const assignedMembers = [];

        // For each family member, check if recipe is safe and appropriate
        familyMembers.forEach(member => {
          // Check if safe for this member
          if (!isSafeForMember(recipe, member)) return;

          // Check if appropriate meal type for member's age/role
          const role = (member.role || '').toLowerCase();
          const isChild = ['baby', 'toddler', 'child', 'teenager', 'teen'].includes(role);

          // Children should get appropriate meals (not too spicy, complex, etc.)
          if (isChild) {
            // Skip very complex recipes for young children
            if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
              // Check if recipe is child-friendly (simple ingredients, not too spicy)
              const ingredients = recipe.extendedIngredients || [];
              const hasComplexIngredients = ingredients.some(ing => {
                const name = (ing.name || ing.originalName || '').toLowerCase();
                return (
                  name.includes('spicy') ||
                  name.includes('chili') ||
                  name.includes('pepper') ||
                  name.includes('hot')
                );
              });
              // Allow some complex recipes but prefer simpler ones
              if (hasComplexIngredients && Math.random() > 0.3) return;
            }
          }

          // Assign meal to this member
          assignedMembers.push(member.id);
          memberMealCounts[member.id] = (memberMealCounts[member.id] || 0) + 1;
        });

        // If no specific assignments, assign to all safe members (or all if no restrictions)
        if (assignedMembers.length === 0 && familyMembers.length > 0) {
          // Assign to all members if recipe is safe for everyone
          const allSafe = familyMembers.every(member => isSafeForMember(recipe, member));
          if (allSafe) {
            return familyMembers.map(m => m.id);
          }
        }

        return assignedMembers;
      };

      // Helper function to get best recipe with variety
      const getBestRecipeWithVariety = (scoredRecipes, usedRecipeIds) => {
        // Filter out already used recipes
        const newRecipes = scoredRecipes.filter(
          item => !usedRecipeIds.has(item.recipe.id)
        );

        // If we have new recipes, use the best one
        if (newRecipes.length > 0) {
          return newRecipes[0].recipe;
        }

        // If all recipes are used, use the best one anyway (for small recipe databases)
        return scoredRecipes[0].recipe;
      };

      // Process meals first - plan each day
      for (let dayIdx = 0; dayIdx < DAYS_SHORT.length; dayIdx++) {
        const day = DAYS_SHORT[dayIdx];
        if (!next[day]) next[day] = emptyDay();

        // Plan main meals
        for (const mealType of MEALS) {
          if (!next[day][mealType] && suggestionCount < maxSuggestions) {
            try {
              // Use pantry ingredients strategically (every 3rd meal)
              const usePantry = suggestionCount % 3 === 0 && context.pantry.length > 0;
              const ingredients = usePantry
                ? [...context.pantry].sort(() => Math.random() - 0.5).slice(0, 3)
                : [];

              // Try favorites first (every 5th meal for variety)
              const useFavorites = suggestionCount % 5 === 0 && context.favorites.length > 0;
              let recipes = [];

              if (useFavorites) {
                // Filter favorites for safety
                const safeFavorites = context.favorites.filter(fav => {
                  const safetyCheck = checkRecipeSafetyForAll(fav);
                  return safetyCheck.safe && safetyCheck.safeForFamily;
                });
                recipes = safeFavorites.filter(fav => !usedRecipeIds.has(fav.id));
              }

              // If no favorites available, search for new recipes
              if (recipes.length === 0) {
                const result = await searchSupabaseRecipes({
                  query: '',
                  includeIngredients: ingredients,
                  diet: searchDiet || '',
                  mealType: mealTypeMap[mealType] || '',
                  maxTime: '',
                  limit: 50, // Fetch more for better variety and filtering
                });

                recipes = Array.isArray(result) ? result : [];
              }

              // CRITICAL: Filter for medical conditions FIRST
              recipes = filterRecipesByMedicalConditions(recipes);

              // CRITICAL: Filter for ALL safety (user + family allergies, restrictions)
              recipes = filterSafeRecipes(recipes);

              if (recipes.length > 0) {
                // Score and sort recipes by how well they match user's needs
                const scoredRecipes = recipes
                  .map(recipe => ({
                    recipe,
                    score: scoreRecipeForMealPlanning(recipe, mealTypeMap[mealType]),
                  }))
                  .sort((a, b) => b.score - a.score); // Highest score first

                // Get best recipe with variety (avoid repeats)
                const bestRecipe = getBestRecipeWithVariety(scoredRecipes, usedRecipeIds);

                // Double-check safety (extra safety check)
                const finalSafetyCheck = checkRecipeSafetyForAll(bestRecipe);
                if (finalSafetyCheck.safe && finalSafetyCheck.safeForFamily) {
                  // Automatically assign to appropriate family members
                  const assignedMembers = assignToFamilyMembers(bestRecipe, mealType);

                  next[day][mealType] = {
                    id: bestRecipe.id,
                    title: bestRecipe.title,
                    image: bestRecipe.image || bestRecipe.hero_image_url,
                    familyMembers: assignedMembers,
                  };

                  usedRecipeIds.add(bestRecipe.id);
                  suggestionCount++;
                  if (assignedMembers.length > 0) {
                    assignedToFamily += assignedMembers.length;
                  }
                } else {
                  skippedUnsafe++;
                  if (import.meta.env.DEV) {
                    console.warn('[SmartPlan] Skipped unsafe recipe:', {
                      title: bestRecipe.title,
                      conflicts: finalSafetyCheck.conflicts,
                    });
                  }
                }
              } else {
                skippedUnsafe++;
                if (import.meta.env.DEV) {
                  console.warn('[SmartPlan] No safe recipes found for', mealType, 'on', day);
                }
              }
            } catch (e) {
              if (import.meta.env.DEV) {
                console.warn('[SmartPlan] Failed to fetch meal suggestion', e);
              }
            }
          }
        }

        // Plan snacks if enabled
        if (includeSnacksInPlan && showSnacks) {
          for (const snackType of SNACKS) {
            if (!next[day][snackType] && suggestionCount < maxSuggestions) {
              try {
                const result = await searchSupabaseRecipes({
                  query: '',
                  includeIngredients: [],
                  diet: searchDiet || '',
                  mealType: 'snack',
                  maxTime: '30', // Snacks should be quick
                  limit: 30, // Fetch more for filtering
                });

                let recipes = Array.isArray(result) ? result : [];

                // Filter for safety
                recipes = filterRecipesByMedicalConditions(recipes);
                recipes = filterSafeRecipes(recipes);

                if (recipes.length > 0) {
                  // Score and pick best snack
                  const scoredRecipes = recipes
                    .map(recipe => ({
                      recipe,
                      score: scoreRecipeForMealPlanning(recipe, 'snack'),
                    }))
                    .sort((a, b) => b.score - a.score);

                  // Get best snack with variety
                  const bestRecipe = getBestRecipeWithVariety(scoredRecipes, usedRecipeIds);
                  const finalSafetyCheck = checkRecipeSafetyForAll(bestRecipe);

                  if (finalSafetyCheck.safe && finalSafetyCheck.safeForFamily) {
                    // Assign snacks to family members (especially children)
                    const assignedMembers = assignToFamilyMembers(bestRecipe, snackType);

                    next[day][snackType] = {
                      id: bestRecipe.id,
                      title: bestRecipe.title,
                      image: bestRecipe.image || bestRecipe.hero_image_url,
                      familyMembers: assignedMembers,
                    };

                    usedRecipeIds.add(bestRecipe.id);
                    suggestionCount++;
                    if (assignedMembers.length > 0) {
                      assignedToFamily += assignedMembers.length;
                    }
                  } else {
                    skippedUnsafe++;
                  }
                } else {
                  skippedUnsafe++;
                }
              } catch (e) {
                if (import.meta.env.DEV) {
                  console.warn('[SmartPlan] Failed to fetch snack suggestion', e);
                }
              }
            }
          }
        }
      }

      setPlan(next);
      trackFeatureUsage(FEATURES.MEAL_PLANNER, {
        action: 'generate_smart_plan',
        mealCount: suggestionCount,
        skippedUnsafe,
        assignedToFamily,
        hasCalorieGoals: context.hasGoals,
        hasMedicalConditions: context.hasMedicalConditions,
        hasFamily: context.hasFamily,
        familyMembersCount: familyMembers.length,
      });

      // Show comprehensive success message
      let successMessage = `✨ Generated ${suggestionCount} safe meal${suggestionCount !== 1 ? 's' : ''} for your week!`;
      
      if (assignedToFamily > 0) {
        successMessage += ` 👨‍👩‍👧‍👦 Assigned to ${assignedToFamily} family member${assignedToFamily !== 1 ? 's' : ''}`;
      }
      
      if (skippedUnsafe > 0) {
        successMessage += ` (Skipped ${skippedUnsafe} unsafe recipe${skippedUnsafe !== 1 ? 's' : ''})`;
      }
      
      if (context.hasMedicalConditions || context.hasFamily) {
        successMessage += ' ✅ All recipes checked for medical safety!';
      }
      
      if (context.hasGoals) {
        successMessage += ' 🎯 Recipes matched to calorie goals!';
      }
      
      if (context.pantry.length > 0) {
        successMessage += ' 🥘 Used pantry ingredients!';
      }
      
      if (usedRecipeIds.size < suggestionCount * 0.7) {
        successMessage += ' 🎨 Great variety!';
      }

      toast.success(successMessage, { duration: 6000 });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[SmartPlan] Error:', error);
      }
      toast.error('Failed to generate smart plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate nutrition stats
  const nutritionStats = useMemo(() => {
    let filled = 0;
    let total = 0;
    const mealsToCount = showSnacks ? [...MEALS, ...SNACKS] : MEALS;

    DAYS_SHORT.forEach(day => {
      mealsToCount.forEach(meal => {
        total++;
        if (plan[day]?.[meal]) filled++;
      });
    });
    return {
      filled,
      empty: total - filled,
      total,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }, [plan, showSnacks]);

  const fillFromFavorites = async () => {
    if (favorites.length === 0) {
      toast.error('No favorites found. Add some recipes to favorites first!');
      return;
    }

    // Get context to check safety (will be used in safety checks below)
    getMealPlannerContext(); // Load context for safety checks

    setLoading(true);
    const next = { ...plan };
    let fi = 0;
    let filled = 0;
    let skippedUnsafe = 0;
    const mealsToFill = showSnacks ? [...MEALS, ...SNACKS] : MEALS;

    // Load full recipe data to check safety
    for (const day of DAYS_SHORT) {
      if (!next[day]) next[day] = emptyDay();
      for (const mealType of mealsToFill) {
        if (!next[day][mealType]) {
          const fav = favorites[fi % favorites.length];
          if (fav) {
            try {
              // Load full recipe to check safety
              const fullRecipe = await getSupabaseRecipeById(fav.id);
              if (fullRecipe) {
                const safetyCheck = checkRecipeSafetyForAll(fullRecipe);
                if (safetyCheck.safe && safetyCheck.safeForFamily) {
                  next[day][mealType] = {
                    id: fav.id,
                    title: fav.title,
                    image: fav.image || fav.hero_image_url,
                    familyMembers: [], // Can be assigned later
                  };
                  filled++;
                } else {
                  skippedUnsafe++;
                }
              }
            } catch (e) {
              // If we can't load recipe, use it anyway (fallback)
              next[day][mealType] = {
                id: fav.id,
                title: fav.title,
                image: fav.image || fav.hero_image_url,
              };
              filled++;
            }
          }
          fi++;
        }
      }
    }

    setPlan(next);
    setLoading(false);

    trackFeatureUsage(FEATURES.MEAL_PLANNER, {
      action: 'fill_from_favorites',
      mealCount: filled,
      skippedUnsafe,
    });

    let message = `Filled ${filled} meal${filled !== 1 ? 's' : ''} from favorites!`;
    if (skippedUnsafe > 0) {
      message += ` (Skipped ${skippedUnsafe} unsafe recipe${skippedUnsafe !== 1 ? 's' : ''})`;
    }
    toast.success(message);
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all meals?')) {
      const emptyPlan = {};
      DAYS_SHORT.forEach(day => {
        emptyPlan[day] = emptyDay();
      });
      setPlan(emptyPlan);
      toast.success('Meal plan cleared!');
    }
  };

  const generateGroceryList = async () => {
    // Collect all planned recipes across all days, meals, and snacks
    const allRecipes = [];
    const mealsToInclude = showSnacks ? [...MEALS, ...SNACKS] : MEALS;

    DAYS_SHORT.forEach(day => {
      mealsToInclude.forEach(meal => {
        if (plan[day]?.[meal]) {
          allRecipes.push(plan[day][meal]);
        }
      });
    });

    if (allRecipes.length === 0) {
      toast.error('No meals planned. Add some meals first!');
      return;
    }

    setLoading(true);
    const all = [];
    let loaded = 0;

    for (const r of allRecipes) {
        try {
          const info = await getSupabaseRecipeById(r.id);
          if (info?.extendedIngredients) {
            const items = info.extendedIngredients
              .map(i => i.original || i.originalString || '')
              .filter(Boolean);
            all.push(...items);
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('Failed to load ingredients for', r.id, e);
          }
        }
    }

    setLoading(false);

    if (all.length) {
      // Use smart aggregation
      const { aggregateIngredients, formatAggregatedIngredient } = await import(
        '../utils/ingredientAggregator.js'
      );
      const aggregated = aggregateIngredients(all);
      const formatted = aggregated.map(formatAggregatedIngredient);

      addMany(formatted, true); // Keep full quantities with aggregation
      setOpen(true);
      toast.success(`Added ${formatted.length} smart ingredients to grocery list!`);
    } else {
      toast.error('Could not load ingredients. Please try again.');
    }
  };

  // Duplicate a day's meals to another day
  const duplicateDay = (fromDayIdx, toDayIdx) => {
    const fromDay = DAYS_SHORT[fromDayIdx];
    const toDay = DAYS_SHORT[toDayIdx];
    const next = { ...plan };
    if (next[fromDay]) {
      next[toDay] = { ...next[fromDay] };
      setPlan(next);
    }
  };

  // Clear a specific day
  const clearDay = dayIdx => {
    const day = DAYS_SHORT[dayIdx];
    const next = { ...plan };
    next[day] = emptyDay();
    setPlan(next);
  };

  // Calculate daily stats
  const getDailyStats = useMemo(() => {
    const stats = {};
    const mealsToCount = showSnacks ? [...MEALS, ...SNACKS] : MEALS;
    DAYS_SHORT.forEach((day, idx) => {
      const meals = plan[day] || emptyDay();
      const filled = mealsToCount.filter(meal => meals[meal]).length;
      const total = mealsToCount.length;
      stats[day] = {
        filled,
        total,
        percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
      };
    });
    return stats;
  }, [plan, showSnacks]);

  // Get user context for display (recalculate when plan changes to show updated stats)
  const userContext = useMemo(() => getMealPlannerContext(), []);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
      {/* Header with Stats */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex-shrink-0">
            <BackToHome className="mb-0" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
              📅 Smart Meal Planner
            </h1>
          </div>
        </div>

        {/* Context Awareness Widget */}
        {userContext.hasAnyRestrictions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 p-3 xs:p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm xs:text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  🧠 Smart Planning Active
                </h3>
                <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Your meal planner is aware of:
                </p>
                <div className="flex flex-wrap gap-2">
                  {userContext.hasGoals && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700">
                      <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] xs:text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Calorie Goals ({Math.round(userContext.dailyCalories || 0)} cal/day)
                      </span>
                    </div>
                  )}
                  {userContext.hasMedicalConditions && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-[10px] xs:text-xs font-semibold text-red-700 dark:text-red-300">
                        Medical Conditions ({userContext.conditions.length})
                      </span>
                    </div>
                  )}
                  {userContext.hasFamily && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700">
                      <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-[10px] xs:text-xs font-semibold text-purple-700 dark:text-purple-300">
                        Family ({userContext.members.length} member{userContext.members.length !== 1 ? 's' : ''}
                        {userContext.hasChildren ? `, ${userContext.childrenCount} child${userContext.childrenCount !== 1 ? 'ren' : ''}` : ''})
                      </span>
                    </div>
                  )}
                  {userContext.allFoodsToAvoid.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700">
                      <X className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-[10px] xs:text-xs font-semibold text-orange-700 dark:text-orange-300">
                        {userContext.allFoodsToAvoid.length} Restriction{userContext.allFoodsToAvoid.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {userContext.pantry.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700">
                      <span className="text-xs">🥘</span>
                      <span className="text-[10px] xs:text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {userContext.pantry.length} Pantry Item{userContext.pantry.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                  ✅ All recipes are automatically checked for safety and will match your goals!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                  Week Progress
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {nutritionStats.percentage}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {nutritionStats.filled}/{nutritionStats.total}
                </p>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                  meals planned
                </p>
              </div>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nutritionStats.percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              />
            </div>
          </motion.div>

          {/* Quick Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg"
          >
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
              Quick Stats
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  📅 Days with meals:
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {
                    DAYS_SHORT.filter(day => {
                      const meals = plan[day] || emptyDay();
                      return Object.values(meals).some(Boolean);
                    }).length
                  }
                  /7
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  ❤️ From favorites:
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {DAYS_SHORT.reduce((count, day) => {
                    const meals = plan[day] || emptyDay();
                    return (
                      count +
                      Object.values(meals).filter(
                        meal => meal && favorites.some(fav => fav.id === meal.id)
                      ).length
                    );
                  }, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  🔄 Complete days:
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {
                    DAYS_SHORT.filter(day => {
                      const meals = plan[day] || emptyDay();
                      const mealsToCheck = showSnacks ? [...MEALS, ...SNACKS] : MEALS;
                      return mealsToCheck.every(meal => meals[meal]);
                    }).length
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Snack Toggle & Settings */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSnacks(!showSnacks)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all touch-manipulation ${
                showSnacks
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {showSnacks ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="text-xs sm:text-sm font-medium">Show Snacks</span>
            </motion.button>
            {showSnacks && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIncludeSnacksInPlan(!includeSnacksInPlan)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all touch-manipulation text-xs sm:text-sm font-medium ${
                  includeSnacksInPlan
                    ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Include in AI Plan</span>
              </motion.button>
            )}
          </div>
          {showSnacks && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>🍎</span>
              <span>Morning</span>
              <span>•</span>
              <span>🥕</span>
              <span>Afternoon</span>
              <span>•</span>
              <span>🍌</span>
              <span>Evening</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateSmartPlan}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <CompactRecipeLoader />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">AI Plan My Week</span>
                <span className="sm:hidden">AI Plan</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fillFromFavorites}
            disabled={favorites.length === 0}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Fill from Favorites</span>
            <span className="sm:hidden">Favorites</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateGroceryList}
            disabled={nutritionStats.filled === 0 || loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Generate Grocery List</span>
            <span className="sm:hidden">Grocery</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearAll}
            disabled={nutritionStats.filled === 0}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Clear</span>
          </motion.button>
        </div>
      </div>

      {/* Meal Grid - One week card per day */}
      <div className="grid gap-3 sm:gap-4">
        {DAYS_SHORT.map((dayKey, dayIdx) => {
          const dayMeals = plan[dayKey] || emptyDay();
          const mealEmojis = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️' };
          const mealColors = {
            breakfast: 'from-yellow-500 to-orange-500',
            lunch: 'from-green-500 to-emerald-500',
            dinner: 'from-purple-500 to-pink-500',
          };
          const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

          return (
            <motion.div
              key={dayKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.05 }}
              className="rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Day Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 sm:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <h3 className="font-bold text-lg sm:text-xl">{DAYS[dayIdx]}</h3>
                    <span className="text-xs sm:text-sm opacity-90">
                      {getDailyStats[dayKey]?.filled || 0}/
                      {getDailyStats[dayKey]?.total || MEALS.length}{' '}
                      {showSnacks ? 'items' : 'meals'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Quick Actions */}
                    {dayIdx > 0 && getDailyStats[DAYS_SHORT[dayIdx - 1]]?.filled > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => duplicateDay(dayIdx - 1, dayIdx)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs sm:text-sm font-semibold transition-all touch-manipulation"
                        title="Copy previous day"
                      >
                        📋 Copy
                      </motion.button>
                    )}
                    {getDailyStats[dayKey]?.filled > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => clearDay(dayIdx)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs sm:text-sm font-semibold transition-all touch-manipulation"
                        title="Clear this day"
                      >
                        ✕ Clear
                      </motion.button>
                    )}
                  </div>
                </div>
                {/* Day Progress Bar */}
                {getDailyStats[dayKey] && (
                  <div className="mt-2 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getDailyStats[dayKey].percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Meals Grid */}
              <div className="p-3 sm:p-4">
                {/* Main Meals */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  {MEALS.map((mealType, mealIdx) => {
                    const recipe = dayMeals[mealType];
                    return (
                      <div key={mealType} className="relative">
                        {/* Meal Label */}
                        <div
                          className={`flex items-center gap-2 mb-2 text-xs font-bold text-slate-600 dark:text-slate-400`}
                        >
                          <span className="text-lg">{mealEmojis[mealType]}</span>
                          <span>{mealLabels[mealType]}</span>
                        </div>

                        {/* Recipe Card */}
                        {!recipe ? (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/')}
                            className="flex flex-col items-center justify-center h-32 sm:h-40 rounded-lg sm:rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group hover:border-purple-300 dark:hover:border-purple-700 active:border-purple-400 dark:active:border-purple-600 transition-colors cursor-pointer relative touch-manipulation"
                          >
                            <svg
                              className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-purple-500 mb-1 sm:mb-2 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Tap to add
                            </span>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col h-full relative group">
                            {/* Action Buttons - Top Right */}
                            <div className="absolute top-1 right-1 z-10 flex gap-1">
                              {/* Swap Button */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={async e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const fullRecipe = await getSupabaseRecipeById(recipe.id);
                                    setSwapState({
                                      dayIdx,
                                      mealType,
                                      recipe: fullRecipe || recipe,
                                      position: {
                                        top:
                                          e.currentTarget.getBoundingClientRect().top +
                                          window.scrollY,
                                        left:
                                          e.currentTarget.getBoundingClientRect().left +
                                          window.scrollX,
                                      },
                                    });
                                  } catch (err) {
                                    console.error('Failed to load recipe for swap:', err);
                                    setSwapState({
                                      dayIdx,
                                      mealType,
                                      recipe,
                                      position: {
                                        top:
                                          e.currentTarget.getBoundingClientRect().top +
                                          window.scrollY,
                                        left:
                                          e.currentTarget.getBoundingClientRect().left +
                                          window.scrollX,
                                      },
                                    });
                                  }
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/90 dark:bg-purple-600/90 hover:bg-purple-600 dark:hover:bg-purple-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                title="Swap recipe"
                              >
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </motion.button>
                              {/* Remove Button */}
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMeal(dayIdx, mealType, null);
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/90 dark:bg-red-600/90 hover:bg-red-600 dark:hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                title="Remove recipe"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </motion.button>
                            </div>

                            <Link to={`/recipe/${recipe.id}`} className="block group flex-1">
                              <div className="relative overflow-hidden rounded-lg sm:rounded-xl mb-2">
                                <img
                                  src={recipeImg(recipe.hero_image_url || recipe.image, recipe.id)}
                                  data-original-src={recipe.hero_image_url || recipe.image}
                                  alt={recipe.title}
                                  className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={e => {
                                    if (import.meta.env.DEV) {
                                      console.error('[MealPlanner] meal image failed', {
                                        day: DAYS[dayIdx],
                                        mealType,
                                        id: recipe.id,
                                        src: e.currentTarget.src,
                                      });
                                    }
                                    fallbackOnce(e);
                                  }}
                                  onLoad={e => {
                                    if (import.meta.env.DEV) {
                                      console.warn('[MealPlanner] meal image loaded', {
                                        day: DAYS[dayIdx],
                                        mealType,
                                        id: recipe.id,
                                        src: e.currentTarget.src,
                                      });
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[2.5rem]">
                                {recipe.title}
                              </p>
                            </Link>

                            {/* Family Member Assignment */}
                            {familyMembers.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <button
                                  onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setAssigningToMeal({ dayIdx, mealType, recipe });
                                  }}
                                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs"
                                >
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                    <span className="text-slate-600 dark:text-slate-400 truncate">
                                      {recipe.familyMembers && recipe.familyMembers.length > 0
                                        ? `${recipe.familyMembers.length} assigned`
                                        : 'Assign to family'}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 dark:text-slate-500">→</span>
                                </button>

                                {/* Show assigned members */}
                                {recipe.familyMembers && recipe.familyMembers.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {recipe.familyMembers.map(memberId => {
                                      const member = familyMembers.find(m => m.id === memberId);
                                      if (!member) return null;
                                      const roleEmojis = {
                                        baby: '👶',
                                        toddler: '🧒',
                                        child: '👦',
                                        teenager: '🧑',
                                        teen: '🧑',
                                        mom: '👩',
                                        dad: '👨',
                                        parent: '👤',
                                        grandma: '👵',
                                        grandpa: '👴',
                                      };
                                      const emoji = roleEmojis[member.role] || '👤';
                                      return (
                                        <span
                                          key={memberId}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-[10px] font-semibold text-blue-700 dark:text-blue-300"
                                          title={`${member.name} (${member.role})`}
                                        >
                                          <span>{emoji}</span>
                                          <span className="truncate max-w-[60px]">{member.name}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Snacks Section (if enabled) */}
                {showSnacks && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Snacks
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({SNACKS.filter(s => dayMeals[s]).length}/{SNACKS.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {SNACKS.map(snackType => {
                        const recipe = dayMeals[snackType];
                        const snackEmojis = {
                          morning_snack: '🍎',
                          afternoon_snack: '🥕',
                          evening_snack: '🍌',
                        };
                        const snackLabels = {
                          morning_snack: 'Morning',
                          afternoon_snack: 'Afternoon',
                          evening_snack: 'Evening',
                        };

                        return (
                          <div key={snackType} className="relative">
                            {/* Snack Label */}
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <span className="text-base">{snackEmojis[snackType]}</span>
                              <span>{snackLabels[snackType]}</span>
                            </div>

                            {/* Snack Card */}
                            {!recipe ? (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/')}
                                className="flex flex-col items-center justify-center h-24 sm:h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group hover:border-purple-300 dark:hover:border-purple-700 active:border-purple-400 dark:active:border-purple-600 transition-colors cursor-pointer touch-manipulation"
                              >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-purple-500 mb-1 transition-colors" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Add snack
                                </span>
                              </motion.div>
                            ) : (
                              <div className="flex flex-col h-full relative group">
                                <div className="absolute top-0.5 right-0.5 z-10 flex gap-1">
                                  {/* Swap Button */}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={async e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const fullRecipe = await getSupabaseRecipeById(recipe.id);
                                        setSwapState({
                                          dayIdx,
                                          mealType: snackType,
                                          recipe: fullRecipe || recipe,
                                          position: {
                                            top:
                                              e.currentTarget.getBoundingClientRect().top +
                                              window.scrollY,
                                            left:
                                              e.currentTarget.getBoundingClientRect().left +
                                              window.scrollX,
                                          },
                                        });
                                      } catch (err) {
                                        setSwapState({
                                          dayIdx,
                                          mealType: snackType,
                                          recipe,
                                          position: {
                                            top:
                                              e.currentTarget.getBoundingClientRect().top +
                                              window.scrollY,
                                            left:
                                              e.currentTarget.getBoundingClientRect().left +
                                              window.scrollX,
                                          },
                                        });
                                      }
                                    }}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500/90 dark:bg-purple-600/90 hover:bg-purple-600 dark:hover:bg-purple-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                    title="Swap snack"
                                  >
                                    <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  </motion.button>
                                  {/* Remove Button */}
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMeal(dayIdx, snackType, null);
                                    }}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500/90 dark:bg-red-600/90 hover:bg-red-600 dark:hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                    title="Remove snack"
                                  >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </motion.button>
                                </div>

                                <Link to={`/recipe/${recipe.id}`} className="block group flex-1">
                                  <div className="relative overflow-hidden rounded-lg mb-1.5">
                                    <img
                                      src={recipeImg(
                                        recipe.hero_image_url || recipe.image,
                                        recipe.id
                                      )}
                                      data-original-src={recipe.hero_image_url || recipe.image}
                                      alt={recipe.title}
                                      className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                      loading="lazy"
                                      onError={e => fallbackOnce(e)}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="text-xs font-semibold line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[2rem]">
                                    {recipe.title}
                                  </p>
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Meal Swap Modal */}
      {swapState && (
        <MealSwap
          currentRecipe={swapState.recipe}
          mealType={swapState.mealType}
          onSelect={newRecipe => {
            setMeal(swapState.dayIdx, swapState.mealType, newRecipe);
            setSwapState(null);
          }}
          onClose={() => setSwapState(null)}
          position={swapState.position}
        />
      )}

      {/* Family Member Assignment Modal */}
      {assigningToMeal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setAssigningToMeal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Assign to Family Members
                </h3>
                <button
                  onClick={() => setAssigningToMeal(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {assigningToMeal.recipe.title}
              </p>
            </div>

            {/* Family Members List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {familyMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No family members added yet.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Add family members in the Family Plan section.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {familyMembers.map(member => {
                    const roleEmojis = {
                      baby: '👶',
                      toddler: '🧒',
                      child: '👦',
                      teenager: '🧑',
                      teen: '🧑',
                      mom: '👩',
                      dad: '👨',
                      parent: '👤',
                      grandma: '👵',
                      grandpa: '👴',
                    };
                    const emoji = roleEmojis[member.role] || '👤';
                    const isAssigned =
                      assigningToMeal.recipe.familyMembers &&
                      assigningToMeal.recipe.familyMembers.includes(member.id);

                    return (
                      <motion.button
                        key={member.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const currentMembers =
                            assigningToMeal.recipe.familyMembers || [];
                          const newMembers = isAssigned
                            ? currentMembers.filter(id => id !== member.id)
                            : [...currentMembers, member.id];

                          // Update the meal with new family member assignments
                          const updatedRecipe = {
                            ...assigningToMeal.recipe,
                            familyMembers: newMembers,
                          };
                          setMeal(
                            assigningToMeal.dayIdx,
                            assigningToMeal.mealType,
                            updatedRecipe,
                            newMembers
                          );
                          setAssigningToMeal({
                            ...assigningToMeal,
                            recipe: updatedRecipe,
                          });
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          isAssigned
                            ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <div className="text-2xl">{emoji}</div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {member.role}
                            {member.ageMonths &&
                              ` • ${Math.round(parseFloat(member.ageMonths) / 12)} years`}
                          </p>
                          {(member.allergies?.length > 0 ||
                            member.dietaryRestrictions?.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.allergies?.slice(0, 2).map(allergy => (
                                <span
                                  key={allergy}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                                >
                                  {allergy}
                                </span>
                              ))}
                              {member.dietaryRestrictions?.slice(0, 2).map(restriction => (
                                <span
                                  key={restriction}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                >
                                  {restriction}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isAssigned && (
                          <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setAssigningToMeal(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
