import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/tools/compare-view";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_BY_SLUG } from "@/data/seed-tools";
import { getDict } from "@/lib/i18n";
import { CARD_KEYS, COMPAT_KEYS, pick } from "@/lib/labels";
import { localizeTool, pageLanguageName } from "@/lib/localize";
import { cleanSlugs } from "@/lib/slugs";

export const metadata: Metadata = { title: "Compare", robots: { index: false } };

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function Compare({ params, searchParams }: Props) {
  const { lang } = await params;
  const raw = (await searchParams).tools;
  const t = getDict(lang);
  const slugs = cleanSlugs(Array.isArray(raw) ? raw[0] : raw);
  const known = slugs.flatMap((slug) => {
    const tool = SEED_BY_SLUG.get(slug);
    return tool ? [localizeTool(tool, lang)] : [];
  });
  return (
    <CompareView
      lang={lang}
      slugs={slugs}
      known={known}
      defaultLanguage={pageLanguageName(lang)}
      t={{
        ...pick(t, CARD_KEYS),
        ...pick(t, COMPAT_KEYS),
        ...pick(t, [
          "compare_title", "compare_empty", "compare_feature", "compare_pairs", "compare_rowCost", "compare_rowFees", "compare_rowRating", "compare_rowScore",
          "compare_rowEase", "compare_rowFootprint", "compare_rowLanguages", "compare_rowMyLanguage", "compare_rowConnections", "compare_rowSetup",
          "compare_outOf5", "compare_none", "tool_setupAbout", "common_yes", "common_no", "my_browse",
        ]),
      }}
    />
  );
}

export default function ComparePage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <Compare {...props} />
    </Suspense>
  );
}
