import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LoadingStatus } from "./loading-status";

/**
 * Loading screens in the shape of the page on its way, so a tap shows the next screen at once
 * and the content fills in where the gray shapes are. Each one copies its page's widths and
 * spacing, so nothing jumps when the real content arrives.
 */

/** `status` replaces the plain "Loading" with what the page is waiting for, when there is more to say. */
function Screen({ className, status, children }: { className?: string; status?: ReactNode; children: ReactNode }) {
  return (
    <div aria-busy="true" className={cn("mx-auto px-4 py-6", className)}>
      {status ?? <LoadingStatus />}
      {children}
    </div>
  );
}

/** Lines of text, the last one shorter, like the end of a paragraph. */
export function TextLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-4", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

function Crumbs() {
  return <Skeleton className="h-4 w-48" />;
}

function Pills({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn("h-11 rounded-full", ["w-20", "w-32", "w-28", "w-36", "w-24", "w-28"][index % 6])} />
      ))}
    </div>
  );
}

/** One tool card: name, facts, badges and score, summary, the four facts and the buttons. */
export function ToolCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="size-16 shrink-0 rounded-lg" />
      </div>
      <TextLines lines={2} className="mt-4" />
      <div className="mt-5 grid gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/** The results list on its own, for parts of a page that load after the heading. */
export function ToolListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** A category's results: where you are, the need, its sub-needs, the filters and the tools. */
export function ResultsSkeleton() {
  return (
    <Screen className="max-w-6xl">
      <Crumbs />
      <Skeleton className="mt-4 h-10 w-2/3 sm:h-12" />
      <Pills count={6} className="mt-6" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
        <div className="hidden space-y-5 rounded-lg border border-line p-5 lg:block">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-11 w-full rounded-lg sm:w-60" />
          </div>
          <div className="mt-4">
            <ToolListSkeleton />
          </div>
        </div>
      </div>
    </Screen>
  );
}

/** A tool's page: name and summary beside the score box, then the sections below. */
export function ToolDetailSkeleton({ status }: { status?: ReactNode }) {
  return (
    <Screen className="max-w-6xl" status={status}>
      <Crumbs />
      <div className="mt-3 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <Skeleton className="h-11 w-2/3 sm:h-14" />
          <Skeleton className="mt-4 h-5 w-1/2" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <TextLines lines={3} className="mt-5 max-w-3xl" />
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-12 w-40 rounded-lg" />
            <Skeleton className="h-12 w-28 rounded-lg" />
          </div>
        </div>
        <div className="rounded-lg border border-line p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-6">
        {[0, 1].map((index) => (
          <div key={index} className="rounded-lg border border-line p-5 sm:p-6">
            <Skeleton className="h-7 w-48" />
            <TextLines lines={4} className="mt-4" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

function KitCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-line p-5">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <div className="mt-5 space-y-2 border-t border-line pt-3">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  );
}

/** The list of tool kits. */
export function KitsSkeleton() {
  return (
    <Screen className="max-w-6xl py-8">
      <Skeleton className="h-10 w-3/5" />
      <Skeleton className="mt-3 h-5 w-4/5 max-w-3xl" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <KitCardSkeleton key={index} />
        ))}
      </div>
    </Screen>
  );
}

/** One kit: its name and facts, then the tools in it. */
export function KitSkeleton() {
  return (
    <Screen className="max-w-6xl">
      <Crumbs />
      <Skeleton className="mt-4 h-10 w-1/2 sm:h-12" />
      <Skeleton className="mt-3 h-5 w-3/4 max-w-3xl" />
      <div className="mt-5 grid max-w-5xl gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ToolCardSkeleton />
        <ToolCardSkeleton />
      </div>
    </Screen>
  );
}

/** A page of plain text, such as the privacy policy or free help. */
export function DocSkeleton() {
  return (
    <Screen className="max-w-3xl py-8">
      <Skeleton className="h-10 w-2/3" />
      <TextLines lines={2} className="mt-4" />
      {[0, 1, 2].map((index) => (
        <div key={index} className="mt-8">
          <Skeleton className="h-6 w-1/2" />
          <TextLines lines={4} className="mt-3" />
        </div>
      ))}
    </Screen>
  );
}

/** A heading over a short form, such as the checkup. */
export function FormSkeleton() {
  return (
    <Screen className="max-w-3xl py-8">
      <Skeleton className="h-10 w-3/5" />
      <TextLines lines={2} className="mt-3 mb-6" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-14 w-52 rounded-lg" />
    </Screen>
  );
}

/** My tools: the heading, the saving note and the saved list. */
export function ListSkeleton() {
  return (
    <Screen className="max-w-4xl py-8">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-lg border border-line p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

/** Tools side by side. */
export function CompareSkeleton() {
  return (
    <Screen className="max-w-6xl py-8">
      <Skeleton className="h-10 w-1/2" />
      <div className="mt-6 overflow-hidden rounded-lg border border-line">
        {Array.from({ length: 7 }, (_, row) => (
          <div key={row} className="grid grid-cols-[8rem_1fr_1fr] gap-4 border-b border-line p-3 last:border-b-0 sm:grid-cols-[12rem_1fr_1fr_1fr]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className={row === 0 ? "h-6 w-3/4" : "h-4 w-2/3"} />
            <Skeleton className={row === 0 ? "h-6 w-3/4" : "h-4 w-1/2"} />
            <Skeleton className={cn("hidden sm:block", row === 0 ? "h-6 w-3/4" : "h-4 w-3/5")} />
          </div>
        ))}
      </div>
    </Screen>
  );
}

/** The home page: the blue welcome band with its search box, then the areas and common needs. */
export function HomeSkeleton() {
  return (
    <div aria-busy="true">
      <div className="bg-blue-tint">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:pt-14 sm:pb-16">
          <LoadingStatus />
          <Skeleton className="h-9 w-4/5 max-w-3xl bg-white sm:h-16" />
          <Skeleton className="mt-3 h-9 w-3/5 max-w-2xl bg-white sm:h-16" />
          <Skeleton className="mt-7 h-5 w-64 bg-white" />
          <Skeleton className="mt-3 h-16 w-full max-w-2xl rounded-full bg-white" />
          <Pills count={4} className="mt-3 max-w-2xl" />
        </div>
      </div>
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-6 sm:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-6">
        <Skeleton className="h-8 w-1/2" />
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
