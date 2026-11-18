import { ADVICE_TEXT, adviceKind, type AdviceLabels } from "@/lib/advice";
import type { Tool } from "@/lib/types";

/**
 * The "not a lawyer, not a tax preparer" warning, shown wherever a legal, tax, payroll or
 * HR tool appears. Has no hooks: renders on the server or the client.
 */
export function AdviceNote({ tool, lang, t, className = "mt-3" }: { tool: Pick<Tool, "categoryId" | "subcategoryId" | "publicResource">; lang: string; t: AdviceLabels; className?: string }) {
  const kind = adviceKind(tool);
  if (!kind) return null;
  return (
    <p className={`${className} rounded-lg bg-brick-tint px-3 py-2`}>
      <span className="font-semibold">{t.advice_title}:</span> {t[ADVICE_TEXT[kind]]}{" "}
      <a href={`/${lang}/free-help#free-legal-tax`} className="font-medium underline underline-offset-2">
        {t.advice_freeHelp}
      </a>
    </p>
  );
}
