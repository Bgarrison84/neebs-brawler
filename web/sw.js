const CACHE = 'neebs-brawler-v2';
const PRECACHE = [
  '.', 'index.html', 'css/style.css',
  'js/main.js', 'js/game.js', 'js/input.js', 'js/charselect.js',
  'js/sprites/sprites.js',
  'js/systems/fx.js', 'js/systems/combat.js', 'js/systems/audio.js',
  'js/entities/player.js', 'js/entities/enemy.js', 'js/entities/prop.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
