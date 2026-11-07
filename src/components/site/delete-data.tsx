"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteAllData } from "@/lib/storage";

/** Delete with one clear confirmation on the page, and a result the screen reader announces. */
export function DeleteDataControl({ t }: { t: { button: string; question: string; confirm: string; cancel: string; done: string } }) {
  const [state, setState] = useState<"idle" | "confirm" | "done">("idle");

  if (state === "confirm") {
    return (
      <div role="alertdialog" aria-label={t.button} className="w-full rounded-lg border-2 border-brick bg-brick-tint p-4">
        <p className="font-medium">{t.question}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="destructive"
            autoFocus
            onClick={() => {
              deleteAllData();
              setState("done");
            }}
          >
            {t.confirm}
          </Button>
          <Button variant="outline" onClick={() => setState("idle")}>
            {t.cancel}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <Button variant="destructive" onClick={() => setState("confirm")}>
        {t.button}
      </Button>
      {state === "done" && (
        <p role="status" className="mt-2 font-medium">
          {t.done}
        </p>
      )}
    </div>
  );
}
