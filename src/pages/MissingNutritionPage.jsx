import React from 'react';
import { useNavigate } from 'react-router-dom';
import MissingImagesViewer from '../components/MissingImagesViewer.jsx';
import BackToHome from '../components/BackToHome.jsx';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute.jsx';

function MissingNutritionPageContent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-start gap-3 sm:gap-4 mb-6">
          <div className="flex-shrink-0">
            <BackToHome onClick={() => navigate('/admin')} label="Back to Admin" className="mb-0" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">Missing Nutrition Data</h1>
          </div>
        </div>
        <div className="mt-0">
          <MissingImagesViewer filterType="missing-nutrition" />
        </div>
      </div>
    </div>
  );
}

export default function MissingNutritionPage() {
  return (
    <ProtectedAdminRoute>
      <MissingNutritionPageContent />
    </ProtectedAdminRoute>
  );
}
