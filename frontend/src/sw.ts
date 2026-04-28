/// <reference lib="webworker" />

import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

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
