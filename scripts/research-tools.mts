/**
 * Researches every tool in the starter catalog with live web search and writes
 * src/data/research.json. Every rating, price, language and integration is checked
 * against the text the search engine returned; anything unbacked is dropped.
 *
 *   node --env-file=.env.local scripts/research-tools.mts            research tools not yet done
 *   node --env-file=.env.local scripts/research-tools.mts --force    redo everything
 *   node --env-file=.env.local scripts/research-tools.mts --only=a,b redo these slugs
 *   node --env-file=.env.local scripts/research-tools.mts --new      also find recently launched tools
 *   node --env-file=.env.local scripts/research-tools.mts --describe rewrite descriptions from cited pages
 *
 * Costs about $0.02 per tool. Run it on a schedule to keep the catalog fresh.
 */
import fs from "node:fs";
import path from "node:path";
import { SEED_BASE } from "../src/data/seed-base.ts";
import {
  REVIEW_DOMAINS,
  REVIEW_SCHEMA,
  REVIEW_SYSTEM,
  cleanResearchText,
  finalizeReviews,
  htmlToText,
  languagesInPage,
  priceAppears,
  reviewPrompt,
  verifyLanguages,
  verifyNames,
  verifyReviews,
  webJson,
  type ReviewResponse,
} from "../src/lib/research-core.ts";

const OUT = path.resolve("src/data/research.json");
const MODEL = process.env.OPENROUTER_SEARCH_MODEL || "anthropic/claude-haiku-5.5";
const apiKey = process.env.OPENROUTER_API_KEY ?? "";
const appUrl = process.env.APP_URL || "http://localhost:3000";
if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice(7).split(",")) : null;
const wantNew = args.includes("--new");
const wantDescribe = args.includes("--describe");

const FACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["exists", "currentName", "officialUrl", "startingMonthlyUsd", "pricingModel", "pricingNote", "extraFees", "pricingUrl", "integrations", "caution"],
  properties: {
    exists: { type: "boolean", description: "False if the product was shut down or the results do not confirm it exists" },
    currentName: { type: "string", description: "Current product name, which may differ if it was renamed" },
    officialUrl: { type: "string" },
    startingMonthlyUsd: { type: "number", description: "Lowest monthly US dollar price that unlocks real use, 0 if a usable free plan exists. Yearly prices divided by 12." },
    pricingModel: { type: "string", enum: ["free", "freemium", "paid", "trial"] },
    pricingNote: { type: "string", description: "One plain sentence with the real plan names and prices from the results" },
    extraFees: { type: ["string", "null"], description: "Transaction, per-employee, hardware or setup fees from the results, or null" },
    pricingUrl: { type: "string", description: "URL of the result showing the price, or empty" },
    integrations: { type: "array", items: { type: "string" }, description: "Other products it connects with, by exact product name, only if named in the results" },
    caution: { type: ["string", "null"], description: "Important warning from the results: contracts, eligibility limits, known billing surprises. Otherwise null." },
  },
} as const;

interface FactResponse {
  exists: boolean;
  currentName: string;
  officialUrl: string;
  startingMonthlyUsd: number;
  pricingModel: "free" | "freemium" | "paid" | "trial";
  pricingNote: string;
  extraFees: string | null;
  pricingUrl: string;
  integrations: string[];
  caution: string | null;
}

const LANGUAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["languages", "sourceUrl", "totalClaim"],
  properties: {
    languages: { type: "array", items: { type: "string" }, description: "Languages the product itself works in, English names, only if named in the results" },
    sourceUrl: { type: "string", description: "URL of the result listing the languages, or empty" },
    totalClaim: { type: ["string", "null"], description: "A stated total such as '130+ languages', or null" },
  },
} as const;

interface LanguageResponse {
  languages: string[];
  sourceUrl: string;
  totalClaim: string | null;
}

let totalCost = 0;

/** Drop markdown links and stray references to where a fact came from. */
function plainText(text: string) {
  return cleanResearchText(text);
}

/** A source link is only shown when it is on the vendor's own site. */
function trustedSource(url: string, ...official: string[]) {
  const root = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "").split(".").slice(-2).join(".");
    } catch {
      return "";
    }
  };
  const host = root(url);
  return host && official.some((o) => root(o) === host) ? url : "";
}

/** Read the vendor's language page directly: snippets are too short to hold a full list. */
async function readLanguagePage(url: string): Promise<string[]> {
  if (!url.startsWith("https://")) return [];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ImmigrAI-research/0.1", Accept: "text/html" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return [];
    return languagesInPage(htmlToText((await res.text()).slice(0, 1_500_000)));
  } catch {
    return [];
  }
}

