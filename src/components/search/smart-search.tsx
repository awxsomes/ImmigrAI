"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmt, type SearchLabels } from "@/lib/labels";
import type { Suggestion } from "@/lib/types";
import { isSpecificNeed, setPendingNeed } from "./pending-need";

type TaxonomyText = Record<string, { name: string; desc?: string }>;

interface Item {
  href: string;
  title: string;
  detail: string;
  ai: boolean;
}

interface Libs {
  matcher: typeof import("@/lib/matcher");
  text: TaxonomyText;
}

const TEXT_LOADERS: Record<string, () => Promise<{ default: TaxonomyText }>> = {
  en: () => import("@/content/i18n/en.taxonomy.json"),
  es: () => import("@/content/i18n/es.taxonomy.json"),
  zh: () => import("@/content/i18n/zh.taxonomy.json"),
  vi: () => import("@/content/i18n/vi.taxonomy.json"),
};

/**
 * The search box. Suggestions appear on the first keystroke from a small word list that
 * runs on the device, then the AI refines them for sentences the list cannot place. The
 * word list is only downloaded when someone focuses the box, so pages stay light, and the
 * form still submits without JavaScript. Follows the ARIA combobox pattern.
 */
export function SmartSearch({
  lang,
  t,
  size = "lg",
  examples,
  showPrivacy = true,
  landmarkLabel,
}: {
  lang: string;
  t: SearchLabels;
  size?: "lg" | "sm";
  examples?: string[];
  showPrivacy?: boolean;
  /** Names this search for screen readers when more than one is on the page. */
  landmarkLabel?: string;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [thinking, setThinking] = useState(false);
  // Pressing Search can take a few seconds on a slow phone: working out the match, then
  // loading the results. The button says so the whole time, so it never looks broken.
  const [resolving, setResolving] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const pending = resolving || navigating;
  const libs = useRef<Promise<Libs> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);

  function loadLibs() {
    libs.current ??= Promise.all([import("@/lib/matcher"), (TEXT_LOADERS[lang] ?? TEXT_LOADERS.en)()]).then(([matcher, text]) => ({
      matcher,
      text: text.default,
    }));
    return libs.current;
  }

  function toItems(suggestions: Suggestion[], text: TaxonomyText, ai: boolean): Item[] {
    return suggestions.map((s) => {
      const category = text[s.categoryId]?.name ?? s.categoryId;
      const sub = s.subcategoryId ? text[s.subcategoryId] : undefined;
      return {
        href: `/${lang}/search?cat=${s.categoryId}${s.subcategoryId ? `&sub=${s.subcategoryId}` : ""}`,
        title: sub ? `${category} → ${sub.name}` : category,
        detail: ai ? s.reason : (sub?.desc ?? s.reason),
        ai,
      };
    });
  }

  async function update(value: string) {
    setQuery(value);
    setActive(-1);
    if (timer.current) clearTimeout(timer.current);
    request.current?.abort();
    setThinking(false);

    const text = value.trim();
    if (text.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }

    const { matcher, text: names } = await loadLibs();
    const local = matcher.localSuggestions(text);
    setItems(toItems(local, names, false));
    setOpen(true);

    // The word list is confident: skip the AI and save the cost and the wait.
    if (local[0] && local[0].confidence >= 0.75) return;
    if (text.length < 6 || !navigator.onLine) return;

    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      setThinking(true);
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, lang }),
          signal: controller.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as { suggestions: Suggestion[]; source: string };
          if (json.suggestions.length > 0) {
            setItems(toItems(json.suggestions, names, json.source === "ai"));
            setOpen(true);
          }
        }
      } catch {
        /* Cancelled or offline: the word list suggestions stay on screen. */
      } finally {
        if (!controller.signal.aborted) setThinking(false);
      }
    }, 500);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  function go(href: string) {
    setOpen(false);
    startNavigation(() => router.push(href));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!open || items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      go(items[active].href);
    }
  }

  /**
   * A specific need goes to the results page with the owner's words held in memory, so
   * the tools can be matched to exactly what they asked and the words never appear in a
   * page address, browser history or server log. A short search goes to its category.
   */
  async function submit() {
    // Read the box itself: on a slow phone, words typed before the page's scripts started
    // are in the box but were never seen by onChange.
    const text = (inputRef.current?.value ?? query).trim();
    if (!text || pending) return;
    if (active >= 0 && items[active]) return go(items[active].href);
    if (isSpecificNeed(text)) {
      setResolving(true);
      try {
        // The category is only what a reload falls back to. The match works out its own.
        let base = items[0]?.href;
        if (!base) {
          const { matcher, text: names } = await loadLibs();
          const local = matcher.localSuggestions(text);
          base = local[0] ? toItems(local, names, false)[0].href : `/${lang}/search?`;
        }
        setPendingNeed(text);
        return go(`${base}${base.endsWith("?") ? "" : "&"}need=1`);
      } finally {
        setResolving(false);
      }
    }
    if (items[0]) return go(items[0].href);
    setResolving(true);
    try {
      const { matcher, text: names } = await loadLibs();
      const local = matcher.localSuggestions(text);
      if (local[0]) return go(toItems(local, names, false)[0].href);
      setThinking(true);
      setOpen(true);
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, lang }),
        });
        const json = res.ok ? ((await res.json()) as { suggestions: Suggestion[] }) : { suggestions: [] };
        if (json.suggestions[0]) return go(toItems(json.suggestions, names, true)[0].href);
      } catch {
        /* Offline or the AI is down: fall through to the search page. */
      } finally {
        setThinking(false);
      }
      go(`/${lang}/search?q=${encodeURIComponent(text)}`);
    } finally {
      setResolving(false);
    }
  }

  function tryExample(example: string) {
    void update(example);
    inputRef.current?.focus();
  }

  const showList = open && query.trim().length >= 2;
  const large = size === "lg";

  return (
    <div>
      <form
        role="search"
        aria-label={landmarkLabel}
        action={`/${lang}/search`}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={id} className={large ? "block text-lg font-semibold sm:text-xl" : "block font-semibold"}>
          {t.search_label}
        </label>
        <div className="relative mt-2">
          <div className={`flex flex-col gap-2 sm:flex-row ${large ? "sm:gap-3" : ""}`}>
            <Input
              ref={inputRef}
              id={id}
              name="q"
              type="search"
              role="combobox"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={200}
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-describedby={hintId}
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              placeholder={t.search_placeholder}
              value={query}
              onFocus={() => {
                void loadLibs();
                if (items.length > 0) setOpen(true);
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onChange={(event) => void update(event.target.value)}
              onKeyDown={onKeyDown}
              large={large}
              className="border-ink"
            />
            <Button type="submit" size={large ? "lg" : "default"} aria-disabled={pending || undefined}>
              <SearchIcon className="size-5" />
              {pending ? t.search_opening : t.search_button}
            </Button>
          </div>

          {showList && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border-2 border-ink bg-surface">
              {items.length > 0 ? (
                <ul role="listbox" id={listId} aria-label={t.search_suggestions} className="max-h-[60vh] overflow-y-auto">
                  {items.map((item, index) => (
                    <li
                      key={item.href}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === active}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => go(item.href)}
                      onMouseEnter={() => setActive(index)}
                      className={`cursor-pointer border-b border-line px-4 py-3 last:border-b-0 ${index === active ? "bg-green-tint" : ""}`}
                    >
                      <span className="block font-semibold">{item.title}</span>
                      <span className="block text-sm text-muted-ink">
                        {item.ai ? `${t.search_aiMatch}: ` : ""}
                        {item.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p id={listId} className="px-4 py-3 text-muted-ink">
                  {thinking ? t.search_thinking : t.search_noMatch}
                </p>
              )}
              {items.length > 0 && thinking && <p className="border-t border-line px-4 py-2 text-sm text-muted-ink">{t.search_thinking}</p>}
            </div>
          )}
        </div>
        <p id={hintId} className="sr-only">
          {t.search_hint}
        </p>
        <p role="status" className="sr-only">
          {pending ? t.search_opening : showList && items.length > 0 ? fmt(t.search_count, { n: items.length }) : ""}
        </p>
      </form>

      {examples && (
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((example) => (
            <a
              key={example}
              href={`/${lang}/search?q=${encodeURIComponent(example)}`}
              onClick={(event) => {
                event.preventDefault();
                tryExample(example);
              }}
              className="inline-flex min-h-11 items-center rounded-lg border-2 border-line-strong bg-surface px-3 py-1 no-underline transition-colors hover:bg-green-tint"
            >
              {example}
            </a>
          ))}
        </div>
      )}
      {showPrivacy && <p className="mt-3 max-w-3xl text-sm text-muted-ink">{t.search_privacy}</p>}
    </div>
  );
}
