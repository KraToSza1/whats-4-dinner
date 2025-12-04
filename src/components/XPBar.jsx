import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Star, Trophy, Crown } from 'lucide-react';
import {
  getCurrentXP,
  getCurrentLevel,
  getLevelProgress,
  getXPForNextLevel,
  getLevelTitle,
  getLevelBadge,
  getLevelColor,
  getTodayXP,
} from '../utils/xpSystem';

export default function XPBar({ size = 'default', showLevel = true, showTitle = false }) {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [xpForNext, setXPForNext] = useState(0);
  const [todayXP, setTodayXP] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    const updateXP = () => {
      const currentXP = getCurrentXP();
      const currentLevel = getCurrentLevel();
      const currentProgress = getLevelProgress(currentXP);
      const nextLevelXP = getXPForNextLevel(currentXP);
      const todayXPAmount = getTodayXP();

      // Check for level up
      if (currentLevel > previousLevel) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 4000);
      }

      // Check for XP gain animation
      if (currentXP > xp) {
        setXpGained(currentXP - xp);
        setTimeout(() => setXpGained(0), 2000);
      }

      setPreviousLevel(currentLevel);
      setXP(currentXP);
      setLevel(currentLevel);
      setProgress(currentProgress);
      setXPForNext(nextLevelXP);
      setTodayXP(todayXPAmount);
    };

    updateXP();
    const interval = setInterval(updateXP, 1000); // Update every second
    return () => clearInterval(interval);
  }, [xp, previousLevel]);

  const sizeClasses = {
    small: 'h-2 text-xs',
    default: 'h-3 text-sm',
    large: 'h-4 text-base',
  };

  const xpNeeded = xpForNext - xp;

  // Get level gradient based on level
  const getLevelGradient = () => {
    if (level >= 50) return 'from-yellow-400 via-orange-500 to-red-600';
    if (level >= 30) return 'from-purple-500 via-pink-500 to-red-500';
    if (level >= 20) return 'from-blue-500 via-purple-500 to-pink-500';
    if (level >= 10) return 'from-emerald-500 via-teal-500 to-blue-500';
    return 'from-emerald-500 via-teal-500 to-emerald-600';
  };

  // Get level glow effect
  const getLevelGlow = () => {
    if (level >= 50) return 'shadow-2xl shadow-yellow-500/50';
    if (level >= 30) return 'shadow-xl shadow-purple-500/50';
    if (level >= 20) return 'shadow-lg shadow-blue-500/50';
    if (level >= 10) return 'shadow-md shadow-emerald-500/50';
    return '';
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-slate-800 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
        {showLevel && (
          <div className="flex items-center justify-between mb-3 xs:mb-4 gap-2">
            <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
              <motion.div
                animate={showLevelUp ? { scale: [1, 1.3, 1], rotate: [0, 360] } : {}}
                transition={{ duration: 0.6 }}
                className="relative shrink-0"
              >
                <span className={`text-2xl xs:text-3xl sm:text-4xl ${getLevelColor(level)}`}>
                  {getLevelBadge(level)}
                </span>
                {level >= 30 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-1.5 xs:-inset-2 bg-yellow-400/30 rounded-full blur-xl"
                  />
                )}
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                  <h3 className="font-black text-lg xs:text-xl sm:text-2xl text-slate-900 dark:text-white">
                    Level {level}
                  </h3>
                  {level >= 50 && (
                    <Crown className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-500 animate-bounce shrink-0" />
                  )}
                  {level >= 30 && level < 50 && (
                    <Trophy className="w-4 h-4 xs:w-5 xs:h-5 text-purple-500 animate-pulse shrink-0" />
                  )}
                </div>
                {showTitle && (
                  <div className="text-xs xs:text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {getLevelTitle(level)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-xs xs:text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-500 shrink-0" />
                <span className="whitespace-nowrap">{xp.toLocaleString()}</span>
                <span className="text-xs text-slate-500">XP</span>
              </div>
              {todayXP > 0 && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 shrink-0" />
                  <span className="whitespace-nowrap">+{todayXP} today</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* XP Progress Bar */}
        <div className="relative mb-2">
          <div
            className={`relative ${sizeClasses[size]} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${getLevelGlow()}`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getLevelGradient()} relative overflow-hidden`}
            >
              {/* Shimmer effect for high progress */}
              {progress > 50 && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              )}
            </motion.div>
            {progress > 15 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-white drop-shadow-lg">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* XP Needed & Milestones */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {xpNeeded > 0 ? (
            <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {xpNeeded.toLocaleString()} XP
              </span>{' '}
              <span className="whitespace-nowrap">to Level {level + 1}</span>
            </div>
          ) : (
            <div className="text-xs xs:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              🎉 Max Level Reached!
            </div>
          )}

          {/* Level milestones indicator */}
          <div className="flex items-center gap-0.5 xs:gap-1 shrink-0">
            {[5, 10, 20, 30, 50].map(milestone => (
              <div
                key={milestone}
                className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${
                  level >= milestone
                    ? level >= 50
                      ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                      : level >= 30
                        ? 'bg-purple-400 shadow-md shadow-purple-400/50'
                        : 'bg-emerald-400'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                title={`Level ${milestone}`}
              />
            ))}
          </div>
        </div>

        {/* XP Gained Animation */}
        <AnimatePresence>
          {xpGained > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              className="absolute right-4 top-4 pointer-events-none"
            >
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
                <Star className="w-3 h-3" />+{xpGained} XP
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 sm:p-10 text-center shadow-2xl max-w-md w-full border-4 border-yellow-300"
            >
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.3 }}
                className="text-7xl sm:text-8xl mb-4"
              >
                {getLevelBadge(level)}
              </motion.div>
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-lg">
                LEVEL UP!
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-white mb-4 drop-shadow">
                You reached Level {level}!
              </p>
              <p className="text-lg font-semibold text-white/90 mb-4">{getLevelTitle(level)}</p>
              <motion.div
                animate={{ scale: [1, 1.2, 1], y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-5xl sm:text-6xl"
              >
                🎉🎊✨
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
