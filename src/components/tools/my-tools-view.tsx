"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { LANGUAGES } from "@/data/languages";
import { SYSTEM_NAMES } from "@/data/systems";
import { DeleteDataControl } from "@/components/site/delete-data";
import { compatText, displayLanguage, priceText, toolHref, type PriceLabels } from "@/lib/format";
import { fmt, type CompatLabels } from "@/lib/labels";
import { bundleFit, compatibility, monthlyTotal, planMonthly, supportsLanguage } from "@/lib/scoring";
import { exportUserData, setAlreadyUse, setConsent, setToolLanguage, toggleSaved, updateSaved, useUserData } from "@/lib/storage";
import type { Subscription, TeamSize, Tool } from "@/lib/types";
import { MyRating } from "./tool-actions";

type SubscriptionLabels = Record<
  | "sub_title" | "sub_intro" | "sub_paying" | "sub_cost" | "sub_costHelp" | "sub_renews" | "sub_trialEnds" | "sub_howToCancel" | "sub_perMonth" | "sub_perYear"
  | "sub_none" | "sub_dueTitle" | "sub_due" | "sub_trialTitle" | "sub_trial" | "sub_overlapTitle" | "sub_overlap",
  string
>;

type Labels = CompatLabels &
  PriceLabels &
  SubscriptionLabels &
  Record<
    | "my_title" | "my_sub" | "my_empty" | "my_browse" | "my_export" | "my_delete" | "my_remove" | "my_alreadyTitle" | "my_alreadyD" | "my_listTitle"
    | "my_stackTitle" | "my_lowestTotal" | "my_fitLabel" | "my_needTwo" | "my_savingOff" | "my_turnOn" | "my_saved" | "my_yourData" | "my_onlyPaper" | "my_seeKit"
    | "tool_ratingLegend" | "tool_star" | "tool_clearRating" | "tool_inUse" | "tool_note" | "tool_rateHelp"
    | "doc_confirmQ" | "doc_confirmDelete" | "doc_cancel" | "doc_deleted"
    | "my_languageTitle" | "my_languageD" | "my_languageSiteIn" | "my_languageNoSite" | "my_languageWorks" | "my_languageUnknown" | "filter_myLanguage" | "filter_chooseLanguage",
    string
  >;

