// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { FilterProvider } from './context/FilterContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { validateEnvironment } from './utils/envValidation.js';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';

// Import admin utils early to trigger auto-enable in dev mode
import './utils/admin.js';
import { forceEnableAdmin } from './utils/admin.js';

// Auto-enable admin on localhost immediately
if (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  forceEnableAdmin();
  // Auto-enabled admin (localhost detected)
}

// Also check URL parameter
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === 'true') {
    forceEnableAdmin();
    // Auto-enabled admin (?admin=true detected)
  }
}

// Validate environment variables on startup
validateEnvironment();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AdminProvider>
        <LanguageProvider>
          <ToastProvider>
            <FilterProvider>
              <ErrorBoundary onRetry={() => window.location.reload()}>
                <App />
                <SpeedInsights />
              </ErrorBoundary>
            </FilterProvider>
          </ToastProvider>
        </LanguageProvider>
      </AdminProvider>
    </AuthProvider>
  </React.StrictMode>
);

// App booted successfully

// Handle OAuth redirect from production domain to localhost
if (typeof window !== 'undefined') {
  const hash = window.location.hash;
  const hasAccessToken = hash.includes('access_token=');
  const isWrongDomain =
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (window.location.hostname.includes('whats-4-dinner') ||
      window.location.hostname.includes('www'));

  if (hasAccessToken && isWrongDomain) {
    // OAuth tokens detected on wrong domain - redirecting to localhost
    const redirectUrl = `http://localhost:5173${window.location.pathname}${hash}`;
    window.location.replace(redirectUrl);
  }
}
