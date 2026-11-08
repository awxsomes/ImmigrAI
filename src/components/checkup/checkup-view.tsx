"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { PromptHelper } from "@/components/tools/prompt-helper";
import { SaveAllButton } from "@/components/tools/tool-actions";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckupProblem, CheckupResult, ProblemEvidence, SiteGap, SiteSignals } from "@/lib/checkup";
import { compatText, displayLanguage, priceText, toolHref } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { fmt } from "@/lib/labels";
import type { Adoption } from "@/lib/match-types";
import { useUserData } from "@/lib/storage";
import type { BusinessType } from "@/lib/types";
import type { CHECKUP_KEYS } from "./view-labels";

type Labels = Pick<Dict, (typeof CHECKUP_KEYS)[number]>;

type Outcome = { result: CheckupResult } | { failed: "failed" | "limited" };

const OUT = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

const GAP_LABEL: Record<SiteGap, keyof Labels> = {
  noBooking: "checkup_sigNoBooking",
  noOrdering: "checkup_sigNoOrdering",
  noPhone: "checkup_sigNoPhone",
  noHours: "checkup_sigNoHours",
  oneLanguage: "checkup_sigOneLanguage",
  noWebsite: "checkup_evNoSite",
};

const BOOKING_MATTERS: Array<BusinessType | ""> = ["restaurant", "salon", "trades", "cleaning"];
const ORDERING_MATTERS: Array<BusinessType | ""> = ["restaurant", "retail"];

function siteName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www./, "");
  } catch {
    return url;
  }
}

function Source({ url, label, t }: { url: string; label: string; t: Labels }) {
  return (
    <a href={url} {...OUT} className="inline-block py-1 text-sm underline underline-offset-2">
      {label}
      <span className="sr-only"> ({t.tool_leaving})</span>
    </a>
  );
}

function Signal({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      {ok ? (
        <CheckIcon className="mt-1 size-4 shrink-0 text-green" />
      ) : (
        <span aria-hidden="true" className="w-4 shrink-0 text-center font-bold">
          &ndash;
        </span>
      )}
      {children}
    </li>
  );
}

function SiteFindings({ site, type, lang, t }: { site: SiteSignals; type: BusinessType | ""; lang: string; t: Labels }) {
  if (site.thin) return <p>{t.checkup_siteThin}</p>;
  const languages = site.languages.map((language) => displayLanguage(language, lang));
  return (
    <ul className="space-y-1">
      <Signal ok={site.phoneFriendly}>{site.phoneFriendly ? t.checkup_sigPhone : t.checkup_sigNoPhone}</Signal>
      {(site.booking || BOOKING_MATTERS.includes(type)) && <Signal ok={site.booking}>{site.booking ? t.checkup_sigBooking : t.checkup_sigNoBooking}</Signal>}
      {(site.ordering || ORDERING_MATTERS.includes(type)) && <Signal ok={site.ordering}>{site.ordering ? t.checkup_sigOrdering : t.checkup_sigNoOrdering}</Signal>}
      <Signal ok={site.hours}>{site.hours ? t.checkup_sigHours : t.checkup_sigNoHours}</Signal>
      {site.https && <Signal ok>{t.checkup_sigHttps}</Signal>}
      {languages.length > 0 && <Signal ok={languages.length > 1}>{fmt(t.checkup_sigLanguages, { list: languages.join(", ") })}</Signal>}
    </ul>
  );
}

function Evidence({ evidence, t }: { evidence: ProblemEvidence; t: Labels }) {
  if (evidence.kind === "review") {
    return (
      <p className="mt-1">
        <span className="font-medium">{t.checkup_evReview}:</span> {evidence.theme}{" "}
        <Source url={evidence.url} label={fmt(t.checkup_source, { site: evidence.site })} t={t} />
      </p>
    );
  }
  return (
    <p className="mt-1">
      {evidence.gap === "noWebsite" ? (
        t.checkup_evNoSite
      ) : (
        <>
          <span className="font-medium">{t.checkup_evSite}:</span> {t[GAP_LABEL[evidence.gap]]}
        </>
      )}
    </p>
  );
}

function adoptionText(item: Adoption, t: Labels) {
  const key = { direct: t.checkup_adoptDirect, bridge: t.checkup_adoptBridge, import: t.checkup_adoptImport, unknown: t.checkup_adoptUnknown }[item.level];
  return fmt(key, { system: item.system });
}

