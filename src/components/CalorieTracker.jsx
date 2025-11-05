import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackRecipeInteraction } from "../utils/analytics.js";

const STORAGE_KEY = "calorie:tracker:v1";
const MEAL_LOG_KEY = "calorie:meals:v1";

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
function calculateBMR(weight, height, age, gender) {
    if (gender === "male") {
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
        case "lose":
            // Weight loss: deficit from TDEE
            return Math.max(1200, Math.round(tdee - dailyDeficit));
        
        case "cut":
            // Aggressive cutting (bodybuilding): larger deficit
            return Math.max(1200, Math.round(tdee - (dailyDeficit * 1.5)));
        
        case "maintain":
            // Maintain weight
            return Math.round(tdee);
        
        case "gain":
            // Weight gain: surplus from TDEE
            return Math.round(tdee + dailyDeficit);
        
        case "bulk":
            // Muscle building: moderate surplus
            return Math.round(tdee + (dailyDeficit * 1.2));
        
        case "recomp":
            // Body recomposition: slight deficit or maintenance
            return Math.round(tdee - (dailyDeficit * 0.3));
        
        case "athletic":
            // Athletic performance: maintenance to slight surplus
            return Math.round(tdee + (dailyDeficit * 0.5));
        
        case "health":
            // General health: maintenance
            return Math.round(tdee);
        
        default:
            return Math.round(tdee);
    }
}

function readUserProfile() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
        return null;
    }
}

function writeUserProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function readMealLogs() {
    try {
        return JSON.parse(localStorage.getItem(MEAL_LOG_KEY) || "{}");
    } catch {
        return {};
    }
}

function writeMealLogs(logs) {
    localStorage.setItem(MEAL_LOG_KEY, JSON.stringify(logs));
}

