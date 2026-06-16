const CACHE_NAME = 'sopa-infinita-v7';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './packs/manifest.json',
  './packs/creative-pack.json',
  './styles/main.css',
  './styles/themes.css',
  './styles/responsive.css',
  './src/main.js',
  './src/core/GameController.js',
  './src/core/GameState.js',
  './src/core/WordSearchEngine.js',
  './src/core/GridGenerator.js',
  './src/core/WordPlacer.js',
  './src/core/Timer.js',
  './src/core/Storage.js',
  './src/core/StatsManager.js',
  './src/core/Settings.js',
  './src/core/ContentManager.js',
  './src/core/PackLoader.js',
  './src/core/NativeBridge.js',
  './src/ui/Renderer.js',
  './src/ui/GridView.js',
  './src/ui/WordListView.js',
  './src/ui/ControlsView.js',
  './src/ui/ModalView.js',
  './src/ui/ThemeManager.js',
  './src/ui/StatsView.js',
  './src/data/categories.js',
  './src/utils/random.js',
  './src/utils/helpers.js',
  './src/utils/constants.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
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
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return new Response('', { status: 504, statusText: 'Offline' });
        });
    }),
  );
});
