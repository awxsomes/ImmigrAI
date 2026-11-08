"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { LANGUAGES } from "@/data/languages";
import type { DiscoverResult } from "@/lib/discover";
import { fmt, type ResultsLabels } from "@/lib/labels";
import { connectsWithExisting, DEFAULT_FILTERS, filterTools, fitBonus, sortTools, type SortKey, type ToolFilters } from "@/lib/scoring";
import { cacheTools, setToolLanguage, useUserData } from "@/lib/storage";
import { BUSINESS_TYPES, type BusinessType, type Tool } from "@/lib/types";
import { SaveButton } from "./tool-actions";
import { ToolCard } from "./tool-card";

const COMPARE_MAX = 4;

type LiveState = "idle" | "searching" | "done" | "paused" | "failed" | "save-data";

interface NetworkInfo {
  saveData?: boolean;
  effectiveType?: string;
}

/** Skip the automatic web search if the visitor asked to save data or is on a very slow connection. */
function prefersLowData() {
  const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  return Boolean(connection?.saveData) || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
}

export function ResultsView({
  lang,
  tools,
  categoryId,
  subcategoryId,
  query,
  defaultLanguage,
  liveSearch = true,
  t,
}: {
  lang: string;
  tools: Tool[];
  categoryId?: string;
  subcategoryId?: string;
  /** The owner's own words. These go by POST and are never cached by the CDN. */
  query?: string;
  /** Language name matching the page language, when not English. */
  defaultLanguage: string;
  /** Off for needs where tools are only added after a person reviews them. */
  liveSearch?: boolean;
  t: ResultsLabels;
}) {
  const { data, ready } = useUserData();
  const [filters, setFilters] = useState<ToolFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("overall");
  const [showFilters, setShowFilters] = useState(false);
  // Starts from what the owner told us about their business, until they pick something else here.
  const [businessChoice, setBusinessChoice] = useState<string | null>(null);
  const business = businessChoice ?? data.business.type;
  const [onlyConnected, setOnlyConnected] = useState(false);
  const [liveTools, setLiveTools] = useState<Tool[]>([]);
  const [liveRun, setLive] = useState<LiveState>("idle");
  const [lowData] = useState(() => typeof navigator !== "undefined" && prefersLowData());
  // Waits for `ready`, so the first render in the browser matches the server's HTML.
  const live: LiveState = liveRun === "idle" && lowData && ready && categoryId && liveSearch ? "save-data" : liveRun;
  const [compare, setCompare] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState(false);

  const language = filters.language || data.language || defaultLanguage;

  async function runSearch(signal?: AbortSignal) {
    if (!categoryId) return;
    setLive("searching");
    try {
      const params = new URLSearchParams({ cat: categoryId, lang });
      if (subcategoryId) params.set("sub", subcategoryId);
      if (business) params.set("biz", business);
      const res = query
        ? await fetch("/api/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cat: categoryId, sub: subcategoryId, biz: business, lang, q: query }),
            signal,
          })
        : await fetch(`/api/discover?${params}`, { signal });
      if (!res.ok) throw new Error("search failed");
      const result = (await res.json()) as DiscoverResult;
      if (signal?.aborted) return;
      if (result.status === "ok") {
        setLiveTools(result.tools);
        if (result.tools.length > 0) cacheTools(result.tools);
        setLive("done");
      } else {
        setLive(result.status === "error" ? "failed" : "paused");
      }
    } catch {
      if (!signal?.aborted) setLive("failed");
    }
  }

  useEffect(() => {
    if (!categoryId || lowData || !liveSearch) return;
    // Starts just after the page has painted, and is cancelled if the visitor moves on first.
    const controller = new AbortController();
    const timer = setTimeout(() => void runSearch(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // runSearch only reads the values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, subcategoryId, business, query, lowData, liveSearch]);

  const all = useMemo(() => {
    const known = new Set(tools.map((tool) => tool.slug));
    return [...tools, ...liveTools.filter((tool) => !known.has(tool.slug))];
  }, [tools, liveTools]);

  const shown = useMemo(() => {
    const profile = { type: business as BusinessType | "", size: data.business.size };
    const filtered = filterTools(all, { ...filters, language }).filter((tool) => !onlyConnected || connectsWithExisting(tool, data.alreadyUse).length > 0);
    return sortTools(filtered, sort, (tool) => fitBonus(tool, profile, data.alreadyUse, language));
  }, [all, filters, language, sort, business, data.business.size, data.alreadyUse, onlyConnected]);

  function toggleCompare(slug: string) {
    setCompareNotice(false);
    setCompare((list) => {
      if (list.includes(slug)) return list.filter((s) => s !== slug);
      if (list.length >= COMPARE_MAX) {
        setCompareNotice(true);
        return list;
      }
      return [...list, slug];
    });
  }

  const status = {
    idle: "",
    searching: t.results_searching,
    done: liveTools.length > 0 ? fmt(t.results_foundNew, { n: liveTools.length }) : t.results_foundNone,
    paused: t.results_paused,
    failed: t.results_failed,
    "save-data": t.results_saveData,
  }[live];

  const aiTools = shown.filter((tool) => tool.ai.level !== "none" && tool.focus !== "general");
  const generalTools = shown.filter((tool) => tool.ai.level !== "none" && tool.focus === "general");
  const otherTools = shown.filter((tool) => tool.ai.level === "none");

  const toolList = (list: Tool[]) => (
    <ul className="mt-4 space-y-4">
      {list.map((tool) => {
        const comparing = compare.includes(tool.slug);
        return (
          <li key={tool.slug}>
            <ToolCard
              tool={tool}
              lang={lang}
              t={t}
              language={ready || defaultLanguage ? language : ""}
              alreadyUse={data.alreadyUse}
              actions={
                <>
                  <SaveButton tool={tool} saveLabel={t.card_saveTool} savedLabel={t.card_savedTool} />
                  <Button variant="ghost" aria-pressed={comparing} onClick={() => toggleCompare(tool.slug)}>
                    {comparing ? t.card_removeCompare : t.card_addCompare}
                    <span className="sr-only">: {tool.name}</span>
                  </Button>
                </>
              }
            />
          </li>
        );
      })}
    </ul>
  );

  const filtersActive = onlyConnected || JSON.stringify({ ...filters, language: "" }) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
      <div>
        <Button variant="outline" className="w-full lg:hidden" aria-expanded={showFilters} aria-controls="filters" onClick={() => setShowFilters((v) => !v)}>
          {showFilters ? t.filter_hide : t.filter_show}
        </Button>
        <section id="filters" aria-labelledby="filters-title" className={`${showFilters ? "block" : "hidden"} mt-4 space-y-5 rounded-xl border-2 border-line bg-surface p-5 lg:mt-0 lg:block`}>
          <h2 id="filters-title" className="text-lg font-semibold">
            {t.filter_title}
          </h2>

          <div>
            <Label id="price-label">{t.filter_price}</Label>
            <p className="text-sm text-muted-ink" aria-live="off">
              {filters.maxPrice === 0 ? t.filter_priceFree : fmt(t.filter_priceUpTo, { n: filters.maxPrice })}
            </p>
            <Slider
              aria-labelledby="price-label"
              min={0}
              max={150}
              step={5}
              value={filters.maxPrice}
              onValueChange={(v) => setFilters((f) => ({ ...f, maxPrice: v as number }))}
            />
          </div>

          <div>
            <Label htmlFor="rating-filter">{t.filter_rating}</Label>
            <NativeSelect
              id="rating-filter"
              className="mt-1"
              value={filters.minRating}
              onChange={(e) => setFilters((f) => ({ ...f, minRating: Number(e.target.value) }))}
            >
              <option value={0}>{t.filter_anyRating}</option>
              <option value={1}>{t.filter_star}</option>
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {fmt(t.filter_stars, { n })}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div>
            <Label id="env-label">{t.filter_env}</Label>
            <p className="text-sm text-muted-ink">{filters.minEnv === 0 ? t.filter_envAny : fmt(t.filter_envAtLeast, { n: filters.minEnv })}</p>
            <Slider
              aria-labelledby="env-label"
              min={0}
              max={100}
              step={5}
              value={filters.minEnv}
              onValueChange={(v) => setFilters((f) => ({ ...f, minEnv: v as number }))}
            />
          </div>

          <div>
            <Label htmlFor="language-filter">{t.filter_myLanguage}</Label>
            <NativeSelect
              id="language-filter"
              className="mt-1"
              value={language}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((f) => ({ ...f, language: value }));
                setToolLanguage(value);
              }}
            >
              <option value="">{t.filter_chooseLanguage}</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.native === l.name ? l.name : `${l.native} (${l.name})`}
                </option>
              ))}
            </NativeSelect>
            <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-6 shrink-0 accent-[#0e5a45]"
                disabled={!language}
                checked={filters.onlyMyLanguage}
                onChange={(e) => setFilters((f) => ({ ...f, onlyMyLanguage: e.target.checked }))}
              />
              {t.filter_onlyMine}
            </label>
          </div>

          {data.alreadyUse.length > 0 && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="size-6 shrink-0 accent-[#0e5a45]" checked={onlyConnected} onChange={(e) => setOnlyConnected(e.target.checked)} />
              {t.filter_onlyConnect}
            </label>
          )}

          {categoryId && liveSearch && (
            <div>
              <Label htmlFor="business-filter">{t.filter_businessType}</Label>
              <NativeSelect id="business-filter" className="mt-1" value={business} onChange={(e) => setBusinessChoice(e.target.value)}>
                <option value="">{t.businessType_any}</option>
                {BUSINESS_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {t[`businessType_${b}`]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {filtersActive && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setFilters({ ...DEFAULT_FILTERS, language: filters.language });
                setOnlyConnected(false);
              }}
            >
              {t.filter_reset}
            </Button>
          )}
        </section>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="font-medium" role="status">
            {fmt(t.results_showing, { shown: shown.length, total: all.length })}
          </p>
          <div className="w-full sm:w-60">
            <Label htmlFor="sort">{t.results_sort}</Label>
            <NativeSelect id="sort" className="mt-1" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="overall">{t.sort_overall}</option>
              <option value="cheapest">{t.sort_cheapest}</option>
              <option value="rating">{t.sort_rating}</option>
              <option value="env">{t.sort_env}</option>
              <option value="easiest">{t.sort_easiest}</option>
            </NativeSelect>
          </div>
        </div>

        {status && (
          <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-marigold-tint p-3">
            <p>{status}</p>
            {live === "save-data" && (
              <Button variant="outline" size="sm" onClick={() => void runSearch()}>
                {t.results_searchWeb}
              </Button>
            )}
          </div>
        )}

        {shown.length === 0 ? (
          <p className="mt-6 rounded-lg border-2 border-line bg-surface p-5">{t.results_none}</p>
        ) : (
          <>
            {aiTools.length > 0 && toolList(aiTools)}
            {generalTools.length > 0 && (
              <details className="group mt-6" open={aiTools.length === 0}>
                <summary className="flex min-h-12 list-none items-center justify-between gap-2 rounded-lg border-2 border-line-strong bg-surface px-4 font-medium hover:bg-green-tint">
                  {fmt(t.results_generalTools, { n: generalTools.length })}
                  <ChevronIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3">{t.results_generalNote}</p>
                {toolList(generalTools)}
              </details>
            )}
            {otherTools.length > 0 &&
              (aiTools.length > 0 ? (
                <details className="group mt-6">
                  <summary className="flex min-h-12 list-none items-center justify-between gap-2 rounded-lg border-2 border-line-strong bg-surface px-4 font-medium hover:bg-green-tint">
                    {fmt(t.results_otherTools, { n: otherTools.length })}
                    <ChevronIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  {toolList(otherTools)}
                </details>
              ) : (
                toolList(otherTools)
              ))}
          </>
        )}
      </div>

      {compare.length > 0 && (
        <div role="region" aria-label={t.compare_go} className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="font-medium">
              {compare.length} {t.compare_bar}
              {compareNotice && <span className="ml-2 font-normal text-[#7a2a14]">{t.compare_max}</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setCompare([])}>
                {t.compare_clear}
              </Button>
              <Link
                href={`/${lang}/compare?tools=${compare.join(",")}`}
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-green bg-green px-5 font-medium text-white hover:border-green-dark hover:bg-green-dark"
              >
                {t.compare_go}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
