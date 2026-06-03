import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { PackageManager } from "./detect-pm.js";
import { installCommand } from "./detect-pm.js";

function parseInstalledVersion(
  pkg: Record<string, unknown>,
  name: string,
): string | null {
  const dev = pkg.devDependencies as Record<string, string> | undefined;
  const deps = pkg.dependencies as Record<string, string> | undefined;
  const raw = dev?.[name] ?? deps?.[name];
  if (!raw) return null;
  return raw.replace(/^[\^~]/, "");
}

export function packagesNeedInstall(
  packageJsonPath: string,
  targetVersion: string,
): boolean {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<
    string,
    unknown
  >;
  for (const name of ["@nuvio/vite-plugin", "@nuvio/overlay"]) {
    const v = parseInstalledVersion(pkg, name);
    if (v !== targetVersion) return true;
  }
  return false;
}

export function runInstall(
  root: string,
  pm: PackageManager,
  version: string,
): { ok: boolean; message?: string } {
  const cmd = installCommand(pm, version);
  const result = spawnSync(cmd, {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    return {
      ok: false,
      message: `Install failed. Try manually:\n  ${cmd}`,
    };
  }
  return { ok: true };
}
