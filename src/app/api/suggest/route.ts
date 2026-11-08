import { suggestCategories } from "@/lib/discover";
import { localSuggestions } from "@/lib/matcher";
import { allowRequest, clientKey } from "@/lib/ratelimit";
import { assertSameOrigin, cleanLang, cleanText, jsonError, NO_STORE_HEADERS, readJson } from "@/lib/security";

export const maxDuration = 20;

/**
 * POST { q, lang }. Maps everyday words to categories. Instant keyword matches are
 * used when they are confident, so the AI is only paid for when it adds something.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<{ q?: unknown; lang?: unknown }>(req);
    const q = cleanText(body.q, 200);
    const lang = cleanLang(body.lang);
    if (q.length < 3) return Response.json({ suggestions: [], source: "local" }, { headers: NO_STORE_HEADERS });

    const local = localSuggestions(q, 5);
    if (local.length > 0 && local[0].confidence >= 0.75) {
      return Response.json({ suggestions: local, source: "local" }, { headers: NO_STORE_HEADERS });
    }
    if (!allowRequest(clientKey(req))) {
      return Response.json({ suggestions: local, source: "local", limited: true }, { headers: NO_STORE_HEADERS });
    }

    const ai = await suggestCategories(q, lang).catch(() => []);
    if (ai.length === 0) return Response.json({ suggestions: local, source: "local" }, { headers: NO_STORE_HEADERS });

    const seen = new Set(ai.map((s) => `${s.categoryId}/${s.subcategoryId ?? ""}`));
    const merged = [...ai, ...local.filter((s) => !seen.has(`${s.categoryId}/${s.subcategoryId ?? ""}`))].slice(0, 5);
    return Response.json({ suggestions: merged, source: "ai" }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}
