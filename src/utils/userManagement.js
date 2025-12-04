/**
 * User Management Utilities
 * Functions for managing users in admin dashboard
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Get all users with their profile data
 */
export async function getAllUsers(limit = 100, offset = 0) {
  try {
    // Get profiles with user data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get user auth data if available (requires admin privileges)
    // Note: This might not work without service role key
    let usersWithAuth = profiles || [];

    return {
      users: usersWithAuth,
      total: usersWithAuth.length,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
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
 * Get user statistics
 */
export async function getUserStats() {
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('plan');

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

