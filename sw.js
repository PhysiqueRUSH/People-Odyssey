// sw.js
const CACHE_NAME = "po-cache-v1.50";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./PeopleICO.png",
  "./Titre.png",
];

// Installe et pré-cache l’app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Optionnel : activer la nouvelle version sans attendre
  self.skipWaiting();
});

// Nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

// Stratégie de base :
// - requêtes de navigation (HTML) → cache d’abord (index.html), sinon réseau
// - requêtes same-origin (images, css, js) → cache d’abord, fallback réseau
// - cross-origin (CDN Tesseract) → réseau d’abord, fallback cache si présent
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  // 1) Navigations (tap / refresh / liens internes)
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) =>
        cached ||
        fetch(req).catch(() => caches.match("./index.html")) // offline fallback
      )
    );
    return;
  }

  // 2) Même origine → cache d’abord
  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // 3) Cross-origin (ex: CDN)
  event.respondWith(
    fetch(req).catch(() => caches.match(req)) // si déjà en cache
  );
});
