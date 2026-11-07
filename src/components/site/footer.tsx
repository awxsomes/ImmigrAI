import Link from "next/link";
import { ShopMark } from "@/components/icons";
import { Footer1 } from "@/components/ui/footer-1";
import type { Dict } from "@/lib/i18n";
import { PrivacyChoicesButton } from "./consent-banner";

export function Footer({ lang, t }: { lang: string; t: Dict }) {
  const at = (path: string) => `/${lang}/${path}`;
  return (
    <Footer1
      navLabel={t.footer_explore}
      brand={
        <Link href={`/${lang}`} className="flex items-center gap-2 text-xl font-bold no-underline">
          <ShopMark className="size-8" />
          {t.brand}
        </Link>
      }
      notes={[t.tagline, t.footer_business, t.footer_independent, t.footer_notAdvice]}
      linkGroups={[
        {
          title: t.footer_explore,
          links: [
            { label: t.nav_bundles, href: at("bundles") },
            { label: t.nav_myTools, href: at("my-tools") },
            { label: t.nav_freeHelp, href: at("free-help") },
            { label: t.footer_about_link, href: at("about") },
          ],
        },
        {
          title: t.footer_trust,
          links: [
            { label: t.footer_methodology, href: at("methodology") },
            { label: t.footer_accessibility, href: at("accessibility") },
          ],
        },
        {
          title: t.footer_legal,
          links: [
            { label: t.footer_privacy, href: at("privacy") },
            { label: t.footer_terms, href: at("terms") },
            { label: t.footer_cookies, href: at("cookies") },
            { label: t.footer_delete, href: at("data-deletion") },
          ],
        },
      ]}
      extra={<PrivacyChoicesButton label={t.footer_privacyChoices} />}
    />
  );
}
