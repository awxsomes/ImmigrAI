/**
 * Keeps the catalog focused on AI.
 *
 *   node --env-file=.env.local scripts/research-ai.mts --find           find small AI tools for every need
 *   node --env-file=.env.local scripts/research-ai.mts --find --niche   find tools built for one kind of business
 *   node --env-file=.env.local scripts/research-ai.mts --find --deep    search app marketplaces, owner communities and launch sites, then competitors
 *   node --env-file=.env.local scripts/research-ai.mts --check          confirm what each tool's AI does
 *
 * --find adds candidates to src/data/seed-discovered.json. Run research-tools.mts next to
 * research their reviews, prices and languages, and read the list before publishing it.
 * Add --force to --check to redo tools that were already checked.
 */
import fs from "node:fs";
import { SEED_BASE } from "../src/data/seed-base.ts";
import { CATEGORIES, NO_LIVE_DISCOVERY } from "../src/data/taxonomy.ts";
import { appearsIn, cleanResearchText, mentionsAi, siteProblem, verifyNames, webJson, type Citation } from "../src/lib/research-core.ts";
import { pagesForPrompt, readPage } from "./own-pages.mts";

const RESEARCH = "src/data/research.json";
const DISCOVERED = "src/data/seed-discovered.json";
/** Tools a person already looked at and turned down, with the reason. */
const REJECTED = JSON.parse(fs.readFileSync("src/data/seed-rejected.json", "utf8")) as Record<string, string>;
const MODEL = process.env.OPENROUTER_SEARCH_MODEL || "anthropic/claude-haiku-5.5";
const apiKey = process.env.OPENROUTER_API_KEY ?? "";
const appUrl = process.env.APP_URL || "http://localhost:3000";
if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const niche = args.includes("--niche");
const PER_NEED = 3;
let totalCost = 0;

/** Blank-box assistants and all-purpose apps. An owner still has to work out what to ask them. */
const TOO_GENERAL = /^(?:chatgpt|claude|gemini|(?:microsoft )?copilot|perplexity|canva|notion(?: ai)?|grammarly|jasper|copy\.ai|writesonic|zapier|make|adobe express|adobe firefly|meta ai|deepseek|grok)\b/i;

/** Each kind of business, with the needs where a tool built for that trade beats a general one. */
const NICHE: Record<string, { label: string; words: RegExp; needs: string[] }> = {
  restaurant: {
    label: "restaurants, cafes, food trucks and bakeries",
    words: /restaurant|caf[eé]|food truck|bakery|kitchen|diner|menu|hospitality/i,
    needs: ["calls/phone-ai", "calls/booking", "customers/reviews", "customers/social", "employees/scheduling", "inventory/inventory-manager", "inventory/supplier-comparer", "money/profits", "safety/food-health", "translate/translators"],
  },
  salon: {
    label: "hair salons, barbershops, nail salons and spas",
    words: /salon|barber|nail|spa\b|beauty|stylist/i,
    needs: ["calls/booking", "calls/phone-ai", "customers/reviews", "customers/social", "calls/support"],
  },
  retail: {
    label: "corner stores, markets, boutiques and small retail shops",
    words: /retail|store|shop|boutique|grocery|market|merchant/i,
    needs: ["inventory/product-tracker", "inventory/inventory-manager", "payments/sales-tracker", "customers/social", "customers/reviews", "calls/support"],
  },
  trades: {
    label: "HVAC, plumbing, electrical, landscaping and construction contractors",
    words: /hvac|plumb|electric|landscap|contractor|roofing|home service|field service/i,
    needs: ["calls/phone-ai", "calls/booking", "money/bookkeeping", "customers/reviews", "customers/ads", "calls/support", "employees/hiring"],
  },
  cleaning: {
    label: "house cleaning and janitorial businesses",
    words: /clean|janitor|maid/i,
    needs: ["calls/booking", "calls/phone-ai", "employees/scheduling", "customers/reviews", "calls/support"],
  },
};

interface Directory {
  label: string;
  system: string;
  domains: string[];
  /** Only a real listing page counts as proof of a connection, not a blog post on the same site. */
  listing: RegExp;
}

