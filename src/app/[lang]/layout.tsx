import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ConsentBanner } from "@/components/site/consent-banner";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LoadingLabelsProvider } from "@/components/site/loading-status";
import { NavProgress } from "@/components/site/nav-progress";
import { OfflineSupport } from "@/components/site/offline";
import { TabBar } from "@/components/site/tab-bar";
import { SPLASH_SCREENS } from "@/lib/app-images";
import { getDict, isUiLang, UI_LANGS } from "@/lib/i18n";
import { pick } from "@/lib/labels";
import { SITE, siteUrl } from "@/lib/site";
import "../globals.css";

/**
 * Inter: a plain, even typeface made for screens, which stays clear at small sizes on a phone.
 * It covers Vietnamese, including stacked accent marks. next/font serves it from this site, so
 * visitors make no request to Google. Chinese uses the device's own fonts rather than a
 * multi-megabyte download.
 */
const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter", display: "swap" });

export function generateStaticParams() {
  return UI_LANGS.map((lang) => ({ lang }));
}

/** `cover` lets the page reach the screen's rounded corners and the iPhone home bar; globals.css keeps content clear of them. */
export const viewport: Viewport = { themeColor: "#1d4ed8", width: "device-width", initialScale: 1, viewportFit: "cover" };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${SITE.name}: ${t.tagline2}`, template: `%s | ${SITE.name}` },
    description: t.tagline,
    alternates: { languages: Object.fromEntries(UI_LANGS.map((l) => [l, `/${l}`])) },
    // Added to a phone's home screen, the site opens full screen like an app, with a launch screen.
    manifest: `/${lang}/manifest.webmanifest`,
    icons: { apple: "/icons/apple-touch-icon.png" },
    appleWebApp: {
      capable: true,
      title: SITE.name,
      statusBarStyle: "default",
      startupImage: SPLASH_SCREENS.map(({ url, media }) => ({ url, media })),
    },
  };
}

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isUiLang(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang === "zh" ? "zh-Hans" : lang} className={inter.variable}>
      <body className="flex min-h-dvh flex-col ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]">
        <noscript>
          <style>{'div[hidden][id^="S:"]{display:block!important}[data-slot="skeleton"]{display:none}'}</style>
        </noscript>
        <NavProgress />
        <OfflineSupport banner={t.offline_banner} />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold">
          {t.skipToContent}
        </a>
        <Header lang={lang} t={t} />
        <main id="main" className="flex-1">
          <LoadingLabelsProvider labels={{ loading: t.common_loading, offline: t.offline_waiting }}>{children}</LoadingLabelsProvider>
        </main>
        <Footer lang={lang} t={t} />
        <TabBar lang={lang} t={{ nav: t.tab_nav, home: t.nav_home, search: t.search_button, kits: t.tab_kits, checkup: t.tab_checkup, saved: t.tab_saved }} />
        <ConsentBanner t={pick(t, ["consent_q", "consent_d", "consent_yes", "consent_no", "consent_learn"])} cookieHref={`/${lang}/cookies`} />
      </body>
    </html>
  );
}
