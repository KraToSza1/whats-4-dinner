// src/components/PantryChips.jsx
import React, { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  ChefHat,
  ShoppingCart,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGroceryList } from '../context/GroceryListContext.jsx';
import { useToast } from './Toast.jsx';

// Expanded ingredient list with emojis/icons
const INGREDIENT_DATA = {
  // Protein
  chicken: { category: 'Protein', emoji: '🍗', color: 'from-red-500 to-orange-500' },
  beef: { category: 'Protein', emoji: '🥩', color: 'from-red-600 to-red-700' },
  pork: { category: 'Protein', emoji: '🥓', color: 'from-pink-500 to-rose-500' },
  fish: { category: 'Protein', emoji: '🐟', color: 'from-blue-500 to-cyan-500' },
  salmon: { category: 'Protein', emoji: '🐟', color: 'from-orange-400 to-pink-400' },
  shrimp: { category: 'Protein', emoji: '🦐', color: 'from-pink-400 to-rose-400' },
  eggs: { category: 'Protein', emoji: '🥚', color: 'from-yellow-100 to-yellow-200' },
  bacon: { category: 'Protein', emoji: '🥓', color: 'from-red-500 to-pink-500' },
  tofu: { category: 'Protein', emoji: '🧈', color: 'from-slate-300 to-slate-400' },
  beans: { category: 'Protein', emoji: '🫘', color: 'from-amber-600 to-orange-600' },
  lentils: { category: 'Protein', emoji: '🫘', color: 'from-orange-500 to-red-500' },
  chickpeas: { category: 'Protein', emoji: '🫘', color: 'from-yellow-500 to-amber-500' },
  turkey: { category: 'Protein', emoji: '🦃', color: 'from-amber-600 to-orange-600' },
  lamb: { category: 'Protein', emoji: '🐑', color: 'from-slate-400 to-slate-500' },
  // Vegetables
  tomato: { category: 'Vegetables', emoji: '🍅', color: 'from-red-400 to-red-500' },
  onion: { category: 'Vegetables', emoji: '🧅', color: 'from-purple-300 to-purple-400' },
  garlic: { category: 'Vegetables', emoji: '🧄', color: 'from-white to-slate-100' },
  potato: { category: 'Vegetables', emoji: '🥔', color: 'from-amber-200 to-yellow-200' },
  carrot: { category: 'Vegetables', emoji: '🥕', color: 'from-orange-400 to-orange-500' },
  broccoli: { category: 'Vegetables', emoji: '🥦', color: 'from-green-500 to-emerald-500' },
  'bell pepper': { category: 'Vegetables', emoji: '🫑', color: 'from-green-400 to-emerald-400' },
  mushroom: { category: 'Vegetables', emoji: '🍄', color: 'from-amber-300 to-orange-300' },
  spinach: { category: 'Vegetables', emoji: ' spinach', color: 'from-green-600 to-emerald-600' },
  lettuce: { category: 'Vegetables', emoji: '🥬', color: 'from-green-400 to-lime-400' },
  avocado: { category: 'Vegetables', emoji: '🥑', color: 'from-green-500 to-emerald-500' },
  cucumber: { category: 'Vegetables', emoji: '🥒', color: 'from-green-400 to-emerald-400' },
  zucchini: { category: 'Vegetables', emoji: '🥒', color: 'from-green-500 to-lime-500' },
  corn: { category: 'Vegetables', emoji: '🌽', color: 'from-yellow-400 to-amber-400' },
  peas: { category: 'Vegetables', emoji: '🫛', color: 'from-green-500 to-emerald-500' },
  celery: { category: 'Vegetables', emoji: '🥬', color: 'from-green-400 to-lime-400' },
  cabbage: { category: 'Vegetables', emoji: '🥬', color: 'from-green-300 to-emerald-300' },
  cauliflower: { category: 'Vegetables', emoji: '🥦', color: 'from-white to-slate-50' },
  eggplant: { category: 'Vegetables', emoji: '🍆', color: 'from-purple-500 to-indigo-500' },
  sweet_potato: { category: 'Vegetables', emoji: '🍠', color: 'from-orange-500 to-red-500' },
  // Grains
  rice: { category: 'Grains', emoji: '🍚', color: 'from-white to-slate-100' },
  pasta: { category: 'Grains', emoji: '🍝', color: 'from-amber-200 to-yellow-200' },
  quinoa: { category: 'Grains', emoji: '🌾', color: 'from-amber-400 to-yellow-400' },
  bread: { category: 'Grains', emoji: '🍞', color: 'from-amber-300 to-orange-300' },
  flour: { category: 'Grains', emoji: '🌾', color: 'from-slate-100 to-slate-200' },
  oats: { category: 'Grains', emoji: '🌾', color: 'from-amber-200 to-yellow-200' },
  barley: { category: 'Grains', emoji: '🌾', color: 'from-amber-300 to-yellow-300' },
  couscous: { category: 'Grains', emoji: '🌾', color: 'from-yellow-200 to-amber-200' },
  // Dairy
  cheese: { category: 'Dairy', emoji: '🧀', color: 'from-yellow-300 to-amber-300' },
  milk: { category: 'Dairy', emoji: '🥛', color: 'from-white to-slate-50' },
  yogurt: { category: 'Dairy', emoji: '🥛', color: 'from-white to-blue-50' },
  cream: { category: 'Dairy', emoji: '🥛', color: 'from-white to-yellow-50' },
  butter: { category: 'Dairy', emoji: '🧈', color: 'from-yellow-300 to-yellow-400' },
  sour_cream: { category: 'Dairy', emoji: '🥛', color: 'from-white to-slate-100' },
  // Fruits
  lemon: { category: 'Fruits', emoji: '🍋', color: 'from-yellow-300 to-yellow-400' },
  lime: { category: 'Fruits', emoji: '🍋', color: 'from-green-300 to-lime-300' },
  apple: { category: 'Fruits', emoji: '🍎', color: 'from-red-400 to-red-500' },
  banana: { category: 'Fruits', emoji: '🍌', color: 'from-yellow-400 to-yellow-500' },
  strawberry: { category: 'Fruits', emoji: '🍓', color: 'from-red-400 to-pink-400' },
  orange: { category: 'Fruits', emoji: '🍊', color: 'from-orange-400 to-orange-500' },
  grapes: { category: 'Fruits', emoji: '🍇', color: 'from-purple-400 to-indigo-400' },
  berries: { category: 'Fruits', emoji: '🫐', color: 'from-blue-500 to-indigo-500' },
  pineapple: { category: 'Fruits', emoji: '🍍', color: 'from-yellow-400 to-amber-400' },
  mango: { category: 'Fruits', emoji: '🥭', color: 'from-orange-400 to-yellow-400' },
  // Herbs & Spices
  basil: { category: 'Herbs & Spices', emoji: '🌿', color: 'from-green-500 to-emerald-500' },
  parsley: { category: 'Herbs & Spices', emoji: '🌿', color: 'from-green-400 to-lime-400' },
  cilantro: { category: 'Herbs & Spices', emoji: '🌿', color: 'from-green-500 to-emerald-500' },
  rosemary: { category: 'Herbs & Spices', emoji: '🌿', color: 'from-green-600 to-emerald-600' },
  thyme: { category: 'Herbs & Spices', emoji: '🌿', color: 'from-green-500 to-lime-500' },
  oregano: { category: 'Herbs & Spices', emoji: '🌿', color: 'from-green-600 to-emerald-600' },
  // Other
  sugar: { category: 'Other', emoji: '🍬', color: 'from-white to-slate-100' },
  salt: { category: 'Other', emoji: '🧂', color: 'from-white to-slate-100' },
  pepper: { category: 'Other', emoji: '🌶️', color: 'from-red-500 to-orange-500' },
  olive_oil: { category: 'Other', emoji: '🫒', color: 'from-green-400 to-emerald-400' },
  vinegar: { category: 'Other', emoji: '🍶', color: 'from-amber-200 to-yellow-200' },
  soy_sauce: { category: 'Other', emoji: '🍶', color: 'from-amber-700 to-orange-700' },
  honey: { category: 'Other', emoji: '🍯', color: 'from-yellow-400 to-amber-400' },
};

