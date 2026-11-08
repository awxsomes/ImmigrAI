/**
 * The owner's words, held in memory between pressing Search and the results page.
 * They stay out of the page address, browser history and server logs. A reload loses
 * them on purpose, and the page falls back to the plain category list.
 */
let pending: string | null = null;

export function setPendingNeed(need: string) {
  pending = need;
}

export function peekPendingNeed() {
  return pending;
}

/** A few words or more is a specific need. One word is a category, and a list answers it faster. */
export function isSpecificNeed(text: string) {
  const trimmed = text.trim();
  if (/[぀-ヿ㐀-鿿가-힯]/.test(trimmed)) return trimmed.length >= 6;
  return trimmed.split(/\s+/).length >= 3;
}
