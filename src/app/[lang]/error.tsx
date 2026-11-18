"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import errors from "@/content/i18n/errors.json";

type ErrorWords = (typeof errors)["en"];

/** Runs in the browser, so it reads a small file of error words instead of the whole dictionary. */
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const t: ErrorWords = (errors as Record<string, ErrorWords>)[lang] ?? errors.en;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">{t.error_title}</h1>
      <p className="mt-3 text-lg">{t.error_d}</p>
      <Button className="mt-5" onClick={reset}>
        {t.error_retry}
      </Button>
    </div>
  );
}