const SUGGESTIONS = Object.keys(INGREDIENT_DATA);
const CATEGORIES = {
  All: SUGGESTIONS,
  Protein: SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Protein'),
  Vegetables: SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Vegetables'),
  Grains: SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Grains'),
  Dairy: SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Dairy'),
  Fruits: SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Fruits'),
  'Herbs & Spices': SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Herbs & Spices'),
  Other: SUGGESTIONS.filter(i => INGREDIENT_DATA[i].category === 'Other'),
};

export default function PantryChips({ pantry, setPantry, onSearch, showQuickActions = true }) {
  const [custom, setCustom] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { addItems } = useGroceryList();
  const toast = useToast();

  // Helper to determine if a color is light (needs dark text)
  const isLightColor = color => {
    const lightColors = [
      'from-white',
      'to-slate-50',
      'to-slate-100',
      'to-yellow-100',
      'to-yellow-200',
      'to-amber-200',
      'to-amber-300',
      'to-yellow-300',
      'to-yellow-400',
      'to-lime-300',
      'to-green-300',
      'to-green-400',
      'to-emerald-300',
      'to-emerald-400',
      'to-blue-50',
      'to-purple-300',
      'to-purple-400',
      'from-yellow-100',
      'from-yellow-200',
      'from-amber-200',
      'from-amber-300',
      'from-yellow-300',
      'from-slate-100',
      'from-slate-200',
      'from-slate-300',
      'from-white',
      'from-slate-50',
    ];
    return lightColors.some(light => color.includes(light));
  };

  const toggle = item => {
    setPantry(cur => (cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item]));
  };

  const addCustom = () => {
    const val = custom.trim().toLowerCase().replace(/\s+/g, '_');
    if (!val) return;
    if (!pantry.includes(val)) {
      setPantry(cur => [...cur, val]);
      toast.success(`Added ${custom.trim()} to pantry!`);
    } else {
      toast.info(`${custom.trim()} is already in your pantry`);
    }
    setCustom('');
    inputRef.current?.focus();
  };

  const clearAll = () => {
    if (pantry.length > 0) {
      setPantry([]);
      toast.success('Pantry cleared!');
    }
  };

  const handleFindRecipes = () => {
    if (pantry.length === 0) {
      toast.warning('Please select at least one ingredient first!');
      return;
    }
    if (onSearch) {
      onSearch(pantry.join(', '));
    }
  };

  const handleAddToGroceryList = () => {
    if (pantry.length === 0) {
      toast.warning('No ingredients selected!');
      return;
    }
    const items = pantry.map(ing => ({
      name: ing.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      quantity: '',
      unit: '',
      category: 'Pantry',
    }));
    addItems(items);
    toast.success(
      `Added ${pantry.length} ingredient${pantry.length !== 1 ? 's' : ''} to grocery list!`
    );
  };

  const handleUseInMealPlanner = () => {
    if (pantry.length === 0) {
      toast.warning('No ingredients selected!');
      return;
    }
    navigate('/meal-planner');
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('usePantryIngredients', {
          detail: { ingredients: pantry },
        })
      );
    }, 300);
    toast.success('Opening meal planner with your pantry ingredients!');
  };

  const getFilteredSuggestions = useMemo(() => {
    let filtered = CATEGORIES[activeCategory] || SUGGESTIONS;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ing => ing.toLowerCase().includes(query));
    }
    return filtered;
  }, [activeCategory, searchQuery]);

  const categories = Object.keys(CATEGORIES);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-4 sm:mt-6"
    >
      {/* Main Pantry Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-5 sm:p-8 border-2 border-amber-200 dark:border-amber-800 shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg border-2 border-white/20"
              >
                <ChefHat className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mb-1">
                  Look inside your pantry Or Fridge and find recipes?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select ingredients, choose and cook!
                </p>
              </div>
            </div>
            <AnimatePresence>
              {pantry.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={clearAll}
                  className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-md flex items-center gap-2"
                  title="Clear all ingredients"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ingredients..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg scale-105'
                      : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Selected Count & Stats */}
          {pantry.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                    {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                {showQuickActions && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFindRecipes}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Find Recipes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUseInMealPlanner}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Meal Planner
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToGroceryList}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Grocery List
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Ingredient Chips */}
          <div className="flex flex-wrap gap-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {getFilteredSuggestions.map((ing, idx) => {
                const active = pantry.includes(ing);
                const data = INGREDIENT_DATA[ing] || {
                  emoji: '🥘',
                  color: 'from-slate-400 to-slate-500',
                };
                const isLight = isLightColor(data.color);
                const textColor =
                  active && isLight
                    ? 'text-slate-900 dark:text-slate-900'
                    : active
                      ? 'text-white'
                      : 'text-slate-700 dark:text-slate-300';
                const checkmarkColor =
                  active && isLight
                    ? 'bg-slate-900/20 dark:bg-slate-900/30'
                    : 'bg-white/30 dark:bg-white/20';
                const checkmarkIconColor =
                  active && isLight ? 'text-slate-900 dark:text-slate-900' : 'text-white';

                return (
                  <motion.button
                    key={ing}
                    layout
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => toggle(ing)}
                    aria-pressed={active}
                    className={`group relative px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl xs:rounded-2xl border-2 font-semibold transition-all text-xs xs:text-sm shadow-lg flex items-center gap-1.5 xs:gap-2 min-w-[100px] xs:min-w-[120px] touch-manipulation min-h-[44px] ${
                      active
                        ? `bg-gradient-to-r ${data.color} border-2 ${isLight ? 'border-slate-300 dark:border-slate-400' : 'border-white/30 dark:border-white/20'} ${textColor} shadow-xl ring-2 ${isLight ? 'ring-slate-200 dark:ring-slate-300' : 'ring-white/20 dark:ring-white/10'} font-bold relative overflow-hidden`
                        : 'bg-white/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    }`}
                  >
                    {/* Dark overlay for light colors to improve readability */}
                    {active && isLight && (
                      <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-900/10 pointer-events-none" />
                    )}
                    <span className="text-base xs:text-lg shrink-0 relative z-10">
                      {data.emoji}
                    </span>
                    <span className="flex-1 text-left truncate relative z-10">
                      {ing.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-4 h-4 xs:w-5 xs:h-5 rounded-full ${checkmarkColor} flex items-center justify-center shrink-0 relative z-10`}
                      >
                        <CheckCircle2
                          className={`w-3 h-3 xs:w-3.5 xs:h-3.5 ${checkmarkIconColor}`}
                        />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Add Custom Ingredient */}
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <motion.div
              whileHover={{ rotate: 90 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md flex-shrink-0 hidden sm:flex"
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.div>
            <input
              ref={inputRef}
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Type ingredient name and press Enter..."
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm min-h-[48px] sm:min-h-0"
              aria-label="Add a custom ingredient"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={addCustom}
              disabled={!custom.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[48px] sm:min-h-0 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add</span>
            </motion.button>
          </div>

          {/* Selected Ingredients Preview */}
          {pantry.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40 backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-800 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                    Your Pantry ({pantry.length})
                  </p>
                </div>
                {onSearch && (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFindRecipes}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                    title="Find recipes with these ingredients"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Find Recipes</span>
                    <span className="sm:hidden">Find</span>
                  </motion.button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {pantry.map(item => {
                  const data = INGREDIENT_DATA[item] || {
                    emoji: '🥘',
                    color: 'from-slate-400 to-slate-500',
                  };
                  return (
                    <motion.span
                      key={item}
                      layout
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold border-2 border-emerald-300 dark:border-emerald-700 shadow-md"
                    >
                      <span>{data.emoji}</span>
                      <span>{item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <button
                        onClick={() => toggle(item)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
