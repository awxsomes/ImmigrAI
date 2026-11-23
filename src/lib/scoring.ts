import { SYSTEM_NAMES } from "@/data/systems";
import type { BusinessProfile, EnvironmentalEstimate, PriceKind, PricePlan, PricingModel, ScoreBasis, TeamSize, Tool, ToolFocus, ToolScores, Workload } from "./types";

/**
 * Energy use, shown only on a tool's own page and never part of its score.
 *
 * Vendors do not publish per-task data, so each tool is placed in a workload class and each
 * class has a stated physical estimate. Water and carbon follow from energy by fixed factors,
 * so they are shown as amounts, not as separate scores. See /methodology for the sources.
 */

/** Published on-site water use for AI serving is close to 1 mL per Wh (Google, 2025). */
export const WATER_ML_PER_WH = 1.08;
/** US grid average for 2024, about 402 g CO2e per kWh (Electricity Maps, as used by MIT Technology Review). */
export const CO2_GRAMS_PER_WH = 0.4;

export interface WorkloadProfile {
  label: string;
  explain: string;
  wattHours: number;
}

export const WORKLOADS: Record<Workload, WorkloadProfile> = {
  none: { label: "No AI", explain: "Ordinary software or a printable resource. No AI model runs.", wattHours: 0.02 },
  "background-ml": { label: "Small AI in the background", explain: "Small models sort transactions, block fraud or rank results.", wattHours: 0.05 },
  "optional-genai": { label: "AI only when you ask", explain: "Normal software, plus a large model about one task in five.", wattHours: 0.08 },
  translation: { label: "Translation AI", explain: "Specialized translation models, smaller than a chatbot's.", wattHours: 0.1 },
  "llm-every-reply": { label: "Large AI on every reply", explain: "A large language model runs for each reply.", wattHours: 0.3 },
  speech: { label: "Voice-making AI", explain: "A speech model generates each audio clip.", wattHours: 0.5 },
  "image-video": { label: "Image-making AI", explain: "An image model runs for each picture. Video uses far more.", wattHours: 0.63 },
  "voice-agent": { label: "AI on every phone call", explain: "Speech recognition, a large model and a voice all run for each call.", wattHours: 3 },
};

export function environmentalEstimate(workload: Workload): EnvironmentalEstimate {
  const profile = WORKLOADS[workload] ?? WORKLOADS["optional-genai"];
  const wattHours = profile.wattHours;
  const waterMl = Math.round(wattHours * WATER_ML_PER_WH * 1000) / 1000;
  const co2Grams = Math.round(wattHours * CO2_GRAMS_PER_WH * 1000) / 1000;
  return { workload, perTask: { wattHours, waterMl, co2Grams } };
}

export type EnergyLevel = "low" | "medium" | "high";

/**
 * A plain word for the estimate, relative to the other tools listed. Even "high", an AI
 * phone call at about 3 Wh, is small next to a home refrigerator's 1,000 to 2,000 Wh a day.
 */
export function energyLevel(wattHours: number): EnergyLevel {
  if (wattHours <= 0.1) return "low";
  if (wattHours < 1) return "medium";
  return "high";
}

/**
 * ImmigrAI score (0-100). Goes beyond reviews because a five-star tool that is
 * expensive, English-only or impossible to set up is still the wrong tool.
 *
 * Being made for the job counts for more than being famous. Star ratings are a fifth of the
 * score, and review counts only decide how far a rating moves away from the average.
 */
export const OVERALL_WEIGHTS = {
  focus: 0.25,
  reviews: 0.2,
  easeOfUse: 0.2,
  affordability: 0.15,
  languageSupport: 0.1,
  compatibility: 0.1,
} as const;

/** The average confirmed rating of the catalog in November 2026, across 58 rated tools. */
export const RATING_PRIOR = 4.3;
/** A rating counts as if this many reviews at the average were added to it. */
export const PRIOR_REVIEWS = 50;
/** The fewest reviews a rating can rest on. Kept equal to MIN_REVIEWS_FOR_RATING in research-core.ts. */
const MIN_REVIEWS = 25;

