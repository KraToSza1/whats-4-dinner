import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COMMON_SWAPS = {
  // Dairy swaps
  butter: {
    swaps: ['olive oil', 'coconut oil', 'avocado', 'applesauce', 'vegan butter'],
    impact: 'Similar texture, may affect flavor slightly',
  },
  milk: {
    swaps: ['almond milk', 'oat milk', 'soy milk', 'coconut milk', 'cashew milk'],
    impact: 'May be thinner, adjust liquid amounts',
  },
  cream: {
    swaps: ['coconut cream', 'cashew cream', 'silken tofu blended'],
    impact: 'Similar richness, vegan-friendly',
  },
  cheese: {
    swaps: ['nutritional yeast', 'vegan cheese', 'cashew cheese'],
    impact: 'Different texture, may need more seasoning',
  },
  yogurt: {
    swaps: ['coconut yogurt', 'cashew yogurt', 'soy yogurt', 'greek yogurt'],
    impact: 'Similar consistency, check for tanginess',
  },
  'sour cream': {
    swaps: ['cashew cream', 'coconut cream', 'greek yogurt'],
    impact: 'Slightly different tang, similar texture',
  },

  // Protein swaps
  chicken: {
    swaps: ['tofu', 'tempeh', 'chickpeas', 'jackfruit', 'mushrooms'],
    impact: 'Lower protein, adjust cooking time',
  },
  beef: {
    swaps: ['lentils', 'mushrooms', 'tofu', 'tempeh', 'black beans'],
    impact: 'Different texture, may need more seasoning',
  },
  pork: {
    swaps: ['tofu', 'tempeh', 'mushrooms', 'jackfruit'],
    impact: 'Vegetarian option, adjust cooking method',
  },
  fish: {
    swaps: ['tofu', 'tempeh', 'chickpeas', 'hearts of palm'],
    impact: 'No fishy flavor, add seaweed for umami',
  },
  eggs: {
    swaps: [
      'flax eggs (1 tbsp flax + 3 tbsp water)',
      'chickpea flour',
      'apple sauce',
      'silken tofu',
    ],
    impact: 'Binding may differ, adjust amounts',
  },
  'ground beef': {
    swaps: ['lentils', 'mushrooms', 'textured vegetable protein', 'black beans'],
    impact: 'Lower fat, may need oil',
  },

  // Gluten swaps
  flour: {
    swaps: ['almond flour', 'coconut flour', 'oat flour', 'gluten-free flour blend', 'rice flour'],
    impact: 'May need binding agents, different texture',
  },
  'bread crumbs': {
    swaps: ['almond meal', 'corn flakes', 'gluten-free bread crumbs', 'crushed crackers'],
    impact: 'Similar texture, check seasoning',
  },
  pasta: {
    swaps: [
      'zucchini noodles',
      'spaghetti squash',
      'rice noodles',
      'gluten-free pasta',
      'shirataki noodles',
    ],
    impact: 'Different cooking time, may be more watery',
  },
  bread: {
    swaps: ['gluten-free bread', 'lettuce wraps', 'collard greens', 'rice paper'],
    impact: 'Different texture, adjust serving method',
  },

  // Sweeteners
  sugar: {
    swaps: ['honey', 'maple syrup', 'agave', 'stevia', 'monk fruit'],
    impact: 'May need less liquid, different sweetness level',
  },
  'white sugar': {
    swaps: ['coconut sugar', 'maple syrup', 'date paste', 'honey'],
    impact: 'Darker color, richer flavor',
  },
  'brown sugar': {
    swaps: ['coconut sugar', 'maple syrup', 'date paste'],
    impact: 'Similar flavor, may be less moist',
  },

  // Vegetables & Herbs
  onion: {
    swaps: ['shallots', 'scallions', 'leeks', 'onion powder'],
    impact: 'Similar flavor, adjust quantity',
  },
  garlic: {
    swaps: ['garlic powder', 'shallots', 'garlic salt (reduce salt)'],
    impact: 'Different intensity, adjust amount',
  },
  tomato: {
    swaps: ['canned tomatoes', 'tomato paste', 'sun-dried tomatoes'],
    impact: 'Different moisture, adjust liquid',
  },
  'bell pepper': {
    swaps: ['poblano peppers', 'anaheim peppers', 'cubanelle peppers'],
    impact: 'Different heat level, similar texture',
  },

  // Oils & Fats
  'olive oil': {
    swaps: ['avocado oil', 'coconut oil', 'vegetable oil', 'butter'],
    impact: 'Different smoke point, adjust heat',
  },
  'vegetable oil': {
    swaps: ['canola oil', 'avocado oil', 'olive oil'],
    impact: 'Similar cooking properties',
  },

  // Spices & Seasonings
  salt: {
    swaps: ['sea salt', 'kosher salt', 'low-sodium alternatives', 'herb blends'],
    impact: 'Different grain size, adjust amount',
  },
  'black pepper': {
    swaps: ['white pepper', 'cayenne pepper', 'paprika'],
    impact: 'Different heat, adjust to taste',
  },

  // Grains
  rice: {
    swaps: ['quinoa', 'cauliflower rice', 'barley', 'farro'],
    impact: 'Different cooking time and texture',
  },
  quinoa: {
    swaps: ['rice', 'couscous', 'bulgur', 'millet'],
    impact: 'Similar protein, different texture',
  },
};

