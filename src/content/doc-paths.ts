/**
 * Addresses of the long-form pages. Kept apart from their text so the request proxy can
 * check them without loading every page. docs.ts is checked against this list when the
 * project compiles, so the two cannot drift apart.
 */
export const DOC_PATHS = ["methodology", "free-help", "about", "privacy", "terms", "refunds", "cookies", "accessibility", "data-deletion"] as const;

export type DocPath = (typeof DOC_PATHS)[number];
