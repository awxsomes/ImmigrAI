"use client";

import { useEffect, useState } from "react";
import { ToolDetailSkeleton } from "@/components/site/skeletons";
import { useUserData } from "@/lib/storage";
import type { Tool } from "@/lib/types";
import { DetailActions, SaveButton, type ExtrasLabels } from "./detail-actions";
import { ToolDetail, type DetailLabels } from "./tool-detail";

/** A tool found by live search has no prebuilt page, so it loads from this device or the server. */
export function LiveToolPage({
  slug,
  lang,
  t,
  extras,
  labels,
}: {
  slug: string;
  lang: string;
  t: DetailLabels;
  extras: ExtrasLabels;
  labels: { loading: string; notFound: string; back: string };
}) {
  const { data, ready } = useUserData();
  const cached = data.toolCache[slug];
  const [fetched, setFetched] = useState<Tool | null>(null);
  const [state, setState] = useState<"loading" | "missing">("loading");
  const tool = cached ?? fetched;

  useEffect(() => {
    if (!ready || tool) return;
    const controller = new AbortController();
    fetch("/api/tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, lang }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("not found"))))
      .then((json: { tool: Tool | null }) => {
        if (json.tool) setFetched(json.tool);
        else setState("missing");
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("missing");
      });
    return () => controller.abort();
  }, [ready, tool, slug, lang]);

  if (tool) {
    return (
      <ToolDetail
        tool={tool}
        lang={lang}
        t={t}
        actions={<SaveButton tool={tool} saveLabel={extras.saveLabel} savedLabel={extras.savedLabel} />}
        sidebar={<DetailActions tool={tool} t={extras} />}
      />
    );
  }
  if (state === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p role="status" className="text-lg">
          {labels.notFound}
        </p>
      </div>
    );
  }
  return (
    <ToolDetailSkeleton
      status={
        <p role="status" className="mb-3 text-lg">
          {labels.loading}
        </p>
      }
    />
  );
}
