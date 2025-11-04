import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRecipeInformation } from "../api/spoonacular.js";
import {
    getRecipeViews,
    getTopRecipes,
    getCalorieHistory,
    getMealPlanStats,
    getFavoritesStats,
    getNutritionalInsights,
    getActivitySummary,
} from "../utils/analytics.js";
import { BarChart, LineChart, ProgressRing, DonutChart } from "../components/SimpleChart.jsx";

export default function Analytics() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [topRecipes, setTopRecipes] = useState([]);

    // Analytics data
    const [viewsData, setViewsData] = useState([]);
    const [calorieData, setCalorieData] = useState([]);
    const [mealStats, setMealStats] = useState(null);
    const [favoritesStats, setFavoritesStats] = useState(null);
    const [nutritionalInsights, setNutritionalInsights] = useState(null);
    const [activitySummary, setActivitySummary] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            // Load all analytics data
            const views = getRecipeViews(30);
            setViewsData(views);

            const calories = getCalorieHistory(30);
            setCalorieData(calories);

            setMealStats(getMealPlanStats());
            setFavoritesStats(getFavoritesStats());
            setNutritionalInsights(getNutritionalInsights());
            setActivitySummary(getActivitySummary());

            // Load top recipes with full data
            const top = getTopRecipes(10);
            const recipesWithData = await Promise.all(
                top.map(async (item) => {
                    try {
                        const recipe = await getRecipeInformation(parseInt(item.recipeId));
                        return {
                            ...item,
                            recipe: recipe || null,
                        };
                    } catch {
                        return { ...item, recipe: null };
                    }
                })
            );
            setTopRecipes(recipesWithData);
        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        return {
            dailyViews: viewsData.slice(-7).map((v) => ({
                label: new Date(v.date).toLocaleDateString("en-US", { weekday: "short" }),
                value: v.total,
            })),
            dailyCalories: calorieData.slice(-7).map((c) => ({
                label: new Date(c.date).toLocaleDateString("en-US", { weekday: "short" }),
                value: c.calories,
            })),
            weeklyViews: viewsData.map((v) => ({
                label: new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                value: v.total,
            })),
            weeklyCalories: calorieData.map((c) => ({
                label: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                value: c.calories,
            })),
        };
    }, [viewsData, calorieData]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 rounded-md bg-emerald-600 text-white"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: "📊" },
        { id: "calories", label: "Calories", icon: "🔥" },
        { id: "recipes", label: "Recipes", icon: "🍽️" },
        { id: "nutrition", label: "Nutrition", icon: "🥗" },
        { id: "activity", label: "Activity", icon: "⚡" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate("/")}
                        className="mb-4 text-emerald-600 hover:underline flex items-center gap-2"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-4xl font-bold mb-2">Analytics & Insights</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Comprehensive data visualization and insights about your cooking journey
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? "bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading analytics...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                                    >
                                        <div className="text-3xl font-bold text-emerald-600">{mealStats?.totalMeals || 0}</div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Planned Meals</div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                                    >
                                        <div className="text-3xl font-bold text-blue-600">{favoritesStats?.total || 0}</div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Favorites</div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                                    >
                                        <div className="text-3xl font-bold text-purple-600">
                                            {nutritionalInsights?.avgCalories || 0}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Avg Daily Calories</div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                                    >
                                        <div className="text-3xl font-bold text-pink-600">
                                            {activitySummary?.totalInteractions || 0}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Interactions (30d)</div>
                                    </motion.div>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Recipe Views */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-lg font-bold mb-4">Recipe Views (Last 7 Days)</h3>
                                        <BarChart data={chartData.dailyViews} height={200} color="blue" />
                                    </div>

                                    {/* Calorie Intake */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-lg font-bold mb-4">Calorie Intake (Last 7 Days)</h3>
                                        <LineChart data={chartData.dailyCalories} height={200} color="purple" />
                                    </div>
                                </div>

                                {/* Meal Plan Distribution */}
                                {mealStats && mealStats.totalMeals > 0 && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-lg font-bold mb-4">Meal Plan Distribution</h3>
                                        <div className="flex items-center justify-center">
                                            <DonutChart
                                                data={[
                                                    { label: "Breakfast", value: mealStats.breakfast },
                                                    { label: "Lunch", value: mealStats.lunch },
                                                    { label: "Dinner", value: mealStats.dinner },
                                                ].filter((d) => d.value > 0)}
                                                size={250}
                                            />
                                        </div>
                                        <div className="flex justify-center gap-6 mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                                                <span className="text-sm">Breakfast: {mealStats.breakfast}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                                <span className="text-sm">Lunch: {mealStats.lunch}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                                <span className="text-sm">Dinner: {mealStats.dinner}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Calories Tab */}
                        {activeTab === "calories" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Calorie Summary */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4">Calorie Overview</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-emerald-600">
                                                {nutritionalInsights?.avgCalories || 0}
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Average Daily</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {nutritionalInsights?.maxCalories || 0}
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Maximum</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {nutritionalInsights?.minCalories || 0}
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Minimum</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calorie Chart */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4">30-Day Calorie History</h3>
                                    <LineChart data={chartData.weeklyCalories} height={300} color="purple" />
                                </div>

                                {/* Daily Breakdown */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4">Daily Calorie Breakdown</h3>
                                    <div className="space-y-2">
                                        {calorieData.slice(-7).reverse().map((day, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <div>
                                                    <div className="font-semibold">
                                                        {new Date(day.date).toLocaleDateString("en-US", {
                                                            weekday: "long",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                                        {day.meals} meal{day.meals !== 1 ? "s" : ""}
                                                    </div>
                                                </div>
                                                <div className="text-xl font-bold text-purple-600">{day.calories}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Recipes Tab */}
                        {activeTab === "recipes" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Recipe Views Chart */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4">Recipe Views (Last 30 Days)</h3>
                                    <BarChart data={chartData.weeklyViews.slice(-14)} height={300} color="blue" />
                                </div>

                                {/* Top Recipes */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4">Most Viewed Recipes</h3>
                                    {topRecipes.length > 0 ? (
                                        <div className="space-y-3">
                                            {topRecipes.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                    onClick={() => item.recipe && navigate(`/recipe/${item.recipeId}`)}
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-semibold">
                                                                {item.recipe?.title || `Recipe ${item.recipeId}`}
                                                            </div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                                {item.count} view{item.count !== 1 ? "s" : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {item.recipe?.image && (
                                                        <img
                                                            src={item.recipe.image}
                                                            alt={item.recipe.title}
                                                            className="w-16 h-16 rounded-lg object-cover"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                                            No recipe views yet. Start exploring recipes!
                                        </p>
                                    )}
                                </div>

                                {/* Favorites Stats */}
                                {favoritesStats && favoritesStats.total > 0 && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-lg font-bold mb-4">Favorites Statistics</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <div className="text-3xl font-bold text-emerald-600">{favoritesStats.total}</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-400">Total Favorites</div>
                                            </div>
                                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <div className="text-3xl font-bold text-blue-600">{favoritesStats.rated}</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-400">Rated</div>
                                            </div>
                                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {favoritesStats.avgRating.toFixed(1)}
                                                </div>
                                                <div className="text-sm text-slate-600 dark:text-slate-400">Avg Rating</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Nutrition Tab */}
                        {activeTab === "nutrition" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4">Nutritional Insights</h2>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Track your nutritional progress and patterns
                                    </p>
                                    {/* Add more nutrition-specific analytics here */}
                                </div>
                            </motion.div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === "activity" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4">Activity Summary</h2>
                                    {activitySummary && (
                                        <div className="space-y-4">
                                            <div className="text-3xl font-bold text-emerald-600">
                                                {activitySummary.totalInteractions}
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                                Total interactions in the last 30 days
                                            </div>
                                            {Object.keys(activitySummary.byType).length > 0 && (
                                                <div>
                                                    <h3 className="font-semibold mb-2">By Type:</h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(activitySummary.byType).map(([type, count]) => (
                                                            <div
                                                                key={type}
                                                                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
                                                            >
                                                                <span className="capitalize">{type}</span>
                                                                <span className="font-semibold">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

