/**
 * Supabase Data Sync Utility
 * Syncs local data (analytics, favorites, meal plans, etc.) to Supabase
 */

import { supabase } from '../lib/supabaseClient.js';

/**
 * Sync recipe view to Supabase
 */
export async function syncRecipeView(recipeId) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'recipe_view',
      recipe_id: recipeId,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.warn('[Supabase Sync] Failed to sync recipe view:', error);
  }
}

/**
 * Sync recipe favorite to Supabase
 */
export async function syncRecipeFavorite(recipeId, isFavorite) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (isFavorite) {
      // Add to favorites table
      await supabase.from('favorites').upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
        },
        { onConflict: 'user_id,recipe_id' }
      );

      // Log activity
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: 'recipe_favorite',
        recipe_id: recipeId,
        metadata: { action: 'added' },
      });
    } else {
      // Remove from favorites
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId);

      // Log activity
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: 'recipe_favorite',
        recipe_id: recipeId,
        metadata: { action: 'removed' },
      });
    }
  } catch (error) {
    console.warn('[Supabase Sync] Failed to sync favorite:', error);
  }
}

/**
 * Sync recipe rating to Supabase
 */
export async function syncRecipeRating(recipeId, rating, notes = null) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('recipe_ratings').upsert(
      {
        user_id: user.id,
        recipe_id: recipeId,
        rating,
        notes,
      },
      { onConflict: 'user_id,recipe_id' }
    );

    // Log activity
    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'recipe_rate',
      recipe_id: recipeId,
      metadata: { rating, notes },
    });
  } catch (error) {
    console.warn('[Supabase Sync] Failed to sync rating:', error);
  }
}

/**
 * Sync meal plan to Supabase
 */
export async function syncMealPlan(planData) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate week start (Monday of current week)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    await supabase.from('meal_plans').upsert(
      {
        user_id: user.id,
        week_start_date: monday.toISOString().split('T')[0],
        plan_data: planData,
      },
      { onConflict: 'user_id,week_start_date' }
    );
  } catch (error) {
    console.warn('[Supabase Sync] Failed to sync meal plan:', error);
  }
}

/**
 * Sync grocery list to Supabase
 */
export async function syncGroceryList(items, listName = 'My Grocery List') {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get or create grocery list
    const { data: existing } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('list_name', listName)
      .single();

    if (existing) {
      await supabase
        .from('grocery_lists')
        .update({ items, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('grocery_lists').insert({
        user_id: user.id,
        list_name: listName,
        items,
      });
    }
  } catch (error) {
    console.warn('[Supabase Sync] Failed to sync grocery list:', error);
  }
}

/**
 * Sync search activity to Supabase
 */
export async function syncSearch(query, resultsCount = 0) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'search_performed',
      metadata: { query, resultsCount },
    });
  } catch (error) {
    console.warn('[Supabase Sync] Failed to sync search:', error);
  }
}

/**
 * Batch sync - syncs all local data to Supabase (called periodically)
 */
export async function batchSyncToSupabase() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Sync favorites
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      for (const recipeId of favorites) {
        await syncRecipeFavorite(recipeId, true);
      }
    } catch (error) {
      console.warn('[Supabase Sync] Failed to batch sync favorites:', error);
    }

    // Sync meal plan
    try {
      const mealPlan = JSON.parse(localStorage.getItem('meal:plan:v3') || 'null');
      if (mealPlan) {
        await syncMealPlan(mealPlan);
      }
    } catch (error) {
      console.warn('[Supabase Sync] Failed to batch sync meal plan:', error);
    }

    // Sync grocery list
    try {
      const { useGroceryList } = await import('../context/GroceryListContext.jsx');
      // Note: This would need to be called from a component with access to the context
      // For now, we'll sync when explicitly called
    } catch (error) {
      console.warn('[Supabase Sync] Failed to batch sync grocery list:', error);
    }
  } catch (error) {
    console.warn('[Supabase Sync] Batch sync failed:', error);
  }
}
