/**
 * Measures the need-first matcher against hand-labelled answers in docs/eval/needs.json, and
 * writes the run to docs/eval/runs/ so every run can be committed and compared.
 *
 * No AI grades anything here. Each tool the matcher returns is compared with the labels:
 *   acceptable    a person listed it as doing this owner's job
 *   not the job   a person listed it as clearly wrong for this owner
 *   unlabelled    in neither list; shown in the report so a person can label it
 *
 * Reported:
 *   precision@5          acceptable tools in the top 5, divided by 5. Unlabelled and empty slots count against it.
 *   labelled precision@5 acceptable divided by the labelled tools in the top 5, ignoring unlabelled ones.
 *   not-the-job rate     tools labelled "not the job", divided by every tool shown.
 *   found one            needs with at least one acceptable tool in the top 5.
 *
 * Needs a dev server, and spends real API credit (about $0.05 to $0.15 a need with live search).
 *   node --no-warnings --env-file=.env.local scripts/eval-match.mts [base url] [--catalog-only] [--only=id,id]
 *
 * --catalog-only skips the live web search, which is much cheaper and measures ranking alone.
 */
import fs from "node:fs";
import path from "node:path";
import { rootDomain } from "../src/lib/research-core.ts";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const catalogOnly = args.includes("--catalog-only");
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice(7).split(",")) : null;
const TOP = 5;

interface Need {
  id: string;
  need: string;
  type: string;
  systems: string[];
  language: string;
  size?: string;
  acceptable: string[];
  notTheJob: string[];
  checkedWithOwner: false | string;
}

interface MatchTool {
  tool: { slug: string; name: string; website: string; source: string };
  fit: string;
}

type Verdict = "acceptable" | "not the job" | "unlabelled";

const labels = JSON.parse(fs.readFileSync("docs/eval/needs.json", "utf8")) as { labelledBy: string; needs: Need[] };
const needs = labels.needs.filter((n) => !only || only.has(n.id));

function verdict(need: Need, tool: MatchTool["tool"]): Verdict {
  const keys = [tool.slug, `domain:${rootDomain(tool.website)}`];
  if (keys.some((k) => need.acceptable.includes(k))) return "acceptable";
  if (keys.some((k) => need.notTheJob.includes(k))) return "not the job";
  return "unlabelled";
}

async function runNeed(need: Need, index: number) {
  const started = Date.now();
  const res = await fetch(`${base}/api/match`, {
    method: "POST",
    // A different address per need, so the per-visitor limit does not stop a long run on a dev server.
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `198.51.100.${(index % 250) + 1}` },
    body: JSON.stringify({ need: need.need, type: need.type, systems: need.systems, language: need.language, size: need.size, lang: "en", fresh: true, liveSearch: !catalogOnly }),
    signal: AbortSignal.timeout(90_000),
  });
  const json = (await res.json()) as { status: string; tools?: MatchTool[] };
  const shown = (json.tools ?? []).slice(0, TOP);
  const judged = shown.map((m) => ({ name: m.tool.name, slug: m.tool.slug, website: m.tool.website, source: m.tool.source, fit: m.fit, verdict: verdict(need, m.tool) }));
  const count = (v: Verdict) => judged.filter((j) => j.verdict === v).length;
  const labelled = count("acceptable") + count("not the job");
  return {
    id: need.id,
    status: json.status,
    httpStatus: res.status,
    seconds: Math.round((Date.now() - started) / 1000),
    cost: Number(res.headers.get("x-debug-cost") ?? 0),
    checkedWithOwner: need.checkedWithOwner,
    tools: judged,
    acceptable: count("acceptable"),
    notTheJob: count("not the job"),
    unlabelled: count("unlabelled"),
    precisionAt5: count("acceptable") / TOP,
    labelledPrecisionAt5: labelled ? count("acceptable") / labelled : null,
  };
}

type Row = Awaited<ReturnType<typeof runNeed>> | { id: string; status: "request-failed"; error: string };

const rows: Row[] = [];
for (const [index, need] of needs.entries()) {
  try {
    const row = await runNeed(need, index);
    rows.push(row);
    const list = row.tools.map((t) => `${t.name}[${t.verdict === "acceptable" ? "ok" : t.verdict === "not the job" ? "WRONG" : "?"}]`).join(", ") || "(none)";
    console.log(`${need.id.padEnd(30)} ${row.status.padEnd(6)} P@5 ${row.precisionAt5.toFixed(2)} ${String(row.seconds).padStart(3)}s: ${list}`);
  } catch (err) {
    rows.push({ id: need.id, status: "request-failed", error: err instanceof Error ? err.message : "failed" });
    console.log(`${need.id.padEnd(30)} request failed: ${err instanceof Error ? err.message : "failed"}`);
  }
}

