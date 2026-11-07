import Link from "next/link";
import type { ReactNode } from "react";

export interface FooterLinkGroup {
  title: string;
  links: Array<{ label: string; href: string }>;
}

/**
 * Watermelon Footer 1, adapted: the newsletter form is gone because this site collects
 * no email addresses, and it sits on the dark green that closes every page.
 */
export function Footer1({ brand, notes, linkGroups, extra, navLabel }: { brand: ReactNode; notes: string[]; linkGroups: FooterLinkGroup[]; extra?: ReactNode; navLabel: string }) {
  return (
    <footer className="mt-16 bg-green-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          {brand}
          {notes.map((note) => (
            <p key={note} className="text-sm">
              {note}
            </p>
          ))}
        </div>
        <nav aria-label={navLabel} className="grid gap-8 sm:grid-cols-3">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-base font-semibold">{group.title}</h2>
              <ul className="mt-2 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false} className="inline-block py-1 text-sm underline underline-offset-2 hover:text-marigold">
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
