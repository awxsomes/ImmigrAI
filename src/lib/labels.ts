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
  "card_fees", "card_needsSales",
  "price_amount", "price_amountPerson", "price_amountLocation", "price_amountUse", "price_plan", "price_next", "price_estimate", "price_plansUnconfirmed", "price_paywall",
  "card_builtFor", "card_generalNote", "trade_restaurant", "trade_salon", "trade_retail", "trade_trades", "trade_cleaning",
  "env_light", "env_moderate", "env_heavy",
  "wl_none", "wl_background-ml", "wl_optional-genai", "wl_translation", "wl_llm-every-reply", "wl_speech", "wl_image-video", "wl_voice-agent",
] as const;

export type CardLabels = Pick<Dict, (typeof CARD_KEYS)[number]>;

export const ADOPT_KEYS = [
  "adopt_title", "adopt_account", "adopt_connect", "adopt_rules", "adopt_noSteps", "adopt_tellUs", "adopt_tellUsLink", "adopt_confirmed", "adopt_bridge",
  "adopt_unconfirmed", "adopt_worksWith", "adopt_connectSteps", "adopt_noConnectSteps", "adopt_notStated", "adopt_source",
  "rule_cancel", "rule_refund", "rule_contract", "rule_ai-training", "rule_data-export",
  "tool_setupAbout", "tool_estimate", "tool_startAlone", "card_needsSales", "tool_runsOn", "tool_caution", "tool_leaving",
  "platform_web", "platform_ios", "platform_android", "platform_desktop", "platform_phone", "platform_pos-hardware",
] as const;
export type AdoptionLabels = Pick<Dict, (typeof ADOPT_KEYS)[number]>;

export const PROMPT_KEYS = ["prompts_title", "prompts_intro", "prompts_button", "prompts_loading", "prompts_failed", "prompts_copy", "prompts_copied", "prompts_copyFailed"] as const;
export type PromptLabels = Pick<Dict, (typeof PROMPT_KEYS)[number]>;

export const ACTION_KEYS = ["card_saveTool", "card_savedTool", "card_addCompare", "card_removeCompare"] as const;
export type ActionLabels = Pick<Dict, (typeof ACTION_KEYS)[number]>;

export const SEARCH_KEYS = [
  "search_label", "search_placeholder", "search_button", "search_hint", "search_privacy", "search_thinking", "search_noMatch",
  "search_aiMatch", "search_count", "search_suggestions", "search_opening",
] as const;
export type SearchLabels = Pick<Dict, (typeof SEARCH_KEYS)[number]>;

export const COMPAT_KEYS = ["compat_direct", "compat_bridge", "compat_shared", "compat_none", "compat_directD", "compat_bridgeD", "compat_sharedD", "compat_noneD"] as const;
export type CompatLabels = Pick<Dict, (typeof COMPAT_KEYS)[number]>;

export const RESULTS_KEYS = [
  ...CARD_KEYS, ...ACTION_KEYS,
  "results_showing", "results_searching", "results_foundNew", "results_foundNone", "results_paused", "results_failed", "results_saveData",
  "results_searchWeb", "results_none", "results_sort", "results_pick", "results_otherTools", "results_generalTools", "results_generalNote",
  "sort_overall", "sort_cheapest", "sort_rating", "sort_env", "sort_easiest",
  "filter_title", "filter_price", "filter_rating", "filter_anyRating", "filter_env", "filter_reset", "filter_show", "filter_hide",
  "filter_businessType", "businessType_any", "businessType_restaurant", "businessType_salon", "businessType_retail", "businessType_trades", "businessType_cleaning",
  "filter_stars", "filter_star", "filter_priceUpTo", "filter_priceFree", "filter_envAtLeast", "filter_envAny", "filter_onlyMine", "filter_onlyConnect", "filter_myLanguage", "filter_chooseLanguage",
  "compare_bar", "compare_go", "compare_clear", "compare_max",
] as const;
export type ResultsLabels = Pick<Dict, (typeof RESULTS_KEYS)[number]>;

export const MATCH_KEYS = [
  ...CARD_KEYS, ...ACTION_KEYS,
  "match_title", "match_understood", "match_change", "match_changeLabel", "match_again", "match_searching", "match_found", "match_foundOne", "match_nothing",
  "match_failed", "match_paused", "match_fitExact", "match_fitJob", "match_fitClose", "match_why", "match_useThis", "match_fitsTitle", "match_direct",
  "match_bridge", "match_import", "match_unknown", "match_proof", "match_addSystems", "match_seeAll",
] as const;
export type MatchLabels = Pick<Dict, (typeof MATCH_KEYS)[number]>;
