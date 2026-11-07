"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { saveAll, toggleSaved, updateSaved, useUserData } from "@/lib/storage";
import type { Tool } from "@/lib/types";
import { fmt } from "@/lib/labels";

export function SaveButton({ tool, saveLabel, savedLabel }: { tool: Tool; saveLabel: string; savedLabel: string }) {
  const { data } = useUserData();
  const saved = Boolean(data.savedTools[tool.slug]);
  return (
    <Button variant="outline" aria-pressed={saved} onClick={() => toggleSaved(tool)}>
      {saved && <CheckIcon className="size-4" />}
      {saved ? savedLabel : saveLabel}
      <span className="sr-only">: {tool.name}</span>
    </Button>
  );
}

export function SaveAllButton({ tools, label, doneLabel }: { tools: Tool[]; label: string; doneLabel: string }) {
  const { data } = useUserData();
  const done = tools.every((t) => data.savedTools[t.slug]);
  return (
    <Button variant="accent" disabled={done} onClick={() => saveAll(tools)}>
      {done && <CheckIcon className="size-4" />}
      {done ? doneLabel : label}
    </Button>
  );
}

/** Rate how useful a tool is. Radio buttons work with a keyboard and a screen reader. */
export function MyRating({
  slug,
  t,
}: {
  slug: string;
  t: { legend: string; star: string; clear: string; inUse: string; note: string; help: string };
}) {
  const { data } = useUserData();
  const saved = data.savedTools[slug];
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="font-medium">{t.legend}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg border-2 border-line-strong bg-surface font-medium has-checked:border-green has-checked:bg-green has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name={`rating-${slug}`}
                className="sr-only"
                checked={saved?.myRating === n}
                onChange={() => updateSaved(slug, { myRating: n })}
              />
              <span aria-hidden="true">{n}</span>
              <span className="sr-only">{fmt(t.star, { n })}</span>
            </label>
          ))}
          {saved?.myRating ? (
            <Button variant="ghost" onClick={() => updateSaved(slug, { myRating: undefined })}>
              {t.clear}
            </Button>
          ) : null}
        </div>
      </fieldset>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 font-medium">
        <input
          type="checkbox"
          className="size-6 accent-[#0e5a45]"
          checked={saved?.inUse ?? false}
          onChange={(e) => updateSaved(slug, { inUse: e.target.checked })}
        />
        {t.inUse}
      </label>
      <div>
        <label htmlFor={`note-${slug}`} className="font-medium">
          {t.note}
        </label>
        <textarea
          id={`note-${slug}`}
          rows={2}
          maxLength={500}
          className="mt-1 block w-full rounded-lg border-2 border-line-strong bg-surface p-3"
          value={saved?.note ?? ""}
          onChange={(e) => updateSaved(slug, { note: e.target.value })}
        />
      </div>
      <p className="text-sm text-muted-ink">{t.help}</p>
    </div>
  );
}
