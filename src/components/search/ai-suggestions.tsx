"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Suggestion } from "@/lib/types";
import { clearJumpToBestMatch, peekJumpToBestMatch } from "./pending-need";

/**
 * When the word list cannot place a question, ask the AI, and show what it suggests. Sent here
 * by the search box, go straight to its best match instead (see setJumpToBestMatch).
 */
export function AiSuggestions({
  lang,
  q,
  t,
}: {
  lang: string;
  q: string;
  t: { results_askingAi: string; results_didYouMean: string; results_noMatchQuery: string };
}) {
  const router = useRouter();
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [jump] = useState(() => peekJumpToBestMatch(q));

  // Read once: coming back to this page later lists the ideas instead.
  useEffect(() => clearJumpToBestMatch(), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, lang }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { suggestions: [] }))
      .then((json: { suggestions: Suggestion[] }) => {
        const best = json.suggestions[0];
        if (jump && best) router.replace(`/${lang}/search?cat=${best.categoryId}${best.subcategoryId ? `&sub=${best.subcategoryId}` : ""}`);
        setItems(json.suggestions);
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      });
    return () => controller.abort();
  }, [q, lang, jump, router]);

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
