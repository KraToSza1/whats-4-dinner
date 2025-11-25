import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLLECTIONS = [
  { id: 'quick', name: 'Quick & Easy', emoji: '⚡', color: 'emerald' },
  { id: 'healthy', name: 'Healthy', emoji: '💚', color: 'green' },
  { id: 'comfort', name: 'Comfort Food', emoji: '🍜', color: 'amber' },
  { id: 'date-night', name: 'Date Night', emoji: '🕯️', color: 'violet' },
  { id: 'meal-prep', name: 'Meal Prep', emoji: '📦', color: 'blue' },
  { id: 'holidays', name: 'Holidays', emoji: '🎄', color: 'red' },
  { id: 'desserts', name: 'Desserts', emoji: '🍰', color: 'pink' },
  { id: 'custom', name: 'Custom', emoji: '📁', color: 'slate' },
];

export default function RecipeCollections({ onCollectionSelect, selectedCollections = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [customCollection, setCustomCollection] = useState('');
  const [customCollections, setCustomCollections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customCollections') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('customCollections', JSON.stringify(customCollections));
    } catch {}
  }, [customCollections]);

  const allCollections = [...COLLECTIONS, ...customCollections];

  const handleAddCustom = () => {
    const name = customCollection.trim();
    if (!name) return;
    setCustomCollections([
      ...customCollections,
      {
        id: `custom-${Date.now()}`,
        name,
        emoji: '📁',
        color: 'slate',
      },
    ]);
    setCustomCollection('');
  };

  const handleToggleCollection = collectionId => {
    onCollectionSelect(
      selectedCollections.includes(collectionId)
        ? selectedCollections.filter(id => id !== collectionId)
        : [...selectedCollections, collectionId]
    );
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        📁 Organize
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 p-6 max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">📁 Organize Recipes</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-2xl hover:text-emerald-400 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {allCollections.map(collection => {
                  const isSelected = selectedCollections.includes(collection.id);
                  return (
                    <motion.button
                      key={collection.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleCollection(collection.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{collection.emoji}</span>
                        <span className="font-medium">{collection.name}</span>
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

              {/* Add custom collection */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCollection}
                    onChange={e => setCustomCollection(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                    placeholder="Create custom collection..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddCustom}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium"
                  >
                    Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
