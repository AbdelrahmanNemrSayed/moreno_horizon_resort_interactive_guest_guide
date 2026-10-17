/**
 * Moreno Horizon Spa & Resort - Service Worker
 * Network-First Strategy with Offline Cache Fallback
 */

const CACHE_NAME = "moreno-guide-v58";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/apple-touch-icon-180x180.png",
  "./assets/icons/apple-touch-icon-152x152.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/favicon-32x32.png",
  "./assets/icons/favicon-16x16.png",
  "./css/tailwind-compiled.css",
  "./css/tailwind-compiled.css?v=58.0",
  "./css/style.css",
  "./css/style.css?v=58.0",
  "./shared/positioning-core.js?v=58.0",
  "./js/core/i18n-engine.js?v=58.0",
  "./js/locales-bundle.js?v=58.0",
  "./js/data.js?v=58.0",
  "./js/virtual-resort-map.js?v=58.0",
  "./js/geofence-service.js?v=58.0",
  "./js/map-matcher.js?v=58.0",
  "./js/map-engine.js?v=58.0",
  "./js/voice-concierge.js?v=58.0",
  "./js/wayfinder.js?v=58.0",
  "./js/room-finder.js?v=58.0",
  "./js/templates/view-templates.js?v=58.0",
  "./js/app.js?v=58.0",
  "./moreno_resort_map_new.png",
  "./assets/images/moreno_logo.jpg",
  "./assets/images/hero_resort.jpg",
];

// 1. Install Event: Cache Core App Shell rapidly without network flooding
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((error) => {
            console.warn(`[SW] Precache skipped asset: ${asset}`, error);
          });
        }),
      );
    }),
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. Fetch Event: Stale-While-Revalidate for ultra-fast mobile loading
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Ignore non-http schemes (e.g. chrome-extension)
  if (!url.protocol.startsWith("http")) return;

  // Never cache API routes — always fetch live from network
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, error: "Offline — network unavailable" }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Revalidate in background to keep cache fresh
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network failed and we have no cache, try fallback
          if (cachedResponse) return cachedResponse;
          if (event.request.destination === "document") {
            return caches.match("./index.html");
          }
        });

      // Serve from cache immediately for 0ms mobile render!
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not yet cached, await network response
      return networkFetch;
    }),
  );
});

