import type { MetadataRoute } from "next";
import { getDict, isUiLang, UI_LANGS } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return UI_LANGS.map((lang) => ({ lang }));
}

/**
 * What a phone needs to add the site to its home screen and open it like an app: full screen
 * with no browser bar, our icon, and a plain white screen with the logo while it starts. One per
 * language, so the app opens in the language it was added in, even offline.
 */
async function manifest(lang: string): Promise<MetadataRoute.Manifest> {
  "use cache";
  const t = getDict(lang);
  return {
    id: "/",
    name: SITE.name,
    short_name: SITE.name,
    description: t.tagline,
    lang: lang === "zh" ? "zh-Hans" : lang,
    dir: "ltr",
    start_url: `/${lang}`,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Pressing and holding the app's icon offers these.
    shortcuts: [
      { name: t.search_button, url: `/${lang}/search` },
      { name: t.checkup_title, url: `/${lang}/checkup` },
      { name: t.nav_myTools, url: `/${lang}/my-tools` },
    ],
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isUiLang(lang)) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(await manifest(lang)), { headers: { "Content-Type": "application/manifest+json" } });
}
