import type { Dict } from "./i18n";

/** Send client components only the words they use, instead of the whole dictionary. */
export function pick<K extends keyof Dict>(t: Dict, keys: readonly K[]): Pick<Dict, K> {
  const out = {} as Pick<Dict, K>;
  for (const key of keys) out[key] = t[key];
  return out;
}

/** "{n} tools" with { n: 3 } becomes "3 tools". */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export const CARD_KEYS = [
  "card_cost", "card_rating", "card_footprint", "card_language", "card_connects", "card_score", "card_scoreOf",
  "card_noRating", "card_publicResource", "card_priceUnconfirmed", "card_ratingLine", "card_fromSites", "card_fromSite",
  "card_reviewCount", "card_new", "card_noConnections", "card_more", "card_worksInLang", "card_notConfirmedLang",
  "card_languageCount", "card_languageOne", "card_seeLanguages", "card_connectsExisting", "card_details", "card_free",
  "card_freePlan", "card_noMonthlyFee", "card_youSetBudget", "card_perReturn",
  "card_aiCore", "card_aiFeature", "card_aiNone", "card_aiDoes", "card_smallTool",
  "card_from", "card_perMonth", "card_fees", "card_needsSales",
  "env_light", "env_moderate", "env_heavy",
  "wl_none", "wl_background-ml", "wl_optional-genai", "wl_translation", "wl_llm-every-reply", "wl_speech", "wl_image-video", "wl_voice-agent",
] as const;

export type CardLabels = Pick<Dict, (typeof CARD_KEYS)[number]>;

export const ACTION_KEYS = ["card_saveTool", "card_savedTool", "card_addCompare", "card_removeCompare"] as const;
export type ActionLabels = Pick<Dict, (typeof ACTION_KEYS)[number]>;

export const SEARCH_KEYS = [
  "search_label", "search_placeholder", "search_button", "search_hint", "search_privacy", "search_thinking", "search_noMatch",
  "search_aiMatch", "search_count", "search_suggestions",
] as const;
export type SearchLabels = Pick<Dict, (typeof SEARCH_KEYS)[number]>;

export const COMPAT_KEYS = ["compat_direct", "compat_bridge", "compat_shared", "compat_none", "compat_directD", "compat_bridgeD", "compat_sharedD", "compat_noneD"] as const;
export type CompatLabels = Pick<Dict, (typeof COMPAT_KEYS)[number]>;

export const RESULTS_KEYS = [
  ...CARD_KEYS, ...ACTION_KEYS,
  "results_showing", "results_searching", "results_foundNew", "results_foundNone", "results_paused", "results_failed", "results_saveData",
  "results_searchWeb", "results_none", "results_sort", "results_pick", "results_otherTools",
  "sort_overall", "sort_cheapest", "sort_rating", "sort_env", "sort_easiest",
  "filter_title", "filter_price", "filter_rating", "filter_anyRating", "filter_env", "filter_reset", "filter_show", "filter_hide",
  "filter_businessType", "businessType_any", "businessType_restaurant", "businessType_salon", "businessType_retail", "businessType_trades", "businessType_cleaning",
  "filter_stars", "filter_star", "filter_priceUpTo", "filter_priceFree", "filter_envAtLeast", "filter_envAny", "filter_onlyMine", "filter_myLanguage", "filter_chooseLanguage",
  "compare_bar", "compare_go", "compare_clear", "compare_max",
] as const;
export type ResultsLabels = Pick<Dict, (typeof RESULTS_KEYS)[number]>;
