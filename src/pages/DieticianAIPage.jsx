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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="page-shell py-6 sm:py-8">
        <BackToHome toHome={false} label="Back" />
        <DieticianAI />
      </div>
    </div>
  );
}
