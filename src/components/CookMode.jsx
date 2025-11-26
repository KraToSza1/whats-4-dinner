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
  const [timer, setTimer] = useState(null);
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
                className={`relative rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 border-2 transition-all ${
                  completedSteps.has(currentStep)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-2 xs:gap-3 sm:gap-4">
                  <motion.button
                    onClick={() => toggleStep(currentStep)}
                    className={`shrink-0 w-10 h-10 xs:w-12 xs:h-12 rounded-full flex items-center justify-center border-2 transition-all touch-manipulation ${
                      completedSteps.has(currentStep)
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {completedSteps.has(currentStep) ? (
                      <SuccessCheckAnimation size={24} className="xs:w-8 xs:h-8" />
                    ) : (
                      <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full border-2 border-emerald-500" />
                    )}
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 xs:gap-2 mb-1.5 xs:mb-2 flex-wrap">
                      <span className="text-lg xs:text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        Step {currentStep + 1}
                      </span>
                      {completedSteps.has(currentStep) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-base xs:text-lg sm:text-xl"
                        >
                          ✅
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm xs:text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                      {steps[currentStep]}
                    </p>

                    {/* Quick timer buttons */}
                    <div className="flex flex-wrap gap-1.5 xs:gap-2 mt-3 xs:mt-4">
                      {[30, 60, 120, 300].map(seconds => (
                        <motion.button
                          key={seconds}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startTimer(seconds)}
                          className="px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs xs:text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 touch-manipulation min-h-[36px] xs:min-h-0"
                        >
                          <Clock size={12} className="xs:w-3.5 xs:h-3.5" />
                          {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                        </motion.button>
                      ))}
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
                    className={`w-full text-left p-2.5 xs:p-3 rounded-lg border transition-all touch-manipulation min-h-[44px] xs:min-h-0 ${
                      idx === currentStep
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                        : completedSteps.has(idx)
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 opacity-70'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                      <span
                        className={`text-xs xs:text-sm font-semibold flex-shrink-0 ${
                          idx === currentStep
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {idx + 1}.
                      </span>
                      <span
                        className={`text-xs xs:text-sm flex-1 min-w-0 truncate ${completedSteps.has(idx) ? 'line-through' : ''}`}
                      >
                        {step.length > 50 ? `${step.substring(0, 50)}...` : step}
                      </span>
                      {completedSteps.has(idx) && (
                        <Check
                          size={14}
                          className="xs:w-4 xs:h-4 text-emerald-500 ml-auto flex-shrink-0"
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
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 xs:p-4 flex items-center justify-between gap-2 xs:gap-4">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-3 xs:px-4 py-2.5 xs:py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm font-semibold touch-manipulation min-h-[44px] xs:min-h-0"
          >
            <ChevronLeft size={18} className="xs:w-5 xs:h-5" />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </motion.button>

          <span className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">
            {currentStep + 1} / {steps.length}
          </span>

          <motion.button
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className="px-3 xs:px-4 py-2.5 xs:py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm touch-manipulation min-h-[44px] xs:min-h-0"
          >
            <span className="hidden xs:inline">Next</span>
            <span className="xs:hidden">Next</span>
            <ChevronRight size={18} className="xs:w-5 xs:h-5" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
