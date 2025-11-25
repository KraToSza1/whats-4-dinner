import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { trackRecipeInteraction } from '../utils/analytics.js';
import { useToast } from './Toast.jsx';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';
import { CompactRecipeLoader } from './FoodLoaders.jsx';

const STORAGE_KEY = 'calorie:tracker:v1';
const MEAL_LOG_KEY = 'calorie:meals:v1';

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
function calculateGoalCalories(tdee, goal, rate, bodyWeight = null, bodyFat = null) {
  // rate in kg per week
  const weeklyDeficit = rate * 7700; // 1 kg = 7700 calories
  const dailyDeficit = weeklyDeficit / 7;

  switch (goal) {
    case 'lose':
      // Weight loss: deficit from TDEE
      return Math.max(1200, Math.round(tdee - dailyDeficit));

    case 'cut':
      // Aggressive cutting (bodybuilding): larger deficit
      return Math.max(1200, Math.round(tdee - dailyDeficit * 1.5));

    case 'maintain':
      // Maintain weight
      return Math.round(tdee);

    case 'gain':
      // Weight gain: surplus from TDEE
      return Math.round(tdee + dailyDeficit);

    case 'bulk':
      // Muscle building: moderate surplus
      return Math.round(tdee + dailyDeficit * 1.2);

    case 'recomp':
      // Body recomposition: slight deficit or maintenance
      return Math.round(tdee - dailyDeficit * 0.3);

    case 'athletic':
      // Athletic performance: maintenance to slight surplus
      return Math.round(tdee + dailyDeficit * 0.5);

    case 'health':
      // General health: maintenance
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

export default function CalorieTracker() {
  const toast = useToast();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(!readUserProfile());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [profile, setProfile] = useState(
    readUserProfile() || {
      weight: '',
      height: '',
      age: '',
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
      rate: 0.5, // kg per week
      bodyFat: '', // optional body fat percentage
      trainingFrequency: '3-4', // days per week
      proteinTarget: '', // grams per day
      carbTarget: '', // grams per day
      fatTarget: '', // grams per day
      notes: '', // user notes
      // Body measurements
      waist: '', // cm
      hips: '', // cm
      chest: '', // cm
      // Meal timing
      eatingWindow: '', // e.g., "16:8", "18:6", "12:12"
      firstMeal: '', // e.g., "08:00"
      lastMeal: '', // e.g., "20:00"
      // Activity tracking
      steps: '', // daily steps goal
    }
  );

  const [mealLogs, setMealLogs] = useState(readMealLogs());
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
  }, [mealLogs]);

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

    // Track profile setup/update in analytics
    trackRecipeInteraction('profile', 'calorie_profile_updated', {
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      trainingFrequency: profile.trainingFrequency,
      hasBodyFat: !!profile.bodyFat,
      hasProteinTarget: !!profile.proteinTarget,
    });

    setShowSetup(false);
  };

  const handleAddMeal = (recipeId, recipeTitle, calories) => {
    const today = new Date().toISOString().split('T')[0];
    if (!mealLogs[today]) {
      mealLogs[today] = [];
    }
    mealLogs[today].push({
      id: Date.now(),
      recipeId,
      recipeTitle,
      calories: parseInt(calories) || 0,
      timestamp: new Date().toISOString(),
    });
    setMealLogs({ ...mealLogs });
  };

  const handleRemoveMeal = (date, mealId) => {
    if (mealLogs[date]) {
      mealLogs[date] = mealLogs[date].filter(m => m.id !== mealId);
      setMealLogs({ ...mealLogs });
    }
  };

  if (showSetup) {
    return (
      <motion.div
        id="calorie-tracker-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">
              Calorie Tracker Setup
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Set up your profile to track calories
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Weight (kg) *
            </label>
            <input
              type="number"
              value={profile.weight}
              onChange={e => handleProfileChange('weight', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
            <p className="text-xs text-slate-500 mt-1">
              {profile.goal === 'cut' && 'Aggressive fat loss for defined physique'}
              {profile.goal === 'bulk' && 'Muscle building with calorie surplus'}
              {profile.goal === 'recomp' && 'Lose fat while gaining muscle'}
              {profile.goal === 'athletic' && 'Optimize for performance and recovery'}
              {profile.goal === 'health' && 'Maintain healthy weight and lifestyle'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Training Frequency
            </label>
            <select
              value={profile.trainingFrequency || '3-4'}
              onChange={e => handleProfileChange('trainingFrequency', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="0">No Exercise</option>
              <option value="1-2">1-2 days/week</option>
              <option value="3-4">3-4 days/week</option>
              <option value="5-6">5-6 days/week</option>
              <option value="7">Daily (7 days/week)</option>
              <option value="2x">2x per day</option>
            </select>
          </div>
        </div>

        {/* Additional Profile Fields */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Body Fat % (optional)
            </label>
            <input
              type="number"
              value={profile.bodyFat || ''}
              onChange={e => handleProfileChange('bodyFat', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
              placeholder="Auto-calculated"
              min="0"
            />
          </div>
        </div>

        {profile.goal !== 'maintain' && profile.goal !== 'health' && (
          <div className="mb-4">
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
            <div className="flex justify-between text-xs text-slate-500">
              <span>0.25 kg/week</span>
              <span>
                {profile.goal === 'lose' || profile.goal === 'cut' ? '1.5 kg/week' : '0.75 kg/week'}
              </span>
            </div>
          </div>
        )}

        {/* Body Measurements (Optional) */}
        <div className="mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
            Body Measurements (Optional)
          </h4>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Waist (cm)
              </label>
              <input
                type="number"
                value={profile.waist || ''}
                onChange={e => handleProfileChange('waist', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
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
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
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
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="e.g. 100"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Meal Timing (Optional) */}
        <div className="mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
            Meal Timing (Optional)
          </h4>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">
                Eating Window
              </label>
              <select
                value={profile.eatingWindow || ''}
                onChange={e => handleProfileChange('eatingWindow', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
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
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
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
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md transition-all"
        >
          Save Profile
        </button>
      </motion.div>
    );
  }

  if (!profile.weight || !profile.height || !profile.age) {
    return (
      <div id="calorie-tracker-section" className="mb-6">
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Set up your calorie tracker to start tracking your daily intake!
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
          >
            Set Up Now
          </button>
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

  // Calculate macro targets if not set
  const proteinTarget = profile.proteinTarget
    ? parseFloat(profile.proteinTarget)
    : Math.round(parseFloat(profile.weight || 70) * 1.8);

  // Calculate carb target (40-50% of calories, default 45%)
  const carbTarget = profile.carbTarget
    ? parseFloat(profile.carbTarget)
    : Math.round((goalCalories * 0.45) / 4); // 4 calories per gram of carbs

  // Calculate fat target (20-35% of calories, default 25%)
  const fatTarget = profile.fatTarget
    ? parseFloat(profile.fatTarget)
    : Math.round((goalCalories * 0.25) / 9); // 9 calories per gram of fat

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = mealLogs[today] || [];
  const remaining = Math.max(0, goalCalories - todayCalories);
  const remainingProtein = Math.max(0, proteinTarget - todayMacros.protein);
  const remainingCarbs = Math.max(0, carbTarget - todayMacros.carbs);
  const remainingFats = Math.max(0, fatTarget - todayMacros.fats);
  const over = Math.max(0, todayCalories - goalCalories);
  const percentage = Math.min(100, (todayCalories / goalCalories) * 100);

  const handleFindRecipesForRemaining = async () => {
    if (remaining <= 0) {
      toast.error("You've already reached your calorie goal for today!");
      return;
    }
    setLoadingSuggestions(true);
    try {
      // Search for recipes within remaining calories (with some flexibility)
      const maxCalories = Math.round(remaining * 1.2); // Allow 20% over for flexibility
      const results = await searchSupabaseRecipes({
        query: '',
        limit: 10,
      });

      // Filter by calories if possible, or just show results
      const filtered = results
        .filter(r => {
          const recipeCalories = r.calories || 0;
          return recipeCalories > 0 && recipeCalories <= maxCalories;
        })
        .slice(0, 5);

      if (filtered.length > 0) {
        // Navigate to search with calorie filter
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
      className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Calorie Tracker</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Track your daily intake</p>
          </div>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      {/* Daily Progress */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-4 border border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{todayCalories}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              of {goalCalories} calories
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {profile.goal === 'lose' && 'Lose Weight'}
              {profile.goal === 'cut' && 'Cut (Fat Loss)'}
              {profile.goal === 'maintain' && 'Maintain Weight'}
              {profile.goal === 'gain' && 'Gain Weight'}
              {profile.goal === 'bulk' && 'Bulk (Muscle Building)'}
              {profile.goal === 'recomp' && 'Recomp (Body Recomposition)'}
              {profile.goal === 'athletic' && 'Athletic Performance'}
              {profile.goal === 'health' && 'General Health'}
            </div>
            <div className="text-xs text-slate-500">{profile.rate} kg/week</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={`h-full rounded-full ${
              todayCalories <= goalCalories
                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                : 'bg-gradient-to-r from-red-500 to-orange-500'
            }`}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{percentage.toFixed(0)}%</span>
          {remaining > 0 && <span>{remaining} remaining</span>}
          {over > 0 && <span className="text-red-600">{over} over</span>}
        </div>

        {/* Smart Meal Suggestions */}
        {remaining > 100 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFindRecipesForRemaining}
            disabled={loadingSuggestions}
            className="mt-4 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingSuggestions ? (
              <>
                <CompactRecipeLoader />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Find recipes with ~{Math.round(remaining)} calories</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">{Math.round(bmr)}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">BMR</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-center border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600">{tdee}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">TDEE</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-center border border-pink-200 dark:border-pink-800">
          <div className="text-2xl font-bold text-pink-600">{goalCalories}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Goal</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-center border border-emerald-200 dark:border-emerald-800">
          <div className="text-2xl font-bold text-emerald-600">{proteinTarget}g</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Protein</div>
        </div>
      </div>

      {/* Macro Tracking */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-4 border border-blue-200 dark:border-blue-800 shadow-sm">
        <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Macro Breakdown</h4>

        {/* Protein */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Protein</span>
            <span className="text-slate-600 dark:text-slate-400">
              {Math.round(todayMacros.protein)}g / {proteinTarget}g
            </span>
          </div>
          <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (todayMacros.protein / proteinTarget) * 100)}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Carbs</span>
            <span className="text-slate-600 dark:text-slate-400">
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
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Fats</span>
            <span className="text-slate-600 dark:text-slate-400">
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

        {/* Macro Distribution Pie Chart (Visual) */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">Macro Distribution</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1 h-4 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500"
                style={{ width: `${((todayMacros.protein * 4) / todayCalories) * 100}%` }}
                title={`Protein: ${(((todayMacros.protein * 4) / todayCalories) * 100).toFixed(1)}%`}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${((todayMacros.carbs * 4) / todayCalories) * 100}%` }}
                title={`Carbs: ${(((todayMacros.carbs * 4) / todayCalories) * 100).toFixed(1)}%`}
              />
              <div
                className="bg-orange-500"
                style={{ width: `${((todayMacros.fats * 9) / todayCalories) * 100}%` }}
                title={`Fats: ${(((todayMacros.fats * 9) / todayCalories) * 100).toFixed(1)}%`}
              />
            </div>
            <div className="text-xs text-slate-500">
              {todayCalories > 0
                ? `${Math.round(((todayMacros.protein * 4) / todayCalories) * 100)}% / ${Math.round(((todayMacros.carbs * 4) / todayCalories) * 100)}% / ${Math.round(((todayMacros.fats * 9) / todayCalories) * 100)}%`
                : '0% / 0% / 0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {(profile.bodyFat || profile.trainingFrequency || profile.waist || profile.eatingWindow) && (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {profile.bodyFat && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Body Fat: </span>
                <span className="font-semibold">{profile.bodyFat}%</span>
              </div>
            )}
            {profile.trainingFrequency && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Training: </span>
                <span className="font-semibold">{profile.trainingFrequency} days/week</span>
              </div>
            )}
            {profile.waist && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Waist: </span>
                <span className="font-semibold">{profile.waist}cm</span>
              </div>
            )}
            {profile.eatingWindow && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Eating Window: </span>
                <span className="font-semibold">{profile.eatingWindow}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nutrition Insights */}
      {todayMeals.length > 0 && (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-4 border border-blue-200 dark:border-blue-800 shadow-sm">
          <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
            💡 Nutrition Insights
          </h4>

          {/* Protein Check */}
          {todayMacros.protein < proteinTarget * 0.8 && (
            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Low Protein:</strong> You're at{' '}
                {Math.round((todayMacros.protein / proteinTarget) * 100)}% of your protein goal.
                Consider adding high-protein foods like chicken, fish, or legumes.
              </p>
            </div>
          )}

          {/* Fiber Check */}
          {todayMacros.fiber < 25 && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Fiber Intake:</strong> You've consumed {Math.round(todayMacros.fiber)}g of
                fiber today. Aim for 25-30g daily for optimal digestive health.
              </p>
            </div>
          )}

          {/* Meal Pattern Analysis */}
          {todayMeals.length >= 2 &&
            (() => {
              const mealTimes = todayMeals
                .map(m => new Date(m.timestamp).getHours())
                .sort((a, b) => a - b);
              const avgMealTime = mealTimes.reduce((a, b) => a + b, 0) / mealTimes.length;
              const mealSpread = mealTimes[mealTimes.length - 1] - mealTimes[0];

              return (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>Meal Pattern:</strong> You've eaten {todayMeals.length} meals today,
                    spread over {mealSpread} hours. Average meal time: {Math.round(avgMealTime)}:00.
                  </p>
                </div>
              );
            })()}

          {/* Consistency Score */}
          {(() => {
            const consistency = Math.min(100, (todayCalories / goalCalories) * 100);
            const isOnTrack = consistency >= 80 && consistency <= 120;

            return (
              <div
                className={`mt-3 p-3 rounded-lg border ${
                  isOnTrack
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}
              >
                <p
                  className={`text-sm ${
                    isOnTrack
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-orange-800 dark:text-orange-200'
                  }`}
                >
                  <strong>Consistency Score:</strong> {Math.round(consistency)}%
                  {isOnTrack
                    ? ' - Great job staying on track! 🎯'
                    : ' - Adjust your intake to meet your goals.'}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Today's Meals */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">
          Today's Meals ({todayMeals.length})
        </h4>
        {todayMeals.length > 0 ? (
          <div className="space-y-2">
            {todayMeals.map(meal => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {meal.recipeTitle}
                  </div>
                  <div className="text-xs text-slate-500">
                    {meal.calories} cal
                    {(meal.protein || meal.carbs || meal.fats) && (
                      <span className="ml-2">
                        • P: {Math.round(meal.protein || 0)}g • C: {Math.round(meal.carbs || 0)}g •
                        F: {Math.round(meal.fats || 0)}g
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMeal(today, meal.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            No meals logged today. Add recipes from the meal planner or recipe pages!
          </p>
        )}
      </div>
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
