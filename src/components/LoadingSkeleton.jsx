// "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16
// "I can do all things through Christ who strengthens me." - Philippians 4:13
// "Trust in the Lord with all your heart and lean not on your own understanding." - Proverbs 3:5
// "Be still, and know that I am God." - Psalm 46:10
import { motion } from 'framer-motion';
import { LoadingFoodAnimation } from './LottieFoodAnimations.jsx';
import { PulseFoodLoader } from './FoodLoaders.jsx';

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm animate-pulse relative">
      <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <PulseFoodLoader size={60} />
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export function RecipeCardSkeletons({ count = 12 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <RecipeCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

export function RecipePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero skeleton */}
      <section className="relative py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mx-auto mb-4 animate-pulse" />

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"
              />
            ))}
          </div>

          <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
      </section>

      {/* Content skeleton */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
        {/* Macros */}
        <div className="space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40 mx-auto animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32 animate-pulse" />
          <div className="grid sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DailyRecipeSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-white/20 rounded w-48" />
          <div className="h-6 bg-white/20 rounded w-full" />
          <div className="h-4 bg-white/20 rounded w-32" />
        </div>
        <div className="w-32 h-32 bg-white/20 rounded-xl" />
      </div>
    </div>
  );
}
