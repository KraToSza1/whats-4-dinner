import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Trophy,
  Sparkles,
  Zap,
  Star,
  Crown,
  Calendar,
  Award,
} from 'lucide-react';
import {
  getDailyChallenges,
  getWeeklyChallenges,
  completeChallenge,
  getTodayChallengeProgress,
  getWeeklyChallengeProgress,
  getTotalChallengesCompleted,
} from '../utils/challenges';
import { addXP, getCurrentLevel } from '../utils/xpSystem';
import { checkBadges } from '../utils/badges';
import BadgeUnlockModal from './BadgeUnlockModal';

export default function DailyChallenge({ onComplete }) {
  const [challenges, setChallenges] = useState([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [weeklyProgress, setWeeklyProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [completingChallenge, setCompletingChallenge] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState(null);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'weekly'

  useEffect(() => {
    const loadChallenges = () => {
      const dailyChallenges = getDailyChallenges();
      const weeklyChallenges = getWeeklyChallenges();
      setChallenges(dailyChallenges);
      setWeeklyChallenges(weeklyChallenges);
      setProgress(getTodayChallengeProgress());
      setWeeklyProgress(getWeeklyChallengeProgress());
    };

    loadChallenges();
    const interval = setInterval(loadChallenges, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getUserStats = () => {
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

  // Challenge checking is handled externally when recipes are cooked/viewed
  // This component just displays the challenges

  const currentChallenges = activeTab === 'daily' ? challenges : weeklyChallenges;
  const currentProgress = activeTab === 'daily' ? progress : weeklyProgress;

  if (challenges.length === 0 && weeklyChallenges.length === 0) {
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
        {/* Background decoration for completed challenges */}
        {currentProgress.progress === 100 && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-red-500/10 pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={currentProgress.progress === 100 ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: currentProgress.progress === 100 ? Infinity : 0 }}
              >
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" />
              </motion.div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {activeTab === 'daily' ? 'Daily Challenges' : 'Weekly Challenges'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete challenges to earn XP!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'daily'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Calendar className="w-3 h-3 inline mr-1" />
                Daily
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Award className="w-3 h-3 inline mr-1" />
                Weekly
              </motion.button>
            </div>
          </div>

          {/* Progress Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="text-right">
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`text-lg sm:text-xl font-black ${
                    currentProgress.progress === 100
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {currentProgress.completed}/{currentProgress.total}
                </div>
                {currentProgress.progress === 100 && (
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
          {currentProgress.total > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${
                    currentProgress.progress === 100
                      ? 'from-yellow-400 via-orange-500 to-red-500'
                      : activeTab === 'weekly'
                        ? 'from-purple-400 to-pink-500'
                        : 'from-yellow-400 to-orange-500'
                  } relative overflow-hidden`}
                >
                  {currentProgress.progress > 50 && (
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  )}
                  {currentProgress.progress > 15 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-white drop-shadow-lg">
                        {Math.round(currentProgress.progress)}%
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>
              {currentProgress.progress === 100 && (
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

          {/* Challenges List */}
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence mode="wait">
              {currentChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: completingChallenge === challenge.id ? [1, 1.05, 1] : 1,
                  }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all relative overflow-hidden ${
                    challenge.completed
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-500 shadow-lg'
                      : activeTab === 'weekly'
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500'
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
                        {activeTab === 'weekly' && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                            WEEKLY
                          </span>
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
                              : activeTab === 'weekly'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}
                        >
                          <Sparkles
                            className={`w-4 h-4 ${
                              challenge.completed
                                ? 'text-white'
                                : activeTab === 'weekly'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                            }`}
                          />
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              challenge.completed
                                ? 'text-white'
                                : activeTab === 'weekly'
                                  ? 'text-purple-700 dark:text-purple-300'
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
                        {activeTab === 'weekly' && (
                          <div className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400">
                            <Crown className="w-3 h-3" />
                            <span className="font-semibold">2x XP</span>
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
            </AnimatePresence>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="text-slate-500 dark:text-slate-400">
                {activeTab === 'daily'
                  ? 'Challenges reset daily at midnight'
                  : 'Weekly challenges reset every Monday'}
              </div>
              {currentProgress.total > 0 && (
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {currentProgress.total - currentProgress.completed} remaining
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
