import React, { useEffect, useRef } from 'react';
import DieticianAI from '../components/DieticianAI.jsx';
import { hasFeature } from '../utils/subscription.js';
import { useNavigate } from 'react-router-dom';
import BackToHome from '../components/BackToHome.jsx';

export default function DieticianAIPage() {
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once to prevent multiple toasts
    if (hasChecked.current) return;
    hasChecked.current = true;

    if (!hasFeature('dietician_ai')) {
      navigate('/');
      // Delay opening modal to avoid conflicts
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('openPremiumFeatureModal', {
            detail: { feature: 'dietician_ai' },
          })
        );
      }, 500);
      return;
    }
  }, [navigate]);

  // Don't render if user doesn't have access
  if (!hasFeature('dietician_ai')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/20 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="page-shell py-3 xs:py-4 sm:py-6 md:py-8 px-3 xs:px-4 sm:px-6">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 xs:mb-5 sm:mb-6">
          <div className="flex-shrink-0">
            <BackToHome toHome={false} label="Back" className="mb-0" />
          </div>
          <div className="flex-1 min-w-0 sm:hidden">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">Dietician AI</h1>
          </div>
        </div>
        <div className="mt-0">
          <DieticianAI />
        </div>
      </div>
    </div>
  );
}
