const CACHE = 'vortex-v19';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Ignorer tout ce qui n'est pas http/https
  if (!e.request.url.startsWith('http')) return;

  // Ne jamais intercepter les requêtes vers d'autres domaines
  // (API de synchronisation, icônes de sites...) : le service worker
  // renverrait index.html en cas d'échec, ce qui casse les réponses JSON.
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    })).catch(() => caches.match('/index.html'))
  );
});
