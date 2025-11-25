import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroceryList } from '../context/GroceryListContext.jsx';
import ShareButton from './ShareButton.jsx';
import { getSimpleConversion } from '../utils/groceryParser.js';
import { useToast } from './Toast.jsx';
import { EmptyStateAnimation } from './LottieFoodAnimations.jsx';
import {
  categorizeIngredient,
  groupByCategory,
  getCategoryInfo,
  GROCERY_CATEGORIES,
} from '../utils/groceryCategories.js';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Circle,
  List,
  Grid,
  SortAsc,
  SortDesc,
  ShoppingBag,
} from 'lucide-react';

export default function GroceryDrawer() {
  const { open, setOpen, items, removeAt, clear, setItems, addOne } = useGroceryList();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // "grouped" | "list"
  const [sortBy, setSortBy] = useState('category'); // "category" | "name" | "checked"
  const [showChecked, setShowChecked] = useState(true); // Show/hide checked items
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('grocery:checked') || '{}');
    } catch {
      return {};
    }
  });

  // Persist checked items
  const updateCheckedItems = updater => {
    setCheckedItems(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('grocery:checked', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleCheck = idx => {
    updateCheckedItems(prev => {
      const key = `item-${idx}`;
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
  };

  const checkAll = () => {
    const updated = {};
    items.forEach((_, idx) => {
      updated[`item-${idx}`] = true;
    });
    updateCheckedItems(updated);
    toast.success('All items checked!');
  };

  const uncheckAll = () => {
    updateCheckedItems({});
    toast.success('All items unchecked!');
  };

  const deleteChecked = () => {
    const checkedIndices = items
      .map((_, idx) => ({ idx, checked: checkedItems[`item-${idx}`] }))
      .filter(({ checked }) => checked)
      .map(({ idx }) => idx)
      .sort((a, b) => b - a); // Sort descending to remove from end first

    if (checkedIndices.length === 0) {
      toast.error('No checked items to delete');
      return;
    }

    checkedIndices.forEach(idx => removeAt(idx));
    updateCheckedItems({});
    toast.success(`Deleted ${checkedIndices.length} item(s)`);
  };

  const startEdit = (idx, currentValue) => {
    setEditingIndex(idx);
    setEditValue(currentValue);
  };

  const saveEdit = idx => {
    if (editValue.trim() && editValue.trim() !== items[idx]) {
      // Update item directly in the items array
      const updated = [...items];
      updated[idx] = editValue.trim();
      setItems(updated);
      toast.success('Item updated!');
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = items;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.toLowerCase().includes(query));
    }

    // Filter checked items
    if (!showChecked) {
      filtered = filtered.filter((_, idx) => !checkedItems[`item-${idx}`]);
    }

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      const aIdx = items.indexOf(a);
      const bIdx = items.indexOf(b);
      const aChecked = checkedItems[`item-${aIdx}`] || false;
      const bChecked = checkedItems[`item-${bIdx}`] || false;

      if (sortBy === 'checked') {
        if (aChecked !== bChecked) return aChecked ? 1 : -1;
        // If both checked or both unchecked, sort by name
        return a.localeCompare(b);
      } else if (sortBy === 'name') {
        return a.localeCompare(b);
      } else if (sortBy === 'category') {
        const catA = categorizeIngredient(a);
        const catB = categorizeIngredient(b);
        const catCompare = catA.localeCompare(catB);
        // If same category, sort by name
        return catCompare !== 0 ? catCompare : a.localeCompare(b);
      }
      return 0;
    });

    return sorted;
  }, [items, searchQuery, showChecked, sortBy, checkedItems]);

  // Group items by category
  const groupedItems = useMemo(() => {
    if (viewMode !== 'grouped') return null;

    const grouped = {};
    processedItems.forEach((item, idx) => {
      const originalIdx = items.indexOf(item);
      const category = categorizeIngredient(item);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ item, originalIdx });
    });

    // Sort categories by predefined order
    const categoryOrder = Object.keys(GROCERY_CATEGORIES);
    const sorted = {};
    for (const cat of categoryOrder) {
      if (grouped[cat] && grouped[cat].length > 0) {
        sorted[cat] = grouped[cat];
      }
    }

    return sorted;
  }, [processedItems, viewMode, items]);

  // Statistics
  const stats = useMemo(() => {
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    return {
      total: totalCount,
      checked: checkedCount,
      remaining: totalCount - checkedCount,
      progress,
    };
  }, [items.length, checkedItems]);

  const copy = async () => {
    const text = items.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Grocery list copied to clipboard!');
    } catch {
      toast.error('Failed to copy list');
    }
  };

  const exportList = () => {
    const text = items.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grocery-list-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('List exported!');
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-full xs:w-[95%] sm:w-[90%] md:w-[85%] max-w-lg bg-white dark:bg-slate-900 shadow-xl border-l border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl">My Grocery List</h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {stats.total} items • {stats.checked} checked
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-manipulation"
                    aria-label="Close grocery list"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </motion.button>
                </div>

                {/* Progress Bar */}
                {stats.total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {stats.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode('grouped')}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                        viewMode === 'grouped'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Grouped</span>
                      </div>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode('list')}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <List className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">List</span>
                      </div>
                    </motion.button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 touch-manipulation"
                  >
                    <option value="category">By Category</option>
                    <option value="name">By Name</option>
                    <option value="checked">Checked First</option>
                  </select>

                  {/* Show/Hide Checked */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChecked(!showChecked)}
                    className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors touch-manipulation ${
                      showChecked
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {showChecked ? (
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="hidden sm:inline">Show Checked</span>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 sm:p-5">
                {items.length === 0 ? (
                  <EmptyStateAnimation message="Your grocery list is empty. Add ingredients from recipes to get started!" />
                ) : processedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Filter className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No items match your search</p>
                  </div>
                ) : viewMode === 'grouped' && groupedItems ? (
                  // Grouped View
                  <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, categoryItems]) => {
                      const catInfo = getCategoryInfo(category);
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{catInfo.icon}</span>
                            <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                              {category}
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              ({categoryItems.length})
                            </span>
                          </div>
                          {categoryItems.map(({ item, originalIdx }) => {
                            const isChecked = checkedItems[`item-${originalIdx}`];
                            return (
                              <GroceryItem
                                key={`${item}-${originalIdx}`}
                                item={item}
                                idx={originalIdx}
                                isChecked={isChecked}
                                onToggle={() => toggleCheck(originalIdx)}
                                onRemove={() => removeAt(originalIdx)}
                                editing={editingIndex === originalIdx}
                                editValue={editValue}
                                onEditChange={setEditValue}
                                onStartEdit={() => startEdit(originalIdx, item)}
                                onSaveEdit={() => saveEdit(originalIdx)}
                                onCancelEdit={cancelEdit}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-2">
                    {processedItems.map((item, displayIdx) => {
                      const originalIdx = items.indexOf(item);
                      const isChecked = checkedItems[`item-${originalIdx}`];
                      return (
                        <GroceryItem
                          key={`${item}-${originalIdx}`}
                          item={item}
                          idx={originalIdx}
                          isChecked={isChecked}
                          onToggle={() => toggleCheck(originalIdx)}
                          onRemove={() => removeAt(originalIdx)}
                          editing={editingIndex === originalIdx}
                          editValue={editValue}
                          onEditChange={setEditValue}
                          onStartEdit={() => startEdit(originalIdx, item)}
                          onSaveEdit={() => saveEdit(originalIdx)}
                          onCancelEdit={cancelEdit}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex-shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                {/* Bulk Actions */}
                {items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={checkAll}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Check All</span>
                      </div>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={uncheckAll}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Uncheck All</span>
                      </div>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={deleteChecked}
                      disabled={stats.checked === 0}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Delete Checked</span>
                      </div>
                    </motion.button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {items.length > 0 && (
                    <div className="flex gap-2 flex-1 sm:flex-none">
                      <ShareButton
                        title="My Grocery List"
                        text={`My grocery list:\n${items.join('\n')}`}
                        url={window.location.href}
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={copy}
                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Copy</span>
                        </div>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={exportList}
                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Export</span>
                        </div>
                      </motion.button>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clear}
                    disabled={items.length === 0}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Clear All</span>
                    </div>
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

// Grocery Item Component
function GroceryItem({
  item,
  idx,
  isChecked,
  onToggle,
  onRemove,
  editing,
  editValue,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}) {
  const conversion = getSimpleConversion(item);
  const category = categorizeIngredient(item);
  const catInfo = getCategoryInfo(category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 sm:gap-3 rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 transition-all touch-manipulation ${
        isChecked
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
      }`}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="flex-shrink-0 touch-manipulation"
        aria-label={isChecked ? 'Uncheck item' : 'Check item'}
      >
        {isChecked ? (
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
        )}
      </motion.button>

      <div
        className={`flex-1 min-w-0 ${isChecked ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}
      >
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={e => onEditChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="flex-1 px-2 py-1 text-sm rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSaveEdit}
              className="p-1 text-emerald-600 dark:text-emerald-400 touch-manipulation"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onCancelEdit}
              className="p-1 text-slate-400 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="font-medium break-words text-sm sm:text-base">{item}</span>
              {!isChecked && conversion && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {conversion}
                </div>
              )}
            </div>
            {!isChecked && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onStartEdit}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors touch-manipulation"
                  aria-label="Edit item"
                >
                  <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onRemove}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
