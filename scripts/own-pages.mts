/**
 * Reads a product's own website directly. Search engines barely index small niche products,
 * so "the search found nothing" says little about them, while their own pages say plenty.
 */
import { htmlToText, type Citation } from "../src/lib/research-core.ts";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 ImmigrAI-research/0.1",
  Accept: "text/html",
};

function decode(text: string) {
  return text.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

/** The title and description survive on sites that draw everything else with JavaScript. */
export async function readPage(url: string, maxChars = 6000): Promise<Citation | null> {
  if (!url.startsWith("https://")) return null;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12_000), redirect: "follow" });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await res.text()).slice(0, 1_500_000);
    const title = decode(html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? "");
    const description = decode(
      html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]+content=["']([^"']*)/i)?.[1] ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:og:)?description["']/i)?.[1] ?? "",
    );
    const content = `${description} ${htmlToText(html).trim()}`.trim().slice(0, maxChars);
    return content.length >= 40 ? { url: res.url, title, content } : null;
  } catch {
    return null;
  }
}

/** Give a model the pages themselves, so it reads only what the company says. */
export function pagesForPrompt(pages: Citation[]) {
  return pages.map((page) => `PAGE: ${page.url}\nTITLE: ${page.title}\n${page.content}`).join("\n\n");
}
