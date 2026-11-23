import { cleanResearchText, finalizeReviews, isProductSite, isRealConnection, officialAddresses } from "@/lib/research-core";
import { buildScores, environmentalEstimate, inferPriceKind } from "@/lib/scoring";
import type { AiLevel, BusinessType, PersonCheck, PriceKind, PricePlan, PricingModel, ScoreBasis, Tool, ToolFocus, ToolPolicy, Workload } from "@/lib/types";
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
  languages: {
    list: string[];
    sourceUrl: string;
    totalClaim: string | null;
    /** The Languages field of the tool's US App Store listing, which Apple fills in from the app. */
    store?: { list: string[]; sourceUrl: string; appName: string; checkedAt: string };
  };
  integrations: string[];
  integrationSources?: Record<string, string>;
  caution: string | null;
  ai?: { level: string; feature: string };
  description?: { confirmed: boolean; discontinued?: boolean; summary?: string; helpsWith?: string[]; howToStart?: string };
  guide?: {
    checkedAt: string;
    focus: ToolFocus;
    trades: BusinessType[];
    plans: PricePlan[];
    trial: string;
    paywall: string;
    accountSteps: string[];
    connectSteps: string[];
    stepsUrl: string;
    policies: ToolPolicy[];
  };
}

/**
 * Checked by hand, because a page that mentions restaurants does not make a product a
 * restaurant product. Wins over research. These are accuracy fixes, and each tool's page says
 * a person checked it, so the human judgement in the score is out in the open.
 */
