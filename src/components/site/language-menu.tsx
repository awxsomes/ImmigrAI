"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { GlobeIcon } from "@/components/icons";
import { Disclosure } from "./disclosure";

const NAMES: Array<[string, string]> = [
  ["en", "English"],
  ["es", "Español"],
  ["zh", "中文"],
  ["vi", "Tiếng Việt"],
];

/** The page in view, without its language: "/en/bundles" becomes "/bundles". */
function withoutLanguage(pathname: string) {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
}

function Languages({ lang, rest, moreLabel }: { lang: string; rest: string; moreLabel: string }) {
  return (
    <ul>
      {NAMES.map(([code, name]) => (
        <li key={code} lang={code}>
          <a
            href={`/${code}${rest}`}
            aria-current={code === lang ? "true" : undefined}
            onClick={(event) => {
              // Keep the current page and search when switching language.
              event.currentTarget.href = `/${code}${withoutLanguage(window.location.pathname)}${window.location.search}`;
            }}
            className={`block px-3 py-3 no-underline hover:bg-blue-tint ${code === lang ? "font-semibold" : ""}`}
          >
            {name}
          </a>
        </li>
      ))}
      <li className="border-t border-line">
        <Link href={`/${lang}/my-tools#language`} className="block px-3 py-3 font-medium underline underline-offset-2 hover:bg-blue-tint">
          {moreLabel}
        </Link>
      </li>
    </ul>
  );
}

function LiveLanguages({ lang, moreLabel }: { lang: string; moreLabel: string }) {
  return <Languages lang={lang} rest={withoutLanguage(usePathname())} moreLabel={moreLabel} />;
}

/** Languages are listed in their own script, so anyone can find theirs. */
export function LanguageMenu({ lang, label, moreLabel }: { lang: string; label: string; moreLabel: string }) {
  const current = NAMES.find(([code]) => code === lang)?.[1] ?? "English";
  return (
    <Disclosure
      rootClassName="relative"
      label={
        <>
          <GlobeIcon className="size-5 shrink-0" />
          <span className="sr-only">{label}: </span>
          {current}
        </>
      }
      panelClassName="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-line-strong bg-surface shadow-lg"
    >
      {/*
        The page address is only known in the browser on a page for a tool found by live search.
        Until then the links lead to each language's home page; a tap still keeps the page.
      */}
      <Suspense fallback={<Languages lang={lang} rest="" moreLabel={moreLabel} />}>
        <LiveLanguages lang={lang} moreLabel={moreLabel} />
      </Suspense>
    </Disclosure>
  );
}
