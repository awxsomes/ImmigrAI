/**
 * What gets translated, shared by scripts/translate-content.mts (which fills the gaps) and
 * scripts/check-i18n.mts (which fails CI when a gap or an out-of-date translation is left).
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import { BUNDLES } from "../src/data/bundles.ts";
import { SEED_BASE as HAND_WRITTEN } from "../src/data/seed-base.ts";
import { CATEGORIES } from "../src/data/taxonomy.ts";
import { DOCS } from "../src/content/docs.ts";
import { cleanResearchText } from "../src/lib/research-core.ts";

export const LANGUAGES = {
  es: "Spanish as used by Latin American immigrants in the US. Use the informal 'tú'.",
  zh: "Simplified Chinese (简体中文).",
  vi: "Vietnamese (Tiếng Việt).",
} as const;
export type Lang = keyof typeof LANGUAGES;

/**
 * One word per idea in each language, so the same thing is never called two names.
 * "Kit" came back as both 套装 and 套餐 in Chinese before this list existed.
 */
export const GLOSSARY: Record<Lang, Record<string, string>> = {
  es: { kit: "paquete", "tool kit": "paquete de herramientas", "Not connected": "No conectadas", "free trial": "prueba gratis", "My tools": "Mis herramientas", checkup: "revisión" },
  zh: { kit: "套装", "tool kit": "工具套装", "Not connected": "未连接", "free trial": "免费试用", "My tools": "我的工具", checkup: "体检" },
  vi: { kit: "bộ công cụ", "tool kit": "bộ công cụ", "Not connected": "Không kết nối", "free trial": "dùng thử miễn phí", "My tools": "Công cụ của tôi", checkup: "kiểm tra" },
};

/** The error and not-found pages render in the browser, so they get only these words, in a small file of their own. */
export const ERROR_KEYS = ["error_title", "error_d", "error_retry", "notFound_title", "notFound_body", "notFound_home"] as const;
export const ERRORS_FILE = "src/content/i18n/errors.json";

export function errorTexts() {
  const english = englishStrings();
  const pick = (strings: Record<string, string>) => Object.fromEntries(ERROR_KEYS.map((key) => [key, strings[key] || english[key]]));
  const out: Record<string, Record<string, string>> = { en: pick(english) };
  for (const lang of Object.keys(LANGUAGES) as Lang[]) out[lang] = pick(readStore(lang).strings);
  return out;
}

export type Json = string | string[] | Json[] | { [key: string]: Json } | null | undefined;

export interface Store {
  strings: Record<string, string>;
  docs: Record<string, unknown>;
  bundles: Record<string, Record<string, string>>;
  tools: Record<string, Record<string, unknown>>;
  /** A short hash of the English each translation was made from. A changed English text is re-translated. */
  sources?: { strings?: Record<string, string>; docs?: Record<string, string>; bundles?: Record<string, string> };
}

export function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

export function readStore(lang: Lang): Store {
  const file = `src/content/i18n/${lang}.json`;
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Store) : { strings: {}, docs: {}, bundles: {}, tools: {} };
}

export function englishStrings() {
  return JSON.parse(fs.readFileSync("src/content/strings.en.json", "utf8")) as Record<string, string>;
}

/** Interface words written by hand in src/lib/i18n.ts, as { en: keys, es: keys, ... }. */
export function handWrittenKeys() {
  const source = fs.readFileSync("src/lib/i18n.ts", "utf8");
  const out: Record<string, Set<string>> = {};
  let current: string | null = null;
  for (const line of source.split("\n")) {
    const start = line.match(/^const (en|es|zh|vi)\b[^=]*= \{/);
    if (start) {
      current = start[1];
      out[current] = new Set();
      continue;
    }
    if (current && /^\};/.test(line)) current = null;
    else if (current) {
      const key = line.match(/^\s+"?([\w-]+)"?:/);
      if (key) out[current].add(key[1]);
    }
  }
  return out;
}

/** A page as the translator sees it: anchors are not text, so they are left out. */
export function docSource(key: keyof typeof DOCS) {
  const doc = DOCS[key];
  return { ...doc, sections: doc.sections.map((section) => Object.fromEntries(Object.entries(section).filter(([field]) => field !== "id"))) };
}

export function bundleSources() {
  return Object.fromEntries(BUNDLES.map((b) => [b.slug, { name: b.name, tagline: b.tagline, forWho: b.forWho, ...(b.note ? { note: b.note } : {}) }]));
}

export function subcategoryDescriptions() {
  const out: Record<string, string> = {};
  for (const category of CATEGORIES) for (const sub of category.subcategories) out[sub.id] = sub.description;
  return out;
}

export function seedBase() {
  return [...HAND_WRITTEN, ...JSON.parse(fs.readFileSync("src/data/seed-discovered.json", "utf8"))] as typeof HAND_WRITTEN;
}

/** Every tool's English text, field by field, the way the site shows it. */
export function toolSources() {
  const research = JSON.parse(fs.readFileSync("src/data/research.json", "utf8")).tools as Record<
    string,
    {
      pricing: { note: string; extraFees: string | null };
      reviews: { summary: string };
      caution: string | null;
      ai?: { level: string; feature: string };
      description?: { summary?: string; helpsWith?: string[]; howToStart?: string };
      guide?: {
        plans: Array<{ monthlyUsd: number; includes: string }>;
        accountSteps: string[];
        connectSteps: string[];
        trial: string;
        paywall: string;
        policies: Array<{ say: string }>;
      };
    }
  >;
  const out: Record<string, Record<string, Json>> = {};
  for (const base of seedBase()) {
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
    const g = r?.guide;
    if (g) {
      // Same order as the site shows them, so each translation lines up with its plan.
      const includes = [...g.plans].sort((a, b) => a.monthlyUsd - b.monthlyUsd).map((plan) => plan.includes);
      if (includes.length) entry.planIncludes = includes;
      if (g.accountSteps.length) entry.accountSteps = g.accountSteps;
      if (g.connectSteps.length) entry.connectSteps = g.connectSteps;
      if (g.trial) entry.trial = g.trial;
      if (g.paywall) entry.paywall = g.paywall;
      if (g.policies.length) entry.policySay = g.policies.map((policy) => policy.say);
    }
    out[base.slug] = entry;
  }
  return out;
}

/** Only the fields this language does not have yet, so a new field does not re-translate a whole tool. */
export function missingFields(source: Record<string, Json>, have: Record<string, unknown> | undefined) {
  const out: Record<string, Json> = {};
  for (const [field, value] of Object.entries(source)) {
    // Nothing to translate, so nothing can be missing.
    if (value === "" || (Array.isArray(value) && value.length === 0)) continue;
    const existing = have?.[field];
    const complete = Array.isArray(value) ? Array.isArray(existing) && existing.length === value.length : typeof existing === "string" && existing.length > 0;
    if (!complete) out[field] = value;
  }
  return out;
}
