"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ComponentType, type MouseEvent } from "react";
import { CheckupIcon, HomeIcon, KitsIcon, SavedIcon, SearchIcon } from "@/components/icons";
import { useUserData } from "@/lib/storage";

type TabId = "home" | "search" | "kits" | "checkup" | "saved";

export interface TabBarLabels {
  nav: string;
  home: string;
  search: string;
  kits: string;
  checkup: string;
  saved: string;
}

const TABS: Array<{ id: TabId; path: string; Icon: ComponentType<{ className?: string; filled?: boolean }> }> = [
  { id: "home", path: "", Icon: HomeIcon },
  { id: "search", path: "/search", Icon: SearchIcon },
  { id: "kits", path: "/bundles", Icon: KitsIcon },
  { id: "checkup", path: "/checkup", Icon: CheckupIcon },
  { id: "saved", path: "/my-tools", Icon: SavedIcon },
];

/** The tab a page belongs to. A tool's page and Compare are reached from search, so they sit under it. */
function tabFor(pathname: string, lang: string): TabId | null {
  const [first] = pathname.slice(lang.length + 1).split("/").filter(Boolean);
  if (!first) return "home";
  if (first === "search" || first === "tools" || first === "compare") return "search";
  if (first === "bundles") return "kits";
  if (first === "checkup") return "checkup";
  if (first === "my-tools") return "saved";
  return null;
}

function Bar({ lang, t, active, onTap }: { lang: string; t: TabBarLabels; active: TabId | null; onTap?: (id: TabId, event: MouseEvent<HTMLAnchorElement>) => void }) {
  const { data, ready } = useUserData();
  const saved = ready ? Object.keys(data.savedTools).length : 0;
  return (
    <nav aria-label={t.nav} data-tab-bar="" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-safe shadow-[0_-1px_8px_rgb(17_24_39/0.04)] md:hidden">
      <ul className="mx-auto grid h-(--tab-bar) max-w-lg grid-cols-5">
        {TABS.map(({ id, path, Icon }) => {
          const current = id === active;
          return (
            <li key={id} className="min-w-0">
              <Link
                href={`/${lang}${path}`}
                aria-current={current ? "page" : undefined}
                onClick={(event) => onTap?.(id, event)}
                className={`tap flex h-full flex-col items-center justify-center gap-0.5 px-0.5 text-[0.68rem] leading-tight no-underline select-none [--tap-scale:0.88] [-webkit-touch-callout:none] ${current ? "font-bold text-blue" : "font-medium text-muted-ink"}`}
              >
                <span className="relative">
                  <Icon className="size-6.5" filled={current} />
                  {id === "saved" && saved > 0 && (
                    <span aria-hidden="true" className="absolute -top-1 -right-2.5 min-w-4.5 animate-rise rounded-full bg-brick px-1 text-center text-[0.62rem] leading-4.5 font-bold text-white">
                      {saved > 99 ? "99+" : saved}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{t[id]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Follows the page address. A tapped tab lights up at once, before its page arrives, so the bar
 * never waits on the network. Tapping the open tab again goes back to the top of it, as in a
 * phone's own apps.
 */
function LiveBar({ lang, t }: { lang: string; t: TabBarLabels }) {
  const pathname = usePathname();
  const [tapped, setTapped] = useState<{ id: TabId; from: string } | null>(null);
  // A tap only counts until the page changes, so the bar can never get stuck on the wrong tab.
  const active = tapped && tapped.from === pathname ? tapped.id : tabFor(pathname, lang);

  function onTap(id: TabId, event: MouseEvent<HTMLAnchorElement>) {
    const target = `/${lang}${TABS.find((tab) => tab.id === id)?.path ?? ""}`;
    if (pathname === target && !window.location.search) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      return;
    }
    setTapped({ id, from: pathname });
  }

  return <Bar lang={lang} t={t} active={active} onTap={onTap} />;
}

/**
 * The row of tabs along the bottom of a phone screen, like a native app. Wider screens have
 * the same places in the header instead. The address is not known while a tool found by live
 * search is prerendered, so that page starts with no tab lit until the browser takes over.
 */
export function TabBar({ lang, t }: { lang: string; t: TabBarLabels }) {
  return (
    <Suspense fallback={<Bar lang={lang} t={t} active={null} />}>
      <LiveBar lang={lang} t={t} />
    </Suspense>
  );
}
