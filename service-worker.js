const CACHE_NAME = 'agenda-pro-v8';
const urlsToCache = [
  'agenda.html',
  'manifest.json',
  '192x192.png',
  '512x512.png',
  'agenda.webp'
];

// ─── Installation : mise en cache des fichiers ───────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// ─── Activation : nettoyage des anciens caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Suppression ancien cache :', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Stratégie : Cache First, puis réseau ────────────────────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('agenda.html'));
    })
  );
});

// ─── Notifications push (depuis serveur) ─────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:              data.body || '',
      icon:              '192x192.png',
      badge:             '192x192.png',
      tag:               data.tag || 'agenda-notification',
      requireInteraction: true
    })
  );
});

// ─── Notifications locales (depuis la page principale) ───────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(
      event.data.title,
      {
        body:              event.data.options.body || '',
        icon:              '192x192.png',
        badge:             '192x192.png',
        tag:               event.data.options.tag || 'agenda',
        requireInteraction: event.data.options.requireInteraction || false
      }
    );
  }
});

// ─── Clic sur une notification ───────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('agenda.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('agenda.html');
    })
  );

});
