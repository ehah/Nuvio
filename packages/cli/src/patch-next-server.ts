import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PatchOutcome } from "./patch-vite-config.js";

const SERVER_FILE = "server.js";

const SERVER_TEMPLATE = `import { createNuvioNextDevServer } from "@nuvio/next";

await createNuvioNextDevServer({
  port: Number(process.env.PORT ?? 3000),
});
`;

export function nextServerPath(root: string): string {
  return join(root, SERVER_FILE);
}

export function ensureNextServerJs(root: string): {
  outcome: PatchOutcome;
  created: boolean;
} {
  const filePath = nextServerPath(root);
  if (existsSync(filePath)) {
    const text = readFileSync(filePath, "utf8");
    if (text.includes("createNuvioNextDevServer") || text.includes("attachNuvioToNextServer")) {
      return { outcome: { ok: true, skipped: true }, created: false };
    }
  }
  writeFileSync(filePath, SERVER_TEMPLATE, "utf8");
  return { outcome: { ok: true }, created: true };
}

export function patchPackageJsonDevScript(root: string): PatchOutcome {
  const packageJsonPath = join(root, "package.json");
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>;
  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  const current = scripts.dev ?? "";
  if (current === "node server.js" || current.includes("server.js")) {
    return { ok: true, skipped: true };
  }
  scripts.dev = "node server.js";
  pkg.scripts = scripts;
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  return { ok: true };
}
