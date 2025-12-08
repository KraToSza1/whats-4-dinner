import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  safeLocalStorage,
  safeJSONParse,
  safeJSONStringify,
} from '../utils/browserCompatibility.js';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  // Load initial state from localStorage
  const loadFromStorage = (key, defaultValue) => {
    try {
      const stored = safeLocalStorage.getItem(key);
      if (stored) {
        if (key.includes('selectedIntolerances')) {
          return safeJSONParse(stored, defaultValue);
        }
        return stored;
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
    }
    return defaultValue;
  };

  const [diet, setDiet] = useState(() => loadFromStorage('filters:diet', ''));
  const [intolerances, setIntolerances] = useState(() =>
    loadFromStorage('filters:intolerances', '')
  );
  const [selectedIntolerances, setSelectedIntolerances] = useState(() =>
    loadFromStorage('filters:selectedIntolerances', [])
  );
  const [maxTime, setMaxTime] = useState(() => loadFromStorage('filters:maxTime', ''));
  const [mealType, setMealType] = useState(() => loadFromStorage('filters:mealType', ''));
  const [maxCalories, setMaxCalories] = useState(() => loadFromStorage('filters:maxCalories', ''));
  const [healthScore, setHealthScore] = useState(() => loadFromStorage('filters:healthScore', ''));
  const [cuisine, setCuisine] = useState(() => loadFromStorage('filters:cuisine', ''));
  const [difficulty, setDifficulty] = useState(() => loadFromStorage('filters:difficulty', ''));
  const [minProtein, setMinProtein] = useState(() => loadFromStorage('filters:minProtein', ''));
  const [maxCarbs, setMaxCarbs] = useState(() => loadFromStorage('filters:maxCarbs', ''));

  // Persist to localStorage whenever filters change
  useEffect(() => {
    try {
      safeLocalStorage.setItem('filters:diet', diet);
      safeLocalStorage.setItem('filters:intolerances', intolerances);
      safeLocalStorage.setItem('filters:maxTime', maxTime);
      safeLocalStorage.setItem('filters:mealType', mealType);
      safeLocalStorage.setItem('filters:maxCalories', maxCalories);
      safeLocalStorage.setItem('filters:healthScore', healthScore);
      safeLocalStorage.setItem('filters:cuisine', cuisine);
      safeLocalStorage.setItem('filters:difficulty', difficulty);
      safeLocalStorage.setItem('filters:minProtein', minProtein);
      safeLocalStorage.setItem('filters:maxCarbs', maxCarbs);
      safeLocalStorage.setItem(
        'filters:selectedIntolerances',
        safeJSONStringify(selectedIntolerances, '[]')
      );
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [
    diet,
    intolerances,
    maxTime,
    mealType,
    maxCalories,
    healthScore,
    cuisine,
    difficulty,
    minProtein,
    maxCarbs,
    selectedIntolerances,
  ]);

  // Get all active filters as an object
  const getActiveFilters = useCallback(() => {
    return {
      diet,
      intolerances: selectedIntolerances.length > 0 ? selectedIntolerances.join(',') : '',
      maxTime,
      mealType,
      maxCalories,
      healthScore,
      cuisine,
      difficulty,
      minProtein,
      maxCarbs,
      selectedIntolerances,
    };
  }, [
    diet,
    selectedIntolerances,
    maxTime,
    mealType,
    maxCalories,
    healthScore,
    cuisine,
    difficulty,
    minProtein,
    maxCarbs,
  ]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return !!(
      diet ||
      selectedIntolerances.length > 0 ||
      maxTime ||
      mealType ||
      maxCalories ||
      healthScore ||
      cuisine ||
      difficulty ||
      minProtein ||
      maxCarbs
    );
  }, [
    diet,
    selectedIntolerances,
    maxTime,
    mealType,
    maxCalories,
    healthScore,
    cuisine,
    difficulty,
    minProtein,
    maxCarbs,
  ]);

  // Get count of active filters
  const getActiveFilterCount = useCallback(() => {
    return [
      diet,
      selectedIntolerances.length,
      maxTime,
      mealType,
      maxCalories,
      healthScore,
      cuisine,
      difficulty,
      minProtein,
      maxCarbs,
    ].filter(Boolean).length;
  }, [
    diet,
    selectedIntolerances,
    maxTime,
    mealType,
    maxCalories,
    healthScore,
    cuisine,
    difficulty,
    minProtein,
    maxCarbs,
  ]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setDiet('');
    setIntolerances('');
    setSelectedIntolerances([]);
    setMaxTime('');
    setMealType('');
    setMaxCalories('');
    setHealthScore('');
    setCuisine('');
    setDifficulty('');
    setMinProtein('');
    setMaxCarbs('');
  }, []);

  const value = {
    // State
    diet,
    setDiet,
    intolerances,
    setIntolerances,
    selectedIntolerances,
    setSelectedIntolerances,
    maxTime,
    setMaxTime,
    mealType,
    setMealType,
    maxCalories,
    setMaxCalories,
    healthScore,
    setHealthScore,
    cuisine,
    setCuisine,
    difficulty,
    setDifficulty,
    minProtein,
    setMinProtein,
    maxCarbs,
    setMaxCarbs,
    // Computed
    getActiveFilters,
    hasActiveFilters,
    getActiveFilterCount,
    resetFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
