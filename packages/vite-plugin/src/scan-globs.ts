import fs from "node:fs";
import path from "node:path";

/** Default fast-glob ignore patterns for all source index scans. */
export const NUVIO_DEFAULT_IGNORE_GLOBS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/out/**",
  "**/.turbo/**",
  "**/app/api/**",
  "**/pages/api/**",
  "**/src/app/api/**",
  "**/src/pages/api/**",
] as const;

/** Vite + monorepo layouts (`apps/` / `packages/`). */
export const NUVIO_VITE_SCAN_GLOBS = [
  "src/**/*.{tsx,jsx}",
  "apps/**/src/**/*.{tsx,jsx}",
  "packages/**/src/**/*.{tsx,jsx}",
] as const;

/** Next.js App Router + Pages Router frontend roots. */
export const NUVIO_NEXT_SCAN_GLOBS = [
  "app/**/*.{tsx,jsx}",
  "pages/**/*.{tsx,jsx}",
  "components/**/*.{tsx,jsx}",
  "src/app/**/*.{tsx,jsx}",
  "src/pages/**/*.{tsx,jsx}",
  "src/components/**/*.{tsx,jsx}",
] as const;

/** @deprecated alias — use {@link NUVIO_VITE_SCAN_GLOBS} or {@link resolveProjectScanGlobs}. */
export const NUVIO_DEFAULT_SCAN_GLOBS = [...NUVIO_VITE_SCAN_GLOBS];

/** Top-level directories watched for TSX/JSX changes during dev indexing. */
export const NUVIO_SOURCE_WATCH_DIRS = ["src", "app", "pages", "components"] as const;

function hasDep(pkg: Record<string, unknown>, name: string): boolean {
  const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;
  for (const key of sections) {
    const deps = pkg[key];
    if (deps && typeof deps === "object" && name in (deps as Record<string, unknown>)) {
      return true;
    }
  }
  return false;
}

/**
 * Resolve scan globs for a project root based on package.json dependencies.
 * Next-only apps get Next globs; Vite apps keep Vite globs; both deps merge both sets.
 */
export function resolveProjectScanGlobs(projectRootAbs: string): readonly string[] {
  const root = path.resolve(projectRootAbs);
  let pkg: Record<string, unknown> = {};
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return [...NUVIO_VITE_SCAN_GLOBS];
  }

  const hasNext = hasDep(pkg, "next");
  const hasVite = hasDep(pkg, "vite");

  if (hasNext && !hasVite) {
    return [...NUVIO_NEXT_SCAN_GLOBS];
  }
  if (hasNext && hasVite) {
    return [...NUVIO_VITE_SCAN_GLOBS, ...NUVIO_NEXT_SCAN_GLOBS];
  }
  return [...NUVIO_VITE_SCAN_GLOBS];
}

/** Existing source roots under `projectRootAbs` that should trigger index rebuilds. */
export function listExistingSourceWatchDirs(projectRootAbs: string): string[] {
  const root = path.resolve(projectRootAbs);
  return NUVIO_SOURCE_WATCH_DIRS.map((rel) => path.join(root, rel)).filter((dir) =>
    fs.existsSync(dir),
  );
}
