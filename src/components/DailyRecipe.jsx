import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { searchRecipes } from "../api/spoonacular.js";
import { triggerHaptic } from "../utils/haptics.js";
import CookingAnimation from "./CookingAnimation.jsx";

export default function DailyRecipe({ onRecipeSelect }) {
    const navigate = useNavigate();
    const [dailyRecipe, setDailyRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [streak, setStreak] = useState(() => {
        try {
            return parseInt(localStorage.getItem("dailyStreak") || "0", 10);
        } catch {
            return 0;
        }
    });

    useEffect(() => {
        let ignore = false;
        const fetchDailyRecipe = async () => {
            try {
                // Check if we already have a daily recipe cached
                const cached = localStorage.getItem("dailyRecipe");
                const cachedDate = localStorage.getItem("dailyRecipeDate");
                const today = new Date().toDateString();

                if (cached && cachedDate === today) {
                    const parsed = JSON.parse(cached);
                    if (!ignore) {
                        setDailyRecipe(parsed);
                        setLoading(false);
                    }
                    return;
                }

                // Fetch a random recipe
                const result = await searchRecipes({
                    query: "",
                    number: 50,
                });

                const recipes = Array.isArray(result) ? result : result?.results || [];
                
                if (recipes.length === 0) {
                    throw new Error("No recipes found");
                }

                // Pick a random recipe
                const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
                
                // Cache it
                localStorage.setItem("dailyRecipe", JSON.stringify(randomRecipe));
                localStorage.setItem("dailyRecipeDate", today);

                if (!ignore) {
                    setDailyRecipe(randomRecipe);
                    setLoading(false);
                }
            } catch (err) {
                console.error("[DailyRecipe]", err);
                if (!ignore) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchDailyRecipe();

        return () => {
            ignore = true;
        };
    }, []);

    const handleClick = () => {
        if (dailyRecipe) {
            triggerHaptic("light");
            
            // Track interaction for streak
            const lastCheck = localStorage.getItem("lastDailyCheck");
            const today = new Date().toDateString();
            
            if (lastCheck !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();
                
                if (lastCheck === yesterdayStr) {
                    // Continue streak
                    const newStreak = streak + 1;
                    setStreak(newStreak);
                    localStorage.setItem("dailyStreak", String(newStreak));
                } else {
                    // Reset streak
                    setStreak(1);
                    localStorage.setItem("dailyStreak", "1");
                }
                
                localStorage.setItem("lastDailyCheck", today);
            }
            
            navigate(`/recipe/${dailyRecipe.id}`, { state: { recipe: dailyRecipe } });
            onRecipeSelect?.(dailyRecipe);
        }
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl"
            >
                <div className="flex items-center justify-center h-32">
                    <p className="text-white/80 animate-pulse">Loading your daily inspiration...</p>
                </div>
            </motion.div>
        );
    }

    if (error || !dailyRecipe) {
        return null;
    }

    const badgeEmoji = streak >= 7 ? "🔥" : streak >= 3 ? "⭐" : "✨";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl cursor-pointer"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Cooking Animation */}
            <div className="absolute top-4 right-4 opacity-30">
                <CookingAnimation type="chef" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>

            <div className="relative flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎲</span>
                        <h2 className="text-xl font-bold text-white">Daily Recipe Surprise</h2>
                        {streak > 0 && (
                            <span className="text-sm px-2 py-0.5 rounded-full bg-white/20 text-white">
                                {badgeEmoji} {streak} day{streak !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                    <p className="text-white/90 font-semibold text-lg line-clamp-2">
                        {dailyRecipe.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        {dailyRecipe.readyInMinutes && (
                            <span className="text-white/80 text-sm">
                                ⏱️ {dailyRecipe.readyInMinutes} min
                            </span>
                        )}
                        {dailyRecipe.servings && (
                            <span className="text-white/80 text-sm">
                                🍽️ {dailyRecipe.servings} servings
                            </span>
                        )}
                    </div>
                </div>

                {/* Image */}
                {dailyRecipe.image && (
                    <motion.img
                        src={dailyRecipe.image}
                        alt={dailyRecipe.title}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover shadow-lg ring-2 ring-white/20"
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        transition={{ duration: 0.2 }}
                    />
                )}

                {/* Arrow */}
                <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="hidden sm:block text-white text-2xl"
                >
                    →
                </motion.div>
            </div>

            {/* Streak notification */}
            {streak > 0 && streak % 5 === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 font-bold text-xs shadow-lg"
                >
                    🔥 Milestone!
                </motion.div>
            )}
        </motion.div>
    );
}

