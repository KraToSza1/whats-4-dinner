import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Award, Gamepad2 } from 'lucide-react';
import StreakCounter from './StreakCounter';
import XPBar from './XPBar';
import DailyChallenge from './DailyChallenge';
import LevelUpModal from './LevelUpModal';
import BadgeUnlockModal from './BadgeUnlockModal';
import BadgeDisplay from './BadgeDisplay';
import { getCurrentLevel } from '../utils/xpSystem';
import { getUnlockedBadges } from '../utils/badges';
import { useLanguage } from '../context/LanguageContext.jsx';
import MiniGamePrompt from './MiniGamePrompt.jsx';

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

        {/* Mini-Games Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl p-4 border-2 border-white/20 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">🎮 Mini-Games</h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.dispatchEvent(new CustomEvent('openMiniGames'))}
              className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm touch-manipulation min-h-[44px]"
            >
              <span>Play Now</span>
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-white/90 text-sm mb-3">
            Play fun cooking games while you wait! Earn bonus XP and keep your streak going.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">
              🎯 Trivia
            </span>
            <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">
              🧠 Memory
            </span>
            <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">
              ⏱️ Timer Challenge
            </span>
            <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">
              👆 Tap the Food
            </span>
          </div>
        </motion.div>

        {/* Mini-Game Prompt (subtle) */}
        <MiniGamePrompt variant="inline" context="dashboard" delay={5000} autoShow={true} />
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
