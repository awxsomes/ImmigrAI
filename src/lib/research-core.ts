/**
 * Shared research primitives, used by the API routes and by scripts/research-tools.ts.
 * Keep this file free of path aliases and "server-only" so Node can run it directly.
 *
 * The rule this file enforces: a model's claim only counts if the text the search
 * engine actually returned backs it up. A rating that is not in the cited page's
 * text is thrown away, however confident the model sounded.
 */

import dns from "node:dns";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import zlib from "node:zlib";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface Citation {
  url: string;
  title: string;
  content: string;
}

export interface WebJsonOptions {
  apiKey: string;
  appUrl: string;
  model: string;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  /** Turn on web search. Off for cheap classification calls. */
  web?: boolean;
  includeDomains?: string[];
  maxResults?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** How many times to try. A search with a deadline uses 1. */
  attempts?: number;
}

export interface WebJsonResult<T> {
  data: T;
  citations: Citation[];
  cost: number;
}

interface RouterResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
      annotations?: Array<{
        type: string;
        url_citation?: { url: string; title?: string; content?: string };
      }>;
    };
  }>;
  usage?: { cost?: number };
  error?: { message?: string };
}

function stripFences(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

/**
 * Ask OpenRouter for JSON matching a schema, optionally grounded in web search.
 * Requests are routed only to providers that do not store or train on prompts.
 */
export async function webJson<T>(opts: WebJsonOptions): Promise<WebJsonResult<T>> {
  const body: Record<string, unknown> = {
    model: opts.model,
    temperature: 0,
    max_tokens: opts.maxTokens ?? 1200,
    provider: { data_collection: "deny" },
    // Extraction, not reasoning: extended thinking would eat the token budget and truncate the JSON.
    reasoning: { enabled: false },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
    },
  };
  if (opts.web) {
    const plugin: Record<string, unknown> = {
      id: "web",
      engine: "exa",
      max_results: opts.maxResults ?? 6,
    };
    if (opts.includeDomains?.length) plugin.include_domains = opts.includeDomains;
    body.plugins = [plugin];
  }

  const timeoutMs = opts.timeoutMs ?? 40_000;
  const attempts = opts.attempts ?? 2;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": opts.appUrl,
          "X-Title": "ImmigrAI",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`OpenRouter ${res.status}`);
        if (attempt + 1 < attempts) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        // Never echo request bodies or headers: they hold user text and the key.
        throw new Error(`OpenRouter ${res.status}`);
      }
      const json = (await res.json()) as RouterResponse;
      if (json.error?.message) throw new Error("OpenRouter returned an error");
      const message = json.choices?.[0]?.message;
      const raw =
        typeof message?.content === "string"
          ? message.content
          : (message?.content ?? []).map((c) => c.text ?? "").join("");
      if (!raw) throw new Error("OpenRouter returned no content");
      const citations: Citation[] = (message?.annotations ?? [])
        .filter((a) => a.type === "url_citation" && a.url_citation?.url)
        .map((a) => ({
          url: a.url_citation!.url,
          title: a.url_citation!.title ?? "",
          content: a.url_citation!.content ?? "",
        }));
      return { data: JSON.parse(stripFences(raw)) as T, citations, cost: json.usage?.cost ?? 0 };
    } catch (err) {
      lastError = err;
      if (attempt + 1 >= attempts) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OpenRouter request failed");
}

// ---------- Review evidence ----------

/** Independent review sites. A vendor's own testimonials page never counts. */
export const REVIEW_SITES: Array<{ domain: string; name: string }> = [
  { domain: "capterra.com", name: "Capterra" },
  { domain: "g2.com", name: "G2" },
  { domain: "apps.apple.com", name: "Apple App Store" },
  { domain: "play.google.com", name: "Google Play" },
  { domain: "trustpilot.com", name: "Trustpilot" },
  { domain: "getapp.com", name: "GetApp" },
  { domain: "softwareadvice.com", name: "Software Advice" },
  { domain: "trustradius.com", name: "TrustRadius" },
];

export const REVIEW_DOMAINS = REVIEW_SITES.map((s) => s.domain);

