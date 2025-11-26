import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast.jsx';

const STORAGE_KEY = 'meal:reminders:v2';

const MEAL_TYPES = {
  breakfast: { emoji: '🌅', name: 'Breakfast', defaultTime: '08:00' },
  lunch: { emoji: '🌞', name: 'Lunch', defaultTime: '12:30' },
  dinner: { emoji: '🌙', name: 'Dinner', defaultTime: '19:00' },
  snack: { emoji: '🍎', name: 'Snack', defaultTime: '15:00' },
  custom: { emoji: '🍽️', name: 'Custom', defaultTime: '12:00' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function readReminders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeReminders(reminders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export default function MealReminders() {
  const toast = useToast();
  const [reminders, setReminders] = useState(readReminders());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newReminder, setNewReminder] = useState({
    name: '',
    mealType: 'custom',
    time: '',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Monday-Friday by default
    advanceMinutes: 15, // Remind 15 minutes before
    repeat: true,
    sound: true,
    message: '',
  });
  const notificationTimeouts = useRef({});

  useEffect(() => {
    writeReminders(reminders);
    setupNotifications();
    return () => {
      // Clear all timeouts on unmount
      Object.values(notificationTimeouts.current).forEach(clearTimeout);
    };
  }, [reminders]);

  const setupNotifications = async () => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Clear existing timeouts
    Object.values(notificationTimeouts.current).forEach(clearTimeout);
    notificationTimeouts.current = {};

    // Schedule reminders
    reminders.forEach(reminder => {
      if (reminder.enabled) {
        scheduleReminder(reminder);
      }
    });
  };

  const scheduleReminder = reminder => {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const advanceMinutes = reminder.advanceMinutes || 0;

    // Calculate reminder time (before actual meal time)
    let reminderMinutes = minutes - advanceMinutes;
    let reminderHours = hours;

    if (reminderMinutes < 0) {
      reminderMinutes += 60;
      reminderHours -= 1;
    }
    if (reminderHours < 0) {
      reminderHours += 24;
    }

    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Schedule for each selected day
    reminder.days.forEach(dayIndex => {
      const reminderTime = new Date();
      reminderTime.setHours(reminderHours, reminderMinutes, 0, 0);

      // Calculate days until next occurrence
      let daysUntil = dayIndex - today;
      if (daysUntil < 0) daysUntil += 7;
      if (daysUntil === 0 && reminderTime < now) {
        daysUntil = 7; // If time passed today, schedule for next week
      }

      reminderTime.setDate(reminderTime.getDate() + daysUntil);

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      if (timeUntilReminder > 0 && timeUntilReminder < 7 * 24 * 60 * 60 * 1000) {
        const timeoutId = setTimeout(() => {
          if (Notification.permission === 'granted') {
            const message = reminder.message || `Time for ${reminder.name}!`;
            new Notification(`🍽️ ${reminder.name}`, {
              body: message,
              icon: '/favicon.ico',
              tag: `meal-reminder-${reminder.id}-${dayIndex}`,
              requireInteraction: false,
            });

            // If repeat is enabled, schedule next week
            if (reminder.repeat) {
              scheduleReminder(reminder);
            }
          }
        }, timeUntilReminder);

        notificationTimeouts.current[`${reminder.id}-${dayIndex}`] = timeoutId;
      }
    });
  };

  const handleAddReminder = () => {
    if (!newReminder.name || !newReminder.time) {
      toast.error('Please fill in reminder name and time');
      return;
    }

    if (editingId) {
      // Update existing
      setReminders(reminders.map(r => (r.id === editingId ? { ...r, ...newReminder } : r)));
      setEditingId(null);
      toast.success('Reminder updated!');
    } else {
      // Add new
      const reminder = {
        id: Date.now(),
        ...newReminder,
      };
      setReminders([...reminders, reminder]);
      toast.success('Reminder added!');
    }

    resetForm();
  };

  const resetForm = () => {
    setNewReminder({
      name: '',
      mealType: 'custom',
      time: '',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      advanceMinutes: 15,
      repeat: true,
      sound: true,
      message: '',
    });
    setShowAdd(false);
    setEditingId(null);
  };

  const handleEdit = reminder => {
    setNewReminder(reminder);
    setEditingId(reminder.id);
    setShowAdd(true);
  };

  const handleToggleReminder = id => {
    setReminders(reminders.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleDeleteReminder = id => {
    if (confirm('Delete this reminder?')) {
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder deleted');
    }
  };

  const quickAddMeal = mealType => {
    const meal = MEAL_TYPES[mealType];
    setNewReminder({
      name: meal.name,
      mealType: mealType,
      time: meal.defaultTime,
      enabled: true,
      days: [1, 2, 3, 4, 5, 6, 0], // All days
      advanceMinutes: 15,
      repeat: true,
      sound: true,
      message: `Time for ${meal.name.toLowerCase()}!`,
    });
    setShowAdd(true);
  };

  const getNextReminderTime = reminder => {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    const today = now.getDay();

    // Find next occurrence
    for (let i = 0; i < 7; i++) {
      const checkDay = (today + i) % 7;
      if (reminder.days.includes(checkDay)) {
        const reminderTime = new Date();
        reminderTime.setDate(reminderTime.getDate() + i);
        reminderTime.setHours(hours, minutes, 0, 0);

        if (reminderTime > now || i > 0) {
          return reminderTime;
        }
      }
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
    >
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4 mb-4 xs:mb-5 sm:mb-6">
        <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-xl xs:text-2xl">⏰</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg xs:text-xl text-slate-900 dark:text-white truncate">
              Meal Reminders
            </h3>
            <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 truncate">
              Never miss a meal with smart reminders
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
            if (showAdd) {
              resetForm();
            } else {
              setShowAdd(true);
            }
          }}
          className="w-full xs:w-auto px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2 sm:py-2.5 text-sm xs:text-base rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-md transition-all min-h-[44px] xs:min-h-0 touch-manipulation whitespace-nowrap"
        >
          {showAdd ? 'Cancel' : '+ Add Reminder'}
        </motion.button>
      </div>

      {/* Quick Add Buttons */}
      {!showAdd && (
        <div className="mb-4 xs:mb-5 sm:mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-3">
          {Object.entries(MEAL_TYPES)
            .filter(([key]) => key !== 'custom')
            .map(([key, meal]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => quickAddMeal(key)}
                className="px-2.5 xs:px-3 sm:px-4 py-2.5 xs:py-3 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-purple-200 dark:border-purple-800 transition-colors min-h-[60px] xs:min-h-[70px] sm:min-h-0 touch-manipulation flex flex-col items-center justify-center"
              >
                <div className="text-xl xs:text-2xl sm:text-lg">{meal.emoji}</div>
                <div className="text-xs xs:text-sm font-medium mt-1">{meal.name}</div>
              </motion.button>
            ))}
        </div>
      )}

      {/* Add/Edit Reminder Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 xs:mb-4 p-3 xs:p-4 sm:p-5 bg-white/90 dark:bg-slate-800/90 rounded-lg xs:rounded-xl border border-purple-200 dark:border-purple-800"
          >
            <div className="space-y-3 xs:space-y-4">
              <div>
                <label className="block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2 text-slate-700 dark:text-slate-300">
                  Reminder Name
                </label>
                <input
                  type="text"
                  value={newReminder.name}
                  onChange={e => setNewReminder({ ...newReminder, name: e.target.value })}
                  className="w-full px-3 xs:px-4 py-2.5 xs:py-2 text-sm xs:text-base rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:outline-none min-h-[44px] xs:min-h-0"
                  placeholder="e.g. Breakfast, Lunch, Dinner"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div>
                  <label className="block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2 text-slate-700 dark:text-slate-300">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newReminder.time}
                    onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-2 text-sm xs:text-base rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:outline-none min-h-[44px] xs:min-h-0"
                  />
                </div>
                <div>
                  <label className="block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2 text-slate-700 dark:text-slate-300">
                    Remind Before (minutes)
                  </label>
                  <input
                    type="number"
                    value={newReminder.advanceMinutes}
                    onChange={e =>
                      setNewReminder({
                        ...newReminder,
                        advanceMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-2 text-sm xs:text-base rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:outline-none min-h-[44px] xs:min-h-0"
                    min="0"
                    max="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2 text-slate-700 dark:text-slate-300">
                  Days
                </label>
                <div className="flex gap-1.5 xs:gap-2 flex-wrap">
                  {DAYS.map((day, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const days = newReminder.days.includes(idx)
                          ? newReminder.days.filter(d => d !== idx)
                          : [...newReminder.days, idx];
                        setNewReminder({ ...newReminder, days });
                      }}
                      className={`px-2.5 xs:px-3 py-1.5 xs:py-1 rounded-lg text-xs xs:text-sm font-medium transition-colors min-h-[44px] xs:min-h-0 touch-manipulation ${
                        newReminder.days.includes(idx)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2 text-slate-700 dark:text-slate-300">
                  Custom Message (optional)
                </label>
                <input
                  type="text"
                  value={newReminder.message}
                  onChange={e => setNewReminder({ ...newReminder, message: e.target.value })}
                  className="w-full px-3 xs:px-4 py-2.5 xs:py-2 text-sm xs:text-base rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:outline-none min-h-[44px] xs:min-h-0"
                  placeholder="e.g. Don't forget to hydrate!"
                />
              </div>

              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4">
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px] xs:min-h-0 touch-manipulation">
                  <input
                    type="checkbox"
                    checked={newReminder.repeat}
                    onChange={e => setNewReminder({ ...newReminder, repeat: e.target.checked })}
                    className="w-4 h-4 xs:w-5 xs:h-5 rounded border-slate-300"
                  />
                  <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300">
                    Repeat weekly
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px] xs:min-h-0 touch-manipulation">
                  <input
                    type="checkbox"
                    checked={newReminder.enabled}
                    onChange={e => setNewReminder({ ...newReminder, enabled: e.target.checked })}
                    className="w-4 h-4 xs:w-5 xs:h-5 rounded border-slate-300"
                  />
                  <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300">
                    Enabled
                  </span>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddReminder}
                className="w-full px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 text-sm xs:text-base rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold min-h-[44px] xs:min-h-0 touch-manipulation"
              >
                {editingId ? 'Update Reminder' : 'Add Reminder'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminders List */}
      {reminders.length > 0 ? (
        <div className="space-y-2.5 xs:space-y-3">
          {reminders.map(reminder => {
            const nextTime = getNextReminderTime(reminder);
            const mealInfo = MEAL_TYPES[reminder.mealType] || MEAL_TYPES.custom;

            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 xs:p-4 sm:p-5 bg-white/90 dark:bg-slate-800/90 rounded-lg xs:rounded-xl border border-purple-200 dark:border-purple-800"
              >
                <div className="flex flex-col xs:flex-row items-start xs:items-start justify-between gap-3 xs:gap-4">
                  <div className="flex-1 min-w-0 w-full xs:w-auto">
                    <div className="flex items-center gap-2 xs:gap-3 mb-2">
                      <div
                        className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full flex-shrink-0 ${reminder.enabled ? 'bg-green-500' : 'bg-slate-400'}`}
                      />
                      <div className="text-base xs:text-lg flex-shrink-0">{mealInfo.emoji}</div>
                      <div className="font-semibold text-sm xs:text-base text-slate-900 dark:text-white truncate">
                        {reminder.name}
                      </div>
                    </div>
                    <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-5 xs:ml-6">
                      <div className="break-words">
                        ⏰ {reminder.time}{' '}
                        {reminder.advanceMinutes > 0 &&
                          `(remind ${reminder.advanceMinutes} min before)`}
                      </div>
                      <div className="break-words">
                        📅 {reminder.days.map(d => DAYS[d]).join(', ')}
                      </div>
                      {nextTime && (
                        <div className="text-[10px] xs:text-xs text-purple-600 dark:text-purple-400 break-words">
                          Next: {nextTime.toLocaleString()}
                        </div>
                      )}
                      {reminder.message && (
                        <div className="text-[10px] xs:text-xs italic break-words">
                          💬 "{reminder.message}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 xs:gap-2 w-full xs:w-auto flex-wrap xs:flex-nowrap">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(reminder)}
                      className="px-2.5 xs:px-3 py-1.5 xs:py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs xs:text-sm font-medium min-h-[44px] xs:min-h-0 touch-manipulation flex-1 xs:flex-none"
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleReminder(reminder.id)}
                      className={`px-2.5 xs:px-3 py-1.5 xs:py-1 rounded-lg text-xs xs:text-sm font-medium min-h-[44px] xs:min-h-0 touch-manipulation flex-1 xs:flex-none ${
                        reminder.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {reminder.enabled ? 'On' : 'Off'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="px-2.5 xs:px-3 py-1.5 xs:py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs xs:text-sm font-medium min-h-[44px] xs:min-h-0 touch-manipulation flex-1 xs:flex-none"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 xs:py-8 px-2 text-slate-500 dark:text-slate-400">
          <p className="text-base xs:text-lg mb-2">No reminders set</p>
          <p className="text-xs xs:text-sm break-words">
            Click "Add Reminder" or use quick add buttons above to get started!
          </p>
          {Notification.permission === 'denied' && (
            <p className="text-[10px] xs:text-xs text-red-600 dark:text-red-400 mt-2 break-words">
              ⚠️ Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
