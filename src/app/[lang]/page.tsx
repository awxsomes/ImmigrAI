import Link from "next/link";
import { ArrowIcon, CheckIcon, SearchIcon } from "@/components/icons";
import { CheckupForm } from "@/components/checkup/checkup-form";
import { BUSINESS_QUESTION_KEYS, CHECKUP_FORM_KEYS } from "@/components/checkup/labels";
import { SmartSearch } from "@/components/search/smart-search";
import { BusinessQuestion } from "@/components/site/business-question";
import { KitchenArt, SeedlingArt, StorefrontArt } from "@/components/site/kit-art";
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

/** Six common needs, in an owner's words. Every other need is one tap away under them. */
const TASKS = [
  { key: "task_calls", cat: "calls", sub: "phone-ai" },
  { key: "task_schedules", cat: "employees", sub: "scheduling" },
  { key: "task_books", cat: "money", sub: "bookkeeping" },
  { key: "task_social", cat: "customers", sub: "social" },
  { key: "task_reviews", cat: "customers", sub: "reviews" },
  { key: "task_translate", cat: "translate", sub: "translators" },
] as const;

/** The example on the home page is a real search: its top result is worked out from the same data at build time. */
const EXAMPLE = { cat: "employees", sub: "scheduling" } as const;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(lang);
  const taxonomy = localTaxonomy(lang);
  const tasks = TASKS.map((task) => ({
    ...task,
    label: t[task.key],
    count: seedToolsFor(task.cat, task.sub).filter((tool) => tool.ai.level !== "none").length,
  }));
  const exampleTools = sortTools(seedToolsFor(EXAMPLE.cat, EXAMPLE.sub), "overall");
  const top = exampleTools[0] ? localizeTool(exampleTools[0], lang) : undefined;
  const exampleName = nameOf(lang, EXAMPLE.sub, findSubcategory(EXAMPLE.cat, EXAMPLE.sub)?.name ?? EXAMPLE.sub);
  const kit = (slug: string) => localizeBundle(BUNDLE_BY_SLUG.get(slug)!, lang);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:pt-14">
        <h1 className="max-w-4xl text-3xl font-bold sm:text-6xl">{t.hero_title}</h1>
        {/* Left out on phones, so the question and the search box both fit above the cookie banner. */}
        <p className="mt-4 hidden max-w-3xl text-xl sm:block">{t.hero_lead}</p>
        <div className="mt-3 sm:mt-6">
          <BusinessQuestion t={pick(t, BUSINESS_QUESTION_KEYS)} />
        </div>
        <div className="mt-1 sm:mt-3">
          <SmartSearch lang={lang} t={pick(t, SEARCH_KEYS)} examples={[t.search_example1, t.search_example2, t.search_example3, t.search_example4]} />
        </div>
        <p className="mt-4 flex items-center gap-2 font-medium">
          <CheckIcon className="size-5 shrink-0 text-green" />
          {t.hero_note}
        </p>
      </section>

      <section aria-labelledby="checkup-title" className="border-y-2 border-line bg-marigold-tint">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[2fr_3fr] md:gap-10">
          <div>
            <h2 id="checkup-title" className="text-3xl font-bold">
              {t.checkup_homeTitle}
            </h2>
            <p className="mt-2 text-lg">{t.checkup_homeD}</p>
          </div>
          <CheckupForm lang={lang} t={pick(t, CHECKUP_FORM_KEYS)} idPrefix="home-checkup" />
        </div>
      </section>

      <section aria-labelledby="board-title" className="bg-green-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="board-title" className="text-3xl font-bold">
            {t.home_boardTitle}
          </h2>
          <p className="mt-1 text-lg">{t.home_boardSub}</p>
          <ul className="mt-6 grid gap-x-12 md:grid-cols-2">
            {tasks.map((task) => (
              <li key={task.key} className="border-t border-white/30">
                <Link href={searchHref(lang, task.cat, task.sub)} prefetch={false} className="flex min-h-14 items-baseline gap-3 py-3 no-underline hover:text-marigold">
                  <span className="text-xl font-semibold">{task.label}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="shrink-0 text-sm">{fmt(t.home_taskCount, { n: task.count })}</span>
                </Link>
              </li>
            ))}
          </ul>
          <details className="group mt-6 border-t border-white/30 pt-4">
            <summary className="inline-flex min-h-12 items-center gap-2 text-lg font-semibold underline underline-offset-4 hover:text-marigold">
              {fmt(t.home_browseAll, { n: taxonomy.length })}
              <span aria-hidden="true" className="text-2xl leading-none no-underline group-open:hidden">
                +
              </span>
              <span aria-hidden="true" className="hidden text-2xl leading-none no-underline group-open:inline">
                &minus;
              </span>
            </summary>
            <ul className="mt-4 grid gap-x-12 gap-y-1 md:grid-cols-2">
              {taxonomy.map((category) => (
                <li key={category.id} className="border-t border-white/30 py-3">
                  <Link href={searchHref(lang, category.id)} prefetch={false} className="flex items-baseline gap-3 no-underline hover:text-marigold">
                    <span className="text-lg font-semibold">{category.name}</span>
                    <span className="leader" aria-hidden="true" />
                    <span className="shrink-0 text-sm">{fmt(t.home_kinds, { n: category.subs.length })}</span>
                  </Link>
                  <ul className="mt-1 flex flex-wrap gap-x-4 text-sm">
                    {category.subs.map((sub) => (
                      <li key={sub.id}>
                        <Link href={searchHref(lang, category.id, sub.id)} prefetch={false} className="inline-block py-1 underline underline-offset-2 hover:text-marigold">
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      {top && (
        <section aria-labelledby="example-title" className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="example-title" className="text-3xl font-bold">
            {t.home_exampleTitle}
          </h2>
          <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border-2 border-line-strong bg-surface px-4 py-2 text-lg">
            <SearchIcon className="size-5 shrink-0" />
            <span className="sr-only">{t.home_exampleAsked}: </span>
            {t.home_exampleQuery}
          </p>
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
            <div>
              <p className="mb-2 font-semibold">{fmt(t.home_exampleTop, { n: exampleTools.length })}</p>
              <ToolCard tool={top} lang={lang} t={pick(t, CARD_KEYS)} />
            </div>
            <div className="rounded-xl bg-green-tint p-5 lg:mt-9">
              <h3 className="text-xl font-semibold">{fmt(t.home_exampleWhy, { name: top.name })}</h3>
              <div className="mt-4">
                <ScoreMeters tool={top} t={t} />
              </div>
              <Link href={`/${lang}/methodology`} prefetch={false} className="mt-4 inline-flex min-h-12 items-center gap-2 font-medium underline underline-offset-4">
                {t.home_scoreLink}
                <ArrowIcon className="size-4" />
              </Link>
            </div>
          </div>
          <Link
            href={searchHref(lang, EXAMPLE.cat, EXAMPLE.sub)}
            prefetch={false}
            className={`${buttonVariants({ variant: "outline" })} mt-6`}
          >
            {fmt(t.home_exampleAll, { n: exampleTools.length, name: exampleName })}
            <ArrowIcon className="size-4" />
          </Link>
        </section>
      )}

      <section aria-labelledby="kits-title" className="border-y-2 border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="kits-title" className="text-3xl font-bold">
                {t.home_bundlesTitle}
              </h2>
              <p className="mt-1 text-lg text-muted-ink">{t.kit_sub}</p>
            </div>
            <Link href={`/${lang}/bundles`} prefetch={false} className="inline-flex min-h-12 items-center gap-2 font-medium underline underline-offset-4">
              {t.home_bundlesAll}
              <ArrowIcon className="size-4" />
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            <li>
              <KitCard kit={kit("startup-essentials")} lang={lang} t={t} art={<StorefrontArt />} />
            </li>
            <li>
              <KitCard kit={kit("restaurant-picks")} lang={lang} t={t} art={<KitchenArt />} />
            </li>
            <li>
              <NewToolsCard lang={lang} t={t} art={<SeedlingArt />} />
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-2">
        <div className="rounded-xl bg-marigold-tint p-6">
          <h2 className="text-2xl font-bold">{t.home_subsTitle}</h2>
          <p className="mt-2">{t.home_subsD}</p>
          <Link href={`/${lang}/my-tools#subscriptions`} prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-4`}>
            {t.home_subsCta}
          </Link>
        </div>
        <div className="rounded-xl bg-green-tint p-6">
          <h2 className="text-2xl font-bold">{t.home_helpTitle}</h2>
          <p className="mt-2">{t.home_helpD}</p>
          <Link href={`/${lang}/free-help`} prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-4`}>
            {t.home_helpCta}
          </Link>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 pb-4">
        <h2 id="faq-title" className="text-3xl font-bold">
          {t.home_faqTitle}
        </h2>
        <div className="mt-4 divide-y-2 divide-line border-y-2 border-line">
          {[
            [t.faq1_q, t.faq1_a],
            [t.faq2_q, t.faq2_a],
            [t.faq3_q, t.faq3_a],
            [t.faq4_q, t.faq4_a],
            [t.faq6_q, t.faq6_a],
            [t.faq5_q, t.faq5_a],
          ].map(([question, answer]) => (
            <details key={question} className="group">
              <summary className="flex min-h-12 items-center justify-between gap-3 py-3 text-lg font-medium">
                {question}
                <span aria-hidden="true" className="text-2xl leading-none group-open:hidden">
                  +
                </span>
                <span aria-hidden="true" className="hidden text-2xl leading-none group-open:inline">
                  &minus;
                </span>
              </summary>
              <p className="pb-4">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
