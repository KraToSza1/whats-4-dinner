import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

/**
 * Enhanced Back button component
 * Used across multiple pages for consistent navigation
 * 
 * @param {string} className - Additional CSS classes
 * @param {Function} onClick - Custom click handler (if provided, overrides default navigation)
 * @param {boolean} toHome - If true, navigates to home. If false, goes back in history. Default: true
 * @param {string} label - Button label text. Default: "Home" or "Back" based on toHome prop
 */
export default function BackToHome({ className = '', onClick, toHome = true, label }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (toHome) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  const buttonLabel = label || (toHome ? 'Home' : 'Back');

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02, x: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
                group relative
                inline-flex items-center gap-2
                px-3 sm:px-4 py-2 sm:py-2.5
                rounded-xl
                bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent
                hover:from-emerald-500/20 hover:via-emerald-500/10 hover:to-transparent
                dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-transparent
                dark:hover:from-emerald-500/30 dark:hover:via-emerald-500/15 dark:hover:to-transparent
                border border-emerald-500/20 hover:border-emerald-500/40
                dark:border-emerald-400/30 dark:hover:border-emerald-400/50
                text-emerald-600 dark:text-emerald-400
                font-semibold text-sm
                transition-all duration-300
                touch-manipulation
                overflow-hidden
                ${className}
            `}
      aria-label={`Navigate ${toHome ? 'back to home' : 'back'}`}
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Arrow icon with animation */}
      <motion.div
        animate={{ x: [0, -4, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
      </motion.div>

      {/* Text - consistent across all screens */}
      <span className="relative z-10 font-medium">{buttonLabel}</span>

      {/* Hover effect indicator */}
      <motion.div
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
        initial={false}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </motion.div>
    </motion.button>
  );
}
