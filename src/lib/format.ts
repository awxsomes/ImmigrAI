import { fmt, type CardLabels } from "./labels";
import { planMonthly, seatsFor, type CompatibilityResult } from "./scoring";
import type { CompatLabels } from "./labels";
import type { AiLevel, PricePlan, TeamSize, Tool } from "./types";

export function toolHref(lang: string, slug: string) {
  return `/${lang}/tools/${slug}`;
}

export function searchHref(lang: string, categoryId: string, subcategoryId?: string) {
  return `/${lang}/search?cat=${categoryId}${subcategoryId ? `&sub=${subcategoryId}` : ""}`;
}

type AmountLabels = Pick<CardLabels, "price_amount" | "price_amountPerson" | "price_amountLocation" | "price_amountUse">;

export type PriceLabels = AmountLabels &
  Pick<CardLabels, "card_free" | "card_freePlan" | "card_noMonthlyFee" | "card_youSetBudget" | "card_perReturn" | "price_plan">;

/** "$30 a month, per location" */
export function planPrice(plan: PricePlan, t: AmountLabels) {
  const template = { business: t.price_amount, person: t.price_amountPerson, location: t.price_amountLocation, use: t.price_amountUse }[plan.per];
  return fmt(template, { n: plan.monthlyUsd });
}

/** The plan matching the price everything else is worked out from. */
function entryPlan(tool: Tool) {
  return tool.pricing.plans?.find((plan) => plan.monthlyUsd === tool.pricing.startingMonthlyUsd);
}

/** The one line that answers "what will I pay?". Names the real plan, never "starting at". */
export function priceText(tool: Tool, t: PriceLabels) {
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
    default: {
      const plan = entryPlan(tool);
      return plan ? fmt(t.price_plan, { plan: plan.name, price: planPrice(plan, t) }) : fmt(t.price_amount, { n: p.startingMonthlyUsd });
    }
  }
}

/** "Next plan: Plus, $70 a month, per location", or nothing when there is no plan above this one. */
export function nextPlanText(tool: Tool, t: AmountLabels & Pick<CardLabels, "price_next">) {
  const plans = tool.pricing.plans ?? [];
  const entry = tool.pricing.kind === "monthly" ? entryPlan(tool) : undefined;
  const next = entry ? plans[plans.indexOf(entry) + 1] : plans.find((plan) => plan.monthlyUsd > 0);
  return next ? fmt(t.price_next, { plan: next.name, price: planPrice(next, t) }) : "";
}

/** What the first paid plan comes to for this team, when it is charged per person. */
export function teamEstimate(tool: Tool, size: TeamSize, template: string) {
  const plan = tool.pricing.plans?.find((p) => p.monthlyUsd > 0);
  if (!plan || plan.per !== "person" || !seatsFor(size)) return "";
  return fmt(template, { n: planMonthly(plan, size), plan: plan.name });
}

/** Says plainly when we could not confirm the price, and adds nothing when we could. */
export function priceConfirmation(tool: Tool, t: Pick<CardLabels, "card_priceUnconfirmed" | "price_plansUnconfirmed">) {
  if (tool.pricing.plans?.length || tool.pricing.kind === "free" || tool.publicResource) return "";
  return tool.pricing.verified ? t.price_plansUnconfirmed : t.card_priceUnconfirmed;
}

/** What the first paid plan costs, or the only price we know. */
export function paidMonthly(tool: Tool) {
  return tool.pricing.plans?.find((plan) => plan.monthlyUsd > 0)?.monthlyUsd ?? tool.pricing.startingMonthlyUsd;
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
