"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MatchCard } from "@/components/tools/match-card";
import { SaveButton } from "@/components/tools/tool-actions";
import { searchHref } from "@/lib/format";
import { fmt, type MatchLabels } from "@/lib/labels";
import type { MatchResult } from "@/lib/match-types";
import { cacheTools, useUserData } from "@/lib/storage";
import { peekPendingNeed, setPendingNeed } from "./pending-need";

type Phase = "searching" | "done" | "failed";

/**
 * The tools for what the owner asked, above the plain list for that category. Their words
 * are only held in memory, so after a reload this shows the page title and nothing else.
 */
export function MatchResults({
  lang,
  t,
  fallbackTitle,
  browseTitle,
  defaultLanguage,
  currentCategory,
  currentSub,
}: {
  lang: string;
  t: MatchLabels;
  fallbackTitle: string;
  browseTitle: string;
  defaultLanguage: string;
  currentCategory?: string;
  currentSub?: string;
}) {
  const { data, ready } = useUserData();
  const [need, setNeed] = useState<string | null>(() => peekPendingNeed());
  const [draft, setDraft] = useState(need ?? "");
  const [phase, setPhase] = useState<Phase>("searching");
  const [result, setResult] = useState<MatchResult | null>(null);

  const type = data.business.type;
  const size = data.business.size;
  const language = data.language || defaultLanguage;
  const systemsKey = data.alreadyUse.join("|");

  useEffect(() => {
    if (!need || !ready) return;
    const controller = new AbortController();
    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ need, lang, type, size, systems: systemsKey.split("|").filter(Boolean), language }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("search failed"))))
      .then((json: MatchResult) => {
        setResult(json);
        setPhase(json.status === "error" ? "failed" : "done");
        if (json.tools.length > 0) cacheTools(json.tools.map((m) => m.tool));
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase("failed");
      });
    return () => controller.abort();
  }, [need, ready, lang, type, size, systemsKey, language]);

  if (!need) return <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{fallbackTitle}</h1>;

  function searchAgain(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (text.length < 3 || text === need) return;
    setPendingNeed(text);
    setResult(null);
    setPhase("searching");
    setNeed(text);
  }

  const brief = result?.brief;
  const tools = result?.tools ?? [];
  const paused = result?.status === "ai-off" || result?.status === "daily-cap";
  const status =
    phase === "searching"
      ? t.match_searching
      : phase === "failed"
        ? t.match_failed
        : paused
          ? t.match_paused
          : tools.length === 1
            ? t.match_foundOne
            : tools.length > 1
              ? fmt(t.match_found, { n: tools.length })
              : "";
  const moved = brief?.categoryId && (brief.categoryId !== currentCategory || (brief.subcategoryId || undefined) !== currentSub);

  return (
    <section aria-labelledby="match-title" className="mt-2">
      <h1 id="match-title" className="text-3xl font-bold sm:text-4xl">
        {t.match_title}
      </h1>

      <div className="mt-4 rounded-xl bg-marigold-tint p-4">
        <h2 className="font-semibold">{t.match_understood}</h2>
        <p className="mt-1 text-lg">{brief?.job ?? need}</p>
        {brief && brief.mustHave.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {brief.mustHave.map((item) => (
              <li key={item} className="rounded-md border-2 border-line-strong bg-surface px-2 py-1 text-sm">
                {item}
              </li>
            ))}
          </ul>
        )}
        <details className="mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium underline underline-offset-2">{t.match_change}</summary>
          <form onSubmit={searchAgain} className="mt-2 space-y-2">
            <Label htmlFor="match-need">{t.match_changeLabel}</Label>
            <textarea
              id="match-need"
              rows={2}
              maxLength={300}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="block w-full rounded-lg border-2 border-line-strong bg-surface p-3"
            />
            <Button type="submit" variant="outline">
              {t.match_again}
            </Button>
          </form>
        </details>
      </div>

      <p role="status" className="mt-4 font-medium">
        {status}
      </p>

      {tools.length > 0 && (
        <ul className="mt-3 space-y-5">
          {tools.map((match) => (
            <li key={match.tool.slug}>
              <MatchCard
                match={match}
                hasTrade={Boolean(brief?.trade)}
                lang={lang}
                t={t}
                language={language}
                alreadyUse={data.alreadyUse}
                actions={<SaveButton tool={match.tool} saveLabel={t.card_saveTool} savedLabel={t.card_savedTool} />}
              />
            </li>
          ))}
        </ul>
      )}

      {result?.nothingSpecialized && <p className="mt-4 rounded-lg border-2 border-line bg-surface p-5">{t.match_nothing}</p>}

      {phase === "done" && !paused && data.alreadyUse.length === 0 && tools.length > 0 && (
        <p className="mt-4">
          <Link href={`/${lang}/my-tools`} prefetch={false} className="inline-block py-1 font-medium underline underline-offset-2">
            {t.match_addSystems}
          </Link>
        </p>
      )}

      {brief && moved && (
        <p className="mt-4">
          <Link href={searchHref(lang, brief.categoryId, brief.subcategoryId || undefined)} prefetch={false} className="inline-block py-1 font-medium underline underline-offset-2">
            {t.match_seeAll}
          </Link>
        </p>
      )}

      <h2 className="mt-10 text-2xl font-bold">{browseTitle}</h2>
    </section>
  );
}
