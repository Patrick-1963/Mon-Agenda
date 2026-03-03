const CACHE_NAME = 'agenda-pro-v5';
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

// Écouter les événements push pour afficher une notification
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '192x192.png',
    badge: '192x192.png',
    tag: 'agenda-notification',
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gérer les messages pour les notifications locales
self.addEventListener('message', event => {
  if (event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(
      event.data.title,
      event.data.options
    );
  }
});