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

// Hide Vercel Toolbar for non-admin users
import { initVercelToolbarHiding } from './utils/hideVercelToolbar.js';
initVercelToolbarHiding();

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
// "I can do all things through Christ who strengthens me." - Philippians 4:13
// "Trust in the Lord with all your heart and lean not on your own understanding." - Proverbs 3:5
// "Be still, and know that I am God." - Psalm 46:10
// "The Lord is my shepherd, I lack nothing." - Psalm 23:1
// "Cast all your anxiety on him because he cares for you." - 1 Peter 5:7
// "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future." - Jeremiah 29:11
// "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." - Philippians 4:6
// "Jesus said, 'I am the way and the truth and the life. No one comes to the Father except through me.'" - John 14:6
// "The Lord will fight for you; you need only to be still." - Exodus 14:14
