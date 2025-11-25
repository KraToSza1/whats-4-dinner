import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Food particle confetti effect
 * Use for celebrations, success states, etc.
 */
// Default emojis array - defined outside component to prevent recreation
const DEFAULT_EMOJIS = ['🍅', '🥕', '🧄', '🌶️', '🥑', '🥬', '🍄', '🧅'];

export function FoodConfetti({ trigger, emojis = DEFAULT_EMOJIS }) {
  const [particles, setParticles] = useState([]);
  const emojisRef = useRef(emojis);
  const lastTriggerRef = useRef(0);
  const isInitialMount = useRef(true);

  // Initialize ref on mount, but don't update on every emojis change
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('🎉 [FOOD CONFETTI] Initial mount, setting emojis:', emojis);
      emojisRef.current = emojis;
      isInitialMount.current = false;
    }
  }, []); // Empty deps - only run on mount

  useEffect(() => {
    console.log('🎉 [FOOD CONFETTI] useEffect triggered:', {
      trigger,
      lastTrigger: lastTriggerRef.current,
      particlesCount: particles.length,
    });

    // Only trigger if trigger actually changed and is greater than 0
    if (trigger && trigger > 0 && trigger !== lastTriggerRef.current) {
      console.log('🎉 [FOOD CONFETTI] Creating particles, trigger:', trigger);
      lastTriggerRef.current = trigger;

      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i + Math.random(),
        emoji: emojisRef.current[Math.floor(Math.random() * emojisRef.current.length)],
        x: Math.random() * 100,
        angle: (Math.random() - 0.5) * 180,
        velocity: 2 + Math.random() * 3,
      }));

      console.log('🎉 [FOOD CONFETTI] Setting particles:', newParticles.length);
      setParticles(newParticles);

      // Clean up after animation
      const timeoutId = setTimeout(() => {
        console.log('🎉 [FOOD CONFETTI] Clearing particles');
        setParticles([]);
      }, 2000);

      return () => {
        console.log('🎉 [FOOD CONFETTI] Cleanup timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('🎉 [FOOD CONFETTI] Skipping particle creation:', {
        trigger,
        lastTrigger: lastTriggerRef.current,
        condition: trigger && trigger > 0 && trigger !== lastTriggerRef.current,
      });
    }
  }, [trigger]); // Only depend on trigger, not emojis

  // Log render
  console.log('🎉 [FOOD CONFETTI] Component render', {
    trigger,
    particlesCount: particles.length,
    hasParticles: particles.length > 0,
  });

  if (particles.length === 0) {
    console.log('🎉 [FOOD CONFETTI] No particles, returning null');
    return null;
  }

  console.log('🎉 [FOOD CONFETTI] Rendering particles:', particles.length);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => {
        console.log('🎉 [FOOD CONFETTI] Rendering particle:', particle.id);
        return (
          <motion.div
            key={particle.id}
            className="absolute text-2xl sm:text-3xl"
            style={{
              left: '50%',
              top: '50%',
            }}
            initial={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              x: Math.cos((particle.angle * Math.PI) / 180) * 300,
              y: Math.sin((particle.angle * Math.PI) / 180) * 300 + 200,
              rotate: particle.angle * 2,
              opacity: [1, 1, 0],
              scale: [1, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          >
            {particle.emoji}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Floating food icons background
 */
export function FloatingFoodBackground({ intensity = 'low' }) {
  const count = intensity === 'high' ? 15 : intensity === 'medium' ? 10 : 5;
  const foods = ['🍕', '🍔', '🌮', '🍜', '🥗', '🍝', '🍱', '🥘', '🍲', '🍛'];

  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: foods[Math.floor(Math.random() * foods.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * 5,
    size: 20 + Math.random() * 30,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {items.map(item => (
        <motion.div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Cooking pot steam animation
 */
export function CookingSteam({ intensity = 'medium' }) {
  const count = intensity === 'high' ? 5 : intensity === 'medium' ? 3 : 2;

  return (
    <div className="relative flex items-center justify-center">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-8 bg-gradient-to-t from-blue-200 to-transparent rounded-full"
          style={{
            left: `${50 + (i - count / 2) * 15}%`,
          }}
          animate={{
            y: [0, -20, -40],
            opacity: [0.5, 0.8, 0],
            scale: [1, 1.5, 2],
          }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Recipe card hover glow effect
 */
export function RecipeCardGlow({ isHovered }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
      animate={{
        opacity: isHovered ? 0.3 : 0,
      }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.4), transparent 70%)',
      }}
    />
  );
}

/**
 * Ingredient list reveal animation
 */
export function IngredientReveal({ children, index = 0, isChecked = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{
        x: 8,
        transition: { duration: 0.2 },
      }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}

/**
 * Loading spinner with food theme
 */
export function FoodLoader({ size = 40 }) {
  const foods = ['🍳', '🥘', '🍲', '🍜'];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {foods.map((food, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center justify-center text-2xl"
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            transformOrigin: 'center',
          }}
        >
          {food}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Success toast with food animation
 */
export function FoodSuccessToast({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 p-4"
    >
      <CookingSparkles intensity="low" />
      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="text-3xl"
        >
          🎉
        </motion.div>
        <p className="flex-1 font-medium text-emerald-900 dark:text-emerald-100">{message}</p>
      </div>
    </motion.div>
  );
}
