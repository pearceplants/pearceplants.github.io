/* Simple precache SW */
const PRECACHE = "precache-v1"; // bump to invalidate old cache

// We’ll pull the list from a global injected by precache-manifest.js
let PRECACHE_ASSETS = [];
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SET_MANIFEST" && Array.isArray(e.data.payload)) {
    PRECACHE_ASSETS = e.data.payload;
  }
});

// Wait for manifest, then install
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // Wait one tick so SET_MANIFEST can arrive if client postsMessage immediately
    await new Promise(r => setTimeout(r, 0));
    const cache = await caches.open(PRECACHE);
    // Cache bust helper for same-origin assets (optional)
    const toCache = PRECACHE_ASSETS.map(url => new Request(url, { cache: "reload" }));
    await cache.addAll(toCache);
    self.skipWaiting();
  })());
});

// Claim clients ASAP
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Optional old cache cleanup
    const names = await caches.keys();
    await Promise.all(names.map(n => (n !== PRECACHE ? caches.delete(n) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// Runtime fetch: serve from cache first, fall back to network
self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET same-origin
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      return resp;
    } catch (e) {
      return caches.match("/"); // last resort
    }
  })());
});
