import { SYSTEM_NAMES } from "@/data/systems";
import type { BusinessProfile, EnvironmentalEstimate, PriceKind, PricePlan, PricingModel, TeamSize, Tool, ToolFocus, ToolScores, Workload } from "./types";

/**
 * Environmental Impact (0-100, higher = lighter footprint).
 * Energy 30%, Water 20%, Carbon 20%, Computational efficiency 30%.
 *
 * Vendors do not publish per-task data, so each tool is placed in a workload class
 * and each class has a stated physical estimate. See /methodology for the sources.
 */
export const ENV_WEIGHTS = { energy: 0.3, water: 0.2, carbon: 0.2, compute: 0.3 } as const;

/** Published on-site water use for AI serving is close to 1 mL per Wh (Google, 2025). */
export const WATER_ML_PER_WH = 1.08;
/** US grid average for 2024, about 402 g CO2e per kWh (Electricity Maps, as used by MIT Technology Review). */
export const CO2_GRAMS_PER_WH = 0.4;

export interface WorkloadProfile {
  label: string;
  explain: string;
  wattHours: number;
  /** Computing resources: tokens processed and model size, scored directly. */
  compute: number;
}

export const WORKLOADS: Record<Workload, WorkloadProfile> = {
  none: { label: "No AI", explain: "Ordinary software or a printable resource. No AI model runs.", wattHours: 0.02, compute: 98 },
  "background-ml": { label: "Small AI in the background", explain: "Small models sort transactions, block fraud or rank results.", wattHours: 0.05, compute: 90 },
  "optional-genai": { label: "AI only when you ask", explain: "Normal software, plus a large model about one task in five.", wattHours: 0.08, compute: 72 },
  translation: { label: "Translation AI", explain: "Specialized translation models, smaller than a chatbot's.", wattHours: 0.1, compute: 66 },
  "llm-every-reply": { label: "Large AI on every reply", explain: "A large language model runs for each reply.", wattHours: 0.3, compute: 40 },
  speech: { label: "Voice-making AI", explain: "A speech model generates each audio clip.", wattHours: 0.5, compute: 34 },
  "image-video": { label: "Image-making AI", explain: "An image model runs for each picture. Video uses far more.", wattHours: 0.63, compute: 25 },
  "voice-agent": { label: "AI on every phone call", explain: "Speech recognition, a large model and a voice all run for each call.", wattHours: 3, compute: 18 },
};

/** Log scale: 0.01 Wh or less scores 100, 10 Wh or more scores 0. */
function logScore(value: number, best: number, worst: number) {
  const span = Math.log10(worst / best);
  const position = Math.log10(Math.max(value, best) / best) / span;
  return Math.round(Math.max(0, Math.min(1, 1 - position)) * 100);
}

export function environmentalEstimate(workload: Workload): EnvironmentalEstimate {
  const profile = WORKLOADS[workload] ?? WORKLOADS["optional-genai"];
  const wattHours = profile.wattHours;
  const waterMl = Math.round(wattHours * WATER_ML_PER_WH * 1000) / 1000;
  const co2Grams = Math.round(wattHours * CO2_GRAMS_PER_WH * 1000) / 1000;
  const energy = logScore(wattHours, 0.01, 10);
  const water = logScore(waterMl, 0.01 * WATER_ML_PER_WH, 10 * WATER_ML_PER_WH);
  const carbon = logScore(co2Grams, 0.01 * CO2_GRAMS_PER_WH, 10 * CO2_GRAMS_PER_WH);
  const compute = profile.compute;
  const score = Math.round(
    energy * ENV_WEIGHTS.energy + water * ENV_WEIGHTS.water + carbon * ENV_WEIGHTS.carbon + compute * ENV_WEIGHTS.compute,
  );
  return { energy, water, carbon, compute, score, workload, perTask: { wattHours, waterMl, co2Grams } };
}

export function envLabel(score: number) {
  if (score >= 75) return "light" as const;
  if (score >= 45) return "moderate" as const;
  return "heavy" as const;
}

