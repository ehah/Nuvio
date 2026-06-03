import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export function detectPackageManager(
  root: string,
  override?: PackageManager,
): PackageManager {
  if (override) return override;
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock")))
    return "bun";
  return "npm";
}

export function installCommand(
  pm: PackageManager,
  version: string,
): string {
  const pkgs = `@nuvio/vite-plugin@${version} @nuvio/overlay@${version}`;
  switch (pm) {
    case "pnpm":
      return `pnpm add -D ${pkgs}`;
    case "yarn":
      return `yarn add -D ${pkgs}`;
    case "bun":
      return `bun add -d ${pkgs}`;
    default:
      return `npm install -D ${pkgs}`;
  }
}
