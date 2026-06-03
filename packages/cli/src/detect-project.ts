import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MSG } from "./messages.js";

const VITE_CONFIGS = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;

export type ProjectContext = {
  root: string;
  packageJsonPath: string;
  packageJson: Record<string, unknown>;
  viteConfigPath: string;
  viteConfigName: string;
  tailwindOk: boolean;
  tailwindWarn: boolean;
};

export class PreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreflightError";
  }
}

function hasDep(pkg: Record<string, unknown>, name: string): boolean {
  const deps = pkg.dependencies as Record<string, string> | undefined;
  const dev = pkg.devDependencies as Record<string, string> | undefined;
  return Boolean(deps?.[name] ?? dev?.[name]);
}

function detectTailwind(root: string, pkg: Record<string, unknown>): boolean {
  if (hasDep(pkg, "tailwindcss")) return true;
  const cssCandidates = ["src/index.css", "src/App.css"];
  for (const rel of cssCandidates) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    if (
      text.includes("@tailwind") ||
      text.includes('@import "tailwindcss"') ||
      text.includes("@import 'tailwindcss'")
    ) {
      return true;
    }
  }
  return false;
}

export function detectProject(root: string): ProjectContext {
  const packageJsonPath = join(root, "package.json");
  if (!existsSync(packageJsonPath)) {
    throw new PreflightError(MSG.noPackageJson);
  }

  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8"),
  ) as Record<string, unknown>;

  if (packageJson.name === "@nuvio/cli") {
    throw new PreflightError(MSG.cliPackage);
  }

  if (packageJson.name === "nuvio" && packageJson.private === true) {
    throw new PreflightError(MSG.monorepoRoot);
  }

  let viteConfigPath = "";
  let viteConfigName = "";
  for (const name of VITE_CONFIGS) {
    const p = join(root, name);
    if (existsSync(p)) {
      viteConfigPath = p;
      viteConfigName = name;
      break;
    }
  }
  if (!viteConfigPath) {
    throw new PreflightError(MSG.noVite);
  }

  if (!hasDep(packageJson, "react")) {
    throw new PreflightError(MSG.noReact);
  }
  if (!hasDep(packageJson, "vite")) {
    throw new PreflightError(MSG.noViteDep);
  }

  const tailwindOk = detectTailwind(root, packageJson);

  return {
    root,
    packageJsonPath,
    packageJson,
    viteConfigPath,
    viteConfigName,
    tailwindOk,
    tailwindWarn: !tailwindOk,
  };
}

export function findViteConfig(root: string): string | null {
  for (const name of VITE_CONFIGS) {
    const p = join(root, name);
    if (existsSync(p)) return p;
  }
  return null;
}