/**
 * ImmigrAI score (0-100). Goes beyond reviews because a five-star tool that is
 * expensive, English-only or impossible to set up is still the wrong tool.
 */
/** With no confirmed reviews a score stops here. High enough that a new specialist can beat a famous generalist. */
export const UNRATED_SCORE_CAP = 85;

/**
 * Being made for the job counts for more than being famous. Star ratings are capped at
 * a fifth of the score, and review counts are not used at all.
 */
export const OVERALL_WEIGHTS = {
  focus: 0.25,
  reviews: 0.2,
  easeOfUse: 0.2,
  affordability: 0.15,
  languageSupport: 0.1,
  compatibility: 0.05,
  environment: 0.05,
} as const;

const fifth = (n: number) => Math.max(0, Math.min(5, Number.isFinite(n) ? n : 0)) / 5;

const FOCUS_POINTS: Record<ToolFocus, number> = { trade: 5, task: 4, suite: 2.5, general: 1 };

export function focusScore(focus: ToolFocus) {
  return FOCUS_POINTS[focus];
}

export function overallScore(input: {
  focus: number;
  rating: number | null;
  easeOfUse: number;
  affordability: number;
  languageSupport: number;
  compatibility: number;
  environment: number;
}) {
  const w = OVERALL_WEIGHTS;
  const known =
    fifth(input.focus) * w.focus +
    fifth(input.easeOfUse) * w.easeOfUse +
    fifth(input.affordability) * w.affordability +
    fifth(input.languageSupport) * w.languageSupport +
    fifth(input.compatibility) * w.compatibility +
    (Math.max(0, Math.min(100, input.environment)) / 100) * w.environment;
  if (input.rating === null) {
    // No confirmed reviews: score only what we know, rather than inventing a neutral rating.
    return Math.min(UNRATED_SCORE_CAP, Math.round((known / (1 - w.reviews)) * 100));
  }
  return Math.round((known + fifth(input.rating) * w.reviews) * 100);
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
  rating: number | null;
  startingMonthlyUsd: number;
  priceKind?: PriceKind;
  languages: string[];
  integrations: string[];
  setupMinutes: number;
  platforms: string[];
  selfServe: boolean;
  environment: number;
}): ToolScores {
  const parts = {
    focus: focusScore(input.focus),
    easeOfUse: easeFromSignals(input),
    affordability: affordabilityFromPrice(input.startingMonthlyUsd, input.priceKind),
    languageSupport: languageScoreFromList(input.languages),
    compatibility: compatibilityFromList(input.integrations),
  };
  return {
    ...parts,
    overall: overallScore({ rating: input.rating, environment: input.environment, ...parts }),
    overallIncludesReviews: input.rating !== null,
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

// ---------- Filtering ----------

export interface ToolFilters {
  maxPrice: number;
  minRating: number;
  minEnv: number;
  language: string;
  onlyMyLanguage: boolean;
}

export const DEFAULT_FILTERS: ToolFilters = {
  maxPrice: 150,
  minRating: 0,
  minEnv: 0,
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

export type SortKey = "overall" | "cheapest" | "rating" | "env" | "easiest";

export function filterTools(tools: Tool[], f: ToolFilters) {
  return tools.filter((t) => {
    if (t.pricing.startingMonthlyUsd > f.maxPrice) return false;
    if (f.minRating > 0 && (t.reviews.rating === null || t.reviews.rating < f.minRating)) return false;
    if (t.environmental.score < f.minEnv) return false;
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
    case "env":
      return copy.sort((a, b) => b.environmental.score - a.environmental.score);
    case "easiest":
      return copy.sort((a, b) => b.scores.easeOfUse - a.scores.easeOfUse || b.scores.overall - a.scores.overall);
    default:
      // Specialists come first, because a tool that already knows the job is why people are here.
      return copy.sort((a, b) => rankGroup(a) - rankGroup(b) || b.scores.overall + bonus(b) - (a.scores.overall + bonus(a)));
  }
}
