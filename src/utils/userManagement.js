/**
 * User Management Utilities
 * Functions for managing users in admin dashboard
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Get all users with their profile data
 * Uses admin API endpoint to fetch all auth.users and merge with profiles
 */
export async function getAllUsers(limit = 1000, offset = 0) {
  try {
    // Get current user's session token for admin API
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError);
      // Fallback to profiles table if no session
      return await getAllUsersFromProfiles(limit, offset);
    }

    // Call admin API endpoint
    // In production, Vercel automatically handles /api routes
    // In development, use the origin (Vite dev server proxies to Vercel if needed)
    const apiUrl = '/api/admin/users';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Admin API error:', errorData);
      // Fallback to profiles table
      return await getAllUsersFromProfiles(limit, offset);
    }

    const data = await response.json();
    
    // Apply pagination if needed
    let users = data.users || [];
    if (limit < users.length || offset > 0) {
      users = users.slice(offset, offset + limit);
    }

    return {
      users,
      total: data.total || users.length,
      stats: data.stats,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching users from admin API:', error);
    // Fallback to profiles table
    return await getAllUsersFromProfiles(limit, offset);
  }
}

/**
 * Fallback: Get users from profiles table only
 */
async function getAllUsersFromProfiles(limit = 100, offset = 0) {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      users: profiles || [],
      total: profiles?.length || 0,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching users from profiles:', error);
    return {
      users: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Search users by email
 */
export async function searchUsers(query, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', `%${query}%`)
      .limit(limit);

    if (error) throw error;

    return {
      users: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      users: [],
      error: error.message,
    };
  }
}

/**
 * Update user subscription plan
 */
export async function updateUserPlan(userId, plan, billingPeriod = 'monthly') {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        plan,
        billing_period: billingPeriod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      user: data,
      error: null,
    };
  } catch (error) {
    console.error('Error updating user plan:', error);
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
}

/**
 * Flush cache for a specific user
 * Updates the user's profile with a new cache_bust_version timestamp
 */
export async function flushUserCache(userId) {
  try {
    const cacheBustVersion = Date.now();
    
    // Update user's profile with cache_bust_version
    // We'll store it in a metadata JSONB field or directly as a column
    const { error } = await supabase
      .from('profiles')
      .update({
        cache_bust_version: cacheBustVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return {
      success: true,
      cacheBustVersion,
      error: null,
    };
  } catch (error) {
    console.error('Error flushing user cache:', error);
    return {
      success: false,
      cacheBustVersion: null,
      error: error.message,
    };
  }
}

/**
 * Get user statistics
 * Uses admin API if available, otherwise falls back to profiles table
 */
export async function getUserStats() {
  try {
    // Try to get stats from getAllUsers (which uses admin API)
    const usersResult = await getAllUsers(10000); // Get all users for stats
    
    if (usersResult.stats) {
      return {
        stats: usersResult.stats,
        error: null,
      };
    }

    // Fallback: calculate from users array
    if (usersResult.users && usersResult.users.length > 0) {
      const stats = {
        total: usersResult.users.length,
        free: 0,
        supporter: 0,
        family: 0,
        active: 0,
      };

      usersResult.users.forEach(user => {
        if (!user.plan || user.plan === 'free') {
          stats.free++;
        } else if (user.plan === 'supporter') {
          stats.supporter++;
        } else if (user.plan === 'family') {
          stats.family++;
        }

        if (user.subscription_status === 'active') {
          stats.active++;
        }
      });

      return {
        stats,
        error: null,
      };
    }

    // Final fallback: query profiles table directly
    const { data: profiles, error } = await supabase.from('profiles').select('plan, subscription_status');

    if (error) throw error;

    const stats = {
      total: profiles?.length || 0,
      free: 0,
      supporter: 0,
      family: 0,
      active: 0,
    };

    profiles?.forEach(profile => {
      if (!profile.plan || profile.plan === 'free') {
        stats.free++;
      } else if (profile.plan === 'supporter') {
        stats.supporter++;
      } else if (profile.plan === 'family') {
        stats.family++;
      }

      if (profile.subscription_status === 'active') {
        stats.active++;
      }
    });

    return {
      stats,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      stats: {
        total: 0,
        free: 0,
        supporter: 0,
        family: 0,
        active: 0,
      },
      error: error.message,
    };
  }
}

