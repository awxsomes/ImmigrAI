import { SYSTEM_NAMES } from "@/data/systems";
import { env } from "@/lib/env";
import { isBusinessType, matchNeed } from "@/lib/match";
import { allowRequest, clientKey } from "@/lib/ratelimit";
import { assertSameOrigin, cleanLang, cleanText, HttpError, jsonError, NO_STORE_HEADERS, readJson } from "@/lib/security";
import type { TeamSize } from "@/lib/types";

export const maxDuration = 60;

const SIZES = new Set<string>(["1", "2-5", "6-20", "21+"]);
const SYSTEMS = new Set(SYSTEM_NAMES);

/** POST { need, lang, type, size, systems, language }: tools for one owner's specific need. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<Record<string, unknown>>(req);
    const need = cleanText(body.need, 300);
    if (need.length < 3) throw new HttpError(400, "Tell us what you need.");

    if (!allowRequest(clientKey(req), 6)) throw new HttpError(429, "Too many searches. Please wait a minute.");

    let cost = 0;
    const result = await matchNeed(
      {
        need,
        lang: cleanLang(body.lang),
        type: isBusinessType(body.type) ? body.type : "",
        size: typeof body.size === "string" && SIZES.has(body.size) ? (body.size as TeamSize) : "",
        // Only names we know, so this list cannot carry anything else into a prompt.
        systems: Array.isArray(body.systems) ? [...new Set(body.systems.filter((s): s is string => typeof s === "string" && SYSTEMS.has(s)))].slice(0, 8) : [],
        language: cleanText(body.language, 40),
        liveSearch: body.liveSearch !== false,
      },
      (usd) => {
        cost += usd;
      },
      // Only for measuring on a developer's machine. Never honored once deployed.
      { fresh: !env.isProd && body.fresh === true },
    );
    return Response.json(result, { headers: { ...NO_STORE_HEADERS, ...(env.isProd ? {} : { "X-Debug-Cost": cost.toFixed(4) }) } });
  } catch (err) {
    return jsonError(err);
  }
}
