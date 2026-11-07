import Link from "next/link";
import { SEED_BY_SLUG } from "@/data/seed-tools";
import type { Dict } from "@/lib/i18n";
import { fmt } from "@/lib/labels";
import { bundleFit, monthlyTotal } from "@/lib/scoring";
import type { Bundle, Tool } from "@/lib/types";

export function kitTools(kit: Bundle): Tool[] {
  return kit.toolSlugs.flatMap((slug) => {
    const tool = SEED_BY_SLUG.get(slug);
    return tool ? [tool] : [];
  });
}

export function kitCost(tools: Tool[], t: Dict) {
  const total = Math.round(monthlyTotal(tools) * 100) / 100;
  return total === 0 ? t.kit_free : fmt(t.kit_cost, { n: total });
}

export function KitCard({ kit, lang, t, heading: Heading = "h3" }: { kit: Bundle; lang: string; t: Dict; heading?: "h2" | "h3" }) {
  const tools = kitTools(kit);
  return (
    <article className="flex h-full flex-col rounded-xl border-2 border-line bg-surface p-5">
      <Heading className="text-xl font-semibold">
        <Link href={`/${lang}/bundles/${kit.slug}`} prefetch={false} className="underline-offset-2 hover:underline">
          {kit.name}
        </Link>
      </Heading>
      <p className="mt-1">{kit.tagline}</p>
      <p className="mt-2 text-sm text-muted-ink">
        {t.bundle_for}: {kit.forWho}
      </p>
      <p className="mt-3 text-sm">{tools.map((tool) => tool.name).join(", ")}</p>
      <p className="mt-auto flex flex-wrap gap-x-4 pt-3 font-semibold">
        <span>{kitCost(tools, t)}</span>
        <span>{fmt(t.kit_fit, { n: bundleFit(tools) })}</span>
      </p>
    </article>
  );
}

export function NewToolsCard({ lang, t, heading: Heading = "h3" }: { lang: string; t: Dict; heading?: "h2" | "h3" }) {
  return (
    <article className="flex h-full flex-col rounded-xl border-2 border-ink bg-marigold-tint p-5">
      <Heading className="text-xl font-semibold">
        <Link href={`/${lang}/bundles/new-tools`} prefetch={false} className="underline-offset-2 hover:underline">
          {t.home_newTools}
        </Link>
      </Heading>
      <p className="mt-1">{t.home_newToolsD}</p>
    </article>
  );
}
