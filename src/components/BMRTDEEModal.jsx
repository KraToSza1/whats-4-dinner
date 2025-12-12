import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Flame, Activity } from 'lucide-react';

export default function BMRTDEEModal({ isOpen, onClose, type = 'BMR' }) {
  const isBMR = type === 'BMR';
  const isTDEE = type === 'TDEE';

  const bmrContent = {
    title: 'What is BMR?',
    icon: <Flame className="w-8 h-8 text-orange-500" />,
    subtitle: 'Basal Metabolic Rate',
    description: 'Your BMR is the number of calories your body burns at rest to maintain basic life functions like breathing, circulation, and cell production.',
    whyImportant: 'Why We Monitor BMR:',
    benefits: [
      'Helps determine your baseline calorie needs',
      'Essential for calculating your daily calorie goals',
      'Provides insight into your metabolism',
      'Foundation for weight management planning'
    ],
    howCalculated: 'How It\'s Calculated:',
    calculation: 'We use the Mifflin-St Jeor Equation, which considers your weight, height, age, and gender to estimate your BMR accurately.'
  };

  const tdeeContent = {
    title: 'What is TDEE?',
    icon: <Activity className="w-8 h-8 text-purple-500" />,
    subtitle: 'Total Daily Energy Expenditure',
    description: 'Your TDEE is the total number of calories you burn in a day, including your BMR plus calories burned through physical activity and daily movement.',
    whyImportant: 'Why We Monitor TDEE:',
    benefits: [
      'Shows your actual daily calorie needs',
      'Accounts for your activity level',
      'Helps set realistic calorie goals',
      'Essential for effective weight management'
    ],
    howCalculated: 'How It\'s Calculated:',
    calculation: 'TDEE = BMR × Activity Multiplier. We multiply your BMR by a factor based on your activity level (sedentary, light, moderate, active, or very active).'
  };

  const content = isBMR ? bmrContent : tdeeContent;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-slate-200 dark:border-slate-700">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    {content.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {content.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {content.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {content.description}
                    </p>
                  </div>
                </div>

                {/* Why Important */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {content.whyImportant}
                  </h3>
                  <ul className="space-y-2">
                    {content.benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                      >
                        <span className="text-blue-500 dark:text-blue-400 font-bold mt-0.5">•</span>
                        <span>{benefit}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* How Calculated */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    {content.howCalculated}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {content.calculation}
                  </p>
                </div>

                {/* Relationship (if TDEE) */}
                {isTDEE && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong className="text-purple-600 dark:text-purple-400">Remember:</strong> Your TDEE is always higher than your BMR because it includes calories burned through activity. The more active you are, the higher your TDEE will be!
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all"
                >
                  Got it!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

