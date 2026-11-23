/**
 * Checks shared by the translation scripts and the site. No imports, so Node can run it directly.
 *
 * A translation is only trusted while it says the same numbers as its English: "$16" in Spanish
 * next to "$19" in English means the English changed, or the model slipped.
 */

/** Thousands may be grouped with a dot, a comma or a non-breaking space, never a plain space, which would join "2 30-minute calls". */
const SEPARATORS = `.,${String.fromCharCode(0xa0, 0x202f)}`;
const NUMBER = new RegExp(
  `\\d+(?:[${SEPARATORS}]\\d+)*(\\s?(?:[万萬億亿千]|[KM](?![\\p{L}])|million|millón|millones|mil(?![\\p{L}])|triệu|nghìn|ngàn))?`,
  "giu",
);
const SPLIT = new RegExp(`[${SEPARATORS}]`);
const SCALE: Record<string, number> = {
  万: 1e4, 萬: 1e4, 億: 1e8, 亿: 1e8, 千: 1e3, k: 1e3, m: 1e6, million: 1e6, millón: 1e6, millones: 1e6, mil: 1e3, triệu: 1e6, nghìn: 1e3, ngàn: 1e3,
};

/**
 * Right after a number, these mean money or a share, which must never change in translation.
 * A range or list that ends in money counts as money throughout.
 */
const MONEY_BEFORE = /(?:US\$|\$|USD\s?)$/i;
// A "$" counts after a number ("16 $") but not when it starts the next price, as in "W-2 $75".
const MONEY_MARK = "%|％|\\$(?!\\s?\\d)|USD|美元|美分|元|¢|đô|dólar|centavo|cents?(?!\\p{L})|xu(?!\\p{L})";
/** A range or list that ends in money, such as "2 到 6 美元", "7、5 或 3 đô la" or "from 2 to 6 dólares". */
const RANGE_STEP = "\\s?(?:to|a|đến|到|至|-|–|—|、|,|或|or|o|y|and|和|hoặc)\\s?(?:US\\$|\\$)?\\d+(?:[.,]\\d+)?";
const MONEY_AFTER = new RegExp(`^(?:${RANGE_STEP}){0,3}\\s?(?:${MONEY_MARK})`, "iu");
/** Cents are counted as dollars, so "10 cents" and "0.10 美元" are the same number. */
const CENTS = /^\s?(?:¢|cents?(?!\p{L})|centavos?|美分|xu(?!\p{L}))/iu;
/** Chinese gives a discount as the share you pay: "8 折" is 20% off. */
const ZHE = /^\s?折/u;
/** "24 hours" is how many languages say "around the clock", so it may appear in a translation with no number in the English. */
const HOURS = /^\s?(?:h(?!\p{L})|hours?|horas?|小时|小時|giờ)/iu;

/**
 * The numbers in a text that a translation must keep, written one way: "1,200" and "1.200" are
 * 1200, "9,99" and "9.99" are 9.99, and Chinese "50万" is 500000.
 *
 * Left out, because a good translation may rightly change them: a small count such as "one
 * user" that becomes "1 người dùng", and "24/7", which Spanish writes as "las 24 horas". A small
 * number next to a dollar sign or a percent is kept, so "$5" can never quietly become "$8".
 */
export function numbersIn(text: string) {
  const out = new Set<string>();
  const clean = text.replace(/\b24\s?\/\s?7\b/g, " ");
  for (const match of clean.matchAll(NUMBER)) {
    const whole = match[0];
    const unit = match[1];
    const digits = unit ? whole.slice(0, -unit.length).trim() : whole;
    const groups = digits.split(SPLIT);
    const thousands = groups.length > 1 && groups.slice(1).every((g) => g.length === 3);
    const values = thousands ? [Number(groups.join(""))] : groups.length === 2 ? [Number(`${groups[0]}.${groups[1]}`)] : groups.map(Number);
    const scale = unit ? SCALE[unit.trim().toLowerCase()] : 1;
    const at = match.index ?? 0;
    const after = clean.slice(at + whole.length, at + whole.length + 24);
    const money = MONEY_BEFORE.test(clean.slice(Math.max(0, at - 4), at)) || MONEY_AFTER.test(after) || ZHE.test(after);
    if (digits === "24" && HOURS.test(after)) continue;
    const cents = CENTS.test(after);
    const zhe = ZHE.test(after);
    for (const value of values) {
      const shown = value * scale;
      const n = Math.round((zhe ? (10 - shown) * 10 : cents ? shown / 100 : shown) * 100) / 100;
      // Zero is left out too: "$0" is often translated as "free".
      if (n !== 0 && (n > 12 || !Number.isInteger(n) || money || unit)) out.add(String(n));
    }
  }
  return out;
}

/** The leaves of a translated field, paired with their English, by key or by position. */
function pairs(source: unknown, translated: unknown): Array<[string, unknown]> {
  if (typeof source === "string") return [[source, translated]];
  if (Array.isArray(source)) return source.flatMap((item, i) => pairs(item, Array.isArray(translated) ? translated[i] : undefined));
  if (source && typeof source === "object") {
    const other = translated && typeof translated === "object" && !Array.isArray(translated) ? (translated as Record<string, unknown>) : {};
    return Object.entries(source as Record<string, unknown>).flatMap(([key, value]) => pairs(value, other[key]));
  }
  return [];
}

/** True when every part of a translation states exactly the numbers its English states. */
export function sameNumbers(source: unknown, translated: unknown) {
  return pairs(source, translated).every(([english, other]) => {
    if (typeof other !== "string") return false;
    const want = numbersIn(english);
    const have = numbersIn(other);
    // "24/7" is often written out, as "las 24 horas, los 7 días" or "24 giờ".
    if (/\b24\s?\/\s?7\b/.test(english)) {
      have.delete("24");
      have.delete("7");
    }
    return want.size === have.size && [...want].every((n) => have.has(n));
  });
}

/**
 * Plans are matched to their translations by name, never by position, so a plan added, removed
 * or reordered cannot put one plan's details under another's price. A repeated name gets a number.
 */
export function planKeys(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    return count === 1 ? name : `${name} (${count})`;
  });
}
