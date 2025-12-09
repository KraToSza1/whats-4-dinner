import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CookingTimer } from './animations/FoodAnimations.jsx';
import { X, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';
import { SuccessCheckAnimation, CookingPotAnimation } from './LottieFoodAnimations.jsx';

/**
 * Step-by-step cooking mode with timer
 */
export default function CookMode({ steps, recipeTitle, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Play completion sound/haptic
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleStep = index => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        // Auto-advance to next step if completing current
        if (index === currentStep && index < steps.length - 1) {
          setTimeout(() => setCurrentStep(index + 1), 500);
        }
      }
      return next;
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTimer = seconds => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const progress = ((completedSteps.size / steps.length) * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 xs:p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-3 xs:p-4 sm:p-6 text-white">
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-0.5 xs:mb-1">
                🍳 Cook Mode
              </h2>
              <p className="text-emerald-100 text-xs xs:text-sm truncate">{recipeTitle}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation min-h-[44px] xs:min-h-0"
              aria-label="Close"
            >
              <X size={18} className="xs:w-5 xs:h-5" />
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 xs:mt-4 h-1.5 xs:h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <p className="text-[10px] xs:text-xs mt-1.5 xs:mt-2 text-emerald-100">
            {completedSteps.size} of {steps.length} steps completed
          </p>
        </div>

        {/* Timer */}
        {isTimerRunning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-3 xs:p-4 flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-0 overflow-visible"
          >
            <div className="flex items-center gap-2 xs:gap-3 overflow-visible w-full xs:w-auto justify-center xs:justify-start">
              <CookingTimer seconds={timerSeconds} size={40} />
              <div className="overflow-visible hidden xs:block">
                <CookingPotAnimation size={50} />
              </div>
              <div className="flex-1 xs:flex-none min-w-0">
                <p className="font-semibold text-sm xs:text-base text-amber-900 dark:text-amber-100 text-center xs:text-left">
                  Timer: {Math.floor(timerSeconds / 60)}:
                  {(timerSeconds % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-[10px] xs:text-xs text-amber-700 dark:text-amber-300 text-center xs:text-left">
                  Cooking in progress...
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={stopTimer}
              className="w-full xs:w-auto px-4 py-2.5 xs:py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm xs:text-base touch-manipulation min-h-[44px] xs:min-h-0"
            >
              Stop
            </motion.button>
          </motion.div>
        )}

        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 xs:space-y-4"
            >
              {/* Step number indicator */}
              <div className="flex items-center justify-center gap-1 xs:gap-2 mb-4 xs:mb-6 overflow-x-auto pb-2">
                {steps.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`h-1.5 xs:h-2 rounded-full transition-all flex-shrink-0 ${
                      idx === currentStep
                        ? 'w-6 xs:w-8 bg-emerald-500'
                        : completedSteps.has(idx)
                          ? 'w-3 xs:w-4 bg-emerald-300'
                          : 'w-1.5 xs:w-2 bg-slate-300'
                    }`}
                    animate={
                      idx === currentStep
                        ? {
                            scale: [1, 1.2, 1],
                          }
                        : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ))}
              </div>

              {/* Current step */}
              <motion.div
                className={`relative rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 border-2 transition-all shadow-lg ${
                  completedSteps.has(currentStep)
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-400 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-2 xs:gap-3 sm:gap-4">
                  <motion.button
                    onClick={() => toggleStep(currentStep)}
                    className={`shrink-0 w-12 h-12 xs:w-14 xs:h-14 rounded-xl flex items-center justify-center border-2 transition-all touch-manipulation shadow-md ${
                      completedSteps.has(currentStep)
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-emerald-400 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    title={completedSteps.has(currentStep) ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {completedSteps.has(currentStep) ? (
                      <SuccessCheckAnimation size={28} className="xs:w-10 xs:h-10" />
                    ) : (
                      <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg border-2 border-emerald-500 dark:border-emerald-400" />
                    )}
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3 flex-wrap">
                      <span className="inline-flex items-center justify-center w-8 h-8 xs:w-10 xs:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-base xs:text-lg sm:text-xl shadow-md">
                        {currentStep + 1}
                      </span>
                      <span className="text-lg xs:text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        Step {currentStep + 1}
                      </span>
                      {completedSteps.has(currentStep) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xl xs:text-2xl sm:text-3xl"
                        >
                          ✅
                        </motion.span>
                      )}
                    </div>
                    <p className="text-base xs:text-lg sm:text-xl text-slate-700 dark:text-slate-200 leading-relaxed break-words font-medium">
                      {steps[currentStep]}
                    </p>

                    {/* Quick timer buttons */}
                    <div className="mt-4 xs:mt-5 sm:mt-6">
                      <p className="text-xs xs:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 xs:mb-3 flex items-center gap-1.5">
                        <Clock size={14} className="xs:w-4 xs:h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Set Timer:</span>
                      </p>
                      <div className="flex flex-wrap gap-2 xs:gap-2.5">
                        {[30, 60, 120, 300].map(seconds => {
                          const minutes = Math.floor(seconds / 60);
                          const remainingSeconds = seconds % 60;
                          const displayText = seconds < 60 
                            ? `${seconds}s` 
                            : remainingSeconds > 0 
                              ? `${minutes}m ${remainingSeconds}s`
                              : `${minutes}m`;
                          return (
                            <motion.button
                              key={seconds}
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => startTimer(seconds)}
                              className="group relative px-4 xs:px-5 py-2.5 xs:py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm xs:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2 touch-manipulation min-h-[44px] overflow-hidden"
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              />
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="relative z-10"
                              >
                                <Clock size={18} className="xs:w-5 xs:h-5" />
                              </motion.div>
                              <span className="relative z-10">{displayText}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* All steps list */}
              <div className="space-y-1.5 xs:space-y-2 mt-4 xs:mt-6">
                <p className="text-xs xs:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 xs:mb-2">
                  All Steps:
                </p>
                {steps.map((step, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-full text-left p-3 xs:p-4 rounded-xl border-2 transition-all touch-manipulation min-h-[44px] shadow-sm hover:shadow-md ${
                      idx === currentStep
                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-800'
                        : completedSteps.has(idx)
                          ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-300/50 dark:border-emerald-700/50 opacity-75'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }`}
                    whileHover={{ x: 3, scale: 1.01 }}
                  >
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 rounded-lg text-xs xs:text-sm font-bold flex-shrink-0 ${
                          idx === currentStep
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                            : completedSteps.has(idx)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={`text-sm xs:text-base flex-1 min-w-0 break-words ${completedSteps.has(idx) ? 'line-through opacity-60' : ''}`}
                      >
                        {step}
                      </span>
                      {completedSteps.has(idx) && (
                        <Check
                          size={18}
                          className="xs:w-5 xs:h-5 text-emerald-500 dark:text-emerald-400 ml-auto flex-shrink-0"
                        />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 xs:p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-2 xs:gap-4">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 xs:px-5 py-2.5 xs:py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm xs:text-base font-bold border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px]"
            >
              <ChevronLeft size={20} className="xs:w-5 xs:h-5" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </motion.button>

            <div className="flex flex-col items-center gap-1">
              <span className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Step
              </span>
              <span className="text-base xs:text-lg font-bold text-slate-700 dark:text-slate-200">
                {currentStep + 1} / {steps.length}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="px-4 xs:px-5 py-2.5 xs:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm xs:text-base shadow-lg hover:shadow-xl transition-all touch-manipulation min-h-[44px]"
            >
              <span className="hidden xs:inline">Next</span>
              <span className="xs:hidden">Next</span>
              <ChevronRight size={20} className="xs:w-5 xs:h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
