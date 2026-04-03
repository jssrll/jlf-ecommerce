// NOVA PWA Service Worker - Simple Version (No Offline Caching)
const CACHE_NAME = 'nova-pwa-v1';

// Install event - just activate immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch event - just go to network, no caching
self.addEventListener('fetch', (event) => {
  // Just fetch from network normally
  event.respondWith(fetch(event.request));
});

// Push Notification Event
self.addEventListener('push', function(event) {
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'JLF Fireworks', body: event.data.text() };
        }
    }
    
    const title = data.title || 'JLF Fireworks 🎆';
    const options = {
        body: data.body || 'New update from JLF Fireworks!',
        icon: '/icons/apple-touch-icon.png',
        badge: '/icons/favicon-32x32.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            orderId: data.orderId || null
        },
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        const url = event.notification.data?.url || '/';
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                for (let client of windowClients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
        );
    }
});