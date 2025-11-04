import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const reset = () => {
        setDiet("");
        setIntolerances("");
        setMaxTime("");
        setMealType("");
        setMaxCalories("");
        setHealthScore("");
    };

    const setPreset = (mins) => setMaxTime(String(mins));

    const hasActiveFilters = diet || intolerances || maxTime || mealType || maxCalories || healthScore;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 sm:mt-6"
        >
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                            <span className="text-xl">⚙️</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                                Filter Recipes
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                Refine your search
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={reset}
                                className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                                Clear All
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <svg
                                className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </motion.button>
                    </div>
                </div>

                {/* Main Filters - Always Visible */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                    {/* Meal Type */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                        <label className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🍽️</span>
                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Meal Type</span>
                            </div>
                            <select
                                value={mealType}
                                onChange={(e) => setMealType(e.target.value)}
                                className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                            >
                                {MEAL_TYPES.map((m) => (
                                    <option key={m} value={m}>
                                        {m ? m.charAt(0).toUpperCase() + m.slice(1) : "Any Meal"}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </motion.div>

                    {/* Diet */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                        <label className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🥗</span>
                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Diet</span>
                            </div>
                            <select
                                value={diet}
                                onChange={(e) => setDiet(e.target.value)}
                                className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                            >
                                {DIETS.map((d) => (
                                    <option key={d} value={d}>
                                        {d ? d.charAt(0).toUpperCase() + d.slice(1) : "Any Diet"}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </motion.div>

                    {/* Intolerances */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                    >
                        <label className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⚠️</span>
                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Intolerances</span>
                            </div>
                            <select
                                value={intolerances}
                                onChange={(e) => setIntolerances(e.target.value)}
                                className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                            >
                                {INTOLERANCES.map((i) => (
                                    <option key={i} value={i}>
                                        {i ? i.charAt(0).toUpperCase() + i.slice(1) : "No Restrictions"}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </motion.div>
                </div>

                {/* Quick Time Presets */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quick time:</span>
                    {[15, 30, 45, 60].map((m) => (
                        <motion.button
                            key={m}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setPreset(m)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                                maxTime === String(m)
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600"
                            }`}
                        >
                            {m}m
                        </motion.button>
                    ))}
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-lg">💚</span>
                                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                                        Health & Nutrition
                                    </h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Max Time */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                                    >
                                        <label className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">⏱️</span>
                                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                                                    Max Time (min)
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 30"
                                                value={maxTime}
                                                onChange={(e) => setMaxTime(e.target.value)}
                                                className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                                            />
                                        </label>
                                    </motion.div>

                                    {/* Max Calories */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                                    >
                                        <label className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🔥</span>
                                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                                                    Max Calories
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 500"
                                                value={maxCalories}
                                                onChange={(e) => setMaxCalories(e.target.value)}
                                                className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                                            />
                                        </label>
                                    </motion.div>

                                    {/* Health Score */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm sm:col-span-2"
                                    >
                                        <label className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🏥</span>
                                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                                                    Min Health Score (0-100)
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="e.g. 70"
                                                value={healthScore}
                                                onChange={(e) => setHealthScore(e.target.value)}
                                                className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                                            />
                                        </label>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