/** App marketplaces. Being listed in one is evidence that a product connects to that system. */
const DIRECTORIES: Record<string, Directory> = {
  square: { label: "Square App Marketplace", system: "Square", domains: ["squareup.com"], listing: /app-?marketplace/i },
  clover: { label: "Clover App Market", system: "Clover", domains: ["clover.com"], listing: /app-?market/i },
  toast: { label: "Toast partner directory", system: "Toast", domains: ["toasttab.com"], listing: /partners?|integrations?/i },
  intuit: { label: "Intuit app store for QuickBooks", system: "QuickBooks", domains: ["apps.intuit.com", "quickbooks.intuit.com"], listing: /apps\.intuit\.com|\/app\/apps\//i },
  shopify: { label: "Shopify App Store", system: "Shopify", domains: ["apps.shopify.com"], listing: /apps\.shopify\.com\/[a-z0-9-]+/i },
  jobber: { label: "Jobber App Marketplace", system: "Jobber", domains: ["getjobber.com"], listing: /integrations?|marketplace|\/apps?\//i },
  housecall: { label: "Housecall Pro integrations", system: "Housecall Pro", domains: ["housecallpro.com"], listing: /integrations?|marketplace|partners?/i },
  zapier: { label: "Zapier app directory", system: "Zapier", domains: ["zapier.com"], listing: /zapier\.com\/apps\/[a-z0-9-]+/i },
};

const TRADE_DIRECTORIES: Record<string, string[]> = {
  restaurant: ["toast", "square", "clover", "intuit", "zapier"],
  salon: ["square", "zapier"],
  retail: ["clover", "square", "shopify", "intuit"],
  trades: ["jobber", "housecall", "intuit", "zapier"],
  cleaning: ["jobber", "housecall", "intuit", "zapier"],
};

/** Where owners and their trade press name the products they really use. */
const COMMUNITIES: Record<string, { subreddits: string; press: string[] }> = {
  restaurant: { subreddits: "r/restaurantowners, r/restaurateur, r/KitchenConfidential", press: ["restaurantdive.com", "modernrestaurantmanagement.com", "restaurantbusinessonline.com", "nrn.com", "qsrmagazine.com", "fsrmagazine.com", "hospitalitytech.com"] },
  salon: { subreddits: "r/salons, r/Hairstylist, r/Barber, r/NailTechs", press: ["modernsalon.com", "americansalon.com", "nailsmag.com", "behindthechair.com", "beautyindependent.com"] },
  retail: { subreddits: "r/smallbusiness, r/retail, r/grocery", press: ["retaildive.com", "cstoredive.com", "progressivegrocer.com", "csnews.com", "nacsonline.com"] },
  trades: { subreddits: "r/HVAC, r/Plumbing, r/electricians, r/landscaping, r/sweatystartup", press: ["achrnews.com", "contractormag.com", "phcppros.com", "lawnandlandscape.com", "ecmag.com"] },
  cleaning: { subreddits: "r/CleaningBusiness, r/sweatystartup, r/HouseCleaning", press: ["cleanlink.com", "cmmonline.com", "issa.com"] },
};

const LAUNCH_SITES = ["producthunt.com", "ycombinator.com", "betalist.com"];

/** Places that write about products. A tool's own site is required, never one of these. */
const SOURCE_SITES = new Set([
  ...Object.values(DIRECTORIES).flatMap((d) => d.domains.map((x) => x.split(".").slice(-2).join("."))),
  ...Object.values(COMMUNITIES).flatMap((c) => c.press),
  ...LAUNCH_SITES,
  "reddit.com", "alternativeto.net", "slashdot.org", "softwaresuggest.com", "f6s.com", "crunchbase.com",
]);

/** The claim that a tool is built for a trade only counts if a page naming the tool says so. */
function servesTrade(name: string, words: RegExp, citations: Citation[]) {
  return citations.some((c) => {
    const text = `${c.title}\n${c.content}`;
    return appearsIn(text.toLowerCase(), name) && words.test(text);
  });
}

type Candidate = {
  name: string;
  website: string;
  summary: string;
  helpsWith: string[];
  startingMonthlyUsd: number;
  pricingModel: string;
  pricingNote: string;
  workload: string;
  platforms: string[];
  setupMinutes: number;
  selfServe: boolean;
  howToStart: string;
};

/** Sites that write about products. A tool's own site is required, not an article about it. */
const NOT_PRODUCT_SITES = [
  "g2.com", "capterra.com", "getapp.com", "softwareadvice.com", "trustpilot.com", "trustradius.com", "sourceforge.net",
  "producthunt.com", "theresanaiforthat.com", "futurepedia.io", "toolify.ai", "aitools.fyi", "stork.ai", "medium.com",
  "linkedin.com", "youtube.com", "reddit.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "prnewswire.com",
  "businesswire.com", "globenewswire.com", "prlog.org", "forbes.com", "nerdwallet.com", "techcrunch.com", "github.com",
  "apple.com", "google.com", "shopify.com", "wikipedia.org", "substack.com", "ghost.io", "wordpress.com", "blogspot.com",
];

function rootDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".").slice(-2).join(".");
  } catch {
    return "";
  }
}

