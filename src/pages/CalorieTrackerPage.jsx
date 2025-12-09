import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import CalorieTracker from '../components/CalorieTracker.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { trackFeatureUsage, FEATURES } from '../utils/featureTracking';
import { Target } from 'lucide-react';

/**
 * Calorie Tracker Page
 *
 * This is a dedicated "page" (also called a "route") in your app.
 *
 * What are Pages/Routes?
 * - Pages are different screens in your app that users can navigate to
 * - Each page has its own URL (like /calorie-tracker or /pantry)
 * - When you click a link or button, React Router changes which page is shown
 * - Think of it like different rooms in a house - each has its own purpose
 *
 * Examples in your app:
 * - / (home page) - shows recipe search
 * - /recipe/:id - shows a specific recipe
 * - /meal-planner - shows meal planning
 * - /calorie-tracker - this page! shows calorie tracking
 * - /pantry - shows pantry management
 */
export default function CalorieTrackerPage() {
  useEffect(() => {
    trackFeatureUsage(FEATURES.CALORIE_TRACKER, { action: 'page_view' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 sm:py-8">
        {/* Enhanced Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0">
              <BackToHome toHome={false} label="Back" className="mb-0" />
            </div>
            <div className="flex-1 min-w-0 sm:hidden">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                Calorie Tracker
              </h1>
            </div>
          </div>
          
          {/* Enhanced Header Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-blue-300 dark:border-blue-700"
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg"
                >
                  <Target className="w-8 h-8 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white drop-shadow-lg">
                    Calorie Tracker
                  </h1>
                  <p className="text-blue-100 text-base sm:text-lg">
                    Track your daily calories, macros, and weight to reach your fitness goals
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Calorie Tracker Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CalorieTracker />
        </motion.div>
      </div>
    </div>
  );
}
