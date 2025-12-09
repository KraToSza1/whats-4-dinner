import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSupabaseRandomRecipe } from '../api/supabaseRecipes.js';
import { triggerHaptic } from '../utils/haptics.js';
import CookingAnimation from './CookingAnimation.jsx';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { LoadingFoodAnimation } from './LottieFoodAnimations.jsx';
import { RotatingFoodLoader } from './FoodLoaders.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import {
  safeLocalStorage,
  safeJSONParse,
  safeJSONStringify,
} from '../utils/browserCompatibility.js';

export default function DailyRecipe({ onRecipeSelect }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAdmin } = useAdmin(); // Get admin status
  const [dailyRecipe, setDailyRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const hasLoadedTodayRef = useRef(false);
  // Removed: failedRecipeIds and refreshAttempts - no longer needed since we disabled image error refresh logic
  const [streak, setStreak] = useState(() => {
    try {
      return parseInt(safeLocalStorage.getItem('dailyStreak') || '0', 10);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    // CRITICAL: Check localStorage SYNCHRONOUSLY before any async operations
    const today = new Date().toDateString();
    let cached = null;
    let cachedDate = null;

    try {
      cached = safeLocalStorage.getItem('dailyRecipe');
      cachedDate = safeLocalStorage.getItem('dailyRecipeDate');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [DAILY RECIPE] Error reading localStorage:', err);
      }
    }

    // If we have a cached recipe for today, use it IMMEDIATELY and return
    if (cached && cachedDate === today) {
      try {
        const parsed = JSON.parse(cached);

        // Validate that parsed recipe has required fields
        if (!parsed || !parsed.id || !parsed.title) {
          throw new Error('Invalid cached recipe structure');
        }

        // CRITICAL: Only show recipes with complete nutrition
        // If cached recipe doesn't have has_complete_nutrition flag, clear cache and fetch new one
        if (parsed.has_complete_nutrition === false || parsed.hasCompleteNutrition === false) {
          if (import.meta.env.DEV) {
            console.warn(
              '⚠️ [DAILY RECIPE] Cached recipe missing complete nutrition, clearing cache:',
              parsed.id
            );
          }
          throw new Error('Cached recipe missing complete nutrition');
        }

        // Normalize field names for consistency
        if (!parsed.prepMinutes && parsed.prep_minutes !== undefined) {
          parsed.prepMinutes = Number(parsed.prep_minutes) || 0;
        }
        if (!parsed.cookMinutes && parsed.cook_minutes !== undefined) {
          parsed.cookMinutes = Number(parsed.cook_minutes) || 0;
        }

        // Ensure numeric values
        parsed.prepMinutes = Number(parsed.prepMinutes) || 0;
        parsed.cookMinutes = Number(parsed.cookMinutes) || 0;

        // Recalculate readyInMinutes to ensure consistency
        const prep = parsed.prepMinutes;
        const cook = parsed.cookMinutes;
        const calculatedReady = prep + cook;
        parsed.readyInMinutes = calculatedReady || null;

        // Ensure image URLs are correct
        if (!parsed.heroImageUrl && parsed.image) {
          parsed.heroImageUrl = parsed.image;
        }
        if (!parsed.image && parsed.heroImageUrl) {
          parsed.image = parsed.heroImageUrl;
        }
        if (!parsed.heroImageUrl && !parsed.image && parsed.hero_image_url) {
          parsed.heroImageUrl = parsed.hero_image_url;
          parsed.image = parsed.hero_image_url;
        }

        // Set the recipe immediately and mark as loaded - NO FETCHING
        setDailyRecipe(parsed);
        setLoading(false);
        hasLoadedTodayRef.current = true;
        isFetchingRef.current = false;
        return; // CRITICAL: Exit early - don't fetch a new recipe
      } catch (err) {
        // If parsing fails, clear bad cache and continue to fetch
        if (import.meta.env.DEV) {
          console.warn('⚠️ [DAILY RECIPE] Error parsing cached recipe, clearing cache:', err);
        }
        try {
          safeLocalStorage.removeItem('dailyRecipe');
          safeLocalStorage.removeItem('dailyRecipeDate');
        } catch (_clearErr) {
          // Ignore clear errors
        }
      }
    }

    // Only fetch if we don't have a valid cached recipe for today
    let ignore = false;
    let mounted = true;
    isFetchingRef.current = true;

    const fetchDailyRecipe = async () => {
      try {
        // Triple-check cache wasn't set while we were waiting (shouldn't happen, but safety check)
        const recheckCached = safeLocalStorage.getItem('dailyRecipe');
        const recheckCachedDate = safeLocalStorage.getItem('dailyRecipeDate');
        const recheckToday = new Date().toDateString();

        if (recheckCached && recheckCachedDate === recheckToday && mounted && !ignore) {
          const parsed = JSON.parse(recheckCached);

          // CRITICAL: Only show recipes with complete nutrition
          // If cached recipe doesn't have has_complete_nutrition flag, skip cache and fetch new one
          if (parsed.has_complete_nutrition === false || parsed.hasCompleteNutrition === false) {
            if (import.meta.env.DEV) {
              console.warn(
                '⚠️ [DAILY RECIPE] Recheck: Cached recipe missing complete nutrition, fetching new:',
                parsed.id
              );
            }
            // Clear bad cache and continue to fetch
            try {
              localStorage.removeItem('dailyRecipe');
              localStorage.removeItem('dailyRecipeDate');
            } catch (_clearErr) {
              // Ignore clear errors
            }
            // Continue to fetch new recipe below
          } else {
            // Normalize field names for consistency
            if (!parsed.prepMinutes && parsed.prep_minutes !== undefined) {
              parsed.prepMinutes = Number(parsed.prep_minutes) || 0;
            }
            if (!parsed.cookMinutes && parsed.cook_minutes !== undefined) {
              parsed.cookMinutes = Number(parsed.cook_minutes) || 0;
            }

            // Ensure numeric values
            parsed.prepMinutes = Number(parsed.prepMinutes) || 0;
            parsed.cookMinutes = Number(parsed.cookMinutes) || 0;

            // Recalculate readyInMinutes to ensure consistency (same as RecipeCard)
            const prep = parsed.prepMinutes;
            const cook = parsed.cookMinutes;
            const calculatedReady = prep + cook;
            parsed.readyInMinutes = calculatedReady || null;

            // Ensure image URLs are correct (same structure as RecipeCard expects)
            if (!parsed.heroImageUrl && parsed.image) {
              parsed.heroImageUrl = parsed.image;
            }
            if (!parsed.image && parsed.heroImageUrl) {
              parsed.image = parsed.heroImageUrl;
            }
            if (!parsed.heroImageUrl && !parsed.image && parsed.hero_image_url) {
              parsed.heroImageUrl = parsed.hero_image_url;
              parsed.image = parsed.hero_image_url;
            }

            if (!ignore && mounted) {
              setDailyRecipe(parsed);
              setLoading(false);
              hasLoadedTodayRef.current = true;
              isFetchingRef.current = false;
            }
            return;
          }
        }

        // If we reach here, we need to fetch a new recipe
        // This should only happen if:
        // 1. No cache exists
        // 2. Cache is for a different day
        // 3. Cache parsing failed

        // Try Supabase first
        // NOTE: getSupabaseRandomRecipe filters for has_complete_nutrition: true for regular users
        // Admins see all recipes (including incomplete ones)
        let randomRecipe = null;
        try {
          randomRecipe = await getSupabaseRandomRecipe(isAdmin);
          if (!randomRecipe) {
            if (import.meta.env.DEV) {
              console.warn(
                '⚠️ [DAILY RECIPE] Supabase returned null (no complete recipes available)'
              );
            }
          } else {
            // Double-check that the recipe has complete nutrition (safety check)
            if (
              randomRecipe.has_complete_nutrition === false ||
              randomRecipe.hasCompleteNutrition === false
            ) {
              if (import.meta.env.DEV) {
                console.warn(
                  '⚠️ [DAILY RECIPE] Recipe returned without complete nutrition, skipping:',
                  randomRecipe.id
                );
              }
              randomRecipe = null; // Skip this recipe
            }
          }
        } catch (supabaseError) {
          console.error('❌ [DAILY RECIPE] Supabase random recipe failed:', {
            error: supabaseError.message,
            stack: supabaseError.stack,
          });
        }

        if (!randomRecipe) {
          throw new Error(
            'No complete recipes available yet. Add more recipes with complete nutrition to unlock the Daily Surprise.'
          );
        }

        // Ensure recipe has all required fields before caching
        const prepForCache = Number(randomRecipe.prepMinutes) || 0;
        const cookForCache = Number(randomRecipe.cookMinutes) || 0;
        const readyForCache = prepForCache + cookForCache || null;

        const recipeToCache = {
          ...randomRecipe,
          // Ensure numeric values
          prepMinutes: prepForCache,
          cookMinutes: cookForCache,
          // Recalculate readyInMinutes for consistency
          readyInMinutes: readyForCache,
          // Ensure image URLs are set (prioritize heroImageUrl)
          heroImageUrl:
            randomRecipe.heroImageUrl || randomRecipe.image || randomRecipe.hero_image_url || '',
          image:
            randomRecipe.image || randomRecipe.heroImageUrl || randomRecipe.hero_image_url || '',
          // CRITICAL: Ensure has_complete_nutrition flag is set in cache
          has_complete_nutrition: true,
          hasCompleteNutrition: true,
        };

        safeLocalStorage.setItem('dailyRecipe', safeJSONStringify(recipeToCache, '{}'));
        safeLocalStorage.setItem('dailyRecipeDate', today);

        if (!ignore && mounted) {
          setDailyRecipe(recipeToCache);
          setLoading(false);
          hasLoadedTodayRef.current = true;
          isFetchingRef.current = false;
        }
      } catch (err) {
        console.error('❌ [DAILY RECIPE] Error fetching daily recipe:', err);
        if (!ignore && mounted) {
          setError(err.message);
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchDailyRecipe();

    return () => {
      ignore = true;
      mounted = false;
      isFetchingRef.current = false;
    };
  }, []); // Empty dependency array - only fetch once on mount

  // Reset loaded flag at the start of each new day
  useEffect(() => {
    const checkNewDay = () => {
      const today = new Date().toDateString();
      const cachedDate = safeLocalStorage.getItem('dailyRecipeDate');

      // Reset the loaded flag if it's a new day
      if (cachedDate !== today) {
        hasLoadedTodayRef.current = false;
        isFetchingRef.current = false;
      }
    };

    checkNewDay();
    // Check every minute to catch day changes
    const interval = setInterval(checkNewDay, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (dailyRecipe) {
      triggerHaptic('light');

      // Track interaction for streak
      const lastCheck = safeLocalStorage.getItem('lastDailyCheck');
      const today = new Date().toDateString();

      if (lastCheck !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastCheck === yesterdayStr) {
          // Continue streak
          const newStreak = streak + 1;
          setStreak(newStreak);
          safeLocalStorage.setItem('dailyStreak', String(newStreak));
        } else {
          // Reset streak
          setStreak(1);
          safeLocalStorage.setItem('dailyStreak', '1');
        }

        safeLocalStorage.setItem('lastDailyCheck', today);
      }

      navigate(`/recipe/${dailyRecipe.id}`, { state: { recipe: dailyRecipe } });
      onRecipeSelect?.(dailyRecipe);
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [DAILY RECIPE] Clicked but no recipe available');
      }
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 p-6 shadow-xl"
      >
        <div className="flex flex-col items-center justify-center h-32 gap-3">
          <RotatingFoodLoader size={80} speed={1500} />
          <p className="text-white/90 font-medium">Loading your daily inspiration...</p>
        </div>
      </motion.div>
    );
  }

  if (error || !dailyRecipe) {
    return null;
  }

  const badgeEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '⭐' : '✨';

  // Memoize recipe data to prevent unnecessary re-renders
  const prep = Number(dailyRecipe.prepMinutes) || 0;
  const cook = Number(dailyRecipe.cookMinutes) || 0;
  const ready = prep + cook || Number(dailyRecipe.readyInMinutes) || null;
  const imageUrl = dailyRecipe.heroImageUrl || dailyRecipe.image || dailyRecipe.hero_image_url;
  const finalImageSrc = recipeImg(imageUrl, dailyRecipe.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-600 p-4 xs:p-5 sm:p-6 shadow-xl shadow-emerald-500/20 cursor-pointer transition-all duration-300 active:scale-[0.98] touch-manipulation"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Daily Recipe: ${dailyRecipe.title}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Enhanced pattern overlay - more visible on mobile */}
      <div className="absolute inset-0 opacity-10 sm:opacity-5">
        <div className="absolute top-0 right-0 w-48 h-48 xs:w-64 xs:h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 xs:w-48 xs:h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      </div>

      {/* Decorative icon - better positioning for mobile */}
      <div className="absolute top-3 right-3 xs:top-4 xs:right-4 opacity-15 sm:opacity-20 pointer-events-none">
        <CookingAnimation
          type="chef"
          className="w-10 h-10 xs:w-14 xs:h-14 sm:w-18 sm:h-18 md:w-20 md:h-20"
        />
      </div>

      {/* Mobile-optimized layout */}
      <div className="relative flex flex-col sm:flex-row gap-4 xs:gap-5 sm:gap-6">
        {/* Content Section - Full width on mobile */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          {/* Header with dice and title */}
          <div className="flex items-start gap-2 xs:gap-2.5 mb-3 xs:mb-4">
            <span className="text-2xl xs:text-3xl sm:text-4xl shrink-0 leading-none">🎲</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 xs:gap-2.5 flex-wrap mb-1.5 xs:mb-2">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight shrink-0">
                  {t('dailyRecipeSurprise')}
                </h2>
                {streak > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs xs:text-sm px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-full bg-white/25 backdrop-blur-md text-white font-bold shrink-0 shadow-lg shadow-white/10"
                  >
                    {badgeEmoji} {streak} day{streak !== 1 ? 's' : ''}
                  </motion.span>
                )}
              </div>
              {/* Recipe title - larger and more prominent on mobile */}
              <p className="text-white font-bold text-base xs:text-lg sm:text-xl md:text-2xl line-clamp-2 mb-3 xs:mb-4 leading-snug sm:leading-tight">
                {dailyRecipe.title}
              </p>
              {/* Recipe details - better spacing on mobile */}
              <div className="flex items-center gap-3 xs:gap-4 flex-wrap">
                {ready && ready > 0 && (
                  <span className="text-white/95 text-sm xs:text-base font-semibold flex items-center gap-1.5 xs:gap-2 bg-white/10 backdrop-blur-sm px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-lg xs:rounded-xl">
                    <span className="text-base xs:text-lg">⏱️</span>
                    <span>{ready} min</span>
                  </span>
                )}
                {dailyRecipe.servings && (
                  <span className="text-white/95 text-sm xs:text-base font-semibold flex items-center gap-1.5 xs:gap-2 bg-white/10 backdrop-blur-sm px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-lg xs:rounded-xl">
                    <span className="text-base xs:text-lg">🍽️</span>
                    <span>{dailyRecipe.servings} servings</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Section - Better mobile layout */}
        {imageUrl && (
          <div className="flex items-center justify-center sm:justify-end shrink-0 sm:ml-2">
            <motion.img
              src={finalImageSrc}
              data-original-src={imageUrl}
              alt={dailyRecipe.title}
              className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl xs:rounded-2xl object-cover shadow-2xl ring-3 ring-white/40 shrink-0"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={e => {
                if (import.meta.env.DEV) {
                  console.warn(
                    '⚠️ [DAILY RECIPE] Image failed to load (using fallback):',
                    dailyRecipe.title
                  );
                }
                fallbackOnce(e);
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}

        {/* Arrow indicator - hidden on mobile, shown on desktop */}
        <motion.div
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden sm:flex items-center text-white/80 text-2xl xs:text-3xl ml-2 shrink-0"
        >
          →
        </motion.div>
      </div>

      {/* Streak milestone badge - better mobile positioning */}
      {streak > 0 && streak % 5 === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute top-3 xs:top-4 right-3 xs:right-4 px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-full bg-yellow-400/95 backdrop-blur-md text-yellow-900 font-black text-xs xs:text-sm shadow-xl shadow-yellow-400/50 z-10 border-2 border-yellow-300/50"
        >
          🔥 Milestone!
        </motion.div>
      )}

      {/* Mobile tap indicator - subtle hint on mobile */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:hidden">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/60 text-xs font-medium flex items-center gap-1"
        >
          <span>Tap to view</span>
          <span>👆</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
