(function(){
  const hasSW = "serviceWorker" in navigator;
  const preloader = () => document.getElementById("preloader");

  // Quick check: if most assets are already in cache, we can fast-skip preloader
  async function isCacheWarm(expected) {
    if (!('caches' in window)) return false;
    try {
      const keys = await caches.keys();
      const name = keys.find(k => k.startsWith("precache-"));
      if (!name) return false;
      const cache = await caches.open(name);
      const entries = await cache.keys();
      // Expect at least 80% of manifest
      return entries.length >= Math.floor(expected.length * 0.8);
    } catch {
      return false;
    }
  }

  async function registerSW(assets) {
    if (!hasSW) return { ready: false };

    // Register
    const reg = await navigator.serviceWorker.register("/sw.js");

    // Send manifest to SW so it can precache
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SET_MANIFEST", payload: assets });
    } else {
      // Wait for the new controller
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "SET_MANIFEST", payload: assets });
        }
      }, { once: true });
    }

    // If cache already warm, we’re done—callers can hide preloader
    const warm = await isCacheWarm(assets);
    return { ready: warm };
  }

  // Expose a single init that index.html can call
  window.__SW_INIT = async function(assets){
    const { ready } = await registerSW(assets || []);
    return ready;
  };

  // Helper used by index.html to fade out
  window.__fadeOutPreloader = function(durationMs = 700) {
    const el = preloader();
    if (!el) return;
    el.style.transition = `opacity ${durationMs}ms ease`;
    el.style.opacity = '0';
    setTimeout(() => { el.remove(); }, durationMs + 50);
  };
})();
