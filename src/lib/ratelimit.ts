import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { env } from "./env";

/**
 * In-memory rate limiting and a daily call cap.
 *
 * Each warm serverless instance keeps its own counters, and a cold start resets them, so
 * these limits are approximate. The hard ceiling is the spend limit set on the OpenRouter
 * key. To make them exact, swap these Maps for a shared store such as Upstash Redis behind
 * the same two functions.
 */

/** Each API route has its own allowance, so typing in the search box never uses up a checkup. */
export type RateRoute = "suggest" | "match" | "discover" | "checkup" | "prompts" | "tool";

interface Bucket {
  tokens: number;
  updated: number;
}

const buckets = new Map<string, Bucket>();
const daily = new Map<string, number>();
const WINDOW_MS = 60_000;

/** IP addresses are never stored: only a salted hash that dies with the instance. */
const SALT = randomBytes(16).toString("hex");

function clientKey(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip"))?.trim() || "unknown";
  return createHash("sha256").update(SALT).update(ip).digest("hex").slice(0, 32);
}

/**
 * Token bucket: `perMinute` requests per rolling minute, for one visitor on one route.
 * Returns true when allowed. A shared address, such as a library or a phone carrier's,
 * can still hold several owners, which is why each route's allowance is kept separate.
 */
export function allowRequest(req: Request, route: RateRoute, perMinute = env.perMinute) {
  const key = `${route}:${clientKey(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: perMinute, updated: now };
  bucket.tokens = Math.min(perMinute, bucket.tokens + ((now - bucket.updated) / WINDOW_MS) * perMinute);
  bucket.updated = now;
  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;
  buckets.set(key, bucket);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v.updated > WINDOW_MS * 5) buckets.delete(k);
    }
  }
  return allowed;
}

/** Reserve `calls` against the daily cap. Returns false once the cap is reached. */
export function reserveDailyCalls(calls = 1) {
  const day = new Date().toISOString().slice(0, 10);
  const used = daily.get(day) ?? 0;
  if (used + calls > env.dailyCap) return false;
  daily.set(day, used + calls);
  for (const k of daily.keys()) if (k !== day) daily.delete(k);
  return true;
}
