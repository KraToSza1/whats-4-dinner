import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  checkRecipeForMedicalConditions,
  getRecipeMedicalBadge,
} from '../utils/medicalConditions.js';

/**
 * Component to display medical condition warnings for a recipe
 */
export default function MedicalWarning({ recipe, servings = null, compact = false }) {
  if (!recipe) return null;

  const check = checkRecipeForMedicalConditions(recipe, servings);
  const badge = getRecipeMedicalBadge(recipe);

  if (!badge && check.warnings.length === 0 && check.conflicts.length === 0) {
    return null;
  }

  if (compact) {
    // Compact badge version for recipe cards - MOBILE FRIENDLY
    if (badge) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`inline-flex items-center gap-1 xs:gap-1.5 px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-full text-[10px] xs:text-xs font-semibold touch-manipulation ${
            badge.type === 'warning'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
          title={badge.message}
        >
          <span className="text-xs xs:text-sm">{badge.icon}</span>
          <span className="truncate max-w-[120px] xs:max-w-none">{badge.message}</span>
        </motion.div>
      );
    }
    return null;
  }

  // Full warning display for recipe pages - MOBILE FRIENDLY
  return (
    <AnimatePresence>
      {(check.conflicts.length > 0 || check.warnings.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 xs:mb-6"
        >
          {/* High Priority Conflicts */}
          {check.conflicts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl xs:rounded-2xl border-2 border-red-200 dark:border-red-800 p-3 xs:p-4 mb-3 xs:mb-4">
              <div className="flex items-start gap-2 xs:gap-3 mb-2 xs:mb-3">
                <span className="text-xl xs:text-2xl shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm xs:text-base text-red-900 dark:text-red-100 mb-1.5 xs:mb-2">
                    Medical Condition Conflicts
                  </h3>
                  <p className="text-xs xs:text-sm text-red-800 dark:text-red-200 mb-2 xs:mb-3 leading-relaxed">
                    This recipe may not be suitable for your medical conditions:
                  </p>
                  <ul className="space-y-1.5 xs:space-y-2">
                    {check.conflicts.map((conflict, idx) => (
                      <li
                        key={idx}
                        className="text-xs xs:text-sm text-red-700 dark:text-red-300 leading-relaxed"
                      >
                        <span className="font-semibold">{conflict.condition}:</span>{' '}
                        {conflict.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-2 xs:mt-3 p-2.5 xs:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg xs:rounded-xl">
                <p className="text-[10px] xs:text-xs text-red-800 dark:text-red-200 leading-relaxed">
                  <strong>Important:</strong> Please consult with your doctor before consuming this
                  recipe if you have any of these conditions.
                </p>
              </div>
            </div>
          )}

          {/* Low Priority Warnings */}
          {check.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl xs:rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 p-3 xs:p-4">
              <div className="flex items-start gap-2 xs:gap-3">
                <span className="text-xl xs:text-2xl shrink-0">ℹ️</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm xs:text-base text-yellow-900 dark:text-yellow-100 mb-1.5 xs:mb-2">
                    Nutritional Notes
                  </h3>
                  <ul className="space-y-1.5 xs:space-y-2">
                    {check.warnings.map((warning, idx) => (
                      <li
                        key={idx}
                        className="text-xs xs:text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed"
                      >
                        <span className="font-semibold">{warning.condition}:</span> {warning.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
