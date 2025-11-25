import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCollections,
  addCollection,
  deleteCollection,
  getRecipeCollectionsForRecipe,
  toggleRecipeInCollection,
} from '../utils/recipeCollections.js';
import { useToast } from './Toast.jsx';

export default function RecipeCollectionsButton({ recipeId }) {
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState(getCollections);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [customName, setCustomName] = useState('');
  const inputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (recipeId) {
      setSelectedCollections(getRecipeCollectionsForRecipe(recipeId));
    }
  }, [recipeId]);

  useEffect(() => {
    if (showModal) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Reset input when modal opens
      setCustomName('');
      // Focus the input after a brief delay to ensure modal is rendered
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = '';
          inputRef.current.focus();
        }
      }, 200);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const handleToggle = collectionId => {
    if (!recipeId) return;
    const wasAdded = toggleRecipeInCollection(recipeId, collectionId);
    setSelectedCollections(getRecipeCollectionsForRecipe(recipeId));

    // Show feedback and close modal
    const collection = collections.find(c => c.id === collectionId);
    const collectionName = collection?.name || 'collection';
    if (wasAdded) {
      toast.success(`Added to "${collectionName}"!`);
    } else {
      toast.info(`Removed from "${collectionName}"`);
    }

    // Close modal after a short delay to show the feedback
    setTimeout(() => {
      setShowModal(false);
    }, 800);
  };

  const handleAddCustom = () => {
    // Get value directly from input ref to ensure we have the latest value
    const inputValue = inputRef.current?.value || customName;
    const name = String(inputValue).trim();

    console.log('🔵 [Collections] handleAddCustom called', {
      inputRefValue: inputRef.current?.value,
      customNameState: customName,
      finalName: name,
      recipeId,
    });

    if (!name) {
      console.warn('⚠️ [Collections] Name is empty, cannot create collection');
      toast.error('Please enter a collection name');
      return;
    }

    try {
      console.log('🔵 [Collections] Creating collection with name:', name);
      const newCollection = addCollection(name);
      console.log('✅ [Collections] Collection created:', newCollection);

      setCollections(getCollections());
      setCustomName('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      // Auto-add to this collection
      if (recipeId) {
        console.log('🔵 [Collections] Adding recipe to collection:', {
          recipeId,
          collectionId: newCollection.id,
        });
        toggleRecipeInCollection(recipeId, newCollection.id);
        setSelectedCollections(getRecipeCollectionsForRecipe(recipeId));
        toast.success(`Created "${name}" and added recipe!`);
      } else {
        toast.success(`Created "${name}" collection!`);
      }

      // Close modal after adding
      setTimeout(() => {
        setShowModal(false);
      }, 500);
    } catch (error) {
      console.error('❌ [Collections] Error in handleAddCustom:', error);
      toast.error('Failed to create collection. Please try again.');
    }
  };

  const handleDelete = (collectionId, e) => {
    e.stopPropagation();
    if (confirm('Delete this collection? Recipes will be removed from it.')) {
      deleteCollection(collectionId);
      setCollections(getCollections());
      setSelectedCollections(getRecipeCollectionsForRecipe(recipeId));
    }
  };

  if (!recipeId) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        type="button"
        className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-0 touch-manipulation flex-shrink-0 z-30 relative"
        title="Save to collection"
        style={{ zIndex: 30 }}
      >
        <span className="text-base sm:text-lg">📁</span>
        <span className="hidden sm:inline">
          {selectedCollections.length > 0
            ? `${selectedCollections.length} Collections`
            : 'Save to Collection'}
        </span>
        <span className="sm:hidden">Save</span>
      </motion.button>

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <motion.div
                key="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
                onClick={() => {
                  setShowModal(false);
                }}
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
                    key="modal-content"
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 50, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/30 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-2xl relative"
                    style={{ zIndex: 100000, position: 'relative', pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        📁 Save to Collection
                      </h3>
                      <button
                        onClick={() => setShowModal(false)}
                        className="text-2xl hover:text-emerald-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2 mb-6">
                      {collections.map(collection => {
                        const isSelected = selectedCollections.includes(collection.id);
                        return (
                          <motion.button
                            key={collection.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleToggle(collection.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{collection.emoji}</span>
                              <span className="font-medium">{collection.name}</span>
                              {collection.custom && (
                                <button
                                  onClick={e => handleDelete(collection.id, e)}
                                  className="ml-2 text-red-500 hover:text-red-700 text-sm"
                                  title="Delete collection"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-emerald-500 text-xl"
                              >
                                ✓
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          defaultValue={customName}
                          onChange={e => {
                            const newValue = e.target.value;
                            console.log('🔵 [Collections] Input onChange:', newValue);
                            setCustomName(newValue);
                          }}
                          onKeyDown={e => {
                            console.log(
                              '🔵 [Collections] Input onKeyDown:',
                              e.key,
                              'value:',
                              e.target.value
                            );
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              const value = e.target.value.trim();
                              if (value) {
                                handleAddCustom();
                              }
                            }
                          }}
                          onClick={e => {
                            e.stopPropagation();
                          }}
                          onFocus={e => {
                            e.stopPropagation();
                          }}
                          onInput={e => {
                            // Ensure value is captured
                            const value = e.target.value;
                            console.log('🔵 [Collections] Input onInput:', value);
                            setCustomName(value);
                          }}
                          placeholder="Create new collection..."
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-900 dark:text-slate-100"
                          autoFocus
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            const inputValue = inputRef.current?.value?.trim() || customName.trim();
                            console.log('🔵 [Collections] Add button clicked', {
                              customName,
                              inputRefValue: inputRef.current?.value,
                              finalValue: inputValue,
                              disabled: !inputValue,
                            });
                            if (inputValue) {
                              handleAddCustom();
                            } else {
                              toast.error('Please enter a collection name');
                            }
                          }}
                          type="button"
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors touch-manipulation"
                        >
                          Add
                        </motion.button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Enter a collection name and click Add to create a new collection
                      </p>
                    </div>
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
