import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, StarIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { aiLabel, displayLanguage, nextPlanText, priceConfirmation, priceText, startCase, toolHref, type PriceLabels } from "@/lib/format";
import { fmt, type CardLabels } from "@/lib/labels";
import { connectsWithExisting, languageAnswer } from "@/lib/scoring";
import type { Tool } from "@/lib/types";
import { TeamEstimate } from "./adoption-guide";
import { AdviceNote } from "./advice-note";

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
        <StarIcon className="size-4 text-star" />
        {fmt(t.card_ratingLine, { rating })}
      </span>
      <span className="block text-sm font-normal text-muted-ink">
        {sources.length === 1 ? t.card_fromSite : fmt(t.card_fromSites, { n: sources.length })}
        {reviewCount > 0 ? `, ${fmt(t.card_reviewCount, { n: reviewCount.toLocaleString() })}` : ""}
      </span>
    </>
  );
}

type FactLineLabels = PriceLabels & Pick<CardLabels, "card_reviewCount" | "card_languageOne" | "card_languageCount">;

type LanguageLabels = Pick<CardLabels, "card_worksInLang" | "lang_notChecked" | "lang_notSupported">;

/**
 * Whether a tool works in the owner's language, in three honest answers. "Not checked" is not
 * "not supported": most small tools have no language list we could read, and they may still work.
 */
export function LanguageFit({ tool, lang, language, languageName, t }: { tool: Tool; lang: string; language: string; languageName: string; t: LanguageLabels }) {
  const answer = languageAnswer(tool, language);
  if (answer === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-blue-dark">
        <CheckIcon className="size-4" />
        {fmt(t.card_worksInLang, { language: languageName })}
      </span>
    );
  }
  return <span className="font-normal">{startCase(fmt(answer === "no" ? t.lang_notSupported : t.lang_notChecked, { language: languageName }), lang)}</span>;
}

/** The three facts people scan for first, on one line: cost, rating and languages. The full facts follow in the same order. */
export function FactLine({ tool, t, className }: { tool: Tool; t: FactLineLabels; className?: string }) {
  const { rating, reviewCount } = tool.reviews;
  const separator = (
    <span aria-hidden="true" className="text-line-strong">
      |
    </span>
  );
  return (
    <p className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 ${className ?? ""}`}>
      <span className="font-semibold">{priceText(tool, t)}</span>
      {!tool.publicResource && rating !== null && (
        <>
          {separator}
          <span className="inline-flex items-center gap-1">
            <StarIcon className="size-4 text-star" />
            <span className="font-semibold">{rating}</span>
            {reviewCount > 0 && <span className="text-muted-ink">({fmt(t.card_reviewCount, { n: reviewCount.toLocaleString() })})</span>}
          </span>
        </>
      )}
      {separator}
      <span>{tool.languages.length === 1 ? t.card_languageOne : fmt(t.card_languageCount, { n: tool.languages.length })}</span>
    </p>
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
  const shownLinks = tool.integrations.slice(0, 3);
  const extraLinks = tool.integrations.length - shownLinks.length;
  const existing = alreadyUse?.length ? connectsWithExisting(tool, alreadyUse) : [];
  const languageName = language ? displayLanguage(language, lang) : "";
  const next = nextPlanText(tool, t);
  const confirmation = priceConfirmation(tool, t);
  const hasPlans = Boolean(tool.pricing.plans?.length);

  return (
    <article className="tap-card rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold">
            <Link href={href} className="underline-offset-2 hover:underline">
              {tool.name}
            </Link>
          </h3>
          <FactLine tool={tool} t={t} className="mt-1 text-[0.95rem]" />
          <p className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={tool.ai.level === "core" ? "warm" : tool.ai.level === "feature" ? "default" : "outline"}>{aiLabel(tool.ai.level, t)}</Badge>
            {tool.source === "live" && <Badge variant="outline">{t.card_foundLive}</Badge>}
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
          className="flex size-16 shrink-0 flex-col items-center justify-center rounded-lg bg-blue text-white"
        >
          <span className="text-2xl leading-none font-bold">{tool.scores.overall}</span>
          <span className="mt-0.5 text-xs">{t.card_score}</span>
        </div>
      </div>

      <p className="mt-3">{tool.summary}</p>
      {tool.ai.level !== "none" && tool.ai.feature && (
        <p className="mt-2 text-muted-ink">
          <span className="font-semibold text-ink">{t.card_aiDoes}:</span> {tool.ai.feature}
        </p>
      )}
      {tool.focus === "general" && <p className="mt-3 rounded-lg bg-amber-tint px-3 py-2 font-medium">{t.card_generalNote}</p>}
      <AdviceNote tool={tool} lang={lang} t={t} />

      <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-2">
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
            <LanguageFit tool={tool} lang={lang} language={language} languageName={languageName} t={t} />
          ) : (
            <span>{tool.languages.length === 1 ? t.card_languageOne : fmt(t.card_languageCount, { n: tool.languages.length })}</span>
          )}
          <Link href={`${href}#languages`} className="block w-fit py-1 text-sm font-normal underline underline-offset-2">
            {t.card_seeLanguages}
          </Link>
        </Fact>
        <div>
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
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-tint px-3 py-1 text-sm font-semibold text-blue-dark">
          <CheckIcon className="size-4 shrink-0" />
          {fmt(t.card_connectsExisting, { names: existing.join(", ") })}
        </p>
      )}
      {!tool.selfServe && <p className="mt-3 text-sm font-medium text-brick-dark">{t.card_needsSales}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={href}
         
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-blue bg-blue px-5 py-2 font-semibold text-white no-underline tap hover:border-blue-dark hover:bg-blue-dark"
        >
          {t.card_details}
          <span className="sr-only">: {tool.name}</span>
        </Link>
        {actions}
      </div>
    </article>
  );
}
