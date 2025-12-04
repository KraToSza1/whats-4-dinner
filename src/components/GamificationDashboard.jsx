import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  Award,
  TrendingUp,
  Target,
  Zap,
  Crown,
  Trophy,
  Calendar,
  BarChart3,
  Star,
} from 'lucide-react';
import StreakCounter from './StreakCounter';
import XPBar from './XPBar';
import DailyChallenge from './DailyChallenge';
import LevelUpModal from './LevelUpModal';
import BadgeUnlockModal from './BadgeUnlockModal';
import BadgeDisplay from './BadgeDisplay';
import { getCurrentLevel, getCurrentXP, getTodayXP, getXPHistory } from '../utils/xpSystem';
import { getUnlockedBadges } from '../utils/badges';
import { getStreakStats, getNextStreakMilestone } from '../utils/streaks';
import { getTotalChallengesCompleted } from '../utils/challenges';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function GamificationDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [todayXP, setTodayXP] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [badges, setBadges] = useState([]);
  const [streakStats, setStreakStats] = useState(null);
  const [challengesCompleted, setChallengesCompleted] = useState(0);
  const [xpHistory, setXpHistory] = useState([]);

  useEffect(() => {
    const updateStats = () => {
      const currentLevel = getCurrentLevel();
      const currentXP = getCurrentXP();
      const todayXPValue = getTodayXP();
      const streakData = getStreakStats();

      if (currentLevel > level) {
        setNewLevel(currentLevel);
        setShowLevelUp(true);
        setLevel(currentLevel);
      } else {
        setLevel(currentLevel);
      }

      setXp(currentXP);
      setTodayXP(todayXPValue);
      setStreakStats(streakData);
      setChallengesCompleted(getTotalChallengesCompleted());

      const unlocked = getUnlockedBadges();
      setBadges(unlocked);

      const history = getXPHistory(10);
      setXpHistory(history);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [level]);

  const statsCards = [
    {
      title: 'Today\'s XP',
      value: todayXP,
      icon: Sparkles,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Challenges',
      value: challengesCompleted,
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Badges',
      value: badges.length,
      icon: Award,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
  ];

  return (
    <>
      <div className="space-y-6 mb-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Trophy className="w-8 h-8 text-yellow-500" />
              </motion.div>
              Your Progress
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Level up, complete challenges, and build your streak!
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile?tab=progress')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View Detailed Stats
          </motion.button>
        </motion.div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`
                  relative overflow-hidden rounded-2xl p-6 border-2 shadow-lg
                  ${card.bgColor} ${card.borderColor}
                `}
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-2xl`}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Streak & XP Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enhanced Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                  {t('cookingStreak')}
                </h3>
              </div>
              {streakStats?.nextMilestone && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Next milestone</p>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {streakStats.daysUntilMilestone} days
                  </p>
                </div>
              )}
            </div>
            <StreakCounter size="large" showLongest={true} />
            {streakStats && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Longest Streak</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {streakStats.longestStreak} days
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Total Days</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {streakStats.totalDays} days
                    </p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              {t('viewOrCookDaily')}
            </p>
          </motion.div>

          {/* Enhanced XP & Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                  {t('progress')}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total XP</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {xp.toLocaleString()}
                </p>
              </div>
            </div>
            <XPBar size="default" showLevel={true} showTitle={true} />
            {xpHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Recent XP Gains
                </p>
                <div className="space-y-1">
                  {xpHistory.slice(0, 3).map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {entry.reason || 'XP earned'}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{entry.amount}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Daily Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DailyChallenge
            onComplete={_challenge => {
              // Challenge completion handled internally
            }}
          />
        </motion.div>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                  {t('recentBadges', 'Recent Badges')}
                </h3>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {badges.length} total
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {badges
                .slice(-8)
                .reverse()
                .map(badgeId => (
                  <motion.div
                    key={badgeId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    className="flex-shrink-0"
                  >
                    <BadgeDisplay badgeId={badgeId} size="medium" />
                  </motion.div>
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
