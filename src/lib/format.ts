import { fmt, type CardLabels } from "./labels";
import type { CompatibilityResult } from "./scoring";
import type { CompatLabels } from "./labels";
import type { AiLevel, Tool } from "./types";

export function toolHref(lang: string, slug: string) {
  return `/${lang}/tools/${slug}`;
}

export function searchHref(lang: string, categoryId: string, subcategoryId?: string) {
  return `/${lang}/search?cat=${categoryId}${subcategoryId ? `&sub=${subcategoryId}` : ""}`;
}

export function priceText(
  tool: Tool,
  t: Pick<CardLabels, "card_free" | "card_freePlan" | "card_noMonthlyFee" | "card_youSetBudget" | "card_perReturn" | "card_from" | "card_perMonth">,
) {
  const p = tool.pricing;
  switch (p.kind) {
    case "free":
      return t.card_free;
    case "free-plan":
      return t.card_freePlan;
    case "no-monthly-fee":
      return t.card_noMonthlyFee;
    case "you-set-budget":
      return t.card_youSetBudget;
    case "per-return":
      return fmt(t.card_perReturn, { n: p.perReturnUsd ?? 0 });
    default:
      return `${t.card_from} $${p.startingMonthlyUsd}${t.card_perMonth}`;
  }
}

export function compatText(result: CompatibilityResult, t: CompatLabels) {
  const via = result.via ?? "";
  switch (result.level) {
    case "direct":
      return { label: t.compat_direct, detail: t.compat_directD };
    case "bridge":
      return { label: fmt(t.compat_bridge, { via }), detail: fmt(t.compat_bridgeD, { via }) };
    case "shared":
      return { label: t.compat_shared, detail: t.compat_sharedD };
    default:
      return { label: t.compat_none, detail: t.compat_noneD };
  }
}

/** Language names in the reader's own language, using what the browser already knows. */
const CODES: Record<string, string> = {
  English: "en", Spanish: "es", Chinese: "zh", Vietnamese: "vi", Korean: "ko", Tagalog: "tl", Filipino: "fil", Arabic: "ar", "Haitian Creole": "ht",
  Portuguese: "pt", French: "fr", Russian: "ru", Hindi: "hi", Punjabi: "pa", Urdu: "ur", Bengali: "bn", Amharic: "am", Somali: "so", Persian: "fa", Farsi: "fa",
  Polish: "pl", Ukrainian: "uk", Thai: "th", Japanese: "ja", German: "de", Italian: "it", Greek: "el", Turkish: "tr", Swahili: "sw", Nepali: "ne", Khmer: "km",
  Hmong: "hmn", Lao: "lo", Burmese: "my", Indonesian: "id", Malay: "ms", Tamil: "ta", Telugu: "te", Gujarati: "gu", Hebrew: "he", Dutch: "nl", Romanian: "ro",
  Swedish: "sv", Danish: "da", Norwegian: "no", Finnish: "fi", Czech: "cs", Hungarian: "hu", Bulgarian: "bg", Croatian: "hr", Serbian: "sr", Slovak: "sk",
  Slovenian: "sl", Lithuanian: "lt", Latvian: "lv", Estonian: "et", Albanian: "sq", Armenian: "hy", Georgian: "ka", Tigrinya: "ti",
};

export function displayLanguage(name: string, lang: string) {
  if (lang === "en") return name;
  const code = CODES[name];
  if (!code) return name;
  try {
    return new Intl.DisplayNames([lang], { type: "language" }).of(code) ?? name;
  } catch {
    return name;
  }
}

export function aiLabel(level: AiLevel, t: Pick<CardLabels, "card_aiCore" | "card_aiFeature" | "card_aiNone">) {
  return level === "core" ? t.card_aiCore : level === "feature" ? t.card_aiFeature : t.card_aiNone;
}
