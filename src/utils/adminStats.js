/**
 * Admin Statistics Utilities
 * Fetch statistics and data for admin dashboard
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Get dashboard overview statistics
 */
export async function getDashboardStats() {
  try {
    // Get total recipes count
    const { count: totalRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    // Get recipes created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: recipesToday, error: todayError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get recipes created this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: recipesThisWeek, error: weekError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get total users and subscription stats using admin API if available
    let totalUsers = 0;
    let activeSubscriptions = 0;
    let freeUsers = 0;
    let paidUsers = 0;

    try {
      // Try to get from admin API (uses auth.users + profiles)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.stats) {
            totalUsers = data.stats.total || 0;
            freeUsers = data.stats.free || 0;
            paidUsers = (data.stats.supporter || 0) + (data.stats.family || 0);
            activeSubscriptions = data.stats.active || 0;
          }
        } else if (response.status === 403) {
          // 403 is expected for non-admin users - silently fallback
          // Don't log this as it's not an error
        }
      }
    } catch (e) {
      // Only warn in dev mode
      if (import.meta.env.DEV) {
        console.warn('Could not fetch users from admin API, falling back to profiles:', e);
      }
    }

    // Fallback: Get from profiles table if admin API failed
    let profilesError = null;
    if (totalUsers === 0) {
      try {
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (!usersError && usersCount !== null) {
          totalUsers = usersCount;
        }

        // Get subscription stats
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('plan, subscription_status');

        profilesError = profilesErr;

        if (profiles && !profilesErr) {
          profiles.forEach(profile => {
            if (profile.plan === 'free' || !profile.plan) {
              freeUsers++;
            } else {
              paidUsers++;
              if (profile.subscription_status === 'active') {
                activeSubscriptions++;
              }
            }
          });
        }
      } catch (e) {
        console.warn('Could not fetch user count from profiles:', e);
        profilesError = e;
      }
    }

    // Get most popular recipe (by views if available, otherwise by favorites)
    const { data: topRecipe, error: topRecipeError } = await supabase
      .from('recipes')
      .select('id, title, hero_image_url')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get recipes with missing images
    const { count: missingImages, error: missingImagesError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .or('hero_image_url.is.null,hero_image_url.eq.');

    // Get recipes with missing nutrition (nutrition is stored in recipes table)
    const { count: missingNutrition, error: missingNutritionError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .or('calories.is.null,calories.eq.0');

    return {
      totalRecipes: totalRecipes || 0,
      recipesToday: recipesToday || 0,
      recipesThisWeek: recipesThisWeek || 0,
      totalUsers: totalUsers || freeUsers + paidUsers,
      activeSubscriptions: activeSubscriptions || 0,
      freeUsers: freeUsers || 0,
      paidUsers: paidUsers || 0,
      topRecipe: topRecipe || null,
      missingImages: missingImages || 0,
      missingNutrition: missingNutrition || 0,
      errors: {
        recipes: recipesError,
        today: todayError,
        week: weekError,
        profiles: profilesError,
        topRecipe: topRecipeError,
        missingImages: missingImagesError,
        missingNutrition: missingNutritionError,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalRecipes: 0,
      recipesToday: 0,
      recipesThisWeek: 0,
      totalUsers: 0,
      activeSubscriptions: 0,
      freeUsers: 0,
      paidUsers: 0,
      topRecipe: null,
      missingImages: 0,
      missingNutrition: 0,
      errors: { general: error },
    };
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(limit = 10) {
  try {
    // Get recent recipes
    const { data: recentRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent user signups (try admin API first, then fallback to profiles)
    let recentUsers = [];
    let usersError = null;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.users && Array.isArray(data.users)) {
            // Sort by created_at and limit
            recentUsers = data.users
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, limit)
              .map(user => ({
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                plan: user.plan || 'free',
              }));
          }
        } else if (response.status === 403) {
          // 403 is expected for non-admin users - silently fallback
          // Don't log this as it's not an error
        }
      }
    } catch (e) {
      console.warn('Could not fetch recent users from admin API, falling back to profiles:', e);
    }

    // Fallback to profiles table
    if (recentUsers.length === 0) {
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email, created_at, plan')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      recentUsers = profilesData || [];
      usersError = profilesErr;
    }

    return {
      recentRecipes: recentRecipes || [],
      recentUsers: recentUsers || [],
      errors: {
        recipes: recipesError,
        users: usersError,
      },
    };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return {
      recentRecipes: [],
      recentUsers: [],
      errors: { general: error },
    };
  }
}

