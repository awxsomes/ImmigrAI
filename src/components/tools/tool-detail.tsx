import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon, CheckIcon, StarIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { aiLabel, displayLanguage, nextPlanText, priceConfirmation, priceText } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { ADOPT_KEYS, fmt, PROMPT_KEYS, type AdoptionLabels, type PromptLabels } from "@/lib/labels";
import { AdoptionGuide, TeamEstimate } from "./adoption-guide";
import { PromptHelper } from "./prompt-helper";
import { RatingText } from "./tool-card";
import { envLabel, ENV_WEIGHTS, focusScore, OVERALL_WEIGHTS } from "@/lib/scoring";
import type { Tool } from "@/lib/types";

/** Every word the tool page uses, so the same page can render on the server or in the browser. */
export const DETAIL_KEYS = [
  "card_cost", "card_rating", "card_footprint", "card_language", "card_connects", "card_score", "card_scoreOf",
  "card_noRating", "card_publicResource", "card_priceUnconfirmed", "card_ratingLine", "card_fromSites", "card_fromSite",
  "card_reviewCount", "card_new", "card_noConnections", "card_more", "card_worksInLang", "card_notConfirmedLang",
  "card_languageCount", "card_languageOne", "card_seeLanguages", "card_connectsExisting", "card_details", "card_free",
  "card_freePlan", "card_noMonthlyFee", "card_youSetBudget", "card_perReturn",
  "card_aiCore", "card_aiFeature", "card_aiNone", "card_aiDoes", "card_smallTool", "tool_smallNote",
  "card_fees", "card_needsSales",
  "price_amount", "price_amountPerson", "price_amountLocation", "price_amountUse", "price_plan", "price_next", "price_estimate", "price_plansUnconfirmed", "price_paywall", "price_trial",
  "tool_plansTitle", "tool_planName", "tool_planPrice", "tool_planIncludes", "per_business", "per_person", "per_location", "per_use",
  "card_builtFor", "card_generalNote", "trade_restaurant", "trade_salon", "trade_retail", "trade_trades", "trade_cleaning",
  ...ADOPT_KEYS, ...PROMPT_KEYS,
  "env_light", "env_moderate", "env_heavy",
  "wl_none", "wl_background-ml", "wl_optional-genai", "wl_translation", "wl_llm-every-reply", "wl_speech", "wl_image-video", "wl_voice-agent",
  "wld_none", "wld_background-ml", "wld_optional-genai", "wld_translation", "wld_llm-every-reply", "wld_speech", "wld_image-video", "wld_voice-agent",
  "tool_helps", "tool_cost", "tool_costNote", "tool_env", "tool_envNote", "tool_envEnergy", "tool_envWater", "tool_envCarbon", "tool_envCompute",
  "tool_reviews", "tool_score", "tool_languagesAll", "tool_worksWith", "tool_start", "tool_caution", "tool_foundLive",
  "tool_whatItUses", "tool_ratingBySite", "tool_site", "tool_stars", "tool_reviewsCol", "tool_notShown", "tool_noReviewsYet", "tool_publicResourceNote",
  "tool_reviewCheck", "tool_priceSource", "tool_languageSource", "tool_statedTotal", "tool_languagesNote", "tool_perTask", "tool_wattHours", "tool_waterMl",
  "tool_co2", "tool_howWeCalc", "tool_scoreParts", "tool_scoreNoReviews", "tool_startAlone", "tool_setupAbout", "tool_runsOn", "tool_nothingConfirmed",
  "tool_checked", "tool_openSite", "tool_leaving", "tool_estimate",
  "score_focus", "score_reviews", "score_ease", "score_cost", "score_languages", "score_connections", "score_footprint",
] as const;