function slugify(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Windows can briefly lock a file between rapid writes, so try again rather than lose work. */
function save(file: string, data: unknown) {
  const text = `${JSON.stringify(data, null, 1)}\n`;
  for (let attempt = 0; ; attempt++) {
    try {
      fs.writeFileSync(file, text);
      return;
    } catch (err) {
      if (attempt >= 8) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (index < items.length) await worker(items[index++]);
    }),
  );
}

const FIND_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tools"],
  properties: {
    tools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "website", "summary", "helpsWith", "startingMonthlyUsd", "pricingModel", "pricingNote", "workload", "platforms", "setupMinutes", "selfServe", "howToStart"],
        properties: {
          name: { type: "string" },
          website: { type: "string", description: "The product's own website, never an article, directory or app store page" },
          summary: { type: "string", description: "One or two plain sentences on what it does for a small business, no marketing words" },
          helpsWith: { type: "array", items: { type: "string" }, description: "2 to 4 short, concrete things it does" },
          startingMonthlyUsd: { type: "number", description: "Lowest monthly USD price for business use. 0 only if a free plan may be used by a business." },
          pricingModel: { type: "string", enum: ["free", "freemium", "paid", "trial"] },
          pricingNote: { type: "string", description: "One plain sentence naming the real plans and prices" },
          workload: {
            type: "string",
            enum: ["optional-genai", "translation", "llm-every-reply", "speech", "voice-agent", "image-video"],
            description: "optional-genai: normal software with AI when asked. translation: translation models. llm-every-reply: a large language model on every reply. speech: generates voice. voice-agent: AI answers phone calls. image-video: generates pictures or video.",
          },
          platforms: { type: "array", items: { type: "string", enum: ["web", "ios", "android", "desktop", "phone", "pos-hardware"] } },
          setupMinutes: { type: "integer" },
          selfServe: { type: "boolean", description: "True if you can sign up alone, false if you must talk to sales" },
          howToStart: { type: "string", description: "One sentence: how to sign up" },
        },
      },
    },
  },
} as const;

