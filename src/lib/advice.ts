import type { Dict } from "./i18n";
import type { Tool } from "./types";

/**
 * Tools that write or explain legal, tax, payroll or HR paperwork. None of them is a
 * professional, and most are too new to have public reviews, so every place one appears
 * carries a warning and a pointer to free help from a person.
 *
 * Nonprofit and government resources are that free help, so they get no warning.
 */
export type AdviceKind = "legal" | "tax" | "payroll" | "hr";

export function adviceKind(tool: Pick<Tool, "categoryId" | "subcategoryId" | "publicResource">): AdviceKind | null {
  if (tool.publicResource) return null;
  if (tool.categoryId === "legal") return tool.subcategoryId === "employment-docs" ? "hr" : "legal";
  if (tool.categoryId === "money" && tool.subcategoryId === "taxes") return "tax";
  if (tool.categoryId === "employees" && tool.subcategoryId === "payroll") return "payroll";
  return null;
}

/** Which free help to list first on a results page, before any tool. */
export function freeHelpFor(categoryId: string, subcategoryId?: string): Array<"legal" | "tax" | "labor"> {
  if (categoryId === "legal") return subcategoryId === "employment-docs" || subcategoryId === "regulations" ? ["labor", "legal"] : ["legal"];
  if (categoryId === "money" && subcategoryId === "taxes") return ["tax"];
  if (categoryId === "employees" && subcategoryId === "payroll") return ["tax", "labor"];
  return [];
}

export const ADVICE_KEYS = ["advice_title", "advice_legal", "advice_tax", "advice_payroll", "advice_hr", "advice_freeHelp"] as const;
export type AdviceLabels = Pick<Dict, (typeof ADVICE_KEYS)[number]>;

export const ADVICE_TEXT: Record<AdviceKind, (typeof ADVICE_KEYS)[number]> = {
  legal: "advice_legal",
  tax: "advice_tax",
  payroll: "advice_payroll",
  hr: "advice_hr",
};

/** Free help from people, in the order it is shown. Links are to the official sites. */
export const FREE_HELP = {
  legal: { text: "freeFirst_legal", link: "freeFirst_legalLink", href: "https://www.lawhelp.org" },
  tax: { text: "freeFirst_tax", link: "freeFirst_taxLink", href: "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" },
  labor: { text: "freeFirst_labor", link: "freeFirst_laborLink", href: "https://www.dol.gov/agencies/whd" },
} as const;
