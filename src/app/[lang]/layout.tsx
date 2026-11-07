import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ConsentBanner } from "@/components/site/consent-banner";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getDict, isUiLang, UI_LANGS } from "@/lib/i18n";
import { pick } from "@/lib/labels";
import { SITE, siteUrl } from "@/lib/site";
import "../globals.css";

/**
 * Lexend was designed to make reading easier, including for people new to a language.
 * next/font serves it from this site, so visitors make no request to Google. Chinese
 * uses the device's own fonts rather than a multi-megabyte download.
 */
const lexend = Lexend({ subsets: ["latin", "vietnamese"], variable: "--font-lexend", display: "swap" });

export function generateStaticParams() {
  return UI_LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = { themeColor: "#0e5a45", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${SITE.name}: ${t.tagline2}`, template: `%s | ${SITE.name}` },
    description: t.tagline,
    alternates: { languages: Object.fromEntries(UI_LANGS.map((l) => [l, `/${l}`])) },
  };
}

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isUiLang(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang === "zh" ? "zh-Hans" : lang} className={lexend.variable}>
      <body className="flex min-h-dvh flex-col">
        <noscript>
          <style>{'div[hidden][id^="S:"]{display:block!important}[data-slot="skeleton"]{display:none}'}</style>
        </noscript>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold">
          {t.skipToContent}
        </a>
        <Header lang={lang} t={t} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer lang={lang} t={t} />
        <ConsentBanner t={pick(t, ["consent_q", "consent_d", "consent_yes", "consent_no", "consent_learn"])} cookieHref={`/${lang}/cookies`} />
      </body>
    </html>
  );
}
