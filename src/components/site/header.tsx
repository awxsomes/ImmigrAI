import Link from "next/link";
import { ShopMark } from "@/components/icons";
import { SmartSearch } from "@/components/search/smart-search";
import { searchHref } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { pick, SEARCH_KEYS } from "@/lib/labels";
import { localTaxonomy } from "@/lib/localize";
import { Disclosure } from "./disclosure";
import { LanguageMenu } from "./language-menu";

/** The areas shown as tabs beside "Browse by need" on wider screens. Every area is in the menu. */
const TAB_AREAS = ["calls", "customers", "money", "employees", "payments"];

export function Header({ lang, t }: { lang: string; t: Dict }) {
  const taxonomy = localTaxonomy(lang);
  const tabs = TAB_AREAS.flatMap((id) => taxonomy.filter((category) => category.id === id));
  const links = [
    { href: `/${lang}/bundles`, label: t.nav_bundles },
    { href: `/${lang}/my-tools`, label: t.nav_myTools },
    { href: `/${lang}/free-help`, label: t.nav_freeHelp },
  ];
  return (
    <header className="relative border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-x-3 px-4 pt-3 sm:gap-x-4">
        {/* A little smaller on phones, so the logo and the language button share one row in every language. */}
        <Link href={`/${lang}`} className="mr-auto flex min-h-12 items-center gap-2 text-xl font-extrabold tracking-tight no-underline sm:text-2xl">
          <ShopMark className="size-8 sm:size-9" />
          {t.brand}
        </Link>

        <nav aria-label={t.nav_main} className="hidden flex-wrap gap-x-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-12 items-center rounded-lg px-3 font-semibold underline-offset-4 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>

        <LanguageMenu lang={lang} label={t.nav_language} moreLabel={t.nav_moreLanguages} />
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 text-[0.95rem]">
        <Disclosure variant="tab" label={t.nav_browse} panelClassName="absolute inset-x-0 top-full z-40 border-y border-line bg-surface shadow-lg">
          <div className="mx-auto max-h-[80vh] max-w-6xl overflow-y-auto px-4 py-6">
            <SmartSearch lang={lang} t={pick(t, SEARCH_KEYS)} size="sm" showPrivacy={false} landmarkLabel={t.nav_browse} />
            <ul className="mt-6 gap-8 sm:columns-2 lg:columns-3">
              {taxonomy.map((category) => (
                <li key={category.id} className="mb-5 break-inside-avoid">
                  <Link href={searchHref(lang, category.id)} className="font-bold underline-offset-2 hover:underline">
                    {category.name}
                  </Link>
                  <ul className="mt-1">
                    {category.subs.map((sub) => (
                      <li key={sub.id}>
                        <Link href={searchHref(lang, category.id, sub.id)} className="inline-block py-1 text-muted-ink underline-offset-2 hover:text-ink hover:underline">
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <ul className="mt-2 border-t border-line pt-3 md:hidden">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-12 items-center font-semibold underline underline-offset-2">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Disclosure>
        {/* Area names are long in every language, so wider screens show more of them and none ever wraps. */}
        {tabs.map((category, index) => (
          <Link
            key={category.id}
            href={searchHref(lang, category.id)}
           
            className={`hidden min-h-12 items-center border-b-[3px] border-transparent font-medium whitespace-nowrap no-underline hover:border-line-strong ${index < 3 ? "lg:inline-flex" : "xl:inline-flex"}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </header>
  );
}
