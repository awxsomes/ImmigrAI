import Link from "next/link";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { SmartSearch } from "@/components/search/smart-search";
import { KitCard, NewToolsCard } from "@/components/tools/kit-card";
import { buttonVariants } from "@/components/ui/button";
import { searchHref } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { fmt, pick, SEARCH_KEYS } from "@/lib/labels";
import { localBundles, localTaxonomy } from "@/lib/localize";
import { OVERALL_WEIGHTS } from "@/lib/scoring";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(lang);
  const taxonomy = localTaxonomy(lang);
  const kits = localBundles(lang).slice(0, 5);
  const scoreRows = [
    { label: t.score_reviews, weight: OVERALL_WEIGHTS.reviews },
    { label: t.score_ease, weight: OVERALL_WEIGHTS.easeOfUse },
    { label: t.score_cost, weight: OVERALL_WEIGHTS.affordability },
    { label: t.score_languages, weight: OVERALL_WEIGHTS.languageSupport },
    { label: t.score_connections, weight: OVERALL_WEIGHTS.compatibility },
    { label: t.score_footprint, weight: OVERALL_WEIGHTS.environment },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:pt-14">
        <h1 className="max-w-4xl text-4xl font-bold sm:text-6xl">{t.hero_title}</h1>
        <p className="mt-3 text-xl font-medium">{t.tagline2}</p>
        <p className="mt-1 max-w-3xl text-lg text-muted-ink">{t.tagline}</p>
        <div className="mt-8">
          <SmartSearch lang={lang} t={pick(t, SEARCH_KEYS)} examples={[t.search_example1, t.search_example2, t.search_example3, t.search_example4]} />
        </div>
        <p className="mt-4 flex items-center gap-2 font-medium">
          <CheckIcon className="size-5 shrink-0 text-green" />
          {t.hero_note}
        </p>
      </section>

      <section aria-labelledby="board-title" className="bg-green-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="board-title" className="text-3xl font-bold">
            {t.home_boardTitle}
          </h2>
          <p className="mt-1 text-lg">{t.home_boardSub}</p>
          <ul className="mt-6 grid gap-x-12 gap-y-1 md:grid-cols-2">
            {taxonomy.map((category) => (
              <li key={category.id} className="border-t border-white/30 py-3">
                <Link href={searchHref(lang, category.id)} prefetch={false} className="flex items-baseline gap-3 no-underline hover:text-marigold">
                  <span className="text-xl font-semibold">{category.name}</span>
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
        </div>
      </section>

      <section aria-labelledby="kits-title" className="mx-auto max-w-6xl px-4 py-12">
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
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {kits.map((kit) => (
            <li key={kit.slug}>
              <KitCard kit={kit} lang={lang} t={t} />
            </li>
          ))}
          <li>
            <NewToolsCard lang={lang} t={t} />
          </li>
        </ul>
      </section>

      <section aria-labelledby="how-title" className="border-y-2 border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="how-title" className="text-3xl font-bold">
            {t.home_howTitle}
          </h2>
          <ol className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {[
              [t.home_how1_t, t.home_how1_d],
              [t.home_how2_t, t.home_how2_d],
              [t.home_how3_t, t.home_how3_d],
              [t.home_how4_t, t.home_how4_d],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden="true" className="text-4xl leading-none font-bold text-green">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="score-title" className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
        <div>
          <h2 id="score-title" className="text-3xl font-bold">
            {t.home_scoreTitle}
          </h2>
          <p className="mt-3 text-lg">{t.home_scoreD}</p>
          <Link href={`/${lang}/methodology`} prefetch={false} className="mt-3 inline-flex min-h-12 items-center gap-2 font-medium underline underline-offset-4">
            {t.home_scoreLink}
            <ArrowIcon className="size-4" />
          </Link>
        </div>
        <dl className="space-y-3 self-center">
          {scoreRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-3">
              <dt>{row.label}</dt>
              <dd className="font-semibold">{Math.round(row.weight * 100)}%</dd>
              <dd className="col-span-2 mt-1 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div className="h-full rounded-full bg-green" style={{ width: `${(row.weight / OVERALL_WEIGHTS.reviews) * 100}%` }} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 md:grid-cols-2">
        <div className="rounded-xl bg-marigold-tint p-6">
          <h2 className="text-2xl font-bold">{t.home_alreadyTitle}</h2>
          <p className="mt-2">{t.home_alreadyD}</p>
          <Link href={`/${lang}/my-tools`} prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-4`}>
            {t.home_alreadyCta}
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