const done = rows.filter((r): r is Awaited<ReturnType<typeof runNeed>> => r.status !== "request-failed");
const shown = done.reduce((sum, r) => sum + r.tools.length, 0);
const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const labelledValues = done.flatMap((r) => (r.labelledPrecisionAt5 === null ? [] : [r.labelledPrecisionAt5]));
const summary = {
  needs: needs.length,
  answered: done.length,
  precisionAt5: Number(mean(done.map((r) => r.precisionAt5)).toFixed(3)),
  labelledPrecisionAt5: Number(mean(labelledValues).toFixed(3)),
  notTheJobRate: shown ? Number((done.reduce((s, r) => s + r.notTheJob, 0) / shown).toFixed(3)) : 0,
  unlabelledShare: shown ? Number((done.reduce((s, r) => s + r.unlabelled, 0) / shown).toFixed(3)) : 0,
  foundOne: done.filter((r) => r.acceptable > 0).length,
  liveFound: done.reduce((s, r) => s + r.tools.filter((t) => t.source === "live").length, 0),
  checkedWithOwner: needs.filter((n) => n.checkedWithOwner).length,
  cost: Number(done.reduce((s, r) => s + r.cost, 0).toFixed(3)),
  slowestSeconds: Math.max(0, ...done.map((r) => r.seconds)),
};

const ranAt = new Date().toISOString();
const stamp = ranAt.slice(0, 16).replace(/[:T]/g, "-");
const dir = path.resolve("docs/eval/runs");
fs.mkdirSync(dir, { recursive: true });
const name = `${stamp}${catalogOnly ? "-catalog" : ""}`;
fs.writeFileSync(path.join(dir, `${name}.json`), `${JSON.stringify({ ranAt, base, catalogOnly, labelledBy: labels.labelledBy, summary, rows }, null, 1)}\n`);

const pct = (n: number) => `${Math.round(n * 100)}%`;
const unlabelled = done.flatMap((r) => r.tools.filter((t) => t.verdict === "unlabelled").map((t) => `- ${r.id}: ${t.name} (${t.website})`));
const markdown = `# Matcher evaluation, ${ranAt.slice(0, 10)}${catalogOnly ? " (catalog only)" : ""}

${labels.labelledBy}

| Measure | Result |
| --- | --- |
| Needs answered | ${summary.answered} of ${summary.needs} |
| Precision@5 (unlabelled and empty slots count against) | ${pct(summary.precisionAt5)} |
| Precision@5 among labelled tools | ${pct(summary.labelledPrecisionAt5)} |
| "Does not do the job" rate | ${pct(summary.notTheJobRate)} |
| Tools shown that nobody has labelled yet | ${pct(summary.unlabelledShare)} |
| Needs with at least one acceptable tool | ${summary.foundOne} of ${summary.answered} |
| Live-search finds shown | ${summary.liveFound} |
| Needs whose labels an owner checked | ${summary.checkedWithOwner} of ${summary.needs} |
| Cost | about $${summary.cost} |

## Per need

| Need | P@5 | Tools (ok = acceptable, WRONG = not the job, ? = unlabelled) |
| --- | --- | --- |
${done.map((r) => `| ${r.id} | ${r.precisionAt5.toFixed(2)} | ${r.tools.map((t) => `${t.name} ${t.verdict === "acceptable" ? "ok" : t.verdict === "not the job" ? "WRONG" : "?"}`).join(", ") || "none"} |`).join("\n")}

## To label

${unlabelled.length ? unlabelled.join("\n") : "Nothing: every tool shown was labelled."}
`;
fs.writeFileSync(path.join(dir, `${name}.md`), markdown);

console.log(`\nPrecision@5 ${pct(summary.precisionAt5)} (labelled only ${pct(summary.labelledPrecisionAt5)}), not-the-job rate ${pct(summary.notTheJobRate)}, unlabelled ${pct(summary.unlabelledShare)}, found one for ${summary.foundOne} of ${summary.answered}. Cost about $${summary.cost}.`);
console.log(`Wrote docs/eval/runs/${name}.json and .md. Commit both.`);
