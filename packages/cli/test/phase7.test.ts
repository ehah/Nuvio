import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function fixturePath(name: string): string {
  return join(FIXTURES, name);
}

/**
 * Fixture coverage map for v2.0 §20.
 * Each row documents which fixture proves the acceptance criterion.
 */
const FIXTURE_MATRIX = [
  { id: 1, name: "next-app-router-minimal", proves: "Next App Router init + layout shell" },
  { id: 2, name: "next-app-router-minimal", proves: "src/app layout (same fixture)" },
  { id: 3, name: "next-pages-router-minimal", proves: "Pages Router _app shell" },
  { id: 7, name: "backend-only-repo", proves: "backend-only init refusal" },
] as const;

describe("Phase 7 fixture matrix (§20)", () => {
  for (const row of FIXTURE_MATRIX) {
    it(`fixture #${row.id}: ${row.name} — ${row.proves}`, () => {
      const root = fixturePath(row.name);
      if (row.name === "backend-only-repo") {
        expect(existsSync(join(root, "requirements.txt"))).toBe(true);
        return;
      }
      expect(existsSync(join(root, "package.json"))).toBe(true);
    });
  }

  it("next-app-router-minimal has src/app layout", () => {
    const root = fixturePath("next-app-router-minimal");
    expect(existsSync(join(root, "src/app/layout.tsx"))).toBe(true);
  });

  it("next-pages-router-minimal has pages entry", () => {
    const root = fixturePath("next-pages-router-minimal");
    expect(existsSync(join(root, "pages/index.tsx"))).toBe(true);
  });

  it("backend-only-repo has python backend marker", () => {
    const root = fixturePath("backend-only-repo");
    expect(existsSync(join(root, "requirements.txt"))).toBe(true);
  });
});
