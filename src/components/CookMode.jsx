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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">🍳 Cook Mode</h2>
              <p className="text-emerald-100 text-sm">{recipeTitle}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <p className="text-xs mt-2 text-emerald-100">
            {completedSteps.size} of {steps.length} steps completed
          </p>
        </div>

        {/* Timer */}
        {isTimerRunning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-4 flex items-center justify-between overflow-visible"
          >
            <div className="flex items-center gap-3 overflow-visible">
              <CookingTimer seconds={timerSeconds} size={50} />
              <div className="overflow-visible">
                <CookingPotAnimation size={50} />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Timer: {Math.floor(timerSeconds / 60)}:
                  {(timerSeconds % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Cooking in progress...</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={stopTimer}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold"
            >
              Stop
            </motion.button>
          </motion.div>
        )}

        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Step number indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'w-8 bg-emerald-500'
                        : completedSteps.has(idx)
                          ? 'w-4 bg-emerald-300'
                          : 'w-2 bg-slate-300'
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
                className={`relative rounded-xl p-6 border-2 transition-all ${
                  completedSteps.has(currentStep)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4">
                  <motion.button
                    onClick={() => toggleStep(currentStep)}
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      completedSteps.has(currentStep)
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {completedSteps.has(currentStep) ? (
                      <SuccessCheckAnimation size={32} />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-500" />
                    )}
                  </motion.button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        Step {currentStep + 1}
                      </span>
                      {completedSteps.has(currentStep) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xl"
                        >
                          ✅
                        </motion.span>
                      )}
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
                      {steps[currentStep]}
                    </p>

                    {/* Quick timer buttons */}
                    <div className="flex gap-2 mt-4">
                      {[30, 60, 120, 300].map(seconds => (
                        <motion.button
                          key={seconds}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startTimer(seconds)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1"
                        >
                          <Clock size={14} />
                          {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* All steps list */}
              <div className="space-y-2 mt-6">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  All Steps:
                </p>
                {steps.map((step, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      idx === currentStep
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                        : completedSteps.has(idx)
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 opacity-70'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          idx === currentStep
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {idx + 1}.
                      </span>
                      <span className={`text-sm ${completedSteps.has(idx) ? 'line-through' : ''}`}>
                        {step.substring(0, 60)}...
                      </span>
                      {completedSteps.has(idx) && (
                        <Check size={16} className="text-emerald-500 ml-auto" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Previous
          </motion.button>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {currentStep + 1} / {steps.length}
          </span>

          <motion.button
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
