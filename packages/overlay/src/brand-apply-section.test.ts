import { describe, expect, it } from "vitest";
import { BRAND_APPLY_ACTIONS, DEFAULT_BRAND_CONFIG } from "@nuvio/shared";
import {
  applyBrandButtonTitle,
  formatApplyBrandSectionLead,
  isApplyBrandEnabled,
  isValidateBrandEnabled,
  validateBrandButtonTitle,
  type BrandApplySectionInput,
} from "./brand-apply-section.js";

function baseInput(overrides: Partial<BrandApplySectionInput> = {}): BrandApplySectionInput {
  return {
    channelReady: true,
    loadState: "ready",
    dirty: false,
    action: "card",
    targetCount: 3,
    saved: DEFAULT_BRAND_CONFIG,
    appliedByAction: {},
    bulkPhase: null,
    validatedAction: null,
    validatedConfig: null,
    brandBulkApplyReady: false,
    ...overrides,
  };
}

describe("isValidateBrandEnabled", () => {
  it("requires saved brand and hosts on page", () => {
    expect(isValidateBrandEnabled(baseInput())).toBe(true);
    expect(isValidateBrandEnabled(baseInput({ dirty: true }))).toBe(false);
    expect(isValidateBrandEnabled(baseInput({ targetCount: 0 }))).toBe(false);
  });

  it("disables after validate is ready for saved config", () => {
    expect(
      isValidateBrandEnabled(
        baseInput({
          validatedAction: "card",
          validatedConfig: DEFAULT_BRAND_CONFIG,
          brandBulkApplyReady: true,
        }),
      ),
    ).toBe(false);
  });

  it("disables when category was already bulk-applied with saved brand on this page", () => {
    expect(
      isValidateBrandEnabled(
        baseInput({
          action: "text",
          appliedByAction: { text: DEFAULT_BRAND_CONFIG },
        }),
      ),
    ).toBe(false);
  });

  it("keeps validate available for other categories after one category is applied", () => {
    expect(
      isValidateBrandEnabled(
        baseInput({
          action: "button",
          appliedByAction: { text: DEFAULT_BRAND_CONFIG },
        }),
      ),
    ).toBe(true);
  });

  it("re-enables validate for a category after saved brand changes", () => {
    const updated = { ...DEFAULT_BRAND_CONFIG, color: "green" };
    expect(
      isValidateBrandEnabled(
        baseInput({
          action: "text",
          saved: updated,
          appliedByAction: { text: DEFAULT_BRAND_CONFIG },
        }),
      ),
    ).toBe(true);
  });

  it.each(BRAND_APPLY_ACTIONS.filter((action) => action !== "badge"))(
    "supports validate gating for %s category",
    (action) => {
      expect(
        isValidateBrandEnabled(
          baseInput({
            action,
            targetCount: 2,
          }),
        ),
      ).toBe(true);
      expect(
        isValidateBrandEnabled(
          baseInput({
            action,
            targetCount: 2,
            appliedByAction: { [action]: DEFAULT_BRAND_CONFIG },
          }),
        ),
      ).toBe(false);
    },
  );
});

describe("isApplyBrandEnabled", () => {
  it("requires validate to finish for saved config", () => {
    expect(isApplyBrandEnabled(baseInput())).toBe(false);
    expect(
      isApplyBrandEnabled(
        baseInput({
          validatedAction: "card",
          validatedConfig: DEFAULT_BRAND_CONFIG,
          brandBulkApplyReady: true,
        }),
      ),
    ).toBe(true);
  });

  it("stays disabled for another category after validating a different one", () => {
    expect(
      isApplyBrandEnabled(
        baseInput({
          action: "button",
          validatedAction: "text",
          validatedConfig: DEFAULT_BRAND_CONFIG,
          brandBulkApplyReady: true,
        }),
      ),
    ).toBe(false);
  });

  it.each(BRAND_APPLY_ACTIONS.filter((action) => action !== "badge"))(
    "enables apply only for validated %s category",
    (action) => {
      expect(
        isApplyBrandEnabled(
          baseInput({
            action,
            validatedAction: action,
            validatedConfig: DEFAULT_BRAND_CONFIG,
            brandBulkApplyReady: true,
          }),
        ),
      ).toBe(true);
    },
  );
});

describe("button titles", () => {
  it("explains save-first for validate", () => {
    expect(validateBrandButtonTitle(baseInput({ dirty: true }))).toContain("Save Brand");
  });

  it("explains when brand is already applied on page", () => {
    expect(
      validateBrandButtonTitle(
        baseInput({
          action: "text",
          appliedByAction: { text: DEFAULT_BRAND_CONFIG },
        }),
      ),
    ).toContain("already applied");
  });

  it("explains validate-first for apply", () => {
    expect(applyBrandButtonTitle(baseInput())).toContain("Validate first");
  });
});

describe("formatApplyBrandSectionLead", () => {
  it("describes host count on page", () => {
    expect(formatApplyBrandSectionLead("button", 2)).toContain("2 buttons");
  });
});
