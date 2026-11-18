"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import errors from "@/content/i18n/errors.json";

type ErrorWords = (typeof errors)["en"];

/** Shown inside the page layout, in the language of the address. Unknown languages get English. */
export default function NotFound() {
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang && params.lang in errors ? params.lang : "en";
  const t: ErrorWords = (errors as Record<string, ErrorWords>)[lang];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">{t.notFound_title}</h1>
      <p className="mt-3 text-lg">{t.notFound_body}</p>
      <Link href={`/${lang}`} className={`${buttonVariants()} mt-5`}>
        {t.notFound_home}
      </Link>
    </div>
  );
}
