import Link from "next/link";
import { ShopMark } from "@/components/icons";
import { SmartSearch } from "@/components/search/smart-search";
import { searchHref } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { pick, SEARCH_KEYS } from "@/lib/labels";
import { localTaxonomy } from "@/lib/localize";
import { Disclosure } from "./disclosure";
import { LanguageMenu } from "./language-menu";

export function Header({ lang, t }: { lang: string; t: Dict }) {
  const taxonomy = localTaxonomy(lang);
  const links = [
    { href: `/${lang}/bundles`, label: t.nav_bundles },
    { href: `/${lang}/my-tools`, label: t.nav_myTools },
    { href: `/${lang}/free-help`, label: t.nav_freeHelp },
  ];
  return (
    <header className="relative border-b-2 border-ink bg-paper">
      <div className="awning" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href={`/${lang}`} className="mr-auto flex min-h-12 items-center gap-2 text-2xl font-bold no-underline lg:mr-2">
          <ShopMark className="size-9" />
          {t.brand}
        </Link>

        <div className="order-3 w-full sm:order-none sm:w-auto">
          <Disclosure label={t.nav_browse} panelClassName="absolute inset-x-0 z-40 mt-3 border-y-2 border-ink bg-surface" summaryClassName="justify-between sm:justify-start">
            <div className="mx-auto max-h-[80vh] max-w-6xl overflow-y-auto px-4 py-5">
              <SmartSearch lang={lang} t={pick(t, SEARCH_KEYS)} size="sm" showPrivacy={false} landmarkLabel={t.nav_browse} />
              <ul className="mt-5 gap-8 sm:columns-2 lg:columns-3">
                {taxonomy.map((category) => (
                  <li key={category.id} className="mb-5 break-inside-avoid">
                    <Link href={searchHref(lang, category.id)} prefetch={false} className="font-semibold underline-offset-2 hover:underline">
                      {category.name}
                    </Link>
                    <ul className="nested-bullets mt-1">
                      {category.subs.map((sub) => (
                        <li key={sub.id}>
                          <Link href={searchHref(lang, category.id, sub.id)} prefetch={false} className="inline-block py-1 underline-offset-2 hover:underline">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <ul className="mt-2 border-t-2 border-line pt-3 sm:hidden">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false} className="inline-flex min-h-12 items-center font-medium underline underline-offset-2">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Disclosure>
        </div>

        <nav aria-label={t.nav_main} className="hidden flex-wrap gap-x-1 sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} prefetch={false} className="inline-flex min-h-12 items-center rounded-lg px-3 font-medium underline-offset-4 hover:bg-green-tint hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sm:ml-auto">
          <LanguageMenu lang={lang} label={t.nav_language} moreLabel={t.nav_moreLanguages} />
        </div>
      </div>
    </header>
  );
}
