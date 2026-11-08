import Link from "next/link";
import type { ReactNode } from "react";
import { NEW_TOOLS, SEED_BY_SLUG } from "@/data/seed-tools";
import { displayLanguage, paidMonthly } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { fmt } from "@/lib/labels";
import { pageLanguageName } from "@/lib/localize";
import { monthlyTotal, supportsLanguage } from "@/lib/scoring";
import type { Bundle, Tool } from "@/lib/types";

export function kitTools(kit: Bundle): Tool[] {
  return kit.toolSlugs.flatMap((slug) => {
    const tool = SEED_BY_SLUG.get(slug);
    return tool ? [tool] : [];
  });
}

/** What the kit costs on the lowest plans, and what it comes to once someone moves to the first paid ones. */
export function kitCost(tools: Tool[], t: Dict) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const low = round(monthlyTotal(tools));
  const paid = round(tools.reduce((sum, tool) => sum + paidMonthly(tool), 0));
  if (paid === 0) return t.kit_free;
  if (low === paid) return fmt(t.kit_costAll, { n: low });
  return low === 0 ? fmt(t.kit_costFreeFirst, { paid }) : fmt(t.kit_costRange, { low, paid });
}

/** Languages most spoken by immigrant owners in the US, checked in this order after the page's own. */
const KIT_LANGUAGES = ["Spanish", "Chinese", "Vietnamese", "Korean", "Tagalog", "Arabic", "Haitian Creole", "Portuguese", "Russian", "French", "Hindi"];

/** Which languages besides English every tool in the kit works in, or how far the best one reaches. */
export function kitLanguages(tools: Tool[], lang: string, t: Dict) {
  const own = pageLanguageName(lang);
  const order = own ? [own, ...KIT_LANGUAGES.filter((l) => l !== own)] : KIT_LANGUAGES;
  const counts = order.map((language) => ({ language, count: tools.filter((tool) => supportsLanguage(tool, language)).length }));
  const shared = counts.filter((c) => c.count === tools.length).map((c) => displayLanguage(c.language, lang));
  if (shared.length > 0) {
    // "Spanish, Chinese and Vietnamese", or "Spanish, Chinese, Vietnamese and 7 more" when the list is long.
    if (shared.length <= 3) return fmt(t.kit_langAll, { list: new Intl.ListFormat(lang, { type: "conjunction" }).format(shared) });
    const first = new Intl.ListFormat(lang, { type: "unit", style: "short" }).format(shared.slice(0, 3));
    return fmt(t.kit_langAll, { list: `${first} ${fmt(t.card_more, { n: shared.length - 3 })}` });
  }
  const best = counts.reduce((a, b) => (b.count > a.count ? b : a));
  return fmt(t.kit_langSome, { language: displayLanguage(best.language, lang), k: best.count, n: tools.length });
}

/** The time to get every tool in the kit started, added up. */
export function kitSetup(tools: Tool[], t: Dict) {
  const minutes = tools.reduce((sum, tool) => sum + (tool.setupMinutes || 0), 0);
  if (minutes < 75) return fmt(t.kit_setupMinutes, { n: Math.max(5, Math.round(minutes / 5) * 5) });
  return fmt(t.kit_setupHours, { n: Math.round((minutes / 60) * 2) / 2 });
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-auto grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t-2 border-line pt-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-ink">{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function KitCard({ kit, lang, t, heading: Heading = "h3", art }: { kit: Bundle; lang: string; t: Dict; heading?: "h2" | "h3"; art?: ReactNode }) {
  const tools = kitTools(kit);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-line bg-surface">
      {art && <div className="flex justify-center border-b-2 border-line bg-green-tint px-4 pt-3">{art}</div>}
      <div className="flex flex-1 flex-col p-5">
        <Heading className="text-xl font-semibold">
          <Link href={`/${lang}/bundles/${kit.slug}`} prefetch={false} className="underline-offset-2 hover:underline">
            {kit.name}
          </Link>
        </Heading>
        <p className="mt-1">{kit.tagline}</p>
        <p className="mt-2 mb-4 text-sm text-muted-ink">{tools.map((tool) => tool.name).join(", ")}</p>
        <Facts
          rows={[
            [t.card_cost, kitCost(tools, t)],
            [t.kit_languages, kitLanguages(tools, lang, t)],
            [t.kit_setup, kitSetup(tools, t)],
          ]}
        />
      </div>
    </article>
  );
}

export function NewToolsCard({ lang, t, heading: Heading = "h3", art }: { lang: string; t: Dict; heading?: "h2" | "h3"; art?: ReactNode }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-ink bg-surface">
      {art && <div className="flex justify-center border-b-2 border-ink bg-marigold-tint px-4 pt-3">{art}</div>}
      <div className="flex flex-1 flex-col p-5">
        <Heading className="text-xl font-semibold">
          <Link href={`/${lang}/bundles/new-tools`} prefetch={false} className="underline-offset-2 hover:underline">
            {t.home_newTools}
          </Link>
        </Heading>
        <p className="mt-1 mb-4">{t.home_newToolsD}</p>
        <Facts
          rows={[
            [t.kit_toolsLabel, fmt(t.kit_toolsCount, { n: NEW_TOOLS.length })],
            [t.card_rating, t.kit_newRating],
          ]}
        />
      </div>
    </article>
  );
}
