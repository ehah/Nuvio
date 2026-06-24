import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCoverageVerify } from "../src/coverage-verify.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("Next brand/coverage CLI", () => {
  it("coverage verify works for next-dogfood via --app", () => {
    const code = runCoverageVerify({
      cwd: REPO_ROOT,
      app: "next-dogfood",
      page: "home",
    });
    expect(code).toBe(0);
  });
});
