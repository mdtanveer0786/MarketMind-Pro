// Service Worker for MarketMind Pro PWA

const CACHE_NAME = 'marketmind-pro-v2.1';
const ASSETS_TO_CACHE = [
    '/marketmind-pro/',
    '/marketmind-pro/index.html',
    '/marketmind-pro/css/variables.css',
    '/marketmind-pro/css/layout.css',
    '/marketmind-pro/css/components.css',
    '/marketmind-pro/css/themes.css',
    '/marketmind-pro/js/utils.js',
    '/marketmind-pro/js/state.js',
    '/marketmind-pro/js/app.js',
    '/marketmind-pro/js/dashboard.js',
    '/marketmind-pro/js/charts.js',
    '/marketmind-pro/js/strategy.js',
    '/marketmind-pro/js/journal.js',
    '/marketmind-pro/js/risk.js',
    '/marketmind-pro/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(response => {
                    // Don't cache if not a successful response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            }).catch(() => {
                // If both cache and network fail, show offline page
                if (event.request.mode === 'navigate') {
                    return caches.match('/marketmind-pro/index.html');
                }
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-trades') {
        event.waitUntil(syncTrades());
    }
});

async function syncTrades() {
    // This would sync trades with a backend when online
    // For now, it's a placeholder for future implementation
    console.log('Syncing trades...');
}

// Push notifications
self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'MarketMind Pro Notification',
        icon: '/marketmind-pro/assets/icons/icon-192x192.png',
        badge: '/marketmind-pro/assets/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/marketmind-pro/'
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
        self.registration.showNotification(data.title || 'MarketMind Pro', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});