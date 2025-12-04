/**
 * Feature Usage Tracking System
 * Tracks which users are using which features for admin analytics
 */

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const FEATURE_TRACKING_KEY = 'feature:tracking:v1';
const FEATURE_USAGE_KEY = 'feature:usage:v1';

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName, metadata = {}) {
  try {
    const user = JSON.parse(localStorage.getItem('auth:user') || 'null');
    const userId = user?.id || 'anonymous';
    const email = user?.email || 'anonymous';
    
    const usage = {
      feature: featureName,
      userId,
      email,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Store locally
    const localUsage = JSON.parse(localStorage.getItem(FEATURE_USAGE_KEY) || '[]');
    localUsage.push(usage);
    
    // Keep only last 1000 entries
    if (localUsage.length > 1000) {
      localUsage.shift();
    }
    
    localStorage.setItem(FEATURE_USAGE_KEY, JSON.stringify(localUsage));

    // Try to sync to Supabase (async, don't wait)
    syncToSupabase(usage).catch(err => {
      if (import.meta.env.DEV) {
        console.warn('Failed to sync feature usage to Supabase:', err);
      }
    });

    // Track daily feature usage count
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `feature:daily:${today}`;
    const dailyUsage = JSON.parse(localStorage.getItem(dailyKey) || '{}');
    dailyUsage[featureName] = (dailyUsage[featureName] || 0) + 1;
    localStorage.setItem(dailyKey, JSON.stringify(dailyUsage));

    return true;
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return false;
  }
}

/**
 * Sync usage to Supabase
 */
async function syncToSupabase(usage) {
  try {
    const { error } = await supabase.from('feature_usage').insert({
      feature_name: usage.feature,
      user_id: usage.userId === 'anonymous' ? null : usage.userId,
      user_email: usage.email === 'anonymous' ? null : usage.email,
      metadata: usage.metadata,
      created_at: usage.timestamp,
    });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist, which is fine
      throw error;
    }
  } catch (error) {
    // Silently fail - we have localStorage backup
    if (import.meta.env.DEV) {
      console.warn('Supabase sync failed:', error);
    }
  }
}

/**
 * Get feature usage statistics
 */
export function getFeatureUsageStats(days = 30) {
  try {
    const usage = JSON.parse(localStorage.getItem(FEATURE_USAGE_KEY) || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentUsage = usage.filter(u => new Date(u.timestamp) >= cutoffDate);
    
    // Group by feature
    const featureCounts = {};
    const userFeatures = {}; // Track which users use which features
    const featureUsers = {}; // Track which features are used by which users
    
    recentUsage.forEach(u => {
      // Count features
      featureCounts[u.feature] = (featureCounts[u.feature] || 0) + 1;
      
      // Track user-feature relationships
      if (u.userId !== 'anonymous') {
        if (!userFeatures[u.userId]) {
          userFeatures[u.userId] = {
            email: u.email,
            features: new Set(),
            lastActive: u.timestamp,
          };
        }
        userFeatures[u.userId].features.add(u.feature);
        if (new Date(u.timestamp) > new Date(userFeatures[u.userId].lastActive)) {
          userFeatures[u.userId].lastActive = u.timestamp;
        }
        
        // Track feature-user relationships
        if (!featureUsers[u.feature]) {
          featureUsers[u.feature] = new Set();
        }
        featureUsers[u.feature].add(u.userId);
      }
    });

    // Convert Sets to Arrays/Counts
    const userFeaturesArray = Object.entries(userFeatures).map(([userId, data]) => ({
      userId,
      email: data.email,
      features: Array.from(data.features),
      featureCount: data.features.size,
      lastActive: data.lastActive,
    }));

    const featureUsersCount = Object.entries(featureUsers).map(([feature, users]) => ({
      feature,
      userCount: users.size,
      users: Array.from(users),
    }));

    return {
      totalUsage: recentUsage.length,
      featureCounts,
      userFeatures: userFeaturesArray,
      featureUsers: featureUsersCount,
      uniqueUsers: Object.keys(userFeatures).length,
      dateRange: {
        start: cutoffDate.toISOString(),
        end: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error getting feature usage stats:', error);
    return {
      totalUsage: 0,
      featureCounts: {},
      userFeatures: [],
      featureUsers: [],
      uniqueUsers: 0,
      dateRange: { start: null, end: null },
    };
  }
}

/**
 * Get daily feature usage
 */
export function getDailyFeatureUsage(days = 7) {
  try {
    const dailyData = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dailyKey = `feature:daily:${dateStr}`;
      const dailyUsage = JSON.parse(localStorage.getItem(dailyKey) || '{}');
      
      dailyData.push({
        date: dateStr,
        usage: dailyUsage,
        total: Object.values(dailyUsage).reduce((sum, count) => sum + count, 0),
      });
    }
    
    return dailyData;
  } catch (error) {
    console.error('Error getting daily feature usage:', error);
    return [];
  }
}

/**
 * Get feature usage from Supabase (for admin)
 */
export async function getFeatureUsageFromSupabase(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('feature_usage')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Error fetching from Supabase:', error);
    }
    // Fallback to localStorage
    return getFeatureUsageStats(days);
  }
}

/**
 * Feature names constants
 */
export const FEATURES = {
  CALORIE_TRACKER: 'calorie_tracker',
  MEAL_PLANNER: 'meal_planner',
  GROCERY_LIST: 'grocery_list',
  RECIPE_SEARCH: 'recipe_search',
  RECIPE_COOK: 'recipe_cook',
  RECIPE_FAVORITE: 'recipe_favorite',
  RECIPE_SHARE: 'recipe_share',
  BUDGET_TRACKER: 'budget_tracker',
  WATER_TRACKER: 'water_tracker',
  PANTRY: 'pantry',
  ANALYTICS: 'analytics',
  CHALLENGES: 'challenges',
  STREAKS: 'streaks',
  BADGES: 'badges',
  XP_SYSTEM: 'xp_system',
  DIETICIAN_AI: 'dietician_ai',
  COLLECTIONS: 'collections',
  MEAL_REMINDERS: 'meal_reminders',
};

