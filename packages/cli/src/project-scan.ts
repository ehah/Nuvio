import { relative } from "node:path";
import type { IndexWireEntry, LibraryId } from "@nuvio/shared";
import {
  buildSourceIndex,
  detectProjectLibraries,
  resolveProjectScanGlobs,
  type BuildSourceIndexResult,
} from "@nuvio/vite-plugin/scan";
import type { AppContext } from "./app-context.js";
import { detectProject, type ProjectContext } from "./detect-project.js";

export type ProjectScanResult = {
  ctx: ProjectContext;
  detectedLibraries: LibraryId[];
  index: BuildSourceIndexResult;
};

export type AppScanResult = {
  app: AppContext;
  detectedLibraries: LibraryId[];
  index: BuildSourceIndexResult;
};

export function scanAppContext(app: AppContext): AppScanResult {
  const detectedLibraries = detectProjectLibraries(app.appRoot, app.packageJson);
  const index = buildSourceIndex(app.appRoot, [...app.scanGlobs], { detectedLibraries });
  return { app, detectedLibraries, index };
}

export function scanProject(root: string): ProjectScanResult {
  const ctx = detectProject(root);
  const detectedLibraries = detectProjectLibraries(root, ctx.packageJson);
  const scanGlobs = [...resolveProjectScanGlobs(root)];
  const index = buildSourceIndex(root, scanGlobs, { detectedLibraries });
  return { ctx, detectedLibraries, index };
}

export function relPath(root: string, fileAbs: string): string {
  return relative(root, fileAbs).replace(/\\/g, "/");
}

export function isTableHost(entry: IndexWireEntry): boolean {
  return (
    entry.hierarchyRole === "table" ||
    entry.id.endsWith(".table") ||
    entry.id.includes(".header.") ||
    /\.row\./.test(entry.id)
  );
}

export function aggregateClassNameModes(
  entries: readonly IndexWireEntry[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const mode = entry.classNameMode ?? "literal-only";
    counts[mode] = (counts[mode] ?? 0) + 1;
  }
  return counts;
}
