"use client";

/**
 * Offline copies: for visitors who said yes to saving on this device, public/sw.js keeps a copy
 * of each page they open and the files it needs, so the site still opens with no connection.
 * The copies are only public pages: what someone saves lives in local storage (see storage.ts),
 * and search words are never kept.
 */

/** Cache names. Keep in step with public/sw.js. */
export const PAGE_CACHE = "immigrai-pages";
const PREFIX = "immigrai-";

/** Removes the service worker and every offline copy. Used when saving is turned off or data is deleted. */
export async function removeOfflineCopies() {
  if (typeof window === "undefined") return;
  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    // The worker keeps running this page until it closes, so first tell it to keep nothing more.
    navigator.serviceWorker?.controller?.postMessage({ type: "stop" });
    for (const registration of registrations) registration.active?.postMessage({ type: "stop" });
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith(PREFIX)).map((name) => caches.delete(name)));
    }
  } catch {
    /* blocked by the browser: nothing was stored */
  }
}

/** The addresses of the pages kept on this device, without their origin. */
export async function keptPages(): Promise<Set<string>> {
  try {
    if (!("caches" in window) || !(await caches.has(PAGE_CACHE))) return new Set();
    const keys = await (await caches.open(PAGE_CACHE)).keys();
    return new Set(keys.map((request) => {
      const url = new URL(request.url);
      return url.pathname + url.search;
    }));
  } catch {
    return new Set();
  }
}

/** Skips the extra download on a data saver or a very slow connection. */
export function lowData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g");
}
