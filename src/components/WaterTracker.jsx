import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Droplets, Target, Calendar } from 'lucide-react';
import { useToast } from './Toast.jsx';

const STORAGE_KEY = 'water:tracker:v1';
const DEFAULT_GOAL = 2000; // ml (2 liters)

export default function WaterTracker() {
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_GOAL);
  const [todayIntake, setTodayIntake] = useState(0);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState(false);
  const toast = useToast();

  const saveData = useCallback(() => {
    try {
      // Check if localStorage is available and secure
      if (typeof Storage === 'undefined' || !window.localStorage) {
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          goal: dailyGoal,
          today: todayIntake,
          history,
          reminders,
        })
      );
    } catch (error) {
      // Handle localStorage errors gracefully (e.g., "operation is insecure")
      console.warn('[WaterTracker] Could not save data:', error);
      // Ignore errors - data just won't persist
    }
  }, [dailyGoal, todayIntake, history, reminders]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [saveData]);

  const loadData = () => {
    try {
      // Check if localStorage is available and secure
      if (typeof Storage === 'undefined' || !window.localStorage) {
        throw new Error('localStorage not available');
      }

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setDailyGoal(saved.goal || DEFAULT_GOAL);
      setTodayIntake(saved.today || 0);
      setHistory(saved.history || []);
      setReminders(saved.reminders || false);
    } catch (error) {
      // Handle localStorage errors gracefully (e.g., "operation is insecure")
      console.warn('[WaterTracker] Could not load data:', error);
      // Use defaults
    }
  };

  const addWater = amount => {
    const newIntake = todayIntake + amount;
    setTodayIntake(newIntake);

    // Add to history
    const today = new Date().toISOString().split('T')[0];
    const todayHistory = history.find(h => h.date === today);
    if (todayHistory) {
      setHistory(history.map(h => (h.date === today ? { ...h, intake: newIntake } : h)));
    } else {
      setHistory([...history, { date: today, intake: newIntake }]);
    }

    toast.success(`Added ${amount}ml! 💧`);

    // Check if goal reached
    if (newIntake >= dailyGoal && todayIntake < dailyGoal) {
      toast.success('🎉 Daily goal reached! Great job!');
    }
  };

  const resetToday = () => {
    if (confirm("Reset today's water intake?")) {
      setTodayIntake(0);
      const today = new Date().toISOString().split('T')[0];
      setHistory(history.map(h => (h.date === today ? { ...h, intake: 0 } : h)));
      toast.success('Reset for today!');
    }
  };

  const percentage = Math.min((todayIntake / dailyGoal) * 100, 100);
  const remaining = Math.max(dailyGoal - todayIntake, 0);

  // Setup reminders
  const setupReminders = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in your browser');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setReminders(true);
      toast.success('Water reminders enabled! 💧');

      // Schedule reminders (every 2 hours)
      if ('serviceWorker' in navigator) {
        // Could use service worker for background reminders
      }
    } else {
      toast.error('Notification permission denied');
    }
  };

  const quickAmounts = [250, 500, 750, 1000];

  return (
    <div className="space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <Droplets className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
            Water Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Stay hydrated! Track your daily water intake
          </p>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Today's Intake
            </div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {todayIntake}ml
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Goal</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dailyGoal}ml</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-6 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-end pr-2"
            >
              {percentage >= 10 && (
                <span className="text-xs font-bold text-white">{Math.round(percentage)}%</span>
              )}
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-600 dark:text-blue-400">
            {remaining > 0 ? `${remaining}ml remaining` : 'Goal reached! 🎉'}
          </span>
          <button
            onClick={resetToday}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-500" />
          Quick Add
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickAmounts.map(amount => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addWater(amount)}
              className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 transition-colors"
            >
              <div className="text-2xl mb-1">💧</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">{amount}ml</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4">Custom Amount</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Enter ml"
            min="0"
            max="5000"
            className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const amount = parseInt(e.target.value);
                if (amount > 0) {
                  addWater(amount);
                  e.target.value = '';
                }
              }
            }}
          />
          <button
            onClick={e => {
              const input = e.target.previousElementSibling;
              const amount = parseInt(input.value);
              if (amount > 0) {
                addWater(amount);
                input.value = '';
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Daily Goal (ml)</label>
            <input
              type="number"
              value={dailyGoal}
              onChange={e => setDailyGoal(Math.max(0, parseInt(e.target.value) || DEFAULT_GOAL))}
              min="500"
              max="5000"
              step="100"
              className="w-full px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Recommended: 2000ml (2 liters) per day</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Reminders</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Get notified to drink water
              </div>
            </div>
            <button
              onClick={reminders ? () => setReminders(false) : setupReminders}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                reminders ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Weekly History
          </h3>
          <div className="space-y-2">
            {history
              .slice(-7)
              .reverse()
              .map((day, idx) => {
                const dayPercentage = Math.min((day.intake / dailyGoal) * 100, 100);
                const date = new Date(day.date);
                const isToday =
                  date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-slate-600 dark:text-slate-400">
                      {isToday
                        ? 'Today'
                        : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${dayPercentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-medium">{day.intake}ml</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
