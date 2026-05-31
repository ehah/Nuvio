import { describe, expect, it, beforeEach } from "vitest";
import type { IndexWireEntry } from "@nuvio/shared";
import { pickContextualGuide, shouldShowWelcome } from "./selection-guides.js";
import { resetOnboardingForTests } from "./onboarding-storage.js";

const baseEntry: IndexWireEntry = {
  id: "metric.orders.value",
  file: "a.tsx",
  line: 1,
  column: 1,
  textEditable: true,
  hasLiteralClassName: true,
};

describe("shouldShowWelcome", () => {
  it("shows when welcome not dismissed and simple mode", () => {
    expect(shouldShowWelcome({ developerDetails: false, dismissed: new Set() })).toBe(true);
    expect(
      shouldShowWelcome({ developerDetails: false, dismissed: new Set(["welcome"]) }),
    ).toBe(false);
    expect(shouldShowWelcome({ developerDetails: true, dismissed: new Set() })).toBe(false);
  });
});

describe("pickContextualGuide", () => {
  beforeEach(() => {
    resetOnboardingForTests();
  });

  it("returns first-selection on first resolved select", () => {
    expect(
      pickContextualGuide({
        developerDetails: false,
        selectedId: "metric.orders.value",
        selectedEntry: baseEntry,
        selectionResolved: true,
        dismissed: new Set(),
        containerGuidanceVisible: false,
      }),
    ).toBe("first-selection");
  });

  it("prefers table-parts at table root menu only", () => {
    const entry: IndexWireEntry = {
      ...baseEntry,
      id: "orders.table",
      hierarchyRole: "table",
      textEditable: false,
    };
    expect(
      pickContextualGuide({
        developerDetails: false,
        selectedId: "orders.table",
        selectedEntry: entry,
        selectionResolved: true,
        dismissed: new Set(),
        containerGuidanceVisible: true,
        tableAtRootMenu: true,
      }),
    ).toBe("table-parts");
    expect(
      pickContextualGuide({
        developerDetails: false,
        selectedId: "orders.row.1.nameText",
        selectedEntry: { ...entry, id: "orders.row.1.nameText", textEditable: true },
        selectionResolved: true,
        dismissed: new Set(["first-selection"]),
        containerGuidanceVisible: false,
        taskRouterShowControls: true,
      }),
    ).toBeNull();
  });

  it("shows button-spacing for filter buttons", () => {
    const entry: IndexWireEntry = {
      ...baseEntry,
      id: "orders.filter",
      tagName: "button",
      textEditable: true,
    };
    expect(
      pickContextualGuide({
        developerDetails: false,
        selectedId: "orders.filter",
        selectedEntry: entry,
        selectionResolved: true,
        dismissed: new Set(["first-selection", "table-parts", "layout-row", "chart-polish"]),
        containerGuidanceVisible: false,
      }),
    ).toBe("button-spacing");
  });
});