async function findTools() {
  const existing: Array<Record<string, unknown>> = fs.existsSync(DISCOVERED) ? JSON.parse(fs.readFileSync(DISCOVERED, "utf8")) : [];
  const bySlug = new Map(existing.map((t) => [t.slug as string, t]));
  const handSlugs = new Set(SEED_BASE.map((t) => t.slug));
  const usedDomains = new Set([...SEED_BASE.map((t) => rootDomain(t.website)), ...existing.map((t) => rootDomain(t.website as string))]);

  const allNeeds = CATEGORIES.flatMap((c) => c.subcategories.filter((s) => !NO_LIVE_DISCOVERY.has(s.id)).map((s) => ({ c, s, trade: "" })));
  const needs = niche
    ? Object.entries(NICHE).flatMap(([trade, n]) => n.needs.flatMap((key) => allNeeds.filter(({ c, s }) => `${c.id}/${s.id}` === key).map((need) => ({ ...need, trade }))))
    : allNeeds;
  await pool(needs, 4, async ({ c, s, trade }) => {
    const key = `${c.id}/${s.id}`;
    const listed = [...SEED_BASE, ...bySlug.values()] as { name: string; categoryId: string; subcategoryId: string; secondary?: string[] }[];
    const already = listed.filter((t) => (t.categoryId === c.id && t.subcategoryId === s.id) || t.secondary?.includes(key)).map((t) => t.name);
    const target = trade ? NICHE[trade] : null;
    try {
      const { data, citations, cost } = await webJson<{ tools: Candidate[] }>({
        apiKey,
        appUrl,
        model: MODEL,
        web: true,
        system:
          `You find small, low-cost AI software for small US businesses such as restaurants, salons, corner stores and trades. Use only products named in the search results. AI must do the product's main job: writing, answering, predicting, translating, reading documents or making decisions. Small and new products are welcome, and preferred over big-company products. It must be sold in the US and usable without technical skills. A free plan or under $50 per month is preferred, and never over $150 per month. Give each product's own website. Do not invent prices or features. Skip anything that looks unsafe, or that claims to replace a lawyer, doctor or accountant. Never include general assistants or all-purpose apps such as ChatGPT, Claude, Gemini, Copilot, Canva or Notion: the owner should not have to write their own instructions, because the product already knows the job.${target ? ` Only include products built for ${target.label}.` : ""} Do not mention search results or sources in your text.`,
        user: `${target ? `AI software built specifically for ${target.label}` : "Small affordable AI tools for small businesses"}: ${c.name}, ${s.name}. ${s.description}${already.length ? `\nDo not include: ${already.join(", ")}.` : ""}`,
        schemaName: "ai_tools",
        schema: FIND_SCHEMA,
        maxResults: 8,
        maxTokens: 3000,
      });
      totalCost += cost;
      let added = 0;
      for (const tool of data.tools) {
        if (added >= PER_NEED) break;
        const slug = slugify(tool.name);
        const domain = rootDomain(tool.website);
        if (handSlugs.has(slug) || REJECTED[slug] || TOO_GENERAL.test(tool.name.trim())) continue;
        const trades = target && servesTrade(tool.name, target.words, citations) ? [trade] : [];
        if (bySlug.has(slug)) {
          // Found again for another need, so it serves both.
          const entry = bySlug.get(slug) as { categoryId: string; subcategoryId: string; secondary?: string[]; trades?: string[] };
          if (`${entry.categoryId}/${entry.subcategoryId}` !== key) entry.secondary = [...new Set([...(entry.secondary ?? []), key])];
          if (trades.length) entry.trades = [...new Set([...(entry.trades ?? []), ...trades])];
          continue;
        }
        // A niche search that cannot show the tool serves this trade has not found a niche tool.
        if (target && trades.length === 0) continue;
        if (!slug || !tool.website.startsWith("https://") || NOT_PRODUCT_SITES.includes(domain) || usedDomains.has(domain)) continue;
        if (tool.startingMonthlyUsd > 150) continue;
        if (verifyNames([tool.name], citations).length === 0 || !mentionsAi(tool.name, citations)) continue;
        usedDomains.add(domain);
        const problem = await siteProblem(new URL(tool.website).origin);
        if (problem) {
          console.log(`  skipped ${tool.name}: ${problem}`);
          continue;
        }
        bySlug.set(slug, {
          slug,
          name: tool.name.trim(),
          website: new URL(tool.website).origin,
          summary: cleanResearchText(tool.summary),
          helpsWith: tool.helpsWith.map((h) => cleanResearchText(h)).filter(Boolean).slice(0, 4),
          categoryId: c.id,
          subcategoryId: s.id,
          workload: tool.workload,
          platforms: tool.platforms.length ? tool.platforms : ["web"],
          setupMinutes: tool.setupMinutes || 30,
          selfServe: tool.selfServe,
          howToStart: cleanResearchText(tool.howToStart),
          draftPricing: { startingMonthlyUsd: tool.startingMonthlyUsd, model: tool.pricingModel, note: cleanResearchText(tool.pricingNote) },
          ...(trades.length ? { trades } : {}),
        });
        added++;
      }
      console.log(`${(trade ? `${trade}: ${key}` : key).padEnd(44)} added ${added}`);
      save(DISCOVERED, [...bySlug.values()]);
    } catch (err) {
      console.error(`${key}: ${err instanceof Error ? err.message : "failed"}`);
    }
  });
  console.log(`Catalog candidates: ${bySlug.size}. Cost about $${totalCost.toFixed(3)}.`);
}

