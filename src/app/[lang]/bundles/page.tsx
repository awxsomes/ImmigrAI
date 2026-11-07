import type { Metadata } from "next";
import { KitCard, NewToolsCard } from "@/components/tools/kit-card";
import { getDict } from "@/lib/i18n";
import { localBundles } from "@/lib/localize";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDict(lang).kit_title };
}

export default async function BundlesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(lang);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">{t.kit_title}</h1>
      <p className="mt-2 max-w-3xl text-lg text-muted-ink">{t.kit_sub}</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {localBundles(lang).map((kit) => (
          <li key={kit.slug}>
            <KitCard kit={kit} lang={lang} t={t} heading="h2" />
          </li>
        ))}
        <li>
          <NewToolsCard lang={lang} t={t} heading="h2" />
        </li>
      </ul>
    </div>
  );
}
