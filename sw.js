// JLF Fireworks - Service Worker (CSP Compliant Version)
const CACHE_NAME = 'jlf-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/landing.html',
  '/css/style.css',
  '/css/settings.css',
  '/css/landing.css',
  '/js/config.js',
  '/js/helpers.js',
  '/js/state.js',
  '/js/auth.js',
  '/js/cart.js',
  '/js/orders.js',
  '/js/products.js',
  '/js/bonds.js',
  '/js/credit.js',
  '/js/recharge.js',
  '/js/withdraw.js',
  '/js/loyalty.js',
  '/js/announcements.js',
  '/js/settings.js',
  '/js/bug-report.js',
  '/js/admin-bugreports.js',
  '/js/admin-orders.js',
  '/js/admin-users.js',
  '/js/admin-logs.js',
  '/js/admin-recharges.js',
  '/js/admin-withdrawals.js',
  '/js/admin-investments.js',
  '/js/admin-announcements.js',
  '/js/admin.js',
  '/js/data.js',
  '/js/app.js',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache).catch(err => console.log('Cache warning:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cache => {
        if (cache !== CACHE_NAME) return caches.delete(cache);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // CRITICAL: Do NOT intercept external resources
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // For API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For static assets - cache first
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});