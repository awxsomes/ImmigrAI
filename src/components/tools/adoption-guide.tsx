"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon } from "@/components/icons";
import { CONNECTORS } from "@/data/systems";
import { teamEstimate } from "@/lib/format";
import { fmt, type AdoptionLabels } from "@/lib/labels";
import { connectsWithExisting } from "@/lib/scoring";
import { useUserData } from "@/lib/storage";
import type { PolicyKind, Tool } from "@/lib/types";

const POLICY_KINDS: PolicyKind[] = ["cancel", "refund", "contract", "ai-training", "data-export"];
const OUT = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

/** A short, readable label for a link to a source page. */
function shortUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    return `${hostname.replace(/^www\./, "")}${pathname === "/" ? "" : pathname}`.slice(0, 48);
  } catch {
    return url;
  }
}

function Sources({ urls, t }: { urls: string[]; t: AdoptionLabels }) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return null;
  return (
    <div className="mt-3 text-sm">
      <p className="text-muted-ink">{t.adopt_source}:</p>
      <ul>
        {unique.map((url) => (
          <li key={url}>
            <a href={url} {...OUT} className="inline-flex min-h-11 items-center break-all underline underline-offset-2">
              {shortUrl(url)}
              <span className="sr-only"> ({t.tool_leaving})</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Part({ n, title, id, children }: { n: number; title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-4">
      <h3 className="flex items-center gap-2 text-xl font-semibold">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green text-base font-bold text-white">
          {n}
        </span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

/** Three parts, in the order an owner does them: open an account, bring in what they have, know what they agreed to. */
export function AdoptionGuide({ tool, lang, t }: { tool: Tool; lang: string; t: AdoptionLabels }) {
  const { data, ready } = useUserData();
  const guide = tool.guide;
  const account = guide?.accountSteps ?? [];
  const connect = guide?.connectSteps ?? [];
  const connector = CONNECTORS.find((name) => connectsWithExisting(tool, [name]).length > 0);

  return (
    <section aria-labelledby="adopt-title" className="mt-8 rounded-xl border-2 border-ink bg-surface p-5">
      <h2 id="adopt-title" className="text-2xl font-semibold">
        {fmt(t.adopt_title, { name: tool.name })}
      </h2>
      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <Part n={1} title={t.adopt_account}>
          {account.length > 0 ? (
            <Steps steps={account} />
          ) : (
            <>
              <p>{tool.howToStart}</p>
              <p className="mt-2 text-sm text-muted-ink">{t.adopt_noSteps}</p>
            </>
          )}
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              {fmt(t.tool_setupAbout, { n: tool.setupMinutes })} ({t.tool_estimate})
            </li>
            <li>{tool.selfServe ? t.tool_startAlone : t.card_needsSales}</li>
            <li>
              {t.tool_runsOn}: {tool.platforms.map((p) => t[`platform_${p}` as keyof AdoptionLabels] ?? p).join(", ")}
            </li>
          </ul>
          {account.length > 0 && <Sources urls={[guide?.stepsUrl ?? ""]} t={t} />}
        </Part>

        <Part n={2} title={t.adopt_connect}>
          {ready && data.alreadyUse.length === 0 && (
            <p>
              {t.adopt_tellUs}{" "}
              <Link href={`/${lang}/my-tools#already-title`} prefetch={false} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">
                {t.adopt_tellUsLink}
              </Link>
            </p>
          )}
          {ready && data.alreadyUse.length > 0 && (
            <ul className="space-y-2">
              {data.alreadyUse.map((system) => {
                const direct = connectsWithExisting(tool, [system]).length > 0;
                return (
                  <li key={system} className="flex gap-2">
                    {direct && <CheckIcon className="mt-1 size-4 shrink-0 text-green" />}
                    <span>
                      {direct ? fmt(t.adopt_confirmed, { system }) : connector ? fmt(t.adopt_bridge, { system, via: connector }) : fmt(t.adopt_unconfirmed, { system })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {tool.integrations.length > 0 && <p className="mt-3 text-sm">{fmt(t.adopt_worksWith, { names: tool.integrations.slice(0, 8).join(", ") })}</p>}
          <h4 className="mt-4 font-semibold">{t.adopt_connectSteps}</h4>
          {connect.length > 0 ? (
            <div className="mt-2">
              <Steps steps={connect} />
              <Sources urls={[guide?.stepsUrl ?? ""]} t={t} />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-ink">{t.adopt_noConnectSteps}</p>
          )}
        </Part>

        <Part n={3} title={t.adopt_rules} id="rules">
          <dl className="space-y-3">
            {POLICY_KINDS.map((kind) => {
              const policy = guide?.policies.find((p) => p.kind === kind);
              return (
                <div key={kind}>
                  <dt className="text-sm text-muted-ink">{t[`rule_${kind}`]}</dt>
                  <dd className={policy ? "font-medium" : ""}>{policy?.say ?? t.adopt_notStated}</dd>
                </div>
              );
            })}
          </dl>
          <Sources urls={guide?.policies.map((p) => p.url) ?? []} t={t} />
          {tool.caution && (
            <p className="mt-3 rounded-lg bg-marigold-tint p-3">
              <span className="font-semibold">{t.tool_caution}:</span> {tool.caution}
            </p>
          )}
        </Part>
      </div>
    </section>
  );
}

/** A per-person price only means something once we know how many people. */
export function TeamEstimate({ tool, template }: { tool: Tool; template: string }) {
  const { data } = useUserData();
  const text = teamEstimate(tool, data.business?.size ?? "", template);
  return text ? <span className="block text-sm font-normal text-green-dark">{text}</span> : null;
}