/** How soon a free trial's end is worth a warning. */
const TRIAL_WARNING_DAYS = 14;
const CHARGE_WARNING_DAYS = 30;

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function daysUntil(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/** Owners enter one date. A monthly charge repeats, so an old date still points at the next one. */
function nextCharge(iso: string, today: string) {
  const [year, month, day] = iso.split("-").map(Number);
  for (let added = 0; added < 600; added++) {
    const last = new Date(Date.UTC(year, month - 1 + added + 1, 0)).getUTCDate();
    const date = new Date(Date.UTC(year, month - 1 + added, Math.min(day, last))).toISOString().slice(0, 10);
    if (date >= today) return date;
  }
  return iso;
}

function defaultCost(tool: Tool, size: TeamSize) {
  const plan = tool.pricing.plans?.find((p) => p.monthlyUsd > 0);
  return plan ? planMonthly(plan, size) : tool.pricing.startingMonthlyUsd;
}

function SubscriptionFields({ tool, subscription, size, lang, t }: { tool: Tool; subscription?: Subscription; size: TeamSize; lang: string; t: SubscriptionLabels }) {
  const id = `sub-${tool.slug}`;
  const cancel = tool.guide?.policies.find((policy) => policy.kind === "cancel");
  const change = (patch: Partial<Subscription>) => {
    if (subscription) updateSaved(tool.slug, { subscription: { ...subscription, ...patch } });
  };
  return (
    <div className="mt-4 border-t border-line pt-3">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 font-medium">
        <input
          type="checkbox"
          className="size-6 shrink-0 accent-[#0e5a45]"
          checked={Boolean(subscription)}
          onChange={(event) => updateSaved(tool.slug, { subscription: event.target.checked ? { monthlyUsd: defaultCost(tool, size) } : undefined })}
        />
        {t.sub_paying}
      </label>
      {subscription && (
        <>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor={`${id}-cost`}>{t.sub_cost}</Label>
              <Input
                id={`${id}-cost`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                className="mt-1 border-line-strong"
                value={subscription.monthlyUsd}
                onChange={(event) => change({ monthlyUsd: Math.max(0, Number(event.target.value) || 0) })}
              />
            </div>
            <div>
              <Label htmlFor={`${id}-renews`}>{t.sub_renews}</Label>
              <Input id={`${id}-renews`} type="date" className="mt-1 border-line-strong" value={subscription.renewsOn ?? ""} onChange={(event) => change({ renewsOn: event.target.value || undefined })} />
            </div>
            <div>
              <Label htmlFor={`${id}-trial`}>{t.sub_trialEnds}</Label>
              <Input id={`${id}-trial`} type="date" className="mt-1 border-line-strong" value={subscription.trialEndsOn ?? ""} onChange={(event) => change({ trialEndsOn: event.target.value || undefined })} />
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-ink">{t.sub_costHelp}</p>
          {cancel && <p className="mt-2">{cancel.say}</p>}
          <Link href={`${toolHref(lang, tool.slug)}#rules`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">
            {t.sub_howToCancel}
            <span className="sr-only">: {tool.name}</span>
          </Link>
        </>
      )}
    </div>
  );
}

function SubscriptionSummary({ items, lang, t }: { items: Array<{ tool: Tool; subscription: Subscription }>; lang: string; t: SubscriptionLabels }) {
  const today = todayIso();
  const money = (n: number) => Math.round(n * 100) / 100;
  const perMonth = money(items.reduce((sum, item) => sum + item.subscription.monthlyUsd, 0));
  const when = (iso: string) => new Intl.DateTimeFormat(lang, { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(iso));

  const due = items
    .flatMap(({ tool, subscription }) => {
      if (!subscription.renewsOn) return [];
      const date = nextCharge(subscription.renewsOn, today);
      return daysUntil(today, date) <= CHARGE_WARNING_DAYS ? [{ tool, subscription, date }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const trials = items
    .flatMap(({ tool, subscription }) => {
      const date = subscription.trialEndsOn;
      if (!date) return [];
      const days = daysUntil(today, date);
      return days >= 0 && days <= TRIAL_WARNING_DAYS ? [{ tool, date }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const byJob = new Map<string, Tool[]>();
  for (const { tool } of items) byJob.set(tool.subcategoryId, [...(byJob.get(tool.subcategoryId) ?? []), tool]);
  const overlaps = [...byJob.values()].filter((group) => group.length > 1);
  const list = new Intl.ListFormat(lang, { type: "conjunction" });

  return (
    <div className="mt-3 space-y-4">
      <dl className="flex flex-wrap gap-x-10 gap-y-2">
        <div>
          <dt className="text-sm text-muted-ink">{t.sub_perMonth}</dt>
          <dd className="text-2xl font-bold">${perMonth}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-ink">{t.sub_perYear}</dt>
          <dd className="text-2xl font-bold">${money(perMonth * 12)}</dd>
        </div>
      </dl>
      {trials.length > 0 && (
        <div className="rounded-lg bg-marigold-tint p-3">
          <h3 className="font-semibold">{t.sub_trialTitle}</h3>
          <ul className="mt-1 space-y-1">
            {trials.map(({ tool, date }) => (
              <li key={tool.slug}>{fmt(t.sub_trial, { name: tool.name, date: when(date) })}</li>
            ))}
          </ul>
        </div>
      )}
      {due.length > 0 && (
        <div>
          <h3 className="font-semibold">{t.sub_dueTitle}</h3>
          <ul className="mt-1 space-y-1">
            {due.map(({ tool, subscription, date }) => (
              <li key={tool.slug}>{fmt(t.sub_due, { name: tool.name, n: subscription.monthlyUsd, date: when(date) })}</li>
            ))}
          </ul>
        </div>
      )}
      {overlaps.length > 0 && (
        <div className="rounded-lg bg-marigold-tint p-3">
          <h3 className="font-semibold">{t.sub_overlapTitle}</h3>
          <ul className="mt-1 space-y-1">
            {overlaps.map((group) => (
              <li key={group[0].slug}>{fmt(t.sub_overlap, { names: list.format(group.map((tool) => tool.name)) })}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function MyToolsView({ lang, defaultLanguage, t }: { lang: string; defaultLanguage: string; t: Labels }) {
  const { data, consent, ready } = useUserData();
  const saved = Object.values(data.savedTools);
  const tools = saved.flatMap((s) => (data.toolCache[s.slug] ? [data.toolCache[s.slug]] : []));
  const pairs = tools.flatMap((a, i) => tools.slice(i + 1).map((b) => ({ a, b })));
  const total = Math.round(monthlyTotal(tools) * 100) / 100;
  const size = data.business?.size ?? "";
  const paid = saved.flatMap((s) => (s.subscription && data.toolCache[s.slug] ? [{ tool: data.toolCache[s.slug], subscription: s.subscription }] : []));
  const language = data.language || defaultLanguage;
  const chosen = LANGUAGES.find((l) => l.name === language);
  const languageName = language ? displayLanguage(language, lang) : "";
  const speaks = language ? tools.filter((tool) => supportsLanguage(tool, language)) : [];
  const unconfirmed = language ? tools.filter((tool) => !supportsLanguage(tool, language)) : [];

  function toggleSoftware(name: string, on: boolean) {
    setAlreadyUse(on ? [...data.alreadyUse, name] : data.alreadyUse.filter((n) => n !== name));
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportUserData()], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "immigrai-my-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-bold">{t.my_title}</h1>
      {ready &&
        (consent === "yes" ? (
          <p className="mt-2 text-lg text-muted-ink">{t.my_saved}</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-marigold-tint p-4">
            <p>{t.my_savingOff}</p>
            <Button variant="outline" size="sm" onClick={() => setConsent(true)}>
              {t.my_turnOn}
            </Button>
          </div>
        ))}

      <section id="language" className="mt-8 scroll-mt-4" aria-labelledby="language-title">
        <h2 id="language-title" className="text-2xl font-semibold">{t.my_languageTitle}</h2>
        <p className="mt-1">{t.my_languageD}</p>
        <div className="mt-3 max-w-md">
          <Label htmlFor="my-language">{t.filter_myLanguage}</Label>
          <NativeSelect id="my-language" className="mt-1" value={language} onChange={(event) => setToolLanguage(event.target.value)}>
            <option value="">{t.filter_chooseLanguage}</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.name}>
                {l.native === l.name ? l.name : `${l.native} (${l.name})`}
              </option>
            ))}
          </NativeSelect>
        </div>
        {chosen &&
          (chosen.ui ? (
            chosen.code !== lang && (
              <p className="mt-3">
                <a href={`/${chosen.code}/my-tools#language`} lang={chosen.code} className="font-medium underline underline-offset-2">
                  {fmt(t.my_languageSiteIn, { language: chosen.native })}
                </a>
              </p>
            )
          ) : (
            <p className="mt-3">{fmt(t.my_languageNoSite, { language: languageName })}</p>
          ))}
        {speaks.length > 0 && <p className="mt-3 font-medium text-green-dark">{fmt(t.my_languageWorks, { language: languageName, names: speaks.map((tool) => tool.name).join(", ") })}</p>}
        {unconfirmed.length > 0 && <p className="mt-2">{fmt(t.my_languageUnknown, { language: languageName, names: unconfirmed.map((tool) => tool.name).join(", ") })}</p>}
      </section>

      <section className="mt-10" aria-labelledby="already-title">
        <h2 id="already-title" className="text-2xl font-semibold">{t.my_alreadyTitle}</h2>
        <p className="mt-1">{t.my_alreadyD}</p>
        <ul className="mt-3 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEM_NAMES.map((name) => (
            <li key={name}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-6 shrink-0 accent-[#0e5a45]"
                  checked={data.alreadyUse.includes(name)}
                  onChange={(event) => toggleSoftware(name, event.target.checked)}
                />
                {name}
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          {t.my_onlyPaper}{" "}
          <Link href={`/${lang}/bundles/startup-essentials`} className="font-medium underline underline-offset-2">
            {t.my_seeKit}
          </Link>
        </p>
      </section>

      <section className="mt-10" aria-labelledby="list-title">
        <h2 id="list-title" className="text-2xl font-semibold">{t.my_listTitle}</h2>
        {tools.length === 0 ? (
          <div className="mt-2">
            <p>{t.my_empty}</p>
            <Link href={`/${lang}`} className={`${buttonVariants()} mt-3`}>
              {t.my_browse}
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-4">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">
                        <Link href={toolHref(lang, tool.slug)} className="underline underline-offset-2">
                          {tool.name}
                        </Link>
                      </h3>
                      <p className="font-medium">{priceText(tool, t)}</p>
                    </div>
                    <Button variant="ghost" onClick={() => toggleSaved(tool)}>
                      {t.my_remove}
                      <span className="sr-only">: {tool.name}</span>
                    </Button>
                  </div>
                  <div className="mt-3">
                    <MyRating
                      slug={tool.slug}
                      t={{ legend: t.tool_ratingLegend, star: t.tool_star, clear: t.tool_clearRating, inUse: t.tool_inUse, note: t.tool_note, help: t.tool_rateHelp }}
                    />
                  </div>
                  <SubscriptionFields tool={tool} subscription={data.savedTools[tool.slug]?.subscription} size={size} lang={lang} t={t} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tools.length > 0 && (
        <section id="subscriptions" className="mt-10 scroll-mt-4" aria-labelledby="pay-title">
          <h2 id="pay-title" className="text-2xl font-semibold">{t.sub_title}</h2>
          <p className="mt-1">{t.sub_intro}</p>
          {paid.length === 0 ? <p className="mt-2 text-muted-ink">{t.sub_none}</p> : <SubscriptionSummary items={paid} lang={lang} t={t} />}
        </section>
      )}

      {tools.length > 0 && (
        <section className="mt-10" aria-labelledby="stack-title">
          <h2 id="stack-title" className="text-2xl font-semibold">{t.my_stackTitle}</h2>
          <dl className="mt-3 flex flex-wrap gap-x-10 gap-y-2">
            <div>
              <dt className="text-sm text-muted-ink">{t.my_lowestTotal}</dt>
              <dd className="text-2xl font-bold">${total}</dd>
            </div>
            {tools.length > 1 && (
              <div>
                <dt className="text-sm text-muted-ink">{t.my_fitLabel}</dt>
                <dd className="text-2xl font-bold">{bundleFit(tools)}/100</dd>
              </div>
            )}
          </dl>
          {tools.length < 2 ? (
            <p className="mt-2">{t.my_needTwo}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pairs.map(({ a, b }) => {
                const text = compatText(compatibility(a, b), t);
                return (
                  <li key={`${a.slug}-${b.slug}`}>
                    <span className="font-medium">
                      {a.name} + {b.name}:
                    </span>{" "}
                    {text.label}
                    <span className="block text-sm text-muted-ink">{text.detail}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section className="mt-10 border-t-2 border-line pt-6" aria-labelledby="data-title">
        <h2 id="data-title" className="text-2xl font-semibold">{t.my_yourData}</h2>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <Button variant="outline" onClick={download}>
            {t.my_export}
          </Button>
          <DeleteDataControl t={{ button: t.my_delete, question: t.doc_confirmQ, confirm: t.doc_confirmDelete, cancel: t.doc_cancel, done: t.doc_deleted }} />
        </div>
      </section>
    </div>
  );
}
