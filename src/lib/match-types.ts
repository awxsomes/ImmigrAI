import type { BusinessType, TeamSize, Tool } from "./types";

/**
 * The contract for need-first matching, shared by the search page and the business checkup.
 * An owner describes one specific need and the answer is the tools that do that job.
 */

export interface MatchInput {
  /** The owner's own words. */
  need: string;
  lang: string;
  type?: BusinessType | "";
  size?: TeamSize;
  /** Software they already run. */
  systems?: string[];
  /** The owner's working language, as an English name. */
  language?: string;
  /** Set to false to answer from the catalog alone, which is instant and costs almost nothing. */
  liveSearch?: boolean;
}

/** What we understood the owner to be asking for. Shown back to them so they can correct it. */
export interface NeedBrief {
  job: string;
  trade: BusinessType | "";
  mustHave: string[];
  categoryId: string;
  subcategoryId: string;
}

/**
 * direct: the tool's own pages name this software as an integration.
 * bridge: connects through Zapier or Make.
 * import: no live link, but the data can be brought in by file.
 * unknown: nothing we could confirm.
 */
export type AdoptionLevel = "direct" | "bridge" | "import" | "unknown";

export interface Adoption {
  system: string;
  level: AdoptionLevel;
  /** Only set when a page confirms it. */
  evidenceUrl?: string;
}

/**
 * Where a tool was found. marketplace: the app directory of software the owner uses.
 * trade: trade publications and owner forums. launch: launch sites for new products.
 * alternatives: named as a competitor of a good candidate. vendor: a search for the exact job.
 * catalog: our own checked list.
 */
export type MatchLane = "marketplace" | "trade" | "launch" | "alternatives" | "vendor" | "catalog";

export interface MatchedTool {
  tool: Tool;
  lanes?: MatchLane[];
  /** exact: does this job for this kind of business. close: does this job for any business. */
  fit: "exact" | "close";
  /** One plain sentence, specific to what this owner asked for. */
  why: string;
  /** Which parts of the tool to use for this need. */
  useThis: string[];
  adoption: Adoption[];
}

export type MatchStatus = "ok" | "ai-off" | "daily-cap" | "error";

export interface MatchResult {
  status: MatchStatus;
  brief: NeedBrief | null;
  tools: MatchedTool[];
  /** True when we looked and honestly found nothing specialized for this need. */
  nothingSpecialized: boolean;
}
