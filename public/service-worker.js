self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Just fetch; don't cache aggressively
  event.respondWith(fetch(event.request).catch(() => caches.match('/')));
});
