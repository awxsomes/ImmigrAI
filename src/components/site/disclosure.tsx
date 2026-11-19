"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { ChevronIcon } from "@/components/icons";

/**
 * A dropdown built on the browser's own <details>, so it opens before any JavaScript
 * has loaded on a slow connection and works with a keyboard. Once loaded, this adds
 * the expected extras: close on Escape, on an outside click, and after choosing a link.
 */
const SUMMARY = {
  button: "rounded-lg border border-line-strong bg-surface px-3 font-semibold transition-colors hover:bg-blue-tint",
  /** A tab in the header's row of areas: underlined while open, like the page it leads to. */
  tab: "border-b-[3px] border-transparent font-semibold hover:text-blue-dark group-open:border-blue",
};

export function Disclosure({
  label,
  panelClassName,
  rootClassName,
  summaryClassName,
  variant = "button",
  children,
}: {
  label: ReactNode;
  panelClassName: string;
  rootClassName?: string;
  summaryClassName?: string;
  variant?: keyof typeof SUMMARY;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // Close after moving to a new page, but not on first load: on a slow connection someone
  // may already have opened this menu before the JavaScript arrived.
  const shownFor = useRef(pathname);
  useEffect(() => {
    if (shownFor.current !== pathname && ref.current) ref.current.open = false;
    shownFor.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (ref.current?.open && !ref.current.contains(event.target as Node)) ref.current.open = false;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className={`group ${rootClassName ?? ""}`}>
      <summary
        className={`flex min-h-12 list-none items-center gap-2 ${SUMMARY[variant]} ${summaryClassName ?? ""}`}
      >
        {label}
        <ChevronIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div
        className={panelClassName}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a") && ref.current) ref.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