async function researchTool(tool: (typeof SEED_BASE)[number]) {
  const common = { apiKey, appUrl, model: MODEL, web: true as const };

  const [reviews, facts, langs] = await Promise.all([
    webJson<ReviewResponse>({
      ...common,
      system: REVIEW_SYSTEM,
      user: reviewPrompt(tool.name, tool.website),
      schemaName: "reviews",
      schema: REVIEW_SCHEMA,
      includeDomains: REVIEW_DOMAINS,
      maxResults: 10,
      maxTokens: 1500,
    }),
    webJson<FactResponse>({
      ...common,
      system:
        "You check facts about a software product from web search results. Report only what the results say. Prefer the vendor's own pricing page. If a price is not in the results, say so in the note and use your best reading of the results without inventing a number. Write plain, simple English with no marketing words. Do not mention search results, sources or links in your text.",
      user: `"${tool.name}" (${tool.website}) pricing plans cost per month for a small US business, free plan, fees, and which apps it integrates with.`,
      schemaName: "facts",
      schema: FACT_SCHEMA,
      maxResults: 6,
      maxTokens: 1200,
    }),
    webJson<LanguageResponse>({
      ...common,
      system:
        "You list the languages a software product supports from web search results. List every language named in the results for this product's own app or website, not just common ones. sourceUrl must be the most complete list you can see, preferably the vendor's own help page. Never guess. An empty list is a correct answer.",
      user: `${tool.name} (${tool.website}) complete list of supported languages, help center: what languages is it available in?`,
      schemaName: "languages",
      schema: LANGUAGE_SCHEMA,
      maxResults: 6,
      maxTokens: 3000,
    }),
  ]);
  totalCost += reviews.cost + facts.cost + langs.cost;

  const { sources, rating, reviewCount } = finalizeReviews(
    verifyReviews(tool.name, reviews.data.evidence, reviews.citations),
    [tool.website, facts.data.officialUrl],
  );
  const summary = rating === null ? "" : [reviews.data.praise, reviews.data.complaints].map(plainText).filter(Boolean).join(" ");
  const snippetLanguages = verifyLanguages(langs.data.languages, langs.citations);
  const languageSource = trustedSource(langs.data.sourceUrl, tool.website, facts.data.officialUrl);
  const pageLanguages = await readLanguagePage(languageSource);
  const languages = [...new Set([...pageLanguages, ...snippetLanguages])];
  const integrations = verifyNames(facts.data.integrations, facts.citations).filter(
    (n) => n.toLowerCase() !== tool.name.toLowerCase(),
  );
  const priceVerified = priceAppears(facts.data.startingMonthlyUsd, facts.citations);

  return {
    checkedAt: new Date().toISOString().slice(0, 10),
    exists: facts.data.exists,
    currentName: facts.data.currentName,
    officialUrl: facts.data.officialUrl,
    reviews: {
      rating,
      reviewCount,
      summary,
      sources,
      claimed: reviews.data.evidence.length,
    },
    pricing: {
      startingMonthlyUsd: facts.data.startingMonthlyUsd,
      model: facts.data.pricingModel,
      note: plainText(facts.data.pricingNote),
      extraFees: facts.data.extraFees ? plainText(facts.data.extraFees) : null,
      sourceUrl: trustedSource(facts.data.pricingUrl, tool.website, facts.data.officialUrl),
      verified: priceVerified,
    },
    languages: {
      list: languages,
      claimed: langs.data.languages.length,
      sourceUrl: languageSource,
      totalClaim: langs.data.totalClaim,
    },
    integrations,
    caution: facts.data.caution ? plainText(facts.data.caution) : null,
  };
}

async function main() {
  const store: { generatedAt: string; model: string; tools: Record<string, unknown>; newTools?: unknown[] } = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : { generatedAt: "", model: MODEL, tools: {} };

  const queue = SEED_BASE.filter((t) => (only ? only.has(t.slug) : force || !store.tools[t.slug]));
  console.log(`Researching ${queue.length} of ${SEED_BASE.length} tools with ${MODEL}`);

  const save = () => {
    store.generatedAt = new Date().toISOString();
    store.model = MODEL;
    fs.writeFileSync(OUT, `${JSON.stringify(store, null, 1)}\n`);
  };

  let index = 0;
  const failed: string[] = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (index < queue.length) {
        const tool = queue[index++];
        try {
          const result = await researchTool(tool);
          store.tools[tool.slug] = result;
          save();
          console.log(
            `${tool.slug.padEnd(26)} rating=${String(result.reviews.rating).padEnd(5)} sites=${result.reviews.sources.length}/${result.reviews.claimed} price=$${result.pricing.startingMonthlyUsd}${result.pricing.verified ? "" : "?"} langs=${result.languages.list.length}/${result.languages.claimed} links=${result.integrations.length}${result.exists ? "" : " MISSING"}`,
          );
        } catch (err) {
          failed.push(tool.slug);
          console.error(`${tool.slug}: ${err instanceof Error ? err.message : "failed"}`);
        }
      }
    }),
  );

  if (wantDescribe) {
    let next = 0;
    const list = SEED_BASE.filter((t) => store.tools[t.slug] && (force || !(store.tools[t.slug] as { description?: unknown }).description));
    console.log(`Describing ${list.length} tools`);
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (next < list.length) {
          const tool = list[next++];
          try {
            (store.tools[tool.slug] as { description?: unknown }).description = await describeTool(tool);
            save();
            console.log(`described ${tool.slug}`);
          } catch (err) {
            failed.push(tool.slug);
            console.error(`${tool.slug}: ${err instanceof Error ? err.message : "failed"}`);
          }
        }
      }),
    );
  }
  if (wantNew) await findNewTools(store);
  save();
  console.log(`Done. Cost about $${totalCost.toFixed(3)}.${failed.length ? ` Failed: ${failed.join(", ")}` : ""}`);
}

