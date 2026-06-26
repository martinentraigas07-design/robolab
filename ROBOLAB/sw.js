// RoboLab Service Worker — offline cache
// V2: fixed bundle name (robolab.bundle.js) and added icon assets
const CACHE = 'robolab-v2';
const ASSETS = [
  './index.html',
  './robolab.bundle.js',
  './manifest.json',
  './franky-blockly.js',
  './franky-blockly-helpers.js',
  './blockly_compressed.js',
  './bly_blocks.js',
  './bly_js.js',
  './bly_msg.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
