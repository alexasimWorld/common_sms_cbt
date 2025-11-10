// --- Company CBT: Service Worker ---
const CACHE_NAME = "cbt-cache-v1";

// Files always cached (the "app shell")
const APP_SHELL = [
  "/",
  "/index.html",
  "/main.html",
  "/css/style.css",
  "/js/app.js",
  "/js/bridge.js",
  "/js/jarvis.js",
  // images used in shell
  "/assets/images/commonpro/logo.png",
  "/assets/images/commonpro/vessel.png",
  "/assets/images/commonpro/bridge_silhouette.png"
];

// On install, pre-cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// On activate, clean old caches if version changed
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Runtime caching:
// - cache-first for chapter files in /content/*.html
// - cache-first for images
// - network-first fallback for everything else (so updates come through)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chapters
  if (url.pathname.startsWith("/content/") && url.pathname.endsWith(".html")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network first (updates your shell automatically)
  event.respondWith(networkFirst(request));
});

// Strategies
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
