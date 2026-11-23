/**
 * Translates the interface, long pages, kits and tool descriptions into Spanish,
 * Chinese and Vietnamese. Only missing text, or text whose English changed since it was
 * translated, is sent, so re-runs are cheap. `npm run check:i18n` fails CI on any gap.
 *
 * Every tool field keeps a hash of the English it came from, and a translation that states
 * different numbers from its English is thrown away rather than shown.
 *
 *   node --env-file=.env.local scripts/translate-content.mts
 *   node --env-file=.env.local scripts/translate-content.mts --force
 *   node --env-file=.env.local scripts/translate-content.mts --max-cost=2.50
 *
 * The interface, pages, kits and categories go first for every language, then tool text,
 * so a run stopped by --max-cost still leaves the most visible words translated.
 *
 * This is machine translation. The site says so, and a native speaker should review
 * it before launch, especially the legal pages.
 */
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES } from "../src/data/taxonomy.ts";
import { DOCS } from "../src/content/docs.ts";
import { TAXONOMY_NAMES } from "../src/content/taxonomy-names.ts";
import {
  bundleSources,
  docSource,
  englishStrings,
  ERRORS_FILE,
  errorTexts,
  GLOSSARY,
  hash,
  LANGUAGES,
  missingFields,
  subcategoryDescriptions,
  toolSources,
  type Lang,
  type Store,
} from "./i18n-sources.mts";
import { sameNumbers } from "../src/lib/translation-check.ts";

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
/** Stop starting new batches once this many dollars are spent. A safety net for the key's spend limit. */
const maxCost = Number(process.argv.find((a) => a.startsWith("--max-cost="))?.slice(11) ?? Infinity);
const OUT_DIR = path.resolve("src/content/i18n");

