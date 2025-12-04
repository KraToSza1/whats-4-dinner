import React from 'react';
import { useNavigate } from 'react-router-dom';
import MissingImagesViewer from '../components/MissingImagesViewer.jsx';
import BackToHome from '../components/BackToHome.jsx';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute.jsx';

function MissingImagesPageContent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackToHome onClick={() => navigate('/admin')} label="Back to Admin" />
        <div className="mt-6">
          <MissingImagesViewer filterType="missing-images" />
        </div>
      </div>
    </div>
  );
}

export default function MissingImagesPage() {
  return (
    <ProtectedAdminRoute>
      <MissingImagesPageContent />
    </ProtectedAdminRoute>
  );
}
