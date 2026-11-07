import { z } from "zod";
import { buildScores, environmentalEstimate, inferPriceKind } from "./scoring";
import type { Tool, Workload } from "./types";

/**
 * Validates what the model returns for live discovery, then builds a Tool.
 * Output from a model reading the open web is untrusted: every field is length
 * limited, URLs are restricted to https, and React escapes all text at render.
 */
const WORKLOAD_VALUES = ["none", "background-ml", "optional-genai", "translation", "llm-every-reply", "speech", "voice-agent", "image-video"] as const;

export const DISCOVERED_TOOL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name", "website", "summary", "helpsWith", "startingMonthlyUsd", "pricingModel", "priceKind", "pricingNote", "extraFees",
    "languages", "integrations", "platforms", "workload", "setupMinutes", "selfServe", "howToStart", "caution",
  ],
  properties: {
    name: { type: "string" },
    website: { type: "string", description: "Official https URL" },
    summary: { type: "string", description: "One or two plain sentences, no jargon, no marketing words" },
    helpsWith: { type: "array", items: { type: "string" }, description: "2 to 4 short, concrete things it does for a small business" },
    startingMonthlyUsd: { type: "number", description: "Lowest monthly USD price that unlocks real business use. Use 0 only if the free plan may be used by a business, or if there is no subscription at all." },
    priceKind: { type: "string", enum: ["free", "free-plan", "no-monthly-fee", "you-set-budget", "monthly"], description: "free: no charge at all. free-plan: a usable free plan for business use, with paid plans above it. no-monthly-fee: no subscription, but it charges per sale or per use. you-set-budget: you choose how much to spend, such as ads. monthly: a paid plan is required." },
    pricingModel: { type: "string", enum: ["free", "freemium", "paid", "trial"] },
    pricingNote: { type: "string", description: "One plain sentence naming the real plans and prices" },
    extraFees: { type: ["string", "null"], description: "Transaction, per-employee, hardware or setup fees, or null" },
    languages: { type: "array", items: { type: "string" }, description: "Languages the product itself works in, English names, only if named in the results" },
    integrations: { type: "array", items: { type: "string" }, description: "Other products it connects with, by exact name, only if named in the results" },
    platforms: { type: "array", items: { type: "string", enum: ["web", "ios", "android", "desktop", "phone", "pos-hardware"] } },
    workload: {
      type: "string",
      enum: WORKLOAD_VALUES,
      description:
        "none: no AI. background-ml: small models sort or rank in the background. optional-genai: normal software with AI only when asked. translation: translation models. llm-every-reply: a large language model on every reply. speech: generates voice audio. image-video: generates pictures or video. voice-agent: AI answers phone calls.",
    },
    setupMinutes: { type: "integer", description: "Minutes for a first-time, non-technical user to get going" },
    selfServe: { type: "boolean", description: "True if you can sign up alone, false if you must talk to sales" },
    howToStart: { type: "string", description: "One sentence: how to sign up or buy" },
    caution: { type: ["string", "null"], description: "Important warning: contracts, eligibility limits, billing surprises, or null" },
  },
} as const;

export const DISCOVERY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tools"],
  properties: { tools: { type: "array", items: DISCOVERED_TOOL_JSON_SCHEMA } },
} as const;

const DiscoveredTool = z.object({
  name: z.string().min(1).max(80),
  website: z.string().max(300),
  summary: z.string().min(1).max(400),
  helpsWith: z.array(z.string().max(160)).max(6),
  startingMonthlyUsd: z.number().min(0).max(100_000),
  pricingModel: z.enum(["free", "freemium", "paid", "trial"]),
  priceKind: z.enum(["free", "free-plan", "no-monthly-fee", "you-set-budget", "monthly"]).optional(),
  pricingNote: z.string().max(400),
  extraFees: z.string().max(400).nullable(),
  languages: z.array(z.string().max(40)).max(300),
  integrations: z.array(z.string().max(60)).max(60),
  platforms: z.array(z.string().max(20)).max(8),
  workload: z.enum(WORKLOAD_VALUES),
  setupMinutes: z.number().min(0).max(100_000),
  selfServe: z.boolean(),
  howToStart: z.string().max(400),
  caution: z.string().max(400).nullable(),
});

export const DiscoveryResponse = z.object({ tools: z.array(DiscoveredTool).max(12) });
export type DiscoveredToolInput = z.infer<typeof DiscoveredTool>;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Only ever link to public https addresses. */
export function safeUrl(input: string) {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    if (url.protocol !== "https:") return "";
    const host = url.hostname;
    if (!host.includes(".") || /^[0-9.]+$/.test(host) || host.endsWith(".local")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

const KNOWN_PLATFORMS = new Set(["web", "ios", "android", "desktop", "phone", "pos-hardware"]);

function plain(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
}

export function toTool(
  input: DiscoveredToolInput,
  categoryId: string,
  subcategoryId: string,
  verified: {
    languages: string[];
    integrations: string[];
    priceVerified: boolean;
    reviews: Tool["reviews"];
  },
): Tool | null {
  const slug = slugify(input.name);
  const website = safeUrl(input.website);
  if (!slug || !website) return null;

  const languages = verified.languages.includes("English") ? verified.languages : ["English", ...verified.languages];
  const platforms = input.platforms.filter((p) => KNOWN_PLATFORMS.has(p));
  const environmental = environmentalEstimate(input.workload as Workload);
  const startingMonthlyUsd = Math.round(input.startingMonthlyUsd * 100) / 100;
  const setupMinutes = Math.round(input.setupMinutes);
  const priceKind = input.priceKind ?? inferPriceKind(startingMonthlyUsd, input.pricingModel);

  return {
    slug,
    name: input.name.trim(),
    website,
    summary: plain(input.summary),
    helpsWith: input.helpsWith.map(plain).filter(Boolean).slice(0, 4),
    categoryId,
    subcategoryId,
    pricing: {
      startingMonthlyUsd,
      model: input.pricingModel,
      kind: priceKind,
      note: plain(input.pricingNote),
      extraFees: input.extraFees ? plain(input.extraFees) : undefined,
      verified: verified.priceVerified,
    },
    languages,
    integrations: verified.integrations,
    platforms,
    reviews: verified.reviews,
    environmental,
    scores: buildScores({
      rating: verified.reviews.rating,
      startingMonthlyUsd,
      priceKind,
      languages,
      integrations: verified.integrations,
      setupMinutes,
      platforms,
      selfServe: input.selfServe,
      environment: environmental.score,
    }),
    setupMinutes,
    selfServe: input.selfServe,
    howToStart: plain(input.howToStart),
    lastChecked: new Date().toISOString().slice(0, 10),
    source: "live",
    caution: input.caution ? plain(input.caution) : undefined,
  };
}
