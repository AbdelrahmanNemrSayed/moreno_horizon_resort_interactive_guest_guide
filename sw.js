/**
 * Moreno Horizon Spa & Resort - Service Worker
 * Network-First Strategy with Offline Cache Fallback
 */

const CACHE_NAME = 'moreno-guide-v44';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './moreno_resort_map_new.png',
  './manifest.json',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/apple-touch-icon-180x180.png',
  './assets/icons/apple-touch-icon-152x152.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/favicon-32x32.png',
  './assets/icons/favicon-16x16.png',
  './css/style.css',
  './css/style.css?v=37.0',
  './js/data.js?v=37.0',
  './js/map-engine.js?v=37.0',
  './js/virtual-resort-map.js?v=37.0',
  './js/wayfinder.js?v=37.0',
  './js/app.js?v=37.0',
  './assets/images/hero_resort.jpg',
  './assets/images/beach_marina.jpg',
  './assets/images/sirena_buffet.jpg',
  './assets/images/oriental_grill.jpg',
  './assets/images/beach_bar.jpg',
  './assets/images/la_mama.jpg',
  './assets/images/spa_wellness.jpg',
  './assets/images/lotus_pool.jpg',
  './assets/images/aquapark_pool.jpg',
  './assets/images/diving_center.jpg',
  './assets/images/kids_club.jpg',
  './assets/images/tennis_courts.jpg',
  './assets/images/resort_lobby.jpg',
  './assets/images/resort_mall.jpg',
  './assets/images/resort_mosque.jpg',
  './assets/images/resort_clinic.jpg',
  './assets/images/resort_gate.jpg',
  './assets/images/luxury_room.jpg',
  './assets/images/giftun_island.jpg',
  ...Array.from({ length: 35 }, (_, index) => `./assets/images/gallery/gallery-${String(index + 1).padStart(2, '0')}.jpg`)
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(ASSETS_TO_CACHE.map((asset) => {
        return cache.add(asset).catch((error) => {
          console.warn(`Offline asset unavailable: ${asset}`, error);
        });
      }));
    })
  );
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

// Network-First with Cache Fallback so updates are immediately visible
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse || !networkResponse.ok) {
          return caches.match(event.request).then((cachedResponse) => cachedResponse || networkResponse);
        }
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