type Lane = "directory" | "community" | "launch" | "second-hop";
interface DeepCandidate {
  name: string;
  website: string;
  summary: string;
  need: string;
}
interface Listing {
  system: string;
  url: string;
}

const NEED_KEYS = CATEGORIES.flatMap((c) => c.subcategories.filter((s) => !NO_LIVE_DISCOVERY.has(s.id)).map((s) => `${c.id}/${s.id}`));

const DEEP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tools"],
  properties: {
    tools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "website", "summary", "need"],
        properties: {
          name: { type: "string", description: "The product's name exactly as written" },
          website: { type: "string", description: "The product's own website if shown. Empty if only a directory, article or post names it." },
          summary: { type: "string", description: "One plain sentence on what it does" },
          need: { type: "string", enum: NEED_KEYS, description: "Which need it serves" },
        },
      },
    },
  },
} as const;

const WEBSITE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["website"],
  properties: { website: { type: "string", description: "The product's own https website, or empty if the results do not show it" } },
} as const;

/** Most money this search may spend before it stops starting new queries. Override with --budget=1.5. */
const DEEP_BUDGET = Number(args.find((a) => a.startsWith("--budget="))?.slice(9) ?? 1.6);
/** Run only some lanes, such as --lanes=launch,second-hop. */
const DEEP_LANES = args.find((a) => a.startsWith("--lanes="))?.slice(8).split(",") ?? ["directory", "community", "launch", "second-hop"];
/** How many of each trade's strongest specialists to look up competitors for. */
const HOP_SEEDS = Number(args.find((a) => a.startsWith("--hops="))?.slice(7) ?? 5);
/** Limit the launch lane to these trades, to finish a run that stopped early. */
const LAUNCH_TRADES = args.find((a) => a.startsWith("--launch-trades="))?.slice(16).split(",");

/**
 * Looks where an ordinary web search does not: inside app marketplaces, in owner
 * communities and trade press, on launch sites, then at the competitors of the best finds.
 * Every name is resolved to the product's own website, which must exist and name it.
 */
