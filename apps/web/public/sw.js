// Tricky Solver Academy service worker.
// Strategy: cache-first for the app shell and static assets (so the site
// loads instantly and works offline once visited), network-first for API
// calls (so data is never stale when a connection is available, falling
// back to any cached response only when genuinely offline).

const CACHE_VERSION = 'tsa-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;

const APP_SHELL_URLS = ['/', '/manifest.json', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('tsa-') && key !== APP_SHELL_CACHE && key !== API_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isNavigationRequest = (request) => request.mode === 'navigate';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept cross-origin requests (payment provider redirects,
  // Cloudinary file URLs, etc.) — only handle same-origin traffic.
  if (url.origin !== self.location.origin) return;

  if (isApiRequest(url)) {
    // Network-first for API calls: try the network, cache successful GET
    // responses as a fallback, and serve the cached copy only if the
    // network genuinely fails (offline).
    if (event.request.method !== 'GET') return; // never cache mutating requests

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (isNavigationRequest(event.request)) {
    // App shell navigation: try network first for freshness, fall back to
    // the cached offline page if there's no connection at all.
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline').then((res) => res || caches.match('/')))
    );
    return;
  }

  // Static assets (JS/CSS/images/fonts): cache-first for speed, populate
  // the cache in the background on first fetch.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
