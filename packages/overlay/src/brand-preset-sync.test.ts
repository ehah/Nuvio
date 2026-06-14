import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND_CONFIG } from "@nuvio/shared";
import {
  brandPresetContextKey,
  buildBrandPageBaselineDraft,
  resolveBrandPresetCategory,
  shouldSyncDraftFromPageInference,
} from "./brand-preset-sync.js";

describe("brandPresetContextKey", () => {
  it("does not include saved brand so save does not change the context key", () => {
    const base = brandPresetContextKey("btn-1", "button", "xl", 0);
    const afterSave = brandPresetContextKey("btn-1", "button", "xl", 0);
    expect(base).toBe(afterSave);
  });
});

describe("resolveBrandPresetCategory", () => {
  it("prefers aligned selection + active category over manual category", () => {
    expect(resolveBrandPresetCategory("card", "card", "heading")).toBe("card");
  });

  it("uses manual category when selection category differs from active tab", () => {
    expect(resolveBrandPresetCategory("card", "heading", "heading")).toBe("heading");
  });
});

describe("buildBrandPageBaselineDraft", () => {
  it("layers inferred category presets on saved defaults", () => {
    expect(
      buildBrandPageBaselineDraft(DEFAULT_BRAND_CONFIG, { color: "green" }, ["color", "radius"]),
    ).toEqual({ ...DEFAULT_BRAND_CONFIG, color: "green" });
  });
});

describe("shouldSyncDraftFromPageInference", () => {
  it("skips draft sync when the selection context is unchanged", () => {
    const contextKey = brandPresetContextKey("btn-1", "button", "xl", 0);
    expect(shouldSyncDraftFromPageInference(contextKey, contextKey)).toBe(false);
  });

  it("syncs draft on new selection context", () => {
    const contextKey = brandPresetContextKey("btn-2", "button", "xl", 0);
    expect(
      shouldSyncDraftFromPageInference(
        contextKey,
        brandPresetContextKey("btn-1", "button", "xl", 0),
      ),
    ).toBe(true);
  });
});

describe("define-brand draft vs page baseline", () => {
  it("keeps saved brand in draft while page baseline reflects selection inference", () => {
    const saved = { ...DEFAULT_BRAND_CONFIG, color: "rose" };
    const pageBaseline = buildBrandPageBaselineDraft(saved, { color: "blue" }, ["color", "radius"]);
    expect(pageBaseline.color).toBe("blue");
    expect(saved.color).toBe("rose");
  });
});
