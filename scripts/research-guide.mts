/**
 * Finds what an owner needs in order to actually adopt a tool: its real plans, how to set
 * it up, how to connect existing data and what its rules are. Saved as `guide` in research.json.
 *
 *   node --env-file=.env.local scripts/research-guide.mts            tools not yet done
 *   node --env-file=.env.local scripts/research-guide.mts --force    redo everything
 *   node --env-file=.env.local scripts/research-guide.mts --only=a,b redo these slugs
 *   node --env-file=.env.local scripts/research-guide.mts --limit=5  stop after this many
 *   node --env-file=.env.local scripts/research-guide.mts --reviews-for=a,b  also look up reviews for these new tools
 *
 * A tool with no research yet gets its facts from its own site here, which is cheaper and
 * more reliable for small products than a search engine that has barely indexed them.
 *
 * Same rule as the rest of the research: a plan's price, a policy and a set of steps only
 * count if the text the search engine returned backs them up. Anything else is dropped,
 * and the page says it could not be confirmed.
 */
import fs from "node:fs";
import { SEED_BASE as HAND_WRITTEN } from "../src/data/seed-base.ts";
import {
  REVIEW_DOMAINS,
  REVIEW_SCHEMA,
  REVIEW_SYSTEM,
  cleanResearchText,
  finalizeReviews,
  priceAppears,
  reviewPrompt,
  verifyLanguages,
  verifyNames,
  verifyReviews,
  webJson,
  type Citation,
  type ReviewResponse,
} from "../src/lib/research-core.ts";
import { pagesForPrompt, readPage } from "./own-pages.mts";

const OUT = "src/data/research.json";
const SEED_BASE = [...HAND_WRITTEN, ...JSON.parse(fs.readFileSync("src/data/seed-discovered.json", "utf8"))];
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
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
const reviewsFor = new Set(args.find((a) => a.startsWith("--reviews-for="))?.slice(14).split(",") ?? []);
/** Stops starting new tools once this much has been spent. */
const budget = Number(args.find((a) => a.startsWith("--budget="))?.slice(9) ?? 3);

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["plans", "trial", "paywall"],
  properties: {
    plans: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "monthlyUsd", "per", "includes"],
        properties: {
          name: { type: "string", description: "The plan's name exactly as the company writes it" },
          monthlyUsd: { type: "number", description: "US dollars per month, exactly as shown. 0 for a free plan." },
          per: {
            type: "string",
            enum: ["business", "person", "location", "use"],
            description: "business: one price for the whole business. person: a price for each employee or seat. location: a price for each shop. use: charged per message, minute, call or task.",
          },
          includes: { type: "string", description: "Under 15 plain words: the most important thing this plan includes or limits, such as 'up to 10 employees' or '3 minutes a month'" },
        },
      },
    },
    trial: { type: ["string", "null"], description: "One short plain sentence: how long the free trial is and whether a card is needed. Null if the results do not say." },
    paywall: { type: ["string", "null"], description: "One short plain sentence: the most useful thing that needs a paid plan. Null if the results do not say." },
  },
} as const;

interface PlanResponse {
  plans: Array<{ name: string; monthlyUsd: number; per: "business" | "person" | "location" | "use"; includes: string }>;
  trial: string | null;
  paywall: string | null;
}

