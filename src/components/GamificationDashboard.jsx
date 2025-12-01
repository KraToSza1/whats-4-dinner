import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Award } from 'lucide-react';
import StreakCounter from './StreakCounter';
import XPBar from './XPBar';
import DailyChallenge from './DailyChallenge';
import LevelUpModal from './LevelUpModal';
import BadgeUnlockModal from './BadgeUnlockModal';
import BadgeDisplay from './BadgeDisplay';
import { getCurrentLevel } from '../utils/xpSystem';
import { getUnlockedBadges } from '../utils/badges';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function GamificationDashboard() {
  const { t } = useLanguage();
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const updateStats = () => {
      const currentLevel = getCurrentLevel();
      if (currentLevel > level) {
        setNewLevel(currentLevel);
        setShowLevelUp(true);
        setLevel(currentLevel);
      } else {
        setLevel(currentLevel);
      }

      const unlocked = getUnlockedBadges();
      setBadges(unlocked);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [level]);

  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Streak & XP Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">{t('cookingStreak')}</h3>
              </div>
            </div>
            <StreakCounter size="large" showLongest={true} />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t('viewOrCookDaily')}
            </p>
          </motion.div>

          {/* XP & Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">{t('progress')}</h3>
              </div>
            </div>
            <XPBar size="default" showLevel={true} showTitle={true} />
          </motion.div>
        </div>

        {/* Daily Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DailyChallenge
            onComplete={_challenge => {
              // Challenge completion handled internally
              // This callback can be used for additional actions if needed
            }}
          />
        </motion.div>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                {t('recentBadges', 'Recent Badges')}
              </h3>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {badges
                .slice(-5)
                .reverse()
                .map(badgeId => (
                  <div key={badgeId} className="flex-shrink-0">
                    <BadgeDisplay badgeId={badgeId} size="small" />
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Level Up Modal */}
      {showLevelUp && newLevel && (
        <LevelUpModal
          level={newLevel}
          open={showLevelUp}
          onClose={() => {
            setShowLevelUp(false);
            setNewLevel(null);
          }}
        />
      )}

      {/* Badge Unlock Modal */}
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
