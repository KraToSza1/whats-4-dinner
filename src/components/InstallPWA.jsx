import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if app was previously installed
    if (window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = e => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if service worker is registered (required for PWA)
    // Only warn in development to reduce console noise
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if ('serviceWorker' in navigator && isDev) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (!registration) {
          console.warn('⚠️ [PWA] Service worker not registered. PWA install may not work.');
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ [PWA] User accepted the install prompt');
    } else {
      console.log('❌ [PWA] User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if no install prompt available
  if (!showInstallButton || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 border-emerald-500 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Install What's 4 Dinner
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Install our app for a better experience with offline access and faster loading.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
              >
                Install Now
              </button>
              <button
                onClick={() => {
                  setShowInstallButton(false);
                  setDeferredPrompt(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
