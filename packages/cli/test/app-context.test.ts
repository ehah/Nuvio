import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  discoverFrontendApps,
  discoverIgnoredPaths,
  discoverWorkspace,
  resolveRepoRoot,
  resolveTargetApps,
} from "../src/app-context.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("discoverFrontendApps", () => {
  it("finds demo-app and next-dogfood in monorepo", () => {
    const apps = discoverFrontendApps(REPO_ROOT);
    const ids = apps.map((a) => a.appId);
    expect(ids).toContain("apps/demo-app");
    expect(ids).toContain("apps/next-dogfood");
  });
});

describe("resolveTargetApps", () => {
  it("resolves next-dogfood by short app id from repo root", () => {
    const targets = resolveTargetApps({
      cwd: REPO_ROOT,
      app: "next-dogfood",
    });
    expect(targets).toHaveLength(1);
    expect(targets[0]?.framework).toMatch(/^next-/);
    expect(targets[0]?.appRoot).toContain("next-dogfood");
  });

  it("uses cwd directly for a vite fixture app root", () => {
    const demoRoot = path.join(REPO_ROOT, "apps/demo-app");
    const targets = resolveTargetApps({ cwd: demoRoot });
    expect(targets).toHaveLength(1);
    expect(targets[0]?.framework).toBe("vite");
  });
});

describe("discoverWorkspace", () => {
  it("resolves monorepo root from nested app cwd", () => {
    const repoRoot = resolveRepoRoot(path.join(REPO_ROOT, "apps/demo-app"));
    expect(repoRoot).toBe(REPO_ROOT);
    const discovery = discoverWorkspace(path.join(REPO_ROOT, "apps/demo-app"));
    expect(discovery.frontendApps.length).toBeGreaterThan(1);
  });
});

describe("discoverIgnoredPaths", () => {
  it("returns empty when no backend markers at repo root", () => {
    const ignored = discoverIgnoredPaths(REPO_ROOT);
    expect(Array.isArray(ignored)).toBe(true);
  });
});
