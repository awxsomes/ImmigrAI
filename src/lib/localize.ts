import "server-only";
import { BUNDLES } from "@/data/bundles";
import { LANGUAGE_BY_CODE } from "@/data/languages";
import { CATEGORIES } from "@/data/taxonomy";
import { DOCS, type Doc, type DocKey } from "@/content/docs";
import { TAXONOMY_NAMES } from "@/content/taxonomy-names";
import { TRANSLATIONS, type TranslationSet } from "@/content/translations";
import type { Bundle, Tool } from "./types";

type Translated = "es" | "zh" | "vi";

function isTranslated(lang: string): lang is Translated {
  return lang === "es" || lang === "zh" || lang === "vi";
}

/** Translated setup steps, rules and plan details. Each list is in the same order as the English. */
interface GuideTranslation {
  planIncludes?: string[];
  accountSteps?: string[];
  connectSteps?: string[];
  trial?: string;
  paywall?: string;
  policySay?: string[];
}

/** A translated list is only used when it still lines up with the English one. */
function sameLength(translated: string[] | undefined, original: string[]) {
  return translated?.length === original.length ? translated : original;
}

export function localizeTool(tool: Tool, lang: string): Tool {
  if (!isTranslated(lang)) return tool;
  const x = TRANSLATIONS[lang].tools[tool.slug] as (TranslationSet["tools"][string] & GuideTranslation) | undefined;
  if (!x) return tool;
  const plans = tool.pricing.plans;
  const includes = plans && sameLength(x.planIncludes, plans.map((plan) => plan.includes));
  const guide = tool.guide;
  const says = guide && sameLength(x.policySay, guide.policies.map((policy) => policy.say));
  return {
    ...tool,
    guide: guide && {
      ...guide,
      accountSteps: sameLength(x.accountSteps, guide.accountSteps),
      connectSteps: sameLength(x.connectSteps, guide.connectSteps),
      trial: guide.trial ? x.trial || guide.trial : "",
      paywall: guide.paywall ? x.paywall || guide.paywall : "",
      policies: guide.policies.map((policy, i) => ({ ...policy, say: says?.[i] || policy.say })),
    },
    summary: x.summary || tool.summary,
    ai: { ...tool.ai, feature: tool.ai.feature ? x.aiFeature || tool.ai.feature : "" },
    helpsWith: x.helpsWith?.length === tool.helpsWith.length ? x.helpsWith : tool.helpsWith,
    howToStart: x.howToStart || tool.howToStart,
    pricing: {
      ...tool.pricing,
      note: x.pricingNote || tool.pricing.note,
      extraFees: tool.pricing.extraFees ? x.extraFees || tool.pricing.extraFees : undefined,
      plans: plans?.map((plan, i) => ({ ...plan, includes: includes?.[i] || plan.includes })),
    },
    reviews: { ...tool.reviews, summary: tool.reviews.summary ? x.reviewSummary || tool.reviews.summary : "" },
    caution: tool.caution ? x.caution || tool.caution : undefined,
  };
}

export function localizeBundle(bundle: Bundle, lang: string): Bundle {
  if (!isTranslated(lang)) return bundle;
  const x = TRANSLATIONS[lang].bundles[bundle.slug];
  return x ? { ...bundle, name: x.name || bundle.name, tagline: x.tagline || bundle.tagline, forWho: x.forWho || bundle.forWho, note: bundle.note ? x.note || bundle.note : undefined } : bundle;
}

export function localBundles(lang: string) {
  return BUNDLES.map((b) => localizeBundle(b, lang));
}

export function getDoc(key: DocKey, lang: string): { doc: Doc; translated: boolean } {
  const translated = isTranslated(lang) ? TRANSLATIONS[lang].docs[key] : undefined;
  return translated ? { doc: translated, translated: true } : { doc: DOCS[key], translated: false };
}

/** A category or subcategory name in the reader's language. */
export function nameOf(lang: string, id: string, fallback: string) {
  return (isTranslated(lang) && TAXONOMY_NAMES[lang][id]) || fallback;
}

export function localTaxonomy(lang: string) {
  return CATEGORIES.map((c) => ({
    id: c.id,
    name: nameOf(lang, c.id, c.name),
    subs: c.subcategories.map((s) => ({ id: s.id, name: nameOf(lang, s.id, s.name) })),
  }));
}

/** The language name matching the page, so tools can be checked against it by default. */
export function pageLanguageName(lang: string) {
  return lang === "en" ? "" : (LANGUAGE_BY_CODE.get(lang)?.name ?? "");
}
