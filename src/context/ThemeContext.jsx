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
    const debugStack = new Error().stack;
    console.error('🔥🔥🔥 [THEME] applyTheme CALLED!', {
      nextTheme,
      timestamp: new Date().toISOString(),
      hasDocument: typeof document !== 'undefined',
      hasWindow: typeof window !== 'undefined',
      stack: debugStack
    });
    
    if (typeof document === 'undefined') {
      console.error('❌❌❌ [THEME] document is undefined, cannot apply theme', { nextTheme, stack: debugStack });
      return;
    }

    try {
      const html = document.documentElement;
      const beforeClass = html.className;
      const beforeData = html.getAttribute('data-theme');
      
      console.error('🔥🔥🔥 [THEME] BEFORE changes', {
        nextTheme,
        beforeClass,
        beforeData,
        hasDarkClass: html.classList.contains('dark'),
        timestamp: new Date().toISOString()
      });

      html.classList.remove('dark', 'light');
      console.error('🔥🔥🔥 [THEME] Removed dark/light classes', {
        classNameAfterRemove: html.className,
        timestamp: new Date().toISOString()
      });
      
      if (nextTheme === 'dark') {
        html.classList.add('dark');
        console.error('🔥🔥🔥 [THEME] Added dark class', {
          classNameAfterAdd: html.className,
          hasDarkClass: html.classList.contains('dark'),
          timestamp: new Date().toISOString()
        });
      } else {
        html.classList.remove('dark');
        console.error('🔥🔥🔥 [THEME] Removed dark class (light mode)', {
          classNameAfterRemove: html.className,
          hasDarkClass: html.classList.contains('dark'),
          timestamp: new Date().toISOString()
        });
      }
      
      html.setAttribute('data-theme', nextTheme);
      
      // Force color-scheme for browser compatibility
      html.style.colorScheme = nextTheme;
      
      // CRITICAL FIX: Ensure Tailwind v4 dark mode works by adding color-scheme
      if (nextTheme === 'dark') {
        html.style.colorScheme = 'dark';
      } else {
        html.style.colorScheme = 'light';
      }
      
      // Force style recalculation using multiple methods
      // Method 1: Force reflow
      void html.offsetHeight;
      void document.body.offsetHeight;
      
      // Method 2: Trigger style recalculation by accessing computed styles
      window.getComputedStyle(html);
      window.getComputedStyle(document.body);
      
      // Method 3: Use requestAnimationFrame to ensure browser has processed the change
      requestAnimationFrame(() => {
        // Force another reflow after browser processes
        void html.offsetHeight;
        const testStyles = window.getComputedStyle(document.body);
        console.error('🔥🔥🔥 [THEME] Post-RAF style check', {
          nextTheme,
          bgColor: testStyles.backgroundColor,
          textColor: testStyles.color,
          hasDarkClass: html.classList.contains('dark'),
          colorScheme: html.style.colorScheme,
          timestamp: new Date().toISOString()
        });
      });
      console.error('🔥🔥🔥 [THEME] Set data-theme attribute', {
        dataTheme: html.getAttribute('data-theme'),
        expected: nextTheme,
        timestamp: new Date().toISOString()
      });

      const afterClass = html.className;
      const afterData = html.getAttribute('data-theme');

      try {
        safeLocalStorage.setItem('theme', nextTheme);
        const saved = safeLocalStorage.getItem('theme');
        console.error('🔥🔥🔥 [THEME] localStorage operation', {
          saved,
          expected: nextTheme,
          matches: saved === nextTheme,
          timestamp: new Date().toISOString()
        });
        if (saved !== nextTheme) {
          console.error('❌❌❌ [THEME] localStorage mismatch', { expected: nextTheme, saved });
        }
      } catch (error) {
        console.error('❌❌❌ [THEME] Failed to save to localStorage:', error, { stack: debugStack });
      }

      try {
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: nextTheme } }));
        console.error('🔥🔥🔥 [THEME] Dispatched themeChanged event', {
          theme: nextTheme,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌❌❌ [THEME] Failed to dispatch event:', error, { stack: debugStack });
      }

      const hasDark = html.classList.contains('dark');
      const verificationMatches =
        (nextTheme === 'dark' && hasDark) || (nextTheme === 'light' && !hasDark);

      // Force multiple reflows and style recalculations
      void html.offsetHeight;
      void document.body.offsetHeight;
      void window.getComputedStyle(document.body).backgroundColor;
      
      // Use requestAnimationFrame to ensure styles are recalculated
      requestAnimationFrame(() => {
        // Check computed styles to verify theme is actually applied
        const bodyStyles = window.getComputedStyle(document.body);
        const bgColor = bodyStyles.backgroundColor;
        const textColor = bodyStyles.color;
        
        console.error('🔥🔥🔥 [THEME] STYLE CHECK (after RAF)', {
          nextTheme,
          hasDark,
          bodyBgColor: bgColor,
          bodyTextColor: textColor,
          htmlHasDarkClass: html.classList.contains('dark'),
          timestamp: new Date().toISOString()
        });
      });
      
      // Check computed styles immediately (may show old values)
      const bodyStyles = window.getComputedStyle(document.body);
      const bgColor = bodyStyles.backgroundColor;
      const textColor = bodyStyles.color;

      console.error('🔥🔥🔥 [THEME] FINAL VERIFICATION', {
        nextTheme,
        hasDark,
        verificationMatches,
        beforeClass,
        afterClass,
        beforeData,
        afterData,
        bodyBgColor: bgColor,
        bodyTextColor: textColor,
        htmlClassList: Array.from(html.classList),
        htmlDataTheme: html.getAttribute('data-theme'),
        timestamp: new Date().toISOString()
      });

      if (!verificationMatches) {
        console.error('❌❌❌ [THEME] Verification FAILED!', {
          nextTheme,
          hasDark,
          beforeClass,
          afterClass,
          beforeData,
          afterData,
          stack: debugStack,
        });
      } else {
        console.error('✅✅✅ [THEME] Verification PASSED!', {
          nextTheme,
          hasDark,
          beforeClass,
          afterClass,
          beforeData,
          afterData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('❌❌❌ [THEME] applyTheme CRASHED!', { err, nextTheme, stack: debugStack });
    }
  };

  // Apply theme to document
  useEffect(() => {
    console.error('🔥🔥🔥 [THEME] useEffect triggered - theme changed', {
      theme,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });
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
    console.error('🔥🔥🔥 [THEME] toggleTheme CALLED!', {
      timestamp: new Date().toISOString(),
      currentTheme: theme,
      stack: new Error().stack
    });
    
    setTheme(prevTheme => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      console.error('🔥🔥🔥 [THEME] toggleTheme STATE UPDATE', {
        prevTheme,
        nextTheme,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      applyTheme(nextTheme); // apply immediately for instant feedback
      return nextTheme;
    });
  };

  const setThemeValue = (newTheme) => {
    console.error('🔥🔥🔥 [THEME] setThemeValue CALLED!', {
      newTheme,
      currentTheme: theme,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });
    
    if (newTheme === 'dark' || newTheme === 'light') {
      console.error('🔥🔥🔥 [THEME] setThemeValue VALID - applying', {
        newTheme,
        currentTheme: theme,
        timestamp: new Date().toISOString()
      });
      applyTheme(newTheme);
      setTheme(newTheme);
    } else {
      console.error('❌❌❌ [THEME] setThemeValue INVALID VALUE!', {
        newTheme,
        currentTheme: theme,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
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
  console.error('🔥🔥🔥 [THEME] useTheme() called', {
    hasContext: !!context,
    theme: context?.theme,
    hasToggleTheme: typeof context?.toggleTheme === 'function',
    hasSetTheme: typeof context?.setTheme === 'function',
    timestamp: new Date().toISOString()
  });
  
  if (!context) {
    console.error('❌❌❌ [THEME] useTheme() ERROR - no context!', {
      stack: new Error().stack,
      timestamp: new Date().toISOString()
    });
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