const DESCRIBE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "helpsWith", "howToStart", "confirmed", "discontinued"],
  properties: {
    summary: { type: "string", description: "One or two plain sentences on what it does for a small business" },
    helpsWith: { type: "array", items: { type: "string" }, description: "2 to 4 short, concrete things it does, each confirmed in the results" },
    howToStart: { type: "string", description: "One sentence: how someone starts using it" },
    confirmed: { type: "boolean", description: "False if the results say too little about this product to describe it" },
    discontinued: { type: "boolean", description: "True if the results say this product was shut down or is being discontinued" },
  },
} as const;

/** Rewrite a tool's description using only what cited pages say about it. */
async function describeTool(tool: (typeof SEED_BASE)[number]) {
  const { data, cost } = await webJson<{ summary: string; helpsWith: string[]; howToStart: string; confirmed: boolean; discontinued: boolean }>({
    apiKey,
    appUrl,
    model: MODEL,
    web: true,
    system:
      "You describe a software product or public resource for a small business owner who is not comfortable with technology and may have limited English. Use only what the search results say about this exact product. Remove any claim in the draft the results do not support, and correct anything that is out of date. Do not state prices, plan limits or numbers of languages: other parts of the page show those. Use short, plain words and no marketing language. Do not mention search results or sources.",
    user: `${tool.name} (${tool.website}) what it does, main features for a small business, how to sign up.\n\nDraft to check:\nSummary: ${tool.summary}\nHelps with: ${tool.helpsWith.join("; ")}\nHow to start: ${tool.howToStart}`,
    schemaName: "description",
    schema: DESCRIBE_SCHEMA,
    maxResults: 6,
    maxTokens: 700,
  });
  totalCost += cost;
  if (!data.confirmed) return { confirmed: false, discontinued: data.discontinued };
  return {
    confirmed: true,
    discontinued: data.discontinued,
    summary: plainText(data.summary),
    helpsWith: data.helpsWith.map(plainText).filter(Boolean).slice(0, 4),
    howToStart: plainText(data.howToStart),
  };
}

async function findNewTools(store: { newTools?: unknown[] }) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["tools"],
    properties: {
      tools: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "website", "summary", "launched", "startingMonthlyUsd", "categoryHint"],
          properties: {
            name: { type: "string" },
            website: { type: "string", description: "The product's own website, not a news article" },
            summary: { type: "string", description: "One plain sentence: what it does for a small business" },
            launched: { type: "string", description: "Launch month and year as stated in the results, or empty if not stated" },
            startingMonthlyUsd: { type: "number" },
            categoryHint: { type: "string", description: "What need it serves, in two or three plain words" },
          },
        },
      },
    },
  } as const;
  const found = new Map<string, { name: string; website: string; summary: string; launched: string; startingMonthlyUsd: number; categoryHint: string }>();
  for (const trade of ["restaurants and cafes", "salons and barbershops", "retail shops", "home service trades such as HVAC and plumbing"]) {
    const { data, citations, cost } = await webJson<{ tools: Array<typeof found extends Map<string, infer V> ? V : never> }>({
      apiKey,
      appUrl,
      model: MODEL,
      web: true,
      system:
        "You find recently launched, low-cost AI tools for small US businesses. Use only products named in the search results, sold in the United States, usable without technical skills. Leave launched empty if the results do not state a launch date. Do not mention search results or sources in your text.",
      user: `New AI tool launched in 2026 for small ${trade} in the United States, free plan or low monthly price`,
      schemaName: "new_tools",
      schema,
      maxResults: 8,
      maxTokens: 2500,
    });
    totalCost += cost;
    for (const tool of data.tools) {
      if (tool.launched && /2026/.test(tool.launched) && verifyNames([tool.name], citations).length > 0 && tool.website.startsWith("https://")) {
        found.set(tool.name.toLowerCase(), { ...tool, summary: plainText(tool.summary) });
      }
    }
  }
  store.newTools = [...found.values()].slice(0, 8).map((t) => ({ ...t, checkedAt: new Date().toISOString().slice(0, 10) }));
  console.log(`New tools with a stated 2026 launch: ${found.size}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
