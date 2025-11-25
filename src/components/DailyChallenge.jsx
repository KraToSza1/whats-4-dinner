import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Trophy, Sparkles } from 'lucide-react';
import {
  getDailyChallenges,
  completeChallenge,
  getTodayChallengeProgress,
  getTotalChallengesCompleted,
} from '../utils/challenges';
import { addXP, getCurrentLevel } from '../utils/xpSystem';
import { checkBadges } from '../utils/badges';
import { useToast } from './Toast';
import BadgeUnlockModal from './BadgeUnlockModal';

export default function DailyChallenge({ onComplete }) {
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const toast = useToast();

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

        // Check for badge unlocks
        const stats = getUserStats();
        stats.challengesCompleted = getTotalChallengesCompleted();
        const newBadges = checkBadges(stats);

        if (newBadges.length > 0) {
          setUnlockedBadge(newBadges[0].id);
        }

        toast.success(`Challenge completed! +${challenge.xpReward} XP`);

        // Update local state
        setChallenges(prev =>
          prev.map(c => (c.id === challenge.id ? { ...c, completed: true } : c))
        );
        setProgress(getTodayChallengeProgress());

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
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold">Daily Challenges</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {progress.completed}/{progress.total} completed
          </div>
        </div>

        {/* Progress Bar */}
        {progress.total > 0 && (
          <div className="mb-4">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {challenges.map(challenge => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border-2 transition-all ${
                challenge.completed
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{challenge.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {challenge.name}
                    </h4>
                    {challenge.completed && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {challenge.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      +{challenge.xpReward} XP
                    </span>
                  </div>
                </div>
                {challenge.completed ? (
                  <div className="text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Circle className="w-6 h-6" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Challenges reset daily at midnight
        </div>
      </div>

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
