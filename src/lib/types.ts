/**
 * Core data model. Every tool, whether from the starter catalog or found by live
 * search, is normalized to `Tool`, so pages never care where a record came from.
 */

export type PricingModel = "free" | "freemium" | "paid" | "trial";

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

export interface ToolPricing {
  /** Lowest monthly price in USD that unlocks real use. 0 means a free plan exists. */
  startingMonthlyUsd: number;
  model: PricingModel;
  note: string;
  /** Transaction, per-employee or hardware fees, shown so nothing is hidden. */
  extraFees?: string;
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
}

/** What the browser stores locally. No account and no server copy. */
export interface UserData {
  version: 1;
  /** The language this owner works in, used to check each tool. */
  language: string;
  savedTools: Record<string, SavedTool>;
  /** Software the business already runs, such as QuickBooks or Square. */
  alreadyUse: string[];
  /** Snapshots of saved or discovered tools, so their pages work offline. */
  toolCache: Record<string, Tool>;
}
