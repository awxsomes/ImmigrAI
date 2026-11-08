/**
 * Runs real owner scenarios through /api/match and saves what came back, so the matcher
 * can be compared with independent research. Each scenario also runs a control: one plain
 * query through the same search engine, the kind of thing someone would type into Google.
 * Tools that only repeat the control mean the deep search added nothing.
 *
 * Needs a dev server, and spends real credit.
 *   node --no-warnings --env-file=.env.local scripts/eval-match.mts <output.json> [base url] [only ids, comma separated]
 */
import fs from "node:fs";
import path from "node:path";
import { appearsIn, rootDomain, webJson } from "../src/lib/research-core.ts";

const out = process.argv[2];
const base = process.argv[3] ?? "http://localhost:3001";
const onlyIds = process.argv[4] ? new Set(process.argv[4].split(",").map(Number)) : null;
const apiKey = process.env.OPENROUTER_API_KEY ?? "";
const MODEL = process.env.OPENROUTER_SEARCH_MODEL || "anthropic/claude-haiku-5.5";
if (!out || !apiKey) {
  console.error("Give an output file, and run with --env-file=.env.local");
  process.exit(1);
}

const SCENARIOS = [
  { id: 1, type: "salon", systems: ["Square"], language: "Vietnamese", control: "AI tool for nail salon appointment reminders", need: "Vietnamese-owned nail salon in Houston, 4 technicians, uses Square Appointments. Clients no-show, and the owner wants automatic reminders and rebooking texts in Vietnamese and English." },
  { id: 2, type: "restaurant", systems: ["Clover"], language: "Spanish", control: "AI phone answering for restaurants", need: "Family taqueria in Phoenix on a Clover register. They miss phone orders at lunch, and most callers speak Spanish." },
  { id: 3, type: "restaurant", systems: ["Toast"], language: "Chinese", control: "AI tool to reply to Google reviews for restaurants", need: "Chinese restaurant in Queens on Toast. The owner writes in Chinese and wants Google and Yelp reviews answered in English without writing the replies themselves." },
  { id: 4, type: "trades", systems: ["QuickBooks"], language: "", control: "AI answering service for HVAC companies", need: "Two-truck HVAC company in Atlanta using QuickBooks Online. They lose after-hours calls and need those calls booked as jobs." },
  { id: 5, type: "trades", systems: ["Google Calendar"], language: "Spanish", size: "6-20", control: "AI invoice app for landscapers", need: "Spanish-speaking landscaper in Dallas with 6 workers and no software besides a phone and Google Calendar. Needs quotes and invoices made from the truck, in Spanish." },
  { id: 6, type: "retail", systems: ["Clover"], language: "", control: "AI inventory reorder app for convenience stores", need: "Corner store in the Bronx with a Clover register. Wants to know what to reorder and when, based on its sales." },
  { id: 7, type: "cleaning", systems: ["Google Calendar", "Stripe"], language: "Portuguese", size: "6-20", control: "AI scheduling software for cleaning companies", need: "House cleaning company in Orlando with 8 cleaners, using Google Calendar and Stripe. Needs to assign jobs and routes and message cleaners in Portuguese." },
  { id: 8, type: "", systems: ["Google Sheets"], language: "Korean", control: "AI phone answering for dry cleaners", need: "Korean-owned dry cleaner in Los Angeles that tracks orders in a spreadsheet. Wants customers told when orders are ready, and calls answered in Korean." },
  { id: 9, type: "restaurant", systems: ["Square"], language: "", control: "AI recipe costing software for bakeries", need: "Bakery in Chicago on a Square register. Needs ingredient cost tracking and recipe costing built from supplier invoices." },
  { id: 10, type: "retail", systems: ["Square", "QuickBooks"], language: "Arabic", control: "AI invoice scanning for QuickBooks", need: "Arabic-speaking owner of a halal market in Dearborn with a Square register and QuickBooks Online. Wants supplier invoices read automatically and entered into QuickBooks." },
  { id: 11, type: "salon", systems: ["Booksy"], language: "", control: "AI text marketing for barbershops", need: "Haitian-owned barbershop in Miami using Booksy. Wants to fill empty chair slots by texting past clients." },
  { id: 12, type: "restaurant", systems: ["Square"], language: "", control: "AI social media posts for food trucks", need: "Filipino-owned food truck in San Diego on Square. Wants social posts about today's location and menu without having to write them." },
].filter((s) => !onlyIds || onlyIds.has(s.id));

interface Adoption {
  system: string;
  level: string;
  evidenceUrl?: string;
}
interface Match {
  tool: { name: string; website: string; focus: string; trades: string[]; source: string; languages: string[]; pricing: { startingMonthlyUsd: number } };
  lanes?: string[];
  fit: string;
  why: string;
  useThis: string[];
  adoption: Adoption[];
}
interface Result {
  status: string;
  brief: { job: string; trade: string; categoryId: string; subcategoryId: string } | null;
  tools: Match[];
  nothingSpecialized: boolean;
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

const CONTROL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["products"],
  properties: {
    products: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["name", "website"], properties: { name: { type: "string" }, website: { type: "string" } } },
    },
  },
} as const;

