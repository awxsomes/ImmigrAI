import type { ReactNode } from "react";
import { CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { fmt, type MatchLabels } from "@/lib/labels";
import type { Adoption, MatchedTool } from "@/lib/match-types";
import { ToolCard } from "./tool-card";

const OUT = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

function AdoptionLine({ item, t }: { item: Adoption; t: MatchLabels }) {
  const text = {
    direct: t.match_direct,
    bridge: t.match_bridge,
    import: t.match_import,
    unknown: t.match_unknown,
  }[item.level];
  const confirmed = item.level === "direct" || item.level === "bridge";
  return (
    <li className="flex gap-2">
      {confirmed ? <CheckIcon className="mt-1 size-4 shrink-0 text-green-dark" /> : <span aria-hidden="true" className="w-4 shrink-0 text-center">&bull;</span>}
      <span>
        {fmt(text, { system: item.system })}
        {item.evidenceUrl && (
          <>
            {" "}
            <a href={item.evidenceUrl} {...OUT} className="inline-block py-1 text-sm underline underline-offset-2">
              {t.match_proof}
              <span className="sr-only"> ({item.system})</span>
            </a>
          </>
        )}
      </span>
    </li>
  );
}

/** One matched tool: why it fits this owner and how it fits what they already run, above its usual facts. */
export function MatchCard({
  match,
  hasTrade,
  lang,
  t,
  language,
  alreadyUse,
  actions,
}: {
  match: MatchedTool;
  hasTrade: boolean;
  lang: string;
  t: MatchLabels;
  language?: string;
  alreadyUse?: string[];
  actions?: ReactNode;
}) {
  const label = match.fit === "close" ? t.match_fitClose : hasTrade ? t.match_fitExact : t.match_fitJob;
  return (
    <div className="overflow-hidden rounded-xl border-2 border-green">
      <div className="space-y-3 bg-green-tint p-5">
        <Badge variant={match.fit === "exact" ? "warm" : "outline"}>{label}</Badge>
        <div>
          <p className="font-semibold">{fmt(t.match_why, { name: match.tool.name })}</p>
          <p className="mt-1">{match.why}</p>
        </div>
        {match.useThis.length > 0 && (
          <div>
            <p className="font-semibold">{t.match_useThis}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {match.useThis.map((part) => (
                <li key={part}>{part}</li>
              ))}
            </ul>
          </div>
        )}
        {match.adoption.length > 0 && (
          <div>
            <p className="font-semibold">{t.match_fitsTitle}</p>
            <ul className="mt-1 space-y-1">
              {match.adoption.map((item) => (
                <AdoptionLine key={item.system} item={item} t={t} />
              ))}
            </ul>
          </div>
        )}
      </div>
      <ToolCard tool={match.tool} lang={lang} t={t} language={language} alreadyUse={alreadyUse} actions={actions} />
    </div>
  );
}
