import React from 'react';
import { motion } from 'framer-motion';
import { getBadge, getRarityColor, getRarityGradient } from '../utils/badges';

export default function BadgeDisplay({ badgeId, size = 'default', animated = false }) {
  const badge = getBadge(badgeId);

  if (!badge) return null;

  const sizeClasses = {
    small: 'w-12 h-12 text-xl',
    default: 'w-16 h-16 text-2xl',
    large: 'w-24 h-24 text-4xl',
  };

  const containerClasses = {
    small: 'p-2',
    default: 'p-3',
    large: 'p-4',
  };

  const BadgeContent = (
    <div
      className={`flex flex-col items-center gap-1 ${containerClasses[size]} bg-gradient-to-br ${getRarityGradient(badge.rarity)} rounded-xl shadow-lg`}
    >
      <div className={sizeClasses[size]}>{badge.emoji}</div>
      {size !== 'small' && (
        <>
          <div className="text-xs font-bold text-white text-center leading-tight">{badge.name}</div>
          <div className={`text-[10px] ${getRarityColor(badge.rarity)} text-center leading-tight`}>
            {badge.rarity}
          </div>
        </>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {BadgeContent}
      </motion.div>
    );
  }

  return BadgeContent;
}
