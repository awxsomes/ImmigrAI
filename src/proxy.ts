import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "es", "zh", "vi"];

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
 * Sends "/" and un-prefixed paths to a language folder. Language lives in the URL,
 * so no cookie is needed and pages stay cacheable.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request.headers.get("accept-language"))}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language");
  return response;
}

export const config = {
  // Skip language-prefixed pages, API routes and static files, so most requests never run this.
  matcher: ["/((?!en(?:/|$)|es(?:/|$)|zh(?:/|$)|vi(?:/|$)|api/|_next/|.*\\..*).*)"],
};