const FOCUS_OVERRIDE: Record<string, { focus: ToolFocus; trades?: BusinessType[] }> = {
  chatgpt: { focus: "general", trades: [] },
  canva: { focus: "general", trades: [] },
  "google-sheets": { focus: "general", trades: [] },
  "google-translate": { focus: "task", trades: [] },
  deepl: { focus: "task", trades: [] },
  homebase: { focus: "task", trades: [] },
  connecteam: { focus: "task", trades: [] },
  buffer: { focus: "task", trades: [] },
  elevenlabs: { focus: "task", trades: [] },
  "google-business-profile": { focus: "task", trades: [] },
  "whatsapp-business": { focus: "task", trades: [] },
  nextdoor: { focus: "task", trades: [] },
  citizen: { focus: "task", trades: [] },
  bitwarden: { focus: "task", trades: [] },
  "grow-with-google": { focus: "task", trades: [] },
  quizlet: { focus: "task", trades: [] },
  duolingo: { focus: "task", trades: [] },
  "dynatax-ai": { focus: "task", trades: [] },
  "rightresponse-ai": { focus: "task", trades: [] },
  // Sold to any business. Their pages only mention these trades as examples.
  "square-pos": { focus: "task", trades: [] },
  "square-appointments": { focus: "task", trades: [] },
  "paypal-zettle": { focus: "task", trades: [] },
  paybrain: { focus: "task", trades: [] },
  "cpos-pay": { focus: "task", trades: [] },
  complystack: { focus: "task", trades: [] },
  bonnie: { focus: "task", trades: [] },
  adsimple: { focus: "task", trades: [] },
  poof: { focus: "task", trades: [] },
  ahoya: { focus: "task", trades: [] },
  tabby: { focus: "task", trades: [] },
  manabiq: { focus: "task", trades: [] },
  "daber-ai": { focus: "task", trades: [] },
  askhrai: { focus: "task", trades: [] },
  hrdocket: { focus: "task", trades: [] },
  opinas: { focus: "task", trades: [] },
  upfirst: { focus: "task", trades: [] },
  xenia: { focus: "task", trades: [] },
  "simplybook-me": { focus: "task", trades: [] },
  "voka-ai": { focus: "task", trades: [] },
  aira: { focus: "task", trades: [] },
  ringdesk: { focus: "task", trades: [] },
  ringowl: { focus: "task", trades: [] },
  ledgend: { focus: "task", trades: [] },
  minicart: { focus: "task", trades: [] },
  copper: { focus: "task", trades: [] },
  reviewflo: { focus: "task", trades: [] },
  gatherup: { focus: "task", trades: [] },
  dave: { focus: "trade", trades: ["trades"] },
  servflo: { focus: "trade", trades: ["trades"] },
  fieldkrew: { focus: "trade", trades: ["trades", "cleaning"] },
  "smart-service": { focus: "trade", trades: ["trades"] },
  cendorvia: { focus: "trade", trades: ["trades"] },
  "fixlify-ai": { focus: "trade", trades: ["trades"] },
  servicem8: { focus: "trade", trades: ["trades"] },
  maidpilot: { focus: "trade", trades: ["cleaning"] },
  allclean: { focus: "trade", trades: ["cleaning"] },
  cleansyai: { focus: "trade", trades: ["cleaning"] },
  fonitix: { focus: "task", trades: ["restaurant", "salon"] },
  // Built for one kind of business, even when they do several jobs for it.
  "7shifts": { focus: "trade", trades: ["restaurant"] },
  "toast-pos": { focus: "trade", trades: ["restaurant"] },
  fresha: { focus: "trade", trades: ["salon"] },
  faire: { focus: "trade", trades: ["retail"] },
  choco: { focus: "trade", trades: ["restaurant"] },
  darva: { focus: "trade", trades: ["restaurant"] },
  zestia: { focus: "trade", trades: ["restaurant"] },
  nueve: { focus: "trade", trades: ["restaurant"] },
  mays: { focus: "trade", trades: ["restaurant"] },
  netta: { focus: "trade", trades: ["restaurant"] },
  bakeonyx: { focus: "trade", trades: ["restaurant"] },
  maple: { focus: "trade", trades: ["restaurant"] },
  "shire-intelligence": { focus: "trade", trades: ["restaurant"] },
  "per-diem": { focus: "trade", trades: ["restaurant"] },
  "menu-tiger": { focus: "trade", trades: ["restaurant"] },
  ivera: { focus: "trade", trades: ["salon"] },
  salonaix: { focus: "trade", trades: ["salon"] },
  shug: { focus: "trade", trades: ["salon"] },
  lookmybio: { focus: "trade", trades: ["salon"] },
  callpad: { focus: "trade", trades: ["salon"] },
  adminifai: { focus: "trade", trades: ["salon"] },
  frontdeq: { focus: "trade", trades: ["salon"] },
  glossgenius: { focus: "trade", trades: ["salon"] },
  "ooon-ai": { focus: "trade", trades: ["salon"] },
  beautifyx: { focus: "trade", trades: ["salon"] },
  relay: { focus: "trade", trades: ["salon"] },
  bookingbee: { focus: "trade", trades: ["salon"] },
  salonagent: { focus: "trade", trades: ["salon"] },
  ringbooker: { focus: "trade", trades: ["salon"] },
  mutasib: { focus: "trade", trades: ["retail"] },
  octopos: { focus: "trade", trades: ["retail"] },
  hylen: { focus: "trade", trades: ["retail"] },
  "housecall-pro": { focus: "trade", trades: ["trades", "cleaning"] },
  workiz: { focus: "trade", trades: ["trades"] },
  leadtruffle: { focus: "trade", trades: ["trades"] },
  driive: { focus: "trade", trades: ["trades"] },
  convoforms: { focus: "trade", trades: ["trades"] },
  "leadwinner-ai": { focus: "trade", trades: ["trades"] },
  centralcoms: { focus: "trade", trades: ["trades"] },
  handoff: { focus: "trade", trades: ["trades"] },
  adaptlocal: { focus: "trade", trades: ["trades", "cleaning"] },
  "deep-lawn": { focus: "trade", trades: ["trades"] },
  autopilot: { focus: "trade", trades: ["trades", "cleaning"] },
  cleanwork: { focus: "trade", trades: ["cleaning"] },
  proteams: { focus: "trade", trades: ["cleaning"] },
};