const GUIDE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["focus", "trades", "accountSteps", "connectSteps", "stepsUrl", "policies", "integrations", "languages"],
  properties: {
    integrations: { type: "array", items: { type: "string" }, description: "Other products it connects with, by exact product name, only if named" },
    languages: { type: "array", items: { type: "string" }, description: "Languages the product itself works in, English names, only if named" },
    focus: {
      type: "string",
      enum: ["trade", "task", "suite", "general"],
      description: "trade: built for one kind of business, such as only restaurants. task: does one specific job without the owner writing instructions, such as answering calls or doing books. suite: broad business software that does many jobs. general: a blank box where the owner must write their own instructions, or an all-purpose chat or design app.",
    },
    trades: {
      type: "array",
      items: { type: "string", enum: ["restaurant", "salon", "retail", "trades", "cleaning"] },
      description: "Only the kinds of business the results say it is built for. trades means HVAC, plumbing, electrical, landscaping or construction. Empty if it is meant for any business.",
    },
    accountSteps: { type: "array", items: { type: "string" }, description: "3 to 5 short steps, each starting with a verb, to create an account and reach first use. Only what the results say. Empty if they do not say." },
    connectSteps: { type: "array", items: { type: "string" }, description: "2 to 4 short steps to bring in the owner's existing data, such as importing customers or linking QuickBooks. Only what the results say. Empty if they do not say." },
    stepsUrl: { type: "string", description: "URL of the result those steps came from, or empty" },
    policies: {
      type: "array",
      description: "Only rules the results state for this exact product.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "say", "quote", "url"],
        properties: {
          kind: {
            type: "string",
            enum: ["cancel", "refund", "contract", "ai-training", "data-export"],
            description: "cancel: how or when you can cancel. refund: whether you get money back. contract: minimum commitment. ai-training: whether customer data is used to train AI. data-export: whether you can take your data with you.",
          },
          say: { type: "string", description: "One short plain sentence for a small business owner" },
          quote: { type: "string", description: "The exact words in the result that back this up, under 25 words" },
          url: { type: "string", description: "URL of that result" },
        },
      },
    },
  },
} as const;

interface GuideResponse {
  focus: "trade" | "task" | "suite" | "general";
  trades: string[];
  accountSteps: string[];
  connectSteps: string[];
  stepsUrl: string;
  policies: Array<{ kind: string; say: string; quote: string; url: string }>;
  integrations: string[];
  languages: string[];
}

function rootDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".").slice(-2).join(".");
  } catch {
    return "";
  }
}

