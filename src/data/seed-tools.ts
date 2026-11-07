import { cleanResearchText, finalizeReviews, isRealConnection } from "@/lib/research-core";
import { buildScores, environmentalEstimate, inferPriceKind } from "@/lib/scoring";
import type { AiLevel, PriceKind, PricingModel, Tool, Workload } from "@/lib/types";
import discoveredFile from "./seed-discovered.json";
import researchFile from "./research.json";
import { SEED_BASE, type SeedBase } from "./seed-base";

/**
 * The starter catalog: base facts from seed-base.ts, merged with research.json.
 * Ratings, prices, languages and integrations come only from research, where each
 * was checked against the text of a cited page. Regenerate with scripts/research-tools.mts.
 */

interface ResearchEntry {
  checkedAt: string;
  exists: boolean;
  currentName: string;
  officialUrl: string;
  reviews: {
    rating: number | null;
    reviewCount: number;
    summary: string;
    sources: Array<{ site: string; url: string; rating: number; count: number | null }>;
  };
  pricing: {
    startingMonthlyUsd: number;
    model: string;
    note: string;
    extraFees: string | null;
    sourceUrl: string;
    verified: boolean;
    kind?: string;
  };
  languages: { list: string[]; sourceUrl: string; totalClaim: string | null };
  integrations: string[];
  caution: string | null;
  ai?: { level: string; feature: string };
  description?: { confirmed: boolean; discontinued?: boolean; summary?: string; helpsWith?: string[]; howToStart?: string };
}

export interface NewToolEntry {
  name: string;
  website: string;
  summary: string;
  launched: string;
  startingMonthlyUsd: number;
  categoryHint: string;
  checkedAt: string;
}

const research = researchFile as unknown as {
  generatedAt: string;
  tools: Record<string, ResearchEntry>;
  newTools?: NewToolEntry[];
};

export const RESEARCH_DATE = research.generatedAt ? research.generatedAt.slice(0, 10) : "";
export const NEW_TOOLS: NewToolEntry[] = research.newTools ?? [];

/** Below this average, a tool is left out. The brief: no atrociously bad ratings. */
export const MIN_RATING = 3.5;
/** Above this, a tool is left out. The brief: not overly costly. */
export const MAX_MONTHLY_USD = 150;

