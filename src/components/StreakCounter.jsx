import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getCurrentStreak, getLongestStreak, isStreakUpdatedToday } from '../utils/streaks';
import { useToast } from './Toast';

export default function StreakCounter({ size = 'default', showLongest = false }) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [updatedToday, setUpdatedToday] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const updateStreak = () => {
      setStreak(getCurrentStreak());
      setLongestStreak(getLongestStreak());
      setUpdatedToday(isStreakUpdatedToday());
    };

    updateStreak();
    const interval = setInterval(updateStreak, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  if (streak === 0 && !showLongest) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 ${sizeClasses[size]} bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white shadow-lg`}
    >
      <motion.div
        animate={updatedToday ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: streak > 0 ? Infinity : 0, repeatDelay: 2 }}
      >
        <Flame className={`${iconSizes[size]} ${streak > 0 ? 'animate-pulse' : ''}`} />
      </motion.div>
      <div className="flex flex-col">
        <span className="font-bold leading-tight">{streak}</span>
        <span className="text-xs opacity-90 leading-tight">day{streak !== 1 ? 's' : ''}</span>
      </div>
      {showLongest && longestStreak > streak && (
        <div className="ml-1 text-xs opacity-75 border-l border-white/30 pl-2">
          Best: {longestStreak}
        </div>
      )}
    </motion.div>
  );
}
