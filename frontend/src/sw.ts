/// <reference lib="webworker" />

import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

// App shell offline: permite abrir rutas del SPA sin red.
const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(new NavigationRoute(navigationHandler));

const syncQueue = new BackgroundSyncPlugin('nosignal-queue', {
  maxRetentionTime: 3 * 24 * 60,
});

registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/v1/forms') && request.method === 'POST',
  new NetworkOnly({
    plugins: [syncQueue],
  }),
  'POST',
);

// Recursos estáticos de mismo origen: prioriza red para aplicar cambios en la primera recarga.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    ['style', 'script', 'worker'].includes(request.destination),
  new NetworkFirst({
    // Evita quedar con JS/CSS viejo tras pulsar "Actualizar ahora".
    cacheName: 'nosignal-static-v3',
    networkTimeoutSeconds: 4,
  }),
);

// Imágenes/fonts: cache-first para mejor experiencia offline.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    ['image', 'font'].includes(request.destination),
  new CacheFirst({
    cacheName: 'nosignal-media-v1',
  }),
);

// Tile server caching (OpenStreetMap): cache-first with expiration.
// Esto permite que tiles visitados previamente estén disponibles offline.
registerRoute(
  ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'osm-tiles-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);