export function reviewSiteFor(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  return REVIEW_SITES.find((s) => host === s.domain || host.endsWith(`.${s.domain}`)) ?? null;
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return url.toLowerCase();
  }
}

export interface EvidenceInput {
  site: string;
  url: string;
  rating: number;
  count: number | null;
}

export interface VerifiedReviewSource {
  site: string;
  url: string;
  rating: number;
  count: number | null;
}

function textMentionsCount(text: string, count: number) {
  const forms = new Set<string>([String(count), count.toLocaleString("en-US")]);
  if (count >= 1000) {
    const k = count / 1000;
    forms.add(`${Number.isInteger(k) ? k : k.toFixed(1)}k`);
    forms.add(`${Math.round(k)}k`);
  }
  if (count >= 1_000_000) {
    const m = count / 1_000_000;
    forms.add(`${Number.isInteger(m) ? m : m.toFixed(1)}m`);
  }
  const lower = text.toLowerCase();
  return [...forms].some((f) => lower.includes(f.toLowerCase()));
}

/** Words in a product name that identify it, ignoring generic ones. */
function nameTokens(name: string) {
  const generic = new Set(["by", "the", "and", "for", "of", "online", "app", "business", "pos"]);
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !generic.has(t));
}

/**
 * Keep only ratings that appear in the text returned for that exact URL, on an
 * independent review site, on a page that names this product. One entry per site.
 */
export function verifyReviews(
  toolName: string,
  evidence: EvidenceInput[],
  citations: Citation[],
  /** For small tools, whose names are often shared: the page must also show one of these web addresses. */
  vendorUrls?: string[],
): VerifiedReviewSource[] {
  const byUrl = new Map(citations.map((c) => [normalizeUrl(c.url), c]));
  const tokens = nameTokens(toolName);
  const vendorDomains = vendorUrls?.map(rootDomain).filter(Boolean);
  const bySite = new Map<string, VerifiedReviewSource>();

  for (const item of evidence) {
    if (!(item.rating >= 1 && item.rating <= 5)) continue;
    const citation = byUrl.get(normalizeUrl(item.url));
    if (!citation) continue;
    const site = reviewSiteFor(citation.url);
    if (!site) continue;

    const text = `${citation.title}\n${citation.content}`;
    const haystack = `${text}\n${citation.url}`.toLowerCase();
    if (tokens.length > 0 && !tokens.some((t) => haystack.includes(t))) continue;
    if (vendorDomains && !vendorDomains.some((d) => haystack.includes(d))) continue;

    const ratingText = item.rating.toString();
    const pattern = new RegExp(`(^|[^0-9.])${ratingText.replace(".", "[.,]")}(0)?([^0-9]|$)`);
    if (!pattern.test(text)) continue;

    const count = item.count && item.count > 0 && textMentionsCount(text, item.count) ? item.count : null;
    const verified: VerifiedReviewSource = { site: site.name, url: citation.url, rating: item.rating, count };
    const existing = bySite.get(site.name);
    if (!existing || (verified.count ?? 0) > (existing.count ?? 0)) bySite.set(site.name, verified);
  }
  return [...bySite.values()];
}

/**
 * Average across sites. Sites with more reviews count more, on a log scale, so neither
 * a handful of complaints nor one giant app store can decide the score alone.
 */
export function averageRating(sources: VerifiedReviewSource[]) {
  if (sources.length === 0) return null;
  let total = 0;
  let weight = 0;
  for (const source of sources) {
    const w = Math.log10(Math.max(source.count ?? 10, 10));
    total += source.rating * w;
    weight += w;
  }
  return Math.round((total / weight) * 10) / 10;
}

/** Fewer reviews than this across all sites is an anecdote, not a rating. */
export const MIN_REVIEWS_FOR_RATING = 25;

export function rootDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".").slice(-2).join(".");
  } catch {
    return "";
  }
}

/**
 * Guards against rating the wrong product. A US business needs the US App Store, and a
 * Trustpilot page is named after a company's own domain, so that domain must match.
 */
