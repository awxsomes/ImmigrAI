"use client";

import { useOffline } from "next/offline";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { keptPages, lowData, removeOfflineCopies } from "@/lib/offline";
import { useUserData } from "@/lib/storage";

/** The build files the page in view has loaded, so they can be kept with it. */
function loadedFiles() {
  return performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => name.startsWith(`${location.origin}/_next/static/`));
}

/**
 * Asks the service worker to keep a copy of each page as it is opened. Pages opened inside the
 * app never pass through the worker as a whole page, so without this only the first page would
 * work offline. Skipped on a data saver or a very slow connection.
 */
function KeepPages() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!("serviceWorker" in navigator) || lowData()) return;
    const address = pathname + (search.size > 0 ? `?${search}` : "");
    let cancelled = false;
    void navigator.serviceWorker.ready.then((registration) => {
      if (!cancelled) registration.active?.postMessage({ type: "keep", pages: [address], files: loadedFiles() });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, search]);
  return null;
}

/**
 * Everything that helps when the connection drops:
 * - A banner while offline. Next.js holds any page that was asked for and loads it once the
 *   phone is back online (experimental.useOffline in next.config.ts).
 * - For visitors who said yes to saving on this device, a service worker (public/sw.js) that
 *   keeps the pages they open, so those still open offline. Saying no, or deleting your data,
 *   removes it and every copy. Nothing is written to the device before someone says yes.
 * - While offline, a tap on a kept page opens the copy at once instead of waiting.
 */
export function OfflineSupport({ banner }: { banner: string }) {
  const offline = useOffline();
  const { consent, ready } = useUserData();
  const keeping = ready && consent === "yes" && process.env.NODE_ENV === "production";

  useEffect(() => {
    if (!ready || !("serviceWorker" in navigator)) return;
    // In development a worker would serve old copies of pages being edited, so there is never one.
    if (consent === "no" || process.env.NODE_ENV !== "production") {
      void removeOfflineCopies();
      return;
    }
    if (consent === "yes") navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, [ready, consent]);

  useEffect(() => {
    if (!offline || !keeping) return;
    let kept = new Set<string>();
    let cancelled = false;
    void keptPages().then((pages) => {
      if (!cancelled) kept = pages;
    });
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      const address = url.pathname + url.search;
      if (url.origin !== location.origin || address === location.pathname + location.search || !kept.has(address)) return;
      // Runs before the app's own link handling, which would wait for the server.
      event.preventDefault();
      event.stopPropagation();
      location.assign(url.href);
    }
    window.addEventListener("click", onClick, true);
    return () => {
      cancelled = true;
      window.removeEventListener("click", onClick, true);
    };
  }, [offline, keeping]);

  return (
    <>
      {/* Always on the page and empty while online, so screen readers announce it when the connection drops. */}
      <div role="status" className={offline ? "sticky top-0 z-50 bg-ink px-4 py-2 text-center text-sm font-medium text-white" : undefined}>
        {offline ? banner : null}
      </div>
      {keeping && (
        <Suspense fallback={null}>
          <KeepPages />
        </Suspense>
      )}
    </>
  );
}
