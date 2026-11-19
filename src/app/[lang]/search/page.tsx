import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { AiSuggestions } from "@/components/search/ai-suggestions";
import { MatchResults } from "@/components/search/match-results";
import { ResultsView } from "@/components/tools/results-view";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_TOOLS, seedToolsFor } from "@/data/seed-tools";
import { findCategory, findSubcategory, NO_LIVE_DISCOVERY, RENAMED_SUBCATEGORIES } from "@/data/taxonomy";
import { FREE_HELP, freeHelpFor } from "@/lib/advice";
import { searchHref } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { fmt, MATCH_KEYS, pick, RESULTS_KEYS } from "@/lib/labels";
import { localizeTool, localTaxonomy, nameOf, pageLanguageName } from "@/lib/localize";
import { localSuggestions } from "@/lib/matcher";

export const metadata: Metadata = { robots: { index: false } };

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 200) ?? "";
}

function ResultsFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

async function Results({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = getDict(lang);
  const q = one(sp.q).trim();
  // Set when the owner described a specific need. Their words stay in the browser, never in this address.
  const matching = one(sp.need) === "1";

  let categoryId = one(sp.cat);
  let subcategoryId = one(sp.sub);
  // Old links keep working after a subcategory is renamed.
  const renamed = RENAMED_SUBCATEGORIES[subcategoryId];
  if (renamed && categoryId) permanentRedirect(`${searchHref(lang, categoryId, renamed)}${matching ? "&need=1" : ""}`);
  let others: ReturnType<typeof localSuggestions> = [];

  // A typed question with no category: place it if we can, otherwise ask the AI on the page.
  if (q && !categoryId) {
    const suggestions = localSuggestions(q);
    if (suggestions[0] && suggestions[0].confidence >= 0.5) {
      categoryId = suggestions[0].categoryId;
      subcategoryId = suggestions[0].subcategoryId ?? "";
      others = suggestions.slice(1);
    } else {
      others = suggestions;
    }
  }

  const category = findCategory(categoryId);
  const sub = findSubcategory(categoryId, subcategoryId);

  if (!category) {
    const needle = q.toLowerCase();
    const named = needle.length >= 2 ? SEED_TOOLS.filter((tool) => tool.name.toLowerCase().includes(needle)) : [];
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        {matching ? (
          <MatchResults lang={lang} t={pick(t, MATCH_KEYS)} fallbackTitle={t.results_noCategory} browseTitle={t.match_browseNeeds} defaultLanguage={pageLanguageName(lang)} />
        ) : (
          <h1 className="text-3xl font-bold">{q ? `${t.results_forQuery}: "${q}"` : t.results_noCategory}</h1>
        )}
        {others.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{t.results_didYouMean}</h2>
            <ul className="mt-2 space-y-1">
              {others.map((s) => (
                <li key={`${s.categoryId}/${s.subcategoryId}`}>
                  <Link href={searchHref(lang, s.categoryId, s.subcategoryId)} className="inline-block py-1 underline underline-offset-2">
                    {nameOf(lang, s.categoryId, s.categoryId)}
                    {s.subcategoryId ? ` → ${nameOf(lang, s.subcategoryId, s.subcategoryId)}` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {q && others.length === 0 && named.length === 0 && (
          <AiSuggestions lang={lang} q={q} t={pick(t, ["results_askingAi", "results_didYouMean", "results_noMatchQuery"])} />
        )}
        {named.length > 0 && (
          <div className="mt-6">
            <ResultsView lang={lang} tools={named.map((tool) => localizeTool(tool, lang))} defaultLanguage={pageLanguageName(lang)} t={pick(t, RESULTS_KEYS)} />
          </div>
        )}
        {named.length === 0 && (
          <ul className="mt-8 gap-8 sm:columns-2 lg:columns-3">
            {localTaxonomy(lang).map((c) => (
              <li key={c.id} className="mb-4 break-inside-avoid">
                <Link href={searchHref(lang, c.id)} className="font-semibold underline underline-offset-2">
                  {c.name}
                </Link>
                <ul className="nested-bullets mt-1">
                  {c.subs.map((s) => (
                    <li key={s.id}>
                      <Link href={searchHref(lang, c.id, s.id)} className="inline-block py-1 underline-offset-2 hover:underline">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const categoryName = nameOf(lang, category.id, category.name);
  const subName = sub ? nameOf(lang, sub.id, sub.name) : "";
  const tools = seedToolsFor(category.id, sub?.id ?? null).map((tool) => localizeTool(tool, lang));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <nav aria-label={t.nav_breadcrumb} className="text-sm text-muted-ink">
        <ol className="flex flex-wrap gap-x-2">
          <li>
            <Link href={`/${lang}`} className="inline-block py-1 underline underline-offset-2 hover:text-ink">
              {t.nav_home}
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          {sub ? (
            <>
              <li>
                <Link href={searchHref(lang, category.id)} className="inline-block py-1 underline underline-offset-2 hover:text-ink">
                  {categoryName}
                </Link>
                <span aria-hidden="true"> / </span>
              </li>
              <li aria-current="page" className="py-1 font-semibold text-ink">
                {subName}
              </li>
            </>
          ) : (
            <li aria-current="page" className="py-1 font-semibold text-ink">
              {categoryName}
            </li>
          )}
        </ol>
      </nav>

      {matching ? (
        <MatchResults
          lang={lang}
          t={pick(t, MATCH_KEYS)}
          fallbackTitle={sub ? `${categoryName} → ${subName}` : categoryName}
          browseTitle={fmt(t.match_browseCategory, { name: subName || categoryName })}
          defaultLanguage={pageLanguageName(lang)}
          currentCategory={category.id}
          currentSub={sub?.id}
        />
      ) : (
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{subName || categoryName}</h1>
      )}
      {q && (
        <p className="mt-1 text-muted-ink">
          {t.results_forQuery}: &quot;{q}&quot;
        </p>
      )}

      {others.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm">
          <span className="font-medium">{t.results_otherMatches}:</span>
          {others.map((s) => (
            <Link key={`${s.categoryId}/${s.subcategoryId}`} href={searchHref(lang, s.categoryId, s.subcategoryId)} className="inline-block py-1 underline underline-offset-2">
              {s.subcategoryId ? nameOf(lang, s.subcategoryId, s.subcategoryId) : nameOf(lang, s.categoryId, s.categoryId)}
            </Link>
          ))}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={searchHref(lang, category.id)}
          aria-current={!sub ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[0.95rem] no-underline ${!sub ? "border-blue bg-blue font-semibold text-white" : "border-line-strong bg-surface font-medium hover:border-blue hover:bg-blue-tint"}`}
        >
          {t.results_all}
        </Link>
        {category.subcategories.map((s) => (
          <Link
            key={s.id}
            href={searchHref(lang, category.id, s.id)}
            aria-current={sub?.id === s.id ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[0.95rem] no-underline ${sub?.id === s.id ? "border-blue bg-blue font-semibold text-white" : "border-line-strong bg-surface font-medium hover:border-blue hover:bg-blue-tint"}`}
          >
            {nameOf(lang, s.id, s.name)}
          </Link>
        ))}
      </div>

      {sub?.id === "know-your-rights" && <p className="mt-4 max-w-4xl rounded-lg bg-brick-tint p-4">{t.results_iceNote}</p>}
      {freeHelpFor(category.id, sub?.id).length > 0 && (
        <section aria-labelledby="free-first-title" className="mt-4 max-w-4xl rounded-lg border border-blue bg-blue-tint p-4">
          <h2 id="free-first-title" className="text-xl font-semibold">
            {t.freeFirst_title}
          </h2>
          <ul className="mt-2 space-y-3">
            {freeHelpFor(category.id, sub?.id).map((kind) => (
              <li key={kind}>
                {t[FREE_HELP[kind].text]}{" "}
                <a href={FREE_HELP[kind].href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
                  {t[FREE_HELP[kind].link]}
                  <span className="sr-only"> ({t.tool_leaving})</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3">{t.freeFirst_note}</p>
          <Link href={`/${lang}/free-help#free-legal-tax`} className="mt-1 inline-block py-1 font-medium underline underline-offset-2">
            {t.freeFirst_more}
          </Link>
        </section>
      )}

      <div className="mt-8">
        <ResultsView
          key={`${category.id}/${sub?.id ?? ""}`}
          lang={lang}
          tools={tools}
          categoryId={category.id}
          subcategoryId={sub?.id}
          liveSearch={!matching && (!sub || !NO_LIVE_DISCOVERY.has(sub.id))}
          defaultLanguage={pageLanguageName(lang)}
          t={pick(t, RESULTS_KEYS)}
        />
      </div>
    </div>
  );
}

export default function SearchPage(props: Props) {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <Results {...props} />
    </Suspense>
  );
}
