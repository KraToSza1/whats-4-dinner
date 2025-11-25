import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingIngredients, CookingSparkles } from './FoodAnimations.jsx';

/**
 * Enhanced recipe card wrapper with food animations
 */
export function EnhancedRecipeCard({ children, recipe, isHovered }) {
  const [showParticles, setShowParticles] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowParticles(true)}
      onMouseLeave={() => setShowParticles(false)}
    >
      {children}
      {isHovered && (
        <>
          <CookingSparkles intensity="low" />
          {showParticles && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FloatingIngredients count={3} />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Badge animation with pulse effect
 */
export function AnimatedBadge({ children, delay = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 200,
      }}
      whileHover={{
        scale: 1.1,
        rotate: [0, -5, 5, 0],
      }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

/**
 * Recipe title with typing effect (optional)
 */
export function AnimatedRecipeTitle({ title, delay = 0 }) {
  return (
    <motion.h3
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-sm font-semibold line-clamp-2"
    >
      {title}
    </motion.h3>
  );
}
