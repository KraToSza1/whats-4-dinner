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
    // Compact badge version for recipe cards
    if (badge) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
            badge.type === 'warning'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
          title={badge.message}
        >
          <span>{badge.icon}</span>
          <span>{badge.message}</span>
        </motion.div>
      );
    }
    return null;
  }

  // Full warning display for recipe pages
  return (
    <AnimatePresence>
      {(check.conflicts.length > 0 || check.warnings.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6"
        >
          {/* High Priority Conflicts */}
          {check.conflicts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 p-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">
                    Medical Condition Conflicts
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    This recipe may not be suitable for your medical conditions:
                  </p>
                  <ul className="space-y-2">
                    {check.conflicts.map((conflict, idx) => (
                      <li key={idx} className="text-sm text-red-700 dark:text-red-300">
                        <span className="font-semibold">{conflict.condition}:</span>{' '}
                        {conflict.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <p className="text-xs text-red-800 dark:text-red-200">
                  <strong>Important:</strong> Please consult with your doctor before consuming this
                  recipe if you have any of these conditions.
                </p>
              </div>
            </div>
          )}

          {/* Low Priority Warnings */}
          {check.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    Nutritional Notes
                  </h3>
                  <ul className="space-y-2">
                    {check.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200">
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
