/*
 * Service worker for the installable (PWA) version.
 *
 * Deliberately cautious about what it stores. This app serves per-user KPI data
 * behind a session cookie, and a cache that kept an API response or a rendered
 * page could hand one employee another's figures, or show numbers that are
 * quietly out of date. So:
 *
 *   - Only immutable build assets are cached (/_next/static/*, icons).
 *   - Everything else — pages, /api/*, anything with a query string — goes
 *     straight to the network, every time.
 *
 * Chrome also requires a fetch handler before it will offer to install the app,
 * which is the other reason this file exists.
 */

const CACHE = 'kpulse-static-v1';

const PRECACHE = ['/icon-192.png', '/icon-512.png', '/icon-maskable-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined) // A failed precache must not block activation.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/** Immutable build output and icons: safe to serve from cache. */
function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    !url.search &&
    (url.pathname.startsWith('/_next/static/') ||
      /\.(png|jpg|jpeg|svg|ico|woff2?)$/i.test(url.pathname))
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never let a cache stand between the user and their data, or their session.
  if (url.pathname.startsWith('/api/') || !isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