/**
 * A Bayesian average: each rating is pulled toward the catalog average, more when it rests on
 * few reviews. A tool with no confirmed reviews gets the average itself, neither a reward nor a
 * penalty, so a small new tool is not marked down for being unknown.
 */
export function adjustedRating(rating: number | null, reviewCount: number) {
  if (rating === null || !Number.isFinite(rating)) return RATING_PRIOR;
  // Two sites that agree but state no counts pass the review check, so they count as the minimum.
  const n = reviewCount > 0 ? reviewCount : MIN_REVIEWS;
  return Math.round(((PRIOR_REVIEWS * RATING_PRIOR + n * rating) / (PRIOR_REVIEWS + n)) * 100) / 100;
}

const fifth = (n: number) => Math.max(0, Math.min(5, Number.isFinite(n) ? n : 0)) / 5;

const FOCUS_POINTS: Record<ToolFocus, number> = { trade: 5, task: 4, suite: 2.5, general: 1 };

export function focusScore(focus: ToolFocus) {
  return FOCUS_POINTS[focus];
}

export function overallScore(input: { focus: number; reviews: number; easeOfUse: number; affordability: number; languageSupport: number; compatibility: number }) {
  const w = OVERALL_WEIGHTS;
  return Math.round(
    (fifth(input.focus) * w.focus +
      fifth(input.reviews) * w.reviews +
      fifth(input.easeOfUse) * w.easeOfUse +
      fifth(input.affordability) * w.affordability +
      fifth(input.languageSupport) * w.languageSupport +
      fifth(input.compatibility) * w.compatibility) *
      100,
  );
}

/** What a price means when research did not say. A $0 price on a paid product is not free. */
export function inferPriceKind(startingMonthlyUsd: number, model: PricingModel): PriceKind {
  if (startingMonthlyUsd > 0) return "monthly";
  if (model === "free") return "free";
  if (model === "freemium") return "free-plan";
  return "no-monthly-fee";
}

export function affordabilityFromPrice(startingMonthlyUsd: number, kind?: PriceKind) {
  // The real cost of these depends on sales or ad spend, so they cannot score as fully free.
  if (kind === "no-monthly-fee") return 4.5;
  if (kind === "you-set-budget") return 2.5;
  if (startingMonthlyUsd <= 0) return 5;
  if (startingMonthlyUsd <= 10) return 4.5;
  if (startingMonthlyUsd <= 25) return 4;
  if (startingMonthlyUsd <= 50) return 3;
  if (startingMonthlyUsd <= 100) return 2;
  return 1;
}

/** Languages most spoken by immigrant owners. A list of 200 languages earns nothing extra. */
const OWNER_LANGUAGES = ["spanish", "chinese", "vietnamese", "korean", "tagalog", "filipino", "arabic", "haitian creole", "portuguese", "russian", "french", "hindi"];

export function languageScoreFromList(languages: string[]) {
  const n = languages.filter((l) => OWNER_LANGUAGES.some((o) => l.toLowerCase().startsWith(o))).length;
  if (n >= 4) return 5;
  if (n === 3) return 4.5;
  if (n === 2) return 4;
  if (n === 1) return 3;
  return 1.5;
}

/** Only software owners really run counts. Fifty obscure connections earn nothing extra. */
export function compatibilityFromList(integrations: string[]) {
  const n = SYSTEM_NAMES.filter((name) => mentions(integrations, name)).length;
  if (n >= 3) return 5;
  if (n === 2) return 4;
  if (n === 1) return 3;
  return 1.5;
}

/** Estimated from setup time, whether there is a phone app and whether you can start alone. */
export function easeFromSignals(input: { setupMinutes: number; platforms: string[]; selfServe: boolean }) {
  const m = input.setupMinutes;
  let score = m <= 15 ? 5 : m <= 30 ? 4.5 : m <= 60 ? 4 : m <= 120 ? 3 : 2;
  const hasPhone = input.platforms.some((p) => p === "ios" || p === "android" || p === "phone");
  if (!hasPhone) score -= 0.5;
  if (!input.selfServe) score -= 1;
  return Math.max(1, score);
}

