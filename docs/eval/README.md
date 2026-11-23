# Evaluation

Two checks, for two different parts of search.

## Matcher regression list (free, runs in CI)

`npm run check:matcher` runs 43 owner questions through the instant matcher, which picks a need from the words typed before any AI is asked. It covers unaccented Spanish and Vietnamese ("dat lich hen", "necesito hacer la nomina") and words that must never be read as immigration enforcement ("ice cream"). Add a case to `scripts/check-matcher.mts` whenever a question lands in the wrong place.

## Need-first matching (costs API credit)

`docs/eval/needs.json` holds 34 owner needs, each with the tools that do the job (`acceptable`) and tools that clearly do not (`notTheJob`). `scripts/eval-match.mts` sends each need to `/api/match` and compares the top 5 with those labels. No AI grades the results.

1. Start a dev server on port 3001: `npx next dev --port 3001`
2. Run `npm run eval` (live search, about $0.05 to $0.15 a need) or `npm run eval -- --catalog-only` (much cheaper).
3. Commit the `.json` and `.md` the run writes to `docs/eval/runs/`.
4. Label every tool listed under "To label" in that report, by adding its slug (or `domain:example.com`) to the need in `needs.json`.

The first labels were drafted from the catalog's own descriptions, not checked with owners. The most useful next step is to go through them with a few owners and set `checkedWithOwner` to the date for each need they confirm.

No run has been committed yet.
