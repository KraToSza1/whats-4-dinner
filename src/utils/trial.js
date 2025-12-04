/**
 * Free Trial Management Utilities
 * Handles 30-day free trial for new users
 */

import { supabase } from '../lib/supabaseClient';

const TRIAL_DURATION_DAYS = 30;

/**
 * Check if a user's trial is currently active
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if trial is active
 */
export async function isTrialActive(userId) {
  if (!userId) return false;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('trial_start_date, trial_ended')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) return false;

    // If trial was manually ended, return false
    if (profile.trial_ended) return false;

    // If no trial start date, no trial
    if (!profile.trial_start_date) return false;

    // Calculate days since trial started
    const trialStart = new Date(profile.trial_start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));

    // Trial is active if less than TRIAL_DURATION_DAYS days have passed
    return daysSinceStart < TRIAL_DURATION_DAYS;
  } catch (error) {
    console.error('[Trial] Error checking trial status:', error);
    return false;
  }
}

/**
 * Get the number of days remaining in the trial
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Days remaining (0 if expired or no trial)
 */
export async function getTrialDaysRemaining(userId) {
  if (!userId) return 0;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('trial_start_date, trial_ended')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile || !profile.trial_start_date || profile.trial_ended) {
      return 0;
    }

    const trialStart = new Date(profile.trial_start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = TRIAL_DURATION_DAYS - daysSinceStart;

    return Math.max(0, daysRemaining);
  } catch (error) {
    console.error('[Trial] Error getting trial days remaining:', error);
    return 0;
  }
}

/**
 * Start a free trial for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if trial started successfully
 */
export async function startTrial(userId) {
  if (!userId) return false;

  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        trial_start_date: new Date().toISOString(),
        trial_ended: false,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('[Trial] Error starting trial:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Trial] Error starting trial:', error);
    return false;
  }
}

/**
 * Get the effective plan considering trial status
 * Returns 'trial' if trial is active, otherwise returns actual plan
 * @param {string} userId - User ID
 * @param {string} actualPlan - The user's actual plan from subscription
 * @returns {Promise<string>} - Effective plan ('trial', 'free', 'supporter', etc.)
 */
export async function getEffectivePlan(userId, actualPlan) {
  if (!userId) return actualPlan || 'free';

  const trialActive = await isTrialActive(userId);
  if (trialActive) {
    return 'trial'; // Special plan type for trial users
  }

  return actualPlan || 'free';
}

/**
 * Check if trial has expired
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if trial has expired
 */
export async function isTrialExpired(userId) {
  if (!userId) return false;

  const daysRemaining = await getTrialDaysRemaining(userId);
  return daysRemaining === 0;
}

/**
 * End trial manually (for admin or user cancellation)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if trial ended successfully
 */
export async function endTrial(userId) {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ trial_ended: true })
      .eq('id', userId);

    if (error) {
      console.error('[Trial] Error ending trial:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Trial] Error ending trial:', error);
    return false;
  }
}