export function isSameProduct(source: VerifiedReviewSource, officialUrls: string[]) {
  let url: URL;
  try {
    url = new URL(source.url);
  } catch {
    return false;
  }
  if (url.hostname.endsWith("apps.apple.com") && !url.pathname.startsWith("/us/")) return false;
  // Comparison and category pages show several products' ratings side by side.
  if (/\/(?:compare|categories|vs)\//.test(url.pathname)) return false;
  if (url.hostname.endsWith("trustpilot.com")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const reviewed = parts[parts.indexOf("review") + 1] ?? "";
    const domain = rootDomain(`https://${reviewed}`);
    return officialUrls.some((official) => rootDomain(official) === domain);
  }
  return true;
}

/** Services a tool is built on, or ways for programmers to connect. An owner cannot link these to a shop. */
const NOT_A_CONNECTION = /^(?:anthropic(?: claude)?|clerk|cloudflare|dodo payments|firebase|github|google (?:adsense|admob|analytics|cloud|gemini|oauth)|lemon squeezy|linkedin oauth|neon|resend|rest api|supabase|vercel|webhooks?)$/i;

export function isRealConnection(name: string) {
  return !NOT_A_CONNECTION.test(name.trim());
}

/** The final say on a rating: drop wrong-product matches, then require enough reviews. */
export function finalizeReviews(sources: VerifiedReviewSource[], officialUrls: string[]) {
  const kept = sources.filter((s) => isSameProduct(s, officialUrls));
  const reviewCount = kept.reduce((acc, s) => acc + (s.count ?? 0), 0);
  const unknownCounts = kept.filter((s) => s.count === null).length;
  const enough = reviewCount >= MIN_REVIEWS_FOR_RATING || unknownCounts >= 2;
  return { sources: enough ? kept : [], rating: enough ? averageRating(kept) : null, reviewCount: enough ? reviewCount : 0 };
}

/** Remove a model's remarks about its own sources, which mean nothing to an owner. */
export function cleanResearchText(text: string, maxLength = 320) {
  const cleaned = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/,?\s*\(?(?:as stated in|as shown in|as listed in|per|according to|based on) the [^.;)]*(?:results?|pages?|site)\b[^.;)]*\)?/gi, "")
    .replace(/\s*\([a-z0-9.-]+\.(?:com|org|net|io|ai|app|co|bot|us)(?:,\s*[a-z0-9.-]+\.(?:com|org|net|io|ai|app|co|bot|us))*\)/gi, "")
    .replace(/^(?:www\.)?(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai|app|co|bot|us)\s+(?=[a-z])/i, "")
    .replace(/\s+([.,;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(
    (s) => s && !/\b(?:search )?results\b|\bsources?:|\bvendor claims?\b|\b[a-z0-9-]+\.(?:com|org|net|io)\b/i.test(s),
  );
  let out = "";
  for (const sentence of sentences) {
    if (out && out.length + sentence.length + 1 > maxLength) break;
    out = out ? `${out} ${sentence}` : sentence;
  }
  return out;
}

// ---------- AI ----------

const AI_WORDS = /\bAI\b|\bA\.I\.|[Aa]rtificial [Ii]ntelligence|[Mm]achine [Ll]earning|[Gg]enerative|\bGPT\b|[Cc]hatbot|\bLLM\b/;

/** True when one returned page names both this product and AI. Marketing elsewhere does not count. */
export function mentionsAi(toolName: string, citations: Citation[]) {
  const tokens = nameTokens(toolName);
  return citations.some((c) => {
    const text = `${c.title}\n${c.content}`;
    const lower = `${text}\n${c.url}`.toLowerCase();
    return AI_WORDS.test(text) && (tokens.length === 0 || tokens.some((t) => lower.includes(t)));
  });
}

// ---------- Reading other people's websites ----------

function privateV4(ip: string) {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function privateV6(ip: string) {
  const v = ip.toLowerCase();
  if (v.startsWith("::")) return true; // Loopback, unspecified and IPv4-mapped addresses.
  const first = parseInt(v.split(":")[0], 16);
  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00 || first === 0x64 || first === 0x2002 || first === 0;
}

/** True for any address that is not on the public internet, including cloud metadata addresses. */
export function isPrivateAddress(ip: string) {
  return isIP(ip) === 4 ? privateV4(ip) : privateV6(ip);
}

/** Checks the address at the moment of connecting, so a name cannot change to a private address after a check. */
const publicOnlyLookup = ((hostname: string, options: dns.LookupOptions, callback: (err: Error | null, address: string | dns.LookupAddress[], family?: number) => void) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) return callback(new Error("Address not allowed"), "");
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}) as LookupFunction;

function allowedUrl(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (isIP(host) || !host.includes(".") || /\.(?:local|internal|localhost)$/.test(host)) return false;
  return !url.port || url.port === "443";
}

export interface SafePage {
  status: number;
  url: string;
  text: string;
}

function requestOnce(url: URL, signal: AbortSignal, maxBytes: number, headers: Record<string, string>) {
  return new Promise<SafePage & { location?: string }>((resolve, reject) => {
    const req = https.get(url, { headers, signal, lookup: publicOnlyLookup, agent: false }, (res) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      const type = String(res.headers["content-type"] ?? "");
      if ((status >= 300 && status < 400) || (type && !/html|text|xml/i.test(type))) {
        res.destroy();
        return resolve({ status, url: url.href, text: "", location });
      }
      const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
      const stream = encoding === "gzip" ? res.pipe(zlib.createGunzip()) : encoding === "br" ? res.pipe(zlib.createBrotliDecompress()) : encoding === "deflate" ? res.pipe(zlib.createInflate()) : res;
      const chunks: Buffer[] = [];
      let size = 0;
      const finish = () => resolve({ status, url: url.href, text: Buffer.concat(chunks).toString("utf8"), location });
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;
        // Counted after unpacking, so a small compressed file cannot grow without limit.
        if (size >= maxBytes) {
          res.destroy();
          finish();
        }
      });
      stream.on("end", finish);
      stream.on("error", reject);
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

/**
 * Fetches a page from a web address we did not choose ourselves. Public https addresses only.
 * A company's site can redirect anywhere, so each hop is checked again.
 */
export async function safeFetch(address: string, options: { timeoutMs?: number; maxBytes?: number } = {}): Promise<SafePage> {
  const signal = AbortSignal.timeout(options.timeoutMs ?? 8_000);
  const maxBytes = options.maxBytes ?? 800_000;
  const headers = { "User-Agent": "Mozilla/5.0 ImmigrAI-research/0.1", Accept: "text/html", "Accept-Encoding": "gzip, br" };
  let url = new URL(address);
  for (let hop = 0; hop <= 3; hop++) {
    if (!allowedUrl(url)) throw new Error("Address not allowed");
    const page = await requestOnce(url, signal, maxBytes, headers);
    if (page.status < 300 || page.status >= 400 || !page.location) return page;
    url = new URL(page.location, url);
  }
  throw new Error("Too many redirects");
}

/**
 * Reads a tool's own website, including for reasons not to list it: it is gone, people cannot
 * use it yet, or it is priced for another country. A site that blocks automated checks is given
 * the benefit of the doubt, because that alone says nothing about the product.
 */
export async function readSite(url: string, timeoutMs = 10_000): Promise<{ problem: string | null; text: string; url: string }> {
  let page: SafePage;
  try {
    page = await safeFetch(url, { timeoutMs });
  } catch {
    return { problem: "site could not be reached", text: "", url };
  }
  if (page.status === 401 || page.status === 403 || page.status === 429) return { problem: null, text: "", url: page.url };
  if (page.status >= 400) return { problem: "site returned an error", text: "", url: page.url };
  const text = htmlToText(page.text);
  if (/\bjoin (?:the |our )?wait[- ]?list\b|\blaunching (?:soon|in |this |summer|fall|winter|spring)|\bjoin early access\b|\bget early access\b/i.test(text)) return { problem: "not available yet", text, url: page.url };
  const hasDollars = /\$\s?\d/.test(text);
  if (!hasDollars && /₹|₦|\bNGN\b|£\s?\d|€\s?\d/.test(text)) return { problem: "priced for another country", text, url: page.url };
  return { problem: null, text, url: page.url };
}

export async function siteProblem(url: string, timeoutMs = 10_000): Promise<string | null> {
  return (await readSite(url, timeoutMs)).problem;
}

/** Blank-box assistants and all-purpose apps. An owner still has to work out what to ask them. */
const GENERAL_ASSISTANT = /^(?:chatgpt|chat gpt|openai|claude|gemini|google gemini|(?:microsoft )?copilot|perplexity|canva|notion(?: ai)?|grammarly|jasper|copy\.ai|writesonic|zapier|make|adobe express|adobe firefly|meta ai|deepseek|grok|poe)\b/i;

export function isGeneralAssistant(name: string) {
  return GENERAL_ASSISTANT.test(name.trim());
}

/** Sites that write about products or host them. A tool's own site is required. */
const NOT_PRODUCT_SITES = [
  "g2.com", "capterra.com", "getapp.com", "softwareadvice.com", "trustpilot.com", "trustradius.com", "sourceforge.net", "alternativeto.net", "slashdot.org",
  "producthunt.com", "theresanaiforthat.com", "futurepedia.io", "toolify.ai", "aitools.fyi", "stork.ai", "topai.tools", "aixploria.com", "medium.com",
  "linkedin.com", "youtube.com", "reddit.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "tiktok.com", "prnewswire.com", "yelp.com",
  "businesswire.com", "globenewswire.com", "prlog.org", "forbes.com", "nerdwallet.com", "techcrunch.com", "github.com", "zapier.com",
  "apple.com", "google.com", "wikipedia.org", "substack.com", "ghost.io", "wordpress.com", "blogspot.com", "wixsite.com",
];

export function isProductSite(url: string) {
  return !NOT_PRODUCT_SITES.includes(rootDomain(url));
}

/** Compares words only, because a page's punctuation and line breaks rarely survive being quoted. */
export function quoteAppears(quote: string, text: string) {
  const squeeze = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const needle = squeeze(quote);
  return needle.length > 0 && squeeze(text).includes(needle);
}

// ---------- Facts ----------

const NATIVE_NAMES: Record<string, string[]> = {
  Spanish: ["español", "espanol"],
  French: ["français", "francais"],
  Chinese: ["中文", "简体", "繁體", "mandarin", "cantonese"],
  Vietnamese: ["tiếng việt"],
  Korean: ["한국어"],
  Tagalog: ["filipino"],
  Arabic: ["العربية"],
  Portuguese: ["português"],
  Russian: ["русский"],
  Hindi: ["हिन्दी"],
  Japanese: ["日本語"],
  German: ["deutsch"],
  Italian: ["italiano"],
  Polish: ["polski"],
  Ukrainian: ["українська"],
  Haitian: ["kreyòl", "creole"],
  Persian: ["farsi", "فارسی"],
};

function normalizeWord(word: string) {
  return word.toLowerCase().trim();
}

export function appearsIn(text: string, phrase: string) {
  const needle = normalizeWord(phrase);
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

/** Keep the languages actually named in the returned text, in English or their own script. */
export function verifyLanguages(claimed: string[], citations: Citation[]) {
  const text = citations.map((c) => `${c.title}\n${c.content}`).join("\n").toLowerCase();
  const out = new Set<string>();
  for (const language of claimed) {
    const name = language.trim();
    if (!name) continue;
    const firstWord = name.split(/\s+/)[0];
    const candidates = [name, ...(NATIVE_NAMES[name] ?? []), ...(NATIVE_NAMES[firstWord] ?? [])];
    if (candidates.some((c) => appearsIn(text, c))) out.add(name);
  }
  return [...out];
}

/** Language names we can recognize on a vendor's own "supported languages" page. */
export const KNOWN_LANGUAGES = [
  "English", "Spanish", "Chinese", "Vietnamese", "Korean", "Tagalog", "Filipino", "Arabic", "Haitian Creole", "Portuguese",
  "French", "Russian", "Hindi", "Punjabi", "Urdu", "Bengali", "Amharic", "Somali", "Persian", "Farsi", "Polish", "Ukrainian",
  "Thai", "Japanese", "German", "Italian", "Greek", "Turkish", "Swahili", "Nepali", "Khmer", "Hmong", "Lao", "Burmese",
  "Indonesian", "Malay", "Tamil", "Telugu", "Gujarati", "Hebrew", "Dutch", "Romanian", "Swedish", "Danish", "Norwegian",
  "Finnish", "Czech", "Hungarian", "Bulgarian", "Croatian", "Serbian", "Slovak", "Slovenian", "Lithuanian", "Latvian",
  "Estonian", "Albanian", "Macedonian", "Armenian", "Georgian", "Azerbaijani", "Kazakh", "Uzbek", "Mongolian", "Tigrinya",
  "Oromo", "Yoruba", "Igbo", "Hausa", "Zulu", "Xhosa", "Afrikaans", "Catalan", "Basque", "Galician", "Welsh", "Irish",
  "Icelandic", "Maltese", "Cebuano", "Javanese", "Sundanese", "Pashto", "Dari", "Kurdish", "Tajik", "Kyrgyz", "Turkmen",
  "Uyghur", "Samoan", "Tongan", "Maori", "Hawaiian", "Kinyarwanda", "Marathi", "Kannada", "Malayalam", "Sinhala", "Mixtec",
  "Zapotec", "Mam", "K'iche'", "Karen", "Rohingya", "Cantonese", "Mandarin",
];

/** Strip a page to its visible text. */
export function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/**
 * Read language names off a real page. A page that names fewer than five is more
 * likely a passing mention than a list, so it is not trusted.
 */
export function languagesInPage(text: string) {
  const lower = text.toLowerCase();
  const found = KNOWN_LANGUAGES.filter((language) => appearsIn(lower, language));
  return found.length >= 5 ? found : [];
}

/** Keep only products actually named in the returned text. */
export function verifyNames(claimed: string[], citations: Citation[]) {
  const text = citations.map((c) => `${c.title}\n${c.content}`).join("\n");
  return [...new Set(claimed.map((n) => n.trim()).filter((n) => n && appearsIn(text, n)))];
}

/** True when a stated price is visible in the returned text. */
export function priceAppears(startingMonthlyUsd: number, citations: Citation[]) {
  const text = citations.map((c) => `${c.title}\n${c.content}`).join("\n");
  // The word "free" alone proves little: "free trial" or "free demo" also contain it.
  if (startingMonthlyUsd === 0) return /\bfree (?:plan|tier|version|forever|for life|account|app|to (?:use|join|download|start))\b|\$0\b|no monthly fee/i.test(text);
  const whole = Math.floor(startingMonthlyUsd);
  const cents = Math.round((startingMonthlyUsd - whole) * 100);
  const forms = [`$${whole}`, `$ ${whole}`, `${whole} USD`, `US$${whole}`];
  if (cents > 0) forms.unshift(`$${whole}.${String(cents).padStart(2, "0")}`);
  return forms.some((form) => {
    const idx = text.indexOf(form);
    if (idx < 0) return false;
    // "$15" must not match "$150".
    const next = text[idx + form.length];
    return !next || !/[0-9]/.test(next);
  });
}

// ---------- JSON schemas ----------

export const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["evidence", "praise", "complaints"],
  properties: {
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["site", "url", "rating", "count"],
        properties: {
          site: { type: "string" },
          url: { type: "string", description: "Exact URL of the result that shows this rating" },
          rating: { type: "number", description: "Star rating out of 5, exactly as shown" },
          count: { type: ["integer", "null"], description: "Number of reviews as shown, or null" },
        },
      },
    },
    praise: { type: "string", description: "What reviewers like, one plain sentence, empty if not in the results" },
    complaints: { type: "string", description: "What reviewers complain about, one plain sentence, empty if not in the results" },
  },
} as const;

export interface ReviewResponse {
  evidence: EvidenceInput[];
  praise: string;
  complaints: string;
}

export const REVIEW_SYSTEM =
  "You extract public review data for a software product from web search results. Report only ratings and review counts that appear in the results, on that exact page, for this exact product. Do not estimate, round or recall from memory. If a page shows ratings for other products, ignore those. If you find nothing, return an empty evidence list. Write in plain, simple English with no marketing words.";

export function reviewPrompt(name: string, website: string) {
  return `${name} (${website}) reviews: star rating, number of reviews, pros and cons, what users like and what users dislike. Capterra, G2, Trustpilot, Apple App Store, Google Play. Use only pages about the product at ${website}. Ignore any other product or company with a similar name.`;
}
