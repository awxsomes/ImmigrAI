import { discoverTools } from "@/lib/discover";
import { allowRequest, clientKey } from "@/lib/ratelimit";
import { assertSameOrigin, cleanId, cleanLang, cleanText, HttpError, jsonError, NO_STORE_HEADERS, readJson } from "@/lib/security";

export const maxDuration = 60;

const BUSINESS_TYPES = new Set(["restaurant", "salon", "retail", "trades", "cleaning", ""]);

function validate(categoryId: string, subcategoryId: string, businessType: string) {
  if (!categoryId) throw new HttpError(400, "Pick a category first.");
  return { categoryId, subcategoryId: subcategoryId || undefined, businessType: BUSINESS_TYPES.has(businessType) ? businessType : "" };
}

function statusHeaders(ok: boolean) {
  // A category search holds no personal data, so the CDN can share it between visitors.
  // That means one paid search per category and language every 12 hours, not one per visit.
  return ok
    ? { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" }
    : NO_STORE_HEADERS;
}

/** GET ?cat=&sub=&biz=&lang= : shared, cacheable category search. */
export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
    const params = new URL(req.url).searchParams;
    const input = validate(cleanId(params.get("cat")), cleanId(params.get("sub")), cleanId(params.get("biz"), 20));
    const lang = cleanLang(params.get("lang"));

    if (!allowRequest(clientKey(req), 6)) throw new HttpError(429, "Too many searches. Please wait a minute.");

    const result = await discoverTools({ ...input, lang });
    return Response.json(result, { headers: statusHeaders(result.status === "ok") });
  } catch (err) {
    return jsonError(err);
  }
}

/** POST { cat, sub, biz, lang, q } : the owner's own words, never shared or cached by the CDN. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<Record<string, unknown>>(req);
    const input = validate(cleanId(body.cat), cleanId(body.sub), cleanId(body.biz, 20));
    const lang = cleanLang(body.lang);
    const query = cleanText(body.q, 200);

    if (!allowRequest(clientKey(req), 6)) throw new HttpError(429, "Too many searches. Please wait a minute.");

    const result = await discoverTools({ ...input, query, lang });
    return Response.json(result, { headers: NO_STORE_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}
