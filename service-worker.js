const CACHE_NAME = 'agenda-pro-v3';
const urlsToCache = [
  'agenda.html',
  'manifest.json',
  'agenda.webp'
];

// Installation - mise en cache des fichiers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation - nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de récupération: Cache First, puis Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retourner la réponse du cache
        if (response) {
          return response;
        }

        // Sinon, récupérer depuis le réseau
        return fetch(event.request).then(
          response => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse
            const responseToCache = response.clone();

            // Mettre en cache pour les prochaines fois
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // En cas d'erreur réseau, essayer de retourner une page par défaut
          return caches.match('agenda.html');
        });
      })
  );
});

// Gestion des notifications push (pour extension future)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Rappel d\'événement',
    icon: 'agenda.webp',
    badge: 'agenda.webp',
    vibrate: [200, 100, 200],
    tag: 'agenda-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Mon Agenda Pro', options)
  );
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('agenda.html')
  );
});

// Synchronisation en arrière-plan (pour extension future)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

function syncEvents() {
  // Logique de synchronisation future
  return Promise.resolve();
}