export function buildScores(input: {
  focus: ToolFocus;
  /** True when a person set who the tool is made for. */
  focusChecked?: boolean;
  rating: number | null;
  reviewCount: number;
  startingMonthlyUsd: number;
  priceKind?: PriceKind;
  /** Where the price came from. */
  priceBasis: ScoreBasis;
  languages: string[];
  /** True when a full language list was read. Otherwise a missing language is only unchecked. */
  languagesChecked: boolean;
  integrations: string[];
  setupMinutes: number;
  platforms: string[];
  selfServe: boolean;
}): ToolScores {
  const parts = {
    focus: focusScore(input.focus),
    reviews: adjustedRating(input.rating, input.reviewCount),
    easeOfUse: easeFromSignals(input),
    affordability: affordabilityFromPrice(input.startingMonthlyUsd, input.priceKind),
    languageSupport: languageScoreFromList(input.languages),
    compatibility: compatibilityFromList(input.integrations),
  };
  return {
    ...parts,
    overall: overallScore(parts),
    overallIncludesReviews: input.rating !== null,
    basis: {
      focus: input.focusChecked ? "person" : "estimate",
      reviews: input.rating !== null ? "source" : "estimate",
      // Setup time, phone apps and whether sales must be involved are a model's reading of the site.
      easeOfUse: "estimate",
      affordability: input.priceBasis,
      languageSupport: input.languagesChecked ? "source" : "estimate",
      compatibility: input.integrations.length > 0 ? "source" : "estimate",
    },
  };
}

// ---------- Compatibility ----------

export type CompatibilityLevel = "direct" | "bridge" | "shared" | "none";

export interface CompatibilityResult {
  level: CompatibilityLevel;
  /** The connector both tools share, when level is "bridge". */
  via?: string;
}

/** Common connectors. Two tools that both reach one of these can exchange information. */
const BRIDGES = ["zapier", "make", "google sheets", "google workspace", "google calendar", "quickbooks", "square", "shopify", "stripe", "whatsapp"];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function mentions(list: string[], name: string) {
  const target = norm(name);
  const short = target.split(" ")[0];
  return list.some((item) => {
    const n = norm(item);
    return n === target || target.startsWith(`${n} `) || n.startsWith(`${target} `) || (short.length > 3 && n === short);
  });
}

/**
 * How well two tools work together.
 * direct: one lists the other as an integration.
 * bridge: both connect to a common connector.
 * shared: both run on the same kind of device, so they can be used side by side.
 * none: nothing in common.
 */
export function compatibility(a: Tool, b: Tool): CompatibilityResult {
  if (mentions(a.integrations, b.name) || mentions(b.integrations, a.name)) return { level: "direct" };
  const aList = a.integrations.map(norm);
  const bList = b.integrations.map(norm);
  const common = aList.filter((i) => bList.includes(i));
  const bridge = common.find((c) => BRIDGES.some((br) => c.includes(br))) ?? common[0];
  if (bridge) return { level: "bridge", via: titleCase(bridge) };
  if (a.platforms.some((p) => b.platforms.includes(p))) return { level: "shared" };
  return { level: "none" };
}

const FIT_POINTS: Record<CompatibilityLevel, number> = { direct: 100, bridge: 75, shared: 45, none: 10 };

/** Average pairwise compatibility for a set of tools, 0-100. */
export function bundleFit(tools: Tool[]) {
  if (tools.length < 2) return 100;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      sum += FIT_POINTS[compatibility(tools[i], tools[j]).level];
      pairs++;
    }
  }
  return Math.round(sum / pairs);
}

export function monthlyTotal(tools: Tool[]) {
  return tools.reduce((acc, t) => acc + (t.pricing.startingMonthlyUsd || 0), 0);
}