/**
 * Get recipe analytics
 */
export async function getRecipeAnalytics() {
  try {
    // Get most popular recipes (by creation date as proxy for popularity)
    const { data: popularRecipes, error: popularError } = await supabase
      .from('recipes')
      .select('id, title, created_at, cuisine, meal_types, difficulty')
      .order('created_at', { ascending: false })
      .limit(20);

    // Get cuisine distribution
    const { data: allRecipes, error: allError } = await supabase
      .from('recipes')
      .select('cuisine, meal_types, difficulty, prep_minutes, cook_minutes');

    let cuisineDistribution = {};
    let mealTypeDistribution = {};
    let difficultyDistribution = {};
    let avgPrepTime = 0;
    let avgCookTime = 0;
    let totalPrep = 0;
    let totalCook = 0;
    let recipesWithTimes = 0;

    if (allRecipes && !allError) {
      allRecipes.forEach(recipe => {
        // Cuisine distribution
        if (recipe.cuisine && Array.isArray(recipe.cuisine)) {
          recipe.cuisine.forEach(c => {
            cuisineDistribution[c] = (cuisineDistribution[c] || 0) + 1;
          });
        }

        // Meal type distribution
        if (recipe.meal_types && Array.isArray(recipe.meal_types)) {
          recipe.meal_types.forEach(m => {
            mealTypeDistribution[m] = (mealTypeDistribution[m] || 0) + 1;
          });
        }

        // Difficulty distribution
        if (recipe.difficulty) {
          difficultyDistribution[recipe.difficulty] =
            (difficultyDistribution[recipe.difficulty] || 0) + 1;
        }

        // Average times
        if (recipe.prep_minutes) {
          totalPrep += recipe.prep_minutes;
          recipesWithTimes++;
        }
        if (recipe.cook_minutes) {
          totalCook += recipe.cook_minutes;
        }
      });

      avgPrepTime = recipesWithTimes > 0 ? Math.round(totalPrep / recipesWithTimes) : 0;
      avgCookTime = recipesWithTimes > 0 ? Math.round(totalCook / recipesWithTimes) : 0;
    }

    // Get recipes with missing data
    const { count: missingImages, error: missingImagesError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .or('hero_image_url.is.null,hero_image_url.eq.');

    const { count: missingNutrition, error: missingNutritionError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .or('calories.is.null,calories.eq.0');

    return {
      popularRecipes: popularRecipes || [],
      cuisineDistribution,
      mealTypeDistribution,
      difficultyDistribution,
      avgPrepTime,
      avgCookTime,
      missingImages: missingImages || 0,
      missingNutrition: missingNutrition || 0,
      errors: {
        popular: popularError,
        all: allError,
        missingImages: missingImagesError,
        missingNutrition: missingNutritionError,
      },
    };
  } catch (error) {
    console.error('Error fetching recipe analytics:', error);
    return {
      popularRecipes: [],
      cuisineDistribution: {},
      mealTypeDistribution: {},
      difficultyDistribution: {},
      avgPrepTime: 0,
      avgCookTime: 0,
      missingImages: 0,
      missingNutrition: 0,
      errors: { general: error },
    };
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth() {
  try {
    const health = {
      database: { status: 'unknown', responseTime: 0 },
      storage: { status: 'unknown', bucketAccessible: false },
      api: { status: 'unknown' },
      timestamp: new Date().toISOString(),
    };

    // Test database connection
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('recipes').select('id').limit(1);
    const dbTime = Date.now() - dbStart;

    health.database = {
      status: dbError ? 'error' : 'healthy',
      responseTime: dbTime,
      error: dbError?.message,
    };

    // Test storage access
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('recipe-images')
        .list('', { limit: 1 });

      health.storage = {
        status: storageError ? 'error' : 'healthy',
        bucketAccessible: !storageError,
        error: storageError?.message,
      };
    } catch (e) {
      health.storage = {
        status: 'error',
        bucketAccessible: false,
        error: e.message,
      };
    }

    // API status (assume healthy if database works)
    health.api = {
      status: dbError ? 'error' : 'healthy',
    };

    return health;
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      database: { status: 'error', responseTime: 0, error: error.message },
      storage: { status: 'error', bucketAccessible: false, error: error.message },
      api: { status: 'error' },
      timestamp: new Date().toISOString(),
    };
  }
}
