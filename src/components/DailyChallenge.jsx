import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trophy, Sparkles, Zap, Star, Crown } from 'lucide-react';
import {
  getDailyChallenges,
  completeChallenge,
  getTodayChallengeProgress,
  getTotalChallengesCompleted,
} from '../utils/challenges';
import { addXP, getCurrentLevel } from '../utils/xpSystem';
import { checkBadges } from '../utils/badges';
import BadgeUnlockModal from './BadgeUnlockModal';

export default function DailyChallenge({ onComplete }) {
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [completingChallenge, setCompletingChallenge] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState(null);

  useEffect(() => {
    const loadChallenges = () => {
      const dailyChallenges = getDailyChallenges();
      setChallenges(dailyChallenges);
      setProgress(getTodayChallengeProgress());
    };

    loadChallenges();
    const interval = setInterval(loadChallenges, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getUserStats = () => {
    // Get user stats for badge checking
    const recipesCooked = parseInt(localStorage.getItem('stats:recipesCooked:v1') || '0');
    const streakData = JSON.parse(localStorage.getItem('cooking:streaks:v1') || '{}');
    const currentStreak = streakData.streak || 0;
    const level = getCurrentLevel();

    return {
      recipesCooked,
      currentStreak,
      level,
      challengesCompleted: getTotalChallengesCompleted(),
      cuisinesTried: JSON.parse(localStorage.getItem('stats:cuisinesTried:v1') || '[]'),
      fastRecipesCooked: parseInt(localStorage.getItem('stats:fastRecipesCooked:v1') || '0'),
      mealsPrepped: parseInt(localStorage.getItem('stats:mealsPrepped:v1') || '0'),
    };
  };

  // eslint-disable-next-line no-unused-vars
  const handleChallengeCheck = (challenge, recipe = null, mealPlan = null) => {
    let completed = false;

    if (challenge.id === 'meal_prep') {
      completed = challenge.check(mealPlan);
    } else if (recipe) {
      // For recipe-based challenges
      const userStats = getUserStats();
      completed = challenge.check(recipe, userStats);
    }

    if (completed && !challenge.completed) {
      // Complete the challenge
      if (completeChallenge(challenge.id)) {
        // Award XP
        addXP(challenge.xpReward, `Completed challenge: ${challenge.name}`);

        // Show completion animation
        setCompletingChallenge(challenge.id);
        setCompletedChallenge(challenge);
        setShowCompletion(true);

        // Check for badge unlocks
        const stats = getUserStats();
        stats.challengesCompleted = getTotalChallengesCompleted();
        const newBadges = checkBadges(stats);

        if (newBadges.length > 0) {
          setTimeout(() => {
            setUnlockedBadge(newBadges[0].id);
          }, 2000);
        }

        // Update local state
        setChallenges(prev =>
          prev.map(c => (c.id === challenge.id ? { ...c, completed: true } : c))
        );
        setProgress(getTodayChallengeProgress());

        // Hide completion animation after 2 seconds
        setTimeout(() => {
          setShowCompletion(false);
          setCompletingChallenge(null);
          setCompletedChallenge(null);
        }, 2500);

        if (onComplete) {
          onComplete(challenge);
        }
      }
    }
  };

  if (challenges.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700">
        <div className="text-center text-slate-500 dark:text-slate-400">
          No challenges available today
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
        {/* Background decoration for completed challenges */}
        {progress.progress === 100 && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-red-500/10 pointer-events-none" />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={progress.progress === 100 ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: progress.progress === 100 ? Infinity : 0 }}
              >
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" />
              </motion.div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Daily Challenges
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete challenges to earn XP!
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`text-lg sm:text-xl font-black ${
                    progress.progress === 100
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {progress.completed}/{progress.total}
                </div>
                {progress.progress === 100 && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-xl sm:text-2xl"
                  >
                    🎉
                  </motion.div>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">completed</div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          {progress.total > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${
                    progress.progress === 100
                      ? 'from-yellow-400 via-orange-500 to-red-500'
                      : 'from-yellow-400 to-orange-500'
                  } relative overflow-hidden`}
                >
                  {progress.progress > 50 && (
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  )}
                  {progress.progress > 15 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-white drop-shadow-lg">
                        {Math.round(progress.progress)}%
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>
              {progress.progress === 100 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-2 text-sm font-bold text-yellow-600 dark:text-yellow-400"
                >
                  🎊 All challenges completed! Amazing work! 🎊
                </motion.p>
              )}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: completingChallenge === challenge.id ? [1, 1.05, 1] : 1,
                }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 sm:p-5 rounded-xl border-2 transition-all relative overflow-hidden ${
                  challenge.completed
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-500 shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                {/* Completion glow effect */}
                {challenge.completed && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 pointer-events-none"
                  />
                )}

                <div className="relative z-10 flex items-start gap-3 sm:gap-4">
                  <motion.div
                    animate={
                      challenge.completed ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}
                    }
                    transition={{
                      duration: 0.6,
                      repeat: challenge.completed ? Infinity : 0,
                      repeatDelay: 2,
                    }}
                    className="text-3xl sm:text-4xl flex-shrink-0"
                  >
                    {challenge.emoji}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4
                        className={`font-bold text-base sm:text-lg ${
                          challenge.completed
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {challenge.name}
                      </h4>
                      {challenge.completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                        >
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                          challenge.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        <Sparkles
                          className={`w-4 h-4 ${challenge.completed ? 'text-white' : 'text-yellow-600 dark:text-yellow-400'}`}
                        />
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            challenge.completed
                              ? 'text-white'
                              : 'text-yellow-700 dark:text-yellow-300'
                          }`}
                        >
                          +{challenge.xpReward} XP
                        </span>
                      </div>
                      {challenge.xpReward >= 75 && (
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                          <Star className="w-3 h-3" />
                          <span className="font-semibold">Bonus</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {challenge.completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-emerald-500"
                      >
                        <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                      </motion.div>
                    ) : (
                      <div className="text-slate-400">
                        <Circle className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="text-slate-500 dark:text-slate-400">
                Challenges reset daily at midnight
              </div>
              {progress.total > 0 && (
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {progress.total - progress.completed} remaining
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Completion Celebration */}
      <AnimatePresence>
        {showCompletion && completedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-center shadow-2xl max-w-sm w-full border-4 border-emerald-300 pointer-events-auto"
            >
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.3 }}
                className="text-6xl sm:text-7xl mb-4"
              >
                {completedChallenge.emoji}
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 drop-shadow-lg">
                Challenge Complete! 🎉
              </h3>
              <p className="text-lg sm:text-xl font-bold text-white mb-4 drop-shadow">
                {completedChallenge.name}
              </p>
              <motion.div
                animate={{ scale: [1, 1.2, 1], y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black text-yellow-300 mb-4"
              >
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                <span>+{completedChallenge.xpReward} XP</span>
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-4xl sm:text-5xl"
              >
                ✨🎊✨
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {unlockedBadge && (
        <BadgeUnlockModal
          badgeId={unlockedBadge}
          open={!!unlockedBadge}
          onClose={() => setUnlockedBadge(null)}
        />
      )}
    </>
  );
}
