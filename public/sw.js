// Pages from the network (fresh data), static assets and images from the cache.
const CACHE = 'foode3-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('/', copy));
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  const isAsset = url.origin === self.location.origin && /\.(js|css|png|svg|woff2?|webmanifest)$/.test(url.pathname);
  const isImage = req.destination === 'image' || url.pathname.includes('/storage/v1/object/public/foode-images/');
  const isFont = url.host === 'fonts.gstatic.com' || url.host === 'fonts.googleapis.com';
  if (!isAsset && !isImage && !isFont) return;

  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
