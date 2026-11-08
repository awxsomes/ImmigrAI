"use client";

import { useSyncExternalStore } from "react";
import { inferPriceKind } from "./scoring";
import type { BusinessProfile, Subscription, Tool, UserData } from "./types";

/**
 * Everything a visitor saves lives in their own browser. Nothing is sent to a server.
 * localStorage is only used after they say yes on the consent banner; until then the
 * app works from memory and forgets when the page closes.
 */

const KEY = "immigrai:v1";
const CONSENT_KEY = "immigrai:consent";

const EMPTY: UserData = { version: 1, language: "", savedTools: {}, business: { type: "", size: "" }, alreadyUse: [], toolCache: {} };

export type ConsentState = "unknown" | "yes" | "no";

interface Snapshot {
  data: UserData;
  consent: ConsentState;
  ready: boolean;
}

const SERVER_SNAPSHOT: Snapshot = { data: EMPTY, consent: "unknown", ready: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const stored = read(CONSENT_KEY);
  const consent: ConsentState = stored === "yes" ? "yes" : stored === "no" ? "no" : "unknown";
  let data = EMPTY;
  if (consent === "yes") {
    try {
      const parsed = JSON.parse(read(KEY) ?? "null") as UserData | null;
      if (parsed?.version === 1) data = upgrade({ ...EMPTY, ...parsed });
    } catch {
      /* corrupt data: start fresh */
    }
  }
  snapshot = { data, consent, ready: true };
}

/** Tools saved by an earlier version of the site are missing newer fields. */
function upgrade(data: UserData): UserData {
  const toolCache: Record<string, Tool> = {};
  for (const [slug, tool] of Object.entries(data.toolCache)) {
    toolCache[slug] = {
      ...tool,
      focus: tool.focus ?? "task",
      trades: tool.trades ?? [],
      ai: tool.ai ?? { level: "none", feature: "" },
      pricing: { ...tool.pricing, kind: tool.pricing.kind ?? inferPriceKind(tool.pricing.startingMonthlyUsd, tool.pricing.model) },
    };
  }
  return { ...data, toolCache };
}

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  if (snapshot.consent !== "yes") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot.data));
  } catch {
    /* storage full or blocked: keep working from memory */
  }
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook: re-renders when saved data or consent changes. */
export function useUserData() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return snapshot;
    },
    () => SERVER_SNAPSHOT,
  );
}

export function updateUserData(mutate: (data: UserData) => UserData) {
  load();
  snapshot = { ...snapshot, data: mutate(snapshot.data) };
  persist();
  emit();
}

export function setConsent(accept: boolean) {
  load();
  try {
    window.localStorage.setItem(CONSENT_KEY, accept ? "yes" : "no");
    if (!accept) window.localStorage.removeItem(KEY);
  } catch {
    /* blocked: the choice lasts for this page only */
  }
  snapshot = { ...snapshot, consent: accept ? "yes" : "no" };
  persist();
  emit();
}

/** Ask again: used by "Privacy choices" in the footer. */
export function reopenConsent() {
  load();
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* blocked */
  }
  snapshot = { ...snapshot, consent: "unknown" };
  emit();
}

/** Delete everything this site stored on this device. */
export function deleteAllData() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* blocked */
  }
  snapshot = { data: EMPTY, consent: "unknown", ready: true };
  emit();
}

export function exportUserData() {
  load();
  return JSON.stringify({ ...snapshot.data, toolCache: undefined }, null, 2);
}

/** Keep discovered tools so their pages open instantly. Bounded so storage cannot fill up. */
export function cacheTools(tools: Tool[]) {
  updateUserData((d) => {
    const toolCache = { ...d.toolCache };
    for (const tool of tools) toolCache[tool.slug] = tool;
    const slugs = Object.keys(toolCache);
    for (const slug of slugs.slice(0, Math.max(0, slugs.length - 100))) {
      if (!d.savedTools[slug]) delete toolCache[slug];
    }
    return { ...d, toolCache };
  });
}

export function toggleSaved(tool: Tool) {
  updateUserData((d) => {
    const savedTools = { ...d.savedTools };
    if (savedTools[tool.slug]) delete savedTools[tool.slug];
    else savedTools[tool.slug] = { slug: tool.slug, addedAt: new Date().toISOString(), inUse: false };
    return { ...d, savedTools, toolCache: { ...d.toolCache, [tool.slug]: tool } };
  });
}

export function saveAll(tools: Tool[]) {
  updateUserData((d) => {
    const savedTools = { ...d.savedTools };
    const toolCache = { ...d.toolCache };
    for (const tool of tools) {
      savedTools[tool.slug] ??= { slug: tool.slug, addedAt: new Date().toISOString(), inUse: false };
      toolCache[tool.slug] = tool;
    }
    return { ...d, savedTools, toolCache };
  });
}

export function updateSaved(slug: string, change: { myRating?: number; note?: string; inUse?: boolean; subscription?: Subscription }) {
  updateUserData((d) => {
    const existing = d.savedTools[slug] ?? { slug, addedAt: new Date().toISOString(), inUse: false };
    return { ...d, savedTools: { ...d.savedTools, [slug]: { ...existing, ...change } } };
  });
}

export function setBusiness(change: Partial<BusinessProfile>) {
  updateUserData((d) => ({ ...d, business: { ...d.business, ...change } }));
}

export function setToolLanguage(language: string) {
  updateUserData((d) => ({ ...d, language }));
}

export function setAlreadyUse(alreadyUse: string[]) {
  updateUserData((d) => ({ ...d, alreadyUse }));
}
