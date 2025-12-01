import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  // Load initial state from localStorage
  const loadFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        if (key.includes('selectedIntolerances')) {
          return JSON.parse(stored);
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
      localStorage.setItem('filters:diet', diet);
      localStorage.setItem('filters:intolerances', intolerances);
      localStorage.setItem('filters:maxTime', maxTime);
      localStorage.setItem('filters:mealType', mealType);
      localStorage.setItem('filters:maxCalories', maxCalories);
      localStorage.setItem('filters:healthScore', healthScore);
      localStorage.setItem('filters:cuisine', cuisine);
      localStorage.setItem('filters:difficulty', difficulty);
      localStorage.setItem('filters:minProtein', minProtein);
      localStorage.setItem('filters:maxCarbs', maxCarbs);
      localStorage.setItem('filters:selectedIntolerances', JSON.stringify(selectedIntolerances));
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
