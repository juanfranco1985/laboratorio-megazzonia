const CACHE_NAME = "buscaminas-procedural-v2";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./icon.svg",
  "./manifest.webmanifest",
  "./styles/main.css",
  "./styles/responsive.css",
  "./styles/themes.css",
  "./src/main.js",
  "./src/core/BoardGenerator.js",
  "./src/core/ChallengeCodec.js",
  "./src/core/GameState.js",
  "./src/core/MinesweeperEngine.js",
  "./src/core/NativeBridge.js",
  "./src/core/RevealSystem.js",
  "./src/core/Settings.js",
  "./src/core/StatsTracker.js",
  "./src/core/Storage.js",
  "./src/core/Timer.js",
  "./src/core/Validator.js",
  "./src/ui/BoardView.js",
  "./src/ui/ControlsView.js",
  "./src/ui/HUDView.js",
  "./src/ui/ModalView.js",
  "./src/ui/Renderer.js",
  "./src/ui/StatsView.js",
  "./src/ui/ThemeManager.js",
  "./src/utils/constants.js",
  "./src/utils/helpers.js",
  "./src/utils/random.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));

          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
