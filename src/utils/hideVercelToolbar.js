/**
 * Hide Vercel Toolbar/Live widget for non-admin users
 * Only admins should see Vercel's preview/deployment tools
 */

import { isAdmin } from './admin.js';

/**
 * Check if current user is admin (async)
 */
async function checkIfAdmin() {
  try {
    const { supabase } = await import('../lib/supabaseClient.js');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || !user.email) {
      return false; // No user = not admin
    }
    
    return isAdmin(user);
  } catch (e) {
    return false; // Error = not admin (hide toolbar to be safe)
  }
}

/**
 * Hide Vercel Toolbar for regular users
 * Should be called early in app initialization
 */
export async function hideVercelToolbarForNonAdmins() {
  // Check if we're on Vercel (preview or production)
  const isVercelDeployment =
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('vercel.live') ||
    import.meta.env.VITE_VERCEL_ENV ||
    import.meta.env.VERCEL;

  if (!isVercelDeployment) {
    return; // Not on Vercel, nothing to hide
  }

  // Check if current user is admin
  const userIsAdmin = await checkIfAdmin();
  
  if (!userIsAdmin) {
    // User is NOT admin - hide the toolbar
    hideVercelToolbar();
  } else {
    // User IS admin - allow toolbar to show
    if (import.meta.env.DEV) {
      console.log('✅ [VERCEL TOOLBAR] Admin user detected - toolbar will be visible');
    }
  }
}

/**
 * Hide Vercel Toolbar elements
 */
function hideVercelToolbar() {
  // Hide Vercel Live iframe
  const hideVercelElements = () => {
    // Hide Vercel Live feedback iframe
    const vercelIframes = document.querySelectorAll('iframe[src*="vercel.live"]');
    vercelIframes.forEach(iframe => {
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
    });

    // Hide Vercel Toolbar (if it exists)
    const vercelToolbar = document.querySelector('[data-vercel-toolbar]');
    if (vercelToolbar) {
      vercelToolbar.style.display = 'none';
      vercelToolbar.style.visibility = 'hidden';
    }

    // Hide any elements with vercel in class/id
    const vercelElements = document.querySelectorAll('[class*="vercel"], [id*="vercel"]');
    vercelElements.forEach(el => {
      if (el.src && el.src.includes('vercel.live')) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
    });
  };

  // Hide immediately
  hideVercelElements();

  // Use MutationObserver to catch dynamically added elements
  const observer = new MutationObserver(hideVercelElements);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'id'],
  });

  // Also add CSS to hide Vercel elements
  const style = document.createElement('style');
  style.id = 'hide-vercel-toolbar';
  style.textContent = `
    iframe[src*="vercel.live"],
    iframe[src*="vercel-scripts"],
    [data-vercel-toolbar],
    [class*="vercel"][class*="toolbar"],
    [id*="vercel"][id*="toolbar"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      z-index: -9999 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize - call this from main.jsx or App.jsx
 */
export function initVercelToolbarHiding() {
  // Wait for DOM to be ready
  const runCheck = () => {
    hideVercelToolbarForNonAdmins().catch(e => {
      if (import.meta.env.DEV) {
        console.error('Error hiding Vercel toolbar:', e);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCheck);
  } else {
    runCheck();
  }

  // Also check periodically (auth might load later)
  setTimeout(runCheck, 2000);
  setTimeout(runCheck, 5000);
  setTimeout(runCheck, 10000);

  // Also hide on route changes (SPA navigation)
  if (typeof window !== 'undefined') {
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(runCheck, 100);
      }
    }, 1000);
  }
}

