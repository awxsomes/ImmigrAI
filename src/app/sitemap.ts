import type { MetadataRoute } from "next";
import { DOC_KEYS } from "@/content/docs";
import { BUNDLES } from "@/data/bundles";
import { SEED_TOOLS } from "@/data/seed-tools";
import { siteUrl } from "@/lib/site";

const LANGS = ["en", "es", "zh", "vi"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = ["", "/bundles", ...BUNDLES.map((b) => `/bundles/${b.slug}`), "/bundles/new-tools", ...DOC_KEYS.map((d) => `/${d}`), ...SEED_TOOLS.map((t) => `/tools/${t.slug}`)];
  return LANGS.flatMap((lang) => paths.map((path) => ({ url: `${base}/${lang}${path}` })));
}
