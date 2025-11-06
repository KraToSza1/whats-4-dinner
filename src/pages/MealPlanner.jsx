import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGroceryList } from "../context/GroceryListContext.jsx";
import { getRecipeInformation } from "../api/spoonacular.js";
import { searchRecipes } from "../api/spoonacular.js";
import { trackRecipeInteraction } from "../utils/analytics.js";

const KEY = "meal:plan:v2"; // updated version for breakfast/lunch/dinner
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEALS = ["breakfast", "lunch", "dinner"];

// Initialize structure: 7 days x 3 meals
function emptyDay() {
    return { breakfast: null, lunch: null, dinner: null };
}

export function readMealPlan() {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
        
        // Handle migration from v1 format (backward compatibility)
        if (Array.isArray(parsed)) {
            // Old format - migrate to new format
            const newPlan = {};
            parsed.forEach((meal, idx) => {
                if (meal) {
                    newPlan[DAYS_SHORT[idx]] = { breakfast: null, lunch: null, dinner: meal };
                } else {
                    newPlan[DAYS_SHORT[idx]] = emptyDay();
                }
            });
            writeMealPlan(newPlan);
            return newPlan;
        }
        
        // New format
        if (parsed && typeof parsed === "object") {
            // Fill in any missing days
            const plan = {};
            DAYS_SHORT.forEach(day => {
                plan[day] = parsed[day] || emptyDay();
            });
            return plan;
        }
        
        return {};
    } catch {
        return {};
    }
}

export function writeMealPlan(plan) {
    localStorage.setItem(KEY, JSON.stringify(plan));
}

/** Call this from anywhere (e.g., RecipePage) to set a meal */
export function setMealPlanDay(dayIndex, mealType, recipe) {
    const current = readMealPlan();
    const day = DAYS_SHORT[dayIndex];
    
    if (!current[day]) {
        current[day] = emptyDay();
    }
    
    current[day][mealType] = recipe
        ? { id: recipe.id, title: recipe.title, image: recipe.image }
        : null;
    
    writeMealPlan(current);
    return current;
}
/* --------------------------------------------------------------------------- */

