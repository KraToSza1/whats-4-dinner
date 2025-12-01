import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSupabaseRandomRecipe } from '../api/supabaseRecipes.js';
import { supabase } from '../lib/supabaseClient.js';
import { triggerHaptic } from '../utils/haptics.js';
import CookingAnimation from './CookingAnimation.jsx';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { LoadingFoodAnimation } from './LottieFoodAnimations.jsx';
import { RotatingFoodLoader } from './FoodLoaders.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function DailyRecipe({ onRecipeSelect }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dailyRecipe, setDailyRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [failedRecipeIds, setFailedRecipeIds] = useState(() => {
    // Load previously failed recipe IDs from localStorage to prevent infinite loops
    try {
      const stored = localStorage.getItem('dailyRecipeFailedIds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [streak, setStreak] = useState(() => {
    try {
      return parseInt(localStorage.getItem('dailyStreak') || '0', 10);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    let ignore = false;
    const fetchDailyRecipe = async () => {
      try {
        // Check if we already have a daily recipe cached
        const cached = localStorage.getItem('dailyRecipe');
        const cachedDate = localStorage.getItem('dailyRecipeDate');
        const today = new Date().toDateString();

        if (cached && cachedDate === today) {
          const parsed = JSON.parse(cached);

          // Normalize field names for consistency
          if (!parsed.prepMinutes && parsed.prep_minutes !== undefined) {
            parsed.prepMinutes = Number(parsed.prep_minutes) || 0;
          }
          if (!parsed.cookMinutes && parsed.cook_minutes !== undefined) {
            parsed.cookMinutes = Number(parsed.cook_minutes) || 0;
          }

          // Ensure numeric values
          const originalPrep = parsed.prepMinutes;
          const originalCook = parsed.cookMinutes;
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

          // Check if cached recipe has no image but database might have one
          // This helps when images are uploaded via admin dashboard
          const cachedHasNoImage = !parsed.image && !parsed.heroImageUrl && !parsed.hero_image_url;
          if (cachedHasNoImage && parsed.id && !ignore) {
            // Check database to see if recipe now has an image
            supabase
              .from('recipes')
              .select('hero_image_url, updated_at')
              .eq('id', parsed.id)
              .single()
              .then(({ data: dbRecipe, error: dbError }) => {
                if (!dbError && dbRecipe) {
                  const dbHasImage = !!(dbRecipe.hero_image_url && dbRecipe.hero_image_url.trim());
                  if (dbHasImage) {
                    // Clear cache and refresh
                    localStorage.removeItem('dailyRecipe');
                    localStorage.removeItem('dailyRecipeDate');
                    setRefreshTrigger(prev => prev + 1);
                  }
                }
              })
              .catch(error => {
                console.warn('⚠️ [DAILY RECIPE] Error checking database for image:', error);
              });
          }

          if (!ignore) {
            setDailyRecipe(parsed);
            setLoading(false);
          }
          return;
        }

        // Try Supabase first
        let randomRecipe = null;
        try {
          randomRecipe = await getSupabaseRandomRecipe();
          if (!randomRecipe) {
            console.warn('⚠️ [DAILY RECIPE] Supabase returned null');
          }
        } catch (supabaseError) {
          console.error('❌ [DAILY RECIPE] Supabase random recipe failed:', {
            error: supabaseError.message,
            stack: supabaseError.stack,
          });
        }

        if (!randomRecipe) {
          throw new Error(
            'No Supabase recipes available yet. Add more recipes to unlock the Daily Surprise.'
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
        };

        localStorage.setItem('dailyRecipe', JSON.stringify(recipeToCache));
        localStorage.setItem('dailyRecipeDate', today);

        if (!ignore) {
          setDailyRecipe(recipeToCache);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ [DAILY RECIPE] Error fetching daily recipe:', err);
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
  }, [refreshTrigger]);

  // Reset failed recipe IDs and refresh attempts at the start of each new day
  useEffect(() => {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem('dailyRecipeFailedIdsResetDate');

    if (lastResetDate !== today) {
      // New day - reset failed IDs and attempts
      setFailedRecipeIds([]);
      setRefreshAttempts(0);
      localStorage.removeItem('dailyRecipeFailedIds');
      localStorage.setItem('dailyRecipeFailedIdsResetDate', today);
    }
  }, []);

  const handleClick = () => {
    if (dailyRecipe) {
      triggerHaptic('light');

      // Track interaction for streak
      const lastCheck = localStorage.getItem('lastDailyCheck');
      const today = new Date().toDateString();

      if (lastCheck !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastCheck === yesterdayStr) {
          // Continue streak
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('dailyStreak', String(newStreak));
        } else {
          // Reset streak
          setStreak(1);
          localStorage.setItem('dailyStreak', '1');
        }

        localStorage.setItem('lastDailyCheck', today);
      }

      navigate(`/recipe/${dailyRecipe.id}`, { state: { recipe: dailyRecipe } });
      onRecipeSelect?.(dailyRecipe);
    } else {
      console.warn('⚠️ [DAILY RECIPE] Clicked but no recipe available');
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-xl xs:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 xs:p-4 sm:p-5 md:p-6 shadow-xl cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
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
          <div className="flex items-center gap-1.5 xs:gap-2 mb-2 flex-wrap">
            <span className="text-xl xs:text-2xl">🎲</span>
            <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white">
              {t('dailyRecipeSurprise')}
            </h2>
            {streak > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full bg-white/20 text-white">
                {badgeEmoji} {streak} day{streak !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-white/90 font-semibold text-sm xs:text-base sm:text-lg md:text-xl line-clamp-2">
            {dailyRecipe.title}
          </p>
          <div className="flex items-center gap-2 xs:gap-3 mt-2 flex-wrap">
            {(() => {
              // Calculate readyInMinutes consistently: prep + cook (same as RecipeCard)
              const prep = Number(dailyRecipe.prepMinutes) || 0;
              const cook = Number(dailyRecipe.cookMinutes) || 0;
              const ready = prep + cook || Number(dailyRecipe.readyInMinutes) || null;

              return ready && ready > 0 ? (
                <span className="text-white/80 text-sm">⏱️ {ready} min</span>
              ) : null;
            })()}
            {dailyRecipe.servings && (
              <span className="text-white/80 text-sm">🍽️ {dailyRecipe.servings} servings</span>
            )}
          </div>
        </div>

        {/* Image */}
        {(() => {
          const imageUrl =
            dailyRecipe.heroImageUrl || dailyRecipe.image || dailyRecipe.hero_image_url;
          const finalImageSrc = recipeImg(imageUrl, dailyRecipe.id);

          // Check if image URL is valid Supabase storage URL
          const isSupabaseStorage =
            imageUrl && imageUrl.includes('/storage/v1/object/public/recipe-images/');
          const supabaseBase = import.meta.env.VITE_SUPABASE_URL || '';
          const urlMatchesSupabase =
            imageUrl &&
            supabaseBase &&
            imageUrl.includes(supabaseBase.split('//')[1]?.split('/')[0] || '');

          // Test if image URL is accessible (only in dev)
          if (imageUrl && isSupabaseStorage && import.meta.env.DEV) {
            // Use Image object to test loading
            const testImg = new Image();
            testImg.onload = () => {
              // Image loads successfully
            };
            testImg.onerror = err => {
              console.warn(
                '⚠️ [DAILY RECIPE] Image URL test: Image file does NOT exist in Supabase storage',
                {
                  recipeId: dailyRecipe.id,
                  recipeTitle: dailyRecipe.title,
                  url: imageUrl,
                  issue:
                    'The image URL is stored in the database, but the file was not uploaded to Supabase storage.',
                  solution:
                    'Upload the image file to Supabase storage at the path specified in the URL, or remove the image URL from the database.',
                }
              );
            };
            testImg.src = imageUrl;
          }

          return imageUrl ? (
            <motion.img
              src={finalImageSrc}
              data-original-src={imageUrl}
              alt={dailyRecipe.title}
              className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg xs:rounded-xl object-cover shadow-lg ring-2 ring-white/20 flex-shrink-0"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={e => {
                console.error(
                  '❌ [DAILY RECIPE] Image failed to load:',
                  JSON.stringify(
                    {
                      id: dailyRecipe.id,
                      title: dailyRecipe.title,
                      attemptedSrc: e.currentTarget.src,
                      originalSrc: e.currentTarget.getAttribute('data-original-src'),
                      heroImageUrl: dailyRecipe.heroImageUrl,
                      image: dailyRecipe.image,
                      hero_image_url: dailyRecipe.hero_image_url,
                    },
                    null,
                    2
                  )
                );

                // If image fails and we have a Supabase storage URL, try refreshing the recipe from database
                // This helps when recipes are edited and images are uploaded
                // BUT: Prevent infinite loops by tracking failed recipes and limiting refresh attempts
                const originalSrc = e.currentTarget.getAttribute('data-original-src');
                if (
                  originalSrc &&
                  originalSrc.includes('/storage/v1/object/public/recipe-images/')
                ) {
                  const cachedDate = localStorage.getItem('dailyRecipeDate');
                  const today = new Date().toDateString();

                  // Only refresh if this is today's cached recipe (don't refresh placeholder)
                  if (cachedDate === today && dailyRecipe.id) {
                    // Check if we've already failed for this recipe ID (prevent infinite loop)
                    const alreadyFailed = failedRecipeIds.includes(dailyRecipe.id);
                    // Limit refresh attempts to prevent infinite loops (max 3 attempts)
                    const maxRefreshAttempts = 3;

                    if (!alreadyFailed && refreshAttempts < maxRefreshAttempts) {
                      // Clear the cache for this specific recipe
                      const cached = localStorage.getItem('dailyRecipe');
                      if (cached) {
                        try {
                          const parsed = JSON.parse(cached);
                          // Only clear if it's the same recipe ID
                          if (parsed.id === dailyRecipe.id) {
                            // Mark this recipe as failed
                            const updatedFailedIds = [...failedRecipeIds, dailyRecipe.id];
                            setFailedRecipeIds(updatedFailedIds);
                            localStorage.setItem(
                              'dailyRecipeFailedIds',
                              JSON.stringify(updatedFailedIds)
                            );

                            // Increment refresh attempts
                            setRefreshAttempts(prev => prev + 1);

                            localStorage.removeItem('dailyRecipe');
                            localStorage.removeItem('dailyRecipeDate');
                            // Trigger refresh by incrementing refreshTrigger
                            // This will cause useEffect to run again and fetch fresh data from Supabase
                            setRefreshTrigger(prev => prev + 1);
                          }
                        } catch (err) {
                          console.error('❌ [DAILY RECIPE] Error parsing cached recipe:', err);
                          // Only refresh if we haven't exceeded attempts
                          if (refreshAttempts < maxRefreshAttempts) {
                            const updatedFailedIds = [...failedRecipeIds, dailyRecipe.id];
                            setFailedRecipeIds(updatedFailedIds);
                            localStorage.setItem(
                              'dailyRecipeFailedIds',
                              JSON.stringify(updatedFailedIds)
                            );
                            setRefreshAttempts(prev => prev + 1);
                            localStorage.removeItem('dailyRecipe');
                            localStorage.removeItem('dailyRecipeDate');
                            setRefreshTrigger(prev => prev + 1);
                          }
                        }
                      }
                    } else {
                      // Recipe already failed or too many attempts - just show placeholder
                      console.warn(
                        '⚠️ [DAILY RECIPE] Image failed but not refreshing (already failed or max attempts reached):',
                        {
                          recipeId: dailyRecipe.id,
                          alreadyFailed,
                          refreshAttempts,
                          maxAttempts: maxRefreshAttempts,
                        }
                      );
                    }
                  }
                }

                fallbackOnce(e);
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
              whileHover={{ scale: 1.1, rotate: 2 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            console.warn('⚠️ [DAILY RECIPE] No image URL available:', {
              id: dailyRecipe.id,
              title: dailyRecipe.title,
              heroImageUrl: dailyRecipe.heroImageUrl,
              image: dailyRecipe.image,
              hero_image_url: dailyRecipe.hero_image_url,
            }) || null
          );
        })()}

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
