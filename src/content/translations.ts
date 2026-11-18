import "server-only";
import es from "./i18n/es.json";
import vi from "./i18n/vi.json";
import zh from "./i18n/zh.json";
import type { Doc } from "./docs";

/** Machine translations written by scripts/translate-content.mts. Never sent to the browser in full. */
export interface TranslationSet {
  strings: Record<string, string>;
  docs: Record<string, Doc>;
  bundles: Record<string, { name?: string; tagline?: string; forWho?: string; note?: string }>;
  tools: Record<
    string,
    {
      summary?: string;
      aiFeature?: string;
      helpsWith?: string[];
      howToStart?: string;
      pricingNote?: string;
      extraFees?: string;
      reviewSummary?: string;
      caution?: string;
      /** Setup steps, rules and plan details. Each list is in the same order as the English. */
      planIncludes?: string[];
      accountSteps?: string[];
      connectSteps?: string[];
      trial?: string;
      paywall?: string;
      policySay?: string[];
    }
  >;
  /** Hashes of the English each translation was made from. See scripts/translate-content.mts. */
  sources?: { strings?: Record<string, string>; docs?: Record<string, string>; bundles?: Record<string, string> };
}

export const TRANSLATIONS = { es, zh, vi } as unknown as Record<"es" | "zh" | "vi", TranslationSet>;
