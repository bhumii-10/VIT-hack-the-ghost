// Simple Service Worker for SankatSaathi
const CACHE_NAME = 'sankatsaathi-v2';

self.addEventListener('install', (event) => {
    console.log('SW: Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activating...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Skip API requests
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    // For navigation requests, always go to network first
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request, { redirect: 'follow' }).catch(() => {
                return caches.match('/index.html');
            })
        );
        return;
    }
    
    // For other requests, try cache first, then network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request, { redirect: 'follow' });
        })
    );
});

self.addEventListener('push', function (event) {
    console.log('SW: Push Received', event);
    if (!event.data) {
        console.warn('SW: Push event had no data.');
        return;
    }

    try {
        const data = event.data.json();
        console.log('SW: Push Data:', data);

        const options = {
            body: data.body || 'Emergency Alert',
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            data: data.data || {},
            tag: 'emergency-alert',
            requireInteraction: true,
            actions: [
                { action: 'open', title: 'View Details' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'SankatSaathi Alert', options)
        );
    } catch (e) {
        console.error('SW: Push error:', e);
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('SW: Notification clicked');
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = '/intelligence';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there's already a window/tab open with the target URL
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
