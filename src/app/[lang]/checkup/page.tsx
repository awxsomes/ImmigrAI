import type { Metadata } from "next";
import { CheckupFlow } from "@/components/checkup/checkup-flow";
import { CHECKUP_FORM_KEYS } from "@/components/checkup/labels";
import { CHECKUP_KEYS } from "@/components/checkup/view-labels";
import { getDict } from "@/lib/i18n";
import { pick } from "@/lib/labels";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDict(lang).checkup_title, robots: { index: false } };
}

/**
 * The business name and city arrive in memory from the form, or in the body of a POST when
 * the form was sent before scripts loaded. They are never read from the page address.
 */
export default async function CheckupPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(lang);
  return <CheckupFlow lang={lang} t={pick(t, [...CHECKUP_FORM_KEYS, "checkup_title", "checkup_intro"])} viewT={pick(t, CHECKUP_KEYS)} />;
}
