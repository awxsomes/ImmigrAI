import "server-only";

/**
 * Tiny in-memory TTL cache so repeated searches do not re-spend AI credits.
 * Per function instance; swap for Vercel KV or Upstash for a shared cache.
 */
interface Entry<T> {
  value: T;
  expires: number;
}

const store = new Map<string, Entry<unknown>>();
const MAX_ENTRIES = 500;

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (e.expires < Date.now()) {
    store.delete(key);
    return null;
  }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  if (store.size >= MAX_ENTRIES) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
