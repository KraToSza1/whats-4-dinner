import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MealReminders from '../components/MealReminders.jsx';
import BackToHome from '../components/BackToHome.jsx';

export default function MealRemindersPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-2 xs:px-3 sm:px-4 md:px-6 py-4 xs:py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 xs:mb-5 sm:mb-6"
        >
          <BackToHome className="mb-3 xs:mb-4" />
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-2">Meal Reminders</h1>
          <p className="text-sm xs:text-base text-slate-600 dark:text-slate-400">
            Set reminders for your meals and never miss breakfast, lunch, or dinner again!
          </p>
        </motion.div>

        <MealReminders />
      </div>
    </div>
  );
}
