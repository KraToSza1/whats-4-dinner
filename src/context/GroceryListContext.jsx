import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { canPerformAction, getPlanDetails, hasFeature } from '../utils/subscription.js';

const KEY = 'grocery:list:v2'; // Updated version
const DrawerContext = createContext(null);

/** Normalize for comparison (trim, collapse spaces, lowercase for dedupe) */
function normForCompare(s) {
  if (typeof s === 'object') {
    return String(s.name || s)
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
  return String(s).trim().replace(/\s+/g, ' ').toLowerCase();
}
/** Clean for storage (trim, collapse spaces; keep original casing) */
function cleanForStore(s) {
  return String(s).trim().replace(/\s+/g, ' ');
}

// Basic normalization/aggregation for human-friendly grocery entries
const UNITS = [
  'cup',
  'cups',
  'tbsp',
  'tablespoon',
  'tablespoons',
  'tsp',
  'teaspoon',
  'teaspoons',
  'lb',
  'lbs',
  'pound',
  'pounds',
  'oz',
  'ounce',
  'ounces',
  'g',
  'gram',
  'grams',
  'kg',
  'kilogram',
  'kilograms',
  'ml',
  'milliliter',
  'milliliters',
  'l',
  'liter',
  'liters',
  'pinch',
  'clove',
  'cloves',
  'slice',
  'slices',
  'can',
  'cans',
  'package',
  'packages',
];
const DESCRIPTORS = [
  'boneless',
  'skinless',
  'fresh',
  'ground',
  'dried',
  'chopped',
  'diced',
  'minced',
  'sliced',
  'grated',
  'shredded',
  'to',
  'taste',
  'of',
  'the',
  'and',
  'or',
  'for',
  'about',
  'plus',
  'divided',
  'optional',
];
const ALIASES = [
  [/(extra[-\s]?virgin\s+)?olive\s+oil/, 'olive oil'],
  [/vegetable\s+oil/, 'vegetable oil'],
  [/canola\s+oil/, 'canola oil'],
  [/soy\s*sauce/, 'soy sauce'],
  [/fish\s*sauce/, 'fish sauce'],
  [/chicken\s*breasts?/, 'chicken'],
  [/chicken\s*thighs?/, 'chicken'],
  [/beef\s+broth|beef\s+stock/, 'beef broth'],
  [/chicken\s+broth|chicken\s+stock/, 'chicken broth'],
  [/garlic\s+cloves?/, 'garlic'],
  [/green\s*onions?|scallions?/, 'green onion'],
  [/onions?/, 'onion'],
  [/tomatoes?/, 'tomato'],
  [/potatoes?/, 'potato'],
  [/bell\s*peppers?/, 'bell pepper'],
  [/spaghetti|pasta/, 'pasta'],
];

function toTitleCase(s) {
  return s.replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

/**
 * Convert raw ingredient strings like "1 tbsp extra-virgin olive oil (divided)"
 * into a canonical item like "olive oil" for grocery aggregation.
 */
export function normalizeIngredient(raw) {
  if (!raw) return '';
  let s = String(raw).toLowerCase();
  // remove parentheses
  s = s.replace(/\([^)]*\)/g, ' ');
  // remove fractions and numbers (including unicode ¼½¾ etc.)
  s = s.replace(/[0-9]+(?:\.[0-9]+)?/g, ' ').replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, ' ');
  // split tokens and remove units/descriptors/punctuation
  const tokens = s
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => !UNITS.includes(t))
    .filter(t => !DESCRIPTORS.includes(t));
  let base = tokens.join(' ').trim();
  // alias mapping
  for (const [re, name] of ALIASES) {
    if (re.test(base)) {
      base = name;
      break;
    }
  }
  // fallback: keep first 2 words
  if (!base) base = raw;
  const firstTwo = base.split(/\s+/).slice(0, 2).join(' ');
  const result = toTitleCase(firstTwo.trim());
  return result;
}

function readList() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    // Handle migration from old version
    const migrated = raw
      .map(item => {
        if (typeof item === 'string') return cleanForStore(item);
        return item;
      })
      .filter(Boolean);
    return migrated;
  } catch {
    return [];
  }
}
function writeList(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function GroceryListProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => readList());

  // Persist on change
  useEffect(() => {
    writeList(items);
  }, [items]);

  // Cross-tab sync (listen for storage events)
  useEffect(() => {
    const onStorage = e => {
      if (e.key === KEY) {
        try {
          const next = JSON.parse(e.newValue || '[]');
          if (Array.isArray(next)) setItems(next);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /** Merge new items with existing, normalize for aggregation, case-insensitive dedupe */
  const addMany = (arr, keepQuantities = false) => {
    // Note: Grocery lists are now unlimited for all plans
    // No need to check feature access or limits anymore

    const cleaned = (arr || [])
      .map(s => {
        if (keepQuantities) {
          return cleanForStore(s);
        }
        return normalizeIngredient(s);
      })
      .filter(Boolean);

    if (!cleaned.length) return;

    setItems(cur => {
      const seen = new Set(cur.map(normForCompare));
      const merged = [...cur];
      for (const it of cleaned) {
        const key = normForCompare(it);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(it);
        }
      }
      return merged;
    });
    setOpen(true);
  };

  const addOne = s => addMany([s]);

  const removeAt = i => setItems(cur => cur.filter((_, idx) => idx !== i));

  const clear = () => setItems([]);

  // Optional helpers (non-breaking)
  const hasItem = s => {
    const key = normForCompare(s);
    return items.some(it => normForCompare(it) === key);
  };
  const exportList = () => [...items];
  const importList = arr => addMany(Array.isArray(arr) ? arr : []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      items,
      setItems,
      addMany,
      addOne,
      removeAt,
      clear,
      // helpers
      hasItem,
      exportList,
      importList,
    }),
    [open, items]
  );

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useGroceryList() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useGroceryList must be used within GroceryListProvider');
  return ctx;
}
