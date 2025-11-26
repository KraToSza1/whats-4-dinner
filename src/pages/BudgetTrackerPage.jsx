import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BudgetTracker from '../components/BudgetTracker.jsx';
import BackToHome from '../components/BackToHome.jsx';
import { hasFeature, getCurrentPlanSync } from '../utils/subscription.js';
import { useToast } from '../components/Toast.jsx';

export default function BudgetTrackerPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const hasChecked = useRef(false);

  // ENFORCE BUDGET TRACKER ACCESS - Check access on mount (only once)
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const hasBudgetTracker = hasFeature('budget_tracker');
    const hasFullBudgetTracker = hasFeature('budget_tracker_full');
    const hasLimitedBudgetTracker = hasFeature('budget_tracker_limited');

    if (!hasBudgetTracker) {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('openPremiumFeatureModal', {
            detail: { feature: 'budget_tracker' },
          })
        );
      }, 300);
    } else if (hasLimitedBudgetTracker) {
      // Supporter plan - show limited budget tracker message
      toast.info(
        '💰 You have limited budget tracker access. Upgrade to Unlimited or Family for full budget analytics!',
        { duration: 4000 }
      );
    }
  }, [navigate]);

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
