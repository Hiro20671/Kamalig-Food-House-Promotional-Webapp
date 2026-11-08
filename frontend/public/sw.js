const CACHE_NAME = 'kamalig-fh-pwa-v4';
const PUBLIC_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/kamalig-manifest.json?v=kamalig2026',
  '/manifest.json',
  '/kamalig-logo.png',
  '/kamalig-fh-192.png?v=kamalig2026',
  '/kamalig-fh-512.png?v=kamalig2026',
  '/kamalig-fh-apple-180.png?v=kamalig2026',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Security Rule: NEVER cache private owner information or admin pages/APIs in public offline storage
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.startsWith('/django-admin')
  ) {
    return;
  }

  // Always fetch fresh manifest & icons first so old cached apps never override Kamalig FH
  if (
    url.pathname.endsWith('manifest.json') ||
    url.pathname.includes('kamalig-fh-') ||
    url.pathname.includes('pwa-')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'reload' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Public API requests: Network-first with safe cached fallback
  if (url.pathname.startsWith('/api/public/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Public HTML navigation requests: Network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedIndex = await caches.match('/index.html');
        return cachedIndex || caches.match('/offline.html');
      })
    );
  }
});
