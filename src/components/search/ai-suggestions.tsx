"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Suggestion } from "@/lib/types";

/** When the word list cannot place a question, ask the AI, and show what it suggests. */
export function AiSuggestions({
  lang,
  q,
  t,
}: {
  lang: string;
  q: string;
  t: { results_askingAi: string; results_didYouMean: string; results_noMatchQuery: string };
}) {
  const [items, setItems] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, lang }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { suggestions: [] }))
      .then((json: { suggestions: Suggestion[] }) => setItems(json.suggestions))
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      });
    return () => controller.abort();
  }, [q, lang]);

  if (items === null) return <p role="status" className="mt-4">{t.results_askingAi}</p>;
  if (items.length === 0) return <p role="status" className="mt-4">{t.results_noMatchQuery}</p>;
  return (
    <div className="mt-4" role="status">
      <h2 className="text-xl font-semibold">{t.results_didYouMean}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((s) => (
          <li key={`${s.categoryId}/${s.subcategoryId}`}>
            <Link href={`/${lang}/search?cat=${s.categoryId}${s.subcategoryId ? `&sub=${s.subcategoryId}` : ""}`} className="font-medium underline underline-offset-2">
              {s.label.replace(" > ", " → ")}
            </Link>
            <span className="block text-sm text-muted-ink">{s.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
