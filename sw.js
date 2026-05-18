// JLF Fireworks - Service Worker (CSP Compliant Version)
const CACHE_NAME = 'jlf-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/landing.html',
  '/css/style.css',
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

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('⚠️ Cache addAll failed:', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first strategy for API, cache-first for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // CRITICAL FIX: Do NOT intercept external resources
  // Let the browser handle them directly (respects CSP)
  if (url.origin !== self.location.origin) {
    // For external requests (Google Fonts, Font Awesome, CDNs), just fetch normally
    // Don't try to cache or modify them
    return;
  }
  
  // For API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For static assets - cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        });
      })
  );
});