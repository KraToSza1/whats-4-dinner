import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodConfetti } from './FoodParticles.jsx';
import { Trophy, Star, Heart, ChefHat, Flame, Target } from 'lucide-react';
import { SuccessCheckAnimation } from '../LottieFoodAnimations.jsx';

const ACHIEVEMENTS = {
  firstRecipe: {
    id: 'firstRecipe',
    title: 'First Recipe!',
    description: 'Viewed your first recipe',
    icon: '👀',
    color: 'blue',
  },
  firstFavorite: {
    id: 'firstFavorite',
    title: 'Recipe Collector',
    description: 'Added your first favorite',
    icon: '❤️',
    color: 'rose',
  },
  tenFavorites: {
    id: 'tenFavorites',
    title: 'Recipe Enthusiast',
    description: 'Added 10 favorites',
    icon: '⭐',
    color: 'amber',
  },
  firstMealPlan: {
    id: 'firstMealPlan',
    title: 'Meal Planner',
    description: 'Created your first meal plan',
    icon: '📅',
    color: 'emerald',
  },
  firstCook: {
    id: 'firstCook',
    title: 'Chef in Training',
    description: 'Completed your first recipe',
    icon: '👨‍🍳',
    color: 'purple',
  },
  tenCooked: {
    id: 'tenCooked',
    title: 'Master Chef',
    description: 'Cooked 10 recipes',
    icon: '🏆',
    color: 'yellow',
  },
  weekPlanner: {
    id: 'weekPlanner',
    title: 'Organized Chef',
    description: 'Planned a full week of meals',
    icon: '📆',
    color: 'teal',
  },
  calorieTracker: {
    id: 'calorieTracker',
    title: 'Health Conscious',
    description: 'Set up calorie tracking',
    icon: '🎯',
    color: 'green',
  },
};

/**
 * Achievement unlock notification
 */
export function AchievementUnlock({ achievement, onClose }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    rose: 'from-rose-500 to-pink-500',
    amber: 'from-amber-500 to-orange-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-indigo-500',
    yellow: 'from-yellow-400 to-amber-500',
    teal: 'from-teal-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -50 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4"
    >
      {showConfetti && <FoodConfetti trigger={1} />}
      <motion.div
        className={`relative bg-gradient-to-r ${colorClasses[achievement.color]} rounded-2xl p-6 shadow-2xl border-2 border-white/20 backdrop-blur-sm`}
        animate={{
          boxShadow: [
            '0 0 0px rgba(255,255,255,0)',
            '0 0 30px rgba(255,255,255,0.5)',
            '0 0 0px rgba(255,255,255,0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 2) * 80}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-5xl relative"
          >
            {achievement.icon}
            <motion.div
              className="absolute -top-2 -right-2"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <SuccessCheckAnimation size={30} />
            </motion.div>
          </motion.div>
          <div className="flex-1">
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-white mb-1"
            >
              Achievement Unlocked!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 font-semibold"
            >
              {achievement.title}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-sm mt-1"
            >
              {achievement.description}
            </motion.p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Achievement system hook
 */
export function useAchievements() {
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('achievements') || '[]'));
    } catch {
      return new Set();
    }
  });

  const [currentUnlock, setCurrentUnlock] = useState(null);

  const unlockAchievement = useCallback(achievementId => {
    if (!ACHIEVEMENTS[achievementId]) {
      return false;
    }

    // Use functional update to avoid dependency on unlockedAchievements
    let wasUnlocked = false;
    setUnlockedAchievements(prevUnlocked => {
      if (prevUnlocked.has(achievementId)) {
        return prevUnlocked; // Already unlocked
      }

      wasUnlocked = true;
      const newUnlocked = new Set(prevUnlocked);
      newUnlocked.add(achievementId);
      localStorage.setItem('achievements', JSON.stringify([...newUnlocked]));
      return newUnlocked;
    });

    // Only show notification if it was actually unlocked
    if (wasUnlocked) {
      setCurrentUnlock(ACHIEVEMENTS[achievementId]);

      // Auto-close after 5 seconds
      setTimeout(() => {
        setCurrentUnlock(null);
      }, 5000);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }

    return wasUnlocked;
  }, []); // No dependencies needed with functional update

  const checkAchievements = useCallback(
    (type, count) => {
      switch (type) {
        case 'recipe_view':
          if (count === 1) unlockAchievement('firstRecipe');
          break;
        case 'favorite':
          if (count === 1) unlockAchievement('firstFavorite');
          if (count === 10) unlockAchievement('tenFavorites');
          break;
        case 'meal_plan':
          if (count === 1) unlockAchievement('firstMealPlan');
          if (count >= 7) unlockAchievement('weekPlanner');
          break;
        case 'recipe_cooked':
          if (count === 1) unlockAchievement('firstCook');
          if (count === 10) unlockAchievement('tenCooked');
          break;
        case 'calorie_tracker':
          unlockAchievement('calorieTracker');
          break;
      }
    },
    [unlockAchievement]
  );

  return {
    unlockedAchievements,
    currentUnlock,
    unlockAchievement,
    checkAchievements,
    setCurrentUnlock,
  };
}

/**
 * Achievement display component
 */
export function AchievementDisplay({ unlockedAchievements }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.values(ACHIEVEMENTS).map(achievement => {
        const isUnlocked = unlockedAchievements.has(achievement.id);
        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border-2 transition-all ${
              isUnlocked
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-50'
            }`}
          >
            <div className="text-3xl mb-2 text-center">{achievement.icon}</div>
            <h4
              className={`font-semibold text-sm text-center ${
                isUnlocked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'
              }`}
            >
              {achievement.title}
            </h4>
            {!isUnlocked && <p className="text-xs text-slate-400 text-center mt-1">Locked</p>}
          </motion.div>
        );
      })}
    </div>
  );
}
