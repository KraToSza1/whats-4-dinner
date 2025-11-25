import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UNIT_SYSTEMS = {
  metric: { name: 'Metric', flag: '🌍', cups: 'ml', tbsp: 'ml', tsp: 'ml', oz: 'g', lb: 'kg' },
  us: { name: 'US', flag: '🇺🇸', cups: 'cups', tbsp: 'tbsp', tsp: 'tsp', oz: 'oz', lb: 'lb' },
  uk: { name: 'UK', flag: '🇬🇧', cups: 'ml', tbsp: 'ml', tsp: 'ml', oz: 'oz', lb: 'lb' },
};

const CONVERSIONS = {
  // Volume conversions
  '1 cup': { metric: '240 ml', us: '1 cup', uk: '284 ml' },
  '1 tbsp': { metric: '15 ml', us: '1 tbsp', uk: '17 ml' },
  '1 tsp': { metric: '5 ml', us: '1 tsp', uk: '6 ml' },

  // Weight conversions
  '1 oz': { metric: '28 g', us: '1 oz', uk: '28 g' },
  '1 lb': { metric: '454 g', us: '1 lb', uk: '454 g' },
};

export default function UnitConverter({ isInMenu = false, onClose = null }) {
  const [selectedSystem, setSelectedSystem] = useState(() => {
    try {
      return localStorage.getItem('unitSystem') || '';
    } catch {
      return '';
    }
  });
  const [showConverter, setShowConverter] = useState(false);
  const [isDetecting, setIsDetecting] = useState(!selectedSystem);

  const savePreference = system => {
    try {
      localStorage.setItem('unitSystem', system);
    } catch {}
  };

  const handleSystemChange = system => {
    setSelectedSystem(system);
    savePreference(system);
    setIsDetecting(false);
  };

  // Auto-detect location on first load
  useEffect(() => {
    if (selectedSystem || !isDetecting) return;

    const detectSystem = async () => {
      try {
        // First try using Intl API (browser language/locale)
        const locale = navigator.language || navigator.languages?.[0] || 'en-US';
        const country = locale.split('-')[1] || locale.split('_')[1];

        let detectedSystem = 'metric'; // default

        // US territories
        const usCountries = ['US', 'PR', 'GU', 'AS', 'VI', 'UM'];
        if (usCountries.includes(country?.toUpperCase())) {
          detectedSystem = 'us';
        }
        // UK territories
        else if (
          country?.toUpperCase() === 'GB' ||
          locale.toLowerCase().includes('uk') ||
          locale.toLowerCase().includes('en-gb')
        ) {
          detectedSystem = 'uk';
        }
        // US by language alone (en-US pattern)
        else if (locale.toLowerCase() === 'en-us') {
          detectedSystem = 'us';
        }
        // UK by language
        else if (locale.toLowerCase() === 'en-gb' || locale.toLowerCase().includes('en-gb')) {
          detectedSystem = 'uk';
        }
        // Try geolocation API (requires permission)
        else {
          try {
            const geo = await fetch(`https://ipapi.co/json/`)
              .then(r => r.json())
              .catch(() => null);

            if (geo?.country_code) {
              const code = geo.country_code.toUpperCase();
              if (usCountries.includes(code)) {
                detectedSystem = 'us';
              } else if (code === 'GB') {
                detectedSystem = 'uk';
              }
            }
          } catch (e) {
            // Silent fallback
          }
        }

        setSelectedSystem(detectedSystem);
        savePreference(detectedSystem);
        setIsDetecting(false);
      } catch (e) {
        // Silent fallback to metric
        setSelectedSystem('metric');
        savePreference('metric');
        setIsDetecting(false);
      }
    };

    detectSystem();
  }, [isDetecting, selectedSystem]);

  const displaySystem = selectedSystem || 'metric';

  // In-menu mode: show as expandable section
  if (isInMenu) {
    return (
      <div className="px-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">📏</span>
          <span className="font-semibold text-sm">Measurements</span>
        </div>
        <div className="space-y-1">
          {Object.entries(UNIT_SYSTEMS).map(([key, system], idx) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                handleSystemChange(key);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-all ${
                displaySystem === key
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{system.flag}</span>
                <span className="font-medium">{system.name}</span>
              </div>
              {displaySystem === key && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-emerald-500"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConverter(!showConverter)}
        className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        title="Convert measurements"
      >
        📏 {isDetecting ? '🌍' : UNIT_SYSTEMS[displaySystem]?.flag || '🌍'}
      </motion.button>

      <AnimatePresence>
        {showConverter && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowConverter(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-50 right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📏</span>
                <span className="font-bold text-sm">Measurement System</span>
              </div>

              <div className="space-y-2 mb-4">
                {Object.entries(UNIT_SYSTEMS).map(([key, system]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSystemChange(key)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      displaySystem === key
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{system.flag}</span>
                      <span className="font-medium">{system.name}</span>
                    </div>
                    {displaySystem === key && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-emerald-500 text-xl"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Quick reference */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs font-bold mb-2 text-slate-400">Quick Reference:</p>
                <div className="text-xs space-y-1 text-slate-400">
                  <div>1 cup = 240ml (metric) / 284ml (UK)</div>
                  <div>1 tbsp = 15ml / 17ml (UK)</div>
                  <div>1 oz = 28g</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
