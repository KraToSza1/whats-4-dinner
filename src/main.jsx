// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { validateEnvironment } from './utils/envValidation.js';
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
  console.log('🔑 [MAIN] ✅ Auto-enabled admin (localhost detected)');
}

// Also check URL parameter
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === 'true') {
    forceEnableAdmin();
    console.log('🔑 [MAIN] ✅ Auto-enabled admin (?admin=true detected)');
  }
}

// Validate environment variables on startup
validateEnvironment();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AdminProvider>
        <ToastProvider>
          <ErrorBoundary onRetry={() => window.location.reload()}>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </AdminProvider>
    </AuthProvider>
  </React.StrictMode>
);

console.log(
  '%c[Whats-4-Dinner]%c App booted successfully 🚀',
  'color: #10b981; font-weight: bold;',
  'color: inherit'
);

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
    console.log('🔐 [MAIN] ⚠️ OAuth tokens detected on wrong domain!');
    console.log('🔐 [MAIN] Current URL:', window.location.href);
    console.log('🔐 [MAIN] Redirecting to localhost:5173 with tokens...');
    const redirectUrl = `http://localhost:5173${window.location.pathname}${hash}`;
    window.location.replace(redirectUrl);
  }
}
