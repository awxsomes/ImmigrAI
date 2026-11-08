import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckupForm } from "@/components/checkup/checkup-form";
import { CheckupView } from "@/components/checkup/checkup-view";
import { CHECKUP_FORM_KEYS } from "@/components/checkup/labels";
import { CHECKUP_KEYS } from "@/components/checkup/view-labels";
import { Skeleton } from "@/components/ui/skeleton";
import { getDict } from "@/lib/i18n";
import { pick } from "@/lib/labels";

export const metadata: Metadata = { title: "Business checkup", robots: { index: false } };

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined, max: number) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, max) ?? "";
}

async function Checkup({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = getDict(lang);
  const name = one(sp.name, 80);
  const city = one(sp.city, 60);

  if (!name || !city) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-4xl font-bold">{t.checkup_title}</h1>
        <p className="mt-2 mb-6 text-lg">{t.checkup_intro}</p>
        <CheckupForm lang={lang} t={pick(t, CHECKUP_FORM_KEYS)} />
      </div>
    );
  }
  return <CheckupView lang={lang} name={name} city={city} website={one(sp.site, 200)} t={pick(t, CHECKUP_KEYS)} />;
}

export default function CheckupPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <Checkup {...props} />
    </Suspense>
  );
}
