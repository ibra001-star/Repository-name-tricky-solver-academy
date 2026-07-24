'use client';

import * as React from 'react';

// Registers the service worker once the app has hydrated. Kept as its own
// no-render component (rather than inline in Providers) so the
// registration logic — and any future update-prompt UI — stays isolated.
export const ServiceWorkerRegistration = () => {
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Registering after 'load' avoids competing with the initial page's
    // own network requests for bandwidth on a slow connection.
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failures (e.g. unsupported browser, blocked by a
        // privacy setting) are non-fatal — the app works fine without
        // offline support, it just won't be installable/offline-capable.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
};
