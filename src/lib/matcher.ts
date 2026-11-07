import { flatTaxonomy } from "@/data/taxonomy";
import { KEYWORDS_I18N } from "@/data/keywords-i18n";
import type { Suggestion } from "./types";

/**
 * Instant suggestions with no network call, so the dropdown reacts on the first
 * keystroke even on a slow connection. Runs in the browser and on the server.
 * The AI endpoint takes over for sentences this cannot place.
 */

const STOP = new Set([
  "i", "me", "my", "we", "our", "need", "needs", "want", "help", "with", "to", "a", "an", "the", "for", "of", "and", "or",
  "in", "on", "is", "it", "do", "can", "how", "some", "something", "please", "get", "make", "making", "find", "looking", "am", "at", "when",
  "necesito", "ayuda", "con", "para", "el", "la", "los", "las", "un", "una", "de", "y", "que", "quiero", "mi", "mis",
  "toi", "can", "giup", "cua",
]);

const CJK = /[぀-ヿ㐀-鿿가-힯]/;

/** Words that mean something different once a suffix is removed. */
const KEEP_WHOLE = new Set(["books", "booking", "bookings", "poster", "posters"]);

function stem(word: string) {
  if (word.length <= 3 || KEEP_WHOLE.has(word)) return word;
  return word.replace(/(ings|ing|ers|er|es|s|ed)$/u, "");
}

/** Lowercase, drop punctuation and common suffixes: "Employee Schedules!" becomes "employee schedul". */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stem)
    .join(" ");
}

interface Entry {
  categoryId: string;
  subcategoryId: string;
  categoryName: string;
  subcategoryName: string;
  description: string;
  sub: string[];
  cat: string[];
  raw: string[];
}

function prepare(): Entry[] {
  return flatTaxonomy().map((e) => {
    const localized = KEYWORDS_I18N[e.subcategoryId] ?? "";
    const words = localized.split("|").map((w) => w.trim()).filter(Boolean);
    return {
      categoryId: e.categoryId,
      subcategoryId: e.subcategoryId,
      categoryName: e.categoryName,
      subcategoryName: e.subcategoryName,
      description: e.description,
      sub: [...new Set([e.subcategoryName, ...e.subKeywords, ...words.filter((w) => !CJK.test(w))].map(normalize))].filter(Boolean),
      cat: [...new Set([e.categoryName, ...e.categoryKeywords].map(normalize))].filter(Boolean),
      raw: words.filter((w) => CJK.test(w)),
    };
  });
}

let entries: Entry[] | null = null;

export function localSuggestions(query: string, limit = 5): Suggestion[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  entries ??= prepare();

  const q = ` ${normalize(trimmed)} `;
  const words = new Set(q.trim().split(" "));
  // Needs two meaningful words. Filler alone ("help wanted" is all filler) would match everything.
  const hasAllWords = (phrase: string) => {
    const meaningful = phrase.split(" ").filter((word) => !STOP.has(word));
    return meaningful.length >= 2 && meaningful.every((word) => words.has(word));
  };
  const scored: Array<Suggestion & { score: number }> = [];

  for (const entry of entries) {
    let score = 0;
    for (const phrase of entry.sub) {
      if (q.includes(` ${phrase} `)) score += 4 + phrase.split(" ").length * 2;
      // Every word present but not side by side, such as "pay my two employees".
      else if (hasAllWords(phrase)) score += 2 + phrase.split(" ").length * 2;
    }
    for (const phrase of entry.cat) {
      if (q.includes(` ${phrase} `)) score += 1 + phrase.split(" ").length;
    }
    for (const phrase of entry.raw) {
      if (trimmed.includes(phrase)) score += 4 + phrase.length;
    }
    if (score > 0) {
      scored.push({
        categoryId: entry.categoryId,
        subcategoryId: entry.subcategoryId,
        label: `${entry.categoryName} > ${entry.subcategoryName}`,
        reason: entry.description,
        confidence: Math.min(1, score / 8),
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  return scored
    .filter((s) => s.score >= top * 0.4)
    .slice(0, limit)
    .map((s) => ({
      categoryId: s.categoryId,
      subcategoryId: s.subcategoryId,
      label: s.label,
      reason: s.reason,
      confidence: s.confidence,
    }));
}

/** Words that carry meaning, ignoring filler. Used to decide when to ask the AI. */
export function meaningfulWordCount(query: string) {
  return normalize(query)
    .split(" ")
    .filter((w) => w && !STOP.has(w)).length;
}
