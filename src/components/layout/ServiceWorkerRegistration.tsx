'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker, which is what makes the app installable on a
 * phone. Renders nothing.
 *
 * Skipped outside production: a worker left registered from a dev session
 * serves stale assets and makes changes look like they did not deploy.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Clean up anything a previous production visit left behind.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  }, []);

  return null;
}