async function deepFind() {
  const entries: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(DISCOVERED, "utf8"));
  for (const entry of entries) entry.lane ??= "open-web";
  const bySlug = new Map(entries.map((t) => [t.slug as string, t]));
  const handSlugs = new Set(SEED_BASE.map((t) => t.slug));
  const usedDomains = new Set([...SEED_BASE.map((t) => rootDomain(t.website)), ...entries.map((t) => rootDomain(t.website as string))]);
  const reserved = new Set<string>();
  const added: Record<Lane, number> = { directory: 0, community: 0, launch: 0, "second-hop": 0 };
  const hits = new Map<string, Listing[]>();
  const research = JSON.parse(fs.readFileSync(RESEARCH, "utf8"));
  const isSourceSite = (domain: string) => !domain || NOT_PRODUCT_SITES.includes(domain) || SOURCE_SITES.has(domain);

  async function ownWebsite(name: string, claimed: string, label: string) {
    const usable = (url: string) => url.startsWith("https://") && !isSourceSite(rootDomain(url));
    if (usable(claimed)) return claimed;
    try {
      const { data, cost } = await webJson<{ website: string }>({
        apiKey,
        appUrl,
        model: MODEL,
        web: true,
        system: "You find the official website of a software product. Return only its own website, never a directory, review site, article, app store or social page. Return empty if the results do not show it.",
        user: `"${name}" software for ${label}, official website`,
        schemaName: "website",
        schema: WEBSITE_SCHEMA,
        maxResults: 4,
        maxTokens: 120,
      });
      totalCost += cost;
      return usable(data.website) ? data.website : "";
    } catch {
      return "";
    }
  }

  async function consider(raw: DeepCandidate, citations: Citation[], lane: Lane, trade: string, directory?: Directory) {
    const name = raw.name.trim();
    const slug = slugify(name);
    if (!slug || REJECTED[slug] || TOO_GENERAL.test(name)) return;
    if (verifyNames([name], citations).length === 0) return;
    const target = NICHE[trade];

    const page = directory
      ? citations.find((c) => directory.domains.some((d) => new URL(c.url).hostname.endsWith(d)) && directory.listing.test(c.url) && appearsIn(`${c.title}\n${c.content}`, name))
      : undefined;
    if (page && directory) hits.set(slug, [...(hits.get(slug) ?? []), { system: directory.system, url: page.url }]);

    const existing = bySlug.get(slug) as { trades?: string[]; alsoFoundBy?: string[]; lane?: string } | undefined;
    if (handSlugs.has(slug) || existing) {
      if (existing && servesTrade(name, target.words, citations)) existing.trades = [...new Set([...(existing.trades ?? []), trade])];
      if (existing && existing.lane !== lane) existing.alsoFoundBy = [...new Set([...(existing.alsoFoundBy ?? []), lane])];
      return;
    }
    if (reserved.has(slug)) return;
    reserved.add(slug);

    const website = await ownWebsite(name, raw.website, target.label);
    if (!website) return;
    const origin = new URL(website).origin;
    const domain = rootDomain(origin);
    if (usedDomains.has(domain)) return;
    const own = await readPage(origin);
    if (!own || !appearsIn(`${own.title}\n${own.content}`, name)) return;
    const evidence = [own, ...citations];
    if (!mentionsAi(name, evidence) || !servesTrade(name, target.words, evidence)) return;
    usedDomains.add(domain);
    const problem = await siteProblem(origin);
    if (problem) {
      console.log(`  skipped ${name}: ${problem}`);
      return;
    }

    // The source only named it. Everything said about the product comes from its own site.
    const { data: full, cost } = await webJson<Candidate>({
      apiKey,
      appUrl,
      model: MODEL,
      system: "You describe a software product for a small business owner, using only the company page provided. Use short, plain words and no marketing language. Do not invent prices or features. If no price is shown use 0 and say so in the note.",
      user: `${name} (${origin})\n\n${pagesForPrompt([own])}`,
      schemaName: "tool_facts",
      schema: FIND_SCHEMA.properties.tools.items,
      maxTokens: 700,
    });
    totalCost += cost;
    if (full.startingMonthlyUsd > 150) return;
    const [categoryId, subcategoryId] = raw.need.split("/");
    bySlug.set(slug, {
      slug,
      name,
      website: origin,
      summary: cleanResearchText(full.summary),
      helpsWith: full.helpsWith.map((h) => cleanResearchText(h)).filter(Boolean).slice(0, 4),
      categoryId,
      subcategoryId,
      workload: full.workload,
      platforms: full.platforms.length ? full.platforms : ["web"],
      setupMinutes: full.setupMinutes || 30,
      selfServe: full.selfServe,
      howToStart: cleanResearchText(full.howToStart),
      draftPricing: { startingMonthlyUsd: full.startingMonthlyUsd, model: full.pricingModel, note: cleanResearchText(full.pricingNote) },
      trades: [trade],
      lane,
    });
    added[lane]++;
    save(DISCOVERED, [...bySlug.values()]);
    console.log(`  + ${name} (${origin}) [${lane}, ${trade}]`);
  }

  async function search(lane: Lane, trade: string, query: string, includeDomains?: string[], directory?: Directory) {
    if (totalCost >= DEEP_BUDGET) return;
    const target = NICHE[trade];
    const known = [...bySlug.values()].filter((t) => (t.trades as string[] | undefined)?.includes(trade)).map((t) => t.name as string);
    try {
      const { data, citations, cost } = await webJson<{ tools: DeepCandidate[] }>({
        apiKey,
        appUrl,
        model: MODEL,
        web: true,
        system: `You find AI software built for ${target.label} in the United States, using only products named in the search results. AI must do the product's main job. Never include general assistants or all-purpose apps such as ChatGPT, Claude, Gemini, Copilot, Canva or Notion. Small and new products are welcome. Give the product's own website only if the results show it, never a directory, article or post. Do not invent anything. Do not mention search results or sources.`,
        user: `${query}${known.length ? `\nDo not include: ${known.join(", ")}.` : ""}`,
        schemaName: "deep_tools",
        schema: DEEP_SCHEMA,
        includeDomains,
        maxResults: 10,
        maxTokens: 2000,
      });
      totalCost += cost;
      for (const tool of data.tools) await consider(tool, citations, lane, trade, directory);
      console.log(`${lane.padEnd(11)} ${trade.padEnd(11)} named ${String(data.tools.length).padStart(2)}, pages ${String(citations.length).padStart(2)}: ${query.slice(0, 60)}`);
    } catch (err) {
      console.error(`${lane} ${trade}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  const jobsFor = (trade: string) => NICHE[trade].needs.map((key) => CATEGORIES.flatMap((c) => c.subcategories.filter((s) => `${c.id}/${s.id}` === key)).map((s) => s.name)[0]).join(", ");

  const directoryJobs = Object.entries(TRADE_DIRECTORIES).flatMap(([trade, ids]) => ids.map((id) => ({ trade, directory: DIRECTORIES[id] })));
  if (DEEP_LANES.includes("directory")) await pool(directoryJobs, 4, ({ trade, directory }) => search("directory", trade, `${directory.label}: AI apps for ${NICHE[trade].label}. ${jobsFor(trade)}.`, directory.domains, directory));

  const communityJobs = Object.entries(COMMUNITIES).flatMap(([trade, c]) => [
    { trade, query: `Owners in ${c.subreddits} recommend which AI software or app for ${NICHE[trade].label}: ${jobsFor(trade)}`, domains: ["reddit.com"] },
    { trade, query: `What AI tool do you actually use to run your ${trade === "trades" ? "contracting" : trade} business and is it worth it`, domains: ["reddit.com"] },
    { trade, query: `New AI software for ${NICHE[trade].label}, independent operators: ${jobsFor(trade)}`, domains: c.press },
    { trade, query: `AI startup helping small ${NICHE[trade].label} owners, company announcement and interview`, domains: c.press },
  ]);
  if (DEEP_LANES.includes("community")) await pool(communityJobs, 4, ({ trade, query, domains }) => search("community", trade, query, domains));

  const launchJobs = (LAUNCH_TRADES ?? Object.keys(NICHE)).flatMap((trade) => [
    { trade, query: `AI for ${NICHE[trade].label}` },
    { trade, query: `AI agent launched for small ${NICHE[trade].label}: ${jobsFor(trade)}` },
  ]);
  if (DEEP_LANES.includes("launch")) await pool(launchJobs, 4, ({ trade, query }) => search("launch", trade, query, LAUNCH_SITES));

  // The strongest specialists in each trade, then whoever competes with them.
  const strength = (slug: string, entry: Record<string, unknown>) => {
    const r = research.tools[slug];
    return (r?.reviews?.rating != null ? 3 : 0) + (r && r.exists !== false ? 2 : 0) + (hits.has(slug) ? 2 : 0) + (entry.lane === "open-web" ? 0 : 1);
  };
  const hopJobs = Object.keys(NICHE).flatMap((trade) =>
    [...bySlug.values()]
      .filter((t) => (t.trades as string[] | undefined)?.includes(trade))
      .sort((a, b) => strength(b.slug as string, b) - strength(a.slug as string, a))
      .slice(0, HOP_SEEDS)
      .map((t) => ({ trade, name: t.name as string })),
  );
  if (DEEP_LANES.includes("second-hop")) await pool(hopJobs, 4, ({ trade, name }) => search("second-hop", trade, `${name} alternatives and competitors for ${NICHE[trade].label}`));

  // A listing is evidence of a connection, so it joins the tool's confirmed integrations.
  for (const [slug, listings] of hits) {
    const entry = bySlug.get(slug) as { listedIn?: Listing[] } | undefined;
    if (entry) entry.listedIn = [...new Map([...(entry.listedIn ?? []), ...listings].map((l) => [l.system, l])).values()];
    const r = research.tools[slug];
    if (r) {
      r.integrations = [...new Set([...(r.integrations ?? []), ...listings.map((l) => l.system)])];
      r.integrationSources = { ...(r.integrationSources ?? {}), ...Object.fromEntries(listings.map((l) => [l.system, l.url])) };
    }
  }
  save(DISCOVERED, [...bySlug.values()]);
  save(RESEARCH, research);
  console.log(`New tools by lane: ${JSON.stringify(added)}. Listings found for ${hits.size} tools. Catalog candidates: ${bySlug.size}. Cost about $${totalCost.toFixed(3)}.`);
}

const AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["level", "feature"],
  properties: {
    level: {
      type: "string",
      enum: ["core", "feature", "none"],
      description: "core: AI does the product's main job. feature: normal software with named AI features an owner can actually use. none: no AI an owner can use. Fraud screening or ranking done behind the scenes counts as none.",
    },
    feature: { type: "string", description: "One short plain sentence, starting with a verb, saying what the AI does for a small business. Empty if level is none." },
  },
} as const;

async function checkTools() {
  const store = JSON.parse(fs.readFileSync(RESEARCH, "utf8"));
  const discovered = fs.existsSync(DISCOVERED) ? JSON.parse(fs.readFileSync(DISCOVERED, "utf8")) : [];
  const all = [...SEED_BASE, ...discovered].filter((t) => store.tools[t.slug] && (force || !store.tools[t.slug].ai));
  console.log(`Checking AI for ${all.length} tools`);
  const counts: Record<string, number> = {};
  await pool(all, 4, async (tool: { slug: string; name: string; website: string; publicResource?: boolean }) => {
    try {
      // A small product's own site says more than a search engine that has barely indexed it.
      const own = await readPage(tool.website);
      const { data, citations, cost } = await webJson<{ level: "core" | "feature" | "none"; feature: string }>({
        apiKey,
        appUrl,
        model: MODEL,
        web: !own,
        system:
          "You check whether a software product really uses AI, using only the search results or company pages provided about this exact product. Marketing words do not count: say core or feature only if they name what the AI does. Write the feature sentence in short, plain words for a small business owner, with no marketing language, and do not mention search results or sources.",
        user: `${tool.name} (${tool.website}) AI features: what does its AI do for a small business?${own ? `\n\n${pagesForPrompt([own])}` : ""}`,
        schemaName: "ai_check",
        schema: AI_SCHEMA,
        maxResults: 5,
        maxTokens: 300,
      });
      totalCost += cost;
      // A claim of AI only counts if the returned pages name both this product and AI.
      const confirmed = data.level !== "none" && mentionsAi(tool.name, own ? [own, ...citations] : citations);
      const level = confirmed ? data.level : "none";
      store.tools[tool.slug].ai = { level, feature: confirmed ? cleanResearchText(data.feature, 160) : "", checkedAt: new Date().toISOString().slice(0, 10) };
      counts[level] = (counts[level] ?? 0) + 1;
      save(RESEARCH, store);
      console.log(`${tool.slug.padEnd(30)} ${level.padEnd(8)} ${store.tools[tool.slug].ai.feature.slice(0, 90)}`);
    } catch (err) {
      console.error(`${tool.slug}: ${err instanceof Error ? err.message : "failed"}`);
    }
  });
  console.log(`Done: ${JSON.stringify(counts)}. Cost about $${totalCost.toFixed(3)}.`);
}

if (args.includes("--find")) await (args.includes("--deep") ? deepFind() : findTools());
if (args.includes("--check")) await checkTools();
