/**
 * Lets a Node script import the app's own modules, which use the "@/" path alias and import
 * JSON files the way the bundler does. Import this file first, then import app modules with
 * `await import(...)`.
 *
 *   import "./lib/app-modules.mts";
 *   const { localSuggestions } = await import("../src/lib/matcher.ts");
 */
import fs from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../../src/", import.meta.url);
const EXTENSIONS = [".ts", ".tsx", "/index.ts", ""];

function aliasTarget(specifier: string) {
  const rest = specifier.slice(2);
  for (const ext of EXTENSIONS) {
    const url = new URL(`${rest}${ext}`, SRC);
    if (fs.existsSync(fileURLToPath(url)) && fs.statSync(fileURLToPath(url)).isFile()) return url.href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = aliasTarget(specifier);
      if (target) return nextResolve(target, context);
    }
    // Relative imports inside the app leave out the ".ts" the bundler adds.
    if (specifier.startsWith(".") && context.parentURL?.startsWith(SRC.href) && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)) {
      for (const ext of EXTENSIONS) {
        const url = new URL(`${specifier}${ext}`, context.parentURL);
        if (ext && fs.existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
      }
    }
    // Server-only markers mean nothing outside Next.
    if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json") && url.startsWith("file:")) {
      return { format: "module", source: `export default ${fs.readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

export const appRoot = pathToFileURL(fileURLToPath(new URL("../../", import.meta.url)));
