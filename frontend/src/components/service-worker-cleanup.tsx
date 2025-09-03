"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerCleanup un-registers any existing service workers and clears caches.
 * Useful when disabling next-pwa to avoid stale clients still running the old SW.
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    let cancelled = false;

    async function cleanup() {
      try {
        if (typeof window === "undefined") return;

        // Unregister all service workers
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            regs.map(async (reg) => {
              try {
                await reg.unregister();
              } catch (e) {
                console.warn("SW unregister failed:", e);
              }
            })
          );
        }

        // Clear caches left by previous SWs
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys.map(async (key) => {
              try {
                await caches.delete(key);
              } catch (e) {
                console.warn("Cache delete failed for", key, e);
              }
            })
          );
        }

        // If a controller exists, ask it to stop controlling
        if (navigator.serviceWorker?.controller) {
          try {
            navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
          } catch {}
        }
      } catch (err) {
        if (!cancelled) console.warn("Service worker cleanup error:", err);
      }
    }

    cleanup();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
