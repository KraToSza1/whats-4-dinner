/**
 * Cooking Streaks System
 * Tracks consecutive days of recipe views/cooks
 */

const STREAK_STORAGE_KEY = 'cooking:streaks:v1';

/**
 * Get current streak count
 */
export function getCurrentStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    const lastDate = data.lastDate ? new Date(data.lastDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastDate) return data.streak || 0;

    const lastDateOnly = new Date(lastDate);
    lastDateOnly.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastDateOnly) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already counted today
      return data.streak || 0;
    } else if (diffDays === 1) {
      // Consecutive day - streak continues
      return (data.streak || 0) + 1;
    } else {
      // Streak broken - check if premium user can recover
      if (data.frozen && canUseStreakFreeze()) {
        // Streak was frozen, don't break it
        return data.streak || 0;
      }
      // Streak broken
      return 0;
    }
  } catch (error) {
    console.error('Error getting streak:', error);
    return 0;
  }
}

/**
 * Update streak when user views/cooks a recipe
 */
export function updateStreak() {
  try {
    const currentStreak = getCurrentStreak();
    const today = new Date();
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');

    const newStreak = currentStreak === 0 ? 1 : currentStreak;
    const longestStreak = Math.max(newStreak, data.longestStreak || 0);

    localStorage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        streak: newStreak,
        lastDate: today.toISOString(),
        longestStreak: longestStreak,
        frozen: false, // Reset freeze status
        totalDays: (data.totalDays || 0) + 1,
      })
    );

    return newStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return 0;
  }
}

/**
 * Get longest streak ever achieved
 */
export function getLongestStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    return data.longestStreak || 0;
  } catch {
    return 0;
  }
}

/**
 * Get total days with activity
 */
export function getTotalDays() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    return data.totalDays || 0;
  } catch {
    return 0;
  }
}

/**
 * Check if streak was updated today
 */
export function isStreakUpdatedToday() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    if (!data.lastDate) return false;

    const lastDate = new Date(data.lastDate);
    const today = new Date();

    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return lastDate.getTime() === today.getTime();
  } catch {
    return false;
  }
}

/**
 * Freeze streak (premium feature) - prevents streak from breaking
 */
export function freezeStreak() {
  if (!canUseStreakFreeze()) {
    return false;
  }

  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    const freezeData = JSON.parse(localStorage.getItem('streak:freezes:v1') || '{}');

    // Check if freeze already used this month
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

    if (freezeData[monthKey] >= 1) {
      return false; // Already used freeze this month
    }

    freezeData[monthKey] = (freezeData[monthKey] || 0) + 1;
    localStorage.setItem('streak:freezes:v1', JSON.stringify(freezeData));

    localStorage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        ...data,
        frozen: true,
      })
    );

    return true;
  } catch (error) {
    console.error('Error freezing streak:', error);
    return false;
  }
}

/**
 * Check if user can use streak freeze (premium feature)
 */
export function canUseStreakFreeze() {
  try {
    const { hasFeature } = require('./subscription');
    return hasFeature('streak_freeze');
  } catch {
    return false;
  }
}

/**
 * Get streak milestone rewards
 */
export function getStreakMilestone(streak) {
  const milestones = {
    3: { badge: 'streak_3', message: '3-day streak! Keep it up! 🔥' },
    7: { badge: 'streak_7', message: "7-day streak! You're on fire! 🔥🔥" },
    14: { badge: 'streak_14', message: '2-week streak! Incredible! 🔥🔥🔥' },
    30: { badge: 'streak_30', message: '30-day streak! Unstoppable! ⚡' },
    60: { badge: 'streak_60', message: '60-day streak! Legendary! 👑' },
    100: { badge: 'streak_100', message: '100-day streak! Master level! 🏆' },
  };

  return milestones[streak] || null;
}
