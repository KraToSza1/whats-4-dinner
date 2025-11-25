import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Pull-to-refresh component for mobile
 * Wraps content and enables pull-to-refresh gesture
 */
export default function PullToRefresh({ children, onRefresh, threshold = 80 }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let touchId = null;

    const handleTouchStart = e => {
      // Only activate if at the top of the page
      if (window.scrollY > 20) return;

      const touch = e.touches[0];
      if (!touch) return;

      startY = touch.clientY;
      touchId = touch.identifier;
      currentY = startY;
    };

    const handleTouchMove = e => {
      if (touchId === null) return;

      const touch = Array.from(e.touches).find(t => t.identifier === touchId);
      if (!touch) return;

      currentY = touch.clientY;
      const distance = currentY - startY;

      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(distance);
      } else if (distance <= 0) {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (touchId === null) return;

      if (pullDistance >= threshold && onRefresh) {
        setIsRefreshing(true);

        try {
          await onRefresh();
        } catch (error) {
          console.error('[PullToRefresh]', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      touchId = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = isPulling || isRefreshing;

  return (
    <div className="relative">
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-emerald-500 to-teal-600 text-white py-4 shadow-lg"
            style={{
              height: isRefreshing ? '80px' : `${Math.min(pullDistance, threshold)}px`,
            }}
          >
            {isRefreshing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-3xl"
              >
                ⟳
              </motion.div>
            ) : (
              <motion.div
                animate={{
                  scale: progress >= 1 ? [1, 1.2, 1] : 1,
                  rotate: progress * 360,
                }}
                transition={{ duration: 0.2 }}
                className="text-3xl"
              >
                ⟳
              </motion.div>
            )}

            {progress >= 1 && !isRefreshing && (
              <span className="ml-3 text-sm font-semibold">Release to refresh</span>
            )}
            {isRefreshing && <span className="ml-3 text-sm font-semibold">Refreshing...</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}
