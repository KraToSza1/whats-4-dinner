import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Crown, Trophy } from 'lucide-react';
import {
  getCurrentStreak,
  getLongestStreak,
  isStreakUpdatedToday,
  getStreakMilestone,
} from '../utils/streaks';

export default function StreakCounter({ size = 'default', showLongest = false }) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [updatedToday, setUpdatedToday] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const [previousStreak, setPreviousStreak] = useState(0);

  useEffect(() => {
    const updateStreak = () => {
      const currentStreak = getCurrentStreak();
      const newMilestone = getStreakMilestone(currentStreak);

      // Check if we hit a milestone
      if (currentStreak > previousStreak && newMilestone) {
        setMilestone(newMilestone);
        setShowMilestone(true);
        setTimeout(() => setShowMilestone(false), 3000);
      }

      setPreviousStreak(currentStreak);
      setStreak(currentStreak);
      setLongestStreak(getLongestStreak());
      setUpdatedToday(isStreakUpdatedToday());
    };

    updateStreak();
    const interval = setInterval(updateStreak, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [previousStreak]);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  // Get streak intensity based on days
  const getStreakIntensity = () => {
    if (streak >= 100)
      return {
        emoji: '👑',
        gradient: 'from-yellow-400 via-orange-500 to-red-600',
        glow: 'shadow-2xl shadow-yellow-500/50',
      };
    if (streak >= 60)
      return {
        emoji: '⚡',
        gradient: 'from-purple-500 via-pink-500 to-red-500',
        glow: 'shadow-xl shadow-purple-500/50',
      };
    if (streak >= 30)
      return {
        emoji: '🔥',
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        glow: 'shadow-lg shadow-orange-500/50',
      };
    if (streak >= 14)
      return {
        emoji: '🔥',
        gradient: 'from-orange-500 to-red-500',
        glow: 'shadow-md shadow-orange-500/30',
      };
    if (streak >= 7)
      return { emoji: '🔥', gradient: 'from-orange-400 to-red-500', glow: 'shadow-md' };
    if (streak >= 3) return { emoji: '🔥', gradient: 'from-orange-500 to-red-500', glow: '' };
    if (streak > 0) return { emoji: '🔥', gradient: 'from-orange-400 to-red-400', glow: '' };
    return { emoji: '❄️', gradient: 'from-slate-400 to-slate-500', glow: '' };
  };

  const intensity = getStreakIntensity();

  if (streak === 0 && !showLongest) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700"
      >
        <div className="text-4xl sm:text-5xl mb-2">❄️</div>
        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Start Your Streak!</h4>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          View or cook a recipe daily to build your streak!
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden rounded-xl p-4 sm:p-6 bg-gradient-to-br ${intensity.gradient} ${intensity.glow} border-2 ${
          streak >= 30
            ? 'border-yellow-400'
            : streak >= 7
              ? 'border-orange-400'
              : 'border-orange-300'
        }`}
      >
        {/* Animated background flames for high streaks */}
        {streak >= 7 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(Math.min(streak, 10))].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl opacity-20"
                style={{
                  left: `${(i * 10) % 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              >
                🔥
              </motion.div>
            ))}
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={updatedToday ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.6, repeat: streak > 0 ? Infinity : 0, repeatDelay: 2 }}
              >
                <Flame
                  className={`${size === 'large' ? 'w-8 h-8' : 'w-6 h-6'} text-white ${streak > 0 ? 'animate-pulse' : ''}`}
                />
              </motion.div>
              <h3 className="font-bold text-white text-lg sm:text-xl">Cooking Streak</h3>
            </div>
            {streak >= 30 && <Crown className="w-6 h-6 text-yellow-300 animate-bounce" />}
            {streak >= 60 && <Zap className="w-5 h-5 text-yellow-200 ml-1 animate-pulse" />}
          </div>

          <div className="text-center mb-3">
            <motion.div
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-lg">
                {streak}
              </span>
              <div className="flex flex-col items-start">
                <span className="text-lg sm:text-xl font-bold text-white/90">
                  day{streak !== 1 ? 's' : ''}
                </span>
                <span className="text-2xl sm:text-3xl">{intensity.emoji}</span>
              </div>
            </motion.div>
          </div>

          {showLongest && longestStreak > streak && (
            <div className="text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  Best: {longestStreak} days
                </span>
              </div>
            </div>
          )}

          {/* Milestone indicators */}
          <div className="mt-3 flex items-center justify-center gap-1 flex-wrap">
            {[3, 7, 14, 30, 60, 100].map(milestone => (
              <div
                key={milestone}
                className={`w-2 h-2 rounded-full ${
                  streak >= milestone
                    ? 'bg-yellow-300 shadow-lg shadow-yellow-300/50'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Motivational message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-3 text-xs sm:text-sm text-white/90 font-medium"
          >
            {streak >= 100
              ? '🏆 LEGENDARY! You are a cooking master!'
              : streak >= 60
                ? '⚡ Unstoppable! Keep the fire burning!'
                : streak >= 30
                  ? '🔥 Incredible! You are on fire!'
                  : streak >= 14
                    ? '🔥 Amazing! Two weeks strong!'
                    : streak >= 7
                      ? '🔥 Great! A full week!'
                      : streak >= 3
                        ? '🔥 Getting hot! Keep it up!'
                        : 'View or cook a recipe daily to maintain your streak!'}
          </motion.p>
        </div>
      </motion.div>

      {/* Milestone Celebration Modal */}
      <AnimatePresence>
        {showMilestone && milestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 sm:p-10 text-center shadow-2xl max-w-md w-full border-4 border-yellow-300"
            >
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                className="text-7xl sm:text-8xl mb-4"
              >
                {milestone.badge === 'streak_100'
                  ? '🏆'
                  : milestone.badge === 'streak_60'
                    ? '👑'
                    : '🔥'}
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 drop-shadow-lg">
                Milestone Reached!
              </h3>
              <p className="text-lg sm:text-xl font-bold text-white mb-4 drop-shadow">
                {milestone.message}
              </p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-4xl sm:text-5xl"
              >
                🎉
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
