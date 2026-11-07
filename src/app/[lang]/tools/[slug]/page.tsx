import type { Metadata } from "next";
import { DetailActions, SaveButton, type ExtrasLabels } from "@/components/tools/detail-actions";
import { DETAIL_KEYS, ToolDetail } from "@/components/tools/tool-detail";
import { LiveToolPage } from "@/components/tools/tool-extras";
import { SEED_BY_SLUG, SEED_TOOLS } from "@/data/seed-tools";
import { getDict, UI_LANGS, type Dict } from "@/lib/i18n";
import { COMPAT_KEYS, pick } from "@/lib/labels";
import { localizeTool } from "@/lib/localize";

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return UI_LANGS.flatMap((lang) => SEED_TOOLS.map((tool) => ({ lang, slug: tool.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const tool = SEED_BY_SLUG.get(slug);
  return tool ? { title: tool.name, description: localizeTool(tool, lang).summary } : { title: "Tool", robots: { index: false } };
}

function extrasLabels(t: Dict): ExtrasLabels {
  return {
    ...pick(t, COMPAT_KEYS),
    saveLabel: t.card_saveTool,
    savedLabel: t.card_savedTool,
    compatTitle: t.compat_yours,
    compatNone: t.compat_noneSaved,
    yoursTitle: t.tool_rateTitle,
    saveToRate: t.tool_saveToRate,
    connectsExisting: t.card_connectsExisting,
    rating: { legend: t.tool_ratingLegend, star: t.tool_star, clear: t.tool_clearRating, inUse: t.tool_inUse, note: t.tool_note, help: t.tool_rateHelp },
  };
}

export default async function ToolPage({ params }: Props) {
  const { lang, slug } = await params;
  const t = getDict(lang);
  const known = SEED_BY_SLUG.get(slug);
  if (known) {
    const tool = localizeTool(known, lang);
    return (
      <ToolDetail
        tool={tool}
        lang={lang}
        t={pick(t, DETAIL_KEYS)}
        actions={<SaveButton tool={tool} saveLabel={t.card_saveTool} savedLabel={t.card_savedTool} />}
        sidebar={<DetailActions tool={tool} t={extrasLabels(t)} />}
      />
    );
  }
  return (
    <LiveToolPage
      slug={slug}
      lang={lang}
      t={pick(t, DETAIL_KEYS)}
      extras={extrasLabels(t)}
      labels={{ loading: t.tool_lookup, notFound: t.tool_notFound, back: t.common_back }}
    />
  );
}
