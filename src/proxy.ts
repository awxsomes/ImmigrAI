import { NextResponse, type NextRequest } from "next/server";
import { DOC_PATHS } from "@/content/doc-paths";
import { BUNDLES } from "@/data/bundles";

const LOCALES = ["en", "es", "zh", "vi"];
const PAGES = new Set<string>(["search", "compare", "my-tools", "bundles", "tools", "checkup", ...DOC_PATHS]);
const KITS = new Set<string>([...BUNDLES.map((b) => b.slug), "new-tools"]);

/** Pick the first language in the browser's list that the site is translated into. */
function pickLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) return "en";
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => LOCALES.includes(r.base))?.base ?? "en";
}

/**
 * Two jobs:
 * 1. Send "/" and un-prefixed paths to a language folder. Language lives in the URL, so no
 *    cookie is needed and pages stay cacheable.
 * 2. Give unknown addresses a real 404. Once a prerendered page starts streaming its status
 *    is locked at 200, so this has to be decided before the page renders.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [lang, page, kit, ...rest] = pathname.split("/").filter(Boolean);

  if (lang && LOCALES.includes(lang)) {
    // Framework requests for prefetched data carry a dot, such as "search.rsc".
    if (pathname.includes(".") || rest.length > 0) return NextResponse.next();
    const known = kit ? page === "bundles" && KITS.has(kit) : !page || PAGES.has(page);
    if (known) return NextResponse.next();
    const missing = request.nextUrl.clone();
    missing.pathname = `/${lang}/not-found/page`;
    return NextResponse.rewrite(missing);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language");
  return response;
}

export const config = {
  matcher: [
    // Un-prefixed paths, skipping API routes and static files.
    "/((?!en(?:/|$)|es(?:/|$)|zh(?:/|$)|vi(?:/|$)|api/|_next/|.*\\..*).*)",
    // Addresses that could be mistyped. Home and tool pages skip this entirely.
    "/(en|es|zh|vi)/:page",
    "/(en|es|zh|vi)/bundles/:kit",
  ],
};