function buildTool(base: SeedBase): Tool {
  const r = research.tools[base.slug];
  const aiLevel = (base.aiOverride?.level ?? r?.ai?.level ?? "none") as AiLevel;
  const aiFeature = aiLevel === "none" ? "" : (base.aiOverride?.feature ?? r?.ai?.feature ?? "");
  // The footprint follows what research found the tool really does.
  const declared = base.workload as Workload;
  const workload: Workload = aiLevel !== "none" && declared === "none" ? "optional-genai" : aiLevel === "none" && declared === "optional-genai" ? "none" : declared;
  const environmental = environmentalEstimate(workload);

  const override = base.priceOverride;
  const startingMonthlyUsd = override?.startingMonthlyUsd ?? (r ? r.pricing.startingMonthlyUsd : base.draftPricing.startingMonthlyUsd);
  const model = (override?.model ?? r?.pricing.model ?? base.draftPricing.model) as PricingModel;
  const researchedKind = r?.pricing.kind as PriceKind | undefined;
  const priceKind = (override?.kind as PriceKind | undefined) ?? (startingMonthlyUsd > 0 ? "monthly" : researchedKind && researchedKind !== "monthly" ? researchedKind : inferPriceKind(startingMonthlyUsd, model));
  const languages = r?.languages.list.length
    ? r.languages.list.includes("English")
      ? r.languages.list
      : ["English", ...r.languages.list]
    : ["English"];
  const integrations = (r?.integrations ?? []).filter(isRealConnection);
  // Stored evidence passes through the current rules on every build, so tightening a rule
  // takes effect without paying to research everything again.
  const finalReviews = r && !base.publicResource ? finalizeReviews(r.reviews.sources, [base.website, r.officialUrl]) : { sources: [], rating: null, reviewCount: 0 };
  const rating = finalReviews.rating;
  const caution = r?.caution ? cleanResearchText(r.caution, 240) : "";

  return {
    slug: base.slug,
    name: r?.currentName?.trim() || base.name,
    website: r?.officialUrl?.startsWith("https://") ? r.officialUrl : base.website,
    summary: r?.description?.summary || base.summary,
    helpsWith: r?.description?.helpsWith?.length ? r.description.helpsWith : base.helpsWith,
    ai: { level: aiLevel, feature: aiFeature },
    categoryId: base.categoryId,
    subcategoryId: base.subcategoryId,
    secondary: base.secondary,
    pricing: {
      startingMonthlyUsd,
      model,
      kind: priceKind,
      perReturnUsd: override?.perReturnUsd,
      note: override?.note || (r && cleanResearchText(r.pricing.note)) || base.draftPricing.note,
      extraFees: (r ? (r.pricing.extraFees && cleanResearchText(r.pricing.extraFees)) || undefined : base.draftPricing.extraFees),
      sourceUrl: r?.pricing.sourceUrl || undefined,
      verified: override?.verified ?? r?.pricing.verified ?? false,
    },
    languages,
    languagesSourceUrl: r?.languages.sourceUrl || undefined,
    languagesTotal: r?.languages.totalClaim ?? undefined,
    integrations,
    platforms: base.platforms,
    reviews: {
      rating,
      reviewCount: finalReviews.reviewCount,
      summary: rating === null ? "" : cleanResearchText(r?.reviews.summary ?? "", 480),
      sources: finalReviews.sources,
    },
    environmental,
    scores: buildScores({
      rating,
      startingMonthlyUsd,
      priceKind,
      languages,
      integrations,
      setupMinutes: base.setupMinutes,
      platforms: base.platforms,
      selfServe: base.selfServe,
      environment: environmental.score,
    }),
    setupMinutes: base.setupMinutes,
    selfServe: base.selfServe,
    howToStart: r?.description?.howToStart || base.howToStart,
    lastChecked: r?.checkedAt ?? "",
    source: "catalog",
    caution: base.caution ?? (caution || undefined),
    publicResource: base.publicResource,
  };
}

function passesConstraints(tool: Tool, base: SeedBase) {
  const r = research.tools[base.slug];
  if (r && (!r.exists || r.description?.discontinued)) return false;
  // A tool found while looking for AI tools is only here for its AI.
  if (DISCOVERED_SLUGS.has(base.slug) && tool.ai.level === "none") return false;
  if (tool.pricing.startingMonthlyUsd > MAX_MONTHLY_USD) return false;
  if (tool.reviews.rating !== null && tool.reviews.rating < MIN_RATING) return false;
  return true;
}

const DISCOVERED = discoveredFile as unknown as SeedBase[];
const DISCOVERED_SLUGS = new Set(DISCOVERED.map((t) => t.slug));

const built = [...SEED_BASE, ...DISCOVERED].map((base) => ({ base, tool: buildTool(base) }));

export const SEED_TOOLS: Tool[] = built.filter(({ tool, base }) => passesConstraints(tool, base)).map(({ tool }) => tool);

export const SEED_BY_SLUG = new Map(SEED_TOOLS.map((t) => [t.slug, t]));

export function seedToolsFor(categoryId?: string | null, subcategoryId?: string | null) {
  if (!categoryId) return SEED_TOOLS;
  const key = subcategoryId ? `${categoryId}/${subcategoryId}` : null;
  return SEED_TOOLS.filter((t) => {
    if (key) return (t.categoryId === categoryId && t.subcategoryId === subcategoryId) || (t.secondary ?? []).includes(key);
    return t.categoryId === categoryId || (t.secondary ?? []).some((s) => s.startsWith(`${categoryId}/`));
  });
}
