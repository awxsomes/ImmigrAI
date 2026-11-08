/**
 * Core data model. Every tool, whether from the starter catalog or found by live
 * search, is normalized to `Tool`, so pages never care where a record came from.
 */

export type PricingModel = "free" | "freemium" | "paid" | "trial";

/**
 * How a tool actually charges. A $0 monthly price alone is not "free": Stripe charges on
 * every sale, Google Ads bills per click and TurboTax charges per tax return.
 */
export type PriceKind = "free" | "free-plan" | "no-monthly-fee" | "you-set-budget" | "per-return" | "monthly";

/** The kind of AI a tool runs. Drives the Environmental Impact estimate. */
export type Workload =
  | "none"
  | "background-ml"
  | "optional-genai"
  | "translation"
  | "llm-every-reply"
  | "speech"
  | "voice-agent"
  | "image-video";

/** core: AI does the main job. feature: normal software with AI an owner can use. none: neither. */
export type AiLevel = "core" | "feature" | "none";

export interface ToolAi {
  level: AiLevel;
  /** One plain sentence on what the AI does, confirmed from public pages. */
  feature: string;
}

export const BUSINESS_TYPES = ["restaurant", "salon", "retail", "trades", "cleaning"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Team size as owners think of it. */
export type TeamSize = "" | "1" | "2-5" | "6-20" | "21+";

/**
 * How closely a tool fits one job.
 * trade: built for one kind of business. task: does one job without being told how.
 * suite: broad business software. general: a blank box the owner has to write prompts for.
 */
export type ToolFocus = "trade" | "task" | "suite" | "general";

/** One plan as the company sells it, each price found on a cited page. */
export interface PricePlan {
  name: string;
  monthlyUsd: number;
  /** What the price is counted by. */
  per: "business" | "person" | "location" | "use";
  includes: string;
}

export type PolicyKind = "cancel" | "refund" | "contract" | "ai-training" | "data-export";

export interface ToolPolicy {
  kind: PolicyKind;
  say: string;
  /** Only set when the page is on the company's own site. */
  url: string;
}

/** What an owner needs in order to actually start using a tool. */
export interface ToolGuide {
  accountSteps: string[];
  connectSteps: string[];
  stepsUrl: string;
  policies: ToolPolicy[];
  trial: string;
  paywall: string;
}

export interface ToolPricing {
  /**
   * Lowest monthly price in USD that unlocks real business use, used for filters, totals and
   * scoring. A per-return price is converted to its monthly equivalent here.
   */
  startingMonthlyUsd: number;
  model: PricingModel;
  kind: PriceKind;
  /** Set when kind is "per-return". */
  perReturnUsd?: number;
  note: string;
  /** Transaction, per-employee or hardware fees, shown so nothing is hidden. */
  extraFees?: string;
  /** Every plan we could confirm, cheapest first. */
  plans?: PricePlan[];
  sourceUrl?: string;
  /** True when the price was found in the text of a cited page. */
  verified: boolean;
}

export interface EnvironmentalEstimate {
  /** 0-100 each. Higher means a lighter footprint. */
  energy: number;
  water: number;
  carbon: number;
  compute: number;
  /** Weighted total, 0-100. */
  score: number;
  workload: Workload;
  /** Physical estimates per task, shown so the score is not a black box. */
  perTask: { wattHours: number; waterMl: number; co2Grams: number };
}

export interface ReviewSource {
  site: string;
  url: string;
  rating: number;
  count: number | null;
}

export interface ReviewSummary {
  /** Average of the star ratings found on each site. Null when none could be confirmed. */
  rating: number | null;
  reviewCount: number;
  summary: string;
  sources: ReviewSource[];
}

export interface ToolScores {
  /** How closely it is made for one job, out of 5. */
  focus: number;
  easeOfUse: number;
  affordability: number;
  languageSupport: number;
  compatibility: number;
  /** 0-100 blended score. */
  overall: number;
  /** False when reviews could not be confirmed, so the score leaves them out. */
  overallIncludesReviews: boolean;
}

export interface Tool {
  slug: string;
  name: string;
  website: string;
  summary: string;
  helpsWith: string[];
  ai: ToolAi;
  focus: ToolFocus;
  /** The kinds of business it is built for. Empty when it is meant for any business. */
  trades: BusinessType[];
  /** Setup steps and rules, when public pages confirmed them. */
  guide?: ToolGuide;
  categoryId: string;
  subcategoryId: string;
  /** Other needs it serves, as "categoryId/subcategoryId". */
  secondary?: string[];
  pricing: ToolPricing;
  /** Languages confirmed from a cited page. English names. */
  languages: string[];
  languagesSourceUrl?: string;
  /** A stated total such as "130+ languages", when the page gives one. */
  languagesTotal?: string;
  /** Products it connects with, confirmed from a cited page. */
  integrations: string[];
  /** The app marketplace page proving a connection, by product name. */
  integrationSources?: Record<string, string>;
  platforms: string[];
  reviews: ReviewSummary;
  environmental: EnvironmentalEstimate;
  scores: ToolScores;
  setupMinutes: number;
  selfServe: boolean;
  howToStart: string;
  lastChecked: string;
  /** catalog = researched ahead of time. live = found by web search for this visitor. */
  source: "catalog" | "live";
  caution?: string;
  /** Nonprofit or government help, which review sites do not measure fairly. */
  publicResource?: boolean;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  /** Everyday phrases that map to this category. */
  keywords: string[];
}

export interface Subcategory {
  id: string;
  name: string;
  keywords: string[];
  description: string;
}

export interface Bundle {
  slug: string;
  name: string;
  tagline: string;
  forWho: string;
  toolSlugs: string[];
  /** What the owner should know that the compatibility check cannot tell them. */
  note?: string;
}

export interface Suggestion {
  categoryId: string;
  subcategoryId?: string;
  label: string;
  reason: string;
  confidence: number;
}

export interface SavedTool {
  slug: string;
  addedAt: string;
  myRating?: number;
  note?: string;
  inUse: boolean;
  /** Filled in by the owner when they pay for this tool. */
  subscription?: Subscription;
}

export interface Subscription {
  monthlyUsd: number;
  /** ISO date of the next charge, if the owner knows it. */
  renewsOn?: string;
  /** ISO date a free trial turns into a charge. */
  trialEndsOn?: string;
}

/** Optional answers that make recommendations fit this business. */
export interface BusinessProfile {
  type: BusinessType | "";
  size: TeamSize;
}

/** What the browser stores locally. No account and no server copy. */
export interface UserData {
  version: 1;
  /** The language this owner works in, used to check each tool. */
  language: string;
  savedTools: Record<string, SavedTool>;
  business: BusinessProfile;
  /** Software the business already runs, such as QuickBooks or Square. */
  alreadyUse: string[];
  /** Snapshots of saved or discovered tools, so their pages work offline. */
  toolCache: Record<string, Tool>;
}
