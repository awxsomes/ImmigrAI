import { SYSTEM_NAMES } from "@/data/systems";
import { cachedCheckup, runCheckup, type CheckupInput } from "@/lib/checkup";
import { safeUrl } from "@/lib/normalize";
import { allowRequest, clientKey } from "@/lib/ratelimit";
import { assertSameOrigin, cleanLang, cleanText, HttpError, jsonError, NO_STORE_HEADERS, readJson } from "@/lib/security";
import { BUSINESS_TYPES, type BusinessType, type TeamSize } from "@/lib/types";

export const maxDuration = 60;

const SIZES: TeamSize[] = ["1", "2-5", "6-20", "21+"];

/** POST { name, city, website, type, size, systems, lang }. Everything here is checked, because a client can send anything. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<Record<string, unknown>>(req);
    const name = cleanText(body.name, 80);
    const city = cleanText(body.city, 60);
    if (name.length < 2 || city.length < 2) throw new HttpError(400, "Business name and city are needed.");

    const input: CheckupInput = {
      name,
      city,
      website: safeUrl(cleanText(body.website, 200)),
      lang: cleanLang(body.lang),
      type: BUSINESS_TYPES.includes(body.type as BusinessType) ? (body.type as BusinessType) : "",
      size: SIZES.includes(body.size as TeamSize) ? (body.size as TeamSize) : "",
      systems: Array.isArray(body.systems) ? body.systems.filter((s): s is string => typeof s === "string" && SYSTEM_NAMES.includes(s)).slice(0, 12) : [],
    };

    const cached = cachedCheckup(input);
    if (cached) return Response.json(cached, { headers: NO_STORE_HEADERS });

    if (!allowRequest(clientKey(req), 3)) throw new HttpError(429, "Too many checkups. Please wait a minute.");
    return Response.json(await runCheckup(input), { headers: NO_STORE_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}
