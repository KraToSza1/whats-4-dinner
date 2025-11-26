import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics.js';
import { getRecipeCollectionsForRecipe } from '../utils/recipeCollections.js';
import {
  getLastMadeDate,
  getMakeCount,
  getSuccessRate,
  getAverageRating,
} from '../utils/recipeHistory.js';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { RecipeImageZoom } from './animations/FoodAnimations.jsx';
import { RecipeCardGlow } from './animations/FoodParticles.jsx';
import { useState, memo } from 'react';

function RecipeCard({ recipe, onFavorite, isFavorite, index = 0 }) {
  // Only log renders in dev mode and limit frequency to prevent spam
  if (import.meta.env.DEV) {
    const logKey = `recipe-card-render-${recipe?.id}`;
    const lastLog = sessionStorage.getItem(logKey);
    const now = Date.now();
  }

  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const id = recipe?.id;
  const title = recipe?.title || 'Recipe';
  // Calculate readyInMinutes consistently: prep + cook (same as DailyRecipe)
  const prep = Number(recipe?.prepMinutes) || 0;
  const cook = Number(recipe?.cookMinutes) || 0;
  const minutes = prep + cook || Number(recipe?.readyInMinutes) || null;

  // Get collections for this recipe
  const collections = id ? getRecipeCollectionsForRecipe(id) : [];

  // Get history info
  const lastMade = id ? getLastMadeDate(id) : null;
  const makeCount = id ? getMakeCount(id) : 0;
  const successRate = id ? getSuccessRate(id) : null;
  const avgRating = id ? getAverageRating(id) : null;

  // Calculate difficulty badge - use database difficulty first, fall back to time-based
  const getDifficultyBadge = () => {
    // First, try to use the database difficulty field
    const dbDifficulty = recipe?.difficulty?.toLowerCase();

    if (dbDifficulty) {
      // Map database difficulty values to display
      const difficultyMap = {
        easy: { label: 'Easy', color: 'blue', emoji: '👌' },
        medium: { label: 'Medium', color: 'amber', emoji: '👨‍🍳' },
        hard: { label: 'Advanced', color: 'red', emoji: '🔥' },
        quick: { label: 'Quick', color: 'emerald', emoji: '⚡' },
        advanced: { label: 'Advanced', color: 'red', emoji: '🔥' },
      };

      const mapped = difficultyMap[dbDifficulty];
      if (mapped) {
        return mapped;
      }
    }

    // Fall back to time-based calculation if no database difficulty
    if (!minutes) return null;
    if (minutes <= 15) return { label: 'Quick', color: 'emerald', emoji: '⚡' };
    if (minutes <= 30) return { label: 'Easy', color: 'blue', emoji: '👌' };
    if (minutes <= 60) return { label: 'Medium', color: 'amber', emoji: '👨‍🍳' };
    return { label: 'Advanced', color: 'red', emoji: '🔥' };
  };

  const difficultyBadge = getDifficultyBadge();

  const handleOpen = () => {
    if (!id) {
      console.warn('⚠️ [RECIPE CARD] No ID, cannot navigate');
      return;
    }
    triggerHaptic('light');
    navigate(`/recipe/${id}`, { state: { recipe } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm hover:shadow-xl transition-all relative"
      onClick={handleOpen}
      role="button"
      aria-label={`View recipe: ${title}`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      <RecipeCardGlow isHovered={isHovered} />
      <div className="relative overflow-hidden">
        <RecipeImageZoom isHovered={isHovered}>
          <img
            src={recipeImg(recipe?.hero_image_url || recipe?.image, recipe?.id)}
            data-original-src={recipe?.hero_image_url || recipe?.image}
            alt={title}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            referrerPolicy="no-referrer"
            onError={e => {
              console.error('🖼️ [RECIPE CARD] Image failed to load', {
                id,
                src: e.currentTarget.src,
                originalSrc: e.currentTarget.getAttribute('data-original-src'),
                title,
              });
              fallbackOnce(e);
            }}
            onLoad={() => {
              // Image loaded successfully
            }}
            onLoadStart={() => {}}
            className="w-full aspect-[4/3] object-cover bg-slate-200 dark:bg-slate-700 transition-transform duration-500"
          />
        </RecipeImageZoom>

        {/* Favorite button with enhanced animation */}
        <motion.button
          onClick={e => {
            e.stopPropagation();
            triggerHaptic(isFavorite ? 'error' : 'success');
            onFavorite?.();
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          animate={
            isFavorite
              ? {
                  scale: [1, 1.2, 1],
                  transition: { duration: 0.3 },
                }
              : {}
          }
          aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
          aria-pressed={isFavorite}
          tabIndex={0}
          className="absolute top-1.5 xs:top-2 right-1.5 xs:right-2 z-10 inline-flex items-center justify-center w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-slate-900/90 shadow-lg border-2 border-slate-200 dark:border-slate-700 backdrop-blur-sm transition-all touch-manipulation min-h-[44px] xs:min-h-0"
          title="Toggle favorite"
        >
          <motion.span
            animate={
              isFavorite
                ? {
                    scale: [1, 1.4, 1],
                    rotate: [0, -15, 15, 0],
                  }
                : {}
            }
            transition={{ duration: 0.5, ease: 'easeOut' }}
            aria-hidden
            className={`text-base xs:text-lg sm:text-xl ${isFavorite ? 'text-rose-500' : 'text-slate-400'}`}
          >
            {isFavorite ? '❤️' : '🤍'}
          </motion.span>
          {isFavorite && (
            <motion.div
              className="absolute inset-0 rounded-full bg-rose-500/20"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 0.4 }}
            />
          )}
        </motion.button>

        {/* Badges */}
        <div className="absolute bottom-1.5 xs:bottom-2 left-1.5 xs:left-2 flex flex-wrap gap-1.5 xs:gap-2 max-w-[calc(100%-4rem)]">
          {typeof minutes === 'number' && minutes > 0 && (
            <span className="text-[10px] xs:text-xs font-semibold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
              ⏱ {minutes} min
            </span>
          )}
          {difficultyBadge && (
            <span
              className={`text-[10px] xs:text-xs font-semibold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md backdrop-blur-sm ${
                difficultyBadge.color === 'emerald'
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                  : difficultyBadge.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                    : difficultyBadge.color === 'amber'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
              }`}
            >
              {difficultyBadge.emoji} {difficultyBadge.label}
            </span>
          )}
          {collections.length > 0 && (
            <span className="text-[10px] xs:text-xs font-semibold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700 backdrop-blur-sm">
              📁 {collections.length}
            </span>
          )}
          {makeCount > 0 && (
            <span className="text-[10px] xs:text-xs font-semibold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 backdrop-blur-sm">
              ✓ {makeCount}x
            </span>
          )}
          {avgRating && (
            <span className="text-[10px] xs:text-xs font-semibold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700 backdrop-blur-sm">
              ⭐ {avgRating.average.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5 xs:p-3 sm:p-4">
        <h3 className="text-xs xs:text-sm sm:text-base font-semibold line-clamp-2 leading-tight break-words">
          {title}
        </h3>
      </div>
    </motion.div>
  );
}

// Memoize RecipeCard to prevent unnecessary re-renders
export default memo(RecipeCard, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.recipe?.id === nextProps.recipe?.id &&
    prevProps.recipe?.title === nextProps.recipe?.title &&
    prevProps.recipe?.image === nextProps.recipe?.image &&
    prevProps.recipe?.hero_image_url === nextProps.recipe?.hero_image_url &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.index === nextProps.index
  );
});
