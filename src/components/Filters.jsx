import React from "react";
import { motion } from "framer-motion";

const DIETS = [
    "",
    "vegan",
    "vegetarian",
    "pescetarian",
    "paleo",
    "primal",
    "whole30",
    "keto",
    "ketogenic",
    "gluten free",
    "low fodmap",
    "dash",
];
const INTOLERANCES = [
    "",
    "dairy",
    "egg",
    "gluten",
    "grain",
    "peanut",
    "seafood",
    "sesame",
    "shellfish",
    "soy",
    "sulfite",
    "tree nut",
    "wheat",
];

const MEAL_TYPES = [
    "",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "appetizer",
    "dessert",
];

const HEALTH_OPTIONS = [
    "",
    "health",
    "low-sugar",
    "low-sodium",
    "low-fat",
    "low-carb",
];

export default function Filters({
                                    diet,
                                    setDiet,
                                    intolerances,
                                    setIntolerances,
                                    maxTime,
                                    setMaxTime,
                                    mealType,
                                    setMealType,
                                    maxCalories,
                                    setMaxCalories,
                                    healthScore,
                                    setHealthScore,
                                }) {
    const reset = () => {
        setDiet("");
        setIntolerances("");
        setMaxTime("");
        setMealType("");
        setMaxCalories("");
        setHealthScore("");
    };

    const setPreset = (mins) => setMaxTime(String(mins));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 sm:mt-6"
        >
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">⚙️</span>
                    <h3 className="font-bold text-base sm:text-lg">Filter Recipes</h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🍽️</span>
                            <span className="font-semibold text-sm">Meal Type</span>
                        </div>
                        <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 focus:ring-emerald-500 focus:outline-none transition-all text-sm sm:text-base shadow-sm font-medium"
                            title="Filter by meal type"
                        >
                            {MEAL_TYPES.map((m) => (
                                <option key={m} value={m}>
                                    {m ? m.charAt(0).toUpperCase() + m.slice(1) : "Any"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🥗</span>
                            <span className="font-semibold text-sm">Diet</span>
                        </div>
                        <select
                            value={diet}
                            onChange={(e) => setDiet(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 focus:ring-emerald-500 focus:outline-none transition-all text-sm sm:text-base shadow-sm font-medium"
                            title="Choose a diet preference"
                        >
                            {DIETS.map((d) => (
                                <option key={d} value={d}>
                                    {d || "Any"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span className="font-semibold text-sm">Intolerances</span>
                        </div>
                        <select
                            value={intolerances}
                            onChange={(e) => setIntolerances(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 focus:ring-emerald-500 focus:outline-none transition-all text-sm sm:text-base shadow-sm font-medium"
                            title="Exclude recipes containing this ingredient"
                        >
                            {INTOLERANCES.map((i) => (
                                <option key={i} value={i}>
                                    {i || "None"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⏱️</span>
                            <span className="font-semibold text-sm">Max Time</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            placeholder="e.g. 20"
                            value={maxTime}
                            onChange={(e) => setMaxTime(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 focus:ring-emerald-500 focus:outline-none transition-all text-sm sm:text-base shadow-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            title="Only show recipes under this time"
                        />
                    </label>
                </div>

                {/* Health & Nutrition Filters */}
                <div className="mt-6 pt-6 border-t border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">💚</span>
                        <h3 className="font-bold text-base sm:text-lg">Health & Nutrition</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔥</span>
                                <span className="font-semibold text-sm">Max Calories</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                placeholder="e.g. 500"
                                value={maxCalories}
                                onChange={(e) => setMaxCalories(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 focus:ring-emerald-500 focus:outline-none transition-all text-sm sm:text-base shadow-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                title="Maximum calories per serving"
                            />
                        </label>

                        <label className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏥</span>
                                <span className="font-semibold text-sm">Health Score</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="min: 70"
                                value={healthScore}
                                onChange={(e) => setHealthScore(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 focus:ring-emerald-500 focus:outline-none transition-all text-sm sm:text-base shadow-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                title="Minimum health score (0-100)"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* helper row */}
            <div className="mt-4 flex items-center gap-3 text-xs sm:text-sm flex-wrap">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Quick time:</span>
                {[15, 30, 45].map((m) => (
                    <motion.button
                        key={m}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setPreset(m)}
                        className="px-4 py-2 rounded-full border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 transition-all font-medium shadow-sm"
                        title={`Set max time to ${m} minutes`}
                    >
                        {m}m
                    </motion.button>
                ))}
                <span className="mx-1 opacity-40">•</span>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={reset}
                    className="px-4 py-2 rounded-full border-2 border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 transition-all font-medium text-red-600 dark:text-red-400 shadow-sm"
                    title="Reset all filters"
                >
                    ✕ Reset All
                </motion.button>
            </div>
        </motion.div>
    );
}
