"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteDataControl } from "@/components/site/delete-data";
import { compatText, priceText, toolHref } from "@/lib/format";
import type { CompatLabels } from "@/lib/labels";
import { bundleFit, compatibility, monthlyTotal } from "@/lib/scoring";
import { exportUserData, setAlreadyUse, setConsent, toggleSaved, useUserData } from "@/lib/storage";
import { MyRating } from "./tool-actions";

/** Common software owners already run. Tools are matched against these names. */
const COMMON_SOFTWARE = ["QuickBooks", "Square", "Clover", "Toast", "Shopify", "Stripe", "PayPal", "Google Sheets", "Microsoft Excel", "Gmail", "Google Calendar", "WhatsApp", "Facebook", "Instagram", "Wix"];

type Labels = CompatLabels &
  Record<
    | "my_title" | "my_sub" | "my_empty" | "my_browse" | "my_export" | "my_delete" | "my_remove" | "my_alreadyTitle" | "my_alreadyD" | "my_listTitle"
    | "my_stackTitle" | "my_total" | "my_fitLabel" | "my_needTwo" | "my_savingOff" | "my_turnOn" | "my_saved" | "my_yourData" | "my_onlyPaper" | "my_seeKit"
    | "card_free" | "card_freePlan" | "card_noMonthlyFee" | "card_youSetBudget" | "card_perReturn" | "card_from" | "card_perMonth" | "tool_ratingLegend" | "tool_star" | "tool_clearRating" | "tool_inUse" | "tool_note" | "tool_rateHelp"
    | "doc_confirmQ" | "doc_confirmDelete" | "doc_cancel" | "doc_deleted",
    string
  >;

export function MyToolsView({ lang, t }: { lang: string; t: Labels }) {
  const { data, consent, ready } = useUserData();
  const saved = Object.values(data.savedTools);
  const tools = saved.flatMap((s) => (data.toolCache[s.slug] ? [data.toolCache[s.slug]] : []));
  const pairs = tools.flatMap((a, i) => tools.slice(i + 1).map((b) => ({ a, b })));
  const total = Math.round(monthlyTotal(tools) * 100) / 100;

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

      <section className="mt-8" aria-labelledby="already-title">
        <h2 id="already-title" className="text-2xl font-semibold">{t.my_alreadyTitle}</h2>
        <p className="mt-1">{t.my_alreadyD}</p>
        <ul className="mt-3 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMMON_SOFTWARE.map((name) => (
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
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tools.length > 0 && (
        <section className="mt-10" aria-labelledby="stack-title">
          <h2 id="stack-title" className="text-2xl font-semibold">{t.my_stackTitle}</h2>
          <dl className="mt-3 flex flex-wrap gap-x-10 gap-y-2">
            <div>
              <dt className="text-sm text-muted-ink">{t.my_total}</dt>
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
