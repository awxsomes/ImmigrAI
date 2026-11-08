"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PromptLabels } from "@/lib/labels";
import { useUserData } from "@/lib/storage";

interface WrittenPrompt {
  title: string;
  text: string;
}

function CopyButton({ text, t }: { text: string; t: PromptLabels }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" className="min-h-11" onClick={() => void copy()}>
        {state === "copied" ? t.prompts_copied : t.prompts_copy}
      </Button>
      {state === "failed" && <p className="text-sm text-muted-ink">{t.prompts_copyFailed}</p>}
    </div>
  );
}

/**
 * Many AI tools still leave the owner staring at an empty box. One button writes
 * ready-to-paste prompts for this tool and problem, in the owner's own language.
 */
export function PromptHelper({ slug, problem, lang, t }: { slug: string; problem: string; lang: string; t: PromptLabels }) {
  const { data } = useUserData();
  const [state, setState] = useState<"idle" | "loading" | "failed" | "done">("idle");
  const [prompts, setPrompts] = useState<WrittenPrompt[]>([]);

  async function write() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, problem, type: data.business?.type ?? "", lang }),
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { prompts: WrittenPrompt[] };
      if (json.prompts.length === 0) throw new Error("empty");
      setPrompts(json.prompts);
      setState("done");
    } catch {
      setState("failed");
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold">{t.prompts_title}</h3>
      <p className="mt-1">{t.prompts_intro}</p>
      {state !== "done" && (
        <Button variant="outline" className="mt-3" aria-disabled={state === "loading" || undefined} onClick={() => void write()}>
          {state === "loading" ? t.prompts_loading : t.prompts_button}
        </Button>
      )}
      <p role="status" className={state === "failed" ? "mt-2 font-medium text-[#7a2a14]" : "sr-only"}>
        {state === "failed" ? t.prompts_failed : state === "loading" ? t.prompts_loading : ""}
      </p>
      {prompts.length > 0 && (
        <ol className="mt-4 space-y-4">
          {prompts.map((prompt) => (
            <li key={prompt.title} className="rounded-lg bg-green-tint p-4">
              <h4 className="font-semibold">{prompt.title}</h4>
              <p className="mt-1 whitespace-pre-wrap">{prompt.text}</p>
              <CopyButton text={prompt.text} t={t} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