/** One plain query with no domain limits. */
async function runControl(query: string) {
  const { data, citations, cost } = await webJson<{ products: Array<{ name: string; website: string }> }>({
    apiKey,
    appUrl: "http://localhost:3000",
    model: MODEL,
    web: true,
    system: "List every software product named in the web search results, with its website. Use only what the results show.",
    user: query,
    schemaName: "control_products",
    schema: CONTROL_SCHEMA,
    maxResults: 8,
    maxTokens: 900,
    timeoutMs: 30_000,
  });
  return {
    query,
    cost,
    products: data.products.map((p) => p.name),
    domains: [...new Set([...data.products.map((p) => rootDomain(p.website)), ...citations.map((c) => rootDomain(c.url))].filter(Boolean))],
    text: citations.map((c) => `${c.title}\n${c.content}`).join("\n").toLowerCase(),
  };
}

async function runMatch(scenario: (typeof SCENARIOS)[number], index: number) {
  const started = Date.now();
  const res = await fetch(`${base}/api/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `198.51.100.${index + 1}` },
    body: JSON.stringify({ need: scenario.need, type: scenario.type, systems: scenario.systems, language: scenario.language, size: scenario.size, lang: "en", fresh: true }),
    signal: AbortSignal.timeout(90_000),
  });
  const json = (await res.json()) as Result;
  return {
    httpStatus: res.status,
    status: json.status,
    seconds: Math.round((Date.now() - started) / 1000),
    cost: Number(res.headers.get("x-debug-cost") ?? 0),
    brief: json.brief,
    nothingSpecialized: json.nothingSpecialized,
    tools: (json.tools ?? []).map((m) => ({
      name: m.tool.name,
      website: m.tool.website,
      source: m.tool.source,
      focus: m.tool.focus,
      trades: m.tool.trades,
      lanes: m.lanes ?? [],
      fit: m.fit,
      why: m.why,
      useThis: m.useThis,
      adoption: m.adoption,
      languages: m.tool.languages.length,
      price: m.tool.pricing.startingMonthlyUsd,
    })),
  };
}

const results = [];
for (const [index, scenario] of SCENARIOS.entries()) {
  try {
    const [match, control] = await Promise.all([runMatch(scenario, index), runControl(scenario.control)]);
    const controlNames = new Set(control.products.map(slug));
    const inControl = (tool: { name: string; website: string }) =>
      controlNames.has(slug(tool.name)) || control.domains.includes(rootDomain(tool.website)) || appearsIn(control.text, tool.name.toLowerCase());
    const beyond = match.tools.filter((tool) => !inControl(tool));
    results.push({
      id: scenario.id,
      need: scenario.need,
      ...match,
      control: { query: control.query, products: control.products, domains: control.domains, cost: control.cost },
      notInControl: beyond.map((t) => t.name),
    });
    const list = match.tools.map((t) => `${t.name}[${t.fit}${t.focus === "general" ? ",GENERAL" : ""};${t.lanes.join("+")}]`).join(", ") || "(none)";
    console.log(`${String(scenario.id).padStart(2)} ${match.status.padEnd(6)} ${String(match.seconds).padStart(3)}s $${match.cost.toFixed(4)} beyond control ${beyond.length}/${match.tools.length}: ${list}`);
  } catch (err) {
    results.push({ id: scenario.id, need: scenario.need, status: "request-failed", error: err instanceof Error ? err.message : "failed", tools: [], notInControl: [] });
    console.log(`${scenario.id} request failed: ${err instanceof Error ? err.message : "failed"}`);
  }
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 1)}\n`);

const all = results.flatMap((r) => r.tools);
const adoption = all.flatMap((t) => t.adoption);
const level = (name: string) => adoption.filter((a) => a.level === name).length;
const lanes: Record<string, number> = {};
for (const tool of all) for (const lane of tool.lanes) lanes[lane] = (lanes[lane] ?? 0) + 1;
const matchCost = results.reduce((sum, r) => sum + ("cost" in r ? (r.cost ?? 0) : 0), 0);
const controlCost = results.reduce((sum, r) => sum + ("control" in r ? (r.control.cost ?? 0) : 0), 0);
const seconds = results.flatMap((r) => ("seconds" in r ? [r.seconds] : []));
console.log(`\nScenarios with at least one tool: ${results.filter((r) => r.tools.length > 0).length} of ${SCENARIOS.length}. Tools: ${all.length}. General: ${all.filter((t) => t.focus === "general").length}. Exact fit: ${all.filter((t) => t.fit === "exact").length}. Live found: ${all.filter((t) => t.source === "live").length}.`);
console.log(`Beyond the plain-query control: ${results.reduce((sum, r) => sum + r.notInControl.length, 0)} of ${all.length} tools. Scenarios that only repeat the control: ${results.filter((r) => r.tools.length > 0 && r.notInControl.length === 0).length}.`);
console.log(`Lanes: ${JSON.stringify(lanes)}. Slowest: ${Math.max(...seconds)}s.`);
console.log(`Adoption: direct ${level("direct")}, bridge ${level("bridge")}, import ${level("import")}, unknown ${level("unknown")}. With a source link: ${adoption.filter((a) => a.evidenceUrl).length}.`);
console.log(`Cost: matching about $${matchCost.toFixed(3)}, controls about $${controlCost.toFixed(3)}.`);
