"use client";

import { useOffline } from "next/offline";
import { createContext, useContext, type ReactNode } from "react";

export interface LoadingLabels {
  loading: string;
  offline: string;
}

/**
 * Loading screens take no props, so the root layout hands them their words in the page's
 * language through this context.
 */
const Labels = createContext<LoadingLabels>({ loading: "Loading...", offline: "No connection. This page will load when you are back online." });

export function LoadingLabelsProvider({ labels, children }: { labels: LoadingLabels; children: ReactNode }) {
  return <Labels value={labels}>{children}</Labels>;
}

/**
 * Says what is happening while a page loads. Screen readers hear "Loading" once. When the wait
 * is because the connection dropped, everyone sees it, since a page that never arrives would
 * otherwise look broken. Next.js finishes loading the page by itself once the phone is back online.
 */
export function LoadingStatus() {
  const t = useContext(Labels);
  const offline = useOffline();
  return (
    <p role="status" className={offline ? "mb-4 rounded-lg bg-amber-tint px-4 py-3 font-medium" : "sr-only"}>
      {offline ? t.offline : t.loading}
    </p>
  );
}