/** Compare words only, because a page's punctuation and line breaks rarely survive being quoted. */
function squeeze(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function samePage(a: string, b: string) {
  const clean = (url: string) => url.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
  return clean(a) === clean(b);
}

function brief(text: string, max = 200) {
  return cleanResearchText(text, max);
}

let totalCost = 0;

function originOf(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

async function researchGuide(tool: (typeof SEED_BASE)[number], officialUrl: string, established: boolean) {
  const common = { apiKey, appUrl, model: MODEL };
  const site = officialUrl?.startsWith("https://") ? officialUrl : tool.website;
  const origin = originOf(site);

  // Read the company's own pages first. Search engines barely index small niche products.
  const [home, pricingPage, plansPage, terms, privacy, help] = await Promise.all(
    [site, `${origin}/pricing`, `${origin}/plans`, `${origin}/terms`, `${origin}/privacy`, `${origin}/help`].map((url) => readPage(url)),
  );
  const hasPrices = (page: Citation | null) => Boolean(page && /[$]\s?\d|\bfree\b/i.test(page.content));
  const priceSource = [pricingPage, plansPage, home].find(hasPrices) ?? null;
  const ownPages = [home, help, terms, privacy].filter((p): p is Citation => p !== null);
  // Help pages for established products are well indexed. For small ones, their own site is the better source.
  const searchForGuide = established || ownPages.length === 0;

  const [pricing, guide] = await Promise.all([
    webJson<PlanResponse>({
      ...common,
      web: !priceSource,
      system:
        "You read a software product's pricing from the search results or company pages provided. Report only plans and prices shown for this exact product, in US dollars. Prefer the company's own pricing page. List every plan up to 5, cheapest first, and use the month-by-month price when both are shown. Do not invent plans, and leave out custom or 'contact us' plans. Use short, plain words. Do not mention search results or sources.",
      user: `"${tool.name}" (${site}) pricing page: every plan name, price per month, what each plan includes, free trial, what needs a paid plan.${priceSource ? `\n\n${pagesForPrompt([priceSource])}` : ""}`,
      schemaName: "plans",
      schema: PLAN_SCHEMA,
      maxResults: 5,
      maxTokens: 900,
    }),
    webJson<GuideResponse>({
      ...common,
      web: searchForGuide,
      system:
        "You read a software product's help pages, terms and privacy policy from the search results or company pages provided, for a small business owner who is not comfortable with technology and may have limited English. Report only what they say about this exact product. An empty list is a correct answer. Use short, plain words and no marketing language. Do not mention search results or sources.",
      user: `"${tool.name}" (${site}) getting started: create an account, import data, connect integrations. Cancel subscription, refund policy, contract terms, whether customer data trains AI, export data.${searchForGuide ? "" : `\n\n${pagesForPrompt(ownPages)}`}`,
      schemaName: "guide",
      schema: GUIDE_SCHEMA,
      maxResults: 6,
      maxTokens: 1100,
    }),
  ]);
  totalCost += pricing.cost + guide.cost;
  if (priceSource) pricing.citations = [priceSource];
  if (!searchForGuide) guide.citations = ownPages;

  const domains = [rootDomain(tool.website), rootDomain(site)].filter(Boolean);
  const onVendor = (url: string) => domains.includes(rootDomain(url));
  const vendorPages = (list: Citation[]) => {
    const own = list.filter((c) => onVendor(c.url));
    return own.length ? own : list;
  };

  const priceText = vendorPages(pricing.citations);
  const plans = pricing.data.plans
    .filter((plan) => plan.monthlyUsd >= 0 && priceAppears(plan.monthlyUsd, priceText))
    .slice(0, 5)
    .map((plan) => ({ name: plan.name.trim().slice(0, 40), monthlyUsd: Math.round(plan.monthlyUsd * 100) / 100, per: plan.per, includes: brief(plan.includes, 120) }));

  const stepsPage = guide.citations.find((c) => samePage(c.url, guide.data.stepsUrl) && onVendor(c.url));
  const policies = guide.data.policies.flatMap((policy) => {
    const page = guide.citations.find((c) => samePage(c.url, policy.url));
    if (!page || !policy.quote.trim()) return [];
    if (!squeeze(`${page.title} ${page.content}`).includes(squeeze(policy.quote))) return [];
    const say = brief(policy.say, 180);
    return say ? [{ kind: policy.kind, say, url: onVendor(page.url) ? page.url : "" }] : [];
  });

  return {
    checkedAt: new Date().toISOString().slice(0, 10),
    focus: guide.data.focus,
    trades: guide.data.trades,
    plans,
    trial: pricing.data.trial ? brief(pricing.data.trial, 160) : "",
    paywall: pricing.data.paywall ? brief(pricing.data.paywall, 160) : "",
    accountSteps: stepsPage ? guide.data.accountSteps.map((s) => brief(s, 160)).filter(Boolean).slice(0, 5) : [],
    connectSteps: stepsPage ? guide.data.connectSteps.map((s) => brief(s, 160)).filter(Boolean).slice(0, 4) : [],
    stepsUrl: stepsPage?.url ?? "",
    policies,
    priceUrl: priceSource?.url ?? pricing.citations.find((c) => onVendor(c.url))?.url ?? "",
    integrations: verifyNames(guide.data.integrations, guide.citations).filter((n) => n.toLowerCase() !== tool.name.toLowerCase()),
    languages: verifyLanguages(guide.data.languages, guide.citations),
  };
}

/** A tool from the deep search has no research yet. It counts as unconfirmed until its own pricing page is read. */
async function startEntry(tool: (typeof SEED_BASE)[number]) {
  let reviews: Record<string, unknown> = { rating: null, reviewCount: 0, summary: "", sources: [], claimed: 0 };
  if (reviewsFor.has(tool.slug)) {
    const found = await webJson<ReviewResponse>({
      apiKey,
      appUrl,
      model: MODEL,
      web: true,
      system: REVIEW_SYSTEM,
      user: reviewPrompt(tool.name, tool.website),
      schemaName: "reviews",
      schema: REVIEW_SCHEMA,
      includeDomains: REVIEW_DOMAINS,
      maxResults: 6,
      maxTokens: 1000,
    });
    totalCost += found.cost;
    const final = finalizeReviews(verifyReviews(tool.name, found.data.evidence, found.citations, [tool.website]), [tool.website]);
    reviews = { ...final, summary: final.rating === null ? "" : brief([found.data.praise, found.data.complaints].join(" "), 480), claimed: found.data.evidence.length };
  }
  const listed = (tool.listedIn ?? []) as Array<{ system: string; url: string }>;
  return {
    checkedAt: new Date().toISOString().slice(0, 10),
    exists: false,
    currentName: tool.name,
    officialUrl: tool.website,
    reviews,
    pricing: { startingMonthlyUsd: tool.draftPricing.startingMonthlyUsd, model: tool.draftPricing.model, note: tool.draftPricing.note, extraFees: null, sourceUrl: "", verified: false },
    languages: { list: [] as string[], claimed: 0, sourceUrl: "", totalClaim: null },
    integrations: listed.map((l) => l.system),
    ...(listed.length ? { integrationSources: Object.fromEntries(listed.map((l) => [l.system, l.url])) } : {}),
    caution: null,
    description: { confirmed: true, discontinued: false, summary: tool.summary, helpsWith: tool.helpsWith, howToStart: tool.howToStart },
  };
}

async function main() {
  const store = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const queue = SEED_BASE.filter((t) => !t.publicResource && (only ? only.has(t.slug) : force || !store.tools[t.slug]?.guide)).slice(0, limit);
  console.log(`Researching guides for ${queue.length} tools with ${MODEL}`);

  const save = () => {
    const text = `${JSON.stringify(store, null, 1)}\n`;
    for (let attempt = 0; ; attempt++) {
      try {
        fs.writeFileSync(OUT, text);
        return;
      } catch (err) {
        if (attempt >= 8) throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
      }
    }
  };

  let index = 0;
  const failed: string[] = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (index < queue.length && totalCost < budget) {
        const tool = queue[index++];
        try {
          store.tools[tool.slug] ??= await startEntry(tool);
          const entry = store.tools[tool.slug];
          const { priceUrl, integrations, languages, ...guide } = await researchGuide(tool, entry.officialUrl, entry.reviews?.rating != null);
          entry.guide = guide;
          entry.integrations = [...new Set([...(entry.integrations ?? []), ...integrations])];
          entry.languages.list = [...new Set([...entry.languages.list, ...languages])];
          // The search found nothing, but the company's own pricing page shows a real product for sale.
          if (entry.exists === false && guide.plans.length > 0 && priceUrl) {
            const first = guide.plans[0];
            entry.exists = true;
            entry.officialUrl ||= tool.website;
            entry.pricing = {
              ...entry.pricing,
              startingMonthlyUsd: first.monthlyUsd,
              model: first.monthlyUsd === 0 ? "freemium" : "paid",
              kind: first.monthlyUsd === 0 ? "free-plan" : "monthly",
              note: guide.plans.map((p) => (p.monthlyUsd === 0 ? `${p.name}: free` : `${p.name}: $${p.monthlyUsd} a month`)).join(". "),
              sourceUrl: priceUrl,
              verified: true,
            };
          }
          save();
          console.log(`${tool.slug.padEnd(26)} ${guide.focus.padEnd(8)} plans=${guide.plans.length} steps=${guide.accountSteps.length}/${guide.connectSteps.length} rules=${guide.policies.length} ${guide.trades.join(",")}`);
        } catch (err) {
          failed.push(tool.slug);
          console.error(`${tool.slug}: ${err instanceof Error ? err.message : "failed"}`);
        }
      }
    }),
  );
  console.log(`Done. Cost about $${totalCost.toFixed(3)}.${failed.length ? ` Failed: ${failed.join(", ")}` : ""}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
