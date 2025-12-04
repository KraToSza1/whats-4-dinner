/**
 * Cooking Streaks System - ENHANCED
 * Tracks consecutive days of recipe views/cooks with recovery and bonuses
 */

const STREAK_STORAGE_KEY = 'cooking:streaks:v1';

/**
 * Get current streak count (ENHANCED with recovery grace period)
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
    } else if (diffDays === 2) {
      // Grace period - can recover streak if premium (check will be async)
      return data.streak || 0;
    } else {
      // Streak broken - check if premium user can recover
      if (data.frozen) {
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
 * Update streak when user views/cooks a recipe (ENHANCED with bonuses)
 */
export function updateStreak() {
  try {
    const currentStreak = getCurrentStreak();
    const today = new Date();
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    const lastDate = data.lastDate ? new Date(data.lastDate) : null;

    today.setHours(0, 0, 0, 0);
    const lastDateOnly = lastDate ? new Date(lastDate) : null;
    if (lastDateOnly) {
      lastDateOnly.setHours(0, 0, 0, 0);
    }

    let newStreak = currentStreak;
    let streakBonus = 0;

      // Check if this is a recovery (missed yesterday but within grace period)
      if (lastDateOnly) {
        const diffDays = Math.floor((today - lastDateOnly) / (1000 * 60 * 60 * 24));
        if (diffDays === 2) {
          // Recovery - streak continues but no increment (premium check handled elsewhere)
          newStreak = data.streak || 0;
          streakBonus = 0;
        } else if (diffDays === 1) {
        // Normal continuation - increment streak
        newStreak = (data.streak || 0) + 1;
        // Check for milestone bonuses
        streakBonus = getStreakBonus(newStreak);
      } else if (diffDays === 0) {
        // Already counted today
        return data.streak || 0;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      // First time - start streak
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, data.longestStreak || 0);

    localStorage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        streak: newStreak,
        lastDate: today.toISOString(),
        longestStreak: longestStreak,
        frozen: false, // Reset freeze status
        totalDays: (data.totalDays || 0) + 1,
        lastBonus: streakBonus,
        recoveryUsed: lastDateOnly && Math.floor((today - lastDateOnly) / (1000 * 60 * 60 * 24)) === 2,
      })
    );

    return { streak: newStreak, bonus: streakBonus };
  } catch (error) {
    console.error('Error updating streak:', error);
    return { streak: 0, bonus: 0 };
  }
}

/**
 * Get streak bonus XP based on milestone
 */
export function getStreakBonus(streak) {
  if (streak === 7) return 50; // Week milestone
  if (streak === 14) return 100; // Two weeks
  if (streak === 30) return 200; // Month milestone
  if (streak === 60) return 300; // Two months
  if (streak === 100) return 500; // Century!
  if (streak === 365) return 1000; // Year!
  
  // Weekly bonuses (every 7 days)
  if (streak > 0 && streak % 7 === 0) {
    return 25;
  }
  
  return 0;
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
 * Check if streak is at risk (missed yesterday)
 */
export function isStreakAtRisk() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    if (!data.lastDate) return false;

    const lastDate = new Date(data.lastDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays === 1; // Missed yesterday
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
 * Recover streak (premium feature) - restore broken streak
 */
export function recoverStreak() {
  if (!canUseStreakRecovery()) {
    return false;
  }

  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    const recoveryData = JSON.parse(localStorage.getItem('streak:recoveries:v1') || '{}');

    // Check if recovery already used this month
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

    if (recoveryData[monthKey] >= 1) {
      return false; // Already used recovery this month
    }

    recoveryData[monthKey] = (recoveryData[monthKey] || 0) + 1;
    localStorage.setItem('streak:recoveries:v1', JSON.stringify(recoveryData));

    // Restore streak
    const restoredStreak = data.longestStreak || data.streak || 0;
    localStorage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        ...data,
        streak: restoredStreak,
        lastDate: new Date().toISOString(),
        recoveryUsed: true,
      })
    );

    return true;
  } catch (error) {
    console.error('Error recovering streak:', error);
    return false;
  }
}

/**
 * Check if user can use streak freeze (premium feature)
 */
export function canUseStreakFreeze() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { hasFeature } = require('./subscription');
    return hasFeature('streak_freeze');
  } catch (error) {
    // If require fails, return false
    return false;
  }
}

/**
 * Check if user can use streak recovery (premium feature)
 */
export function canUseStreakRecovery() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { hasFeature } = require('./subscription');
    return hasFeature('streak_recovery');
  } catch (error) {
    // If require fails, return false
    return false;
  }
}

/**
 * Get streak milestone rewards (ENHANCED with more milestones)
 */
export function getStreakMilestone(streak) {
  const milestones = {
    1: { badge: null, message: 'Day 1! Your journey begins! 🌱', xp: 10 },
    3: { badge: 'streak_3', message: '3-day streak! Keep it up! 🔥', xp: 25 },
    5: { badge: null, message: '5 days strong! You\'re getting hot! 🔥', xp: 30 },
    7: { badge: 'streak_7', message: "7-day streak! You're on fire! 🔥🔥", xp: 50 },
    10: { badge: null, message: '10 days! Double digits! 🔥🔥', xp: 60 },
    14: { badge: 'streak_14', message: '2-week streak! Incredible! 🔥🔥🔥', xp: 100 },
    21: { badge: null, message: '3 weeks! You\'re unstoppable! ⚡', xp: 150 },
    30: { badge: 'streak_30', message: '30-day streak! Unstoppable! ⚡', xp: 200 },
    50: { badge: null, message: '50 days! Halfway to legendary! 👑', xp: 300 },
    60: { badge: 'streak_60', message: '60-day streak! Legendary! 👑', xp: 300 },
    90: { badge: null, message: '90 days! Three months strong! 🏆', xp: 400 },
    100: { badge: 'streak_100', message: '100-day streak! Master level! 🏆', xp: 500 },
    180: { badge: null, message: '180 days! Half a year! 🌟', xp: 600 },
    365: { badge: null, message: '365 days! A FULL YEAR! 🎉🎊🎉', xp: 1000 },
  };

  return milestones[streak] || null;
}

/**
 * Get next milestone
 */
export function getNextStreakMilestone(currentStreak) {
  const milestones = [1, 3, 5, 7, 10, 14, 21, 30, 50, 60, 90, 100, 180, 365];
  return milestones.find(m => m > currentStreak) || null;
}

/**
 * Get streak statistics
 */
export function getStreakStats() {
  try {
    JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}'); // Load data for consistency
    const currentStreak = getCurrentStreak();
    const longestStreak = getLongestStreak();
    const totalDays = getTotalDays();
    const nextMilestone = getNextStreakMilestone(currentStreak);
    const daysUntilMilestone = nextMilestone ? nextMilestone - currentStreak : null;

    return {
      currentStreak,
      longestStreak,
      totalDays,
      nextMilestone,
      daysUntilMilestone,
      isAtRisk: isStreakAtRisk(),
      updatedToday: isStreakUpdatedToday(),
      canFreeze: canUseStreakFreeze(),
      canRecover: canUseStreakRecovery(),
    };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      nextMilestone: null,
      daysUntilMilestone: null,
      isAtRisk: false,
      updatedToday: false,
      canFreeze: false,
      canRecover: false,
    };
  }
}
