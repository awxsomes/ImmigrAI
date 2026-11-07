import "server-only";

/**
 * Server-side environment. Import this only from server code.
 * Secrets never reach the browser: nothing here is prefixed NEXT_PUBLIC_.
 */
function num(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function resolveAppUrl() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";

export const env = {
  openRouterKey: process.env.OPENROUTER_API_KEY?.trim() ?? "",
  model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
  searchModel: process.env.OPENROUTER_SEARCH_MODEL?.trim() || process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
  dailyCap: num("AI_DAILY_CALL_CAP", 400),
  perMinute: num("AI_RATE_LIMIT_PER_MINUTE", 12),
  appUrl: resolveAppUrl(),
  isProd: process.env.NODE_ENV === "production",
};

export function aiEnabled() {
  return env.openRouterKey.startsWith("sk-or-") && env.dailyCap > 0;
}
