import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function InstallButton({ compact = false, showBanner = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Function to check if app is installed
  const checkIfInstalled = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    return isStandalone || isIOSStandalone;
  };

  useEffect(() => {
    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      console.log('🔍 [InstallButton] useEffect triggered', { compact, showBanner });
    }

    // Check immediately if app is already installed
    const installed = checkIfInstalled();
    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      console.log('🔍 [InstallButton] Check if installed:', {
        installed,
        displayMode: window.matchMedia('(display-mode: standalone)').matches,
        iosStandalone: window.navigator.standalone === true,
      });
    }

    if (installed) {
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.log('✅ [InstallButton] App is already installed, hiding button');
      }
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // Check periodically if app gets installed (for cases where user installs while page is open)
    const installCheckInterval = setInterval(() => {
      if (checkIfInstalled()) {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        window.deferredPrompt = null;
      }
    }, 1000);

    // Check if we already have a stored prompt (from previous page load)
    // This helps if the event fired before the component mounted
    if (window.deferredPrompt) {
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.log('✅ [InstallButton] Found existing deferredPrompt in window');
      }
      setDeferredPrompt(window.deferredPrompt);
      setIsInstallable(true);
    } else {
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.log('⚠️ [InstallButton] No existing deferredPrompt found');
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = e => {
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.log('🎉 [InstallButton] beforeinstallprompt event fired!', e);
      }
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      window.deferredPrompt = e; // Store globally for persistence
      setIsInstallable(true);
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.log('✅ [InstallButton] Install prompt is now available');
      }
    };

    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      console.log('👂 [InstallButton] Adding beforeinstallprompt listener');
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Debug: Log installability status (only in dev)
    if (import.meta.env.DEV) {
      const isStandaloneCheck = checkIfInstalled();
      // Only log if not installed (to avoid spam)
      if (!isStandaloneCheck) {
        // Check if manifest is accessible (silently)
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          fetch(manifestLink.href)
            .then(res => res.json())
            .catch(() => {
              // Silent fail
            });
        }
      }
    }

    // Listen for app installed event (fires when user accepts install)
    const handleAppInstalled = () => {
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.log('🎊 [InstallButton] appinstalled event fired!');
      }
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      setBannerDismissed(true); // Also dismiss banner
    };

    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      console.log('👂 [InstallButton] Adding appinstalled listener');
    }
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check periodically if install becomes available (for delayed events)
    const checkInterval = setInterval(() => {
      if (window.deferredPrompt && !isInstallable) {
        setDeferredPrompt(window.deferredPrompt);
        setIsInstallable(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(checkInterval);
      clearInterval(installCheckInterval);
    };
  }, [isInstallable, compact, showBanner]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        window.deferredPrompt = null;
        setIsInstallable(false);
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // Fallback: show instructions
        setShowInstructions(true);
      }
    } else {
      // No prompt available, show instructions
      setShowInstructions(true);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    // Suppress logging - app is installed, no need to log every render
    return null;
  }

  // Only log in development to reduce console noise
  if (import.meta.env.DEV) {
    console.log('🔍 [InstallButton] Render check:', {
      isInstalled,
      isInstallable,
      hasDeferredPrompt: !!deferredPrompt,
      compact,
      showBanner,
      bannerDismissed,
      showInstructions,
    });
  }

  // Show instructions modal if clicked without prompt
  if (showInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 max-w-md w-full"
        >
          <h3 className="text-xl font-bold mb-4">Install What's 4 Dinner</h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6">
            <p>
              <strong>Chrome/Edge:</strong> Click the install icon (➕) in the address bar
            </p>
            <p>
              <strong>Firefox:</strong> Menu → Install
            </p>
            <p>
              <strong>Safari (iOS):</strong> Share → Add to Home Screen
            </p>
            <p>
              <strong>Chrome (Android):</strong> Menu → Install App
            </p>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold"
          >
            Got it
          </button>
        </motion.div>
      </div>
    );
  }

  // In compact mode (menu), only show if we have a real install prompt
  if (compact && (!isInstallable || !deferredPrompt)) {
    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.log('🚫 [InstallButton] Not rendering menu button - no prompt available');
      }
    }
    return null; // Don't show in menu if not installable or no prompt
  }

  if (!compact && !isInstallable && !showBanner) {
    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.log('🚫 [InstallButton] Not rendering standalone button - not installable');
      }
    }
    return null; // Don't show standalone button if not installable
  }

  // Don't show button if we don't have a deferredPrompt (will just show instructions)
  // Only show if we have a real install prompt OR if user explicitly wants instructions
  if (!deferredPrompt && !compact) {
    // Only log in development to reduce console noise
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.log('🚫 [InstallButton] Not rendering - no deferredPrompt and not compact');
      }
    }
    return null; // No prompt available, don't show button (instructions modal handles this)
  }

  // Only log in development to reduce console noise
  if (import.meta.env.DEV) {
    console.log('✅ [InstallButton] Rendering button/banner');
  }

  // Banner style (top of page) - only show if we have a real install prompt ready
  if (showBanner && deferredPrompt && isInstallable && !bannerDismissed && !isInstalled) {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm sm:text-base">
                Install What's 4 Dinner for a better experience!
              </p>
              <p className="text-white/90 text-xs sm:text-sm hidden sm:block">
                Get quick access, offline support, and faster loading
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-emerald-600 hover:bg-emerald-50 font-semibold rounded-lg text-sm sm:text-base transition-colors whitespace-nowrap"
            >
              Install Now
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Dismiss"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Button style (menu or inline)
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleInstallClick}
      className={`${compact ? 'w-full' : 'w-full'} px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2`}
      title="Install What's 4 Dinner app on your device"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 sm:h-6 sm:w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="whitespace-nowrap">Install App</span>
    </motion.button>
  );
}
