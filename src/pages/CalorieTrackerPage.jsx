import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CalorieTracker from '../components/CalorieTracker.jsx';

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
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              aria-label="Go back"
            >
              <span className="text-xl">←</span>
            </motion.button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-white">
                Calorie Tracker
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track your daily calories, macros, and weight to reach your fitness goals
              </p>
            </div>
          </div>
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
