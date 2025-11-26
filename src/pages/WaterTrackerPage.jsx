import React from 'react';
import WaterTracker from '../components/WaterTracker.jsx';
import { hasFeature } from '../utils/subscription.js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import { useEffect } from 'react';

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
        <WaterTracker />
      </div>
    </div>
  );
}
