import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRecipeNotes,
  updateGeneralNotes,
  updateIngredientNotes,
  updateStepNotes,
} from '../utils/recipeNotes.js';

export default function RecipeNotes({ recipeId, ingredients = [], steps = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState(getRecipeNotes(recipeId));
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (recipeId) {
      const newNotes = getRecipeNotes(recipeId);
      // Only update if notes actually changed to prevent unnecessary re-renders
      setNotes(prevNotes => {
        const notesChanged = JSON.stringify(prevNotes) !== JSON.stringify(newNotes);
        return notesChanged ? newNotes : prevNotes;
      });
    }
  }, [recipeId]);

  useEffect(() => {
    if (showModal) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const handleGeneralChange = text => {
    if (!recipeId) return;
    setSaving(true);
    setNotes({ ...notes, general: text });

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      updateGeneralNotes(recipeId, text);
      setSaving(false);
    }, 500);
  };

  const handleIngredientChange = (index, text) => {
    if (!recipeId) return;
    setSaving(true);
    setNotes({
      ...notes,
      ingredients: { ...notes.ingredients, [index]: text },
    });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateIngredientNotes(recipeId, index, text);
      setSaving(false);
    }, 500);
  };

  const handleStepChange = (index, text) => {
    if (!recipeId) return;
    setSaving(true);
    setNotes({
      ...notes,
      steps: { ...notes.steps, [index]: text },
    });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateStepNotes(recipeId, index, text);
      setSaving(false);
    }, 500);
  };

  const clearNotes = (type, index = null) => {
    if (!recipeId) return;
    setSaving(true);

    if (type === 'general') {
      handleGeneralChange('');
    } else if (type === 'ingredient' && index !== null) {
      handleIngredientChange(index, '');
    } else if (type === 'step' && index !== null) {
      handleStepChange(index, '');
    }
  };

  const toggleExpand = (type, index) => {
    const key = `${type}-${index}`;
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getNoteCount = () => {
    let count = 0;
    if (notes.general) count++;
    if (notes.ingredients) count += Object.values(notes.ingredients).filter(n => n).length;
    if (notes.steps) count += Object.values(notes.steps).filter(n => n).length;
    return count;
  };

  // Memoize notes.ingredients and notes.steps to prevent unnecessary recalculations
  const ingredientsNotes = useMemo(() => notes.ingredients || {}, [notes.ingredients]);
  const stepsNotes = useMemo(() => notes.steps || {}, [notes.steps]);

  const filteredIngredients = useMemo(() => {
    return ingredients
      .map((ing, idx) => ({ ingredient: ing, index: idx }))
      .filter(({ ingredient: ing, index: idx }) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        const ingText = (ing.displayText || ing.original || '').toLowerCase();
        const noteText = (ingredientsNotes[idx] || '').toLowerCase();
        return ingText.includes(searchLower) || noteText.includes(searchLower);
      });
  }, [ingredients, searchQuery, ingredientsNotes]);

  const filteredSteps = useMemo(() => {
    return steps
      .map((step, idx) => ({ step, index: idx }))
      .filter(({ step, index: idx }) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        const stepText = (step || '').toLowerCase();
        const noteText = (stepsNotes[idx] || '').toLowerCase();
        return stepText.includes(searchLower) || noteText.includes(searchLower);
      });
  }, [steps, searchQuery, stepsNotes]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!recipeId) return null;

  const hasNotes =
    notes.general ||
    Object.keys(notes.ingredients || {}).length > 0 ||
    Object.keys(notes.steps || {}).length > 0;
  const noteCount = getNoteCount();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Notes button clicked, recipeId:', recipeId);
          setShowModal(true);
        }}
        type="button"
        className={`px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 md:py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 min-h-[36px] sm:min-h-0 touch-manipulation flex-shrink-0 transition-all ${
          hasNotes
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
        }`}
        title="Recipe notes"
      >
        <span className="text-sm sm:text-base md:text-lg">📝</span>
        <span className="hidden sm:inline">Notes</span>
        {noteCount > 0 && (
          <span className="bg-white/20 dark:bg-white/10 px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
            {noteCount}
          </span>
        )}
      </motion.button>

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <motion.div
                key="notes-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
                onClick={() => setShowModal(false)}
                style={{
                  zIndex: 99999,
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'auto',
                }}
              >
                <div className="min-h-full flex items-start justify-center pt-8 sm:pt-16 pb-8">
                  <motion.div
                    key="notes-modal-content"
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 50, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/30 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-2xl"
                    style={{ zIndex: 100000, position: 'relative', pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl">
                          📝
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Recipe Notes
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {noteCount > 0
                              ? `${noteCount} note${noteCount !== 1 ? 's' : ''} saved`
                              : 'Add your personal notes and tips'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {saving && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full"
                            />
                            Saving...
                          </motion.div>
                        )}
                        <button
                          onClick={() => setShowModal(false)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Search Bar */}
                    {(ingredients.length > 0 || steps.length > 0) && (
                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search ingredients or steps..."
                            className="w-full px-4 py-2.5 pl-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            🔍
                          </span>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2.5 font-medium border-b-2 transition-all whitespace-nowrap ${
                          activeTab === 'general'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        General
                        {notes.general && (
                          <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                            •
                          </span>
                        )}
                      </button>
                      {ingredients.length > 0 && (
                        <button
                          onClick={() => setActiveTab('ingredients')}
                          className={`px-4 py-2.5 font-medium border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'ingredients'
                              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Ingredients ({filteredIngredients.length})
                          {notes.ingredients && Object.values(notes.ingredients).some(n => n) && (
                            <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                              {Object.values(notes.ingredients).filter(n => n).length}
                            </span>
                          )}
                        </button>
                      )}
                      {steps.length > 0 && (
                        <button
                          onClick={() => setActiveTab('steps')}
                          className={`px-4 py-2.5 font-medium border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'steps'
                              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Steps ({filteredSteps.length})
                          {notes.steps && Object.values(notes.steps).some(n => n) && (
                            <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                              {Object.values(notes.steps).filter(n => n).length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* General Notes */}
                    {activeTab === 'general' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                            General Notes
                          </label>
                          {notes.general && (
                            <button
                              onClick={() => clearNotes('general')}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <textarea
                            value={notes.general || ''}
                            onChange={e => handleGeneralChange(e.target.value)}
                            placeholder="Add your personal notes, tips, modifications, substitutions, cooking times, temperature adjustments, etc..."
                            className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 min-h-[250px] resize-y text-sm leading-relaxed transition-all"
                          />
                          <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                            {(notes.general || '').length} characters
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            💡 Tips
                          </span>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            🔄 Modifications
                          </span>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            ⏱️ Timing
                          </span>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            🌡️ Temperature
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ingredient Notes */}
                    {activeTab === 'ingredients' && (
                      <div className="space-y-4">
                        {filteredIngredients.length === 0 && searchQuery ? (
                          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            No ingredients match your search
                          </div>
                        ) : (
                          filteredIngredients.map(({ ingredient, index }) => {
                            const hasNote = notes.ingredients?.[index];
                            const isExpanded = expandedItems.has(`ingredient-${index}`);

                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  hasNote
                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                      {ingredient.displayText ||
                                        ingredient.original ||
                                        `Ingredient ${index + 1}`}
                                    </label>
                                    {ingredient.amount && (
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {ingredient.amount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {hasNote && (
                                      <button
                                        onClick={() => clearNotes('ingredient', index)}
                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                      >
                                        Clear
                                      </button>
                                    )}
                                    {ingredient.original && ingredient.original.length > 50 && (
                                      <button
                                        onClick={() => toggleExpand('ingredient', index)}
                                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                      >
                                        {isExpanded ? 'Show less' : 'Show more'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <textarea
                                  value={notes.ingredients?.[index] || ''}
                                  onChange={e => handleIngredientChange(index, e.target.value)}
                                  placeholder="Add notes: substitutions, quality tips, where to buy, storage, etc..."
                                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 min-h-[100px] resize-y text-sm leading-relaxed transition-all"
                                />
                                <div className="mt-1 text-xs text-slate-400 text-right">
                                  {(notes.ingredients?.[index] || '').length} characters
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Step Notes */}
                    {activeTab === 'steps' && (
                      <div className="space-y-4">
                        {filteredSteps.length === 0 && searchQuery ? (
                          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            No steps match your search
                          </div>
                        ) : (
                          filteredSteps.map(({ step, index }) => {
                            const hasNote = notes.steps?.[index];
                            const isExpanded = expandedItems.has(`step-${index}`);

                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  hasNote
                                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                                      Step {index + 1}
                                    </label>
                                  </div>
                                  {hasNote && (
                                    <button
                                      onClick={() => clearNotes('step', index)}
                                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                                <div className="mb-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                  <p
                                    className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${
                                      !isExpanded && step.length > 200 ? 'line-clamp-3' : ''
                                    }`}
                                  >
                                    {step}
                                  </p>
                                  {step.length > 200 && (
                                    <button
                                      onClick={() => toggleExpand('step', index)}
                                      className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                                    >
                                      {isExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </div>
                                <textarea
                                  value={notes.steps?.[index] || ''}
                                  onChange={e => handleStepChange(index, e.target.value)}
                                  placeholder="Add notes: timing, temperature, visual cues, common mistakes, tips, etc..."
                                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 min-h-[100px] resize-y text-sm leading-relaxed transition-all"
                                />
                                <div className="mt-1 text-xs text-slate-400 text-right">
                                  {(notes.steps?.[index] || '').length} characters
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
