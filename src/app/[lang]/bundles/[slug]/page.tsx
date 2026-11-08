import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { kitCost, kitLanguages, kitSetup, kitTools } from "@/components/tools/kit-card";
import { SaveAllButton, SaveButton } from "@/components/tools/tool-actions";
import { ToolCard } from "@/components/tools/tool-card";
import { BUNDLE_BY_SLUG, BUNDLES } from "@/data/bundles";
import { NEW_TOOLS, RESEARCH_DATE } from "@/data/seed-tools";
import { compatText } from "@/lib/format";
import { getDict, UI_LANGS, type Dict } from "@/lib/i18n";
import { ACTION_KEYS, CARD_KEYS, COMPAT_KEYS, fmt, pick } from "@/lib/labels";
import { localizeBundle, localizeTool } from "@/lib/localize";
import { safeUrl } from "@/lib/normalize";
import { compatibility } from "@/lib/scoring";

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return UI_LANGS.flatMap((lang) => [...BUNDLES.map((b) => ({ lang, slug: b.slug })), { lang, slug: "new-tools" }]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const t = getDict(lang);
  if (slug === "new-tools") return { title: t.new_title };
  const bundle = BUNDLE_BY_SLUG.get(slug);
  return bundle ? { title: localizeBundle(bundle, lang).name } : {};
}

function NewToolsPage({ lang, t }: { lang: string; t: Dict }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-bold">{t.new_title}</h1>
      <p className="mt-2 text-lg">{t.new_sub}</p>
      {RESEARCH_DATE && <p className="mt-1 text-sm text-muted-ink">{fmt(t.new_checked, { date: RESEARCH_DATE })}</p>}
      <ul className="mt-6 space-y-4">
        {NEW_TOOLS.map((tool) => {
          const href = safeUrl(tool.website);
          return (
            <li key={tool.name} className="rounded-xl border-2 border-line bg-surface p-5">
              <h2 className="text-xl font-semibold">{tool.name}</h2>
              <p className="mt-1 text-sm text-muted-ink">
                {fmt(t.new_launched, { date: tool.launched })}. {tool.categoryHint}.
              </p>
              <p className="mt-2" lang="en">
                {tool.summary}
              </p>
              <p className="mt-2 font-medium">{tool.startingMonthlyUsd > 0 ? fmt(t.new_price, { n: tool.startingMonthlyUsd }) : t.new_free}</p>
              {href && (
                <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block py-1 underline underline-offset-2">
                  {t.new_readMore}
                  <span className="sr-only">: {tool.name} ({t.tool_leaving})</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <Link href={`/${lang}/bundles`} className="mt-6 inline-flex min-h-12 items-center underline underline-offset-4">
        {t.kit_title}
      </Link>
    </div>
  );
}

export default async function KitPage({ params }: Props) {
  const { lang, slug } = await params;
  const t = getDict(lang);
  if (slug === "new-tools") return <NewToolsPage lang={lang} t={t} />;
  const base = BUNDLE_BY_SLUG.get(slug);
  if (!base) notFound();

  const kit = localizeBundle(base, lang);
  const tools = kitTools(base).map((tool) => localizeTool(tool, lang));
  const cardLabels = pick(t, CARD_KEYS);
  const actionLabels = pick(t, ACTION_KEYS);
  const compatLabels = pick(t, COMPAT_KEYS);

  const pairs = tools.flatMap((a, i) => tools.slice(i + 1).map((b) => ({ a, b, result: compatibility(a, b) })));
  const rank = { direct: 0, bridge: 1, shared: 2, none: 3 };
  pairs.sort((x, y) => rank[x.result.level] - rank[y.result.level]);
  const linked = pairs.filter((p) => p.result.level === "direct" || p.result.level === "bridge").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">{kit.name}</h1>
      <p className="mt-2 text-lg">{kit.tagline}</p>
      <p className="mt-1 text-muted-ink">
        {t.bundle_for}: {kit.forWho}
      </p>

      <dl className="mt-5 grid max-w-5xl gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t.card_cost, kitCost(tools, t)],
          [t.kit_languages, kitLanguages(tools, lang, t)],
          [t.kit_setup, kitSetup(tools, t)],
          [t.kit_pairs, fmt(t.kit_pairsValue, { k: linked, n: pairs.length })],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted-ink">{label}</dt>
            <dd className="text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-muted-ink">
        {t.kit_notice} {t.kit_costNote}
      </p>
      {kit.note && <p className="mt-3 max-w-3xl rounded-lg bg-marigold-tint p-3">{kit.note}</p>}
      <div className="mt-4">
        <SaveAllButton tools={tools} label={t.bundle_saveAll} doneLabel={t.kit_saved} />
      </div>

      <h2 className="mt-8 text-2xl font-semibold">{t.bundle_tools}</h2>
      <ul className="mt-3 grid gap-4 lg:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard
              tool={tool}
              lang={lang}
              t={cardLabels}
              actions={<SaveButton tool={tool} saveLabel={actionLabels.card_saveTool} savedLabel={actionLabels.card_savedTool} />}
            />
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">{t.compat_title}</h2>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label={t.compat_title}>
          <table className="w-full min-w-[32rem] text-left">
            <thead>
              <tr className="border-b-2 border-line-strong">
                <th scope="col" className="py-2 pr-3 font-semibold">{t.compare_feature}</th>
                <th scope="col" className="py-2 font-semibold">{t.compat_title}</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(({ a, b, result }) => {
                const text = compatText(result, compatLabels);
                return (
                  <tr key={`${a.slug}-${b.slug}`} className="border-b border-line align-top">
                    <td className="py-2 pr-3 font-medium">
                      {a.name} + {b.name}
                    </td>
                    <td className="py-2">
                      <span className="font-medium">{text.label}</span>
                      <span className="block text-sm text-muted-ink">{text.detail}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Link href={`/${lang}/methodology`} prefetch={false} className="mt-2 inline-block py-1 text-sm underline underline-offset-2">
          {t.kit_fitHelp}
        </Link>
      </section>
    </div>
  );
}
