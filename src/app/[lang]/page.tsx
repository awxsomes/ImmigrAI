import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon, CheckIcon, ChevronIcon, ChevronRightIcon, SearchIcon } from "@/components/icons";
import { CheckupForm } from "@/components/checkup/checkup-form";
import { BUSINESS_QUESTION_KEYS, CHECKUP_FORM_KEYS } from "@/components/checkup/labels";
import { SmartSearch } from "@/components/search/smart-search";
import { BusinessQuestion } from "@/components/site/business-question";
import { HeroArt } from "@/components/site/kit-art";
import { KitCard, NewToolsCard } from "@/components/tools/kit-card";
import { ToolCard } from "@/components/tools/tool-card";
import { ScoreMeters } from "@/components/tools/tool-detail";
import { buttonVariants } from "@/components/ui/button";
import { BUNDLE_BY_SLUG } from "@/data/bundles";
import { seedToolsFor } from "@/data/seed-tools";
import { findSubcategory } from "@/data/taxonomy";
import { searchHref } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { CARD_KEYS, fmt, pick, SEARCH_KEYS } from "@/lib/labels";
import { localizeBundle, localizeTool, localTaxonomy, nameOf } from "@/lib/localize";
import { sortTools } from "@/lib/scoring";

/** Six common needs, in an owner's words. Every other need is one tap away above them. */
const TASKS = [
  { key: "task_calls", cat: "calls", sub: "phone-ai" },
  { key: "task_schedules", cat: "employees", sub: "scheduling" },
  { key: "task_books", cat: "money", sub: "bookkeeping" },
  { key: "task_social", cat: "customers", sub: "social" },
  { key: "task_reviews", cat: "customers", sub: "reviews" },
  { key: "task_translate", cat: "translate", sub: "translators" },
] as const;

/** The order of the row of areas under the search box: the most asked-for first. */
const AREA_ORDER = ["calls", "customers", "money", "payments", "inventory", "employees", "translate", "legal", "safety", "learn"];

/** The example on the home page is a real search: its top result is worked out from the same data at build time. */
const EXAMPLE = { cat: "employees", sub: "scheduling" } as const;

