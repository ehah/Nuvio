import { describe, expect, it } from "vitest";
import { withNuvio } from "./with-nuvio.js";

describe("withNuvio", () => {
  it("does not add jsx-loc loader in production builds", () => {
    const config = withNuvio({});
    const webpackConfig = { module: { rules: [] as unknown[] } };
    const result = config.webpack!(webpackConfig, {
      dev: false,
      dir: "/proj",
    } as Parameters<NonNullable<typeof config.webpack>>[1]);
    expect(result.module?.rules).toHaveLength(0);
  });

  it("adds jsx-loc loader only in dev", () => {
    const config = withNuvio({});
    const webpackConfig = { module: { rules: [] as unknown[] } };
    const result = config.webpack!(webpackConfig, {
      dev: true,
      dir: "/proj",
    } as Parameters<NonNullable<typeof config.webpack>>[1]);
    const rules = result.module?.rules ?? [];
    expect(rules.length).toBeGreaterThan(0);
    const last = rules[rules.length - 1] as { test?: RegExp; use?: unknown[] };
    expect(last.test?.test("pages/index.tsx")).toBe(true);
  });
});
