import React from 'react';
import WaterTracker from '../components/WaterTracker.jsx';
import { hasFeature } from '../utils/subscription.js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import { useEffect } from 'react';
import BackToHome from '../components/BackToHome.jsx';

export default function WaterTrackerPage() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Water tracker is free for all plans, but we can still check if needed
    if (!hasFeature('water_tracker')) {
      toast.error('Water tracker is available for all users!');
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="page-shell py-6 sm:py-8">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-shrink-0">
            <BackToHome className="mb-0" />
          </div>
        </div>
        <WaterTracker />
      </div>
    </div>
  );
}
