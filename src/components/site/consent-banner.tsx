"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reopenConsent, setConsent, useUserData } from "@/lib/storage";

/**
 * Both choices look the same and take one tap, with nothing pre-selected, so saying no
 * is as easy as saying yes. Until someone chooses, nothing is written to their device.
 * Kept short so it does not cover the search box on a phone: the details are one tap away
 * in the cookie policy.
 */
export function ConsentBanner({
  t,
  cookieHref,
}: {
  t: { consent_q: string; consent_d: string; consent_yes: string; consent_no: string; consent_learn: string };
  cookieHref: string;
}) {
  const { consent, ready } = useUserData();
  if (!ready || consent !== "unknown") return null;
  return (
    <div role="region" aria-label={t.consent_q} className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-ink bg-marigold-tint px-4 py-2 sm:py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="max-w-3xl text-sm leading-snug sm:text-base">
          <span className="font-semibold">{t.consent_q}</span> {t.consent_d}{" "}
          <Link href={cookieHref} prefetch={false} className="inline-block py-0.5 underline underline-offset-2">
            {t.consent_learn}
          </Link>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:shrink-0">
          <Button variant="outline" size="sm" className="min-h-11 px-2 sm:px-3" onClick={() => setConsent(true)}>
            {t.consent_yes}
          </Button>
          <Button variant="outline" size="sm" className="min-h-11 px-2 sm:px-3" onClick={() => setConsent(false)}>
            {t.consent_no}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyChoicesButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={reopenConsent} className="inline-block cursor-pointer py-1 text-left text-sm underline underline-offset-2 hover:text-marigold">
      {label}
    </button>
  );
}