export default function CalorieTracker() {
    const [showSetup, setShowSetup] = useState(!readUserProfile());
    const [profile, setProfile] = useState(readUserProfile() || {
        weight: "",
        height: "",
        age: "",
        gender: "male",
        activityLevel: "moderate",
        goal: "maintain",
        rate: 0.5, // kg per week
        bodyFat: "", // optional body fat percentage
        trainingFrequency: "3-4", // days per week
        proteinTarget: "", // grams per day
        carbTarget: "", // grams per day
        fatTarget: "", // grams per day
        notes: "", // user notes
    });

    const [mealLogs, setMealLogs] = useState(readMealLogs());
    const [todayCalories, setTodayCalories] = useState(0);

    useEffect(() => {
        if (profile) {
            writeUserProfile(profile);
        }
    }, [profile]);

    useEffect(() => {
        writeMealLogs(mealLogs);
        calculateTodayCalories();
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

    const calculateTodayCalories = () => {
        const today = new Date().toISOString().split("T")[0];
        const todayMeals = mealLogs[today] || [];
        const total = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        setTodayCalories(total);
    };

    const handleProfileChange = (field, value) => {
        setProfile({ ...profile, [field]: value });
    };

    const handleSaveProfile = () => {
        if (!profile.weight || !profile.height || !profile.age) {
            alert("Please fill in all required fields");
            return;
        }
        
        // Track profile setup/update in analytics
        trackRecipeInteraction("profile", "calorie_profile_updated", {
            goal: profile.goal,
            activityLevel: profile.activityLevel,
            trainingFrequency: profile.trainingFrequency,
            hasBodyFat: !!profile.bodyFat,
            hasProteinTarget: !!profile.proteinTarget,
        });
        
        setShowSetup(false);
    };

    const handleAddMeal = (recipeId, recipeTitle, calories) => {
        const today = new Date().toISOString().split("T")[0];
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
            mealLogs[date] = mealLogs[date].filter((m) => m.id !== mealId);
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
                            onChange={(e) => handleProfileChange("weight", e.target.value)}
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
                            onChange={(e) => handleProfileChange("height", e.target.value)}
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
                            onChange={(e) => handleProfileChange("age", e.target.value)}
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
                            onChange={(e) => handleProfileChange("gender", e.target.value)}
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
                            onChange={(e) => handleProfileChange("activityLevel", e.target.value)}
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
                            onChange={(e) => handleProfileChange("goal", e.target.value)}
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
                            {profile.goal === "cut" && "Aggressive fat loss for defined physique"}
                            {profile.goal === "bulk" && "Muscle building with calorie surplus"}
                            {profile.goal === "recomp" && "Lose fat while gaining muscle"}
                            {profile.goal === "athletic" && "Optimize for performance and recovery"}
                            {profile.goal === "health" && "Maintain healthy weight and lifestyle"}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                            Training Frequency
                        </label>
                        <select
                            value={profile.trainingFrequency || "3-4"}
                            onChange={(e) => handleProfileChange("trainingFrequency", e.target.value)}
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
                            value={profile.bodyFat || ""}
                            onChange={(e) => handleProfileChange("bodyFat", e.target.value)}
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
                            value={profile.proteinTarget || ""}
                            onChange={(e) => handleProfileChange("proteinTarget", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                            placeholder="Auto-calculated"
                            min="0"
                        />
                    </div>
                </div>

                {profile.goal !== "maintain" && profile.goal !== "health" && (
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                            Target Rate: {profile.rate} kg per week
                        </label>
                        <input
                            type="range"
                            min="0.25"
                            max={profile.goal === "lose" || profile.goal === "cut" ? "1.5" : "0.75"}
                            step="0.25"
                            value={profile.rate}
                            onChange={(e) => handleProfileChange("rate", parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>0.25 kg/week</span>
                            <span>{profile.goal === "lose" || profile.goal === "cut" ? "1.5 kg/week" : "0.75 kg/week"}</span>
                        </div>
                    </div>
                )}

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
    
    // Calculate protein target if not set (1.6-2.2g per kg body weight)
    const proteinTarget = profile.proteinTarget 
        ? parseFloat(profile.proteinTarget)
        : Math.round(parseFloat(profile.weight || 70) * 1.8);

    const today = new Date().toISOString().split("T")[0];
    const todayMeals = mealLogs[today] || [];
    const remaining = Math.max(0, goalCalories - todayCalories);
    const over = Math.max(0, todayCalories - goalCalories);
    const percentage = Math.min(100, (todayCalories / goalCalories) * 100);

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
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                            Calorie Tracker
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Track your daily intake
                        </p>
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
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {todayCalories}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            of {goalCalories} calories
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {profile.goal === "lose" && "Lose Weight"}
                            {profile.goal === "cut" && "Cut (Fat Loss)"}
                            {profile.goal === "maintain" && "Maintain Weight"}
                            {profile.goal === "gain" && "Gain Weight"}
                            {profile.goal === "bulk" && "Bulk (Muscle Building)"}
                            {profile.goal === "recomp" && "Recomp (Body Recomposition)"}
                            {profile.goal === "athletic" && "Athletic Performance"}
                            {profile.goal === "health" && "General Health"}
                        </div>
                        <div className="text-xs text-slate-500">
                            {profile.rate} kg/week
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full rounded-full ${
                            todayCalories <= goalCalories
                                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                : "bg-gradient-to-r from-red-500 to-orange-500"
                        }`}
                    />
                </div>

                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>{percentage.toFixed(0)}%</span>
                    {remaining > 0 && <span>{remaining} remaining</span>}
                    {over > 0 && <span className="text-red-600">{over} over</span>}
                </div>
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
            
            {/* Additional Info */}
            {(profile.bodyFat || profile.trainingFrequency) && (
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
                    </div>
                </div>
            )}

            {/* Today's Meals */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">
                    Today's Meals ({todayMeals.length})
                </h4>
                {todayMeals.length > 0 ? (
                    <div className="space-y-2">
                        {todayMeals.map((meal) => (
                            <div
                                key={meal.id}
                                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {meal.recipeTitle}
                                    </div>
                                    <div className="text-xs text-slate-500">{meal.calories} cal</div>
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
export function addMealToTracker(recipeId, recipeTitle, calories) {
    const today = new Date().toISOString().split("T")[0];
    const mealLogs = readMealLogs();
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
    writeMealLogs(mealLogs);
    
    // Trigger storage event for cross-component updates
    window.dispatchEvent(new Event('calorieTrackerUpdate'));
}