export default function MealPlanner() {
    const [plan, setPlan] = useState(() => readMealPlan());
    const { addMany, setOpen } = useGroceryList();
    const [loading, setLoading] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState([]);
    const navigate = useNavigate();

    // persist whenever plan changes
    useEffect(() => writeMealPlan(plan), [plan]);

    // Listen for changes from other tabs/components
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === KEY && e.newValue) {
                try {
                    setPlan(JSON.parse(e.newValue));
                } catch {}
            }
        };
        window.addEventListener("storage", handleStorageChange);
        // Also check for same-tab changes
        const interval = setInterval(() => {
            try {
                const current = readMealPlan();
                setPlan(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(current)) {
                        return current;
                    }
                    return prev;
                });
            } catch {}
        }, 1000);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const setMeal = (dayIdx, mealType, recipe) => {
        setPlan(setMealPlanDay(dayIdx, mealType, recipe));
        // Track interaction
        if (recipe?.id) {
            trackRecipeInteraction(recipe.id, "add_to_plan", {
                title: recipe.title,
                mealType,
                day: DAYS_SHORT[dayIdx],
            });
        }
    };

    const favorites = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("favorites") || "[]");
        } catch {
            return [];
        }
    }, []);

    // Smart meal planning - suggest balanced meals
    const generateSmartPlan = async () => {
        setLoading(true);
        try {
            // Get dietary preferences
            const diet = localStorage.getItem("filters:diet") || "";
            const intolerances = localStorage.getItem("filters:intolerances") || "";
            const pantry = JSON.parse(localStorage.getItem("filters:pantry") || "[]");
            
            const next = { ...plan };
            let suggestionCount = 0;
            
            for (const day of DAYS_SHORT) {
                if (!next[day]) next[day] = emptyDay();
                
                for (const mealType of MEALS) {
                    if (!next[day][mealType] && suggestionCount < 21) {
                        try {
                            const usePantry = suggestionCount % 3 === 0 && pantry.length > 0;
                            const ingredients = usePantry 
                                ? [...pantry].sort(() => Math.random() - 0.5).slice(0, 3)
                                : [];
                            
                            const result = await searchRecipes({
                                query: mealType === "breakfast" ? "breakfast" : mealType === "lunch" ? "lunch" : "",
                                includeIngredients: ingredients,
                                diet,
                                intolerances,
                                number: 15,
                            });

                            const recipes = Array.isArray(result) ? result : result?.results || [];
                            if (recipes.length > 0) {
                                next[day][mealType] = {
                                    id: recipes[Math.floor(Math.random() * recipes.length)].id,
                                    title: recipes[Math.floor(Math.random() * recipes.length)].title,
                                    image: recipes[Math.floor(Math.random() * recipes.length)].image,
                                };
                                suggestionCount++;
                            }
                        } catch (e) {
                            console.warn("[SmartPlan] Failed to fetch suggestion", e);
                        }
                    }
                }
            }
            
            setPlan(next);
        } catch (error) {
            console.error("[SmartPlan] Error:", error);
            alert("Failed to generate smart plan. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate nutrition stats
    const nutritionStats = useMemo(() => {
        let filled = 0;
        let total = 0;
        DAYS_SHORT.forEach(day => {
            MEALS.forEach(meal => {
                total++;
                if (plan[day]?.[meal]) filled++;
            });
        });
        return { filled, empty: total - filled, total, percentage: Math.round((filled / total) * 100) };
    }, [plan]);

    const fillFromFavorites = () => {
        if (favorites.length === 0) return;
        const next = { ...plan };
        let fi = 0;
        DAYS_SHORT.forEach((day) => {
            if (!next[day]) next[day] = emptyDay();
            MEALS.forEach((mealType) => {
                if (!next[day][mealType]) {
                    const fav = favorites[fi % favorites.length];
                    next[day][mealType] = fav ? { id: fav.id, title: fav.title, image: fav.image } : null;
                    fi++;
                }
            });
        });
        setPlan(next);
    };

    const clearAll = () => {
        const emptyPlan = {};
        DAYS_SHORT.forEach(day => {
            emptyPlan[day] = emptyDay();
        });
        setPlan(emptyPlan);
    };

    const generateGroceryList = async () => {
        // Collect all planned recipes across all days and meals
        const allRecipes = [];
        DAYS_SHORT.forEach(day => {
            MEALS.forEach(meal => {
                if (plan[day]?.[meal]) {
                    allRecipes.push(plan[day][meal]);
                }
            });
        });
        
        if (allRecipes.length === 0) return;
        const all = [];
        for (const r of allRecipes) {
            try {
                const info = await getRecipeInformation(r.id);
                const items = (info?.extendedIngredients || []).map((i) => i.original || "").filter(Boolean);
                all.push(...items);
            } catch (e) {
                console.warn("Failed to load ingredients for", r.id, e);
            }
        }
        if (all.length) {
            addMany(all, true); // Keep full quantities
            setOpen(true);
        }
    };

    // Duplicate a day's meals to another day
    const duplicateDay = (fromDayIdx, toDayIdx) => {
        const fromDay = DAYS_SHORT[fromDayIdx];
        const toDay = DAYS_SHORT[toDayIdx];
        const next = { ...plan };
        if (next[fromDay]) {
            next[toDay] = { ...next[fromDay] };
            setPlan(next);
        }
    };

    // Clear a specific day
    const clearDay = (dayIdx) => {
        const day = DAYS_SHORT[dayIdx];
        const next = { ...plan };
        next[day] = emptyDay();
        setPlan(next);
    };

    // Calculate daily stats
    const getDailyStats = useMemo(() => {
        const stats = {};
        DAYS_SHORT.forEach((day, idx) => {
            const meals = plan[day] || emptyDay();
            const filled = Object.values(meals).filter(Boolean).length;
            stats[day] = { filled, total: MEALS.length, percentage: Math.round((filled / MEALS.length) * 100) };
        });
        return stats;
    }, [plan]);

    return (
        <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
            {/* Header with Stats */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        📅 Smart Meal Planner
                    </h1>
                </div>

                {/* Progress Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div>
                                <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                                    Week Progress
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {nutritionStats.percentage}%
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {nutritionStats.filled}/{nutritionStats.total}
                                </p>
                                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">meals planned</p>
                            </div>
                        </div>
                        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${nutritionStats.percentage}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                            />
                        </div>
                    </motion.div>

                    {/* Quick Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg"
                    >
                        <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
                            Quick Stats
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">📅 Days with meals:</span>
                                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                                    {DAYS_SHORT.filter(day => {
                                        const meals = plan[day] || emptyDay();
                                        return Object.values(meals).some(Boolean);
                                    }).length}/7
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">❤️ From favorites:</span>
                                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                                    {DAYS_SHORT.reduce((count, day) => {
                                        const meals = plan[day] || emptyDay();
                                        return count + Object.values(meals).filter(meal => 
                                            meal && favorites.some(fav => fav.id === meal.id)
                                        ).length;
                                    }, 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">🔄 Complete days:</span>
                                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                                    {DAYS_SHORT.filter(day => {
                                        const meals = plan[day] || emptyDay();
                                        return Object.values(meals).every(Boolean);
                                    }).length}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generateSmartPlan}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>🧠 AI Plan My Week</span>
                            </>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fillFromFavorites}
                        disabled={favorites.length === 0}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm sm:text-base font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
                    >
                        <span className="hidden sm:inline">❤️ Fill from Favorites</span>
                        <span className="sm:hidden">❤️ Favorites</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generateGroceryList}
                        disabled={nutritionStats.filled === 0}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
                    >
                        <span className="hidden sm:inline">🛒 Generate Grocery List</span>
                        <span className="sm:hidden">🛒 Grocery</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={clearAll}
                        disabled={nutritionStats.filled === 0}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 text-sm sm:text-base font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-none"
                    >
                        ✕ Clear
                    </motion.button>
                </div>
            </div>

            {/* Meal Grid - One week card per day */}
            <div className="grid gap-3 sm:gap-4">
                {DAYS_SHORT.map((dayKey, dayIdx) => {
                    const dayMeals = plan[dayKey] || emptyDay();
                    const mealEmojis = { breakfast: "🍳", lunch: "🥗", dinner: "🍽️" };
                    const mealColors = { 
                        breakfast: "from-yellow-500 to-orange-500", 
                        lunch: "from-green-500 to-emerald-500", 
                        dinner: "from-purple-500 to-pink-500" 
                    };
                    const mealLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
                    
                    return (
                        <motion.div
                            key={dayKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: dayIdx * 0.05 }}
                            className="rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all overflow-hidden"
                        >
                            {/* Day Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 sm:p-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <h3 className="font-bold text-lg sm:text-xl">{DAYS[dayIdx]}</h3>
                                        <span className="text-xs sm:text-sm opacity-90">
                                            {getDailyStats[dayKey]?.filled || 0}/{MEALS.length} meals
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {/* Quick Actions */}
                                        {dayIdx > 0 && (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => duplicateDay(dayIdx - 1, dayIdx)}
                                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs sm:text-sm font-semibold transition-all touch-manipulation"
                                                title="Copy previous day"
                                            >
                                                📋 Copy
                                            </motion.button>
                                        )}
                                        {getDailyStats[dayKey]?.filled > 0 && (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => clearDay(dayIdx)}
                                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs sm:text-sm font-semibold transition-all touch-manipulation"
                                                title="Clear this day"
                                            >
                                                ✕ Clear
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                                {/* Day Progress Bar */}
                                {getDailyStats[dayKey] && (
                                    <div className="mt-2 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${getDailyStats[dayKey].percentage}%` }}
                                            transition={{ duration: 0.5 }}
                                            className="h-full bg-white rounded-full"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Meals Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
                                {MEALS.map((mealType, mealIdx) => {
                                    const recipe = dayMeals[mealType];
                                    return (
                                        <div key={mealType} className="relative">
                                            {/* Meal Label */}
                                            <div className={`flex items-center gap-2 mb-2 text-xs font-bold text-slate-600 dark:text-slate-400`}>
                                                <span className="text-lg">{mealEmojis[mealType]}</span>
                                                <span>{mealLabels[mealType]}</span>
                                            </div>
                                            
                                            {/* Recipe Card */}
                                            {!recipe ? (
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => navigate("/")}
                                                    className="flex flex-col items-center justify-center h-32 sm:h-40 rounded-lg sm:rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group hover:border-purple-300 dark:hover:border-purple-700 active:border-purple-400 dark:active:border-purple-600 transition-colors cursor-pointer relative touch-manipulation"
                                                >
                                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-purple-500 mb-1 sm:mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tap to add</span>
                                                </motion.div>
                                            ) : (
                                                <div className="flex flex-col h-full relative group">
                                                    {/* Remove Button - Top Right */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setMeal(dayIdx, mealType, null);
                                                        }}
                                                        className="absolute top-1 right-1 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/90 dark:bg-red-600/90 hover:bg-red-600 dark:hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all opacity-80 hover:opacity-100 touch-manipulation"
                                                        title="Remove recipe"
                                                    >
                                                        <span className="text-base sm:text-lg font-bold leading-none">×</span>
                                                    </motion.button>
                                                    
                                                    <Link to={`/recipe/${recipe.id}`} className="block group flex-1">
                                                        <div className="relative overflow-hidden rounded-lg sm:rounded-xl mb-2">
                                                            <img
                                                                src={recipe.image}
                                                                alt=""
                                                                className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <p className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[2.5rem]">
                                                            {recipe.title}
                                                        </p>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
