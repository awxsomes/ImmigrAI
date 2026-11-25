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

/**
 * A word or two the device could not place. The search box opens the results page for it at
 * once, without waiting for the AI, and the page then goes straight to the AI's best match, as
 * if the box had waited. Opened from a link instead, the page lists the AI's ideas to choose from.
 */
let jumpFor: string | null = null;

export function setJumpToBestMatch(query: string) {
  jumpFor = query;
}

export function peekJumpToBestMatch(query: string) {
  return jumpFor === query;
}

export function clearJumpToBestMatch() {
  jumpFor = null;
}

/** A few words or more is a specific need. One word is a category, and a list answers it faster. */
export function isSpecificNeed(text: string) {
  const trimmed = text.trim();
  if (/[぀-ヿ㐀-鿿가-힯]/.test(trimmed)) return trimmed.length >= 6;
  return trimmed.split(/\s+/).length >= 3;
}
