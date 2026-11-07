"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disclosure } from "./disclosure";

const NAMES: Array<[string, string]> = [
  ["en", "English"],
  ["es", "Español"],
  ["zh", "中文"],
  ["vi", "Tiếng Việt"],
];

/** Languages are listed in their own script, so anyone can find theirs. */
export function LanguageMenu({ lang, label, moreLabel }: { lang: string; label: string; moreLabel: string }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const current = NAMES.find(([code]) => code === lang)?.[1] ?? "English";

  return (
    <Disclosure
      rootClassName="relative"
      label={
        <>
          <span className="sr-only">{label}: </span>
          {current}
        </>
      }
      panelClassName="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border-2 border-ink bg-surface"
    >
      <ul>
        {NAMES.map(([code, name]) => (
          <li key={code} lang={code}>
            <a
              href={`/${code}${rest}`}
              aria-current={code === lang ? "true" : undefined}
              onClick={(event) => {
                // Keep the current search when switching language.
                event.currentTarget.href = `/${code}${rest}${window.location.search}`;
              }}
              className={`block px-3 py-3 no-underline hover:bg-green-tint ${code === lang ? "font-semibold" : ""}`}
            >
              {name}
            </a>
          </li>
        ))}
        <li className="border-t-2 border-line">
          <Link href={`/${lang}/my-tools#language`} prefetch={false} className="block px-3 py-3 font-medium underline underline-offset-2 hover:bg-green-tint">
            {moreLabel}
          </Link>
        </li>
      </ul>
    </Disclosure>
  );
}