export type DetailLabels = Pick<Dict, (typeof DETAIL_KEYS)[number]>;

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 border-t-2 border-line pt-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Meter({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3">
      <dt>{label}</dt>
      <dd className="font-semibold">{display}</dd>
      <dd className="col-span-2 mt-1 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-green" style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%` }} />
      </dd>
    </div>
  );
}

type ScoreLabels = Pick<Dict, "score_focus" | "score_reviews" | "score_ease" | "score_cost" | "score_languages" | "score_connections" | "score_footprint">;

/** The parts of a tool's score, each with its weight. Used on the tool page and the home page example. */
export function ScoreMeters({ tool, t }: { tool: Tool; t: ScoreLabels }) {
  const w = OVERALL_WEIGHTS;
  const { rating } = tool.reviews;
  const env = tool.environmental;
  const pct = (weight: number) => Math.round(weight * 100);
  // A tool saved on this device by an earlier version has no focus score yet.
  const focus = tool.scores.focus ?? focusScore(tool.focus ?? "task");
  return (
    <dl className="space-y-3">
      <Meter label={`${t.score_focus} (${pct(w.focus)}%)`} value={focus} max={5} display={`${focus} / 5`} />
      {tool.scores.overallIncludesReviews && rating !== null && (
        <Meter label={`${t.score_reviews} (${pct(w.reviews)}%)`} value={rating} max={5} display={`${rating} / 5`} />
      )}
      <Meter label={`${t.score_ease} (${pct(w.easeOfUse)}%)`} value={tool.scores.easeOfUse} max={5} display={`${tool.scores.easeOfUse} / 5`} />
      <Meter label={`${t.score_cost} (${pct(w.affordability)}%)`} value={tool.scores.affordability} max={5} display={`${tool.scores.affordability} / 5`} />
      <Meter label={`${t.score_languages} (${pct(w.languageSupport)}%)`} value={tool.scores.languageSupport} max={5} display={`${tool.scores.languageSupport} / 5`} />
      <Meter label={`${t.score_connections} (${pct(w.compatibility)}%)`} value={tool.scores.compatibility} max={5} display={`${tool.scores.compatibility} / 5`} />
      <Meter label={`${t.score_footprint} (${pct(w.environment)}%)`} value={env.score} max={100} display={`${env.score} / 100`} />
    </dl>
  );
}

const OUT = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

/** Client components get only the words they use, so the page stays light. */
function only<K extends keyof DetailLabels>(t: DetailLabels, keys: readonly K[]) {
  return Object.fromEntries(keys.map((key) => [key, t[key]])) as Pick<DetailLabels, K>;
}

function PlanTable({ tool, t }: { tool: Tool; t: DetailLabels }) {
  const plans = tool.pricing.plans ?? [];
  if (plans.length === 0) return null;
  return (
    <table className="mt-3 w-full text-left">
      <caption className="mb-1 text-left font-medium">{t.tool_plansTitle}</caption>
      <thead>
        <tr className="border-b-2 border-line-strong">
          <th scope="col" className="py-2 pr-3 font-semibold">{t.tool_planName}</th>
          <th scope="col" className="py-2 pr-3 font-semibold">{t.tool_planPrice}</th>
          <th scope="col" className="py-2 font-semibold">{t.tool_planIncludes}</th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan) => (
          <tr key={plan.name} className="border-b border-line align-top">
            <td className="py-2 pr-3 font-medium">{plan.name}</td>
            <td className="py-2 pr-3">
              {plan.monthlyUsd === 0 ? t.card_free : fmt(t.price_amount, { n: plan.monthlyUsd })}
              {plan.monthlyUsd > 0 && <span className="block text-sm text-muted-ink">{t[`per_${plan.per}`]}</span>}
            </td>
            <td className="py-2">{plan.includes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ToolDetail({ tool, lang, t, actions, sidebar }: { tool: Tool; lang: string; t: DetailLabels; actions?: ReactNode; sidebar?: ReactNode }) {
  const env = tool.environmental;
  const { rating, sources, reviewCount, summary } = tool.reviews;
  const includesReviews = tool.scores.overallIncludesReviews;
  const languages = [...tool.languages].map((l) => displayLanguage(l, lang)).sort((a, b) => a.localeCompare(b, lang));
  const next = nextPlanText(tool, t);
  const confirmation = priceConfirmation(tool, t);
  const hasPlans = Boolean(tool.pricing.plans?.length);
  const adoptLabels: AdoptionLabels = only(t, ADOPT_KEYS);
  const promptLabels: PromptLabels = only(t, PROMPT_KEYS);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold">{tool.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={tool.ai.level === "core" ? "warm" : tool.ai.level === "feature" ? "default" : "outline"}>{aiLabel(tool.ai.level, t)}</Badge>
            {tool.source === "live" && <Badge variant="warm">{t.tool_foundLive}</Badge>}
            {tool.trades?.map((trade) => (
              <Badge key={trade} variant="warm">
                {fmt(t.card_builtFor, { trade: t[`trade_${trade}`] })}
              </Badge>
            ))}
          </p>
          <p className="mt-3 text-lg">{tool.summary}</p>
          {tool.ai.level !== "none" && tool.ai.feature && (
            <p className="mt-3 rounded-lg bg-green-tint p-3">
              <span className="font-semibold">{t.card_aiDoes}:</span> {tool.ai.feature}
            </p>
          )}
          {tool.focus === "general" && <p className="mt-3 rounded-lg bg-marigold-tint p-3 font-medium">{t.card_generalNote}</p>}
        </div>
        <div role="img" aria-label={fmt(t.card_scoreOf, { n: tool.scores.overall })} className="flex size-24 flex-col items-center justify-center rounded-xl bg-green text-white">
          <span className="text-4xl leading-none font-bold">{tool.scores.overall}</span>
          <span className="mt-1 text-sm">{t.card_score}</span>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-sm text-muted-ink">{t.card_cost}</dt>
          <dd className="font-semibold">{priceText(tool, t)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-ink">{t.card_rating}</dt>
          <dd className="font-semibold">
            <RatingText tool={tool} t={t} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-ink">{t.card_language}</dt>
          <dd className="font-semibold">
            {tool.languages.length === 1 ? t.card_languageOne : fmt(t.card_languageCount, { n: tool.languages.length })}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-ink">{t.card_footprint}</dt>
          <dd className="font-semibold">
            {env.score}/100, {t[`env_${envLabel(env.score)}`]}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {tool.website && (
          <a href={tool.website} {...OUT} className={buttonVariants({ variant: "default" })}>
            {t.tool_openSite}
            <ArrowIcon className="size-4" />
            <span className="sr-only"> ({t.tool_leaving})</span>
          </a>
        )}
        {actions}
      </div>

      {!tool.publicResource && <AdoptionGuide tool={tool} lang={lang} t={adoptLabels} />}
      {tool.source === "catalog" && tool.ai.level !== "none" && (
        <div className="mt-4 rounded-xl border-2 border-line bg-surface p-5">
          <PromptHelper slug={tool.slug} problem="" lang={lang} t={promptLabels} />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Section title={t.tool_helps}>
            <ul className="space-y-2">
              {tool.helpsWith.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon className="mt-1 size-4 shrink-0 text-green" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t.tool_cost}>
            <p className="text-xl font-semibold">{priceText(tool, t)}</p>
            {next && <p className="text-muted-ink">{next}</p>}
            <TeamEstimate tool={tool} template={t.price_estimate} />
            {confirmation && <p className="text-sm text-muted-ink">{confirmation}</p>}
            {!hasPlans && <p className="mt-1">{tool.pricing.note}</p>}
            <PlanTable tool={tool} t={t} />
            {tool.guide?.trial && (
              <p className="mt-3">
                <span className="font-semibold">{t.price_trial}:</span> {tool.guide.trial}
              </p>
            )}
            {tool.guide?.paywall && (
              <p className="mt-2">
                <span className="font-semibold">{t.price_paywall}:</span> {tool.guide.paywall}
              </p>
            )}
            {tool.pricing.extraFees && (
              <p className="mt-2">
                <span className="font-semibold">{t.card_fees}:</span> {tool.pricing.extraFees}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-ink">{t.tool_costNote}</p>
            {tool.pricing.sourceUrl && (
              <a href={tool.pricing.sourceUrl} {...OUT} className="mt-1 inline-block py-1 text-sm underline underline-offset-2">
                {t.tool_priceSource}
                <span className="sr-only"> ({t.tool_leaving})</span>
              </a>
            )}
          </Section>

          <Section title={t.tool_reviews}>
            {tool.publicResource ? (
              <p>{t.tool_publicResourceNote}</p>
            ) : rating === null ? (
              <>
                <p>{t.tool_noReviewsYet}</p>
                <p className="mt-2 rounded-lg bg-marigold-tint p-3">{t.tool_smallNote}</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-xl font-semibold">
                  <StarIcon className="size-5 text-[#a97a0c]" />
                  {fmt(t.card_ratingLine, { rating })}
                </p>
                <p className="text-sm text-muted-ink">
                  {sources.length === 1 ? t.card_fromSite : fmt(t.card_fromSites, { n: sources.length })}
                  {reviewCount > 0 ? `, ${fmt(t.card_reviewCount, { n: reviewCount.toLocaleString() })}` : ""}
                </p>
                {summary && <p className="mt-3">{summary}</p>}
                <table className="mt-4 w-full text-left">
                  <caption className="mb-1 text-left font-medium">{t.tool_ratingBySite}</caption>
                  <thead>
                    <tr className="border-b-2 border-line-strong">
                      <th scope="col" className="py-2 pr-3 font-semibold">{t.tool_site}</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">{t.tool_stars}</th>
                      <th scope="col" className="py-2 font-semibold">{t.tool_reviewsCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((source) => (
                      <tr key={source.url} className="border-b border-line">
                        <td className="py-2 pr-3">
                          <a href={source.url} {...OUT} className="underline underline-offset-2">
                            {source.site}
                            <span className="sr-only"> ({t.tool_leaving})</span>
                          </a>
                        </td>
                        <td className="py-2 pr-3">{source.rating}</td>
                        <td className="py-2">{source.count ? source.count.toLocaleString() : t.tool_notShown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-sm text-muted-ink">{t.tool_reviewCheck}</p>
              </>
            )}
          </Section>

          {tool.publicResource && (
            <Section title={t.tool_start}>
              <p>{tool.howToStart}</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>{fmt(t.tool_setupAbout, { n: tool.setupMinutes })} ({t.tool_estimate})</li>
                <li>{tool.selfServe ? t.tool_startAlone : t.card_needsSales}</li>
                <li>
                  {t.tool_runsOn}: {tool.platforms.map((p) => t[`platform_${p}` as keyof DetailLabels] ?? p).join(", ")}
                </li>
              </ul>
              {tool.caution && (
                <p className="mt-3 rounded-lg bg-marigold-tint p-3">
                  <span className="font-semibold">{t.tool_caution}:</span> {tool.caution}
                </p>
              )}
            </Section>
          )}
        </div>

        <div className="space-y-8">
          <Section id="languages" title={t.tool_languagesAll}>
            <p className="font-medium">{tool.languages.length === 1 ? t.card_languageOne : fmt(t.card_languageCount, { n: tool.languages.length })}</p>
            {tool.languagesTotal && <p className="text-sm">{fmt(t.tool_statedTotal, { total: tool.languagesTotal })}</p>}
            {languages.length > 12 ? (
              <details className="mt-2">
                <summary className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">{t.card_seeLanguages}</summary>
                <ul className="mt-2 columns-2 gap-4 sm:columns-3">
                  {languages.map((language) => (
                    <li key={language}>{language}</li>
                  ))}
                </ul>
              </details>
            ) : (
              <ul className="mt-2 columns-2 gap-4 sm:columns-3">
                {languages.map((language) => (
                  <li key={language}>{language}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-muted-ink">{t.tool_languagesNote}</p>
            {tool.languagesSourceUrl && (
              <a href={tool.languagesSourceUrl} {...OUT} className="mt-1 inline-block py-1 text-sm underline underline-offset-2">
                {t.tool_languageSource}
                <span className="sr-only"> ({t.tool_leaving})</span>
              </a>
            )}
          </Section>

          <Section title={t.tool_worksWith}>
            {tool.integrations.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {tool.integrations.map((name) => (
                  <li key={name}>
                    <Badge variant="outline">{name}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.tool_nothingConfirmed}</p>
            )}
          </Section>

          <Section title={t.tool_env}>
            <p className="text-xl font-semibold">
              {env.score}/100, {t[`env_${envLabel(env.score)}`]}
            </p>
            <p className="mt-1">
              <span className="font-medium">{t.tool_whatItUses}:</span> {t[`wl_${env.workload}`]}. {t[`wld_${env.workload}`]}
            </p>
            <dl className="mt-3 space-y-3">
              <Meter label={`${t.tool_envEnergy} (${Math.round(ENV_WEIGHTS.energy * 100)}%)`} value={env.energy} max={100} display={String(env.energy)} />
              <Meter label={`${t.tool_envWater} (${Math.round(ENV_WEIGHTS.water * 100)}%)`} value={env.water} max={100} display={String(env.water)} />
              <Meter label={`${t.tool_envCarbon} (${Math.round(ENV_WEIGHTS.carbon * 100)}%)`} value={env.carbon} max={100} display={String(env.carbon)} />
              <Meter label={`${t.tool_envCompute} (${Math.round(ENV_WEIGHTS.compute * 100)}%)`} value={env.compute} max={100} display={String(env.compute)} />
            </dl>
            <p className="mt-3 font-medium">{t.tool_perTask}</p>
            <ul className="text-sm">
              <li>{fmt(t.tool_wattHours, { n: env.perTask.wattHours })}</li>
              <li>{fmt(t.tool_waterMl, { n: env.perTask.waterMl })}</li>
              <li>{fmt(t.tool_co2, { n: env.perTask.co2Grams })}</li>
            </ul>
            <p className="mt-2 text-sm text-muted-ink">{t.tool_envNote}</p>
            <Link href={`/${lang}/methodology`} prefetch={false} className="mt-1 inline-block py-1 text-sm underline underline-offset-2">
              {t.tool_howWeCalc}
            </Link>
          </Section>

          <Section title={t.tool_scoreParts}>
            <ScoreMeters tool={tool} t={t} />
            {!includesReviews && <p className="mt-3 text-sm">{t.tool_scoreNoReviews}</p>}
            {tool.lastChecked && <p className="mt-3 text-sm text-muted-ink">{fmt(t.tool_checked, { date: tool.lastChecked })}</p>}
          </Section>
        </div>
      </div>
      {sidebar}
    </div>
  );
}

