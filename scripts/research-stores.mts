/**
 * Reads the Languages field of each tool's US App Store listing into src/data/research.json, so a
 * tool page can say "not supported" instead of "not checked" when a language is missing. Uses
 * Apple's public lookup, so it costs nothing and needs no API key.
 *
 * The listing comes from a confirmed App Store review page, or with --homepages from an App
 * Store link on the tool's own home page. The app's name must match the tool's either way.
 * Google Play listings have no language field, so there is nothing to read there.
 *
 *   node --no-warnings scripts/research-stores.mts              tools with an App Store review page
 *   node --no-warnings scripts/research-stores.mts --homepages  also look for links on home pages
 */
import fs from "node:fs";
import path from "node:path";
import { SEED_BASE as HAND_WRITTEN } from "../src/data/seed-base.ts";
import { appStoreCountry, appStoreLanguages, safeFetch, type StoreLanguages } from "../src/lib/research-core.ts";

const OUT = path.resolve("src/data/research.json");
const SEED_BASE = [...HAND_WRITTEN, ...JSON.parse(fs.readFileSync("src/data/seed-discovered.json", "utf8"))] as typeof HAND_WRITTEN;
const homepages = process.argv.includes("--homepages");

interface Entry {
  currentName?: string;
  reviews: { sources: Array<{ site: string; url: string }> };
  languages: { list: string[]; sourceUrl: string; totalClaim: string | null; store?: StoreLanguages & { checkedAt: string } };
}

const store = JSON.parse(fs.readFileSync(OUT, "utf8")) as { tools: Record<string, Entry> };

/** App Store links on a page, as US listings. A link to another country's store is read from the US store. */
async function linksOnHomePage(website: string) {
  try {
    const page = await safeFetch(website, { timeoutMs: 8_000, maxBytes: 1_500_000 });
    const ids = [...page.text.matchAll(/https?:\/\/(?:apps|itunes)\.apple\.com\/[^"'\s<>]*?\/id(\d{5,12})/gi)].map((m) => m[1]);
    return [...new Set(ids)].slice(0, 3).map((id) => `https://apps.apple.com/us/app/id${id}`);
  } catch {
    return [];
  }
}

async function readTool(base: (typeof SEED_BASE)[number]) {
  const entry = store.tools[base.slug];
  if (!entry) return "no research";
  const names = [...new Set([base.name, entry.currentName].filter((n): n is string => Boolean(n?.trim())))];
  const reviewed = entry.reviews.sources.filter((s) => appStoreCountry(s.url) === "us").map((s) => s.url);
  const listings = reviewed.length || !homepages ? reviewed : await linksOnHomePage(base.website);
  for (const url of listings) {
    for (const name of names) {
      const found = await appStoreLanguages(url, name);
      if (found) {
        entry.languages.store = { ...found, checkedAt: new Date().toISOString().slice(0, 10) };
        return `${found.list.length} languages from "${found.appName}"`;
      }
    }
  }
  return listings.length ? "listing did not match the name" : "no App Store listing";
}

let index = 0;
const results: Record<string, number> = {};
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (index < SEED_BASE.length) {
      const base = SEED_BASE[index++];
      const outcome = await readTool(base);
      const kind = outcome.includes("languages from") ? "read" : outcome;
      results[kind] = (results[kind] ?? 0) + 1;
      if (kind === "read") console.log(`${base.slug.padEnd(28)} ${outcome}`);
    }
  }),
);
fs.writeFileSync(OUT, `${JSON.stringify(store, null, 1)}\n`);
console.log(results);
