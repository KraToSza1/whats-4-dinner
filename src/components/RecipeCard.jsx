import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { triggerHaptic } from "../utils/haptics.js";
import { getRecipeCollectionsForRecipe } from "../utils/recipeCollections.js";
import { getLastMadeDate, getMakeCount, getSuccessRate, getAverageRating } from "../utils/recipeHistory.js";

const placeholderSVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#e2e8f0'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#475569' font-family='sans-serif' font-size='16'>Recipe image</text>
    </svg>`
    );

export default function RecipeCard({ recipe, onFavorite, isFavorite, index = 0 }) {
    const navigate = useNavigate();
    const id = recipe?.id;
    const title = recipe?.title || "Recipe";
    const minutes = recipe?.readyInMinutes;
    
    // Get collections for this recipe
    const collections = id ? getRecipeCollectionsForRecipe(id) : [];
    
    // Get history info
    const lastMade = id ? getLastMadeDate(id) : null;
    const makeCount = id ? getMakeCount(id) : 0;
    const successRate = id ? getSuccessRate(id) : null;
    const avgRating = id ? getAverageRating(id) : null;
    
    // Calculate difficulty badge
    const getDifficultyBadge = () => {
        if (!recipe?.readyInMinutes) return null;
        if (recipe.readyInMinutes <= 15) return { label: "Quick", color: "emerald", emoji: "⚡" };
        if (recipe.readyInMinutes <= 30) return { label: "Easy", color: "blue", emoji: "👌" };
        if (recipe.readyInMinutes <= 60) return { label: "Medium", color: "amber", emoji: "👨‍🍳" };
        return { label: "Advanced", color: "red", emoji: "🔥" };
    };
    
    const difficultyBadge = getDifficultyBadge();

    const handleOpen = () => {
        if (!id) return;
        triggerHaptic("light");
        navigate(`/recipe/${id}`, { state: { recipe } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm hover:shadow-md transition"
            onClick={handleOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpen();
                }
            }}
            aria-label={`Open recipe: ${title}`}
        >
            <div className="relative">
                <img
                    src={recipe?.image || placeholderSVG}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    onError={(e) => {
                        if (e.currentTarget.src !== placeholderSVG) {
                            e.currentTarget.src = placeholderSVG;
                        }
                    }}
                    className="w-full aspect-[4/3] object-cover bg-slate-200 dark:bg-slate-700"
                />

                {/* Favorite button */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(isFavorite ? "error" : "success");
                        onFavorite?.();
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    animate={isFavorite ? { 
                        scale: [1, 1.2, 1],
                        transition: { duration: 0.3 }
                    } : {}}
                    aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
                    aria-pressed={!!isFavorite}
                    className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/70 shadow border border-slate-200 dark:border-slate-700 transition"
                    title="Toggle favorite"
                >
                    <motion.span
                        animate={isFavorite ? {
                            scale: [1, 1.3, 1],
                            rotate: [0, -10, 10, 0]
                        } : {}}
                        transition={{ duration: 0.4 }}
                        aria-hidden
                        className={isFavorite ? "text-rose-500" : "text-slate-500"}
                    >
                        ❤
                    </motion.span>
                </motion.button>

                {/* Badges */}
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 max-w-[calc(100%-4rem)]">
                    {typeof minutes === "number" && minutes > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                            ⏱ {minutes} min
                        </span>
                    )}
                    {difficultyBadge && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-sm ${
                            difficultyBadge.color === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700" :
                            difficultyBadge.color === "blue" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700" :
                            difficultyBadge.color === "amber" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700" :
                            "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700"
                        }`}>
                            {difficultyBadge.emoji} {difficultyBadge.label}
                        </span>
                    )}
                    {collections.length > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700 backdrop-blur-sm">
                            📁 {collections.length}
                        </span>
                    )}
                    {makeCount > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 backdrop-blur-sm">
                            ✓ {makeCount}x
                        </span>
                    )}
                    {avgRating && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700 backdrop-blur-sm">
                            ⭐ {avgRating.average.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-3">
                <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
            </div>
        </motion.div>
    );
}