export default function SmartSwaps({ ingredientName }) {
  const [showSwaps, setShowSwaps] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate swap data
  const lowerName = ingredientName?.toLowerCase() || '';
  const swapData =
    COMMON_SWAPS[lowerName] ||
    Object.entries(COMMON_SWAPS).find(([key]) => lowerName.includes(key))?.[1] ||
    null;

  const swaps = swapData ? (Array.isArray(swapData) ? swapData : swapData.swaps) : [];
  const impact = swapData?.impact || 'May affect texture or flavor slightly';

  // Calculate smart positioning for all screen sizes
  const calculatePosition = useCallback(() => {
    if (!showSwaps || !buttonRef.current || !dropdownRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 768; // Tablet and below use fixed positioning
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

    if (isMobile || isTablet) {
      const dropdownWidth = Math.min(320, Math.max(280, window.innerWidth - 32));
      const maxHeight = window.innerHeight - 32;

      // Calculate horizontal position
      let left = rect.left + rect.width / 2 - dropdownWidth / 2;

      // If button is on the right side, align dropdown's right edge with button's right edge
      const buttonRight = rect.right;
      const screenWidth = window.innerWidth;
      const isButtonOnRight = buttonRight > screenWidth * 0.6;

      if (isButtonOnRight) {
        left = buttonRight - dropdownWidth;
      }

      // Ensure it doesn't go off screen edges
      if (left < 16) {
        left = 16;
      }
      if (left + dropdownWidth > screenWidth - 16) {
        left = screenWidth - dropdownWidth - 16;
      }

      // Calculate vertical position - prefer below, but above if not enough space
      let top = rect.bottom + 12;
      const estimatedHeight = Math.min(400, maxHeight);

      // Check if there's enough space below
      if (top + estimatedHeight > window.innerHeight - 16) {
        // Try above
        top = rect.top - estimatedHeight - 12;
        // If still doesn't fit, center it vertically
        if (top < 16) {
          top = Math.max(16, (window.innerHeight - estimatedHeight) / 2);
        }
        // Ensure bottom doesn't go off screen
        if (top + estimatedHeight > window.innerHeight - 16) {
          top = window.innerHeight - estimatedHeight - 16;
        }
      }

      setPosition({ left, top });
    } else {
      // Desktop: use absolute positioning relative to button
      setPosition({ left: 0, top: 0 });
    }
  }, [showSwaps]);

  // Recalculate position when dropdown opens or window resizes
  useEffect(() => {
    calculatePosition();

    const handleResize = () => {
      if (showSwaps) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showSwaps, calculatePosition]);

  const handleToggle = useCallback(e => {
    e.stopPropagation();
    setShowSwaps(prev => !prev);
  }, []);

  const handleBackdropClick = useCallback(e => {
    e.stopPropagation();
    setShowSwaps(false);
  }, []);

  const handleSwapClick = useCallback(swap => {
    const swapName = swap.split('(')[0].trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(swapName)
        .then(() => {
          // Use toast if available, otherwise alert
          if (window.showToast) {
            window.showToast(`Copied "${swapName}" to clipboard! 📋`, 'success');
          } else {
            alert(`Copied "${swapName}" to clipboard! 📋`);
          }
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = swapName;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert(`Copied "${swapName}" to clipboard! 📋`);
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = swapName;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`Copied "${swapName}" to clipboard! 📋`);
    }
    setShowSwaps(false);
  }, []);

  // Early return after all hooks
  if (!ingredientName || !swapData) return null;

  return (
    <div className="relative inline-block">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="text-xs sm:text-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 active:bg-amber-300 dark:active:bg-amber-900/70 transition-colors touch-manipulation min-h-[32px] sm:min-h-0 cursor-pointer select-none"
        title="Don't have this? See alternatives!"
        aria-label="Show ingredient swaps"
        aria-expanded={showSwaps}
        type="button"
      >
        🔄 Swap
      </motion.button>

      <AnimatePresence>
        {showSwaps && (
          <>
            <div
              className="fixed inset-0 z-[9998] bg-black/20 dark:bg-black/40"
              onClick={handleBackdropClick}
              onTouchEnd={handleBackdropClick}
              aria-hidden="true"
            />
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed md:absolute z-[9999] md:left-0 md:translate-x-0 md:top-auto md:translate-y-0 md:mt-2 w-[280px] sm:w-[300px] md:w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-lg md:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-4 overflow-hidden overscroll-contain max-h-[calc(100vh-2rem)] md:max-h-none flex flex-col"
              style={{
                left: window.innerWidth < 1024 ? `${position.left}px` : undefined,
                top: window.innerWidth < 1024 ? `${position.top}px` : undefined,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="swap-title"
            >
              <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2" id="swap-title">
                  <span className="text-base sm:text-lg">🔄</span>
                  <span className="font-bold text-xs sm:text-base">Swap for:</span>
                </div>
                <button
                  onClick={() => setShowSwaps(false)}
                  onTouchEnd={e => {
                    e.stopPropagation();
                    setShowSwaps(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                  aria-label="Close swap menu"
                  type="button"
                >
                  <span className="text-lg sm:text-xl">×</span>
                </button>
              </div>

              {/* Impact Warning */}
              {impact && (
                <div className="mb-2 sm:mb-3 p-1.5 sm:p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex-shrink-0">
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 break-words leading-tight">
                    <span className="font-semibold">Note:</span> {impact}
                  </p>
                </div>
              )}

              <ul className="space-y-1 sm:space-y-2 flex-1 overflow-y-auto overscroll-contain scrollbar-hide min-h-0 max-h-[280px] sm:max-h-64">
                {swaps.map((swap, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 cursor-pointer transition-colors group touch-manipulation min-h-[40px] sm:min-h-[44px] select-none"
                    onClick={e => {
                      e.stopPropagation();
                      handleSwapClick(swap);
                    }}
                    onTouchEnd={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSwapClick(swap);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSwapClick(swap);
                      }
                    }}
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">✓</span>
                    <span className="capitalize flex-1 break-words">{swap}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 flex-shrink-0 hidden sm:inline">
                      Click
                    </span>
                  </motion.li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 text-center sm:text-left flex-shrink-0">
                Tap any option to copy
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
