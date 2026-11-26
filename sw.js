/* TidyAway offline cache. Same origin only: requests to any other origin are never touched.
   Pages, CSS and JS are fetched fresh when online and fall back to the cache offline;
   images are served from the cache once seen. Bump VERSION on each deploy. */
var VERSION = 'tidyaway-v5';
var CORE = ['./', 'index.html', 'privacy.html', 'support.html', 'css/site.css', 'js/moments.js', 'js/site.js',
  'manifest.webmanifest', 'assets/app-icon-64.png', 'assets/app-icon-256.png', 'assets/apple-touch-icon.png',
  'assets/badges/app-store-black.svg', 'assets/devices/iphone-hand-1200.webp', 'assets/devices/ipad-landscape-hands-1200.webp'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;      // never another server
  var isImage = /[.](png|jpe?g|webp|svg)$/i.test(url.pathname);
  function put(res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }
  if (isImage) {
    e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(put); }));
  } else {
    e.respondWith(fetch(req).then(put).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('index.html'); });
    }));
  }
});
