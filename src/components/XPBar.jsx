import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import {
  getCurrentXP,
  getCurrentLevel,
  getLevelProgress,
  getXPForNextLevel,
  getLevelTitle,
  getLevelBadge,
  getLevelColor,
} from '../utils/xpSystem';

export default function XPBar({ size = 'default', showLevel = true, showTitle = false }) {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [xpForNext, setXPForNext] = useState(0);

  useEffect(() => {
    const updateXP = () => {
      const currentXP = getCurrentXP();
      const currentLevel = getCurrentLevel();
      const currentProgress = getLevelProgress(currentXP);
      const nextLevelXP = getXPForNextLevel(currentXP);

      setXP(currentXP);
      setLevel(currentLevel);
      setProgress(currentProgress);
      setXPForNext(nextLevelXP);
    };

    updateXP();
    const interval = setInterval(updateXP, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    small: 'h-2 text-xs',
    default: 'h-3 text-sm',
    large: 'h-4 text-base',
  };

  const xpNeeded = xpForNext - xp;

  return (
    <div className="w-full">
      {showLevel && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${getLevelColor(level)}`}>{getLevelBadge(level)}</span>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Level {level}</div>
              {showTitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {getLevelTitle(level)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <Sparkles className="w-3 h-3" />
            <span>{xp.toLocaleString()} XP</span>
          </div>
        </div>
      )}

      <div
        className={`relative ${sizeClasses[size]} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
        />
        {progress > 10 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white drop-shadow">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {xpNeeded > 0 && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-center">
          {xpNeeded.toLocaleString()} XP to next level
        </div>
      )}
    </div>
  );
}
