import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Full Nutrition Label View - FDA-style nutrition facts panel
 */
export default function NutritionLabel({ recipe, servings, onClose }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!recipe?.nutrition?.nutrients) return null;

  const nutrients = recipe.nutrition.nutrients || [];
  const originalServings = recipe.servings || 1;
  const targetServings = servings || originalServings;

  // Calculate scale ratio for nutrition values
  // Nutrition is stored as TOTAL, so we scale by targetServings / originalServings
  const scaleRatio =
    originalServings > 0 &&
    targetServings > 0 &&
    Number.isFinite(originalServings) &&
    Number.isFinite(targetServings)
      ? targetServings / originalServings
      : 1;

  // Helper to find nutrient by name and scale it
  const getNutrient = name => {
    const nutrient = nutrients.find(n => n.name?.toLowerCase().includes(name.toLowerCase()));
    if (!nutrient || nutrient.amount === null || nutrient.amount === undefined) return 0;

    // Scale the nutrient amount based on serving size
    const baseAmount = Number(nutrient.amount);
    if (!Number.isFinite(baseAmount) || !Number.isFinite(scaleRatio)) return 0;

    const scaled = baseAmount * scaleRatio;
    return Number.isFinite(scaled) ? scaled : 0;
  };

  // Calculate health score (0-100)
  const calculateHealthScore = () => {
    const calories = getNutrient('calories') || 0;
    const protein = getNutrient('protein') || 0;
    const fiber = getNutrient('fiber') || 0;
    const sugar = getNutrient('sugar') || 0;
    const sodium = getNutrient('sodium') || 0;
    const fat = getNutrient('fat') || 0;
    const saturatedFat = getNutrient('saturated fat') || 0;

    let score = 100;

    // Deduct points for high sugar (per serving)
    if (sugar > 15) score -= 10;
    else if (sugar > 10) score -= 5;

    // Deduct points for high sodium (per serving)
    if (sodium > 600) score -= 15;
    else if (sodium > 400) score -= 8;

    // Deduct points for high saturated fat
    if (saturatedFat > 5) score -= 10;
    else if (saturatedFat > 3) score -= 5;

    // Add points for high protein
    if (protein > 20) score += 10;
    else if (protein > 15) score += 5;

    // Add points for high fiber
    if (fiber > 5) score += 10;
    else if (fiber > 3) score += 5;

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const scoreColor =
    healthScore >= 80
      ? 'text-emerald-600'
      : healthScore >= 60
        ? 'text-yellow-600'
        : 'text-orange-600';

  // Main nutrients
  const calories = Math.round(getNutrient('calories') || 0);
  const totalFat = getNutrient('fat') || 0;
  const saturatedFat = getNutrient('saturated fat') || 0;
  const transFat = getNutrient('trans fat') || 0;
  const cholesterol = getNutrient('cholesterol') || 0;
  const sodium = getNutrient('sodium') || 0;
  const totalCarbs = getNutrient('carbohydrates') || 0;
  const fiber = getNutrient('fiber') || 0;
  const sugars = getNutrient('sugar') || 0;
  const protein = getNutrient('protein') || 0;

  // Daily values (based on 2000 calorie diet)
  const dailyValue = (amount, daily) => {
    if (!daily || daily === 0) return 0;
    return Math.round((amount / daily) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6 text-white overflow-hidden">
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2 tracking-tight"
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-2xl sm:text-3xl"
                >
                  📊
                </motion.span>
                Nutrition Facts
              </motion.h2>
              <p className="text-blue-100 text-sm sm:text-base mt-1 font-medium leading-relaxed">
                {recipe.title}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Health Score - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 mt-4 bg-white/20 rounded-xl p-4 backdrop-blur-sm border border-white/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm sm:text-base font-bold tracking-wide">Health Score</span>
              <motion.span
                className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
              >
                {healthScore}/100
              </motion.span>
            </div>
            <div className="mt-2 h-3 bg-white/30 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${healthScore}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className={`h-full ${
                  healthScore >= 80
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : healthScore >= 60
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                      : 'bg-gradient-to-r from-orange-400 to-orange-600'
                } shadow-lg`}
              />
            </div>
            <p className="text-xs sm:text-sm text-blue-100 mt-2 opacity-95 font-semibold">
              {healthScore >= 80
                ? 'Excellent! 🎉'
                : healthScore >= 60
                  ? 'Good choice! 👍'
                  : 'Consider moderation ⚠️'}
            </p>
          </motion.div>
        </div>

        {/* Nutrition Label */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 border-2 border-slate-800 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-xl"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
          >
            {/* Label Header */}
            <div className="border-b-4 border-slate-800 dark:border-slate-700 pb-3 mb-3">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                Nutrition Facts
              </div>
              <div className="text-sm sm:text-base mt-2 text-slate-700 dark:text-slate-300 font-medium">
                {targetServings} {targetServings === 1 ? 'serving' : 'servings'}
                {originalServings !== targetServings && (
                  <span className="text-slate-500 dark:text-slate-400">
                    {' '}
                    (scaled from {originalServings}{' '}
                    {originalServings === 1 ? 'serving' : 'servings'})
                  </span>
                )}
                {originalServings === targetServings && originalServings > 1 && (
                  <span className="text-slate-500 dark:text-slate-400"> (total for recipe)</span>
                )}
              </div>
              {targetServings === 1 && originalServings > 1 && (
                <div className="text-xs mt-1 text-slate-500 dark:text-slate-400 italic">
                  Showing per-serving values. Adjust servings on the recipe page to see totals.
                </div>
              )}
            </div>

            {/* Calories */}
            <div className="border-b-4 border-slate-800 dark:border-slate-700 pb-3 mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {calories}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 ml-2">
                  Calories
                </span>
              </div>
            </div>

            {/* Daily Value Header */}
            <div className="text-right text-xs sm:text-sm mb-2 font-bold text-slate-900 dark:text-slate-100 tracking-wide">
              % Daily Value*
            </div>

            {/* Total Fat */}
            <div className="border-b border-slate-300 dark:border-slate-600 py-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Total Fat
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {totalFat.toFixed(1)}g
                  </span>
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 min-w-[3rem] text-right">
                    {dailyValue(totalFat, 65)}%
                  </span>
                </div>
              </div>
              {saturatedFat > 0 && (
                <div className="pl-5 sm:pl-6 mt-1 flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    Saturated Fat
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {saturatedFat.toFixed(1)}g
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 min-w-[3rem] text-right">
                      {dailyValue(saturatedFat, 20)}%
                    </span>
                  </div>
                </div>
              )}
              {transFat > 0 && (
                <div className="pl-5 sm:pl-6 mt-1 flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    Trans Fat
                  </span>
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {transFat.toFixed(1)}g
                  </span>
                </div>
              )}
            </div>

            {/* Cholesterol */}
            {cholesterol > 0 && (
              <div className="border-b border-slate-300 dark:border-slate-600 py-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Cholesterol
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {cholesterol.toFixed(0)}mg
                    </span>
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 min-w-[3rem] text-right">
                      {dailyValue(cholesterol, 300)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sodium */}
            <div className="border-b border-slate-300 dark:border-slate-600 py-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Sodium
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {sodium.toFixed(0)}mg
                  </span>
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 min-w-[3rem] text-right">
                    {dailyValue(sodium, 2400)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Total Carbohydrate */}
            <div className="border-b border-slate-300 dark:border-slate-600 py-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Total Carbohydrate
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {totalCarbs.toFixed(1)}g
                  </span>
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 min-w-[3rem] text-right">
                    {dailyValue(totalCarbs, 300)}%
                  </span>
                </div>
              </div>
              {fiber > 0 && (
                <div className="pl-5 sm:pl-6 mt-1 flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    Dietary Fiber
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {fiber.toFixed(1)}g
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 min-w-[3rem] text-right">
                      {dailyValue(fiber, 25)}%
                    </span>
                  </div>
                </div>
              )}
              {sugars > 0 && (
                <div className="pl-5 sm:pl-6 mt-1 flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    Total Sugars
                  </span>
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {sugars.toFixed(1)}g
                  </span>
                </div>
              )}
            </div>

            {/* Protein */}
            <div className="border-b-4 border-slate-800 dark:border-slate-700 py-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Protein
                </span>
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {protein.toFixed(1)}g
                </span>
              </div>
            </div>

            {/* Additional Nutrients */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 pt-3 border-t border-slate-300 dark:border-slate-600"
                >
                  {nutrients
                    .filter(
                      n =>
                        ![
                          'calories',
                          'fat',
                          'saturated fat',
                          'trans fat',
                          'cholesterol',
                          'sodium',
                          'carbohydrates',
                          'fiber',
                          'sugar',
                          'protein',
                        ].some(name => n.name?.toLowerCase().includes(name.toLowerCase()))
                    )
                    .map((nutrient, idx) => {
                      // Scale additional nutrients too
                      const baseAmount = Number(nutrient.amount) || 0;
                      const scaledAmount =
                        Number.isFinite(baseAmount) && Number.isFinite(scaleRatio)
                          ? baseAmount * scaleRatio
                          : baseAmount;
                      return (
                        <div key={idx} className="flex justify-between items-center py-1">
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            {nutrient.name}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            {Number.isFinite(scaledAmount)
                              ? scaledAmount.toFixed(1)
                              : nutrient.amount?.toFixed(1)}
                            {nutrient.unit || ''}
                          </span>
                        </div>
                      );
                    })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Daily Value Note */}
            <div className="text-[10px] sm:text-xs mt-4 pt-3 border-t border-slate-300 dark:border-slate-600 leading-relaxed text-slate-600 dark:text-slate-400">
              * The % Daily Value (DV) tells you how much a nutrient in a serving of food
              contributes to a daily diet. 2,000 calories a day is used for general nutrition
              advice.
            </div>
          </motion.div>

          {/* Toggle Details Button - Enhanced */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 w-full px-4 py-3 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <motion.span animate={{ rotate: showDetails ? 180 : 0 }} transition={{ duration: 0.3 }}>
              {showDetails ? '▼' : '▶'}
            </motion.span>
            <span>{showDetails ? 'Hide' : 'Show'} Additional Nutrients</span>
            <span className="text-xs opacity-70">
              (
              {
                nutrients.filter(
                  n =>
                    ![
                      'calories',
                      'fat',
                      'saturated fat',
                      'trans fat',
                      'cholesterol',
                      'sodium',
                      'carbohydrates',
                      'fiber',
                      'sugar',
                      'protein',
                    ].some(name => n.name?.toLowerCase().includes(name.toLowerCase()))
                ).length
              }{' '}
              more)
            </span>
          </motion.button>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span>Got it!</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
