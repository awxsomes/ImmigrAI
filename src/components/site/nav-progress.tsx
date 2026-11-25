"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/** Most taps open their page at once. Only a slower one shows the bar, so it never flickers. */
const SHOW_AFTER_MS = 120;
/** Gives up after this long, so the bar can never get stuck. */
const GIVE_UP_MS = 15000;

function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const waiting = useRef(false);

  function clear() {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }

  // The new page has arrived: fill the bar and fade it out.
  useEffect(() => {
    if (!waiting.current) return;
    waiting.current = false;
    clear();
    setState((current) => (current === "busy" ? "done" : "idle"));
    timers.current.push(setTimeout(() => setState("idle"), 400));
  }, [pathname, search]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download") || link.dataset.noProgress !== undefined) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      clear();
      waiting.current = true;
      timers.current.push(
        setTimeout(() => setState("busy"), SHOW_AFTER_MS),
        setTimeout(() => {
          waiting.current = false;
          setState("idle");
        }, GIVE_UP_MS),
      );
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clear();
    };
  }, []);

  if (state === "idle") return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div className={`h-full origin-left bg-blue ${state === "busy" ? "animate-progress" : "opacity-0 transition-opacity duration-300"}`} />
    </div>
  );
}

/**
 * A thin bar across the top of the screen from the moment a link is tapped until its page
 * arrives, like a phone browser's own. It shows that the tap worked even when the connection
 * is slow. Pages with a loading screen usually appear before the bar is needed.
 */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
