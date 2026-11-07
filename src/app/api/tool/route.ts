import { SEED_BY_SLUG, SEED_TOOLS } from "@/data/seed-tools";
import { lookupTool } from "@/lib/discover";
import { slugify } from "@/lib/normalize";
import { allowRequest, clientKey } from "@/lib/ratelimit";
import { assertSameOrigin, cleanId, cleanText, HttpError, jsonError, NO_STORE_HEADERS, readJson } from "@/lib/security";

export const maxDuration = 60;

/** POST { slug?, name?, lang }. One tool: from the catalog if known, otherwise researched live. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<Record<string, unknown>>(req);
    const slug = cleanId(body.slug, 60);
    const name = cleanText(body.name, 80);
    const lang = cleanId(body.lang, 5) || "en";
    if (!slug && !name) throw new HttpError(400, "Tool name missing.");

    const known = (slug && SEED_BY_SLUG.get(slug)) || SEED_TOOLS.find((t) => slugify(t.name) === slugify(name || slug));
    if (known) return Response.json({ tool: known }, { headers: NO_STORE_HEADERS });

    if (!allowRequest(clientKey(req), 6)) throw new HttpError(429, "Too many lookups. Please wait a minute.");

    const tool = await lookupTool(name || slug.replace(/-/g, " "), lang);
    return Response.json({ tool }, { status: tool ? 200 : 404, headers: NO_STORE_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}
