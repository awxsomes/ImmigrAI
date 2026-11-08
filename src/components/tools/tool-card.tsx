import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, StarIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { aiLabel, displayLanguage, nextPlanText, priceConfirmation, priceText, toolHref } from "@/lib/format";
import { fmt, type CardLabels } from "@/lib/labels";
import { connectsWithExisting, envLabel, supportsLanguage } from "@/lib/scoring";
import type { Tool } from "@/lib/types";
import { TeamEstimate } from "./adoption-guide";

/**
 * One tool, with the same facts in the same order every time, so tools are easy to
 * compare by scanning down a list. Has no hooks: renders on the server or the client.
 */

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-ink">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export function RatingText({ tool, t }: { tool: Tool; t: CardLabels }) {
  const { rating, sources, reviewCount } = tool.reviews;
  if (tool.publicResource) return <span className="font-normal">{t.card_publicResource}</span>;
  if (rating === null) {
    return (
      <>
        <span className="font-normal">{t.card_noRating}</span>
        <span className="block text-sm font-normal text-muted-ink">{t.card_smallTool}</span>
      </>
    );
  }
  return (
    <>
      <span className="inline-flex items-center gap-1">
        <StarIcon className="size-4 text-[#a97a0c]" />
        {fmt(t.card_ratingLine, { rating })}
      </span>
      <span className="block text-sm font-normal text-muted-ink">
        {sources.length === 1 ? t.card_fromSite : fmt(t.card_fromSites, { n: sources.length })}
        {reviewCount > 0 ? `, ${fmt(t.card_reviewCount, { n: reviewCount.toLocaleString() })}` : ""}
      </span>
    </>
  );
}

export function ToolCard({
  tool,
  lang,
  t,
  language,
  alreadyUse,
  actions,
}: {
  tool: Tool;
  lang: string;
  t: CardLabels;
  /** The owner's language, as an English name. Empty when they have not chosen one. */
  language?: string;
  alreadyUse?: string[];
  actions?: ReactNode;
}) {
  const href = toolHref(lang, tool.slug);
  const env = tool.environmental;
  const envWord = t[`env_${envLabel(env.score)}`];
  const shownLinks = tool.integrations.slice(0, 3);
  const extraLinks = tool.integrations.length - shownLinks.length;
  const existing = alreadyUse?.length ? connectsWithExisting(tool, alreadyUse) : [];
  const languageName = language ? displayLanguage(language, lang) : "";
  const speaks = language ? supportsLanguage(tool, language) : false;
  const next = nextPlanText(tool, t);
  const confirmation = priceConfirmation(tool, t);
  const hasPlans = Boolean(tool.pricing.plans?.length);

  return (
    <article className="rounded-xl border-2 border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">
            <Link href={href} prefetch={false} className="underline-offset-2 hover:underline">
              {tool.name}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={tool.ai.level === "core" ? "warm" : tool.ai.level === "feature" ? "default" : "outline"}>{aiLabel(tool.ai.level, t)}</Badge>
            {tool.source === "live" && <Badge variant="outline">{t.card_new}</Badge>}
            {tool.trades?.map((trade) => (
              <Badge key={trade} variant="warm">
                {fmt(t.card_builtFor, { trade: t[`trade_${trade}`] })}
              </Badge>
            ))}
          </p>
        </div>
        <div
          role="img"
          aria-label={fmt(t.card_scoreOf, { n: tool.scores.overall })}
          className="flex size-16 shrink-0 flex-col items-center justify-center rounded-lg bg-green text-white"
        >
          <span className="text-2xl leading-none font-bold">{tool.scores.overall}</span>
          <span className="mt-0.5 text-xs">{t.card_score}</span>
        </div>
      </div>

      <p className="mt-3">{tool.summary}</p>
      {tool.ai.level !== "none" && tool.ai.feature && (
        <p className="mt-3 rounded-lg bg-green-tint px-3 py-2">
          <span className="font-semibold">{t.card_aiDoes}:</span> {tool.ai.feature}
        </p>
      )}
      {tool.focus === "general" && <p className="mt-3 rounded-lg bg-marigold-tint px-3 py-2 font-medium">{t.card_generalNote}</p>}

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Fact label={t.card_cost}>
          {priceText(tool, t)}
          {next && <span className="block text-sm font-normal text-muted-ink">{next}</span>}
          <TeamEstimate tool={tool} template={t.price_estimate} />
          {confirmation && <span className="block text-sm font-normal text-muted-ink">{confirmation}</span>}
          {!hasPlans && tool.pricing.note && <span className="mt-0.5 line-clamp-2 text-sm font-normal text-muted-ink">{tool.pricing.note}</span>}
          {tool.guide?.paywall && (
            <span className="line-clamp-2 text-sm font-normal text-muted-ink">
              {t.price_paywall}: {tool.guide.paywall}
            </span>
          )}
          {tool.pricing.extraFees && (
            <span className="line-clamp-2 text-sm font-normal text-muted-ink">
              {t.card_fees}: {tool.pricing.extraFees}
            </span>
          )}
        </Fact>
        <Fact label={t.card_rating}>
          <RatingText tool={tool} t={t} />
        </Fact>
        <Fact label={t.card_language}>
          {language ? (
            speaks ? (
              <span className="inline-flex items-center gap-1 text-green-dark">
                <CheckIcon className="size-4" />
                {fmt(t.card_worksInLang, { language: languageName })}
              </span>
            ) : (
              <span className="font-normal">{fmt(t.card_notConfirmedLang, { language: languageName })}</span>
            )
          ) : (
            <span>{tool.languages.length === 1 ? t.card_languageOne : fmt(t.card_languageCount, { n: tool.languages.length })}</span>
          )}
          <Link href={`${href}#languages`} prefetch={false} className="inline-block py-1 text-sm font-normal underline underline-offset-2">
            {t.card_seeLanguages}
          </Link>
        </Fact>
        <Fact label={t.card_footprint}>
          {env.score}/100, {envWord}
        </Fact>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-ink">{t.card_connects}</dt>
          <dd className="font-medium">
            {shownLinks.length > 0 ? (
              <>
                {shownLinks.join(", ")}
                {extraLinks > 0 ? ` ${fmt(t.card_more, { n: extraLinks })}` : ""}
              </>
            ) : (
              <span className="font-normal">{t.card_noConnections}</span>
            )}
          </dd>
        </div>
      </dl>

      {existing.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-green-tint px-2 py-1 text-sm font-medium text-green-dark">
          <CheckIcon className="size-4 shrink-0" />
          {fmt(t.card_connectsExisting, { names: existing.join(", ") })}
        </p>
      )}
      {!tool.selfServe && <p className="mt-3 text-sm font-medium text-[#7a2a14]">{t.card_needsSales}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={href}
          prefetch={false}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-green bg-green px-5 py-2 font-medium text-white no-underline transition-colors hover:border-green-dark hover:bg-green-dark"
        >
          {t.card_details}
          <span className="sr-only">: {tool.name}</span>
        </Link>
        {actions}
      </div>
    </article>
  );
}
