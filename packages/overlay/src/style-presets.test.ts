import { describe, expect, it } from "vitest";
import { EMPTY_ALPHA_PICKS } from "./alpha-patch-ops.js";
import { applyStylePresetToPicks, presetsForContext } from "./style-presets.js";

describe("style-presets", () => {
  it("maps card preset without dropping unrelated picks", () => {
    const base = { ...EMPTY_ALPHA_PICKS, gap: "gap-4", opacity: "opacity-90" };
    const next = applyStylePresetToPicks(base, "p-4 gap-2 rounded-xl shadow-md border");
    expect(next.padding).toBe("p-4");
    expect(next.gap).toBe("gap-2");
    expect(next.rounded).toBe("rounded-xl");
    expect(next.opacity).toBe("opacity-90");
  });

  it("filters presets by context", () => {
    const cardPresets = presetsForContext("card");
    expect(cardPresets.every((p) => p.context === "card" || p.context === "any")).toBe(true);
    expect(cardPresets.some((p) => p.id === "elevated")).toBe(true);
    expect(cardPresets.some((p) => p.id === "soft-cta")).toBe(false);
  });
});
