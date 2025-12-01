import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { trackRecipeInteraction } from '../utils/analytics.js';
import { useToast } from './Toast.jsx';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import { CompactRecipeLoader } from './FoodLoaders.jsx';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Award,
  Plus,
  X,
  Edit3,
  Zap,
  Apple,
  UtensilsCrossed,
  Clock,
  Activity,
} from 'lucide-react';

const STORAGE_KEY = 'calorie:tracker:v1';
const MEAL_LOG_KEY = 'calorie:meals:v1';
const WEIGHT_LOG_KEY = 'calorie:weight:v1';

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}

// Calculate calories for weight goal
function calculateGoalCalories(tdee, goal, rate, _bodyWeight = null, _bodyFat = null) {
  const weeklyDeficit = rate * 7700; // 1 kg = 7700 calories
  const dailyDeficit = weeklyDeficit / 7;

  switch (goal) {
    case 'lose':
      return Math.max(1200, Math.round(tdee - dailyDeficit));
    case 'cut':
      return Math.max(1200, Math.round(tdee - dailyDeficit * 1.5));
    case 'maintain':
      return Math.round(tdee);
    case 'gain':
      return Math.round(tdee + dailyDeficit);
    case 'bulk':
      return Math.round(tdee + dailyDeficit * 1.2);
    case 'recomp':
      return Math.round(tdee - dailyDeficit * 0.3);
    case 'athletic':
      return Math.round(tdee + dailyDeficit * 0.5);
    case 'health':
      return Math.round(tdee);
    default:
      return Math.round(tdee);
  }
}

function readUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeUserProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function readMealLogs() {
  try {
    return JSON.parse(localStorage.getItem(MEAL_LOG_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMealLogs(logs) {
  localStorage.setItem(MEAL_LOG_KEY, JSON.stringify(logs));
}

function readWeightLogs() {
  try {
    return JSON.parse(localStorage.getItem(WEIGHT_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeWeightLogs(logs) {
  localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(logs));
}

// Get weekly stats
function getWeeklyStats(mealLogs) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const weekData = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayMeals = mealLogs[dateStr] || [];
    const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    weekData.push({
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: totalCalories,
      meals: dayMeals.length,
    });
  }
  return weekData;
}

// Calculate streak
function calculateStreak(mealLogs) {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayMeals = mealLogs[dateStr] || [];
    if (dayMeals.length > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function CalorieTracker() {
  const toast = useToast();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(!readUserProfile());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('today'); // today, week, history, weight
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [profile, setProfile] = useState(
    readUserProfile() || {
      weight: '',
      height: '',
      age: '',
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
      rate: 0.5,
      bodyFat: '',
      trainingFrequency: '3-4',
      proteinTarget: '',
      carbTarget: '',
      fatTarget: '',
      notes: '',
      waist: '',
      hips: '',
      chest: '',
      eatingWindow: '',
      firstMeal: '',
      lastMeal: '',
      steps: '',
    }
  );

  const [mealLogs, setMealLogs] = useState(readMealLogs());
  const [weightLogs, setWeightLogs] = useState(readWeightLogs());
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayMacros, setTodayMacros] = useState({ protein: 0, carbs: 0, fats: 0, fiber: 0 });

  useEffect(() => {
    if (profile) {
      writeUserProfile(profile);
    }
  }, [profile]);

  useEffect(() => {
    writeMealLogs(mealLogs);
    calculateTodayStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealLogs]);

  useEffect(() => {
    writeWeightLogs(weightLogs);
  }, [weightLogs]);

  // Listen for updates from other components
  useEffect(() => {
    const handleUpdate = () => {
      const updatedLogs = readMealLogs();
      setMealLogs(updatedLogs);
    };
    window.addEventListener('calorieTrackerUpdate', handleUpdate);
    return () => window.removeEventListener('calorieTrackerUpdate', handleUpdate);
  }, []);

  const calculateTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = mealLogs[today] || [];
    const totalCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFats = todayMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0);
    const totalFiber = todayMeals.reduce((sum, meal) => sum + (meal.fiber || 0), 0);
    setTodayCalories(totalCalories);
    setTodayMacros({
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats,
      fiber: totalFiber,
    });
  };

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSaveProfile = () => {
    if (!profile.weight || !profile.height || !profile.age) {
      toast.error('Please fill in all required fields (weight, height, and age)');
      return;
    }

    trackRecipeInteraction('profile', 'calorie_profile_updated', {
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      trainingFrequency: profile.trainingFrequency,
      hasBodyFat: !!profile.bodyFat,
      hasProteinTarget: !!profile.proteinTarget,
    });

    // Add initial weight to weight log
    if (profile.weight && weightLogs.length === 0) {
      setWeightLogs([
        {
          date: new Date().toISOString().split('T')[0],
          weight: parseFloat(profile.weight),
        },
      ]);
    }

    setShowSetup(false);
    toast.success('Profile saved successfully! 🎉');
  };

  const handleAddWeight = () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      toast.error('Please enter a valid weight');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const existingIndex = weightLogs.findIndex(log => log.date === today);

    const weightEntry = {
      date: today,
      weight: parseFloat(newWeight),
    };

    if (existingIndex >= 0) {
      weightLogs[existingIndex] = weightEntry;
      setWeightLogs([...weightLogs]);
    } else {
      setWeightLogs([...weightLogs, weightEntry].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setNewWeight('');
    setShowAddWeight(false);
    toast.success('Weight logged successfully! 📊');
  };

  const handleRemoveMeal = (date, mealId) => {
    if (mealLogs[date]) {
      mealLogs[date] = mealLogs[date].filter(m => m.id !== mealId);
      setMealLogs({ ...mealLogs });
      toast.success('Meal removed');
    }
  };

  const handleQuickAddMeal = () => {
    navigate('/', { state: { openCalorieTracker: true } });
  };

  if (showSetup) {
    return (
      <motion.div
        id="calorie-tracker-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl mb-6"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-2xl text-slate-900 dark:text-white">
              Set Up Your Profile
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tell us about yourself to get personalized calorie goals
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Weight (kg) *
            </label>
            <input
              type="number"
              value={profile.weight}
              onChange={e => handleProfileChange('weight', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="e.g. 70"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Height (cm) *
            </label>
            <input
              type="number"
              value={profile.height}
              onChange={e => handleProfileChange('height', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="e.g. 175"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Age *
            </label>
            <input
              type="number"
              value={profile.age}
              onChange={e => handleProfileChange('age', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="e.g. 30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Gender
            </label>
            <select
              value={profile.gender}
              onChange={e => handleProfileChange('gender', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Activity Level
            </label>
            <select
              value={profile.activityLevel}
              onChange={e => handleProfileChange('activityLevel', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="light">Light (1-3 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="veryActive">Very Active (2x per day)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Fitness Goal *
            </label>
            <select
              value={profile.goal}
              onChange={e => handleProfileChange('goal', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
            >
              <optgroup label="Weight Management">
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Gain Weight</option>
              </optgroup>
              <optgroup label="Fitness & Bodybuilding">
                <option value="cut">Cut (Fat Loss)</option>
                <option value="bulk">Bulk (Muscle Building)</option>
                <option value="recomp">Recomp (Body Recomposition)</option>
              </optgroup>
              <optgroup label="Performance & Health">
                <option value="athletic">Athletic Performance</option>
                <option value="health">General Health</option>
              </optgroup>
            </select>
          </div>
        </div>

        {profile.goal !== 'maintain' && profile.goal !== 'health' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Target Rate: {profile.rate} kg per week
            </label>
            <input
              type="range"
              min="0.25"
              max={profile.goal === 'lose' || profile.goal === 'cut' ? '1.5' : '0.75'}
              step="0.25"
              value={profile.rate}
              onChange={e => handleProfileChange('rate', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.25 kg/week</span>
              <span>
                {profile.goal === 'lose' || profile.goal === 'cut' ? '1.5 kg/week' : '0.75 kg/week'}
              </span>
            </div>
          </div>
        )}

        {/* Additional Profile Fields */}
        <div className="mb-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
            Additional Settings (Optional)
          </h4>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Training Frequency
              </label>
              <select
                value={profile.trainingFrequency || '3-4'}
                onChange={e => handleProfileChange('trainingFrequency', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="0">No Exercise</option>
                <option value="1-2">1-2 days/week</option>
                <option value="3-4">3-4 days/week</option>
                <option value="5-6">5-6 days/week</option>
                <option value="7">Daily (7 days/week)</option>
                <option value="2x">2x per day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Body Fat % (optional)
              </label>
              <input
                type="number"
                value={profile.bodyFat || ''}
                onChange={e => handleProfileChange('bodyFat', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="e.g. 15"
                min="5"
                max="50"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Protein Target (g/day)
              </label>
              <input
                type="number"
                value={profile.proteinTarget || ''}
                onChange={e => handleProfileChange('proteinTarget', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Auto-calculated"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Carb Target (g/day)
              </label>
              <input
                type="number"
                value={profile.carbTarget || ''}
                onChange={e => handleProfileChange('carbTarget', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Auto-calculated"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Fat Target (g/day)
              </label>
              <input
                type="number"
                value={profile.fatTarget || ''}
                onChange={e => handleProfileChange('fatTarget', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Auto-calculated"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Daily Steps Goal
              </label>
              <input
                type="number"
                value={profile.steps || ''}
                onChange={e => handleProfileChange('steps', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="e.g. 10000"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Body Measurements (Optional) */}
        <div className="mb-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
            Body Measurements (Optional)
          </h4>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Waist (cm)
              </label>
              <input
                type="number"
                value={profile.waist || ''}
                onChange={e => handleProfileChange('waist', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="e.g. 80"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Hips (cm)
              </label>
              <input
                type="number"
                value={profile.hips || ''}
                onChange={e => handleProfileChange('hips', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="e.g. 95"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Chest (cm)
              </label>
              <input
                type="number"
                value={profile.chest || ''}
                onChange={e => handleProfileChange('chest', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="e.g. 100"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Meal Timing (Optional) */}
        <div className="mb-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
            Meal Timing (Optional)
          </h4>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Eating Window
              </label>
              <select
                value={profile.eatingWindow || ''}
                onChange={e => handleProfileChange('eatingWindow', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">None</option>
                <option value="12:12">12:12 (12 hours eating)</option>
                <option value="14:10">14:10 (10 hours eating)</option>
                <option value="16:8">16:8 (8 hours eating)</option>
                <option value="18:6">18:6 (6 hours eating)</option>
                <option value="20:4">20:4 (4 hours eating)</option>
                <option value="OMAD">OMAD (One Meal A Day)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                First Meal
              </label>
              <input
                type="time"
                value={profile.firstMeal || ''}
                onChange={e => handleProfileChange('firstMeal', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Last Meal
              </label>
              <input
                type="time"
                value={profile.lastMeal || ''}
                onChange={e => handleProfileChange('lastMeal', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Notes (Optional)
          </label>
          <textarea
            value={profile.notes || ''}
            onChange={e => handleProfileChange('notes', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Any additional notes about your goals or preferences..."
            rows="3"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveProfile}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-lg transition-all"
        >
          Save Profile & Start Tracking
        </motion.button>
      </motion.div>
    );
  }

  if (!profile.weight || !profile.height || !profile.age) {
    return (
      <div id="calorie-tracker-section" className="mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
            Ready to Track Your Calories?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Set up your profile to get personalized calorie goals and start tracking your progress!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSetup(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all"
          >
            Set Up Now
          </motion.button>
        </div>
      </div>
    );
  }

  const bmr = calculateBMR(
    parseFloat(profile.weight),
    parseFloat(profile.height),
    parseFloat(profile.age),
    profile.gender
  );
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const goalCalories = calculateGoalCalories(
    tdee,
    profile.goal,
    profile.rate,
    parseFloat(profile.weight),
    parseFloat(profile.bodyFat)
  );

  const proteinTarget = profile.proteinTarget
    ? parseFloat(profile.proteinTarget)
    : Math.round(parseFloat(profile.weight || 70) * 1.8);
  const carbTarget = profile.carbTarget
    ? parseFloat(profile.carbTarget)
    : Math.round((goalCalories * 0.45) / 4);
  const fatTarget = profile.fatTarget
    ? parseFloat(profile.fatTarget)
    : Math.round((goalCalories * 0.25) / 9);

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = mealLogs[today] || [];
  const remaining = Math.max(0, goalCalories - todayCalories);
  const over = Math.max(0, todayCalories - goalCalories);
  const percentage = Math.min(100, (todayCalories / goalCalories) * 100);
  const streak = calculateStreak(mealLogs);
  const weeklyData = getWeeklyStats(mealLogs);
  const currentWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : parseFloat(profile.weight);
  const weightChange = weightLogs.length >= 2 ? currentWeight - weightLogs[0].weight : 0;

  const handleFindRecipesForRemaining = async () => {
    if (remaining <= 0) {
      toast.error("You've already reached your calorie goal for today!");
      return;
    }
    setLoadingSuggestions(true);
    try {
      const maxCalories = Math.round(remaining * 1.2);
      const results = await searchSupabaseRecipes({
        query: '',
        limit: 10,
      });
      const filtered = results
        .filter(r => {
          const recipeCalories = r.calories || 0;
          return recipeCalories > 0 && recipeCalories <= maxCalories;
        })
        .slice(0, 5);

      if (filtered.length > 0) {
        navigate('/', {
          state: {
            searchQuery: `recipes under ${Math.round(remaining)} calories`,
            recipes: filtered,
          },
        });
        toast.success(
          `Found ${filtered.length} recipes that fit your remaining ${remaining} calories!`
        );
      } else {
        toast.info('Searching for recipes...');
        navigate('/');
      }
    } catch (error) {
      console.error('Error finding recipes:', error);
      toast.error('Could not find recipes. Try searching manually!');
      navigate('/');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <motion.div
      id="calorie-tracker-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-2xl sm:text-3xl mb-2">Calorie Tracker</h3>
            <p className="text-blue-100 text-sm sm:text-base">
              Track your daily intake & reach your goals
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSetup(true)}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold flex items-center gap-2 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{todayCalories}</div>
            <div className="text-xs sm:text-sm text-blue-100">Calories Today</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{goalCalories}</div>
            <div className="text-xs sm:text-sm text-blue-100">Daily Goal</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-1">
              <Flame className="w-5 h-5" />
              {streak}
            </div>
            <div className="text-xs sm:text-sm text-blue-100">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-1">
              {weightChange > 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : weightChange < 0 ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <Activity className="w-5 h-5" />
              )}
              {currentWeight.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-blue-100">Weight (kg)</div>
          </div>
        </div>
      </div>

      {/* Stats Cards - BMR, TDEE, etc */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(bmr)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">BMR</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tdee}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">TDEE</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{goalCalories}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Goal</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {proteinTarget}g
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Protein</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'today', label: 'Today', icon: Apple },
            { id: 'week', label: 'Week', icon: BarChart3 },
            { id: 'history', label: 'History', icon: Calendar },
            { id: 'weight', label: 'Weight', icon: TrendingUp },
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Today Tab */}
      {activeTab === 'today' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-1">
                  Daily Progress
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {remaining > 0
                    ? `${remaining} calories remaining`
                    : over > 0
                      ? `${over} calories over`
                      : 'Goal reached! 🎯'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500">of goal</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, percentage)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  todayCalories <= goalCalories
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">0</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {todayCalories} / {goalCalories}
              </span>
              <span className="text-slate-600 dark:text-slate-400">{goalCalories}</span>
            </div>

            {/* Quick Actions */}
            {remaining > 100 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFindRecipesForRemaining}
                disabled={loadingSuggestions}
                className="mt-6 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingSuggestions ? (
                  <>
                    <CompactRecipeLoader />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Find recipes with ~{Math.round(remaining)} calories</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Macro Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Protein */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <span className="text-xl">💪</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">Protein</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {Math.round(todayMacros.protein)}g / {proteinTarget}g
                </span>
              </div>
              <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (todayMacros.protein / proteinTarget) * 100)}%`,
                  }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-xl">🍞</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">Carbs</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {Math.round(todayMacros.carbs)}g / {carbTarget}g
                </span>
              </div>
              <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (todayMacros.carbs / carbTarget) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
            </div>

            {/* Fats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                    <span className="text-xl">🥑</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">Fats</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {Math.round(todayMacros.fats)}g / {fatTarget}g
                </span>
              </div>
              <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (todayMacros.fats / fatTarget) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Today's Meals */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                Today's Meals ({todayMeals.length})
              </h4>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickAddMeal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold flex items-center gap-2 text-sm shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Meal
              </motion.button>
            </div>
            {todayMeals.length > 0 ? (
              <div className="space-y-3">
                {todayMeals.map(meal => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">
                        {meal.recipeTitle}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {meal.calories} cal
                        {(meal.protein || meal.carbs || meal.fats) && (
                          <span className="ml-2">
                            • P: {Math.round(meal.protein || 0)}g • C: {Math.round(meal.carbs || 0)}
                            g • F: {Math.round(meal.fats || 0)}g
                          </span>
                        )}
                      </div>
                      {meal.timestamp && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveMeal(today, meal.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  No meals logged today. Add recipes from recipe pages!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickAddMeal}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all"
                >
                  Browse Recipes
                </motion.button>
              </div>
            )}
          </div>

          {/* Insights */}
          {todayMeals.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Daily Insights
              </h4>
              <div className="space-y-3">
                {todayMacros.protein < proteinTarget * 0.8 && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>💪 Low Protein:</strong> You're at{' '}
                      {Math.round((todayMacros.protein / proteinTarget) * 100)}% of your protein
                      goal. Consider adding high-protein foods!
                    </p>
                  </div>
                )}
                {todayMacros.fiber < 25 && (
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>🌾 Fiber:</strong> You've consumed {Math.round(todayMacros.fiber)}g
                      today. Aim for 25-30g daily for optimal health.
                    </p>
                  </div>
                )}
                {percentage >= 80 && percentage <= 120 && (
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      <strong>🎯 Great Job!</strong> You're staying on track with your calorie
                      goals!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Week Tab */}
      {activeTab === 'week' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Overview
            </h4>
            <div className="space-y-4">
              {weeklyData.map((day, idx) => {
                const dayPercentage = goalCalories > 0 ? (day.calories / goalCalories) * 100 : 0;
                return (
                  <div key={day.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white w-12">
                          {day.day}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {day.meals} meal{day.meals !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {day.calories} cal
                      </span>
                    </div>
                    <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, dayPercentage)}%` }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          day.calories <= goalCalories
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                            : 'bg-gradient-to-r from-red-500 to-orange-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / 7)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Avg Daily</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {weeklyData.reduce((sum, day) => sum + day.meals, 0)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Total Meals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {weeklyData.filter(day => day.calories > 0).length}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Days Logged</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Meal History
            </h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(mealLogs)
                .sort((a, b) => b.localeCompare(a))
                .slice(0, 30)
                .map(date => {
                  const dayMeals = mealLogs[date];
                  const dayTotal = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
                  const dateObj = new Date(date);
                  const isToday = date === today;
                  return (
                    <div
                      key={date}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {isToday
                              ? 'Today'
                              : dateObj.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {dayTotal} cal
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {dayMeals.map(meal => (
                          <div
                            key={meal.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg text-sm"
                          >
                            <span className="text-slate-700 dark:text-slate-300">
                              {meal.recipeTitle}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {meal.calories} cal
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {Object.keys(mealLogs).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No meal history yet. Start logging meals to see your progress!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Weight Tab */}
      {activeTab === 'weight' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Weight Tracking
              </h4>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddWeight(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold flex items-center gap-2 text-sm shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Log Weight
              </motion.button>
            </div>

            {weightLogs.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {currentWeight.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Current (kg)</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {weightLogs[0].weight.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Starting (kg)</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div
                      className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                        weightChange > 0
                          ? 'text-red-600'
                          : weightChange < 0
                            ? 'text-emerald-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {weightChange > 0 ? '+' : ''}
                      {weightChange.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Change (kg)</div>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {weightLogs
                    .slice()
                    .reverse()
                    .map((log, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {new Date(log.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {log.weight.toFixed(1)} kg
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Start tracking your weight to see your progress over time!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddWeight(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all"
                >
                  Log Your Weight
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Add Weight Modal */}
      <AnimatePresence>
        {showAddWeight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddWeight(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Log Weight</h3>
              <input
                type="number"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="Enter weight in kg"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddWeight}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
                >
                  Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAddWeight(false);
                    setNewWeight('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Export function to add meals from other components
export function addMealToTracker(recipeId, recipeTitle, calories, macros = {}) {
  const today = new Date().toISOString().split('T')[0];
  const mealLogs = readMealLogs();
  if (!mealLogs[today]) {
    mealLogs[today] = [];
  }
  mealLogs[today].push({
    id: Date.now(),
    recipeId,
    recipeTitle,
    calories: parseInt(calories) || 0,
    protein: macros.protein ? parseFloat(macros.protein) : 0,
    carbs: macros.carbs ? parseFloat(macros.carbs) : 0,
    fats: macros.fats ? parseFloat(macros.fats) : 0,
    fiber: macros.fiber ? parseFloat(macros.fiber) : 0,
    timestamp: new Date().toISOString(),
  });
  writeMealLogs(mealLogs);

  // Trigger storage event for cross-component updates
  window.dispatchEvent(new Event('calorieTrackerUpdate'));
}
