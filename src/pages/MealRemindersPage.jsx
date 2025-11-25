import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MealReminders from '../components/MealReminders.jsx';
import BackToHome from '../components/BackToHome.jsx';

export default function MealRemindersPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <BackToHome className="mb-4" />
          <h1 className="text-4xl font-bold mb-2">Meal Reminders</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Set reminders for your meals and never miss breakfast, lunch, or dinner again!
          </p>
        </motion.div>

        <MealReminders />
      </div>
    </div>
  );
}
