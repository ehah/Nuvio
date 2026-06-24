import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PatchOutcome } from "./patch-vite-config.js";

const CONFIG_NAMES = [
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
] as const;

export function findNextConfig(root: string): string | null {
  for (const name of CONFIG_NAMES) {
    const p = join(root, name);
    if (existsSync(p)) {
      return p;
    }
  }
  return null;
}

export function patchNextConfigFile(filePath: string): PatchOutcome {
  let source = readFileSync(filePath, "utf8");
  if (source.includes("withNuvio")) {
    return { ok: true, skipped: true };
  }

  if (!source.includes("@nuvio/next")) {
    source = `import { withNuvio } from "@nuvio/next/with-nuvio";\n${source}`;
  } else if (source.includes('@nuvio/next"') && !source.includes("@nuvio/next/with-nuvio")) {
    source = source.replace(
      /from ["']@nuvio\/next["']/,
      'from "@nuvio/next/with-nuvio"',
    );
  }

  const replaced = source.replace(
    /export\s+default\s+([^;]+);/,
    "export default withNuvio($1);",
  );
  if (replaced === source) {
    return { ok: false, error: "no default export to wrap" };
  }

  writeFileSync(filePath, replaced, "utf8");
  return { ok: true };
}
