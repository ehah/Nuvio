import { describe, expect, it } from "vitest";
import type { IndexWireEntry } from "@nuvio/shared";
import {
  formatFriendlyId,
  formatSelectionTitle,
  getSimpleBlockedEditFallback,
  getSimpleSelectionStatus,
  getSimpleDuplicateWarning,
  isDuplicateIndexedId,
  mapUnsupportedReasonToSimple,
} from "./selection-summary.js";

describe("formatFriendlyId", () => {
  it("title-cases last segments", () => {
    expect(formatFriendlyId("metric.orders.card")).toBe("Orders Card");
    expect(formatFriendlyId("metric.orders.card.copy")).toBe("Card Copy");
  });

  it("uses text preview for titles", () => {
    expect(
      formatFriendlyId("orders.title", {
        id: "orders.title",
        file: "a.tsx",
        line: 1,
        column: 1,
        textTargets: [
          {
            key: "self",
            label: "title",
            file: "a.tsx",
            line: 1,
            column: 1,
            tagName: "h3",
            textEditable: true,
            textPreview: "Recent Orders",
            patchHostId: "orders.title",
          },
        ],
      }),
    ).toBe("Recent Orders");
  });
});

describe("getSimpleSelectionStatus", () => {
  const base: IndexWireEntry = {
    id: "x",
    file: "a.tsx",
    line: 1,
    column: 1,
  };

  it("reports full edit when text and class are ok", () => {
    const s = getSimpleSelectionStatus({
      ...base,
      textEditable: true,
      hasLiteralClassName: true,
      riskLevel: "safe",
    });
    expect(s.message).toContain("text and styles");
    expect(s.tone).toBe("success");
  });

  it("guides container text edits", () => {
    const s = getSimpleSelectionStatus({
      ...base,
      textEditable: false,
      hasLiteralClassName: true,
    });
    expect(s.message).toContain("headline");
  });
});

describe("getSimpleDuplicateWarning", () => {
  it("detects duplicate ids for patch guard", () => {
    expect(
      isDuplicateIndexedId("metric.orders.value", [
        { id: "metric.orders.value", occurrences: [{ file: "a.tsx", line: 1, column: 1 }] },
      ]),
    ).toBe(true);
    expect(isDuplicateIndexedId("metric.orders.card", [])).toBe(false);
  });

  it("returns null when no duplicates", () => {
    expect(getSimpleDuplicateWarning([])).toBeNull();
  });

  it("mentions friendly names", () => {
    const msg = getSimpleDuplicateWarning([
      { id: "metric.orders.value", occurrences: [{ file: "a.tsx", line: 1, column: 1 }] },
    ]);
    expect(msg).toContain("Card Value");
  });
});

describe("mapUnsupportedReasonToSimple", () => {
  it("maps className literal errors to plain copy", () => {
    const msg = mapUnsupportedReasonToSimple(
      "className is not a string literal — only literal className strings are patchable in this version.",
    );
    expect(msg).toContain("dynamic className");
  });

  it("maps map() risk to plain copy", () => {
    const msg = mapUnsupportedReasonToSimple(
      "Element is inside a .map() — text/class changes may affect every rendered item.",
    );
    expect(msg).toContain("repeated list");
  });
});

describe("getSimpleBlockedEditFallback", () => {
  it("uses text copy for label and cell ids", () => {
    expect(getSimpleBlockedEditFallback("orders.row.1.nameText", null)).toBe(
      "Nuvio can't safely edit this text yet.",
    );
    expect(getSimpleBlockedEditFallback("metric.orders.label", null)).toBe(
      "Nuvio can't safely edit this text yet.",
    );
  });

  it("uses element copy for containers", () => {
    expect(
      getSimpleBlockedEditFallback("orders.section", {
        id: "orders.section",
        file: "a.tsx",
        line: 1,
        column: 1,
        textEditable: false,
      }),
    ).toBe("Nuvio can't safely edit this element.");
  });
});

describe("formatSelectionTitle", () => {
  it("uses stable card labels instead of preview text", () => {
    const entries: IndexWireEntry[] = [
      {
        id: "metric.orders.label",
        file: "x.tsx",
        line: 1,
        column: 1,
        textEditable: true,
        textTargets: [
          {
            key: "l",
            label: "l",
            file: "x",
            line: 1,
            column: 1,
            tagName: "span",
            textPreview: "Orders101",
            textEditable: true,
            nuvioId: "metric.orders.label",
            patchHostId: "metric.orders.label",
          },
        ],
      },
      { id: "metric.orders.card", file: "x.tsx", line: 1, column: 1, textEditable: false },
    ];
    expect(formatSelectionTitle("metric.orders.label", entries[0], entries)).toBe("Card Label");
    expect(formatSelectionTitle("metric.orders.card", entries[1], entries)).toBe("Orders Card");
  });

  it("uses field-based titles for table cells", () => {
    const entry: IndexWireEntry = {
      id: "orders.row.1.nameText",
      file: "x.tsx",
      line: 1,
      column: 1,
      textEditable: true,
    };
    expect(formatSelectionTitle("orders.row.1.nameText", entry, [])).toBe("Product Name");
    expect(formatSelectionTitle("orders.row.1.price", entry, [])).toBe("Product Price");
  });

  it("uses specific column header titles", () => {
    const entry: IndexWireEntry = {
      id: "orders.header.products",
      file: "x.tsx",
      line: 1,
      column: 1,
      textTargets: [
        {
          key: "h",
          label: "h",
          file: "x",
          line: 1,
          column: 1,
          tagName: "th",
          textEditable: true,
          textPreview: "Products",
          nuvioId: "orders.header.products",
          patchHostId: "orders.header.products",
        },
      ],
    };
    expect(formatSelectionTitle("orders.header.products", entry, [])).toBe("Products Header");
  });
});