/** Tools the owner already runs that this tool connects to. */
export function connectsWithExisting(tool: Tool, alreadyUse: string[]) {
  return alreadyUse.filter((name) => mentions(tool.integrations, name));
}

// ---------- Language ----------

export function supportsLanguage(tool: Tool, language: string) {
  const want = language.toLowerCase();
  return tool.languages.some((l) => {
    const have = l.toLowerCase();
    return have === want || have.startsWith(`${want} `) || (want === "tagalog" && have === "filipino") || (want === "persian" && have === "farsi");
  });
}

/**
 * yes: a cited page names the language. no: a full list was read and it is not on it.
 * unchecked: no full list was found, so it may still work. Small tools are often here.
 */
export type LanguageAnswer = "yes" | "no" | "unchecked";

export function languageAnswer(tool: Tool, language: string): LanguageAnswer {
  if (supportsLanguage(tool, language)) return "yes";
  return tool.languagesChecked ? "no" : "unchecked";
}

// ---------- Filtering ----------

export interface ToolFilters {
  maxPrice: number;
  minRating: number;
  language: string;
  onlyMyLanguage: boolean;
}

export const DEFAULT_FILTERS: ToolFilters = {
  maxPrice: 150,
  minRating: 0,
  language: "",
  onlyMyLanguage: false,
};

/** Specialists first, then AI features in broad software, then blank-box tools, then no AI. */
function rankGroup(tool: Tool) {
  if (tool.ai.level === "none") return 3;
  if (tool.focus === "general") return 2;
  return tool.ai.level === "core" ? 0 : 1;
}

/** Points that lift a tool for this particular owner. Never shown as part of its score. */
export function fitBonus(tool: Tool, profile: BusinessProfile, alreadyUse: string[], language: string) {
  let bonus = 0;
  if (profile.type && tool.trades.includes(profile.type)) bonus += 15;
  bonus += Math.min(connectsWithExisting(tool, alreadyUse).length, 2) * 6;
  if (language && supportsLanguage(tool, language)) bonus += 5;
  return bonus;
}

/** How many people a price is multiplied by. A guess from the size the owner picked. */
export function seatsFor(size: TeamSize) {
  return { "": 0, "1": 1, "2-5": 4, "6-20": 12, "21+": 25 }[size];
}

/** What a plan would come to per month for this team, when that can be worked out. */
export function planMonthly(plan: PricePlan, size: TeamSize) {
  if (plan.per !== "person") return plan.monthlyUsd;
  const seats = seatsFor(size);
  return seats ? Math.round(plan.monthlyUsd * seats * 100) / 100 : plan.monthlyUsd;
}

export type SortKey = "overall" | "cheapest" | "rating" | "easiest";

export function filterTools(tools: Tool[], f: ToolFilters) {
  return tools.filter((t) => {
    if (t.pricing.startingMonthlyUsd > f.maxPrice) return false;
    if (f.minRating > 0 && (t.reviews.rating === null || t.reviews.rating < f.minRating)) return false;
    if (f.onlyMyLanguage && f.language && !supportsLanguage(t, f.language)) return false;
    return true;
  });
}

export function sortTools(tools: Tool[], key: SortKey, bonus: (tool: Tool) => number = () => 0) {
  const copy = [...tools];
  switch (key) {
    case "cheapest":
      return copy.sort((a, b) => a.pricing.startingMonthlyUsd - b.pricing.startingMonthlyUsd || b.scores.overall - a.scores.overall);
    case "rating":
      return copy.sort((a, b) => (b.reviews.rating ?? -1) - (a.reviews.rating ?? -1));
    case "easiest":
      return copy.sort((a, b) => b.scores.easeOfUse - a.scores.easeOfUse || b.scores.overall - a.scores.overall);
    default:
      // Specialists come first, because a tool that already knows the job is why people are here.
      return copy.sort((a, b) => rankGroup(a) - rankGroup(b) || b.scores.overall + bonus(b) - (a.scores.overall + bonus(a)));
  }
}
