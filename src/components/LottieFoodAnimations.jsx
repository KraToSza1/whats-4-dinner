import { motion } from 'framer-motion';

/**
 * Food-themed animated components
 * These provide Lottie-like animations using Framer Motion
 * For production, you can replace these with actual Lottie JSON files from:
 * - https://lottiefiles.com (search "food" or "cooking")
 * - Download JSON files and use: <Lottie animationData={cookingAnimation} />
 */

/**
 * Cooking pot animation for loading/cooking states
 */
export function CookingPotAnimation({ size = 100, loop = true }) {
  return (
    <div
      style={{ width: size, height: size, minWidth: size, minHeight: size, overflow: 'visible' }}
      className="flex items-center justify-center relative"
    >
      {/* Frying Pan - centered */}
      <motion.div
        className="relative"
        style={{
          width: '80%',
          height: '80%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        animate={{
          scale: [1, 1.1, 1],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 1,
          repeat: loop ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Pan body container - centered */}
        <div className="relative" style={{ position: 'relative', width: '48px', height: '24px' }}>
          {/* Pan rim (curved sides) */}
          <div
            className="absolute border-2 border-slate-600"
            style={{
              width: '48px',
              height: '20px',
              borderRadius: '50% 50% 0 0',
              borderBottom: 'none',
              background: 'linear-gradient(to bottom, rgba(148, 163, 184, 0.3), transparent)',
              top: '-8px',
              left: '0',
            }}
          />
          {/* Pan base (flat bottom) */}
          <div
            className="absolute bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"
            style={{
              width: '48px',
              height: '3px',
              bottom: '0',
              left: '0',
            }}
          />
          {/* Pan handle */}
          <div
            className="absolute bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 rounded-r-full"
            style={{
              width: '24px',
              height: '3px',
              right: '-24px',
              top: '8px',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Success checkmark animation
 */
export function SuccessCheckAnimation({ size = 80, onComplete }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        onAnimationComplete={onComplete}
        className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"
      >
        <motion.svg
          className="w-2/3 h-2/3 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}

/**
 * Loading food animation
 */
export function LoadingFoodAnimation({ size = 100 }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="text-6xl"
      >
        🍳
      </motion.div>
    </div>
  );
}

/**
 * Recipe card loading animation
 */
export function RecipeCardLoadingAnimation() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-5xl"
      >
        🍽️
      </motion.div>
    </div>
  );
}

/**
 * Empty state animation (no recipes found)
 */
export function EmptyStateAnimation({ message = 'No recipes found' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-8xl mb-4"
      >
        🍽️
      </motion.div>
      <p className="text-slate-600 dark:text-slate-400 text-lg">{message}</p>
    </div>
  );
}
