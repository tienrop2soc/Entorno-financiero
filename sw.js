/* Service worker: la app funciona sin conexión tras la primera visita. */
const CACHE = 'entorno-financiero-v2';
const ASSETS = [
  './', './index.html', './css/styles.css', './manifest.webmanifest', './icons/icon.svg',
  './js/icons.js', './js/utils.js', './js/store.js', './js/ui.js', './js/charts.js',
  './js/forms.js', './js/views-main.js', './js/views-plan.js', './js/app.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Red primero para tener siempre la última versión; caché si no hay conexión. */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
