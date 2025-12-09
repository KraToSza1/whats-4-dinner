import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/browserCompatibility.js';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Try to get theme from localStorage
    const savedTheme = safeLocalStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Fallback: check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      } catch (_e) {
        // Fallback to dark if system preference check fails
        return 'dark';
      }
    }
    // Final fallback
    return 'dark';
  });

  const applyTheme = (nextTheme) => {
    if (typeof document === 'undefined') {
      return;
    }

    try {
      const html = document.documentElement;
      
      html.classList.remove('dark', 'light');
      
      if (nextTheme === 'dark') {
        html.classList.add('dark');
      }
      
      html.setAttribute('data-theme', nextTheme);
      html.style.colorScheme = nextTheme;
      
      // Force style recalculation
      void html.offsetHeight;
      void document.body.offsetHeight;
      window.getComputedStyle(html);
      window.getComputedStyle(document.body);

      try {
        safeLocalStorage.setItem('theme', nextTheme);
      } catch (_error) {
        // Silently fail if localStorage is unavailable
      }

      try {
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: nextTheme } }));
      } catch (_error) {
        // Silently fail if event dispatch fails
      }
    } catch (_err) {
      // Silently fail if theme application fails
    }
  };

  // Apply theme to document
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes (optional)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          // Only auto-update if user hasn't manually set a preference
          const savedTheme = safeLocalStorage.getItem('theme');
          if (!savedTheme) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        };
        // Modern browsers
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Fallback for older browsers
        else if (mediaQuery.addListener) {
          mediaQuery.addListener(handleChange);
          return () => mediaQuery.removeListener(handleChange);
        }
      } catch (_e) {
        // Ignore errors
      }
    }
  }, []);

  // Listen for theme changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        if (e.newValue === 'dark' || e.newValue === 'light') {
          setTheme(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for themeChanged events
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail?.theme && (e.detail.theme === 'dark' || e.detail.theme === 'light')) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  const setThemeValue = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      applyTheme(newTheme);
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeValue, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

