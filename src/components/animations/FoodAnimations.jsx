import React from 'react';
import { motion } from 'framer-motion';

/**
 * Floating ingredient particles animation
 * Use for recipe cards, success states, etc.
 */
export function FloatingIngredients({ count = 5, ingredients = ['🍅', '🥕', '🧄', '🌶️', '🥑'] }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: ingredients[i % ingredients.length],
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute text-2xl"
          initial={{
            x: `${particle.x}%`,
            y: '100%',
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: '-20%',
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8],
            rotate: [0, 360],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            left: `${particle.x}%`,
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Cooking sparkles effect
 * Use for loading states, cooking timers, etc.
 */
export function CookingSparkles({ intensity = 'medium' }) {
  const count = intensity === 'high' ? 12 : intensity === 'medium' ? 8 : 4;
  const sparkles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 1.5,
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"
          initial={{
            x: `${sparkle.x}%`,
            y: `${sparkle.y}%`,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, sparkle.size / 4, 0],
          }}
          transition={{
            duration: 1.5,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: sparkle.size,
            height: sparkle.size,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Success checkmark with food particles
 */
export function SuccessAnimation({ onComplete }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        <motion.svg
          className="w-10 h-10 text-white"
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
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>
      <FloatingIngredients count={6} />
    </motion.div>
  );
}

/**
 * Recipe card shimmer effect on hover
 */
export function RecipeCardShimmer() {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      initial={{ x: '-100%' }}
      whileHover={{ x: '100%' }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    />
  );
}

/**
 * Cooking timer animation with steam
 */
export function CookingTimer({ seconds, size = 60 }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Simple time display - no circle, no sparkles */}
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{seconds}</span>
    </div>
  );
}

/**
 * Ingredient list item animation
 */
export function IngredientItemAnimation({ children, index = 0 }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{ x: 4, scale: 1.02 }}
      className="relative"
    >
      {children}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: index * 0.05 + 0.2 }}
      />
    </motion.li>
  );
}

/**
 * Recipe card image zoom effect
 */
export function RecipeImageZoom({ children, isHovered }) {
  return (
    <motion.div
      animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

/**
 * Loading recipe cards with shimmer
 */
export function RecipeCardShimmerSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="aspect-[4/3] bg-slate-300 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Favorite button animation with heart particles
 */
export function FavoriteAnimation({ isFavorite, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="relative"
    >
      <motion.div
        animate={
          isFavorite
            ? {
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0],
              }
            : {}
        }
        transition={{ duration: 0.4 }}
      >
        ❤️
      </motion.div>
      {isFavorite && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 2, 0], opacity: [1, 0] }}
          transition={{ duration: 0.6 }}
        >
          {['💖', '✨', '⭐'].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-xl"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: [0, (i - 1) * 30],
                y: [0, -40],
                opacity: [1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}

/**
 * Page transition with food theme
 */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Grocery item check animation
 */
export function GroceryCheckAnimation({ checked, onToggle }) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-6 h-6 rounded border-2 flex items-center justify-center"
      animate={{
        backgroundColor: checked ? '#10b981' : 'transparent',
        borderColor: checked ? '#10b981' : '#cbd5e1',
      }}
    >
      {checked && (
        <motion.svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </motion.svg>
      )}
      {checked && (
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-400"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.button>
  );
}

/**
 * Search results fade-in animation
 */
export function SearchResultsAnimation({ children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
