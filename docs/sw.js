const CACHE_NAME = 'my-cool-offline-game-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  'https://cdn.glitch.global/4fc6eda5-1313-4a1e-8b76-b859653416cd/brace-logo-symbol.png?v=1733533998031'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'no-cors' })));
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found, otherwise fetch from network
        return response || fetch(event.request).catch(() => {
          // Fallback response when fetch fails (e.g., offline)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});