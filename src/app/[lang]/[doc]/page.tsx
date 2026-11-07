import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteDataControl } from "@/components/site/delete-data";
import { DOC_KEYS, DOC_UPDATED, type DocKey, type DocSection } from "@/content/docs";
import { getDict, UI_LANGS, type Dict } from "@/lib/i18n";
import { fmt } from "@/lib/labels";
import { getDoc } from "@/lib/localize";
import { ENV_WEIGHTS, environmentalEstimate, WORKLOADS } from "@/lib/scoring";
import { SITE } from "@/lib/site";
import type { Workload } from "@/lib/types";

interface Props {
  params: Promise<{ lang: string; doc: string }>;
}

function isDocKey(value: string): value is DocKey {
  return (DOC_KEYS as string[]).includes(value);
}

export function generateStaticParams() {
  return UI_LANGS.flatMap((lang) => DOC_KEYS.map((doc) => ({ lang, doc })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, doc } = await params;
  return isDocKey(doc) ? { title: getDoc(doc, lang).doc.title } : {};
}

function Paragraph({ text, t }: { text: string; t: Dict }) {
  if (text !== "{contact}") return <p>{text}</p>;
  return <p>{SITE.contactEmail ? fmt(t.doc_contact, { email: SITE.contactEmail }) : t.doc_contactPending}</p>;
}

function SectionBlock({ section, t }: { section: DocSection; t: Dict }) {
  return (
    <section>
      <h2>{section.h}</h2>
      {section.p?.map((text) => <Paragraph key={text} text={text} t={t} />)}
      {section.ul && (
        <ul>
          {section.ul.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.links && (
        <ul>
          {section.links.map(([label, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
                <span className="sr-only"> ({t.tool_leaving})</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MethodologyTables({ t }: { t: Dict }) {
  const parts = [
    { name: t.method_energy, weight: ENV_WEIGHTS.energy, measure: t.method_energyD },
    { name: t.method_water, weight: ENV_WEIGHTS.water, measure: t.method_waterD },
    { name: t.method_carbon, weight: ENV_WEIGHTS.carbon, measure: t.method_carbonD },
    { name: t.method_compute, weight: ENV_WEIGHTS.compute, measure: t.method_computeD },
  ];
  const workloads = Object.keys(WORKLOADS) as Workload[];
  return (
    <div className="not-prose my-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t.method_rubric}</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border-2 border-line bg-surface" tabIndex={0} role="region" aria-label={t.method_rubric}>
          <table className="w-full min-w-[28rem] text-left">
            <thead>
              <tr className="border-b-2 border-line-strong">
                <th scope="col" className="p-3 font-semibold">{t.method_part}</th>
                <th scope="col" className="p-3 font-semibold">{t.method_weight}</th>
                <th scope="col" className="p-3 font-semibold">{t.method_measure}</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.name} className="border-b border-line last:border-b-0">
                  <th scope="row" className="p-3 font-medium">{part.name}</th>
                  <td className="p-3">{Math.round(part.weight * 100)}%</td>
                  <td className="p-3">{part.measure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border-2 border-line bg-surface" tabIndex={0} role="region" aria-label={t.method_tableClass}>
        <table className="w-full min-w-[42rem] text-left">
          <thead>
            <tr className="border-b-2 border-line-strong">
              <th scope="col" className="p-3 font-semibold">{t.method_tableClass}</th>
              <th scope="col" className="p-3 font-semibold">{t.method_tableEnergy}</th>
              <th scope="col" className="p-3 font-semibold">{t.method_tableWater}</th>
              <th scope="col" className="p-3 font-semibold">{t.method_tableCarbon}</th>
              <th scope="col" className="p-3 font-semibold">{t.method_tableCompute}</th>
              <th scope="col" className="p-3 font-semibold">{t.method_tableScore}</th>
            </tr>
          </thead>
          <tbody>
            {workloads.map((workload) => {
              const e = environmentalEstimate(workload);
              return (
                <tr key={workload} className="border-b border-line align-top last:border-b-0">
                  <th scope="row" className="p-3 font-medium">
                    {t[`wl_${workload}`]}
                    <span className="block text-sm font-normal text-muted-ink">{t[`wld_${workload}`]}</span>
                  </th>
                  <td className="p-3">{e.perTask.wattHours} Wh</td>
                  <td className="p-3">{e.perTask.waterMl} mL</td>
                  <td className="p-3">{e.perTask.co2Grams} g</td>
                  <td className="p-3">{e.compute}</td>
                  <td className="p-3 font-bold">{e.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function DocPage({ params }: Props) {
  const { lang, doc: key } = await params;
  if (!isDocKey(key)) notFound();
  const t = getDict(lang);
  const { doc, translated } = getDoc(key, lang);

  return (
    <article className="prose-doc mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-bold">{doc.title}</h1>
      <p className="mt-3 text-lg">{doc.intro}</p>
      <p className="mt-2 text-sm text-muted-ink">{fmt(t.doc_updated, { date: DOC_UPDATED })}</p>
      {translated && (
        <p className="mt-2 rounded-lg bg-marigold-tint p-3 text-sm">
          {t.doc_translated}{" "}
          <Link href={`/en/${key}`} lang="en">
            {t.doc_readEnglish}
          </Link>
        </p>
      )}
      {key === "data-deletion" && (
        <div className="mt-4">
          <DeleteDataControl t={{ button: t.doc_deleteButton, question: t.doc_confirmQ, confirm: t.doc_confirmDelete, cancel: t.doc_cancel, done: t.doc_deleted }} />
        </div>
      )}
      {doc.sections.map((section, index) => (
        <div key={section.h}>
          <SectionBlock section={section} t={t} />
          {key === "methodology" && index === 0 && <MethodologyTables t={t} />}
        </div>
      ))}
    </article>
  );
}
