import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildSourceIndex } from "./source-index.js";
import {
  listExistingSourceWatchDirs,
  NUVIO_NEXT_SCAN_GLOBS,
  resolveProjectScanGlobs,
} from "./scan-globs.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");

describe("resolveProjectScanGlobs", () => {
  it("returns Vite globs for demo-app", () => {
    const globs = resolveProjectScanGlobs(path.join(REPO_ROOT, "apps/demo-app"));
    expect(globs).toContain("src/**/*.{tsx,jsx}");
    expect(globs).not.toContain("app/**/*.{tsx,jsx}");
  });

  it("returns Next globs for next-dogfood", () => {
    const globs = resolveProjectScanGlobs(path.join(REPO_ROOT, "apps/next-dogfood"));
    expect(globs).toEqual([...NUVIO_NEXT_SCAN_GLOBS]);
  });
});

describe("listExistingSourceWatchDirs", () => {
  it("includes src for next-dogfood", () => {
    const dirs = listExistingSourceWatchDirs(path.join(REPO_ROOT, "apps/next-dogfood"));
    expect(dirs.some((d) => d.endsWith(`${path.sep}src`))).toBe(true);
  });
});

describe("buildSourceIndex (next-dogfood)", () => {
  it("indexes page.title under Next scan globs", () => {
    const nextRoot = path.join(REPO_ROOT, "apps/next-dogfood");
    const r = buildSourceIndex(nextRoot, [...NUVIO_NEXT_SCAN_GLOBS]);
    expect(r.scannedFileCount).toBeGreaterThan(0);
    expect(r.entries.some((e) => e.id === "page.title")).toBe(true);
  });

  it("does not scan files under .next when present", () => {
    const nextRoot = path.join(REPO_ROOT, "apps/next-dogfood");
    const r = buildSourceIndex(nextRoot, [...NUVIO_NEXT_SCAN_GLOBS]);
    expect(r.entries.every((e) => !e.file.includes(`${path.sep}.next${path.sep}`))).toBe(true);
  });
});
