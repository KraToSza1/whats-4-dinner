// src/main.jsx
// Import browser compatibility FIRST to ensure polyfills are loaded
import './utils/browserCompatibility.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { FilterProvider } from './context/FilterContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { validateEnvironment } from './utils/envValidation.js';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';

// Import admin utils early to trigger auto-enable in dev mode
import './utils/admin.js';
import { forceEnableAdmin } from './utils/admin.js';

// Auto-enable admin via URL parameter
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === 'true') {
    forceEnableAdmin();
  }
}

// Validate environment variables on startup
validateEnvironment();

// VitePWA automatically registers the service worker in production
// The plugin injects registration code during build
// No manual registration needed - VitePWA handles it via registerType: 'prompt'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
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
    </ThemeProvider>
  </React.StrictMode>
);

// App booted successfully
// "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16
