const CACHE_NAME = "sudoku-procedural-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./styles/themes.css",
  "./styles/main.css",
  "./styles/responsive.css",
  "./src/main.js",
  "./src/core/GameState.js",
  "./src/core/PuzzleGenerator.js",
  "./src/core/Settings.js",
  "./src/core/Storage.js",
  "./src/core/SudokuEngine.js",
  "./src/core/Timer.js",
  "./src/core/Validator.js",
  "./src/platform/Analytics.js",
  "./src/platform/NativeBridge.js",
  "./src/ui/BoardView.js",
  "./src/ui/ControlsView.js",
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
