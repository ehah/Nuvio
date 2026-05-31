import { describe, expect, it } from "vitest";
import {
  flattenTokensAtBreakpoint,
  isBgColorUtility,
  isTextColorUtility,
  lastMatchingToken,
} from "./tailwind-token-read.js";

describe("flattenTokensAtBreakpoint", () => {
  it("includes xl bucket utilities when active breakpoint is xl", () => {
    const tokens = flattenTokensAtBreakpoint(
      "rounded-2xl bg-white xl:bg-red-100 dark:bg-white/[0.03]",
      "xl",
    );
    expect(tokens).toContain("bg-white");
    expect(tokens).toContain("bg-red-100");
    expect(tokens).toContain("bg-white/[0.03]");
  });

  it("omits xl utilities when active breakpoint is base", () => {
    const tokens = flattenTokensAtBreakpoint("bg-white xl:bg-red-100", "base");
    expect(tokens).toContain("bg-white");
    expect(tokens).not.toContain("bg-red-100");
  });
});

describe("color utility detection", () => {
  it("detects text and bg colors with opacity", () => {
    expect(isTextColorUtility("text-red-600")).toBe(true);
    expect(isTextColorUtility("text-white/90")).toBe(true);
    expect(isTextColorUtility("text-sm")).toBe(false);
    expect(isBgColorUtility("bg-white/[0.03]")).toBe(true);
  });

  it("lastMatchingToken returns last color in cascade list", () => {
    const tokens = flattenTokensAtBreakpoint(
      "text-gray-800 xl:text-red-600 dark:text-white/90",
      "xl",
    );
    expect(lastMatchingToken(tokens, isTextColorUtility)).toBe("text-red-600");
  });
});
