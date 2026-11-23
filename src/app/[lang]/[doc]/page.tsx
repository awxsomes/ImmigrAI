import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteDataControl } from "@/components/site/delete-data";
import { DOC_KEYS, DOC_UPDATED, type DocKey, type DocSection } from "@/content/docs";
import { getDict, UI_LANGS, type Dict } from "@/lib/i18n";
import { fmt } from "@/lib/labels";
import { getDoc } from "@/lib/localize";
import { PERSON_CHECKS } from "@/data/seed-tools";
import { energyLevel, OVERALL_WEIGHTS, PRIOR_REVIEWS, RATING_PRIOR, WORKLOADS } from "@/lib/scoring";
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

/**
 * Numbers a page states about the catalog, filled in from the data on every build so they
 * cannot drift from what the site does. Pages write them as {name}.
 */
const FACTS: Record<string, string | number> = {
  checkedFocus: PERSON_CHECKS.focus,
  checkedPrice: PERSON_CHECKS.price,
  checkedAi: PERSON_CHECKS.ai,
  checkedAny: PERSON_CHECKS.any,
  tools: PERSON_CHECKS.tools,
  uncheckedFocus: PERSON_CHECKS.tools - PERSON_CHECKS.focus,
  guessShare: Math.round((OVERALL_WEIGHTS.focus + OVERALL_WEIGHTS.easeOfUse) * 100),
  ratingPrior: RATING_PRIOR,
  priorReviews: PRIOR_REVIEWS,
};

function withFacts(text: string) {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in FACTS ? String(FACTS[key]) : whole));
}

function Paragraph({ text, t }: { text: string; t: Dict }) {
  if (text !== "{contact}") return <p>{withFacts(text)}</p>;
  return <p>{SITE.contactEmail ? fmt(t.doc_contact, { email: SITE.contactEmail }) : t.doc_contactPending}</p>;
}

function SectionBlock({ section, t }: { section: DocSection; t: Dict }) {
  return (
    <section id={section.id} className={section.id ? "scroll-mt-4" : undefined}>
      <h2>{section.h}</h2>
      {section.p?.map((text) => <Paragraph key={text} text={text} t={t} />)}
      {section.ul && (
        <ul>
          {section.ul.map((item) => (
            <li key={item}>{withFacts(item)}</li>
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

/** Each kind of AI, its energy estimate per task and the plain word a tool page shows for it. */
function EnergyTable({ t }: { t: Dict }) {
  const workloads = Object.keys(WORKLOADS) as Workload[];
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-lg border border-line bg-surface" tabIndex={0} role="region" aria-label={t.method_tableClass}>
      <table className="w-full min-w-[32rem] text-left">
        <thead>
          <tr className="border-b border-line-strong">
            <th scope="col" className="p-3 font-semibold">{t.method_tableClass}</th>
            <th scope="col" className="p-3 font-semibold">{t.method_tableEnergy}</th>
            <th scope="col" className="p-3 font-semibold">{t.method_tableLevel}</th>
          </tr>
        </thead>
        <tbody>
          {workloads.map((workload) => {
            const wattHours = WORKLOADS[workload].wattHours;
            return (
              <tr key={workload} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="p-3 font-medium">
                  {t[`wl_${workload}`]}
                  <span className="block text-sm font-normal text-muted-ink">{t[`wld_${workload}`]}</span>
                </th>
                <td className="p-3">{wattHours} Wh</td>
                <td className="p-3 font-semibold">{t[`energy_${energyLevel(wattHours)}`]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
      <p className="mt-3 text-lg">{withFacts(doc.intro)}</p>
      <p className="mt-2 text-sm text-muted-ink">{fmt(t.doc_updated, { date: DOC_UPDATED })}</p>
      {translated && (
        <p className="mt-2 rounded-lg bg-amber-tint p-3 text-sm">
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
      {doc.sections.map((section) => (
        <div key={section.h}>
          <SectionBlock section={section} t={t} />
          {key === "methodology" && section.id === "energy" && <EnergyTable t={t} />}
        </div>
      ))}
    </article>
  );
}
