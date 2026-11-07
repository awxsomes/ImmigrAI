"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reopenConsent, setConsent, useUserData } from "@/lib/storage";

/**
 * Both choices look the same and take one tap, with nothing pre-selected, so saying no
 * is as easy as saying yes. Until someone chooses, nothing is written to their device.
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
    <div role="region" aria-label={t.consent_q} className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-ink bg-marigold-tint px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="max-w-3xl">
          <p className="font-semibold">{t.consent_q}</p>
          <p className="text-sm">
            {t.consent_d}{" "}
            <Link href={cookieHref} prefetch={false} className="underline underline-offset-2">
              {t.consent_learn}
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:shrink-0">
          <Button variant="outline" size="sm" className="min-h-12" onClick={() => setConsent(true)}>
            {t.consent_yes}
          </Button>
          <Button variant="outline" size="sm" className="min-h-12" onClick={() => setConsent(false)}>
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
