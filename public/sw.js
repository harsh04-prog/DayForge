const CACHE_NAME = 'dayforge-cache-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/dayforge-logo.png',
  '/dayforge-favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
];

// 1. Install event: pre-cache application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls (Network-Only to guarantee fresh habit/progress/auth data)
  if (url.pathname.startsWith('/api') || url.port === '5050') {
    return;
  }

  // Navigation requests: Network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Static assets (CSS, JS, Images, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message listener for manual app update prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
