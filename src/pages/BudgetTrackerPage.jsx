import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BudgetTracker from '../components/BudgetTracker.jsx';
import BackToHome from '../components/BackToHome.jsx';

export default function BudgetTrackerPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <BackToHome className="mb-4" />
          <h1 className="text-4xl font-bold mb-2">Budget Tracker & Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Comprehensive budget tracking, spending analysis, and cost insights for your meals!
          </p>
        </motion.div>

        <BudgetTracker />
      </div>
    </div>
  );
}
