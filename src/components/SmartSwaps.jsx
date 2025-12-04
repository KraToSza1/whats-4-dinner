import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Check, X, Save } from 'lucide-react';
import {
  setIngredientSwap,
  removeIngredientSwap,
  getRecipeSwaps,
} from '../utils/ingredientSwaps.js';
import { updateIngredientNotes } from '../utils/recipeNotes.js';

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

export default function SmartSwaps({
  ingredientName,
  recipeId,
  ingredientIndex,
  onSwapApplied,
  originalDisplayText,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [currentSwap, setCurrentSwap] = useState(null);

  // Get current swap for this ingredient
  const existingSwap = useMemo(() => {
    if (recipeId !== undefined && ingredientIndex !== undefined) {
      const swaps = getRecipeSwaps(recipeId);
      return swaps[ingredientIndex] || null;
    }
    return null;
  }, [recipeId, ingredientIndex]);

  // Sync currentSwap with existingSwap
  useEffect(() => {
    setCurrentSwap(existingSwap);
  }, [existingSwap]);

  // Calculate swap data
  const lowerName = ingredientName?.toLowerCase() || '';
  const swapData =
    COMMON_SWAPS[lowerName] ||
    Object.entries(COMMON_SWAPS).find(([key]) => lowerName.includes(key))?.[1] ||
    null;

  const swaps = swapData ? (Array.isArray(swapData) ? swapData : swapData.swaps) : [];
  const impact = swapData?.impact || 'May affect texture or flavor slightly';

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = e => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleOpen = useCallback(e => {
    e.stopPropagation();
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCopiedIndex(null);
  }, []);

  const handleCopySwap = useCallback(async (swap, index) => {
    const swapName = swap.split('(')[0].trim();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(swapName);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = swapName;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // Show visual feedback
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);

      // Try to show toast if available
      if (window.showToast) {
        window.showToast(`Copied "${swapName}"! 📋`, 'success');
      } else if (window.dispatchEvent) {
        // Fallback: dispatch custom event
        window.dispatchEvent(
          new CustomEvent('showToast', {
            detail: { message: `Copied "${swapName}"! 📋`, type: 'success' },
          })
        );
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[SmartSwaps] Copy failed:', err);
      }
    }
  }, []);

  const handleApplySwap = useCallback(
    (swap, index) => {
      const swapName = swap.split('(')[0].trim();
      setSelectedSwap(swapName);

      if (recipeId !== undefined && ingredientIndex !== undefined) {
        // Apply swap for this user
        setIngredientSwap(recipeId, ingredientIndex, swapName);
        setCurrentSwap(swapName);

        // Notify parent to update display
        if (onSwapApplied) {
          onSwapApplied(ingredientIndex, swapName, originalDisplayText || ingredientName);
        }

        // Show toast
        if (window.showToast) {
          window.showToast(`Swapped to "${swapName}"! 🔄`, 'success');
        }

        // Close modal after a short delay
        setTimeout(() => {
          setIsOpen(false);
          setSelectedSwap(null);
        }, 1000);
      } else {
        // Fallback: just copy if no recipe context
        handleCopySwap(swap, index);
      }
    },
    [recipeId, ingredientIndex, onSwapApplied, originalDisplayText, ingredientName, handleCopySwap]
  );

  const handleSaveToNotes = useCallback(() => {
    if (!recipeId || ingredientIndex === undefined || !selectedSwap) return;

    const swapName = selectedSwap.split('(')[0].trim();
    const noteText = `Swapped to: ${swapName}`;

    // Get existing note and append/prepend
    const existingNote = ''; // Could load from notes if needed
    const finalNote = existingNote ? `${existingNote}\n${noteText}` : noteText;

    updateIngredientNotes(recipeId, ingredientIndex, finalNote);

    if (window.showToast) {
      window.showToast(`Saved swap to notes! 📝`, 'success');
    }

    setIsOpen(false);
    setSelectedSwap(null);
  }, [recipeId, ingredientIndex, selectedSwap]);

  const handleRemoveSwap = useCallback(() => {
    if (recipeId !== undefined && ingredientIndex !== undefined) {
      removeIngredientSwap(recipeId, ingredientIndex);
      setCurrentSwap(null);

      // Notify parent to revert
      if (onSwapApplied) {
        onSwapApplied(ingredientIndex, null, originalDisplayText || ingredientName);
      }

      if (window.showToast) {
        window.showToast('Swap removed, reverted to original', 'info');
      }
    }
  }, [recipeId, ingredientIndex, onSwapApplied, originalDisplayText, ingredientName]);

  // Early return if no swaps available
  if (!ingredientName || !swapData || swaps.length === 0) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 active:bg-amber-300 dark:active:bg-amber-900/70 transition-colors text-xs sm:text-sm touch-manipulation min-h-[28px] sm:min-h-[32px] ml-2"
        title="See ingredient alternatives"
        aria-label="Show ingredient swaps"
        type="button"
      >
        <span>🔄</span>
        <span className="hidden sm:inline">Swap</span>
      </button>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-amber-200 dark:border-amber-800"
              >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-amber-200 dark:border-amber-800 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                      Swap: {ingredientName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {currentSwap
                        ? `Currently swapped to: ${currentSwap}`
                        : 'Choose an alternative ingredient'}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation flex-shrink-0 ml-2"
                    aria-label="Close modal"
                    type="button"
                  >
                    <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {/* Impact Note */}
                  {impact && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">Note:</span> {impact}
                    </div>
                  )}

                  {/* Swaps List */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      Alternatives:
                    </div>
                    {swaps.map((swap, idx) => {
                      const swapName = swap.split('(')[0].trim();
                      const isSelected = selectedSwap === swapName;
                      const isCurrentSwap = currentSwap === swapName;
                      const isCopied = copiedIndex === idx;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`rounded-lg border transition-all ${
                            isCurrentSwap
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                              : isSelected
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (recipeId !== undefined && ingredientIndex !== undefined) {
                                handleApplySwap(swap, idx);
                              } else {
                                handleCopySwap(swap, idx);
                              }
                            }}
                            className={`w-full text-left flex items-center gap-3 p-3 sm:p-4 rounded-lg transition-all group touch-manipulation ${
                              isCurrentSwap || isSelected
                                ? ''
                                : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 dark:active:bg-amber-900/30'
                            }`}
                            type="button"
                          >
                            {isCurrentSwap || isSelected ? (
                              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : isCopied ? (
                              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                            )}
                            <span className="flex-1 text-sm sm:text-base capitalize text-slate-700 dark:text-slate-300">
                              {swap}
                            </span>
                            {isCurrentSwap && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded">
                                Active
                              </span>
                            )}
                            {isSelected && !isCurrentSwap && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Applied!
                              </span>
                            )}
                            {isCopied && !isSelected && !isCurrentSwap && (
                              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                Copied!
                              </span>
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2">
                    {currentSwap && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveSwap();
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-manipulation"
                        type="button"
                      >
                        Remove Swap (Revert to Original)
                      </button>
                    )}
                    {selectedSwap && !currentSwap && recipeId && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSaveToNotes();
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors touch-manipulation flex items-center justify-center gap-2"
                        type="button"
                      >
                        <Save className="w-4 h-4" />
                        Save Swap to Notes
                      </button>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                      {recipeId !== undefined && ingredientIndex !== undefined
                        ? 'Click any option to apply swap (saves automatically)'
                        : 'Click any option to copy to clipboard'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
