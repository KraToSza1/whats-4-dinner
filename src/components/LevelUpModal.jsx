import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Trophy } from 'lucide-react';
import { getLevelTitle, getLevelBadge, getLevelColor } from '../utils/xpSystem';
import { useToast } from './Toast';

export default function LevelUpModal({ level, open, onClose }) {
  const toast = useToast();

  useEffect(() => {
    if (open && level) {
      toast.success(`Level Up! You're now Level ${level}!`);

      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, level, onClose, toast]);

  if (!open || !level) return null;

  const title = getLevelTitle(level);
  const badge = getLevelBadge(level);
  const color = getLevelColor(level);

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
              animate={{ scale: [0, 1.2, 1] }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-8 shadow-2xl border-4 border-white/20 max-w-md w-full"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-7xl mb-4 ${color}`}
                >
                  {badge}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-6 h-6" />
                    <div className="text-3xl font-bold">Level Up!</div>
                  </div>
                  <div className="text-2xl font-semibold mb-1">Level {level}</div>
                  <div className="text-lg opacity-90">{title}</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 flex items-center justify-center gap-2 text-white/80"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Keep cooking to level up more!</span>
                </motion.div>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="mt-6 w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
              >
                Awesome!
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
