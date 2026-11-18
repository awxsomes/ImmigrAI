/**
 * Fails when any interface word, page, kit, tool description or category is missing in
 * Spanish, Chinese or Vietnamese, or when its English changed after it was translated.
 * Runs in CI. Fix a failure with `npm run translate`.
 *
 *   node scripts/check-i18n.mts
 */
import fs from "node:fs";
import { DOCS } from "../src/content/docs.ts";
import { CATEGORIES } from "../src/data/taxonomy.ts";
import {
  bundleSources,
  docSource,
  englishStrings,
  ERRORS_FILE,
  errorTexts,
  handWrittenKeys,
  hash,
  LANGUAGES,
  missingFields,
  readStore,
  subcategoryDescriptions,
  toolSources,
  type Lang,
} from "./i18n-sources.mts";

/** Words that are the same in every language. */
const SAME_EVERYWHERE = new Set(["brand"]);

const english = englishStrings();
const hand = handWrittenKeys();
const interfaceKeys = [...new Set([...hand.en, ...Object.keys(english)])].filter((key) => !SAME_EVERYWHERE.has(key));
const bundles = bundleSources();
const tools = toolSources();
const descriptions = subcategoryDescriptions();

let failures = 0;

function report(lang: Lang, what: string, items: string[]) {
  if (items.length === 0) return;
  failures += items.length;
  const shown = items.slice(0, 12).join(", ");
  console.error(`${lang}: ${items.length} ${what}: ${shown}${items.length > 12 ? ", ..." : ""}`);
}

for (const lang of Object.keys(LANGUAGES) as Lang[]) {
  const store = readStore(lang);
  const sources = store.sources ?? {};

  report(
    lang,
    "interface words missing",
    interfaceKeys.filter((key) => !store.strings[key] && !hand[lang]?.has(key)),
  );
  report(
    lang,
    "interface words out of date",
    Object.keys(english).filter((key) => store.strings[key] && sources.strings?.[key] !== hash(english[key])),
  );

  report(
    lang,
    "pages missing or out of date",
    (Object.keys(DOCS) as Array<keyof typeof DOCS>).filter((key) => {
      const translated = store.docs[key] as { sections?: unknown[] } | undefined;
      const source = docSource(key);
      return !translated || translated.sections?.length !== source.sections.length || sources.docs?.[key] !== hash(source);
    }),
  );

  report(
    lang,
    "kits missing or out of date",
    Object.entries(bundles)
      .filter(([slug, source]) => !store.bundles[slug] || Object.keys(source).some((field) => !store.bundles[slug][field]) || sources.bundles?.[slug] !== hash(source))
      .map(([slug]) => slug),
  );

  report(
    lang,
    "tools with untranslated fields",
    Object.entries(tools)
      .filter(([slug, source]) => Object.keys(missingFields(source, store.tools[slug])).length > 0)
      .map(([slug, source]) => `${slug} (${Object.keys(missingFields(source, store.tools[slug])).join("/")})`),
  );

  const taxonomy = JSON.parse(fs.readFileSync(`src/content/i18n/${lang}.taxonomy.json`, "utf8")) as Record<string, { name?: string; desc?: string; from?: string }>;
  const ids = CATEGORIES.flatMap((category) => [category.id, ...category.subcategories.map((sub) => sub.id)]);
  report(
    lang,
    "categories missing or out of date",
    ids.filter((id) => {
      const entry = taxonomy[id];
      if (!entry?.name) return true;
      if (!(id in descriptions)) return false;
      return !entry.desc || (entry.from !== undefined && entry.from !== hash(descriptions[id]));
    }),
  );
}

const errorFile = fs.existsSync(ERRORS_FILE) ? fs.readFileSync(ERRORS_FILE, "utf8") : "";
if (errorFile !== `${JSON.stringify(errorTexts(), null, 1)}\n`) {
  failures++;
  console.error(`${ERRORS_FILE} does not match the translated error words.`);
}

if (failures > 0) {
  console.error(`\n${failures} translation gaps. Run \`npm run translate\` and commit the files it changes.`);
  process.exit(1);
}
console.log(`Every interface word, page, kit, tool and category is translated into ${Object.keys(LANGUAGES).join(", ")}.`);
