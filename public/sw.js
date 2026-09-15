const CACHE_NAME = 'myplaner-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests, ignore chrome-extension / firestore / googleapis
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.origin.includes('accounts.google.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback if needed
        return caches.match('./index.html');
      });
    })
  );
});
