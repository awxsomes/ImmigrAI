"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { displayLanguage, compatText, priceText, toolHref } from "@/lib/format";
import { fmt, type CardLabels, type CompatLabels } from "@/lib/labels";
import { compatibility, envLabel, supportsLanguage } from "@/lib/scoring";
import { useUserData } from "@/lib/storage";
import type { Tool } from "@/lib/types";
import { RatingText } from "./tool-card";

type Labels = CardLabels &
  CompatLabels &
  Record<
    | "compare_title" | "compare_empty" | "compare_feature" | "compare_pairs" | "compare_rowCost" | "compare_rowFees" | "compare_rowRating" | "compare_rowScore"
    | "compare_rowEase" | "compare_rowFootprint" | "compare_rowLanguages" | "compare_rowMyLanguage" | "compare_rowConnections" | "compare_rowSetup"
    | "compare_outOf5" | "compare_none" | "tool_setupAbout" | "common_yes" | "common_no" | "my_browse",
    string
  >;

export function CompareView({
  lang,
  slugs,
  known,
  defaultLanguage,
  t,
}: {
  lang: string;
  slugs: string[];
  known: Tool[];
  defaultLanguage: string;
  t: Labels;
}) {
  const { data } = useUserData();
  const bySlug = new Map(known.map((tool) => [tool.slug, tool]));
  const tools = slugs.flatMap((slug) => {
    const tool = bySlug.get(slug) ?? data.toolCache[slug];
    return tool ? [tool] : [];
  });
  const language = data.language || defaultLanguage;

  if (tools.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-bold">{t.compare_title}</h1>
        <p className="mt-3 text-lg">{t.compare_empty}</p>
        <Link href={`/${lang}`} className="mt-3 inline-flex min-h-12 items-center underline underline-offset-4">
          {t.my_browse}
        </Link>
      </div>
    );
  }

  const rows: Array<{ label: string; cell: (tool: Tool) => ReactNode }> = [
    { label: t.compare_rowScore, cell: (tool) => <span className="text-lg font-bold">{tool.scores.overall}/100</span> },
    { label: t.compare_rowCost, cell: (tool) => priceText(tool, t) },
    { label: t.compare_rowFees, cell: (tool) => tool.pricing.extraFees ?? t.compare_none },
    { label: t.compare_rowRating, cell: (tool) => <RatingText tool={tool} t={t} /> },
    ...(language
      ? [
          {
            label: fmt(t.compare_rowMyLanguage, { language: displayLanguage(language, lang) }),
            cell: (tool: Tool) => (supportsLanguage(tool, language) ? t.common_yes : fmt(t.card_notConfirmedLang, { language: displayLanguage(language, lang) })),
          },
        ]
      : []),
    { label: t.compare_rowLanguages, cell: (tool) => tool.languages.length },
    { label: t.compare_rowEase, cell: (tool) => fmt(t.compare_outOf5, { n: tool.scores.easeOfUse }) },
    { label: t.compare_rowSetup, cell: (tool) => fmt(t.tool_setupAbout, { n: tool.setupMinutes }) },
    { label: t.compare_rowFootprint, cell: (tool) => `${tool.environmental.score}/100, ${t[`env_${envLabel(tool.environmental.score)}`]}` },
    { label: t.compare_rowConnections, cell: (tool) => (tool.integrations.length ? tool.integrations.slice(0, 6).join(", ") : t.compare_none) },
  ];

  const pairs = tools.flatMap((a, i) => tools.slice(i + 1).map((b) => ({ a, b })));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">{t.compare_title}</h1>
      <div className="mt-5 overflow-x-auto rounded-xl border-2 border-line bg-surface" tabIndex={0} role="region" aria-label={t.compare_title}>
        <table className="w-full min-w-[40rem] text-left align-top">
          <thead>
            <tr className="border-b-2 border-line-strong">
              <th scope="col" className="p-3 font-semibold">{t.compare_feature}</th>
              {tools.map((tool) => (
                <th key={tool.slug} scope="col" className="p-3 text-lg font-semibold">
                  <Link href={toolHref(lang, tool.slug)} className="underline underline-offset-2">
                    {tool.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="p-3 font-medium">{row.label}</th>
                {tools.map((tool) => (
                  <td key={tool.slug} className="p-3">{row.cell(tool)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pairs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">{t.compare_pairs}</h2>
          <ul className="mt-3 space-y-3">
            {pairs.map(({ a, b }) => {
              const text = compatText(compatibility(a, b), t);
              return (
                <li key={`${a.slug}-${b.slug}`}>
                  <span className="font-medium">
                    {a.name} + {b.name}:
                  </span>{" "}
                  {text.label}
                  <span className="block text-sm text-muted-ink">{text.detail}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