/** Does this text look like the target language? Used to catch text handed back in English. */
function inTargetLanguage(text: string, lang: keyof typeof LANGUAGES) {
  // Web addresses in a page's links are never translated, so they cannot count against it.
  if (text.length < 20 || /^https?:\/\/\S+$/.test(text)) return true;
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
let totalCost = 0;

async function translate(batch: Record<string, unknown>, lang: Lang): Promise<Record<string, unknown>> {
  const system = `You translate website text for immigrant small business owners who are not comfortable with technology. Translate into ${LANGUAGES[lang]}
Rules:
- Use short, plain, everyday words, as a helpful neighbor would. Avoid jargon and formal legal language where you can.
- Return only a JSON object with exactly the same keys and structure. Translate string values only.
- Keep placeholders such as {n}, {language}, {names}, {via}, {date}, {shown}, {total}, {rating}, {email}, {contact} and {total} exactly as they are.
- Do not translate product and company names (ImmigrAI, QuickBooks, Square, Google, SBA, SCORE, IRS, VITA, EIN, OpenRouter, Exa, Vercel, LawHelp.org, Capterra, G2, Trustpilot and so on), URLs, or the storage names immigrai:consent and immigrai:v1.
- Always use these words, so the same thing never has two names: ${Object.entries(GLOSSARY[lang])
    .map(([english, word]) => `"${english}" = "${word}"`)
    .join("; ")}.
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
function dropUntranslated(store: Store, lang: Lang) {
  const english = englishStrings();
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
    for (const field of ["summary", "howToStart", "pricingNote", "reviewSummary", "trial", "paywall"]) {
      if (looksEnglish(entry[field], source[field])) {
        delete entry[field];
        dropped++;
      }
    }
  }
  if (dropped) console.log(`${lang}: re-translating ${dropped} fields that came back untranslated`);
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
        if (totalCost >= maxCost) {
          console.warn(`  stopped at $${totalCost.toFixed(2)} (--max-cost). Run again to finish.`);
          index = tasks.length;
          break;
        }
        try {
          await tasks[index++]();
        } catch (err) {
          console.warn(`  batch skipped, English will show: ${err instanceof Error ? err.message : "failed"}`);
        }
      }
    }),
  );
}

/**
 * A translation is out of date when its English changed since. Each one records a hash of
 * the English it came from. Older entries with no hash are taken as current, once.
 */
function dropStale(store: Store) {
  const sources = (store.sources ??= {});
  const english = englishStrings();
  const strings = (sources.strings ??= {});
  for (const [key, text] of Object.entries(english)) {
    if (!store.strings[key]) continue;
    if (strings[key] && strings[key] !== hash(text)) delete store.strings[key];
    else strings[key] = hash(text);
  }
  for (const key of Object.keys(store.strings)) {
    if (!(key in english)) {
      delete store.strings[key];
      delete strings[key];
    }
  }
  const docs = (sources.docs ??= {});
  for (const key of Object.keys(DOCS) as Array<keyof typeof DOCS>) {
    if (!store.docs[key]) continue;
    const current = hash(docSource(key));
    const sections = (store.docs[key] as { sections?: unknown[] }).sections?.length;
    if ((docs[key] && docs[key] !== current) || sections !== DOCS[key].sections.length) delete store.docs[key];
    else docs[key] = current;
  }
  const bundles = (sources.bundles ??= {});
  for (const [slug, source] of Object.entries(bundleSources())) {
    if (!store.bundles[slug]) continue;
    if (bundles[slug] && bundles[slug] !== hash(source)) delete store.bundles[slug];
    else bundles[slug] = hash(source);
  }
  // Tool text, field by field. A field with no hash yet is kept once, and only if its numbers match.
  const toolHashes = (sources.tools ??= {});
  const tools = toolSources();
  let dropped = 0;
  for (const [slug, entry] of Object.entries(store.tools)) {
    const source = tools[slug];
    const hashes = (toolHashes[slug] ??= {});
    for (const field of Object.keys(entry)) {
      const english = source?.[field];
      const current = english === undefined ? "" : hash(english);
      const stale = !source || english === undefined || (hashes[field] ? hashes[field] !== current : !sameNumbers(english, entry[field]));
      if (stale) {
        delete entry[field];
        delete hashes[field];
        dropped++;
      } else hashes[field] = current;
    }
    if (Object.keys(hashes).length === 0) delete toolHashes[slug];
  }
  if (dropped) console.log(`  re-translating ${dropped} tool fields whose English changed or whose numbers differ`);
}

async function run(lang: Lang, phase: "core" | "tools") {
  const file = path.join(OUT_DIR, `${lang}.json`);
  const store: Store = fs.existsSync(file) && !force ? JSON.parse(fs.readFileSync(file, "utf8")) : { strings: {}, docs: {}, bundles: {}, tools: {} };
  if (forceTools && phase === "tools") {
    store.tools = {};
    if (store.sources) store.sources.tools = {};
  }
  dropUntranslated(store, lang);
  dropStale(store);
  const sources = (store.sources ??= {});
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

  const strings = englishStrings();
  const missing = Object.keys(strings).filter((k) => !store.strings[k]);
  const tasks: Array<() => Promise<void>> = [];

  for (const keys of phase === "core" ? chunks(missing, 50) : []) {
    tasks.push(async () => {
      const source = Object.fromEntries(keys.map((k) => [k, strings[k]]));
      const done = checkStrings(source, await translate(source, lang));
      Object.assign(store.strings, done);
      for (const key of Object.keys(done)) (sources.strings ??= {})[key] = hash(strings[key]);
      save();
    });
  }
  for (const key of phase === "core" ? (Object.keys(DOCS) as Array<keyof typeof DOCS>) : []) {
    if (store.docs[key]) continue;
    tasks.push(async () => {
      const source = docSource(key);
      const translated = (await translate(source as unknown as Record<string, unknown>, lang)) as { sections?: unknown[] };
      // A page that lost or gained a section would put headings next to the wrong text.
      if (translated.sections?.length !== source.sections.length) throw new Error(`${key}: sections do not line up`);
      store.docs[key] = translated;
      (sources.docs ??= {})[key] = hash(source);
      save();
    });
  }
  const allBundles = bundleSources();
  const bundleSource = Object.fromEntries(Object.entries(allBundles).filter(([slug]) => !store.bundles[slug]));
  if (phase === "core" && Object.keys(bundleSource).length) {
    tasks.push(async () => {
      const translated = (await translate(bundleSource, lang)) as Record<string, Record<string, string>>;
      for (const [slug, fields] of Object.entries(translated)) {
        if (!allBundles[slug]) continue;
        store.bundles[slug] = fields;
        (sources.bundles ??= {})[slug] = hash(allBundles[slug]);
      }
      save();
    });
  }
  const tools = toolSources();
  const missingTools = Object.entries(tools).flatMap(([slug, source]) => {
    const fields = missingFields(source, store.tools[slug]);
    return Object.keys(fields).length ? [[slug, fields] as const] : [];
  });
  for (const group of phase === "tools" ? chunks(missingTools, 5) : []) {
    tasks.push(async () => {
      const translated = await translate(Object.fromEntries(group), lang);
      const asked = new Set(group.map(([slug]) => slug));
      for (const [slug, fields] of Object.entries(translated)) {
        if (!asked.has(slug) || !fields || typeof fields !== "object") continue;
        const source = tools[slug];
        const hashes = ((sources.tools ??= {})[slug] ??= {});
        for (const [field, value] of Object.entries(fields as Record<string, unknown>)) {
          if (source?.[field] === undefined) continue;
          // A translation that changes a price or a count is worse than English, so it is not kept.
          if (!sameNumbers(source[field], value)) {
            console.warn(`  ${lang}: dropped ${slug}.${field}, its numbers differ from the English`);
            continue;
          }
          store.tools[slug] = { ...(store.tools[slug] ?? {}), [field]: value };
          hashes[field] = hash(source[field]);
        }
      }
      save();
    });
  }

  // Names were translated by hand. Descriptions fill in the rest for the search dropdown.
  const descriptions = subcategoryDescriptions();
  const taxFile = path.join(OUT_DIR, `${lang}.taxonomy.json`);
  const existingTax = fs.existsSync(taxFile) ? JSON.parse(fs.readFileSync(taxFile, "utf8")) : {};
  // Each description keeps a hash of the English it came from, so a changed one is translated again.
  const needDesc = force || Object.entries(descriptions).some(([id, text]) => !existingTax[id]?.desc || (existingTax[id]?.from && existingTax[id].from !== hash(text)));
  if (phase === "core" && needDesc) {
    tasks.push(async () => {
      const translated = (await translate(descriptions, lang)) as Record<string, string>;
      const out: Record<string, { name: string; desc?: string; from?: string }> = {};
      for (const category of CATEGORIES) {
        out[category.id] = { name: TAXONOMY_NAMES[lang][category.id] ?? category.name };
        for (const sub of category.subcategories) {
          out[sub.id] = { name: TAXONOMY_NAMES[lang][sub.id] ?? sub.name, desc: translated[sub.id] ?? sub.description, from: hash(sub.description) };
        }
      }
      fs.writeFileSync(taxFile, `${JSON.stringify(out)}\n`);
    });
  }

  await pool(tasks);
  save();
  console.log(
    `${lang} ${phase}: ${Object.keys(store.strings).length} strings, ${Object.keys(store.docs).length} pages, ${Object.keys(store.bundles).length} kits, ${Object.keys(store.tools).length} tools ($${totalCost.toFixed(2)} so far)`,
  );
}

async function main() {
  const en: Record<string, { name: string; desc?: string }> = {};
  for (const category of CATEGORIES) {
    en[category.id] = { name: category.name };
    for (const sub of category.subcategories) en[sub.id] = { name: sub.name, desc: sub.description };
  }
  fs.writeFileSync(path.join(OUT_DIR, "en.taxonomy.json"), `${JSON.stringify(en)}\n`);

  for (const lang of Object.keys(LANGUAGES) as Lang[]) await run(lang, "core");
  fs.writeFileSync(ERRORS_FILE, `${JSON.stringify(errorTexts(), null, 1)}\n`);
  for (const lang of Object.keys(LANGUAGES) as Lang[]) await run(lang, "tools");
  console.log(`Cost about $${totalCost.toFixed(3)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
