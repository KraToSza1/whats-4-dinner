import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getBadge, getRarityGradient } from '../utils/badges';
import { useToast } from './Toast';

export default function BadgeUnlockModal({ badgeId, open, onClose }) {
  const badge = badgeId ? getBadge(badgeId) : null;
  const toast = useToast();

  useEffect(() => {
    if (open && badge) {
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, badge, onClose]);

  if (!open || !badge) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`relative bg-gradient-to-br ${getRarityGradient(badge.rarity)} rounded-2xl p-8 shadow-2xl border-4 border-white/20`}
            >
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-7xl mb-4"
                >
                  {badge.emoji}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white"
                >
                  <div className="text-2xl font-bold mb-2">Badge Unlocked!</div>
                  <div className="text-xl font-semibold mb-1">{badge.name}</div>
                  <div className="text-sm opacity-90">{badge.description}</div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <div className="text-white/80 text-xs">
                  {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)} Badge
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