/**
 * Kept out of the catalog until a person signs off. The MigraWatch hotline is for reporting
 * enforcement activity, which is exactly what this site refuses to list apps for, so it waits
 * for the legal-aid review in docs/checklists.md.
 */
const HELD_FOR_REVIEW = new Set(["migrawatch"]);

/** In these subcategories a language is only listed when research cited a page for it. */
const SOURCED_LANGUAGES_ONLY = new Set(["know-your-rights"]);

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

/**
 * A new tool is only listed with its own website. A directory, a blog or a press release about
 * it is not that, and a post on its own blog is linked by the site's home page instead.
 */
function ownLink(address: string) {
  try {
    const url = new URL(address);
    if (url.protocol !== "https:" || !isProductSite(address)) return "";
    return /\/(?:blog|news|press|posts?)\//i.test(url.pathname) ? url.origin : address;
  } catch {
    return "";
  }
}

export const NEW_TOOLS: NewToolEntry[] = (research.newTools ?? []).flatMap((tool) => {
  const website = ownLink(tool.website);
  return website ? [{ ...tool, website }] : [];
});

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
  const g = r?.guide;
  const plans = g?.plans.length ? [...g.plans].sort((a, b) => a.monthlyUsd - b.monthlyUsd) : undefined;
  const focusOverride = FOCUS_OVERRIDE[base.slug];
  const focus: ToolFocus = focusOverride?.focus ?? g?.focus ?? (base.trades?.length ? "trade" : "task");
  const trades = focusOverride?.trades ?? [...new Set([...(g?.trades ?? []), ...((base.trades ?? []) as BusinessType[])])];
  // Plans were read from the company's pricing page most recently, so they win over the older single price.
  const planPrice = plans?.[0]?.monthlyUsd;
  const startingMonthlyUsd = override?.startingMonthlyUsd ?? planPrice ?? (r ? r.pricing.startingMonthlyUsd : base.draftPricing.startingMonthlyUsd);
  const model = (override?.model ?? r?.pricing.model ?? base.draftPricing.model) as PricingModel;
  const researchedKind = r?.pricing.kind as PriceKind | undefined;
  const planKind: PriceKind | undefined = planPrice === 0 && (!researchedKind || researchedKind === "monthly") ? "free-plan" : undefined;
  const priceKind = (override?.kind as PriceKind | undefined) ?? (startingMonthlyUsd > 0 ? "monthly" : (planKind ?? (researchedKind && researchedKind !== "monthly" ? researchedKind : inferPriceKind(startingMonthlyUsd, model))));
  const store = r?.languages.store;
  const languageClaimOk = !!r?.languages.sourceUrl || !!store || !SOURCED_LANGUAGES_ONLY.has(base.subcategoryId);
  const found = languageClaimOk ? [...new Set([...(r?.languages.list ?? []), ...(store?.list ?? [])])] : [];
  const languages = found.includes("English") ? found : ["English", ...found];
  // A list read from the company's own language page, or the App Store's own field. Two or more
  // names either way: a page that only says "English" is rarely a language list, and an
  // English-only app is often a companion app, such as an admin app for a web product.
  const languagesChecked = (store?.list.length ?? 0) >= 2 || Boolean(r?.languages.sourceUrl && languageClaimOk && (r?.languages.list.length ?? 0) >= 2);
  const integrations = (r?.integrations ?? []).filter(isRealConnection);
  // Stored evidence passes through the current rules on every build, so tightening a rule
  // takes effect without paying to research everything again.
  const finalReviews = r && !base.publicResource ? finalizeReviews(r.reviews.sources, officialAddresses(base.website, r.officialUrl, base.aliasDomains)) : { sources: [], rating: null, reviewCount: 0 };
  const rating = finalReviews.rating;
  const caution = r?.caution ? cleanResearchText(r.caution, 240) : "";
  const checkedByPerson: PersonCheck[] = [
    ...(focusOverride ? (["focus"] as const) : []),
    ...(override ? (["price"] as const) : []),
    ...(base.aiOverride ? (["ai"] as const) : []),
  ];
  const verified = override?.verified ?? r?.pricing.verified ?? false;
  const priceBasis: ScoreBasis = override ? "person" : plans?.length || verified ? "source" : "estimate";

  return {
    slug: base.slug,
    name: r?.currentName?.trim() || base.name,
    website: r?.officialUrl?.startsWith("https://") ? r.officialUrl : base.website,
    summary: r?.description?.summary || base.summary,
    helpsWith: r?.description?.helpsWith?.length ? r.description.helpsWith : base.helpsWith,
    ai: { level: aiLevel, feature: aiFeature },
    focus,
    trades,
    guide: g ? { accountSteps: g.accountSteps, connectSteps: g.connectSteps, stepsUrl: g.stepsUrl, policies: g.policies, trial: g.trial, paywall: g.paywall } : undefined,
    categoryId: base.categoryId,
    subcategoryId: base.subcategoryId,
    secondary: base.secondary,
    pricing: {
      startingMonthlyUsd,
      model,
      kind: priceKind,
      plans,
      perReturnUsd: override?.perReturnUsd,
      note: override?.note || (r && cleanResearchText(r.pricing.note)) || base.draftPricing.note,
      extraFees: (r ? (r.pricing.extraFees && cleanResearchText(r.pricing.extraFees)) || undefined : base.draftPricing.extraFees),
      sourceUrl: r?.pricing.sourceUrl || undefined,
      verified,
    },
    languages,
    languagesChecked,
    languagesSourceUrl: r?.languages.sourceUrl || store?.sourceUrl || undefined,
    languagesTotal: (languageClaimOk && r?.languages.totalClaim) || undefined,
    integrations,
    integrationSources: r?.integrationSources,
    platforms: base.platforms,
    reviews: {
      rating,
      reviewCount: finalReviews.reviewCount,
      summary: rating === null ? "" : cleanResearchText(r?.reviews.summary ?? "", 480),
      sources: finalReviews.sources,
    },
    environmental,
    scores: buildScores({
      focus,
      focusChecked: Boolean(focusOverride),
      rating,
      reviewCount: finalReviews.reviewCount,
      startingMonthlyUsd,
      priceKind,
      priceBasis,
      languages,
      languagesChecked,
      integrations,
      setupMinutes: base.setupMinutes,
      platforms: base.platforms,
      selfServe: base.selfServe,
    }),
    setupMinutes: base.setupMinutes,
    selfServe: base.selfServe,
    howToStart: r?.description?.howToStart || base.howToStart,
    lastChecked: r?.checkedAt ?? "",
    source: "catalog",
    caution: base.caution ?? (caution || undefined),
    publicResource: base.publicResource,
    checkedByPerson: checkedByPerson.length ? checkedByPerson : undefined,
    aliasDomains: base.aliasDomains,
  };
}

function passesConstraints(tool: Tool, base: SeedBase) {
  if (HELD_FOR_REVIEW.has(base.slug)) return false;
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

/** How much of the catalog a person checked by hand, for the methodology page. Counted, never typed in. */
export const PERSON_CHECKS = {
  tools: SEED_TOOLS.length,
  focus: SEED_TOOLS.filter((t) => t.checkedByPerson?.includes("focus")).length,
  price: SEED_TOOLS.filter((t) => t.checkedByPerson?.includes("price")).length,
  ai: SEED_TOOLS.filter((t) => t.checkedByPerson?.includes("ai")).length,
  any: SEED_TOOLS.filter((t) => t.checkedByPerson?.length).length,
};
