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
      helpsWith?: string[];
      howToStart?: string;
      pricingNote?: string;
      extraFees?: string;
      reviewSummary?: string;
      caution?: string;
    }
  >;
}

export const TRANSLATIONS = { es, zh, vi } as unknown as Record<"es" | "zh" | "vi", TranslationSet>;