function ProblemCard({ problem, index, lang, t }: { problem: CheckupProblem; index: number; lang: string; t: Labels }) {
  const match = problem.match;
  const tool = match?.tool;
  const accountSteps = tool?.guide?.accountSteps.length ? tool.guide.accountSteps : tool ? [tool.howToStart] : [];
  const connectSteps = tool?.guide?.connectSteps ?? [];

  return (
    <li className="rounded-xl border-2 border-line bg-surface p-5">
      <h3 className="text-xl font-semibold">
        {index + 1}. {problem.title}
      </h3>
      <Evidence evidence={problem.evidence} t={t} />

      {!match || !tool ? (
        <p className="mt-3 rounded-lg bg-marigold-tint p-3">{t.checkup_noTool}</p>
      ) : (
        <div className="mt-4 space-y-4 border-t-2 border-line pt-4">
          <div>
            <p className="text-sm text-muted-ink">{t.checkup_tool}</p>
            <p className="text-lg font-semibold">
              <Link href={toolHref(lang, tool.slug)} prefetch={false} className="underline underline-offset-2">
                {tool.name}
              </Link>
            </p>
            <p className="font-medium">{priceText(tool, t)}</p>
            {match.why && <p className="mt-1">{match.why}</p>}
          </div>

          {match.useThis.length > 0 && (
            <div>
              <h4 className="font-semibold">{t.checkup_useThis}</h4>
              <ul className="mt-1 space-y-1">
                {match.useThis.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold">{t.checkup_setup}</h4>
            <ol className="mt-1 list-decimal space-y-1 pl-6">
              {accountSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {connectSteps.length > 0 && (
              <>
                <h4 className="mt-3 font-semibold">{t.checkup_connect}</h4>
                <ol className="mt-1 list-decimal space-y-1 pl-6">
                  {connectSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </>
            )}
            {tool.guide?.stepsUrl && <Source url={tool.guide.stepsUrl} label={t.checkup_stepsSource} t={t} />}
          </div>

          {match.adoption.length > 0 && (
            <div>
              <h4 className="font-semibold">{t.checkup_adoptTitle}</h4>
              <ul className="mt-1 space-y-1">
                {match.adoption.map((item) => (
                  <Signal key={item.system} ok={item.level === "direct" || item.level === "bridge"}>
                    <span>
                      {adoptionText(item, t)} {item.evidenceUrl && <Source url={item.evidenceUrl} label={fmt(t.checkup_source, { site: siteName(item.evidenceUrl) })} t={t} />}
                    </span>
                  </Signal>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-3">
            <PromptHelper slug={tool.slug} problem={problem.need} lang={lang} t={t} />
            <Link href={toolHref(lang, tool.slug)} prefetch={false} className={buttonVariants({ variant: "outline" })}>
              {t.checkup_seeTool}
              <ArrowIcon className="size-4" />
              <span className="sr-only">: {tool.name}</span>
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

function Results({ result, lang, t }: { result: CheckupResult; lang: string; t: Labels }) {
  const { business, themes, site, problems, plan, pages, partial } = result;
  const praise = themes.filter((theme) => theme.kind === "praise");
  const complaints = themes.filter((theme) => theme.kind === "complaint");
  const planTools = [...new Map(problems.flatMap((p) => (p.match ? [[p.match.tool.slug, p.match.tool] as const] : []))).values()];

  return (
    <>
      <div className="mt-3 rounded-lg bg-green-tint p-4">
        <p className="text-sm">{t.checkup_matched}</p>
        <p className="text-xl font-semibold">{business?.name}</p>
        {business?.address && <p>{business.address}</p>}
        <p className="mt-1 text-sm">{pages === 0 ? t.checkup_pagesNone : pages === 1 ? t.checkup_pagesOne : fmt(t.checkup_pages, { n: pages })}</p>
        <Link href={`/${lang}/checkup`} prefetch={false} className="inline-block py-1 font-medium underline underline-offset-2">
          {t.checkup_wrong}
        </Link>
      </div>

      {partial && <p className="mt-4 rounded-lg bg-marigold-tint p-3">{t.checkup_partial}</p>}

      <section aria-labelledby="fix-title" className="mt-8">
        <h2 id="fix-title" className="text-2xl font-semibold">
          {t.checkup_fixTitle}
        </h2>
        {problems.length === 0 ? (
          <div className="mt-2">
            <p>{t.checkup_noProblems}</p>
            <Link href={`/${lang}`} prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-3`}>
              {t.checkup_describe}
            </Link>
          </div>
        ) : (
          <ol className="mt-3 space-y-4">
            {problems.map((problem, index) => (
              <ProblemCard key={problem.need} problem={problem} index={index} lang={lang} t={t} />
            ))}
          </ol>
        )}
      </section>

      {plan && (
        <section aria-labelledby="plan-title" className="mt-8 rounded-xl border-2 border-ink bg-surface p-5">
          <h2 id="plan-title" className="text-2xl font-semibold">
            {t.checkup_planTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-ink">{t.checkup_planCost}</p>
          <p className="text-2xl font-bold">${plan.monthlyUsd}</p>
          <h3 className="mt-4 font-semibold">{t.checkup_planLinks}</h3>
          <ul className="mt-1 space-y-2">
            {plan.links.map(({ a, b, result: link }) => {
              const text = compatText(link, t);
              return (
                <li key={`${a}-${b}`}>
                  <span className="font-medium">
                    {a} + {b}:
                  </span>{" "}
                  {text.label}
                  <span className="block text-sm text-muted-ink">{text.detail}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <SaveAllButton tools={planTools} label={t.checkup_planSave} doneLabel={t.checkup_planSaved} />
          </div>
        </section>
      )}

      <section aria-labelledby="says-title" className="mt-8">
        <h2 id="says-title" className="text-2xl font-semibold">
          {t.checkup_saysTitle}
        </h2>
        {themes.length === 0 ? (
          <p className="mt-2">{t.checkup_noThemes}</p>
        ) : (
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            {[
              { title: t.checkup_praise, list: praise },
              { title: t.checkup_complaint, list: complaints },
            ].map(
              ({ title, list }) =>
                list.length > 0 && (
                  <div key={title}>
                    <h3 className="font-semibold">{title}</h3>
                    <ul className="mt-1 space-y-2">
                      {list.map((theme) => (
                        <li key={theme.theme}>
                          {theme.theme}
                          <span className="block">
                            <Source url={theme.url} label={fmt(t.checkup_source, { site: theme.site })} t={t} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="site-title" className="mt-8">
        <h2 id="site-title" className="text-2xl font-semibold">
          {t.checkup_siteTitle}
        </h2>
        <div className="mt-2">{site ? <SiteFindings site={site} type={business?.type ?? ""} lang={lang} t={t} /> : <p>{t.checkup_siteNone}</p>}</div>
      </section>
    </>
  );
}

/** Asks once the visitor's saved answers have loaded, so their software counts in the first result. */
export function CheckupView({ lang, name, city, website, t }: { lang: string; name: string; city: string; website: string; t: Labels }) {
  const { data, ready } = useUserData();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const { type, size } = data.business;
  const systems = data.alreadyUse.join("|");

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    fetch("/api/checkup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, website, lang, type, size, systems: systems ? systems.split("|") : [] }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 429) return setOutcome({ failed: "limited" });
        if (!res.ok) return setOutcome({ failed: "failed" });
        setOutcome({ result: (await res.json()) as CheckupResult });
      })
      .catch(() => {
        if (!controller.signal.aborted) setOutcome({ failed: "failed" });
      });
    return () => controller.abort();
  }, [ready, name, city, website, lang, type, size, systems]);

  const again = (
    <div className="mt-4 flex flex-wrap gap-3">
      <Link href={`/${lang}/checkup`} prefetch={false} className={buttonVariants({ variant: "outline" })}>
        {t.checkup_wrong}
      </Link>
      <Link href={`/${lang}`} prefetch={false} className={buttonVariants({ variant: "outline" })}>
        {t.checkup_describe}
      </Link>
    </div>
  );

  let body: ReactNode;
  if (!outcome) {
    body = (
      <>
        <p role="status" className="mt-3 text-lg">
          {t.checkup_loading}
        </p>
        <Skeleton className="mt-6 h-32 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </>
    );
  } else if ("failed" in outcome) {
    body = (
      <>
        <p role="alert" className="mt-3 rounded-lg bg-marigold-tint p-4">
          {outcome.failed === "limited" ? t.checkup_limited : t.checkup_failed}
        </p>
        {again}
      </>
    );
  } else if (outcome.result.status === "ok") {
    body = <Results result={outcome.result} lang={lang} t={t} />;
  } else {
    const message = outcome.result.status === "not-found" ? t.checkup_notFound : outcome.result.status === "error" ? t.checkup_failed : t.checkup_paused;
    body = (
      <>
        <p role="status" className="mt-3 rounded-lg bg-marigold-tint p-4">
          {message}
        </p>
        {again}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-bold">{t.checkup_title}</h1>
      {body}
    </div>
  );
}
