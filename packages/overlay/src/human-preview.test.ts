import { describe, expect, it } from "vitest";
import { EMPTY_ALPHA_PICKS } from "./alpha-patch-ops.js";
import { buildHumanPreviewLines, formatHumanPreviewBlock } from "./human-preview.js";

describe("buildHumanPreviewLines", () => {
  it("maps text and padding without raw utilities", () => {
    const lines = buildHumanPreviewLines({
      baselineText: "Orders",
      draftText: "Sales",
      baselinePicks: { ...EMPTY_ALPHA_PICKS, padding: "p-4", bgColor: "bg-white" },
      draftPicks: { ...EMPTY_ALPHA_PICKS, padding: "p-6", bgColor: "bg-blue-500" },
    });
    expect(lines).toContainEqual({
      label: "Text",
      before: "Orders",
      after: "Sales",
    });
    expect(lines).toContainEqual({
      label: "Padding",
      before: "16px",
      after: "24px",
    });
    expect(lines).toContainEqual({
      label: "Background",
      before: "white",
      after: "blue",
    });
    const block = formatHumanPreviewBlock(lines);
    expect(block).not.toContain("p-4");
    expect(block).not.toContain("bg-blue-500");
  });

  it("uses generic fallback for unmapped utilities", () => {
    const lines = buildHumanPreviewLines({
      baselineText: "",
      draftText: "",
      baselinePicks: { ...EMPTY_ALPHA_PICKS, bgColor: "bg-brand-500" },
      draftPicks: { ...EMPTY_ALPHA_PICKS, bgColor: "bg-brand-600" },
    });
    expect(lines[0]?.before).toBe("previous");
    expect(lines[0]?.after).toBe("updated");
    expect(formatHumanPreviewBlock(lines)).not.toContain("bg-brand");
  });
});
