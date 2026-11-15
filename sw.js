// Service worker de la version installable : garde la page et ses bibliothèques pour un usage hors connexion.
// La page est demandée au réseau d'abord (pour recevoir les mises à jour), puis prise dans le cache si le réseau manque.
const CACHE = 'chantiko-202611151645';
const FICHIERS = ['./', 'app.html', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png'];
const EXTERNES = ['https://cdn.jsdelivr.net/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  const interne = url.startsWith(self.location.origin);
  if (!interne && !EXTERNES.some(p => url.startsWith(p))) return;
  if (interne) {
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./'))));
  } else {
    // Bibliothèques et polices : versions figées, donc le cache d'abord.
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(rep => {
      if (rep.ok || rep.type === 'opaque') { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); }
      return rep;
    })));
  }
});
