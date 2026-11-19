import Link from "next/link";
import type { ReactNode } from "react";

export interface FooterLinkGroup {
  title: string;
  links: Array<{ label: string; href: string }>;
}

/**
 * Watermelon Footer 1, adapted: the newsletter form is gone because this site collects
 * no email addresses. A quiet gray band with the brand and notes beside the link columns.
 */
export function Footer1({ brand, notes, linkGroups, extra, navLabel }: { brand: ReactNode; notes: string[]; linkGroups: FooterLinkGroup[]; extra?: ReactNode; navLabel: string }) {
  return (
    <footer className="mt-16 border-t border-line bg-soft text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          {brand}
          {notes.map((note, index) => (
            <p key={note} className={index === 0 ? "font-semibold" : "text-sm text-muted-ink"}>
              {note}
            </p>
          ))}
        </div>
        <nav aria-label={navLabel} className="grid gap-8 sm:grid-cols-3">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-base font-bold">{group.title}</h2>
              <ul className="mt-2 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false} className="inline-block py-1 text-[0.95rem] no-underline underline-offset-2 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {group === linkGroups[linkGroups.length - 1] && extra ? <li>{extra}</li> : null}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
