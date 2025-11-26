import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentLanguage,
  setCurrentLanguage as setLanguageStorage,
  getSupportedLanguages,
  getLanguageInfo,
  TRANSLATIONS,
} from '../utils/i18n.js';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  supportedLanguages: [],
  languageInfo: null,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const lang = getCurrentLanguage();
    // Set document language on initial load
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    return lang;
  });

  // Update document language when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Listen for language changes from other tabs/components
  useEffect(() => {
    const handleLanguageChange = event => {
      const { language: newLang } = event.detail || {};
      if (newLang && newLang !== language) {
        setLanguageState(newLang);
        // Update document language immediately
        if (typeof document !== 'undefined') {
          document.documentElement.lang = newLang;
        }
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [language]);

  // Set language and trigger immediate update
  const setLanguage = langCode => {
    if (setLanguageStorage(langCode)) {
      setLanguageState(langCode);
      // Update document language immediately
      if (typeof document !== 'undefined') {
        document.documentElement.lang = langCode;
      }
      // Force a re-render by dispatching the event (already done in setLanguageStorage, but ensure it)
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));
      return true;
    }
    console.error('🌐 [LanguageContext] setLanguageStorage failed for:', langCode);
    return false;
  };

  // Create a t() function that uses the current language from state
  const t = React.useCallback(
    (key, fallback = null) => {
      const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
      const result = translations[key] || fallback || key;
      return result;
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    t,
    supportedLanguages: getSupportedLanguages(),
    languageInfo: getLanguageInfo(language),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if used outside provider
    const fallbackLang = getCurrentLanguage();
    const fallbackT = (key, fallback = null) => {
      const translations = TRANSLATIONS[fallbackLang] || TRANSLATIONS.en;
      return translations[key] || fallback || key;
    };
    return {
      language: fallbackLang,
      setLanguage: setLanguageStorage,
      t: fallbackT,
      supportedLanguages: getSupportedLanguages(),
      languageInfo: getLanguageInfo(fallbackLang),
    };
  }
  return context;
}
