/*
  ImmigrAI service worker. Registered only for visitors who said yes to saving on this device
  (src/components/site/offline.tsx), and removed if they say no or delete their data.

  It keeps a copy of each page they open and of the files those pages need, so the site still
  opens with a weak or no connection:
  - Pages: the network first. If it takes longer than PATIENCE_MS and a copy is kept, the copy
    shows instead, and the fresh page replaces the copy in the background. With no connection
    and no copy, a short "You are offline" page shows.
  - Build files under /_next/static/ never change once built, so a kept copy is always used.
    Other files, such as icons, show the kept copy and refresh it in the background.
  - API calls and the app's own page data always go to the network.

  Nothing anyone types is kept: addresses with search words (?q=) are skipped. Cache names
  are shared with src/lib/offline.ts.
*/

const PAGES = "immigrai-pages";
const FILES = "immigrai-files";
const OFFLINE = "/offline.html";
const MAX_PAGES = 60;
const MAX_FILES = 400;
const PATIENCE_MS = 4000;
/** A page copy younger than this is not downloaded again when it is opened inside the app. */
const FRESH_MS = 6 * 60 * 60 * 1000;

/**
 * Set when the visitor turns saving off or deletes their data. The page this worker still
 * controls keeps loading files until it closes, so from here on nothing is kept.
 */
let stopped = false;

async function forgetAll() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith("immigrai-")).map((name) => caches.delete(name)));
}

/**
 * The two caches are made here, once, and nowhere else: everything below only writes to a cache
 * that is still there. So once they are deleted (saving turned off, or data deleted), nothing is
 * kept again, even by a worker that the browser restarts before the page closes.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([caches.open(PAGES).then((cache) => cache.add(OFFLINE)), caches.open(FILES)]).then(() => self.skipWaiting()),
  );
});

/** The cache, if it has not been deleted. */
async function existing(name) {
  return !stopped && (await caches.has(name)) ? caches.open(name) : null;
}

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const sameOrigin = (url) => url.origin === self.location.origin;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Public pages only: never search words, never the API. */
function mayKeepPage(url) {
  return sameOrigin(url) && !url.searchParams.has("q") && !url.pathname.startsWith("/api/") && url.pathname !== OFFLINE;
}

function isBuildFile(url) {
  return sameOrigin(url) && url.pathname.startsWith("/_next/static/");
}

function isPublicFile(url) {
  return sameOrigin(url) && /\.(?:png|svg|ico|webmanifest)$/.test(url.pathname);
}

/** Drops the oldest copies past the limit. Cache keys come back oldest first. */
async function trim(name, max) {
  const cache = await existing(name);
  if (!cache) return;
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

function pageKey(url) {
  return url.origin + url.pathname + url.search;
}

async function keepPage(url, response) {
  if (stopped || !response.ok || response.redirected || response.type !== "basic") return;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return;
  const cache = await existing(PAGES);
  if (!cache) return;
  await cache.put(pageKey(url), response);
  await trim(PAGES, MAX_PAGES);
}

/** Looks without opening the cache, since opening one creates it. */
function keptPage(url) {
  return caches.match(pageKey(url), { cacheName: PAGES, ignoreVary: true });
}

async function keepFile(request, response) {
  if (stopped || !response.ok || response.type !== "basic") return;
  const cache = await existing(FILES);
  if (!cache) return;
  await cache.put(request, response);
  await trim(FILES, MAX_FILES);
}

function openPage(event) {
  const url = new URL(event.request.url);
  let keeping = Promise.resolve();
  let answered = false;
  const network = fetch(event.request).then((response) => {
    answered = true;
    if (mayKeepPage(url)) keeping = keepPage(url, response.clone());
    return response;
  });
  event.waitUntil(network.then(() => keeping, () => undefined));

  return (async () => {
    try {
      // A weak connection: show the kept copy rather than a blank screen, if there is one.
      const slow = wait(PATIENCE_MS).then(async () => (answered ? network : (await keptPage(url)) || network));
      return await Promise.race([network, slow]);
    } catch {
      return (await keptPage(url)) || (await caches.match(OFFLINE, { cacheName: PAGES, ignoreVary: true })) || Response.error();
    }
  })();
}

async function openBuildFile(event) {
  const kept = await caches.match(event.request, { cacheName: FILES, ignoreVary: true });
  if (kept) return kept;
  const response = await fetch(event.request);
  event.waitUntil(keepFile(event.request, response.clone()));
  return response;
}

async function openPublicFile(event) {
  const kept = await caches.match(event.request, { cacheName: FILES, ignoreVary: true });
  const network = fetch(event.request).then((response) => {
    event.waitUntil(keepFile(event.request, response.clone()));
    return response;
  });
  if (kept) {
    network.catch(() => undefined);
    return kept;
  }
  return network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (stopped || request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.mode === "navigate") {
    if (sameOrigin(url)) event.respondWith(openPage(event));
    return;
  }
  // The app's page data changes with every build and request, so it is left to the network.
  if (request.headers.has("RSC") || url.searchParams.has("_rsc")) return;
  if (isBuildFile(url)) event.respondWith(openBuildFile(event));
  else if (isPublicFile(url)) event.respondWith(openPublicFile(event));
});

/** Pages opened inside the app, and the files the first page loaded, sent from src/components/site/offline.tsx. */
async function keepAddress(address) {
  const url = new URL(address, self.location.origin);
  if (!mayKeepPage(url)) return;
  const kept = await keptPage(url);
  const age = kept ? Date.now() - new Date(kept.headers.get("date") || 0).getTime() : Infinity;
  if (age < FRESH_MS) return;
  const response = await fetch(url, { credentials: "same-origin", priority: "low" });
  await keepPage(url, response);
}

async function keepBuildFile(address) {
  const url = new URL(address, self.location.origin);
  if (!isBuildFile(url)) return;
  if (await caches.match(url.href, { cacheName: FILES, ignoreVary: true })) return;
  // Usually comes straight from the browser's own cache, as the page has just loaded it.
  const response = await fetch(url, { priority: "low" });
  await keepFile(url.href, response);
}

self.addEventListener("message", (event) => {
  if (event.origin && event.origin !== self.location.origin) return;
  const data = event.data || {};
  if (data.type === "stop") {
    stopped = true;
    // Twice: a copy that was already on its way when the message came lands in between.
    event.waitUntil(forgetAll().then(() => wait(3000)).then(forgetAll));
    return;
  }
  if (stopped || data.type !== "keep") return;
  const pages = Array.isArray(data.pages) ? data.pages.slice(0, 5) : [];
  const files = Array.isArray(data.files) ? data.files.slice(0, 200) : [];
  event.waitUntil(Promise.allSettled([...pages.map(keepAddress), ...files.map(keepBuildFile)]));
});
