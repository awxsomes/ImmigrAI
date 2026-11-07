/**
 * Translates the interface, long pages, kits and tool descriptions into Spanish,
 * Chinese and Vietnamese. Only missing text is translated, so re-runs are cheap.
 *
 *   node --env-file=.env.local scripts/translate-content.mts
 *   node --env-file=.env.local scripts/translate-content.mts --force
 *
 * This is machine translation. The site says so, and a native speaker should review
 * it before launch, especially the legal pages.
 */
import fs from "node:fs";
import path from "node:path";
import { BUNDLES } from "../src/data/bundles.ts";
import { SEED_BASE as HAND_WRITTEN } from "../src/data/seed-base.ts";
import { CATEGORIES } from "../src/data/taxonomy.ts";
import { DOCS } from "../src/content/docs.ts";
import { TAXONOMY_NAMES } from "../src/content/taxonomy-names.ts";
import { cleanResearchText } from "../src/lib/research-core.ts";

const apiKey = process.env.OPENROUTER_API_KEY ?? "";
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-5.5";
const appUrl = process.env.APP_URL || "http://localhost:3000";
if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not set. Run with --env-file=.env.local");
  process.exit(1);
}
const force = process.argv.includes("--force");
/** Re-translate tool text only, after the research changed it. */
const forceTools = process.argv.includes("--tools");
const OUT_DIR = path.resolve("src/content/i18n");
const SEED_BASE = [...HAND_WRITTEN, ...JSON.parse(fs.readFileSync("src/data/seed-discovered.json", "utf8"))];

const LANGUAGES = {
  es: "Spanish as used by Latin American immigrants in the US. Use the informal 'tú'.",
  zh: "Simplified Chinese (简体中文).",
  vi: "Vietnamese (Tiếng Việt).",
} as const;

/** Does this text look like the target language? Used to catch text handed back in English. */
function inTargetLanguage(text: string, lang: keyof typeof LANGUAGES) {
  if (text.length < 20) return true;
  if (lang === "zh") return /[\u4e00-\u9fff]/.test(text);
  if (lang === "vi") return /[ăâđêôơưạảãàáấầẩẫậắằẳẵặẹẻẽèéếềểễệỉĩìíịọỏõòóốồổỗộớờởỡợụủũùúứừửữựỳýỵỷỹ]/i.test(text);
  return (text.match(/\b(the|and|with|your|you|for)\b/gi) ?? []).length < 4;
}

function leaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (value && typeof value === "object") return Object.values(value).flatMap(leaves);
  return [];
}
type Lang = keyof typeof LANGUAGES;

type Json = string | string[] | Json[] | { [key: string]: Json } | null | undefined;

let totalCost = 0;

