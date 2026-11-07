/**
 * Keeps the catalog focused on AI.
 *
 *   node --env-file=.env.local scripts/research-ai.mts --find   find small AI tools for every need
 *   node --env-file=.env.local scripts/research-ai.mts --check  confirm what each tool's AI does
 *
 * --find adds candidates to src/data/seed-discovered.json. Run research-tools.mts next to
 * research their reviews, prices and languages, and read the list before publishing it.
 * Add --force to --check to redo tools that were already checked.
 */
import fs from "node:fs";
import { SEED_BASE } from "../src/data/seed-base.ts";
import { CATEGORIES, NO_LIVE_DISCOVERY } from "../src/data/taxonomy.ts";
import { cleanResearchText, mentionsAi, siteProblem, verifyNames, webJson } from "../src/lib/research-core.ts";

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
const PER_NEED = 3;
let totalCost = 0;

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

  const needs = CATEGORIES.flatMap((c) => c.subcategories.filter((s) => !NO_LIVE_DISCOVERY.has(s.id)).map((s) => ({ c, s })));
  await pool(needs, 4, async ({ c, s }) => {
    const key = `${c.id}/${s.id}`;
    const listed = [...SEED_BASE, ...bySlug.values()] as { name: string; categoryId: string; subcategoryId: string; secondary?: string[] }[];
    const already = listed.filter((t) => (t.categoryId === c.id && t.subcategoryId === s.id) || t.secondary?.includes(key)).map((t) => t.name);
    try {
      const { data, citations, cost } = await webJson<{ tools: Candidate[] }>({
        apiKey,
        appUrl,
        model: MODEL,
        web: true,
        system:
          "You find small, low-cost AI software for small US businesses such as restaurants, salons, corner stores and trades. Use only products named in the search results. AI must do the product's main job: writing, answering, predicting, translating, reading documents or making decisions. Small and new products are welcome, and preferred over big-company products. It must be sold in the US and usable without technical skills. A free plan or under $50 per month is preferred, and never over $150 per month. Give each product's own website. Do not invent prices or features. Skip anything that looks unsafe, or that claims to replace a lawyer, doctor or accountant. Do not mention search results or sources in your text.",
        user: `Small affordable AI tools for small businesses: ${c.name}, ${s.name}. ${s.description}${already.length ? `\nDo not include: ${already.join(", ")}.` : ""}`,
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
        if (handSlugs.has(slug) || REJECTED[slug]) continue;
        if (bySlug.has(slug)) {
          // Found again for another need, so it serves both.
          const entry = bySlug.get(slug) as { categoryId: string; subcategoryId: string; secondary?: string[] };
          if (`${entry.categoryId}/${entry.subcategoryId}` !== key) entry.secondary = [...new Set([...(entry.secondary ?? []), key])];
          continue;
        }
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
        });
        added++;
      }
      console.log(`${key.padEnd(32)} added ${added}`);
      save(DISCOVERED, [...bySlug.values()]);
    } catch (err) {
      console.error(`${key}: ${err instanceof Error ? err.message : "failed"}`);
    }
  });
  console.log(`Catalog candidates: ${bySlug.size}. Cost about $${totalCost.toFixed(3)}.`);
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
      const { data, citations, cost } = await webJson<{ level: "core" | "feature" | "none"; feature: string }>({
        apiKey,
        appUrl,
        model: MODEL,
        web: true,
        system:
          "You check whether a software product really uses AI, using only web search results about this exact product. Marketing words do not count: say core or feature only if the results name what the AI does. Write the feature sentence in short, plain words for a small business owner, with no marketing language, and do not mention search results or sources.",
        user: `${tool.name} (${tool.website}) AI features: what does its AI do for a small business?`,
        schemaName: "ai_check",
        schema: AI_SCHEMA,
        maxResults: 5,
        maxTokens: 300,
      });
      totalCost += cost;
      // A claim of AI only counts if the returned pages name both this product and AI.
      const confirmed = data.level !== "none" && mentionsAi(tool.name, citations);
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

if (args.includes("--find")) await findTools();
if (args.includes("--check")) await checkTools();
