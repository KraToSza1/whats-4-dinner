import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGroceryList } from "../context/GroceryListContext.jsx";
import { getRecipeInformation } from "../api/spoonacular.js";
import { searchRecipes } from "../api/spoonacular.js";

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

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            {/* Header with Stats */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        📅 Smart Meal Planner
                    </h1>
                </div>

                {/* Progress Card */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                                Week Progress
                            </p>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {nutritionStats.percentage}%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {nutritionStats.filled}/{nutritionStats.total}
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">meals planned</p>
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

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateSmartPlan}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fillFromFavorites}
                        disabled={favorites.length === 0}
                        className="px-4 py-3 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50"
                    >
                        ❤️ Fill from Favorites
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateGroceryList}
                        disabled={nutritionStats.filled === 0}
                        className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        🛒 Generate Grocery List
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearAll}
                        disabled={nutritionStats.filled === 0}
                        className="px-4 py-3 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                    >
                        ✕ Clear All
                    </motion.button>
                </div>
            </div>

            {/* Meal Grid - One week card per day */}
            <div className="grid gap-4">
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
                            className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all overflow-hidden"
                        >
                            {/* Day Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                                <h3 className="font-bold text-xl">{DAYS[dayIdx]}</h3>
                            </div>
                            
                            {/* Meals Grid */}
                            <div className="grid sm:grid-cols-3 gap-4 p-4">
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
                                                <div className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer relative">
                                                    <svg className="w-8 h-8 text-slate-400 group-hover:text-purple-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <Link to={`/recipe/${recipe.id}`} className="block group">
                                                    <div className="relative overflow-hidden rounded-xl mb-2">
                                                        <img
                                                            src={recipe.image}
                                                            alt=""
                                                            className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <p className="text-xs font-semibold line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                                                        {recipe.title}
                                                    </p>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setMeal(dayIdx, mealType, null);
                                                        }}
                                                        className="w-full px-2 py-1 text-xs rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-semibold transition-colors"
                                                    >
                                                        Remove
                                                    </motion.button>
                                                </Link>
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
