import { COMPAT_KEYS, PROMPT_KEYS } from "@/lib/labels";

/** Every word the checkup results use. Kept apart from a "use client" file so the server can read the list. */
export const CHECKUP_KEYS = [
  ...COMPAT_KEYS,
  ...PROMPT_KEYS,
  "card_free", "card_freePlan", "card_noMonthlyFee", "card_youSetBudget", "card_perReturn", "price_amount", "price_amountPerson", "price_amountLocation", "price_amountUse", "price_plan",
  "tool_leaving",
  "checkup_title", "checkup_loading", "checkup_matched", "checkup_wrong", "checkup_pages", "checkup_pagesOne", "checkup_pagesNone", "checkup_partial",
  "checkup_saysTitle", "checkup_praise", "checkup_complaint", "checkup_source", "checkup_noThemes",
  "checkup_siteTitle", "checkup_siteNone", "checkup_siteThin", "checkup_sigPhone", "checkup_sigNoPhone", "checkup_sigBooking", "checkup_sigNoBooking",
  "checkup_sigOrdering", "checkup_sigNoOrdering", "checkup_sigHours", "checkup_sigNoHours", "checkup_sigHttps", "checkup_sigLanguages", "checkup_sigOneLanguage",
  "checkup_fixTitle", "checkup_noProblems", "checkup_evReview", "checkup_evSite", "checkup_evNoSite", "checkup_tool", "checkup_useThis", "checkup_setup", "checkup_connect", "checkup_stepsSource",
  "checkup_adoptTitle", "checkup_adoptDirect", "checkup_adoptBridge", "checkup_adoptImport", "checkup_adoptUnknown", "checkup_seeTool", "checkup_noTool",
  "checkup_planTitle", "checkup_planCost", "checkup_planLinks", "checkup_planSave", "checkup_planSaved",
  "checkup_notFound", "checkup_describe", "checkup_paused", "checkup_failed", "checkup_limited",
] as const;
