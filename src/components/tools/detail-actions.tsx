"use client";

import { compatText } from "@/lib/format";
import type { CompatLabels } from "@/lib/labels";
import { compatibility, connectsWithExisting } from "@/lib/scoring";
import { useUserData } from "@/lib/storage";
import type { Tool } from "@/lib/types";
import { CheckIcon } from "@/components/icons";
import { fmt } from "@/lib/labels";
import { MyRating, SaveButton } from "./tool-actions";

export interface ExtrasLabels extends CompatLabels {
  saveLabel: string;
  savedLabel: string;
  compatTitle: string;
  compatNone: string;
  yoursTitle: string;
  saveToRate: string;
  connectsExisting: string;
  rating: { legend: string; star: string; clear: string; inUse: string; note: string; help: string };
}

/** The parts of a tool's page that depend on what this visitor has saved. */
export function DetailActions({ tool, t }: { tool: Tool; t: ExtrasLabels }) {
  const { data } = useUserData();
  const saved = Boolean(data.savedTools[tool.slug]);
  const existing = connectsWithExisting(tool, data.alreadyUse);
  const others = Object.keys(data.savedTools)
    .filter((slug) => slug !== tool.slug)
    .flatMap((slug) => (data.toolCache[slug] ? [data.toolCache[slug]] : []));

  return (
    <div className="mt-8 space-y-4">
      {existing.length > 0 && (
        <p className="flex w-fit items-center gap-1.5 rounded-md bg-green-tint px-2 py-1 text-sm font-medium text-green-dark">
          <CheckIcon className="size-4 shrink-0" />
          {fmt(t.connectsExisting, { names: existing.join(", ") })}
        </p>
      )}
      <div className="max-w-3xl rounded-xl border-2 border-line bg-surface p-5">
        <h2 className="text-xl font-semibold">{t.yoursTitle}</h2>
        {saved ? (
          <div className="mt-3">
            <MyRating slug={tool.slug} t={t.rating} />
          </div>
        ) : (
          <div className="mt-3">
            <p className="mb-3">{t.saveToRate}</p>
            <SaveButton tool={tool} saveLabel={t.saveLabel} savedLabel={t.savedLabel} />
          </div>
        )}
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="font-semibold">{t.compatTitle}</h3>
          {others.length === 0 ? (
            <p className="mt-1 text-sm text-muted-ink">{t.compatNone}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {others.map((other) => {
                const text = compatText(compatibility(tool, other), t);
                return (
                  <li key={other.slug}>
                    <span className="font-medium">{other.name}</span>: {text.label}
                    <span className="block text-sm text-muted-ink">{text.detail}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export { SaveButton };
