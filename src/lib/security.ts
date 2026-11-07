import "server-only";
import { env } from "./env";

/**
 * Request hardening shared by every API route.
 * - Same-origin only: a browser cannot call these from another site (CSRF and CORS).
 *   No Access-Control-Allow-Origin header is ever sent.
 * - JSON only, with a size limit.
 * - Inputs are trimmed, length-capped and stripped of control characters.
 * There is no database, so there is no SQL to inject. Output is rendered as escaped text.
 */

const MAX_BODY_BYTES = 8_000;

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function hostOf(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function assertSameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new HttpError(403, "Cross-site requests are not allowed.");
  }
  const origin = req.headers.get("origin");
  if (origin) {
    const originHost = hostOf(origin);
    if (!originHost || (originHost !== req.headers.get("host") && originHost !== hostOf(env.appUrl))) {
      throw new HttpError(403, "Origin not allowed.");
    }
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) throw new HttpError(415, "Send JSON.");
  if (Number(req.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) throw new HttpError(413, "Request too large.");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, "Request too large.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}

/** Remove control characters and cap length. Keeps letters in any script. */
export function cleanText(input: unknown, max = 300): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function cleanId(input: unknown, max = 40): string {
  if (typeof input !== "string") return "";
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, max);
}

/** Errors never include request text, keys or stack traces. */
export function jsonError(err: unknown) {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status, headers: NO_STORE_HEADERS });
  }
  console.error("[immigrai:api]", err instanceof Error ? err.message : "failed");
  return Response.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE_HEADERS });
}

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
