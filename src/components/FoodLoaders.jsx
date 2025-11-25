import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Food-themed animated loaders
 * Cycles through different food emojis with unique animations
 */

const FOOD_ITEMS = [
  { emoji: '🍳', name: 'Cooking', color: 'from-orange-400 to-red-500' },
  { emoji: '🍕', name: 'Pizza', color: 'from-yellow-400 to-orange-500' },
  { emoji: '🍔', name: 'Burger', color: 'from-amber-400 to-orange-600' },
  { emoji: '🍜', name: 'Ramen', color: 'from-red-400 to-pink-500' },
  { emoji: '🍰', name: 'Cake', color: 'from-pink-400 to-purple-500' },
  { emoji: '🥗', name: 'Salad', color: 'from-green-400 to-emerald-500' },
  { emoji: '🍝', name: 'Pasta', color: 'from-yellow-300 to-orange-400' },
  { emoji: '🌮', name: 'Taco', color: 'from-yellow-400 to-orange-500' },
  { emoji: '🍣', name: 'Sushi', color: 'from-pink-400 to-red-500' },
  { emoji: '🥘', name: 'Stew', color: 'from-orange-500 to-red-600' },
  { emoji: '🍲', name: 'Pot', color: 'from-orange-400 to-amber-500' },
  { emoji: '🧁', name: 'Cupcake', color: 'from-pink-300 to-purple-400' },
];

/**
 * Rotating food loader - cycles through different foods
 */
export function RotatingFoodLoader({ size = 80, speed = 2000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FOOD_ITEMS.length);
    }, speed);

    return () => clearInterval(interval);
  }, [speed]);

  const currentFood = FOOD_ITEMS[currentIndex];

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      style={{ width: size, height: size }}
    >
      <motion.div
        key={currentIndex}
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, rotate: 180, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="relative"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl"
          style={{ fontSize: `${size * 0.6}px` }}
        >
          {currentFood.emoji}
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${currentFood.color} rounded-full blur-xl opacity-30`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: size, height: size }}
        />
      </motion.div>

      <motion.p
        key={`text-${currentIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-xs text-slate-600 dark:text-slate-400 font-medium"
      >
        {currentFood.name}...
      </motion.p>
    </div>
  );
}

/**
 * Bouncing food loader - multiple foods bouncing
 */
export function BouncingFoodLoader({ count = 5 }) {
  const foods = FOOD_ITEMS.slice(0, count);

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {foods.map((food, index) => (
        <motion.div
          key={index}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut',
          }}
          className="text-4xl"
        >
          {food.emoji}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Spinning food carousel loader
 */
export function SpinningFoodCarousel({ size = 100 }) {
  const visibleFoods = FOOD_ITEMS.slice(0, 6);

  return (
    <div className="relative" style={{ width: size * 2, height: size * 2 }}>
      {visibleFoods.map((food, index) => {
        const angle = (index / visibleFoods.length) * 360;
        const radius = size * 0.7;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: `50%`,
              top: `50%`,
              x: x - size * 0.3,
              y: y - size * 0.3,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              },
            }}
          >
            <motion.div
              className="text-4xl"
              animate={{
                rotate: [-360, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {food.emoji}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Center food */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          },
          scale: {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <div className="text-5xl">🍳</div>
      </motion.div>
    </div>
  );
}

/**
 * Pulse food loader - single food with pulsing effect
 */
export function PulseFoodLoader({ size = 80 }) {
  const [currentFood, setCurrentFood] = useState(FOOD_ITEMS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFood(FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        key={currentFood.emoji}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl"
          style={{ fontSize: `${size * 0.6}px` }}
        >
          {currentFood.emoji}
        </motion.div>

        {/* Ripple effect */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={`absolute inset-0 bg-gradient-to-r ${currentFood.color} rounded-full`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
            style={{ width: size, height: size }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Recipe grid loader - shows multiple foods in a grid
 */
export function RecipeGridLoader({ count = 6 }) {
  const foods = FOOD_ITEMS.slice(0, count);

  return (
    <div className="grid grid-cols-3 gap-4 p-8">
      {foods.map((food, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: index * 0.1,
            type: 'spring',
            stiffness: 200,
          }}
          className="flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
              y: [0, -5, 0],
            }}
            transition={{
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              },
              y: {
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              },
            }}
            className="text-5xl"
          >
            {food.emoji}
          </motion.div>
          <motion.div
            className="h-2 w-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
            animate={{
              scaleX: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Main recipe loader - smart loader that picks a random style
 */
export function RecipeLoader({ variant = 'auto', size = 100 }) {
  const [selectedVariant, setSelectedVariant] = useState(variant);

  useEffect(() => {
    if (variant === 'auto') {
      const variants = ['rotating', 'bouncing', 'spinning', 'pulse', 'grid'];
      setSelectedVariant(variants[Math.floor(Math.random() * variants.length)]);
    }
  }, [variant]);

  switch (selectedVariant) {
    case 'rotating':
      return <RotatingFoodLoader size={size} />;
    case 'bouncing':
      return <BouncingFoodLoader count={5} />;
    case 'spinning':
      return <SpinningFoodCarousel size={size} />;
    case 'pulse':
      return <PulseFoodLoader size={size} />;
    case 'grid':
      return <RecipeGridLoader count={6} />;
    default:
      return <RotatingFoodLoader size={size} />;
  }
}

/**
 * Full page recipe loader with message
 */
export function FullPageRecipeLoader({ message = 'Finding delicious recipes...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6"
      >
        <RecipeLoader variant="auto" size={120} />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg text-slate-600 dark:text-slate-400 font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}

/**
 * Inline recipe loader for cards/grids
 */
export function InlineRecipeLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <RotatingFoodLoader size={80} speed={1500} />
    </div>
  );
}

/**
 * Compact recipe loader for small spaces
 */
export function CompactRecipeLoader() {
  return (
    <div className="flex items-center justify-center py-4">
      <PulseFoodLoader size={50} />
    </div>
  );
}