/** Every section opens the same way: a heading and one line, with an optional link on the right. */
function SectionHead({ id, title, sub, action }: { id: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-3xl font-extrabold">
          {title}
        </h2>
        {sub && <p className="mt-1 max-w-3xl text-lg text-muted-ink">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(lang);
  const taxonomy = localTaxonomy(lang);
  const areas = AREA_ORDER.flatMap((id) => taxonomy.filter((category) => category.id === id));
  const tasks = TASKS.map((task) => ({
    ...task,
    label: t[task.key],
    count: seedToolsFor(task.cat, task.sub).filter((tool) => tool.ai.level !== "none").length,
  }));
  const exampleTools = sortTools(seedToolsFor(EXAMPLE.cat, EXAMPLE.sub), "overall");
  const top = exampleTools[0] ? localizeTool(exampleTools[0], lang) : undefined;
  const exampleName = nameOf(lang, EXAMPLE.sub, findSubcategory(EXAMPLE.cat, EXAMPLE.sub)?.name ?? EXAMPLE.sub);
  const kit = (slug: string) => localizeBundle(BUNDLE_BY_SLUG.get(slug)!, lang);
  const outline = buttonVariants({ variant: "outline" });

  return (
    <>
      <section className="bg-blue-tint">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-10 sm:pt-14 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.06]">{t.hero_title}</h1>
            {/* Left out on phones, so the search box and the question both fit above the cookie banner. */}
            <p className="mt-4 hidden max-w-2xl text-xl text-muted-ink sm:block">{t.hero_lead}</p>
            <div className="mt-4 max-w-2xl sm:mt-7">
              <SmartSearch lang={lang} t={pick(t, SEARCH_KEYS)} examples={[t.search_example1, t.search_example2, t.search_example3, t.search_example4]} />
            </div>
            <div className="mt-5 max-w-2xl">
              <BusinessQuestion t={pick(t, BUSINESS_QUESTION_KEYS)} />
            </div>
            <p className="mt-4 flex items-center gap-2 font-semibold">
              <CheckIcon className="size-5 shrink-0 text-blue" />
              {t.hero_note}
            </p>
          </div>
          <HeroArt className="hidden h-auto w-full lg:block" />
        </div>
      </section>

      <nav aria-label={t.nav_browse} className="border-b border-line">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-6 sm:grid-cols-5">
          {areas.map((area) => (
            <li key={area.id}>
              <Link
                href={searchHref(lang, area.id)}
               
                className="flex h-full min-h-14 items-center justify-center rounded-lg border border-line px-3 py-2 text-center text-[0.95rem] leading-snug font-semibold no-underline tap hover:border-blue hover:bg-blue-tint"
              >
                {area.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="board-title" className="mx-auto max-w-6xl px-4 pt-14 pb-6">
        <SectionHead id="board-title" title={t.home_boardTitle} sub={t.home_boardSub} />
        <ul className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(({ key, cat, sub, label, count }) => (
            <li key={key}>
              <Link
                href={searchHref(lang, cat, sub)}
               
                className="flex h-full min-h-20 items-center gap-4 rounded-lg border border-line px-5 py-3 no-underline tap [--tap-scale:0.98] hover:border-blue"
              >
                <span className="flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-sm text-muted-ink">{fmt(t.home_taskCount, { n: count })}</span>
                </span>
                <ChevronRightIcon className="size-5 shrink-0 text-muted-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="checkup-title" className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 rounded-lg bg-amber-tint p-6 sm:p-8 md:grid-cols-[2fr_3fr] md:gap-10">
          <div>
            <h2 id="checkup-title" className="text-2xl font-extrabold">
              {t.checkup_homeTitle}
            </h2>
            <p className="mt-2 text-muted-ink">{t.checkup_homeD}</p>
          </div>
          <CheckupForm lang={lang} t={pick(t, CHECKUP_FORM_KEYS)} idPrefix="home-checkup" />
        </div>
      </section>

      <section aria-labelledby="kits-title" className="mx-auto max-w-6xl px-4 pt-10 pb-16">
        <SectionHead
          id="kits-title"
          title={t.home_bundlesTitle}
          sub={t.kit_sub}
          action={
            <Link href={`/${lang}/bundles`} className={outline}>
              {t.home_bundlesAll}
            </Link>
          }
        />
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          <li>
            <KitCard kit={kit("startup-essentials")} lang={lang} t={t} />
          </li>
          <li>
            <KitCard kit={kit("restaurant-picks")} lang={lang} t={t} />
          </li>
          <li>
            <NewToolsCard lang={lang} t={t} />
          </li>
        </ul>
      </section>

      {top && (
        <section aria-labelledby="example-title" className="bg-blue-tint">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <SectionHead
              id="example-title"
              title={t.home_exampleTitle}
              action={
                <Link href={searchHref(lang, EXAMPLE.cat, EXAMPLE.sub)} className={`${outline} max-w-full`}>
                  {fmt(t.home_exampleAll, { n: exampleTools.length, name: exampleName })}
                  <ArrowIcon className="size-4" />
                </Link>
              }
            />
            <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-2 text-lg">
              <SearchIcon className="size-5 shrink-0" />
              <span className="sr-only">{t.home_exampleAsked}: </span>
              {t.home_exampleQuery}
            </p>
            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
              <div>
                <p className="mb-2 font-semibold text-muted-ink">{fmt(t.home_exampleTop, { n: exampleTools.length })}</p>
                <ToolCard tool={top} lang={lang} t={pick(t, CARD_KEYS)} />
              </div>
              <div className="rounded-lg border border-line bg-surface p-6 lg:mt-9">
                <h3 className="text-xl font-bold">{fmt(t.home_exampleWhy, { name: top.name })}</h3>
                <div className="mt-4">
                  <ScoreMeters tool={top} t={t} />
                </div>
                <Link href={`/${lang}/methodology`} className="mt-4 inline-flex min-h-12 items-center gap-2 font-semibold underline underline-offset-4">
                  {t.home_scoreLink}
                  <ArrowIcon className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-14 md:grid-cols-2">
        {[
          { title: t.home_subsTitle, text: t.home_subsD, cta: t.home_subsCta, href: `/${lang}/my-tools#subscriptions` },
          { title: t.home_helpTitle, text: t.home_helpD, cta: t.home_helpCta, href: `/${lang}/free-help` },
        ].map(({ title, text, cta, href }) => (
          <div key={href} className="rounded-lg border border-line p-6">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-muted-ink">{text}</p>
              <Link href={href} className={`${outline} mt-4`}>
                {cta}
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 pb-4">
        <h2 id="faq-title" className="text-3xl font-extrabold">
          {t.home_faqTitle}
        </h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {[
            [t.faq1_q, t.faq1_a],
            [t.faq2_q, t.faq2_a],
            [t.faq3_q, t.faq3_a],
            [t.faq4_q, t.faq4_a],
            [t.faq6_q, t.faq6_a],
            [t.faq5_q, t.faq5_a],
          ].map(([question, answer]) => (
            <details key={question} className="group">
              <summary className="flex min-h-14 items-center justify-between gap-3 py-3 text-lg font-semibold">
                {question}
                <ChevronIcon className="size-5 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-muted-ink">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