async function translate(batch: Record<string, unknown>, lang: Lang): Promise<Record<string, unknown>> {
  const system = `You translate website text for immigrant small business owners who are not comfortable with technology. Translate into ${LANGUAGES[lang]}
Rules:
- Use short, plain, everyday words, as a helpful neighbor would. Avoid jargon and formal legal language where you can.
- Return only a JSON object with exactly the same keys and structure. Translate string values only.
- Keep placeholders such as {n}, {language}, {names}, {via}, {date}, {shown}, {total}, {rating}, {email}, {contact} and {total} exactly as they are.
- Do not translate product and company names (ImmigrAI, QuickBooks, Square, Google, SBA, SCORE, IRS, EIN, OpenRouter, Vercel, Capterra, G2, Trustpilot and so on), URLs, or the storage names immigrai:consent and immigrai:v1.
- Do not add explanations.`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": appUrl, "X-Title": "ImmigrAI" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 8000,
        reasoning: { enabled: false },
        provider: { data_collection: "deny" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Translate every string value in this JSON into ${LANGUAGES[lang]} Every value must be written in that language, not English.\n\n${JSON.stringify(batch)}` },
        ],
      }),
    });
    if (!res.ok) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { cost?: number } };
    totalCost += json.usage?.cost ?? 0;
    const raw = (json.choices?.[0]?.message?.content ?? "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const all = leaves(parsed);
      const wrong = all.filter((text) => !inTargetLanguage(text, lang)).length;
      // A few long values can rightly stay as they are, such as the title of a source.
      if (wrong <= Math.max(2, all.length * 0.1)) return parsed;
      console.warn(`  ${lang}: ${wrong} values not translated, trying again`);
    } catch {
      /* try again */
    }
  }
  throw new Error("Translation failed");
}

/** A translation that lost a placeholder would show a blank to the reader, so it is rejected. */
function samePlaceholders(source: string, target: string) {
  const find = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  return find(source) === find(target);
}

function checkStrings(source: Record<string, string>, target: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const translated = target[key];
    if (typeof translated === "string" && samePlaceholders(value, translated)) out[key] = translated;
    else console.warn(`  dropped ${key}: placeholder mismatch or missing`);
  }
  return out;
}

/** The model sometimes hands text back unchanged. Remove those so this run tries them again. */
function dropUntranslated(store: { strings: Record<string, string>; tools: Record<string, Record<string, unknown>> }, lang: Lang) {
  const english = JSON.parse(fs.readFileSync("src/content/strings.en.json", "utf8")) as Record<string, string>;
  const tools = toolSources();
  const looksEnglish = (text: unknown, source: unknown) =>
    typeof text === "string" && (text === source || (lang === "zh" && text.length > 12 && !/[\u4e00-\u9fff]/.test(text)));
  for (const [key, value] of Object.entries(store.strings)) {
    // Short labels such as brand names can rightly match, so only long strings are retried.
    if (value.length > 24 && looksEnglish(value, english[key])) delete store.strings[key];
  }
  let dropped = 0;
  for (const [slug, entry] of Object.entries(store.tools)) {
    const source = tools[slug];
    if (!source) continue;
    if (["summary", "howToStart", "pricingNote", "reviewSummary"].some((f) => looksEnglish(entry[f], source[f]))) {
      delete store.tools[slug];
      dropped++;
    }
  }
  if (dropped) console.log(`${lang}: re-translating ${dropped} tools that came back untranslated`);
}

function chunks<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function pool<T>(tasks: Array<() => Promise<T>>, limit = 4) {
  let index = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (index < tasks.length) {
        try {
          await tasks[index++]();
        } catch (err) {
          console.warn(`  batch skipped, English will show: ${err instanceof Error ? err.message : "failed"}`);
        }
      }
    }),
  );
}

function toolSources() {
  const research = JSON.parse(fs.readFileSync("src/data/research.json", "utf8")).tools as Record<
    string,
    {
      pricing: { note: string; extraFees: string | null };
      reviews: { summary: string };
      caution: string | null;
      ai?: { level: string; feature: string };
      description?: { summary?: string; helpsWith?: string[]; howToStart?: string };
    }
  >;
  const out: Record<string, Record<string, Json>> = {};
  for (const base of SEED_BASE) {
    const r = research[base.slug];
    const entry: Record<string, Json> = {
      summary: r?.description?.summary || base.summary,
      helpsWith: r?.description?.helpsWith?.length ? r.description.helpsWith : base.helpsWith,
      howToStart: r?.description?.howToStart || base.howToStart,
    };
    const aiFeature = base.aiOverride?.level === "none" ? "" : (base.aiOverride?.feature ?? r?.ai?.feature ?? "");
    if (aiFeature) entry.aiFeature = aiFeature;
    const note = base.priceOverride?.note || (r && cleanResearchText(r.pricing.note)) || base.draftPricing.note;
    if (note) entry.pricingNote = note;
    const fees = r?.pricing.extraFees ? cleanResearchText(r.pricing.extraFees) : undefined;
    if (fees) entry.extraFees = fees;
    const summary = r?.reviews.summary ? cleanResearchText(r.reviews.summary, 480) : "";
    if (summary) entry.reviewSummary = summary;
    const caution = base.caution ?? (r?.caution ? cleanResearchText(r.caution, 240) : "");
    if (caution) entry.caution = caution;
    out[base.slug] = entry;
  }
  return out;
}

async function run(lang: Lang) {
  const file = path.join(OUT_DIR, `${lang}.json`);
  const store = fs.existsSync(file) && !force ? JSON.parse(fs.readFileSync(file, "utf8")) : { strings: {}, docs: {}, bundles: {}, tools: {} };
  if (forceTools) store.tools = {};
  dropUntranslated(store, lang);
  const save = () => {
    for (let attempt = 0; ; attempt++) {
      try {
        fs.writeFileSync(file, `${JSON.stringify(store, null, 1)}\n`);
        return;
      } catch (err) {
        if (attempt >= 8) throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
      }
    }
  };

  const strings = JSON.parse(fs.readFileSync("src/content/strings.en.json", "utf8")) as Record<string, string>;
  const missing = Object.keys(strings).filter((k) => !store.strings[k]);
  const tasks: Array<() => Promise<void>> = [];

  for (const keys of chunks(missing, 50)) {
    tasks.push(async () => {
      const source = Object.fromEntries(keys.map((k) => [k, strings[k]]));
      Object.assign(store.strings, checkStrings(source, await translate(source, lang)));
      save();
    });
  }
  for (const [key, doc] of Object.entries(DOCS)) {
    if (store.docs[key]) continue;
    tasks.push(async () => {
      store.docs[key] = await translate(doc as unknown as Record<string, unknown>, lang);
      save();
    });
  }
  const bundleSource = Object.fromEntries(
    BUNDLES.filter((b) => !store.bundles[b.slug]).map((b) => [b.slug, { name: b.name, tagline: b.tagline, forWho: b.forWho, ...(b.note ? { note: b.note } : {}) }]),
  );
  if (Object.keys(bundleSource).length) {
    tasks.push(async () => {
      Object.assign(store.bundles, await translate(bundleSource, lang));
      save();
    });
  }
  const tools = toolSources();
  const missingTools = Object.keys(tools).filter((slug) => !store.tools[slug]);
  for (const slugs of chunks(missingTools, 6)) {
    tasks.push(async () => {
      const source = Object.fromEntries(slugs.map((s) => [s, tools[s]]));
      Object.assign(store.tools, await translate(source, lang));
      save();
    });
  }

  // Names were translated by hand. Descriptions fill in the rest for the search dropdown.
  const descriptions: Record<string, string> = {};
  for (const category of CATEGORIES) for (const sub of category.subcategories) descriptions[sub.id] = sub.description;
  const taxFile = path.join(OUT_DIR, `${lang}.taxonomy.json`);
  const existingTax = fs.existsSync(taxFile) ? JSON.parse(fs.readFileSync(taxFile, "utf8")) : {};
  const needDesc = force || Object.keys(descriptions).some((id) => !existingTax[id]?.desc);
  if (needDesc) {
    tasks.push(async () => {
      const translated = (await translate(descriptions, lang)) as Record<string, string>;
      const out: Record<string, { name: string; desc?: string }> = {};
      for (const category of CATEGORIES) {
        out[category.id] = { name: TAXONOMY_NAMES[lang][category.id] ?? category.name };
        for (const sub of category.subcategories) {
          out[sub.id] = { name: TAXONOMY_NAMES[lang][sub.id] ?? sub.name, desc: translated[sub.id] ?? sub.description };
        }
      }
      fs.writeFileSync(taxFile, `${JSON.stringify(out)}\n`);
    });
  }

  await pool(tasks);
  save();
  console.log(`${lang}: ${Object.keys(store.strings).length} strings, ${Object.keys(store.docs).length} pages, ${Object.keys(store.bundles).length} kits, ${Object.keys(store.tools).length} tools`);
}

async function main() {
  const en: Record<string, { name: string; desc?: string }> = {};
  for (const category of CATEGORIES) {
    en[category.id] = { name: category.name };
    for (const sub of category.subcategories) en[sub.id] = { name: sub.name, desc: sub.description };
  }
  fs.writeFileSync(path.join(OUT_DIR, "en.taxonomy.json"), `${JSON.stringify(en)}\n`);

  for (const lang of Object.keys(LANGUAGES) as Lang[]) await run(lang);
  console.log(`Cost about $${totalCost.toFixed(3)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
