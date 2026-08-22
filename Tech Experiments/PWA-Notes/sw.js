// Bump this whenever you change the cached files, so old caches get cleared out.
const CACHE_NAME = "pwa-notes-v1";

// The "app shell": the minimum set of files needed to render the UI offline.
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ---------- install ----------
// Runs once, when the browser first sees this service worker (or a changed one).
// We pre-cache the app shell so the app can boot with zero network requests.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Don't wait for old tabs to close before activating the new SW version.
  self.skipWaiting();
});

// ---------- activate ----------
// Runs after install, once the new service worker is ready to take control.
// This is the right place to delete caches from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------- fetch ----------
// Intercepts every network request the page makes. This is what makes the
// app work offline: we can answer from the cache instead of the network.
//
// Strategy used here: "cache-first, falling back to network".
// Good fit for an app shell that rarely changes. (Other common strategies:
// network-first for frequently-updated data, or stale-while-revalidate for
// a balance of speed and freshness.)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests; POST/PUT etc. should always hit the network.
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache a copy of newly-fetched files for next time.
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Optional: return a fallback page here for failed navigations
          // when the user is offline and the page isn't cached yet.
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
