// BioVerseAR — offline app-shell service worker.
// Precaches every page, model-viewer, the Draco + KTX2 decoders, and the Animal
// Cells model so the whole app (and its in-page 3D render) works with no network.
// NOTE: the Scene Viewer AR handoff is a separate Android app and does NOT read this
// cache; it caches the model itself after the topic is opened online once.
const CACHE_NAME = 'bioversear-app-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard.html',
  './ar.html',
  './styles.css',
  './app.js',
  './topics.js',
  './manifest.json',
  './assets/vendor/model-viewer.min.js',
  './assets/vendor/draco/draco_wasm_wrapper.js',
  './assets/vendor/draco/draco_decoder.wasm',
  './assets/vendor/basis/basis_transcoder.js',
  './assets/vendor/basis/basis_transcoder.wasm',
  './assets/models/animal_cell.glb'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(ASSETS_TO_CACHE); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
