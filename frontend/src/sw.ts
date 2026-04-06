import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const imageHostCaches = [
  {
    pattern: /^https:\/\/images\.unsplash\.com\/.*/i,
    cacheName: "unsplash-images",
  },
  {
    pattern: /^https:\/\/images\.pexels\.com\/.*/i,
    cacheName: "pexels-images",
  },
  {
    pattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
    cacheName: "cloudinary-images",
  },
].map(({ pattern, cacheName }) => ({
  matcher: pattern,
  handler: new CacheFirst({
    cacheName,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
}));

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [...imageHostCaches, ...defaultCache],
});

serwist.addEventListeners();
