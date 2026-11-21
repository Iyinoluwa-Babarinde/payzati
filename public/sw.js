// Network-first service worker: clears stale v1 HTML caches so Next.js never loops on outdated chunks.
const CACHE_NAME = 'payzati-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always pass through to network — never serve stale cached HTML/chunks
  return;
});
